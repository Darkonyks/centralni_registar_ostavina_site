/**
 * Saglasnosti: politika privatnosti (kontakt forma) i kolačići. Zajedničko za browser i server.
 *
 * Pri svakoj suštinskoj izmeni teksta politike privatnosti (src/data/privacy.ts) povećati
 * PRIVACY_POLICY_VERSION: novi upiti beleže novu verziju, a baner za kolačiće se prikazuje ponovo.
 */

/** Verzija (datum) politike privatnosti, uključujući deo o kolačićima. */
export const PRIVACY_POLICY_VERSION = '2026-10-08';

/** Polje u JSON telu kontakt forme: korisnik je označio saglasnost sa politikom privatnosti. */
export const PRIVACY_CONSENT_FIELD = 'privacyConsent';
/** Polje u JSON telu kontakt forme: verzija politike koju je korisnik video. */
export const PRIVACY_VERSION_FIELD = 'privacyPolicyVersion';

export const PRIVACY_CONSENT_REQUIRED_MESSAGE =
  'Za slanje upita potrebno je da prihvatite politiku privatnosti.';
export const PRIVACY_VERSION_CHANGED_MESSAGE =
  'Politika privatnosti je u međuvremenu izmenjena. Osvežite stranicu, pročitajte je i pošaljite upit ponovo.';

/** Id elementa sa tekstom politike (za linkove iz footer-a i banera). */
export const PRIVACY_POLICY_ANCHOR = 'politika-privatnosti';

// ── Kolačići ────────────────────────────────────────────────────────────────

export const COOKIE_DECISIONS = ['all', 'necessary'] as const;
export type CookieDecision = (typeof COOKIE_DECISIONS)[number];

export const COOKIE_CATEGORIES: Record<CookieDecision, readonly string[]> = {
  all: ['necessary', 'analytics'],
  necessary: ['necessary'],
};

/** Kolačić sa izborom posetioca (neophodan; čita ga i browser da ne prikazuje baner ponovo). */
export const COOKIE_CONSENT_COOKIE = 'crs_cookie_consent';
/** Trajanje izbora: 180 dana. */
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export interface CookieConsentValue {
  decision: CookieDecision;
  version: string;
  id: string;
}

export function isCookieDecision(value: unknown): value is CookieDecision {
  return typeof value === 'string' && (COOKIE_DECISIONS as readonly string[]).includes(value);
}

/** Vrednost kolačića: `<izbor>.<verzija>.<id>`. */
export function serializeCookieConsent(value: CookieConsentValue): string {
  return `${value.decision}.${value.version}.${value.id}`;
}

export function parseCookieConsent(raw: string | undefined | null): CookieConsentValue | null {
  if (!raw) return null;
  const [decision, version, id, ...rest] = raw.split('.');
  if (rest.length > 0 || !isCookieDecision(decision) || !version || !id) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(version) || !/^[0-9a-f-]{36}$/.test(id)) return null;
  return { decision, version, id };
}

/** JSON telo `POST /api/cookie-consent`. */
export interface CookieConsentRequestBody {
  decision: CookieDecision;
}
