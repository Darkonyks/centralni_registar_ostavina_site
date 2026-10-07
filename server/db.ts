/**
 * SQLite baza (ugrađeni `node:sqlite`, bez nativnih zavisnosti).
 * Šema se vodi kroz numerisane migracije i `PRAGMA user_version`.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Database = DatabaseSync;

/** Migracije se samo dodaju na kraj; postojeće se nikada ne menjaju. */
const MIGRATIONS: readonly string[] = [
  // 1: upiti iz kontakt forme, saglasnosti za kolačiće, administratorske sesije
  `
  CREATE TABLE contact_submissions (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at              TEXT    NOT NULL,
    name                    TEXT    NOT NULL,
    office                  TEXT    NOT NULL,
    email                   TEXT    NOT NULL,
    phone                   TEXT    NOT NULL,
    message                 TEXT    NOT NULL,
    privacy_consent         INTEGER NOT NULL CHECK (privacy_consent IN (0, 1)),
    privacy_consent_at      TEXT,
    privacy_policy_version  TEXT,
    email_status            TEXT    NOT NULL DEFAULT 'pending'
                                    CHECK (email_status IN ('pending', 'sent', 'failed'))
  );
  CREATE INDEX idx_contact_submissions_created ON contact_submissions (created_at DESC);

  CREATE TABLE cookie_consents (
    id              TEXT PRIMARY KEY,
    created_at      TEXT NOT NULL,
    decision        TEXT NOT NULL CHECK (decision IN ('all', 'necessary')),
    categories      TEXT NOT NULL,
    policy_version  TEXT NOT NULL,
    ip_anonymized   TEXT NOT NULL,
    user_agent      TEXT NOT NULL
  );
  CREATE INDEX idx_cookie_consents_created ON cookie_consents (created_at DESC);

  CREATE TABLE admin_sessions (
    token_hash  TEXT PRIMARY KEY,
    username    TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL
  );
  CREATE INDEX idx_admin_sessions_expires ON admin_sessions (expires_at);
  `,
];

export function migrate(db: Database): void {
  const { user_version: current } = db.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };
  for (let version = current + 1; version <= MIGRATIONS.length; version += 1) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[version - 1]!);
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

/** Otvara (i po potrebi kreira) bazu i primenjuje migracije. `:memory:` se koristi u testovima. */
export function openDatabase(filePath: string): Database {
  if (filePath !== ':memory:') mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  const db = new DatabaseSync(filePath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  migrate(db);
  return db;
}
