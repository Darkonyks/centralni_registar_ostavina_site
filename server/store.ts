/** Pristup podacima: upiti, saglasnosti za kolačiće i administratorske sesije. */
import type {
  ContactSubmission,
  CookieConsentPage,
  CookieConsentRecord,
  EmailStatus,
  Page,
} from '../shared/admin.ts';
import type { ContactData } from '../shared/contact.ts';
import type { CookieDecision } from '../shared/consent.ts';
import type { Database } from './db.ts';

export interface NewContactSubmission extends ContactData {
  createdAt: Date;
  privacyConsentAt: Date;
  privacyPolicyVersion: string;
}

export interface NewCookieConsent {
  id: string;
  createdAt: Date;
  decision: CookieDecision;
  categories: readonly string[];
  policyVersion: string;
  ipAnonymized: string;
  userAgent: string;
}

interface ContactRow {
  id: number;
  created_at: string;
  name: string;
  office: string;
  email: string;
  phone: string;
  message: string;
  privacy_consent: number;
  privacy_consent_at: string | null;
  privacy_policy_version: string | null;
  email_status: EmailStatus;
}

interface CookieConsentRow {
  id: string;
  created_at: string;
  decision: CookieDecision;
  categories: string;
  policy_version: string;
  ip_anonymized: string;
  user_agent: string;
}

function toContact(row: ContactRow): ContactSubmission {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    office: row.office,
    email: row.email,
    phone: row.phone,
    message: row.message,
    privacyConsent: row.privacy_consent === 1,
    privacyConsentAt: row.privacy_consent_at,
    privacyPolicyVersion: row.privacy_policy_version,
    emailStatus: row.email_status,
  };
}

function toCookieConsent(row: CookieConsentRow): CookieConsentRecord {
  let categories: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.categories);
    if (Array.isArray(parsed))
      categories = parsed.filter((c): c is string => typeof c === 'string');
  } catch {
    // neispravan JSON u bazi: prikazuje se prazna lista kategorija
  }
  return {
    id: row.id,
    createdAt: row.created_at,
    decision: row.decision,
    categories,
    policyVersion: row.policy_version,
    ipAnonymized: row.ip_anonymized,
    userAgent: row.user_agent,
  };
}

/** `%` i `_` u pretrazi se tretiraju kao obični znakovi. */
function likePattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function createStore(db: Database) {
  const statements = {
    insertContact: db.prepare(`
      INSERT INTO contact_submissions
        (created_at, name, office, email, phone, message,
         privacy_consent, privacy_consent_at, privacy_policy_version, email_status)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 'pending')
    `),
    setEmailStatus: db.prepare('UPDATE contact_submissions SET email_status = ? WHERE id = ?'),
    getContact: db.prepare('SELECT * FROM contact_submissions WHERE id = ?'),
    deleteContact: db.prepare('DELETE FROM contact_submissions WHERE id = ?'),
    insertCookieConsent: db.prepare(`
      INSERT INTO cookie_consents
        (id, created_at, decision, categories, policy_version, ip_anonymized, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    cookieSummary: db.prepare(`
      SELECT COUNT(*) AS total,
             COALESCE(SUM(decision = 'all'), 0) AS all_count,
             COALESCE(SUM(decision = 'necessary'), 0) AS necessary_count
      FROM cookie_consents
    `),
    cookiePage: db.prepare(
      'SELECT * FROM cookie_consents ORDER BY created_at DESC, id LIMIT ? OFFSET ?',
    ),
    insertSession: db.prepare(
      'INSERT INTO admin_sessions (token_hash, username, created_at, expires_at) VALUES (?, ?, ?, ?)',
    ),
    findSession: db.prepare(
      'SELECT username FROM admin_sessions WHERE token_hash = ? AND expires_at > ?',
    ),
    deleteSession: db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?'),
    purgeSessions: db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?'),
  };

  return {
    contacts: {
      insert(input: NewContactSubmission): number {
        const result = statements.insertContact.run(
          input.createdAt.toISOString(),
          input.name,
          input.office,
          input.email,
          input.phone,
          input.message,
          input.privacyConsentAt.toISOString(),
          input.privacyPolicyVersion,
        );
        return Number(result.lastInsertRowid);
      },

      setEmailStatus(id: number, status: EmailStatus): void {
        statements.setEmailStatus.run(status, id);
      },

      get(id: number): ContactSubmission | null {
        const row = statements.getContact.get(id) as ContactRow | undefined;
        return row ? toContact(row) : null;
      },

      delete(id: number): boolean {
        return Number(statements.deleteContact.run(id).changes) > 0;
      },

      /** Najnoviji prvi; pretraga po imenu, kancelariji, email-u, telefonu i poruci. */
      list(options: { page: number; pageSize: number; query?: string }): Page<ContactSubmission> {
        const query = options.query?.trim() ?? '';
        const where = query
          ? `WHERE name LIKE ?1 ESCAPE '\\' OR office LIKE ?1 ESCAPE '\\' OR email LIKE ?1 ESCAPE '\\'
             OR phone LIKE ?1 ESCAPE '\\' OR message LIKE ?1 ESCAPE '\\'`
          : '';
        const params = query ? [likePattern(query)] : [];
        const { total } = db
          .prepare(`SELECT COUNT(*) AS total FROM contact_submissions ${where}`)
          .get(...params) as { total: number };
        const rows = db
          .prepare(
            `SELECT * FROM contact_submissions ${where}
             ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
          )
          .all(
            ...params,
            options.pageSize,
            (options.page - 1) * options.pageSize,
          ) as unknown as ContactRow[];
        return {
          items: rows.map(toContact),
          total,
          page: options.page,
          pageSize: options.pageSize,
        };
      },
    },

    cookieConsents: {
      insert(input: NewCookieConsent): void {
        statements.insertCookieConsent.run(
          input.id,
          input.createdAt.toISOString(),
          input.decision,
          JSON.stringify(input.categories),
          input.policyVersion,
          input.ipAnonymized,
          input.userAgent,
        );
      },

      list(options: { page: number; pageSize: number }): CookieConsentPage {
        const summary = statements.cookieSummary.get() as {
          total: number;
          all_count: number;
          necessary_count: number;
        };
        const rows = statements.cookiePage.all(
          options.pageSize,
          (options.page - 1) * options.pageSize,
        ) as unknown as CookieConsentRow[];
        return {
          items: rows.map(toCookieConsent),
          total: summary.total,
          page: options.page,
          pageSize: options.pageSize,
          summary: {
            total: summary.total,
            all: summary.all_count,
            necessary: summary.necessary_count,
          },
        };
      },
    },

    sessions: {
      create(tokenHash: string, username: string, createdAt: Date, expiresAt: Date): void {
        statements.insertSession.run(
          tokenHash,
          username,
          createdAt.toISOString(),
          expiresAt.toISOString(),
        );
      },

      /** Korisničko ime za važeću (neisteklu) sesiju. */
      find(tokenHash: string, now: Date): string | null {
        const row = statements.findSession.get(tokenHash, now.toISOString()) as
          { username: string } | undefined;
        return row?.username ?? null;
      },

      delete(tokenHash: string): void {
        statements.deleteSession.run(tokenHash);
      },

      purgeExpired(now: Date): void {
        statements.purgeSessions.run(now.toISOString());
      },
    },
  };
}

export type Store = ReturnType<typeof createStore>;
