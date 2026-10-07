import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Pricing } from './Pricing';

/** Zadati cenovnik: mesečno; 6 meseci unapred −10%; 12 meseci unapred −20%. */
const EXPECTED = [
  {
    users: '1–5 korisnika',
    monthly: '1.500',
    six: { total: '8.100', perMonth: '1.350', savings: '900' },
    twelve: { total: '14.400', perMonth: '1.200', savings: '3.600' },
  },
  {
    users: '6–10 korisnika',
    monthly: '2.500',
    six: { total: '13.500', perMonth: '2.250', savings: '1.500' },
    twelve: { total: '24.000', perMonth: '2.000', savings: '6.000' },
  },
  {
    users: '11–15 korisnika',
    monthly: '3.500',
    six: { total: '18.900', perMonth: '3.150', savings: '2.100' },
    twelve: { total: '33.600', perMonth: '2.800', savings: '8.400' },
  },
  {
    users: '16+ korisnika',
    monthly: '4.500',
    six: { total: '24.300', perMonth: '4.050', savings: '2.700' },
    twelve: { total: '43.200', perMonth: '3.600', savings: '10.800' },
  },
];

const period = (card: HTMLElement, id: string) =>
  card.querySelector<HTMLElement>(`[data-period="${id}"]`)!;

describe('Cenovnik', () => {
  it('četiri paketa sa tačnim iznosima za mesečno, 6 i 12 meseci unapred', () => {
    render(<Pricing />);

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(4);

    EXPECTED.forEach((tier, index) => {
      const card = cards[index]!;
      expect(card).toHaveAccessibleName(tier.users);
      expect(within(card).getByRole('heading', { level: 3 })).toHaveTextContent(tier.users);

      const monthly = period(card, 'mesecno');
      expect(monthly).toHaveTextContent(`${tier.monthly} RSD / mesečno`);
      expect(monthly).toHaveTextContent('Plaća se svakog meseca.');

      const six = period(card, '6-meseci');
      expect(six).toHaveTextContent(`Redovna cena: ${tier.monthly} RSD popust −10%`);
      expect(six).toHaveTextContent(`${tier.six.perMonth} RSD / mesečno`);
      expect(six).toHaveTextContent(`${tier.six.total} RSD za 6 meseci`);
      expect(six).toHaveTextContent(`Ušteda ${tier.six.savings} RSD`);
      expect(six).toHaveTextContent('Plaća se jednom, za 6 meseci unapred.');

      const twelve = period(card, '12-meseci');
      expect(twelve).toHaveTextContent(`Redovna cena: ${tier.monthly} RSD popust −20%`);
      expect(twelve).toHaveTextContent(`${tier.twelve.perMonth} RSD / mesečno`);
      expect(twelve).toHaveTextContent(`${tier.twelve.total} RSD za 12 meseci`);
      expect(twelve).toHaveTextContent(`Ušteda ${tier.twelve.savings} RSD`);
      expect(twelve).toHaveTextContent('Plaća se jednom, za 12 meseci unapred.');
    });
  });

  it('izbor načina plaćanja: tri opcije, mesečno je podrazumevano, radi i tastaturom', async () => {
    const user = userEvent.setup();
    render(<Pricing />);

    const group = screen.getByRole('group', { name: 'Izaberite način plaćanja' });
    const options = within(group).getAllByRole('radio');
    expect(options).toHaveLength(3);
    expect(within(group).getByRole('radio', { name: 'Mesečno' })).toBeChecked();
    expect(
      within(group).getByRole('radio', { name: '6 meseci unapred popust −10%' }),
    ).not.toBeChecked();

    await user.click(within(group).getByRole('radio', { name: 'Mesečno' }));
    await user.keyboard('{ArrowRight}');
    expect(
      within(group).getByRole('radio', { name: '6 meseci unapred popust −10%' }),
    ).toBeChecked();
    await user.click(within(group).getByText('12 meseci unapred'));
    expect(
      within(group).getByRole('radio', { name: '12 meseci unapred popust −20%' }),
    ).toBeChecked();
  });

  it('svaki paket ima „Pošalji upit“ koji vodi na kontakt formu', () => {
    render(<Pricing />);

    const links = screen
      .getAllByRole('article')
      .map((card) => within(card).getByRole('link', { name: /^Pošalji upit/ }));
    expect(links).toHaveLength(4);
    for (const link of links) expect(link).toHaveAttribute('href', '#kontakt');
    expect(links[0]).toHaveAccessibleName('Pošalji upit – 1–5 korisnika');
  });

  it('ima napomene o popustima i PDV-u, bez oznaka „najpopularnije“', () => {
    const { container } = render(<Pricing />);

    expect(
      screen.getByText(
        'Mesečna pretplata se plaća svakog meseca. Uplatom za 6 meseci unapred ostvaruje se popust od 10%, a uplatom za 12 meseci unapred popust od 20%.',
      ),
    ).toBeInTheDocument();
    expect(document.getElementById('cenovnik')).toBeInTheDocument();
    expect(
      screen.getByText('Nismo obveznik PDV-a, pa se PDV na prikazane cene ne obračunava.'),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/popularn|preporuč|basic|professional|\+ PDV/i);
  });

  it('istaknuto prikazuje da su prva tri meseca besplatna, pre paketa', () => {
    render(<Pricing />);

    const heading = screen.getByRole('heading', {
      level: 3,
      name: 'Prva tri meseca potpuno besplatno',
    });
    const banner = heading.closest('div.rounded-2xl') as HTMLElement;
    expect(banner).toHaveTextContent(
      'Korišćenje aplikacije je prva tri meseca potpuno besplatno, bez obzira na broj korisnika.',
    );
    // Obaveštenje je u DOM-u pre prve kartice (vidi se pre cena).
    const firstCard = screen.getAllByRole('article')[0]!;
    expect(
      banner.compareDocumentPosition(firstCard) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(banner).getByRole('link', { name: 'Pošalji upit – prva tri meseca besplatno' }),
    ).toHaveAttribute('href', '#kontakt');
  });
});
