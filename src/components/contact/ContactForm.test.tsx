import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TurnstileApi, TurnstileRenderOptions } from '../../lib/turnstile';
import { PRIVACY_POLICY_VERSION } from '../../../shared/consent';
import { ContactForm, SUCCESS_MESSAGE } from './ContactForm';

// Turnstile skripta se u testovima ne učitava; lažni API beleži opcije i poziva callback-ove.
vi.mock('../../lib/turnstile', () => ({
  loadTurnstile: () => Promise.resolve(window.turnstile!),
}));

const ERROR_TEXT = /Poruku trenutno nije moguće poslati\. Pokušajte ponovo ili nam pišite na/;

let widget: TurnstileRenderOptions | undefined;
let turnstile: {
  render: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};
let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function renderForm(siteKey = 'test-site-key') {
  const user = userEvent.setup();
  render(<ContactForm turnstileSiteKey={siteKey} />);
  if (siteKey) await waitFor(() => expect(turnstile.render).toHaveBeenCalled());
  return user;
}

function solveTurnstile(token = 'turnstile-token') {
  act(() => widget?.callback?.(token));
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Ime i prezime/), '  Petar Petrović ');
  await user.type(screen.getByLabelText(/Kancelarija/), 'Kancelarija Petrović');
  await user.type(screen.getByLabelText(/^Email/), 'petar@example.com');
  await user.type(screen.getByLabelText(/Broj telefona/), '+381 (0)64 123-4567');
  await user.type(screen.getByLabelText(/Poruka/), 'Zanima nas demo pristup.');
  await user.click(consentCheckbox());
}

const consentCheckbox = () =>
  screen.getByRole('checkbox', { name: /Prihvatam politiku privatnosti/ });

const submitButton = () => screen.getByRole('button', { name: /Pošalji upit|Slanje/ });

beforeEach(() => {
  widget = undefined;
  turnstile = {
    render: vi.fn((_container: HTMLElement, options: TurnstileRenderOptions) => {
      widget = options;
      return 'widget-1';
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  window.turnstile = turnstile as unknown as TurnstileApi;
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.turnstile;
});

describe('Kontakt forma – validacija', () => {
  it('prikazuje greške za prazna obavezna polja i ne šalje zahtev', async () => {
    const user = await renderForm();
    solveTurnstile();

    await user.click(submitButton());

    expect(screen.getByText('Unesite ime i prezime.')).toBeInTheDocument();
    expect(screen.getByText('Unesite naziv kancelarije.')).toBeInTheDocument();
    expect(screen.getByText('Unesite email adresu.')).toBeInTheDocument();
    expect(screen.getByText('Unesite broj telefona.')).toBeInTheDocument();
    expect(screen.getByText('Unesite poruku.')).toBeInTheDocument();
    expect(
      screen.getByText('Za slanje upita potrebno je da prihvatite politiku privatnosti.'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    const name = screen.getByLabelText(/Ime i prezime/);
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Unesite ime i prezime.');
    expect(name).toHaveFocus();
  });

  it('odbija nevalidan email', async () => {
    const user = await renderForm();
    await fillValid(user);
    const email = screen.getByLabelText(/^Email/);
    await user.clear(email);
    await user.type(email, 'petar@example');
    solveTurnstile();

    await user.click(submitButton());

    expect(screen.getByText('Unesite ispravnu email adresu.')).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ograničava dužinu polja i prijavljuje predugačak unos', async () => {
    const user = await renderForm();
    expect(screen.getByLabelText(/Ime i prezime/)).toHaveAttribute('maxlength', '150');
    expect(screen.getByLabelText(/Kancelarija/)).toHaveAttribute('maxlength', '200');
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('maxlength', '254');
    expect(screen.getByLabelText(/Broj telefona/)).toHaveAttribute('maxlength', '50');
    expect(screen.getByLabelText(/Poruka/)).toHaveAttribute('maxlength', '5000');

    await fillValid(user);
    // Zaobilazi maxlength (kao npr. unos kroz skriptu); validacija mora da uhvati prekoračenje.
    fireEvent.change(screen.getByLabelText(/Ime i prezime/), {
      target: { value: 'a'.repeat(151) },
    });
    fireEvent.change(screen.getByLabelText(/Poruka/), { target: { value: 'b'.repeat(5001) } });
    solveTurnstile();

    await user.click(submitButton());

    expect(screen.getByText('Dozvoljeno je najviše 150 znakova.')).toBeInTheDocument();
    expect(screen.getByText('Dozvoljeno je najviše 5.000 znakova.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('greške nestaju dok korisnik ispravlja polja', async () => {
    const user = await renderForm();
    await user.click(submitButton());
    expect(screen.getByText('Unesite ime i prezime.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Ime i prezime/), 'Petar');

    expect(screen.queryByText('Unesite ime i prezime.')).not.toBeInTheDocument();
    expect(screen.getByText('Unesite naziv kancelarije.')).toBeInTheDocument();
  });
});

describe('Kontakt forma – politika privatnosti', () => {
  it('prikazuje ceo tekst politike uz polje za saglasnost', async () => {
    await renderForm();

    const policy = screen.getByRole('region', { name: 'Politika privatnosti' });
    expect(policy).toHaveAttribute('id', 'politika-privatnosti');
    expect(policy).toHaveAttribute('tabindex', '0');
    expect(policy).toHaveTextContent('Rukovalac podacima');
    expect(policy).toHaveTextContent('Podaci iz kontakt forme');
    expect(policy).toHaveTextContent('Vaša prava');
    expect(policy).toHaveTextContent(`verzija ${PRIVACY_POLICY_VERSION}`);
    expect(consentCheckbox()).not.toBeChecked();
    expect(consentCheckbox()).toBeRequired();
  });

  it('bez označene saglasnosti upit se ne šalje; fokus ide na polje za saglasnost', async () => {
    const user = await renderForm();
    await fillValid(user);
    await user.click(consentCheckbox()); // poništava označavanje iz fillValid
    solveTurnstile();

    await user.click(submitButton());

    const message = 'Za slanje upita potrebno je da prihvatite politiku privatnosti.';
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(consentCheckbox()).toHaveAttribute('aria-invalid', 'true');
    expect(consentCheckbox()).toHaveAccessibleDescription(message);
    expect(consentCheckbox()).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(consentCheckbox());
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });
});

describe('Kontakt forma – slanje', () => {
  it('šalje normalizovane podatke i Turnstile token na /api/contact', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }));
    const user = await renderForm();
    await fillValid(user);
    solveTurnstile('token-123');

    await user.click(submitButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Petar Petrović',
      office: 'Kancelarija Petrović',
      email: 'petar@example.com',
      phone: '+381 (0)64 123-4567',
      message: 'Zanima nas demo pristup.',
      turnstileToken: 'token-123',
      privacyConsent: true,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      website: '',
    });
  });

  it('dugme je onemogućeno i prikazuje „Slanje...“ dok zahtev traje', async () => {
    let respond!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (respond = resolve)));
    const user = await renderForm();
    await fillValid(user);
    solveTurnstile();

    await user.click(submitButton());

    const button = submitButton();
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Slanje...');

    await act(async () => respond(jsonResponse(200, { success: true })));
    expect(submitButton()).toBeEnabled();
    expect(submitButton()).toHaveTextContent('Pošalji upit');
  });

  it('posle uspeha prikazuje potvrdu, prazni polja i resetuje Turnstile', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }));
    const user = await renderForm();
    await fillValid(user);
    solveTurnstile();

    await user.click(submitButton());

    expect(await screen.findByText(SUCCESS_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(SUCCESS_MESSAGE).closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    expect(screen.getByLabelText(/Ime i prezime/)).toHaveValue('');
    expect(screen.getByLabelText(/Kancelarija/)).toHaveValue('');
    expect(screen.getByLabelText(/^Email/)).toHaveValue('');
    expect(screen.getByLabelText(/Broj telefona/)).toHaveValue('');
    expect(screen.getByLabelText(/Poruka/)).toHaveValue('');
    expect(consentCheckbox()).not.toBeChecked();
    expect(turnstile.reset).toHaveBeenCalledWith('widget-1');

    // Token je potrošen: novo slanje čeka novu Turnstile proveru.
    await fillValid(user);
    await user.click(submitButton());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sačekajte da se sigurnosna provera završi',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(SUCCESS_MESSAGE)).toBeInTheDocument();
  });

  it('kod greške API-ja prikazuje poruku i zadržava unete podatke', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(502, { success: false, message: 'Poruku trenutno nije moguće poslati.' }),
    );
    const user = await renderForm();
    await fillValid(user);
    solveTurnstile();

    await user.click(submitButton());

    const errorText = await screen.findByText(ERROR_TEXT);
    expect(
      within(errorText).getByRole('link', { name: 'kontakt@registarostavina.rs' }),
    ).toHaveAttribute('href', 'mailto:kontakt@registarostavina.rs');
    expect(screen.getByLabelText(/Ime i prezime/)).toHaveValue('  Petar Petrović ');
    expect(screen.getByLabelText(/Poruka/)).toHaveValue('Zanima nas demo pristup.');
    expect(turnstile.reset).toHaveBeenCalled();
    expect(screen.queryByText(SUCCESS_MESSAGE)).not.toBeInTheDocument();
  });

  it('kod mrežne greške prikazuje poruku o grešci', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = await renderForm();
    await fillValid(user);
    solveTurnstile();

    await user.click(submitButton());

    expect(await screen.findByText(ERROR_TEXT)).toBeInTheDocument();
  });

  it('prikazuje greške polja koje vrati server', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        success: false,
        message: 'Poruku trenutno nije moguće poslati.',
        fieldErrors: { phone: 'Unesite ispravan broj telefona.' },
      }),
    );
    const user = await renderForm();
    await fillValid(user);
    solveTurnstile();

    await user.click(submitButton());

    expect(await screen.findByText('Unesite ispravan broj telefona.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Broj telefona/)).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Kontakt forma – Turnstile', () => {
  it('renderuje widget sa site key-em i akcijom „contact“', async () => {
    await renderForm('site-key-xyz');
    expect(widget).toMatchObject({ sitekey: 'site-key-xyz', action: 'contact' });
  });

  it('bez Turnstile tokena ne šalje zahtev', async () => {
    const user = await renderForm();
    await fillValid(user);

    await user.click(submitButton());

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sačekajte da se sigurnosna provera završi, pa ponovo pošaljite upit.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prikazuje poruku kada Turnstile prijavi grešku i ne šalje zahtev', async () => {
    const user = await renderForm();
    await fillValid(user);

    act(() => {
      widget?.['error-callback']?.('110200');
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sigurnosna provera nije uspela. Osvežite stranicu i pokušajte ponovo.',
    );
    await user.click(submitButton());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('istekao token se odbacuje', async () => {
    const user = await renderForm();
    await fillValid(user);
    solveTurnstile();
    act(() => widget?.['expired-callback']?.());

    await user.click(submitButton());

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('bez podešenog site key-a slanje je onemogućeno, a email je dostupan', async () => {
    await renderForm('');
    expect(submitButton()).toBeDisabled();
    const notice = screen.getByText(/Slanje forme trenutno nije dostupno/);
    expect(
      within(notice).getByRole('link', { name: 'kontakt@registarostavina.rs' }),
    ).toHaveAttribute('href', 'mailto:kontakt@registarostavina.rs');
  });
});

describe('Kontakt forma – pristupačnost', () => {
  it('svako polje ima pravi label, required i autocomplete', async () => {
    await renderForm();
    const expected: Array<[RegExp, string]> = [
      [/Ime i prezime/, 'name'],
      [/Kancelarija/, 'organization'],
      [/^Email/, 'email'],
      [/Broj telefona/, 'tel'],
    ];
    for (const [label, autocomplete] of expected) {
      const input = screen.getByLabelText(label);
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('autocomplete', autocomplete);
    }
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/Broj telefona/)).toHaveAttribute('type', 'tel');
    expect(screen.getByLabelText(/Poruka/).tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText(/Poruka/)).toHaveAttribute('rows', '7');
    // Honeypot nije dostupan tastaturom ni čitačima ekrana.
    expect(document.getElementById('kontakt-website')).toHaveAttribute('tabindex', '-1');
    expect(
      document.getElementById('kontakt-website')?.closest('[aria-hidden="true"]'),
    ).not.toBeNull();
  });
});
