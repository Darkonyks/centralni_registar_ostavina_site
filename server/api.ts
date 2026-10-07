import { ADMIN_GENERIC_ERROR } from '../shared/admin.ts';
import { ADMIN_API_PREFIX, ADMIN_LOGIN_RATE_LIMIT, createAdminHandler } from './admin.ts';
import type { ApiConfig } from './config.ts';
import { createContactHandlerFromConfig } from './contact.ts';
import { COOKIE_CONSENT_RATE_LIMIT, createCookieConsentHandler } from './cookieConsent.ts';
import { openDatabase, type Database } from './db.ts';
import { sendJson, type RequestHandler } from './http.ts';
import type { Logger } from './logger.ts';
import { createRateLimiter } from './rateLimit.ts';
import { createStore } from './store.ts';

export const CONTACT_API_PATH = '/api/contact';
export const COOKIE_CONSENT_API_PATH = '/api/cookie-consent';

export interface ApiHandlers {
  contact: RequestHandler;
  cookieConsent: RequestHandler;
  admin: RequestHandler;
}

export function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

/** Rutiranje svih `/api/*` zahteva. */
export function createApiHandler(handlers: ApiHandlers): RequestHandler {
  return async (req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (pathname === CONTACT_API_PATH) return handlers.contact(req, res);
    if (pathname === COOKIE_CONSENT_API_PATH) return handlers.cookieConsent(req, res);
    if (pathname === ADMIN_API_PREFIX || pathname.startsWith(`${ADMIN_API_PREFIX}/`)) {
      return handlers.admin(req, res);
    }
    sendJson(res, 404, { success: false, message: ADMIN_GENERIC_ERROR });
  };
}

/**
 * API sa stvarnim zavisnostima (SQLite baza, Cloudflare, SMTP) iz konfiguracije.
 * Ako baza ne može da se otvori, sajt i dalje radi, a API vraća 503.
 */
export function createApiFromConfig(
  config: ApiConfig,
  logger: Logger,
): { handler: RequestHandler; db: Database | null } {
  let db: Database;
  try {
    db = openDatabase(config.databasePath);
  } catch (error) {
    logger.error('db.open_failed', { name: error instanceof Error ? error.name : 'unknown' });
    const unavailable: RequestHandler = async (_req, res) => {
      sendJson(res, 503, { success: false, message: ADMIN_GENERIC_ERROR });
    };
    return { handler: unavailable, db: null };
  }

  const store = createStore(db);
  if (config.admin.missing.length > 0) {
    logger.warn('admin.not_configured', { missing: config.admin.missing });
  }

  const handler = createApiHandler({
    contact: createContactHandlerFromConfig(config.contact, store.contacts, logger),
    cookieConsent: createCookieConsentHandler({
      consents: store.cookieConsents,
      rateLimiter: createRateLimiter(COOKIE_CONSENT_RATE_LIMIT),
      logger,
      clientIpHeader: config.clientIpHeader,
    }),
    admin: createAdminHandler({
      store,
      admin: config.admin,
      loginRateLimiter: createRateLimiter(ADMIN_LOGIN_RATE_LIMIT),
      logger,
      clientIpHeader: config.clientIpHeader,
    }),
  });
  return { handler, db };
}
