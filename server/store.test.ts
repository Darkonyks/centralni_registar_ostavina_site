import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { migrate } from './db.ts';
import { createStore } from './store.ts';
import { openTestDatabase } from './testUtils.ts';

const BASE = {
  office: 'Kancelarija',
  phone: '064 123 4567',
  message: 'Poruka',
  privacyPolicyVersion: '2026-10-01',
};

function contact(
  index: number,
  overrides: Partial<Parameters<ReturnType<typeof createStore>['contacts']['insert']>[0]> = {},
) {
  const at = new Date(Date.UTC(2026, 9, 1, 8, index));
  return {
    ...BASE,
    name: `Osoba ${index}`,
    email: `osoba${index}@example.com`,
    createdAt: at,
    privacyConsentAt: at,
    ...overrides,
  };
}

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('baza', () => {
  it('kreira bazu u fajlu (i direktorijum), migracije su idempotentne', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'crs-db-'));
    tempDirs.push(dir);
    const file = path.join(dir, 'nested', 'registar.db');

    const db = openTestDatabase(file);
    createStore(db).contacts.insert(contact(1));
    migrate(db); // ponovno pokretanje ne menja ništa
    db.close();

    const reopened = openTestDatabase(file);
    expect(reopened.prepare('PRAGMA user_version').get()).toEqual({ user_version: 1 });
    expect(createStore(reopened).contacts.list({ page: 1, pageSize: 10 }).total).toBe(1);
    reopened.close();
  });

  it('baza ne prihvata upit bez saglasnosti (CHECK ograničenje)', () => {
    const db = openTestDatabase();
    expect(() =>
      db
        .prepare(
          `INSERT INTO contact_submissions (created_at, name, office, email, phone, message, privacy_consent)
           VALUES ('x', 'a', 'b', 'c', 'd', 'e', 2)`,
        )
        .run(),
    ).toThrow();
  });
});

describe('upiti', () => {
  it('lista: najnoviji prvi, paginacija i ukupan broj', () => {
    const store = createStore(openTestDatabase());
    for (let i = 1; i <= 30; i += 1) store.contacts.insert(contact(i));

    const first = store.contacts.list({ page: 1, pageSize: 25 });
    const second = store.contacts.list({ page: 2, pageSize: 25 });

    expect(first.total).toBe(30);
    expect(first.items).toHaveLength(25);
    expect(first.items[0]?.name).toBe('Osoba 30');
    expect(second.items.map((item) => item.name)).toEqual([
      'Osoba 5',
      'Osoba 4',
      'Osoba 3',
      'Osoba 2',
      'Osoba 1',
    ]);
  });

  it('pretraga po imenu, kancelariji, email-u, telefonu i poruci; % i _ su obični znakovi', () => {
    const store = createStore(openTestDatabase());
    store.contacts.insert(contact(1, { name: 'Marko Marković', office: 'Kancelarija Novi Sad' }));
    store.contacts.insert(contact(2, { message: 'Popust 50% za_test?' }));
    store.contacts.insert(contact(3, { phone: '+381 11 222 333' }));

    const search = (query: string) =>
      store.contacts.list({ page: 1, pageSize: 10, query }).items.map((item) => item.name);

    expect(search('marković')).toEqual(['Marko Marković']);
    expect(search('Novi Sad')).toEqual(['Marko Marković']);
    expect(search('osoba3@')).toEqual(['Osoba 3']);
    expect(search('222 333')).toEqual(['Osoba 3']);
    expect(search('50%')).toEqual(['Osoba 2']);
    expect(search('za_t')).toEqual(['Osoba 2']);
    expect(search('%')).toEqual(['Osoba 2']);
    expect(search('nema-ovoga')).toEqual([]);
  });

  it('status email obaveštenja, čitanje i brisanje', () => {
    const store = createStore(openTestDatabase());
    const id = store.contacts.insert(contact(1));

    expect(store.contacts.get(id)).toMatchObject({
      privacyConsent: true,
      privacyPolicyVersion: '2026-10-01',
      emailStatus: 'pending',
    });
    store.contacts.setEmailStatus(id, 'failed');
    expect(store.contacts.get(id)?.emailStatus).toBe('failed');

    expect(store.contacts.delete(id)).toBe(true);
    expect(store.contacts.get(id)).toBeNull();
    expect(store.contacts.delete(id)).toBe(false);
  });
});

describe('saglasnosti za kolačiće', () => {
  it('upis, lista i zbir po izboru', () => {
    const store = createStore(openTestDatabase());
    const add = (id: string, decision: 'all' | 'necessary', minute: number) =>
      store.cookieConsents.insert({
        id,
        createdAt: new Date(Date.UTC(2026, 9, 1, 9, minute)),
        decision,
        categories: decision === 'all' ? ['necessary', 'analytics'] : ['necessary'],
        policyVersion: '2026-10-01',
        ipAnonymized: '203.0.113.0',
        userAgent: 'Mozilla/5.0',
      });
    add('00000000-0000-4000-8000-000000000001', 'all', 1);
    add('00000000-0000-4000-8000-000000000002', 'necessary', 2);
    add('00000000-0000-4000-8000-000000000003', 'necessary', 3);

    const page = store.cookieConsents.list({ page: 1, pageSize: 25 });

    expect(page.summary).toEqual({ total: 3, all: 1, necessary: 2 });
    expect(page.items[0]).toEqual({
      id: '00000000-0000-4000-8000-000000000003',
      createdAt: '2026-10-01T09:03:00.000Z',
      decision: 'necessary',
      categories: ['necessary'],
      policyVersion: '2026-10-01',
      ipAnonymized: '203.0.113.0',
      userAgent: 'Mozilla/5.0',
    });
  });
});

describe('administratorske sesije', () => {
  it('važe do isteka; istekle se brišu', () => {
    const store = createStore(openTestDatabase());
    const created = new Date('2026-10-01T08:00:00Z');
    const expires = new Date('2026-10-01T16:00:00Z');
    store.sessions.create('hash-1', 'admin', created, expires);

    expect(store.sessions.find('hash-1', new Date('2026-10-01T15:59:59Z'))).toBe('admin');
    expect(store.sessions.find('hash-1', expires)).toBeNull();
    expect(store.sessions.find('nepoznat', created)).toBeNull();

    store.sessions.purgeExpired(new Date('2026-10-02T00:00:00Z'));
    expect(store.sessions.find('hash-1', created)).toBeNull();
  });
});
