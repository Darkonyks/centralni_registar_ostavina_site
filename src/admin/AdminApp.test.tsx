import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContactSubmission } from '../../shared/admin';
import { AdminApp } from './AdminApp';

const CONTACTS: ContactSubmission[] = [
  {
    id: 2,
    createdAt: '2026-10-01T12:05:00.000Z',
    name: 'Jovana Jović',
    office: 'Kancelarija Jović',
    email: 'jovana@example.com',
    phone: '011 222 333',
    message: 'Prvi red\nDrugi red',
    privacyConsent: true,
    privacyConsentAt: '2026-10-01T12:05:00.000Z',
    privacyPolicyVersion: '2026-10-01',
    emailStatus: 'failed',
  },
  {
    id: 1,
    createdAt: '2026-10-01T08:00:00.000Z',
    name: 'Petar Petrović',
    office: 'Kancelarija Petrović',
    email: 'petar@example.com',
    phone: '064 123 4567',
    message: 'Zanima nas demo.',
    privacyConsent: true,
    privacyConsentAt: '2026-10-01T08:00:00.000Z',
    privacyPolicyVersion: '2026-10-01',
    emailStatus: 'sent',
  },
];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let authenticated: boolean;
let contacts: ContactSubmission[];
let fetchMock: ReturnType<typeof vi.fn>;

/** Lažni administratorski API. */
function api(url: string, init: RequestInit = {}): Response {
  const method = init.method ?? 'GET';
  const path = url.split('?')[0];
  if (path === '/api/admin/login') {
    const { password } = JSON.parse(init.body as string) as { password: string };
    if (password !== 'tacna-lozinka') {
      return json(401, { success: false, message: 'Pogrešno korisničko ime ili lozinka.' });
    }
    authenticated = true;
    return json(200, { success: true, username: 'admin' });
  }
  if (path === '/api/admin/logout') {
    authenticated = false;
    return json(200, { success: true });
  }
  if (!authenticated) return json(401, { success: false, message: 'Prijava je istekla.' });
  if (path === '/api/admin/session') return json(200, { authenticated: true, username: 'admin' });
  if (path === '/api/admin/contacts') {
    return json(200, { items: contacts, total: contacts.length, page: 1, pageSize: 25 });
  }
  const match = /^\/api\/admin\/contacts\/(\d+)$/.exec(path ?? '');
  if (match && method === 'DELETE') {
    contacts = contacts.filter((contact) => contact.id !== Number(match[1]));
    return json(200, { success: true });
  }
  if (path === '/api/admin/cookie-consents') {
    return json(200, {
      items: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          createdAt: '2026-10-01T09:00:00.000Z',
          decision: 'necessary',
          categories: ['necessary'],
          policyVersion: '2026-10-01',
          ipAnonymized: '203.0.113.0',
          userAgent: 'TestBrowser/1.0',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
      summary: { total: 7, all: 4, necessary: 3 },
    });
  }
  return json(404, { success: false, message: 'Nije pronađeno.' });
}

beforeEach(() => {
  authenticated = false;
  contacts = [...CONTACTS];
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => api(url, init));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function loginAs(user: ReturnType<typeof userEvent.setup>, password = 'tacna-lozinka') {
  await user.type(await screen.findByLabelText('Korisničko ime'), 'admin');
  await user.type(screen.getByLabelText('Lozinka'), password);
  await user.click(screen.getByRole('button', { name: 'Prijavi se' }));
}

describe('administracija', () => {
  it('bez sesije prikazuje prijavu; pogrešna lozinka daje grešku', async () => {
    const user = userEvent.setup();
    render(<AdminApp />);

    expect(await screen.findByRole('heading', { name: 'Prijava' })).toBeInTheDocument();
    await loginAs(user, 'pogresna');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Pogrešno korisničko ime ili lozinka.',
    );
    expect(screen.getByLabelText('Lozinka')).toHaveValue('');
  });

  it('posle prijave prikazuje sve upite i da li je prihvaćena politika privatnosti', async () => {
    const user = userEvent.setup();
    render(<AdminApp />);
    await loginAs(user);

    const table = await screen.findByRole('table', { name: 'Primljeni upiti iz kontakt forme' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Jovana Jović');
    expect(rows[0]).toHaveTextContent('Kancelarija Jović');
    expect(rows[0]).toHaveTextContent('jovana@example.com');
    expect(rows[0]).toHaveTextContent('Prihvaćena');
    expect(rows[0]).toHaveTextContent('v2026-10-01');
    expect(rows[0]).toHaveTextContent('Nije poslato');
    expect(rows[1]).toHaveTextContent('Petar Petrović');
    expect(rows[1]).toHaveTextContent('Poslato');
    expect(screen.getByText('Ukupno upita: 2')).toBeInTheDocument();
  });

  it('detalji upita sa saglasnošću i brisanje uz potvrdu', async () => {
    const user = userEvent.setup();
    render(<AdminApp />);
    await loginAs(user);

    const [details] = await screen.findAllByRole('button', {
      name: 'Detalji upita #2 (Jovana Jović)',
    });
    await user.click(details!);

    const dialog = screen.getByRole('dialog', { name: 'Upit #2' });
    expect(dialog).toHaveTextContent('Prvi red');
    expect(dialog).toHaveTextContent('Prihvaćena');
    expect(dialog).toHaveTextContent('verzija 2026-10-01');
    expect(within(dialog).getByRole('link', { name: 'Odgovori emailom' })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:jovana@example.com'),
    );

    await user.click(within(dialog).getByRole('button', { name: 'Obriši upit' }));
    const confirm = screen.getByRole('dialog', { name: 'Brisanje upita' });
    expect(confirm).toHaveTextContent('biće trajno obrisan');
    await user.click(within(confirm).getByRole('button', { name: 'Obriši trajno' }));

    expect(await screen.findByText('Upit #2 je obrisan.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/contacts/2',
      expect.objectContaining({ method: 'DELETE' }),
    );
    await waitFor(() => expect(screen.queryByText('Jovana Jović')).not.toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('odustajanje od brisanja ne briše upit', async () => {
    const user = userEvent.setup();
    render(<AdminApp />);
    await loginAs(user);

    const [details] = await screen.findAllByRole('button', { name: /Detalji upita #1/ });
    await user.click(details!);
    await user.click(screen.getByRole('button', { name: 'Obriši upit' }));
    await user.click(screen.getByRole('button', { name: 'Odustani' }));

    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/admin/contacts/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(screen.queryByRole('dialog', { name: 'Brisanje upita' })).not.toBeInTheDocument();
  });

  it('kartica sa saglasnostima za kolačiće prikazuje zbir i zapise', async () => {
    const user = userEvent.setup();
    render(<AdminApp />);
    await loginAs(user);
    await screen.findByRole('table', { name: 'Primljeni upiti iz kontakt forme' });

    await user.click(screen.getByRole('tab', { name: 'Saglasnosti za kolačiće' }));

    const table = await screen.findByRole('table', {
      name: 'Zabeleženi izbori u vezi sa kolačićima',
    });
    expect(table).toHaveTextContent('Samo neophodni');
    expect(table).toHaveTextContent('203.0.113.0');
    expect(screen.getByText('Ukupno izbora').nextSibling).toHaveTextContent('7');
    expect(screen.getByText('Prihvaćeni svi kolačići').nextSibling).toHaveTextContent('4');
  });

  it('istekla sesija vraća na prijavu uz obaveštenje; odjava radi', async () => {
    const user = userEvent.setup();
    authenticated = true;
    render(<AdminApp />);
    await screen.findByRole('table', { name: 'Primljeni upiti iz kontakt forme' });

    await user.click(screen.getByRole('button', { name: 'Odjava' }));
    expect(await screen.findByRole('heading', { name: 'Prijava' })).toBeInTheDocument();
    expect(authenticated).toBe(false);

    await loginAs(user);
    await screen.findByRole('table', { name: 'Primljeni upiti iz kontakt forme' });
    authenticated = false; // sesija istekla na serveru
    await user.click(screen.getByRole('tab', { name: 'Saglasnosti za kolačiće' }));

    expect(await screen.findByText('Sesija je istekla. Prijavite se ponovo.')).toBeInTheDocument();
  });
});
