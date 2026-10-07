import type { Server } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { createApiFromConfig } from './api.ts';
import { hashPassword } from './auth.ts';
import { loadApiConfig } from './config.ts';
import { close, createTestLogger, listen } from './testUtils.ts';

let server: Server | undefined;
afterEach(async () => {
  if (server) await close(server);
  server = undefined;
});

describe('API sa konfiguracijom (integracija)', () => {
  it('rutira kontakt, kolačiće i administraciju nad istom bazom', async () => {
    const { logger } = createTestLogger();
    const config = loadApiConfig({
      DATABASE_PATH: ':memory:',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD_HASH: hashPassword('lozinka-za-integracioni-test'),
    });
    const api = createApiFromConfig(config, logger);
    expect(api.db).not.toBeNull();
    const started = await listen(api.handler);
    server = started.server;
    const url = started.url;

    // Kontakt forma bez Turnstile/SMTP konfiguracije: 503 (sajt i dalje radi).
    const contact = await fetch(`${url}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(contact.status).toBe(503);

    // Izbor kolačića se upisuje u bazu…
    const consent = await fetch(`${url}/api/cookie-consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'all' }),
    });
    expect(consent.status).toBe(200);

    // …i vidljiv je administratoru.
    const login = await fetch(`${url}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'lozinka-za-integracioni-test' }),
    });
    const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]!;
    const consents = await fetch(`${url}/api/admin/cookie-consents`, {
      headers: { Cookie: cookie },
    });
    expect(await consents.json()).toMatchObject({ summary: { total: 1, all: 1, necessary: 0 } });

    expect((await fetch(`${url}/api/nepostojece`)).status).toBe(404);
    api.db?.close();
  });

  it('ako baza ne može da se otvori, API vraća 503 i loguje grešku', async () => {
    const { logger } = createTestLogger();
    // Putanja kroz postojeći fajl umesto direktorijuma ne može da se kreira.
    const config = loadApiConfig({ DATABASE_PATH: `${process.cwd()}/package.json/registar.db` });

    const api = createApiFromConfig(config, logger);
    const started = await listen(api.handler);
    server = started.server;

    expect(api.db).toBeNull();
    expect((await fetch(`${started.url}/api/admin/session`)).status).toBe(503);
    expect(logger.error).toHaveBeenCalledWith('db.open_failed', expect.any(Object));
  });
});
