import type {
  ContactFieldErrors,
  ContactRequestBody,
  ContactResponseBody,
} from '../../shared/contact';

export const CONTACT_ENDPOINT = '/api/contact';

export type SubmitResult = { ok: true } | { ok: false; fieldErrors?: ContactFieldErrors };

/** Šalje upit serveru. Svaki neuspeh (mreža, status, neočekivan odgovor) vraća `ok: false`. */
export async function submitContact(body: ContactRequestBody): Promise<SubmitResult> {
  try {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await response.json().catch(() => null)) as ContactResponseBody | null;

    if (response.ok && data?.success === true) return { ok: true };
    if (data && data.success === false && data.fieldErrors) {
      return { ok: false, fieldErrors: data.fieldErrors };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
