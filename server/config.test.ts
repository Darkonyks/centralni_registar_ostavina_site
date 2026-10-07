import { describe, expect, it } from 'vitest';

import { createRateLimiter } from './rateLimit.ts';
import { loadContactConfig, loadServerConfig } from './config.ts';

describe('loadContactConfig', () => {
  it('čita kompletnu konfiguraciju iz environment promenljivih', () => {
    const config = loadContactConfig({
      TURNSTILE_SECRET_KEY: ' secret ',
      CONTACT_RECIPIENT_EMAIL: 'kontakt@registarostavina.rs',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      SMTP_USER: 'mailer',
      SMTP_PASSWORD: 'lozinka',
      SMTP_FROM_EMAIL: 'noreply@registarostavina.rs',
      CLIENT_IP_HEADER: 'CF-Connecting-IP',
    });

    expect(config).toEqual({
      turnstileSecret: 'secret',
      recipient: 'kontakt@registarostavina.rs',
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        requireTls: true,
        user: 'mailer',
        password: 'lozinka',
        fromEmail: 'noreply@registarostavina.rs',
      },
      clientIpHeader: 'cf-connecting-ip',
      missing: [],
    });
  });

  it('podrazumevane vrednosti: primalac kontakt@, port 587 sa obaveznim STARTTLS-om', () => {
    const config = loadContactConfig({});
    expect(config.recipient).toBe('kontakt@registarostavina.rs');
    expect(config.smtp).toMatchObject({ port: 587, secure: false, requireTls: true });
    expect(config.missing).toEqual(['TURNSTILE_SECRET_KEY', 'SMTP_HOST', 'SMTP_FROM_EMAIL']);
  });

  it('SMTP_USER bez SMTP_PASSWORD je nepotpuna konfiguracija', () => {
    const config = loadContactConfig({
      TURNSTILE_SECRET_KEY: 's',
      SMTP_HOST: 'h',
      SMTP_FROM_EMAIL: 'f@registarostavina.rs',
      SMTP_USER: 'mailer',
    });
    expect(config.missing).toEqual(['SMTP_PASSWORD']);
  });

  it('server: PORT i HOST sa podrazumevanim vrednostima', () => {
    expect(loadServerConfig({})).toMatchObject({ host: '0.0.0.0', port: 3000 });
    expect(loadServerConfig({ PORT: '8080', HOST: '127.0.0.1' })).toMatchObject({
      host: '127.0.0.1',
      port: 8080,
    });
    expect(loadServerConfig({ PORT: 'abc' }).port).toBe(3000);
  });
});

describe('createRateLimiter', () => {
  it('dozvoljava `max` pokušaja po ključu u prozoru, pa ponovo posle isteka prozora', () => {
    let now = 0;
    const limiter = createRateLimiter({ max: 2, windowMs: 1000, now: () => now });

    expect(limiter.hit('a')).toBe(true);
    expect(limiter.hit('a')).toBe(true);
    expect(limiter.hit('a')).toBe(false);
    expect(limiter.hit('b')).toBe(true);

    now = 1000;
    expect(limiter.hit('a')).toBe(true);
  });
});
