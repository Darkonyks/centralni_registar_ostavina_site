import { TURNSTILE_ACTION } from '../shared/contact.ts';

export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  success: boolean;
  /** Cloudflare kodovi grešaka (npr. `invalid-input-response`) ili naši (`network-error`). */
  errorCodes: string[];
}

interface SiteverifyResponse {
  success?: unknown;
  'error-codes'?: unknown;
  action?: unknown;
}

/**
 * Proverava Turnstile token kod Cloudflare-a (server-to-server).
 * Token dobijen u browser-u sam po sebi ne dokazuje ništa; važi samo odgovor ovog poziva.
 * Token je jednokratan: posle provere browser mora da zatraži novi.
 */
export async function verifyTurnstileToken(options: {
  token: string;
  secret: string;
  remoteIp?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<TurnstileResult> {
  const { token, secret, remoteIp, fetchImpl = fetch, timeoutMs = 5000 } = options;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  let data: SiteverifyResponse;
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return { success: false, errorCodes: [`http-${response.status}`] };
    data = (await response.json()) as SiteverifyResponse;
  } catch {
    return { success: false, errorCodes: ['network-error'] };
  }

  const errorCodes = Array.isArray(data['error-codes'])
    ? data['error-codes'].filter((code): code is string => typeof code === 'string')
    : [];

  if (data.success !== true) return { success: false, errorCodes };

  // Token izdat za drugu akciju (drugi widget) ne važi za kontakt formu.
  if (typeof data.action === 'string' && data.action !== '' && data.action !== TURNSTILE_ACTION) {
    return { success: false, errorCodes: ['action-mismatch'] };
  }

  return { success: true, errorCodes };
}
