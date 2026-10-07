import type { Server } from 'node:http';

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ADMIN_LOGIN_ERROR } from '../shared/admin.ts';
import { createAdminHandler } from './admin.ts';
import { hashPassword, hashSessionToken, parsePasswordHash, verifyPassword } from './auth.ts';
import { loadAdminConfig } from './config.ts';
import { createRateLimiter } from './rateLimit.ts';
import { createStore, type Store } from './store.ts';
import { close, createTestLogger, listen, openTestDatabase } from './testUtils.ts';

const PASSWORD = 'jaka-lozinka-za-test-123';
let PASSWORD_HASH = '';

beforeAll(() => {
  PASSWORD_HASH = hashPassword(PASSWORD);
});

let server: Server | undefined;
afterEach(async () => {
  if (server) await close(server);
  server = undefined;
});

interface SetupOptions {
  env?: Record<string, string>;
  loginMax?: number;
  now?: () => Date;
}

async function setup(options: SetupOptions = {}) {
  const store: Store = createStore(openTestDatabase());
  const { logger, dump } = createTestLogger();
  const admin = loadAdminConfig(
    options.env ?? { ADMIN_USERNAME: 'admin', ADMIN_PASSWORD_HASH: PASSWORD_HASH },
  );
  const started = await listen(
    createAdminHandler({
      store,
      admin,
      loginRateLimiter: createRateLimiter({ max: options.loginMax ?? 100, windowMs: 60_000 }),
      logger,
      now: options.now,
    }),
  );
  server = started.server;
  const base = `${started.url}/api/admin`;
  const host = new URL(started.url).host;

  const request = (path: string, init: RequestInit = {}) =>
    fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });

  const login = (username = 'admin', password = PASSWORD) =>
    request('/login', { method: 'POST', body: JSON.stringify({ username, password }) });

  /** Prijava i vraćanje `Cookie` header-a za naredne zahteve. */
  const authenticate = async () => {
    const response = await login();
    const cookie = (response.headers.get('set-cookie') ?? '').split(';')[0]!;
    return { Cookie: cookie };
  };

  return { store, request, login, authenticate, dump, logger, host };
}

const seedContact = (store: Store, name: string, minute = 0) =>
  store.contacts.insert({
    name,
    office: 'Kancelarija',
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: '064 123 4567',
    message: 'Poruka',
    createdAt: new Date(Date.UTC(2026, 9, 1, 9, minute)),
    privacyConsentAt: new Date(Date.UTC(2026, 9, 1, 9, minute)),
    privacyPolicyVersion: '2026-10-01',
  });

describe('lozinka (scrypt)', () => {
  it('heš ne sadrži lozinku ni znak $, provera radi samo za ispravnu lozinku', async () => {
    expect(PASSWORD_HASH).toMatch(/^scrypt:32768:8:1:[\w-]+:[\w-]+$/);
    expect(PASSWORD_HASH).not.toContain(PASSWORD);
    expect(await verifyPassword(PASSWORD, PASSWORD_HASH)).toBe(true);
    expect(await verifyPassword(`${PASSWORD}x`, PASSWORD_HASH)).toBe(false);
    expect(hashPassword(PASSWORD)).not.toBe(PASSWORD_HASH); // nasumična so
  });

  it('neispravan ili preskup heš se odbija bez rušenja', async () => {
    for (const bad of [
      '',
      'plain-text',
      'scrypt:abc',
      'bcrypt:1:2:3:x:y',
      'scrypt:1048576:32:1:c2FsdA:aGFzaA',
    ]) {
      expect(parsePasswordHash(bad)).toBeNull();
      expect(await verifyPassword(PASSWORD, bad)).toBe(false);
    }
  });
});

describe('prijava', () => {
  it('uspešna prijava postavlja HttpOnly, Secure, SameSite=Strict sesijski kolačić', async () => {
    const { login, store, logger } = await setup();

    const response = await login();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, username: 'admin' });
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^crs_admin_session=[\w-]{43};/);
    expect(cookie).toContain('Path=/api/admin');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Max-Age=28800');

    // U bazi se čuva samo heš tokena.
    const token = cookie.split(';')[0]!.split('=')[1]!;
    expect(store.sessions.find(token, new Date())).toBeNull();
    expect(store.sessions.find(hashSessionToken(token), new Date())).toBe('admin');
    expect(logger.info).toHaveBeenCalledWith('admin.login');
  });

  it('pogrešno korisničko ime ili lozinka: 401 sa istom porukom, lozinka nije u logu', async () => {
    const { login, dump } = await setup();

    for (const [username, password] of [
      ['admin', 'pogresna-lozinka'],
      ['nepostojeci', PASSWORD],
      ['', ''],
    ] as const) {
      const response = await login(username, password);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ success: false, message: ADMIN_LOGIN_ERROR });
      expect(response.headers.get('set-cookie')).toBeNull();
    }
    expect(dump()).not.toMatch(/pogresna-lozinka|jaka-lozinka|nepostojeci/);
  });

  it('rate limit na prijavu (429), i za ispravnu lozinku posle prekoračenja', async () => {
    const { login } = await setup({ loginMax: 2 });

    expect((await login('admin', 'x')).status).toBe(401);
    expect((await login('admin', 'y')).status).toBe(401);
    const limited = await login();

    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('900');
  });

  it('bez ADMIN_USERNAME / ADMIN_PASSWORD_HASH prijava nije moguća (503)', async () => {
    const { login, logger } = await setup({ env: {} });

    const response = await login();

    expect(response.status).toBe(503);
    expect(logger.error).toHaveBeenCalledWith('admin.not_configured', {
      missing: ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH'],
    });
  });

  it('CSRF: prijava sa drugog sajta (Origin / Sec-Fetch-Site) se odbija', async () => {
    const { request } = await setup();
    const body = JSON.stringify({ username: 'admin', password: PASSWORD });

    const foreign = await request('/login', {
      method: 'POST',
      body,
      headers: { Origin: 'https://napadac.example' },
    });
    const crossSite = await request('/login', {
      method: 'POST',
      body,
      headers: { 'Sec-Fetch-Site': 'cross-site' },
    });

    expect(foreign.status).toBe(403);
    expect(crossSite.status).toBe(403);
  });

  it('isti Origin je dozvoljen', async () => {
    const { request, host } = await setup();
    const response = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: PASSWORD }),
      headers: { Origin: `http://${host}`, 'Sec-Fetch-Site': 'same-origin' },
    });
    expect(response.status).toBe(200);
  });
});

describe('zaštićeni podaci', () => {
  it.each([
    ['GET', '/session'],
    ['GET', '/contacts'],
    ['GET', '/contacts/1'],
    ['DELETE', '/contacts/1'],
    ['GET', '/cookie-consents'],
  ])('%s %s bez prijave vraća 401', async (method, path) => {
    const { request, store } = await setup();
    seedContact(store, 'Petar Petrović');

    const response = await request(path, { method });

    expect(response.status).toBe(401);
    expect(store.contacts.get(1)).not.toBeNull();
  });

  it('lažan ili istekao token ne daje pristup', async () => {
    let now = new Date('2026-10-01T08:00:00Z');
    const { request, authenticate } = await setup({ now: () => now });
    const auth = await authenticate();

    expect((await request('/session', { headers: auth })).status).toBe(200);
    expect(
      (await request('/session', { headers: { Cookie: 'crs_admin_session=lazni-token' } })).status,
    ).toBe(401);

    now = new Date('2026-10-01T16:00:01Z'); // posle 8 sati
    expect((await request('/session', { headers: auth })).status).toBe(401);
  });

  it('sesija, lista upita sa saglasnošću, pretraga i paginacija', async () => {
    const { request, authenticate, store } = await setup();
    seedContact(store, 'Petar Petrović', 1);
    seedContact(store, 'Jovana Jović', 2);
    const auth = await authenticate();

    expect(await (await request('/session', { headers: auth })).json()).toEqual({
      authenticated: true,
      username: 'admin',
    });

    const list = await request('/contacts', { headers: auth });
    expect(list.status).toBe(200);
    expect(list.headers.get('cache-control')).toBe('no-store');
    const body = (await list.json()) as { items: Array<Record<string, unknown>>; total: number };
    expect(body.total).toBe(2);
    expect(body.items[0]).toMatchObject({
      name: 'Jovana Jović',
      privacyConsent: true,
      privacyPolicyVersion: '2026-10-01',
      privacyConsentAt: '2026-10-01T09:02:00.000Z',
    });

    const search = (await (await request('/contacts?q=petar', { headers: auth })).json()) as {
      items: Array<{ name: string }>;
    };
    expect(search.items.map((item) => item.name)).toEqual(['Petar Petrović']);

    const page2 = (await (await request('/contacts?page=2', { headers: auth })).json()) as {
      items: unknown[];
      page: number;
    };
    expect(page2).toMatchObject({ items: [], page: 2 });
  });

  it('detalji i brisanje upita; drugi Origin ne može da briše', async () => {
    const { request, authenticate, store, logger } = await setup();
    const id = seedContact(store, 'Petar Petrović');
    const auth = await authenticate();

    const detail = await request(`/contacts/${id}`, { headers: auth });
    expect(await detail.json()).toMatchObject({ id, name: 'Petar Petrović' });
    expect((await request('/contacts/999', { headers: auth })).status).toBe(404);

    const csrf = await request(`/contacts/${id}`, {
      method: 'DELETE',
      headers: { ...auth, Origin: 'https://napadac.example' },
    });
    expect(csrf.status).toBe(403);
    expect(store.contacts.get(id)).not.toBeNull();

    const removed = await request(`/contacts/${id}`, { method: 'DELETE', headers: auth });
    expect(removed.status).toBe(200);
    expect(store.contacts.get(id)).toBeNull();
    expect(logger.info).toHaveBeenCalledWith('admin.contact_deleted', { id });
    expect((await request(`/contacts/${id}`, { method: 'DELETE', headers: auth })).status).toBe(
      404,
    );
  });

  it('saglasnosti za kolačiće sa zbirom', async () => {
    const { request, authenticate, store } = await setup();
    store.cookieConsents.insert({
      id: '00000000-0000-4000-8000-000000000001',
      createdAt: new Date('2026-10-01T09:00:00Z'),
      decision: 'necessary',
      categories: ['necessary'],
      policyVersion: '2026-10-01',
      ipAnonymized: '203.0.113.0',
      userAgent: 'TestBrowser',
    });
    const auth = await authenticate();

    const response = await request('/cookie-consents', { headers: auth });

    expect(await response.json()).toMatchObject({
      total: 1,
      summary: { total: 1, all: 0, necessary: 1 },
      items: [{ decision: 'necessary', ipAnonymized: '203.0.113.0' }],
    });
  });

  it('odjava briše sesiju i kolačić', async () => {
    const { request, authenticate } = await setup();
    const auth = await authenticate();

    const response = await request('/logout', { method: 'POST', headers: auth });

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect((await request('/session', { headers: auth })).status).toBe(401);
  });

  it('nepoznata ruta vraća 404', async () => {
    const { request, authenticate } = await setup();
    const auth = await authenticate();
    expect((await request('/nepostojece', { headers: auth })).status).toBe(404);
  });
});
