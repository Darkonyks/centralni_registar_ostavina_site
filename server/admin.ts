import type { IncomingMessage, ServerResponse } from 'node:http';

import { ADMIN_GENERIC_ERROR, ADMIN_LOGIN_ERROR, ADMIN_PAGE_SIZE } from '../shared/admin.ts';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_PATH,
  ADMIN_SESSION_TTL_MS,
  createSessionToken,
  hashSessionToken,
  safeEqualText,
  verifyPassword,
} from './auth.ts';
import type { AdminConfig } from './config.ts';
import { parseCookies, serializeCookie } from './cookies.ts';
import { getClientIp, HttpError, readJsonBody, sendJson, type RequestHandler } from './http.ts';
import type { Logger } from './logger.ts';
import type { RateLimiter } from './rateLimit.ts';
import type { Store } from './store.ts';

export const ADMIN_API_PREFIX = '/api/admin';
/** Najviše 5 pokušaja prijave sa iste IP adrese u 15 minuta. */
export const ADMIN_LOGIN_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };
export const ADMIN_NOT_CONFIGURED = 'Administratorski pristup nije podešen.';
export const ADMIN_UNAUTHORIZED = 'Prijava je istekla ili nije izvršena.';

export interface AdminHandlerDeps {
  store: Pick<Store, 'contacts' | 'cookieConsents' | 'sessions'>;
  admin: AdminConfig;
  loginRateLimiter: RateLimiter;
  logger: Logger;
  clientIpHeader?: string;
  now?: () => Date;
}

const NO_INDEX = { 'X-Robots-Tag': 'noindex, nofollow' };

function reply(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  sendJson(res, status, body, { ...NO_INDEX, ...headers });
}

function fail(res: ServerResponse, status: number, message = ADMIN_GENERIC_ERROR, headers = {}) {
  reply(res, status, { success: false, message }, headers);
}

function sessionCookie(token: string, maxAgeSeconds: number): string {
  return serializeCookie(ADMIN_SESSION_COOKIE, token, {
    path: ADMIN_SESSION_PATH,
    maxAgeSeconds,
    sameSite: 'Strict',
    httpOnly: true,
  });
}

/**
 * Zaštita od CSRF-a za izmene (POST/DELETE): cookie je SameSite=Strict, a dodatno se odbijaju
 * zahtevi čiji Origin ne odgovara adresi sajta ili koje browser označi kao cross-site.
 */
function isCrossSite(req: IncomingMessage): boolean {
  if (req.headers['sec-fetch-site'] === 'cross-site') return true;
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.headers.host;
  } catch {
    return true;
  }
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 1_000_000 ? parsed : fallback;
}

/** `/api/admin/*`: prijava, odjava, sesija, pregled i brisanje upita, pregled saglasnosti za kolačiće. */
export function createAdminHandler(deps: AdminHandlerDeps): RequestHandler {
  const { store, admin, logger, now = () => new Date() } = deps;
  const configured = admin.missing.length === 0;

  const currentUser = (req: IncomingMessage): string | null => {
    const token = parseCookies(req)[ADMIN_SESSION_COOKIE];
    if (!token) return null;
    return store.sessions.find(hashSessionToken(token), now());
  };

  async function login(req: IncomingMessage, res: ServerResponse) {
    if (!configured) {
      logger.error('admin.not_configured', { missing: admin.missing });
      fail(res, 503, ADMIN_NOT_CONFIGURED);
      return;
    }
    if (!deps.loginRateLimiter.hit(getClientIp(req, deps.clientIpHeader))) {
      logger.warn('admin.login_rejected', { reason: 'rate_limited' });
      fail(res, 429, 'Previše pokušaja prijave. Pokušajte ponovo kasnije.', {
        'Retry-After': '900',
      });
      return;
    }
    if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
      fail(res, 415);
      return;
    }

    const body = (await readJsonBody(req, 4096)) as {
      username?: unknown;
      password?: unknown;
    } | null;
    const username = typeof body?.username === 'string' ? body.username.slice(0, 200) : '';
    const password = typeof body?.password === 'string' ? body.password.slice(0, 1024) : '';

    // Obe provere se uvek izvršavaju, da vreme odgovora ne otkriva koje polje je pogrešno.
    const usernameOk = safeEqualText(username, admin.username);
    const passwordOk = await verifyPassword(password, admin.passwordHash);
    if (!usernameOk || !passwordOk) {
      logger.warn('admin.login_failed');
      fail(res, 401, ADMIN_LOGIN_ERROR);
      return;
    }

    const issuedAt = now();
    const { token, tokenHash } = createSessionToken();
    store.sessions.purgeExpired(issuedAt);
    store.sessions.create(
      tokenHash,
      admin.username,
      issuedAt,
      new Date(issuedAt.getTime() + ADMIN_SESSION_TTL_MS),
    );
    logger.info('admin.login');
    reply(
      res,
      200,
      { success: true, username: admin.username },
      { 'Set-Cookie': sessionCookie(token, ADMIN_SESSION_TTL_MS / 1000) },
    );
  }

  function logout(req: IncomingMessage, res: ServerResponse) {
    const token = parseCookies(req)[ADMIN_SESSION_COOKIE];
    if (token) store.sessions.delete(hashSessionToken(token));
    reply(res, 200, { success: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const route = url.pathname.slice(ADMIN_API_PREFIX.length) || '/';
      const method = req.method ?? 'GET';

      if (method !== 'GET' && isCrossSite(req)) {
        logger.warn('admin.rejected', { reason: 'cross_site' });
        fail(res, 403);
        return;
      }

      if (route === '/login' && method === 'POST') return await login(req, res);
      if (route === '/logout' && method === 'POST') return logout(req, res);

      const username = currentUser(req);
      if (!username) {
        fail(res, 401, ADMIN_UNAUTHORIZED);
        return;
      }

      if (route === '/session' && method === 'GET') {
        reply(res, 200, { authenticated: true, username });
        return;
      }

      if (route === '/contacts' && method === 'GET') {
        const query = (url.searchParams.get('q') ?? '').slice(0, 200);
        const page = parsePositiveInt(url.searchParams.get('page'), 1);
        reply(res, 200, store.contacts.list({ page, pageSize: ADMIN_PAGE_SIZE, query }));
        return;
      }

      const contactMatch = /^\/contacts\/(\d+)$/.exec(route);
      if (contactMatch) {
        const id = parsePositiveInt(contactMatch[1] ?? null, 0);
        if (method === 'GET') {
          const contact = id ? store.contacts.get(id) : null;
          if (!contact) fail(res, 404, 'Upit nije pronađen.');
          else reply(res, 200, contact);
          return;
        }
        if (method === 'DELETE') {
          if (!id || !store.contacts.delete(id)) {
            fail(res, 404, 'Upit nije pronađen.');
            return;
          }
          logger.info('admin.contact_deleted', { id });
          reply(res, 200, { success: true });
          return;
        }
      }

      if (route === '/cookie-consents' && method === 'GET') {
        const page = parsePositiveInt(url.searchParams.get('page'), 1);
        reply(res, 200, store.cookieConsents.list({ page, pageSize: ADMIN_PAGE_SIZE }));
        return;
      }

      fail(res, 404);
    } catch (error) {
      if (error instanceof HttpError) {
        fail(res, error.status);
        return;
      }
      logger.error('admin.error', { name: error instanceof Error ? error.name : 'unknown' });
      if (!res.headersSent) fail(res, 500);
    }
  };
}
