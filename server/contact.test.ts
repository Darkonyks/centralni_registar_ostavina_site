import type { Server } from 'node:http';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { PRIVACY_POLICY_VERSION } from '../shared/consent.ts';
import { loadContactConfig } from './config.ts';
import {
  CONTACT_MAX_BODY_BYTES,
  createContactHandler,
  createContactHandlerFromConfig,
  type ContactHandlerDeps,
} from './contact.ts';
import { createRateLimiter } from './rateLimit.ts';
import { createStore, type Store } from './store.ts';
import { close, createTestLogger, listen, openTestDatabase } from './testUtils.ts';

const GENERIC = { success: false, message: 'Poruku trenutno nije moguće poslati.' };

const VALID = {
  name: 'Petar Petrović',
  office: 'Kancelarija Petrović',
  email: 'petar@example.com',
  phone: '+381 64 123 4567',
  message: 'Tajni sadržaj poruke koji ne sme u log.',
  turnstileToken: 'token-koji-ne-sme-u-log',
  privacyConsent: true,
  privacyPolicyVersion: PRIVACY_POLICY_VERSION,
};

const NOW = new Date('2026-10-01T12:05:09Z');

let server: Server | undefined;

afterEach(async () => {
  if (server) await close(server);
  server = undefined;
});

async function setup(overrides: Partial<ContactHandlerDeps> = {}) {
  const { logger, dump } = createTestLogger();
  const store: Store = createStore(openTestDatabase());
  const deps: ContactHandlerDeps = {
    verifyTurnstile: vi.fn(async () => ({ success: true, errorCodes: [] })),
    sendMail: vi.fn(async () => {}),
    contacts: store.contacts,
    rateLimiter: createRateLimiter({ max: 100, windowMs: 60_000 }),
    logger,
    mail: { from: 'noreply@registarostavina.rs', to: 'kontakt@registarostavina.rs' },
    now: () => NOW,
    ...overrides,
  };
  const started = await listen(createContactHandler(deps));
  server = started.server;

  const post = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${started.url}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

  const saved = () => store.contacts.list({ page: 1, pageSize: 50 });

  return { deps, post, url: started.url, logger, dump, saved };
}

describe('POST /api/contact – uspešan upit', () => {
  it('čuva upit sa saglasnošću u bazi, šalje email i vraća { success: true }', async () => {
    const { deps, post, dump, logger, saved } = await setup();

    const response = await post(VALID);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ success: true });
    expect(deps.verifyTurnstile).toHaveBeenCalledWith(VALID.turnstileToken, '127.0.0.1');

    const { items, total } = saved();
    expect(total).toBe(1);
    expect(items[0]).toEqual({
      id: 1,
      createdAt: NOW.toISOString(),
      name: 'Petar Petrović',
      office: 'Kancelarija Petrović',
      email: 'petar@example.com',
      phone: '+381 64 123 4567',
      message: 'Tajni sadržaj poruke koji ne sme u log.',
      privacyConsent: true,
      privacyConsentAt: NOW.toISOString(),
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      emailStatus: 'sent',
    });

    expect(deps.sendMail).toHaveBeenCalledTimes(1);
    const message = vi.mocked(deps.sendMail).mock.calls[0]![0];
    expect(message).toMatchObject({
      from: { name: 'Centralni registar ostavina', address: 'noreply@registarostavina.rs' },
      to: 'kontakt@registarostavina.rs',
      replyTo: { name: 'Petar Petrović', address: 'petar@example.com' },
      subject: 'Upit sa sajta Centralni registar ostavina – Petar Petrović',
    });
    expect(message.text).toContain(
      `Saglasnost sa politikom privatnosti:\nDa (verzija ${PRIVACY_POLICY_VERSION})`,
    );
    expect(message.text).toContain('Broj upita u administraciji:\n1');

    expect(logger.info).toHaveBeenCalledWith('contact.saved', { id: 1, email: 'sent' });
    // Log ne sadrži sadržaj poruke, podatke korisnika ni token.
    expect(dump()).not.toMatch(/Tajni sadržaj|token-koji-ne-sme|petar@example|Petrović/);
  });

  it('trimuje polja pre čuvanja i slanja', async () => {
    const { deps, post, saved } = await setup();

    await post({ ...VALID, name: '  Petar   Petrović  ', email: ' petar@example.com ' });

    expect(saved().items[0]).toMatchObject({ name: 'Petar Petrović', email: 'petar@example.com' });
    expect(vi.mocked(deps.sendMail).mock.calls[0]![0]).toMatchObject({
      replyTo: { name: 'Petar Petrović', address: 'petar@example.com' },
    });
  });

  it('SMTP greška: upit ostaje sačuvan (status „failed“), korisnik dobija potvrdu', async () => {
    const smtpError = Object.assign(
      new Error('Invalid login: 535 smtp.interni-host.rs lozinka123'),
      { code: 'EAUTH' },
    );
    const { post, logger, dump, saved } = await setup({
      sendMail: vi.fn(async () => Promise.reject(smtpError)),
    });

    const response = await post(VALID);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(text)).toEqual({ success: true });
    expect(text).not.toMatch(/EAUTH|smtp|535|lozinka/i);
    expect(saved().items[0]).toMatchObject({ id: 1, emailStatus: 'failed' });
    expect(logger.error).toHaveBeenCalledWith('contact.smtp_error', { id: 1, code: 'EAUTH' });
    expect(dump()).not.toMatch(/lozinka123|Tajni sadržaj/);
  });

  it('greška baze: 500, email se ne šalje', async () => {
    const { post, deps, logger } = await setup({
      contacts: {
        insert: () => {
          throw new Error('SQLITE_FULL: database or disk is full');
        },
        setEmailStatus: () => {},
      },
    });

    const response = await post(VALID);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(GENERIC);
    expect(deps.sendMail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('contact.db_error', { name: 'Error' });
  });
});

describe('POST /api/contact – politika privatnosti', () => {
  it.each([
    ['bez saglasnosti', { privacyConsent: undefined }],
    ['saglasnost = false', { privacyConsent: false }],
    ['saglasnost kao tekst „true“', { privacyConsent: 'true' }],
  ])('%s: 400, upit se ne čuva i ne šalje', async (_label, change) => {
    const { post, deps, saved } = await setup();

    const response = await post({ ...VALID, ...change });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ...GENERIC,
      fieldErrors: {
        privacyConsent: 'Za slanje upita potrebno je da prihvatite politiku privatnosti.',
      },
    });
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.sendMail).not.toHaveBeenCalled();
    expect(saved().total).toBe(0);
  });

  it('saglasnost za staru verziju politike se odbija', async () => {
    const { post, saved } = await setup();

    const response = await post({ ...VALID, privacyPolicyVersion: '2020-01-01' });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { fieldErrors: { privacyConsent: string } };
    expect(body.fieldErrors.privacyConsent).toMatch(/izmenjena/);
    expect(saved().total).toBe(0);
  });
});

describe('POST /api/contact – odbijeni zahtevi', () => {
  it('odbija druge HTTP metode (405 + Allow)', async () => {
    const { url, deps } = await setup();

    const response = await fetch(`${url}/api/contact`);

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(await response.json()).toEqual(GENERIC);
    expect(deps.sendMail).not.toHaveBeenCalled();
  });

  it('odbija telo koje nije JSON (415) i neispravan JSON (400)', async () => {
    const { post, deps } = await setup();

    const form = await post('name=Petar', { 'Content-Type': 'application/x-www-form-urlencoded' });
    expect(form.status).toBe(415);
    expect(await form.json()).toEqual(GENERIC);

    const broken = await post('{"name": ');
    expect(broken.status).toBe(400);
    expect(await broken.json()).toEqual(GENERIC);
    expect(deps.sendMail).not.toHaveBeenCalled();
  });

  it('odbija preveliko telo zahteva (413)', async () => {
    const { post, deps } = await setup();

    const response = await post({ ...VALID, message: 'x'.repeat(CONTACT_MAX_BODY_BYTES) });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual(GENERIC);
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.sendMail).not.toHaveBeenCalled();
  });

  it('nevalidan payload: 400 sa greškama polja, bez Turnstile provere, čuvanja i slanja', async () => {
    const { post, deps, saved } = await setup();

    const response = await post({
      ...VALID,
      name: '   ',
      email: 'nije-email',
      message: 'x'.repeat(5001),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ...GENERIC,
      fieldErrors: {
        name: 'Unesite ime i prezime.',
        email: 'Unesite ispravnu email adresu.',
        message: 'Dozvoljeno je najviše 5.000 znakova.',
      },
    });
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.sendMail).not.toHaveBeenCalled();
    expect(saved().total).toBe(0);
  });

  it.each([null, [], 'string', 42])('odbija payload koji nije objekat: %j', async (payload) => {
    const { post, deps } = await setup();
    const response = await post(JSON.stringify(payload));
    expect(response.status).toBe(400);
    expect(deps.sendMail).not.toHaveBeenCalled();
  });

  it('odbija zahtev bez Turnstile tokena ili sa predugim tokenom', async () => {
    const { post, deps } = await setup();

    const missing = await post({ ...VALID, turnstileToken: undefined });
    const tooLong = await post({ ...VALID, turnstileToken: 'x'.repeat(2049) });

    expect(missing.status).toBe(400);
    expect(tooLong.status).toBe(400);
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.sendMail).not.toHaveBeenCalled();
  });

  it('neuspešna Turnstile provera: 403, upit se ne čuva, token nije u logu', async () => {
    const { post, deps, dump, logger, saved } = await setup({
      verifyTurnstile: vi.fn(async () => ({
        success: false,
        errorCodes: ['invalid-input-response'],
      })),
    });

    const response = await post(VALID);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(GENERIC);
    expect(deps.sendMail).not.toHaveBeenCalled();
    expect(saved().total).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith('contact.rejected', {
      reason: 'turnstile_failed',
      codes: ['invalid-input-response'],
    });
    expect(dump()).not.toContain(VALID.turnstileToken);
  });

  it('rate limit: posle dozvoljenog broja zahteva vraća 429', async () => {
    const { post, deps } = await setup({
      rateLimiter: createRateLimiter({ max: 2, windowMs: 60_000 }),
    });

    expect((await post(VALID)).status).toBe(200);
    expect((await post(VALID)).status).toBe(200);
    const limited = await post(VALID);

    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('600');
    expect(await limited.json()).toEqual(GENERIC);
    expect(deps.sendMail).toHaveBeenCalledTimes(2);
  });

  it('rate limit broji po IP adresi iz podešenog proxy header-a', async () => {
    const { post } = await setup({
      rateLimiter: createRateLimiter({ max: 1, windowMs: 60_000 }),
      clientIpHeader: 'cf-connecting-ip',
    });

    expect((await post(VALID, { 'CF-Connecting-IP': '203.0.113.1' })).status).toBe(200);
    expect((await post(VALID, { 'CF-Connecting-IP': '203.0.113.2' })).status).toBe(200);
    expect((await post(VALID, { 'CF-Connecting-IP': '203.0.113.1' })).status).toBe(429);
  });

  it('X-Forwarded-For: broji se poslednja adresa (dodaje je proxy), ne lažne adrese klijenta', async () => {
    const { post } = await setup({
      rateLimiter: createRateLimiter({ max: 1, windowMs: 60_000 }),
      clientIpHeader: 'x-forwarded-for',
    });

    const forwarded = (spoofed: string, real: string) => ({
      'X-Forwarded-For': `${spoofed}, ${real}`,
    });
    expect((await post(VALID, forwarded('198.51.100.1', '203.0.113.7'))).status).toBe(200);
    expect((await post(VALID, forwarded('198.51.100.2', '203.0.113.7'))).status).toBe(429);
    expect((await post(VALID, forwarded('198.51.100.3', '203.0.113.8'))).status).toBe(200);
  });

  it('bez podešenog header-a lažni X-Forwarded-For ne zaobilazi rate limit', async () => {
    const { post } = await setup({ rateLimiter: createRateLimiter({ max: 1, windowMs: 60_000 }) });

    expect((await post(VALID, { 'X-Forwarded-For': '198.51.100.1' })).status).toBe(200);
    expect((await post(VALID, { 'X-Forwarded-For': '198.51.100.2' })).status).toBe(429);
  });

  it('honeypot: popunjeno skriveno polje odbija zahtev bez provere, čuvanja i slanja', async () => {
    const { post, deps, logger, saved } = await setup();

    const response = await post({ ...VALID, website: 'https://spam.example' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(GENERIC);
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.sendMail).not.toHaveBeenCalled();
    expect(saved().total).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith('contact.rejected', { reason: 'honeypot' });
  });

  it('prazan honeypot ne smeta', async () => {
    const { post } = await setup();
    expect((await post({ ...VALID, website: '' })).status).toBe(200);
  });

  it('neočekivana greška: 500 bez stack trace-a', async () => {
    const { post } = await setup({
      verifyTurnstile: vi.fn(async () => {
        throw new Error('neočekivano: /home/app/server/turnstile.ts:42');
      }),
    });

    const response = await post(VALID);
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(text)).toEqual(GENERIC);
    expect(text).not.toMatch(/neočekivano|turnstile\.ts|at /);
  });
});

describe('createContactHandlerFromConfig', () => {
  it('bez obavezne konfiguracije vraća 503 i loguje šta nedostaje (bez vrednosti)', async () => {
    const { logger } = createTestLogger();
    const config = loadContactConfig({ SMTP_HOST: 'smtp.example.com' });
    expect(config.missing).toEqual(['TURNSTILE_SECRET_KEY', 'SMTP_FROM_EMAIL']);

    const store = createStore(openTestDatabase());
    const started = await listen(createContactHandlerFromConfig(config, store.contacts, logger));
    server = started.server;
    const response = await fetch(`${started.url}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(GENERIC);
    expect(logger.error).toHaveBeenCalledWith('contact.not_configured', {
      missing: ['TURNSTILE_SECRET_KEY', 'SMTP_FROM_EMAIL'],
    });
  });
});
