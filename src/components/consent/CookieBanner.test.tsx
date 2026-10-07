import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PRIVACY_POLICY_VERSION, type CookieDecision } from '../../../shared/consent';
import { openCookieSettings } from '../../lib/cookieConsent';
import { Footer } from '../layout/Footer';
import { CookieBanner } from './CookieBanner';

const ID = '00000000-0000-4000-8000-000000000001';

function setConsentCookie(decision: CookieDecision, version = PRIVACY_POLICY_VERSION) {
  document.cookie = `crs_cookie_consent=${encodeURIComponent(`${decision}.${version}.${ID}`)}; path=/`;
}

let fetchMock: ReturnType<typeof vi.fn>;

/** Lažni server: upisuje izbor (postavlja kolačić) i vraća uspeh. */
function serverAccepts() {
  fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
    const { decision } = JSON.parse(init.body as string) as { decision: CookieDecision };
    setConsentCookie(decision);
    return new Response(JSON.stringify({ success: true, decision }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

const banner = () => screen.queryByRole('region', { name: 'Kolačići' });

beforeEach(() => {
  document.cookie = 'crs_cookie_consent=; Max-Age=0; path=/';
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('obaveštenje o kolačićima', () => {
  it('prikazuje se kada izbor ne postoji, sa jednako istaknutim opcijama i linkom ka politici', () => {
    render(<CookieBanner />);

    expect(banner()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Samo neophodni' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Prihvatam sve' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Politika privatnosti' })).toHaveAttribute(
      'href',
      '#politika-privatnosti',
    );
    expect(screen.queryByRole('button', { name: 'Zatvori' })).not.toBeInTheDocument();
  });

  it.each([
    ['Samo neophodni', 'necessary'],
    ['Prihvatam sve', 'all'],
  ] as const)(
    '„%s“ šalje izbor serveru (upis u bazu) i zatvara obaveštenje',
    async (label, decision) => {
      serverAccepts();
      const user = userEvent.setup();
      render(<CookieBanner />);

      await user.click(screen.getByRole('button', { name: label }));

      await waitFor(() => expect(banner()).not.toBeInTheDocument());
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/cookie-consent');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ decision });
    },
  );

  it('ako server ne sačuva izbor, obaveštenje ostaje uz poruku o grešci', async () => {
    fetchMock.mockResolvedValue(new Response('{"success":false}', { status: 500 }));
    const user = userEvent.setup();
    render(<CookieBanner />);

    await user.click(screen.getByRole('button', { name: 'Prihvatam sve' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Izbor trenutno nije moguće sačuvati.',
    );
    expect(banner()).toBeInTheDocument();
  });

  it('ne prikazuje se kada izbor za važeću verziju politike već postoji', () => {
    setConsentCookie('necessary');
    render(<CookieBanner />);
    expect(banner()).not.toBeInTheDocument();
  });

  it('prikazuje se ponovo kada je izbor dat za staru verziju politike', () => {
    setConsentCookie('all', '2025-01-01');
    render(<CookieBanner />);
    expect(banner()).toBeInTheDocument();
  });

  it('„Podešavanja kolačića“ iz footer-a ponovo otvara izbor; Escape i „Zatvori“ ga zatvaraju', async () => {
    setConsentCookie('necessary');
    const user = userEvent.setup();
    render(
      <>
        <Footer />
        <CookieBanner />
      </>,
    );
    expect(banner()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Podešavanja kolačića' }));
    expect(banner()).toBeInTheDocument();
    expect(screen.getByText('Trenutni izbor: samo neophodni kolačići.')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(banner()).not.toBeInTheDocument();

    act(() => openCookieSettings());
    await user.click(screen.getByRole('button', { name: 'Zatvori' }));
    expect(banner()).not.toBeInTheDocument();
  });

  it('promena izbora preko podešavanja upisuje novi zapis', async () => {
    setConsentCookie('necessary');
    serverAccepts();
    const user = userEvent.setup();
    render(<CookieBanner />);

    act(() => openCookieSettings());
    await user.click(screen.getByRole('button', { name: 'Prihvatam sve' }));

    await waitFor(() => expect(banner()).not.toBeInTheDocument());
    expect(
      JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string),
    ).toEqual({
      decision: 'all',
    });
  });
});
