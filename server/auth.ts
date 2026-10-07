/**
 * Administratorska prijava: lozinka (scrypt heš iz env promenljive) i sesije u bazi.
 *
 * Format heša (bez znaka `$`, da ga ne tumače shell/Docker/Coolify):
 *   scrypt:<N>:<r>:<p>:<so base64url>:<heš base64url>
 * Heš se pravi komandom `npm run admin:hash-password`.
 */
import { createHash, randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

export const ADMIN_SESSION_COOKIE = 'crs_admin_session';
/** Cookie važi samo za administratorski API. */
export const ADMIN_SESSION_PATH = '/api/admin';
/** Sesija traje 8 sati od prijave. */
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const SCRYPT = { N: 32768, r: 8, p: 1, keyLength: 64 };
const MAX_MEMORY = 128 * 1024 * 1024;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keyLength, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: MAX_MEMORY,
  });
  return [
    'scrypt',
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join(':');
}

interface ParsedHash {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
}

export function parsePasswordHash(stored: string): ParsedHash | null {
  const [scheme, n, r, p, salt, hash, ...rest] = stored.split(':');
  if (scheme !== 'scrypt' || rest.length > 0 || !salt || !hash) return null;
  const parsed = { N: Number(n), r: Number(r), p: Number(p) };
  if (![parsed.N, parsed.r, parsed.p].every((v) => Number.isInteger(v) && v > 0)) return null;
  // scrypt zauzima ~128 · N · r bajtova; veće vrednosti se odbijaju umesto da obore server.
  if (128 * parsed.N * parsed.r > MAX_MEMORY || parsed.p > 16) return null;
  const hashBuffer = Buffer.from(hash, 'base64url');
  if (hashBuffer.length < 32) return null;
  return { ...parsed, salt: Buffer.from(salt, 'base64url'), hash: hashBuffer };
}

/** Poređenje u konstantnom vremenu (bez blokiranja servera); neispravan heš = neuspešna prijava. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parsePasswordHash(stored);
  if (!parsed) return false;
  const candidate = await scryptAsync(password, parsed.salt, parsed.hash.length, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: MAX_MEMORY,
  });
  return timingSafeEqual(candidate, parsed.hash);
}

/** Korisničko ime se poredi u konstantnom vremenu (preko SHA-256, da dužina ne bude bitna). */
export function safeEqualText(a: string, b: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/** Nasumičan token za cookie; u bazi se čuva samo njegov SHA-256 heš. */
export function createSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashSessionToken(token) };
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}
