import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  CONTACT_ERROR_MESSAGE,
  HONEYPOT_FIELD,
  TURNSTILE_TOKEN_MAX_LENGTH,
  validateContactInput,
  type ContactFieldErrors,
  type ContactResponseBody,
} from '../shared/contact.ts';
import { PRIVACY_POLICY_VERSION } from '../shared/consent.ts';
import type { ContactConfig } from './config.ts';
import { buildContactEmail, createSmtpSender, type SendMail } from './email.ts';
import { getClientIp, HttpError, readJsonBody, sendJson, type RequestHandler } from './http.ts';
import type { Logger } from './logger.ts';
import { createRateLimiter, type RateLimiter } from './rateLimit.ts';
import type { Store } from './store.ts';
import { verifyTurnstileToken, type TurnstileResult } from './turnstile.ts';

/** Najveća dozvoljena veličina JSON tela; poruka od 5.000 znakova staje i sa ćirilicom/emoji. */
export const CONTACT_MAX_BODY_BYTES = 32 * 1024;

/** Najviše 5 zahteva sa iste IP adrese u 10 minuta. */
export const CONTACT_RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

export interface ContactHandlerDeps {
  verifyTurnstile: (token: string, remoteIp: string) => Promise<TurnstileResult>;
  sendMail: SendMail;
  /** Čuvanje upita u bazi (svaki prihvaćen upit se upisuje pre slanja email-a). */
  contacts: Pick<Store['contacts'], 'insert' | 'setEmailStatus'>;
  rateLimiter: RateLimiter;
  logger: Logger;
  mail: { from: string; to: string };
  clientIpHeader?: string;
  now?: () => Date;
  maxBodyBytes?: number;
}

function fail(
  res: ServerResponse,
  status: number,
  extra: { fieldErrors?: ContactFieldErrors; headers?: Record<string, string> } = {},
): void {
  const body: ContactResponseBody = { success: false, message: CONTACT_ERROR_MESSAGE };
  if (extra.fieldErrors) body.fieldErrors = extra.fieldErrors;
  sendJson(res, status, body, extra.headers);
}

/**
 * `POST /api/contact`: rate limit → veličina i format tela → honeypot → validacija polja
 * (uključujući saglasnost sa politikom privatnosti) → Turnstile provera kod Cloudflare-a →
 * upis u bazu → email obaveštenje.
 *
 * Upit je prihvaćen čim je upisan u bazu: ako email obaveštenje ne uspe, upit ostaje vidljiv u
 * administraciji (status obaveštenja „failed“), a korisnik dobija potvrdu i ne šalje ga ponovo.
 * Korisnik uvek dobija generički odgovor; interni detalji ostaju u serverskom logu, bez sadržaja poruke.
 */
export function createContactHandler(deps: ContactHandlerDeps): RequestHandler {
  const { logger, now = () => new Date(), maxBodyBytes = CONTACT_MAX_BODY_BYTES } = deps;

  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.method !== 'POST') {
        fail(res, 405, { headers: { Allow: 'POST' } });
        return;
      }

      const ip = getClientIp(req, deps.clientIpHeader);
      if (!deps.rateLimiter.hit(ip)) {
        logger.warn('contact.rejected', { reason: 'rate_limited' });
        fail(res, 429, { headers: { 'Retry-After': '600' } });
        return;
      }

      const contentType = req.headers['content-type'] ?? '';
      if (!contentType.toLowerCase().startsWith('application/json')) {
        logger.warn('contact.rejected', { reason: 'unsupported_media_type' });
        fail(res, 415);
        return;
      }

      const body = await readJsonBody(req, maxBodyBytes);
      const payload =
        typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};

      const honeypot = payload[HONEYPOT_FIELD];
      if (typeof honeypot === 'string' && honeypot.trim() !== '') {
        logger.warn('contact.rejected', { reason: 'honeypot' });
        fail(res, 400);
        return;
      }

      const validation = validateContactInput(payload);
      if (!validation.ok) {
        logger.warn('contact.rejected', {
          reason: 'validation',
          fields: Object.keys(validation.errors),
        });
        fail(res, 400, { fieldErrors: validation.errors });
        return;
      }

      const token = payload.turnstileToken;
      if (typeof token !== 'string' || token === '' || token.length > TURNSTILE_TOKEN_MAX_LENGTH) {
        logger.warn('contact.rejected', { reason: 'turnstile_missing' });
        fail(res, 400);
        return;
      }

      const turnstile = await deps.verifyTurnstile(token, ip);
      if (!turnstile.success) {
        logger.warn('contact.rejected', {
          reason: 'turnstile_failed',
          codes: turnstile.errorCodes,
        });
        fail(res, 403);
        return;
      }

      const receivedAt = now();
      let id: number;
      try {
        id = deps.contacts.insert({
          ...validation.data,
          createdAt: receivedAt,
          privacyConsentAt: receivedAt,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        });
      } catch (error) {
        logger.error('contact.db_error', { name: error instanceof Error ? error.name : 'unknown' });
        fail(res, 500);
        return;
      }

      try {
        await deps.sendMail(
          buildContactEmail(validation.data, {
            ...deps.mail,
            receivedAt,
            id,
            privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          }),
        );
        deps.contacts.setEmailStatus(id, 'sent');
        logger.info('contact.saved', { id, email: 'sent' });
      } catch (error) {
        const code = (error as { code?: unknown }).code;
        logger.error('contact.smtp_error', {
          id,
          code: typeof code === 'string' ? code : 'unknown',
        });
        try {
          deps.contacts.setEmailStatus(id, 'failed');
        } catch {
          // upit je sačuvan; status obaveštenja ostaje „pending“
        }
      }

      sendJson(res, 200, { success: true } satisfies ContactResponseBody);
    } catch (error) {
      if (error instanceof HttpError) {
        logger.warn('contact.rejected', { reason: error.reason });
        fail(res, error.status);
        return;
      }
      logger.error('contact.unexpected_error', {
        name: error instanceof Error ? error.name : 'unknown',
      });
      if (!res.headersSent) fail(res, 500);
    }
  };
}

/** Handler sa stvarnim zavisnostima (Cloudflare, SMTP, baza) iz serverske konfiguracije. */
export function createContactHandlerFromConfig(
  config: ContactConfig,
  contacts: ContactHandlerDeps['contacts'],
  logger: Logger,
): RequestHandler {
  if (config.missing.length > 0) {
    logger.error('contact.not_configured', { missing: config.missing });
    return async (_req, res) => {
      logger.error('contact.not_configured', { missing: config.missing });
      fail(res, 503);
    };
  }

  return createContactHandler({
    verifyTurnstile: (token, remoteIp) =>
      verifyTurnstileToken({ token, secret: config.turnstileSecret, remoteIp }),
    sendMail: createSmtpSender(config.smtp),
    contacts,
    rateLimiter: createRateLimiter(CONTACT_RATE_LIMIT),
    logger,
    mail: { from: config.smtp.fromEmail, to: config.recipient },
    clientIpHeader: config.clientIpHeader,
  });
}
