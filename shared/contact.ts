/**
 * Pravila kontakt forme, zajednička za browser i server.
 *
 * Frontend ih koristi za poruke uz polja (UX), a server za autoritativnu proveru:
 * zahtev koji ne prođe `validateContactInput` se odbija, bez obzira na to šta je browser proverio.
 */

import {
  PRIVACY_CONSENT_FIELD,
  PRIVACY_CONSENT_REQUIRED_MESSAGE,
  PRIVACY_POLICY_VERSION,
  PRIVACY_VERSION_CHANGED_MESSAGE,
  PRIVACY_VERSION_FIELD,
} from './consent.ts';
import { formatThousands } from './format.ts';

export const CONTACT_FIELDS = ['name', 'office', 'email', 'phone', 'message'] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export type ContactData = Record<ContactField, string>;
/** Greške po poljima; `privacyConsent` je polje za saglasnost sa politikom privatnosti. */
export type ContactFieldErrors = Partial<
  Record<ContactField | typeof PRIVACY_CONSENT_FIELD, string>
>;

export const CONTACT_MAX_LENGTH: Record<ContactField, number> = {
  name: 150,
  office: 200,
  email: 254,
  phone: 50,
  message: 5000,
};

/** Turnstile `action`; widget ga šalje, server proverava da odgovara. */
export const TURNSTILE_ACTION = 'contact';

/** Cloudflare dokumentacija: token nije duži od 2048 znakova. */
export const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

/** Skriveno polje za botove; stvaran korisnik ga ne vidi i ne popunjava. */
export const HONEYPOT_FIELD = 'website';

export const CONTACT_ERROR_MESSAGE = 'Poruku trenutno nije moguće poslati.';

const REQUIRED_MESSAGES: Record<ContactField, string> = {
  name: 'Unesite ime i prezime.',
  office: 'Unesite naziv kancelarije.',
  email: 'Unesite email adresu.',
  phone: 'Unesite broj telefona.',
  message: 'Unesite poruku.',
};

// Lokalni deo: dozvoljeni znakovi iz RFC 5322 (bez navodnika i razmaka).
// Domen: bar dva dela razdvojena tačkom; slova mogu biti i van ASCII (npr. IDN domeni).
const EMAIL_PATTERN =
  /^[\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-]+@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+[\p{L}]{2,}$/u;

// Telefon: cifre, razmaci, +, crte, zagrade, tačke i kose crte; bez jednog obaveznog formata.
const PHONE_PATTERN = /^[\d\s+()./-]+$/;
const PHONE_MIN_DIGITS = 6;

// eslint-disable-next-line no-control-regex -- namerno: uklanjanje kontrolnih znakova
const CONTROL_CHARS = /[\u0000-\u001F\u007F]+/g;
// eslint-disable-next-line no-control-regex -- kontrolni znakovi osim tab (U+0009) i novog reda (U+000A)
const CONTROL_CHARS_EXCEPT_TAB_NEWLINE = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

/** Jedan red teksta: kontrolni znakovi i prelomi postaju razmak, višestruki razmaci jedan. */
export function normalizeLine(value: string): string {
  return value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();
}

/** Više redova teksta: jedinstveni prelomi redova, bez kontrolnih znakova (osim novog reda i taba). */
export function normalizeMultiline(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARS_EXCEPT_TAB_NEWLINE, '').trim();
}

export function isValidEmail(value: string): boolean {
  if (!EMAIL_PATTERN.test(value)) return false;
  const local = value.slice(0, value.lastIndexOf('@'));
  return (
    local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..')
  );
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value) && value.replace(/\D/g, '').length >= PHONE_MIN_DIGITS;
}

export function tooLongMessage(max: number): string {
  return `Dozvoljeno je najviše ${formatThousands(max)} znakova.`;
}

export type ContactValidationResult =
  { ok: true; data: ContactData } | { ok: false; errors: ContactFieldErrors };

/**
 * Normalizuje i proverava sva polja. Prima `unknown` jer na serveru dolazi iz JSON-a:
 * polje koje nije string tretira se kao prazno.
 */
export function validateContactInput(input: unknown): ContactValidationResult {
  const source =
    typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const data = {} as ContactData;
  const errors: ContactFieldErrors = {};

  for (const field of CONTACT_FIELDS) {
    const raw = source[field];
    const text = typeof raw === 'string' ? raw : '';
    const value = field === 'message' ? normalizeMultiline(text) : normalizeLine(text);
    data[field] = value;

    if (value.length === 0) {
      errors[field] = REQUIRED_MESSAGES[field];
    } else if (value.length > CONTACT_MAX_LENGTH[field]) {
      errors[field] = tooLongMessage(CONTACT_MAX_LENGTH[field]);
    } else if (field === 'email' && !isValidEmail(value)) {
      errors[field] = 'Unesite ispravnu email adresu.';
    } else if (field === 'phone' && !isValidPhone(value)) {
      errors[field] = 'Unesite ispravan broj telefona.';
    }
  }

  // Bez saglasnosti sa (važećom verzijom) politike privatnosti upit se ne prihvata.
  if (source[PRIVACY_CONSENT_FIELD] !== true) {
    errors[PRIVACY_CONSENT_FIELD] = PRIVACY_CONSENT_REQUIRED_MESSAGE;
  } else if (source[PRIVACY_VERSION_FIELD] !== PRIVACY_POLICY_VERSION) {
    errors[PRIVACY_CONSENT_FIELD] = PRIVACY_VERSION_CHANGED_MESSAGE;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data };
}

/** JSON telo zahteva `POST /api/contact`. */
export interface ContactRequestBody extends ContactData {
  turnstileToken: string;
  [PRIVACY_CONSENT_FIELD]: boolean;
  [PRIVACY_VERSION_FIELD]: string;
  [HONEYPOT_FIELD]?: string;
}

/** JSON odgovor `POST /api/contact`. */
export type ContactResponseBody =
  { success: true } | { success: false; message: string; fieldErrors?: ContactFieldErrors };
