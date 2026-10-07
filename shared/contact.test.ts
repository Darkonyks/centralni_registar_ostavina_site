import { describe, expect, it } from 'vitest';

import {
  CONTACT_MAX_LENGTH,
  isValidEmail,
  isValidPhone,
  normalizeLine,
  normalizeMultiline,
  validateContactInput,
} from './contact.ts';
import { PRIVACY_POLICY_VERSION } from './consent.ts';
import { formatThousands } from './format.ts';

const VALID = {
  name: 'Petar Petrović',
  office: 'Kancelarija Petrović',
  email: 'petar@example.com',
  phone: '+381 64 123 4567',
  message: 'Zanima nas demo pristup.',
};

const CONSENT = { privacyConsent: true, privacyPolicyVersion: PRIVACY_POLICY_VERSION };

describe('validateContactInput', () => {
  it('prihvata ispravan unos i trimuje razmake', () => {
    const result = validateContactInput({
      ...VALID,
      ...CONSENT,
      name: '   Petar   Petrović  ',
      message: '\n  Prvi pasus.\r\n\r\nDrugi pasus.  \n',
    });
    expect(result).toEqual({
      ok: true,
      data: { ...VALID, message: 'Prvi pasus.\n\nDrugi pasus.' },
    });
  });

  it('bez saglasnosti sa politikom privatnosti upit nije ispravan', () => {
    for (const consent of [undefined, false, 'true', 1]) {
      const result = validateContactInput({ ...VALID, privacyConsent: consent });
      expect(result).toEqual({
        ok: false,
        errors: {
          privacyConsent: 'Za slanje upita potrebno je da prihvatite politiku privatnosti.',
        },
      });
    }
  });

  it('saglasnost za drugu verziju politike nije važeća', () => {
    const result = validateContactInput({
      ...VALID,
      ...CONSENT,
      privacyPolicyVersion: '2025-01-01',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.privacyConsent).toMatch(/izmenjena/);
  });

  it('prijavljuje sva prazna obavezna polja, i ono što sadrži samo razmake', () => {
    const result = validateContactInput({ name: '   ', office: '', email: '', phone: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      ['email', 'message', 'name', 'office', 'phone', 'privacyConsent'].sort(),
    );
  });

  it('polja koja nisu string tretira kao prazna', () => {
    const result = validateContactInput({ ...VALID, ...CONSENT, name: 42, email: ['a@b.rs'] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({
      name: 'Unesite ime i prezime.',
      email: 'Unesite email adresu.',
    });
  });

  it('odbija nevažeći payload (null, niz, string)', () => {
    for (const payload of [null, [], 'tekst', 5]) {
      expect(validateContactInput(payload).ok).toBe(false);
    }
  });

  // [polje, vrednost tačno na granici, vrednost jedan znak duža]
  const limits: Array<[keyof typeof CONTACT_MAX_LENGTH, string, string]> = [
    ['name', 'x'.repeat(150), 'x'.repeat(151)],
    ['office', 'x'.repeat(200), 'x'.repeat(201)],
    [
      'email',
      `${'a'.repeat(64)}@${'b'.repeat(185)}.com`,
      `${'a'.repeat(64)}@${'b'.repeat(186)}.com`,
    ],
    ['phone', '1'.repeat(50), '1'.repeat(51)],
    ['message', 'x'.repeat(5000), 'x'.repeat(5001)],
  ];

  it.each(limits)('poštuje maksimalnu dužinu polja %s', (field, atLimit, tooLong) => {
    expect(atLimit).toHaveLength(CONTACT_MAX_LENGTH[field]);
    expect(validateContactInput({ ...VALID, ...CONSENT, [field]: atLimit }).ok).toBe(true);

    const result = validateContactInput({ ...VALID, ...CONSENT, [field]: tooLong });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual({
        [field]: `Dozvoljeno je najviše ${formatThousands(CONTACT_MAX_LENGTH[field])} znakova.`,
      });
    }
  });
});

describe('email', () => {
  it.each(['petar@example.com', 'p.petrovic+upit@kancelarija.co.rs', 'ime@šumadija.rs'])(
    'prihvata %s',
    (email) => expect(isValidEmail(email)).toBe(true),
  );

  it.each([
    'petar',
    'petar@',
    'petar@example',
    '@example.com',
    'petar@@example.com',
    'petar example@example.com',
    '.petar@example.com',
    'pe..tar@example.com',
    'a@b.com, c@d.com',
    '<a@b.com>',
    `${'a'.repeat(65)}@example.com`,
  ])('odbija %s', (email) => expect(isValidEmail(email)).toBe(false));
});

describe('telefon', () => {
  it.each([
    '+381641234567',
    '064 123 4567',
    '064/123-45-67',
    '+381 (0)64 123-4567',
    '011 3224-555',
  ])('prihvata %s', (phone) => expect(isValidPhone(phone)).toBe(true));

  it.each(['abc', '12345', 'pozovite me', '064 123 4567 ext'])('odbija %s', (phone) =>
    expect(isValidPhone(phone)).toBe(false),
  );
});

describe('normalizacija', () => {
  it('jedan red: uklanja prelome i kontrolne znakove (zaštita zaglavlja email-a)', () => {
    expect(normalizeLine('Petar\r\nBcc: napadac@example.com')).toBe(
      'Petar Bcc: napadac@example.com',
    );
    expect(normalizeLine('a\u0000b\u0007c\td')).toBe('a b c d');
  });

  it('više redova: zadržava prelome, uklanja ostale kontrolne znakove', () => {
    expect(normalizeMultiline('Red 1\r\nRed 2\rRed 3\u0000\u001b[31m')).toBe(
      'Red 1\nRed 2\nRed 3[31m',
    );
  });
});

describe('formatThousands', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [2500, '2.500'],
    [30000, '30.000'],
    [1234567, '1.234.567'],
  ])('%i → %s', (value, expected) => expect(formatThousands(value)).toBe(expected));
});
