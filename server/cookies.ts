import type { IncomingMessage } from 'node:http';
import { isIPv4, isIPv6 } from 'node:net';

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    try {
      result[name] = decodeURIComponent(raw);
    } catch {
      result[name] = raw;
    }
  }
  return result;
}

export interface CookieOptions {
  maxAgeSeconds: number;
  path: string;
  httpOnly: boolean;
  sameSite: 'Strict' | 'Lax';
}

/** Kolačići se uvek šalju sa `Secure` (browser-i ga dozvoljavaju i za http://localhost). */
export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAgeSeconds}`,
    `SameSite=${options.sameSite}`,
    'Secure',
  ];
  if (options.httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}

/**
 * Skraćena IP adresa za evidenciju saglasnosti (ne identifikuje uređaj):
 * IPv4 bez poslednjeg okteta (203.0.113.0), IPv6 samo prva tri bloka (2001:db8:1::).
 */
export function anonymizeIp(ip: string): string {
  const mapped = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (isIPv4(mapped)) return mapped.replace(/\.\d+$/, '.0');
  if (isIPv6(mapped)) {
    const [head = ''] = mapped.split('::');
    const blocks = head.split(':').filter(Boolean).slice(0, 3);
    return `${blocks.join(':')}::`;
  }
  return 'nepoznata';
}
