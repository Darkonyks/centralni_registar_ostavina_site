/**
 * Serverska konfiguracija, isključivo iz environment promenljivih.
 * Tajne (Turnstile secret, SMTP lozinka) postoje samo ovde i nikada ne idu u frontend bundle.
 */

export type Env = Record<string, string | undefined>;

export interface SmtpConfig {
  host: string;
  port: number;
  /** `true` = TLS od početka konekcije (obično port 465); `false` = STARTTLS (obično 587). */
  secure: boolean;
  /** Odbija slanje ako server ne ponudi STARTTLS. Isključiti samo za lokalni test SMTP. */
  requireTls: boolean;
  user?: string;
  password?: string;
  /** Adresa pošiljaoca na domenu koji je podešen za slanje pošte (SPF/DKIM). */
  fromEmail: string;
}

export interface ContactConfig {
  turnstileSecret: string;
  recipient: string;
  smtp: SmtpConfig;
  /** Header sa IP adresom klijenta iza proxy-ja (npr. `cf-connecting-ip`); prazno = adresa konekcije. */
  clientIpHeader?: string;
  /** Imena obaveznih promenljivih koje nisu postavljene; ako lista nije prazna, forma ne šalje poruke. */
  missing: string[];
}

export interface AdminConfig {
  username: string;
  /** scrypt heš lozinke (`npm run admin:hash-password`); lozinka se nikada ne čuva u čistom obliku. */
  passwordHash: string;
  /** Imena promenljivih koje nedostaju; ako lista nije prazna, prijava nije moguća. */
  missing: string[];
}

/** Konfiguracija API-ja (kontakt, kolačići, administracija), za produkcioni server i Vite. */
export interface ApiConfig {
  /** Putanja do SQLite baze (podrazumevano `data/registar.db`). */
  databasePath: string;
  clientIpHeader?: string;
  contact: ContactConfig;
  admin: AdminConfig;
}

export interface ServerConfig extends ApiConfig {
  host: string;
  port: number;
}

export const DEFAULT_DATABASE_PATH = 'data/registar.db';

export const DEFAULT_CONTACT_RECIPIENT = 'kontakt@registarostavina.rs';

function read(env: Env, name: string): string {
  return env[name]?.trim() ?? '';
}

function readBoolean(env: Env, name: string, fallback: boolean): boolean {
  const value = read(env, name).toLowerCase();
  if (value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value);
}

function readPort(env: Env, name: string, fallback: number): number {
  const value = Number.parseInt(read(env, name), 10);
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : fallback;
}

export function loadContactConfig(env: Env): ContactConfig {
  const secure = readBoolean(env, 'SMTP_SECURE', false);
  const config: ContactConfig = {
    turnstileSecret: read(env, 'TURNSTILE_SECRET_KEY'),
    recipient: read(env, 'CONTACT_RECIPIENT_EMAIL') || DEFAULT_CONTACT_RECIPIENT,
    smtp: {
      host: read(env, 'SMTP_HOST'),
      port: readPort(env, 'SMTP_PORT', secure ? 465 : 587),
      secure,
      requireTls: readBoolean(env, 'SMTP_REQUIRE_TLS', true),
      user: read(env, 'SMTP_USER') || undefined,
      password: read(env, 'SMTP_PASSWORD') || undefined,
      fromEmail: read(env, 'SMTP_FROM_EMAIL'),
    },
    clientIpHeader: read(env, 'CLIENT_IP_HEADER').toLowerCase() || undefined,
    missing: [],
  };

  const required: Array<[string, string]> = [
    ['TURNSTILE_SECRET_KEY', config.turnstileSecret],
    ['SMTP_HOST', config.smtp.host],
    ['SMTP_FROM_EMAIL', config.smtp.fromEmail],
  ];
  config.missing = required.filter(([, value]) => value === '').map(([name]) => name);
  if (config.smtp.user && !config.smtp.password) config.missing.push('SMTP_PASSWORD');

  return config;
}

export function loadAdminConfig(env: Env): AdminConfig {
  const config: AdminConfig = {
    username: read(env, 'ADMIN_USERNAME'),
    passwordHash: read(env, 'ADMIN_PASSWORD_HASH'),
    missing: [],
  };
  if (!config.username) config.missing.push('ADMIN_USERNAME');
  if (!config.passwordHash) config.missing.push('ADMIN_PASSWORD_HASH');
  return config;
}

export function loadApiConfig(env: Env): ApiConfig {
  return {
    databasePath: read(env, 'DATABASE_PATH') || DEFAULT_DATABASE_PATH,
    clientIpHeader: read(env, 'CLIENT_IP_HEADER').toLowerCase() || undefined,
    contact: loadContactConfig(env),
    admin: loadAdminConfig(env),
  };
}

export function loadServerConfig(env: Env): ServerConfig {
  return {
    host: read(env, 'HOST') || '0.0.0.0',
    port: readPort(env, 'PORT', 3000),
    ...loadApiConfig(env),
  };
}
