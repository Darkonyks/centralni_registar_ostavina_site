import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { simpleParser, type AddressObject, type ParsedMail } from 'mailparser';
import { SMTPServer, type SMTPServerOptions } from 'smtp-server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PRIVACY_POLICY_VERSION } from '../shared/consent.ts';
import type { SmtpConfig } from './config.ts';
import { createContactHandler } from './contact.ts';
import { buildContactEmail, createSmtpSender, formatReceivedAt } from './email.ts';
import { createRateLimiter } from './rateLimit.ts';
import { createStore } from './store.ts';
import { close, createTestLogger, listen, openTestDatabase } from './testUtils.ts';

const DATA = {
  name: 'Petar Petrović',
  office: 'Kancelarija Petrović',
  email: 'petar@example.com',
  phone: '+381 64 123 4567',
  message: 'Prvi red <b>nije HTML</b>.\n\nDrugi pasus.',
};

const RECEIVED_AT = new Date('2026-09-30T12:05:09Z');

describe('formatReceivedAt', () => {
  it('prikazuje vreme u zoni Europe/Belgrade (letnje i zimsko računanje)', () => {
    expect(formatReceivedAt(RECEIVED_AT)).toBe('30.09.2026. 14:05:09 (Europe/Belgrade)');
    expect(formatReceivedAt(new Date('2026-01-15T08:00:00Z'))).toBe(
      '15.01.2026. 09:00:00 (Europe/Belgrade)',
    );
  });
});

describe('buildContactEmail', () => {
  it('pravi plain-text poruku po zadatom obrascu; Reply-To je korisnik, From naš domen', () => {
    const message = buildContactEmail(DATA, {
      from: 'noreply@registarostavina.rs',
      to: 'kontakt@registarostavina.rs',
      receivedAt: RECEIVED_AT,
      id: 7,
      privacyPolicyVersion: '2026-10-01',
    });

    expect(message.from).toEqual({
      name: 'Centralni registar ostavina',
      address: 'noreply@registarostavina.rs',
    });
    expect(message.to).toBe('kontakt@registarostavina.rs');
    expect(message.replyTo).toEqual({ name: 'Petar Petrović', address: 'petar@example.com' });
    expect(message.subject).toBe('Upit sa sajta Centralni registar ostavina – Petar Petrović');
    expect(message.html).toBeUndefined();
    expect(message.text).toBe(
      [
        'Novi upit sa sajta Centralni registar ostavina',
        '',
        'Ime i prezime:',
        'Petar Petrović',
        '',
        'Kancelarija:',
        'Kancelarija Petrović',
        '',
        'Email:',
        'petar@example.com',
        '',
        'Telefon:',
        '+381 64 123 4567',
        '',
        'Poruka:',
        'Prvi red <b>nije HTML</b>.',
        '',
        'Drugi pasus.',
        '',
        'Vreme prijema:',
        '30.09.2026. 14:05:09 (Europe/Belgrade)',
        '',
        'Saglasnost sa politikom privatnosti:',
        'Da (verzija 2026-10-01)',
        '',
        'Broj upita u administraciji:',
        '7',
        '',
      ].join('\n'),
    );
  });
});

// ---------------------------------------------------------------------------
// Integracija sa pravim SMTP serverom (lokalni smtp-server na nasumičnom portu).
// ---------------------------------------------------------------------------

interface Received {
  mail: ParsedMail;
  envelope: { from: string; to: string[] };
}

let smtp: SMTPServer | undefined;
let http: Server | undefined;

afterEach(async () => {
  if (http) await close(http);
  if (smtp) await new Promise<void>((resolve) => smtp!.close(() => resolve()));
  http = undefined;
  smtp = undefined;
});

async function startSmtp(options: Partial<SMTPServerOptions> = {}) {
  const received: Received[] = [];
  smtp = new SMTPServer({
    disabledCommands: ['STARTTLS'],
    authOptional: true,
    logger: false,
    onData(stream, session, callback) {
      simpleParser(stream)
        .then((mail) => {
          received.push({
            mail,
            envelope: {
              from: session.envelope.mailFrom ? session.envelope.mailFrom.address : '',
              to: session.envelope.rcptTo.map((rcpt) => rcpt.address),
            },
          });
          callback();
        })
        .catch(callback);
    },
    ...options,
  });
  await new Promise<void>((resolve) => smtp!.listen(0, '127.0.0.1', resolve));
  const { port } = smtp.server.address() as AddressInfo;
  return { port, received };
}

const smtpConfig = (port: number, overrides: Partial<SmtpConfig> = {}): SmtpConfig => ({
  host: '127.0.0.1',
  port,
  secure: false,
  requireTls: false,
  fromEmail: 'noreply@registarostavina.rs',
  ...overrides,
});

const address = (value: AddressObject | AddressObject[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.value[0];

describe('SMTP slanje', () => {
  it('poruka stiže na kontakt adresu sa ispravnim zaglavljima i sadržajem', async () => {
    const { port, received } = await startSmtp();
    const send = createSmtpSender(smtpConfig(port));

    await send(
      buildContactEmail(DATA, {
        from: 'noreply@registarostavina.rs',
        to: 'kontakt@registarostavina.rs',
        receivedAt: RECEIVED_AT,
        id: 7,
        privacyPolicyVersion: '2026-10-01',
      }),
    );

    expect(received).toHaveLength(1);
    const { mail, envelope } = received[0]!;
    expect(envelope).toEqual({
      from: 'noreply@registarostavina.rs',
      to: ['kontakt@registarostavina.rs'],
    });
    expect(mail.subject).toBe('Upit sa sajta Centralni registar ostavina – Petar Petrović');
    expect(address(mail.from)).toEqual({
      name: 'Centralni registar ostavina',
      address: 'noreply@registarostavina.rs',
    });
    expect(address(mail.to)?.address).toBe('kontakt@registarostavina.rs');
    expect(address(mail.replyTo)).toEqual({ name: 'Petar Petrović', address: 'petar@example.com' });
    expect(mail.html).toBe(false);
    expect(mail.text).toContain('Kancelarija:\nKancelarija Petrović');
    expect(mail.text).toContain('Prvi red <b>nije HTML</b>.\n\nDrugi pasus.');
    expect(mail.text).toContain('Vreme prijema:\n30.09.2026. 14:05:09 (Europe/Belgrade)');
  });

  it('prijavljuje se na SMTP server sa SMTP_USER / SMTP_PASSWORD', async () => {
    const onAuth = vi.fn<NonNullable<SMTPServerOptions['onAuth']>>((auth, _session, callback) => {
      if (auth.username === 'mailer' && auth.password === 'tajna-lozinka') {
        callback(null, { user: 'mailer' });
      } else {
        callback(new Error('Invalid credentials'));
      }
    });
    const { port, received } = await startSmtp({
      authOptional: false,
      allowInsecureAuth: true,
      onAuth,
    });

    await createSmtpSender(smtpConfig(port, { user: 'mailer', password: 'tajna-lozinka' }))(
      buildContactEmail(DATA, {
        from: 'noreply@registarostavina.rs',
        to: 'kontakt@registarostavina.rs',
        receivedAt: RECEIVED_AT,
        id: 7,
        privacyPolicyVersion: '2026-10-01',
      }),
    );

    expect(onAuth).toHaveBeenCalledTimes(1);
    expect(received).toHaveLength(1);
  });

  it('uz SMTP_REQUIRE_TLS odbija slanje serveru bez STARTTLS-a', async () => {
    const { port, received } = await startSmtp();
    const send = createSmtpSender(smtpConfig(port, { requireTls: true }));

    await expect(
      send(
        buildContactEmail(DATA, {
          from: 'noreply@registarostavina.rs',
          to: 'kontakt@registarostavina.rs',
          receivedAt: RECEIVED_AT,
          id: 7,
          privacyPolicyVersion: '2026-10-01',
        }),
      ),
    ).rejects.toThrow();
    expect(received).toHaveLength(0);
  });

  it('greška SMTP servera (odbijena poruka): upit ostaje u bazi sa statusom „failed“', async () => {
    const { port } = await startSmtp({
      onData(stream, _session, callback) {
        stream.resume();
        stream.on('end', () =>
          callback(Object.assign(new Error('Mailbox unavailable'), { responseCode: 550 })),
        );
      },
    });
    const { logger } = createTestLogger();
    const store = createStore(openTestDatabase());
    const started = await listen(
      createContactHandler({
        verifyTurnstile: async () => ({ success: true, errorCodes: [] }),
        sendMail: createSmtpSender(smtpConfig(port)),
        contacts: store.contacts,
        rateLimiter: createRateLimiter({ max: 10, windowMs: 60_000 }),
        logger,
        mail: { from: 'noreply@registarostavina.rs', to: 'kontakt@registarostavina.rs' },
      }),
    );
    http = started.server;

    const response = await fetch(`${started.url}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...DATA,
        turnstileToken: 'token',
        privacyConsent: true,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(store.contacts.get(1)).toMatchObject({ name: 'Petar Petrović', emailStatus: 'failed' });
    expect(logger.error).toHaveBeenCalledWith('contact.smtp_error', { id: 1, code: 'EMESSAGE' });
  });

  it('nedostupan SMTP server (odbijena konekcija) daje grešku', async () => {
    const { port } = await startSmtp();
    await new Promise<void>((resolve) => smtp!.close(() => resolve()));
    smtp = undefined;

    await expect(
      createSmtpSender(smtpConfig(port))(
        buildContactEmail(DATA, {
          from: 'noreply@registarostavina.rs',
          to: 'kontakt@registarostavina.rs',
          receivedAt: RECEIVED_AT,
          id: 7,
          privacyPolicyVersion: '2026-10-01',
        }),
      ),
    ).rejects.toMatchObject({ code: expect.stringMatching(/^E(SOCKET|CONNECTION)$/) });
  });
});
