import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  COOKIE_CATEGORIES,
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  isCookieDecision,
  PRIVACY_POLICY_VERSION,
  serializeCookieConsent,
} from '../shared/consent.ts';
import { anonymizeIp, serializeCookie } from './cookies.ts';
import { getClientIp, HttpError, readJsonBody, sendJson, type RequestHandler } from './http.ts';
import type { Logger } from './logger.ts';
import type { RateLimiter } from './rateLimit.ts';
import type { Store } from './store.ts';

export const COOKIE_CONSENT_ERROR = 'Izbor trenutno nije moguće sačuvati.';
/** Najviše 20 izbora sa iste IP adrese u 10 minuta. */
export const COOKIE_CONSENT_RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
const MAX_BODY_BYTES = 1024;
const USER_AGENT_MAX_LENGTH = 300;

export interface CookieConsentDeps {
  consents: Pick<Store['cookieConsents'], 'insert'>;
  rateLimiter: RateLimiter;
  logger: Logger;
  clientIpHeader?: string;
  now?: () => Date;
  createId?: () => string;
}

function fail(res: ServerResponse, status: number, headers: Record<string, string> = {}): void {
  sendJson(res, status, { success: false, message: COOKIE_CONSENT_ERROR }, headers);
}

/**
 * `POST /api/cookie-consent` `{ "decision": "all" | "necessary" }`.
 * Upisuje osnovne podatke o izboru (id, vreme, izbor, kategorije, verzija politike,
 * skraćena IP adresa, tip browser-a) i postavlja kolačić sa izborom.
 */
export function createCookieConsentHandler(deps: CookieConsentDeps): RequestHandler {
  const { logger, now = () => new Date(), createId = randomUUID } = deps;

  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.method !== 'POST') {
        fail(res, 405, { Allow: 'POST' });
        return;
      }

      const ip = getClientIp(req, deps.clientIpHeader);
      if (!deps.rateLimiter.hit(ip)) {
        logger.warn('cookie_consent.rejected', { reason: 'rate_limited' });
        fail(res, 429, { 'Retry-After': '600' });
        return;
      }

      if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
        fail(res, 415);
        return;
      }

      const body = await readJsonBody(req, MAX_BODY_BYTES);
      const decision = (body as { decision?: unknown } | null)?.decision;
      if (!isCookieDecision(decision)) {
        logger.warn('cookie_consent.rejected', { reason: 'invalid_decision' });
        fail(res, 400);
        return;
      }

      const id = createId();
      deps.consents.insert({
        id,
        createdAt: now(),
        decision,
        categories: COOKIE_CATEGORIES[decision],
        policyVersion: PRIVACY_POLICY_VERSION,
        ipAnonymized: anonymizeIp(ip),
        userAgent: String(req.headers['user-agent'] ?? '').slice(0, USER_AGENT_MAX_LENGTH),
      });

      const cookie = serializeCookie(
        COOKIE_CONSENT_COOKIE,
        serializeCookieConsent({ decision, version: PRIVACY_POLICY_VERSION, id }),
        {
          path: '/',
          maxAgeSeconds: COOKIE_CONSENT_MAX_AGE_SECONDS,
          sameSite: 'Lax',
          // Browser čita izbor da ne bi ponovo prikazao baner; vrednost nije tajna.
          httpOnly: false,
        },
      );
      logger.info('cookie_consent.saved', { decision });
      sendJson(res, 200, { success: true, decision }, { 'Set-Cookie': cookie });
    } catch (error) {
      if (error instanceof HttpError) {
        fail(res, error.status);
        return;
      }
      logger.error('cookie_consent.error', {
        name: error instanceof Error ? error.name : 'unknown',
      });
      if (!res.headersSent) fail(res, 500);
    }
  };
}
