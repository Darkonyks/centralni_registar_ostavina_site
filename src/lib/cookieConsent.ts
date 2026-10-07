import {
  COOKIE_CONSENT_COOKIE,
  parseCookieConsent,
  PRIVACY_POLICY_VERSION,
  type CookieConsentValue,
  type CookieDecision,
} from '../../shared/consent';

export const COOKIE_CONSENT_ENDPOINT = '/api/cookie-consent';
/** Izbor je sačuvan (kolačić je promenjen). */
export const COOKIE_CONSENT_CHANGED_EVENT = 'crs:cookie-consent-changed';
/** Ponovno otvaranje obaveštenja o kolačićima (link „Podešavanja kolačića“). */
export const OPEN_COOKIE_SETTINGS_EVENT = 'crs:open-cookie-settings';

/** Sirova vrednost kolačića sa izborom (string, pogodan za useSyncExternalStore). */
export function readConsentCookie(): string | null {
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_CONSENT_COOKIE) {
      try {
        return decodeURIComponent(rest.join('='));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Važeći izbor: postoji i odnosi se na trenutnu verziju politike. */
export function currentConsent(raw: string | null): CookieConsentValue | null {
  const parsed = parseCookieConsent(raw);
  return parsed && parsed.version === PRIVACY_POLICY_VERSION ? parsed : null;
}

/** Šalje izbor serveru, koji ga upisuje u bazu i postavlja kolačić. */
export async function saveCookieConsent(decision: CookieDecision): Promise<boolean> {
  try {
    const response = await fetch(COOKIE_CONSENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ decision }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await response.json().catch(() => null)) as { success?: unknown } | null;
    if (!response.ok || data?.success !== true) return false;
    window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
