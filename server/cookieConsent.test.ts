import type { Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { parseCookieConsent, PRIVACY_POLICY_VERSION } from '../shared/consent.ts';
import { createCookieConsentHandler } from './cookieConsent.ts';
import { anonymizeIp } from './cookies.ts';
import { createRateLimiter } from './rateLimit.ts';
import { createStore } from './store.ts';
import { close, createTestLogger, listen, openTestDatabase } from './testUtils.ts';

const ID = '00000000-0000-4000-8000-000000000001';
let server: Server | undefined;

afterEach(async () => {
  if (server) await close(server);
  server = undefined;
});

async function setup(options: { max?: number; clientIpHeader?: string } = {}) {
  const store = createStore(openTestDatabase());
  const { logger } = createTestLogger();
  let counter = 0;
  const started = await listen(
    createCookieConsentHandler({
      consents: store.cookieConsents,
      rateLimiter: createRateLimiter({ max: options.max ?? 100, windowMs: 60_000 }),
      logger,
      clientIpHeader: options.clientIpHeader,
      now: () => new Date('2026-10-01T10:00:00Z'),
      createId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    }),
  );
  server = started.server;
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${started.url}/api/cookie-consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'TestBrowser/1.0', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  const records = () => store.cookieConsents.list({ page: 1, pageSize: 25 });
  return { post, records, url: started.url };
}

describe('POST /api/cookie-consent', () => {
  it.each([
    ['all', ['necessary', 'analytics']],
    ['necessary', ['necessary']],
  ] as const)('izbor „%s“ se čuva u bazi i postavlja kolačić', async (decision, categories) => {
    const { post, records } = await setup({ clientIpHeader: 'cf-connecting-ip' });

    const response = await post({ decision }, { 'CF-Connecting-IP': '203.0.113.77' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, decision });
    expect(records().items).toEqual([
      {
        id: ID,
        createdAt: '2026-10-01T10:00:00.000Z',
        decision,
        categories,
        policyVersion: PRIVACY_POLICY_VERSION,
        ipAnonymized: '203.0.113.0',
        userAgent: 'TestBrowser/1.0',
      },
    ]);

    const cookie = response.headers.get('set-cookie') ?? '';
    const [pair, ...attributes] = cookie.split('; ');
    expect(pair?.startsWith('crs_cookie_consent=')).toBe(true);
    expect(parseCookieConsent(decodeURIComponent(pair!.split('=')[1]!))).toEqual({
      decision,
      version: PRIVACY_POLICY_VERSION,
      id: ID,
    });
    expect(attributes).toEqual(
      expect.arrayContaining(['Path=/', 'Max-Age=15552000', 'SameSite=Lax', 'Secure']),
    );
    expect(attributes).not.toContain('HttpOnly');
  });

  it('odbija nepoznat izbor, pogrešan format i druge metode', async () => {
    const { post, records, url } = await setup();

    expect((await post({ decision: 'granted' })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect((await post('decision=all', { 'Content-Type': 'text/plain' })).status).toBe(415);
    expect((await post('{bad json')).status).toBe(400);
    expect((await post({ decision: 'all', pad: 'x'.repeat(2000) })).status).toBe(413);
    expect((await fetch(`${url}/api/cookie-consent`)).status).toBe(405);
    expect(records().total).toBe(0);
  });

  it('rate limit sprečava punjenje baze', async () => {
    const { post, records } = await setup({ max: 2 });

    expect((await post({ decision: 'all' })).status).toBe(200);
    expect((await post({ decision: 'necessary' })).status).toBe(200);
    const limited = await post({ decision: 'necessary' });

    expect(limited.status).toBe(429);
    expect(limited.headers.get('set-cookie')).toBeNull();
    expect(records().total).toBe(2);
  });
});

describe('anonymizeIp', () => {
  it.each([
    ['203.0.113.77', '203.0.113.0'],
    ['::ffff:198.51.100.9', '198.51.100.0'],
    ['2001:db8:85a3:8d3:1319:8a2e:370:7348', '2001:db8:85a3::'],
    ['2001:db8::1', '2001:db8::'],
    ['::1', '::'],
    ['nije-ip', 'nepoznata'],
  ])('%s → %s', (ip, expected) => expect(anonymizeIp(ip)).toBe(expected));
});
