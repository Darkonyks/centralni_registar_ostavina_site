/**
 * Firma koja stoji iza sajta i aplikacije (pružalac usluge i rukovalac podacima).
 * Podaci su poslovna informacija dostavljena 2026-10-08; prikazuju se u footer-u,
 * u politici privatnosti i u JSON-LD-u (index.html — pri izmeni ažurirati i tamo).
 */
export const COMPANY = {
  /** Pun registrovani naziv. */
  legalName: 'Geobiz Projektovanje i izrada softvera PR Darko Nedic',
  shortName: 'Geobiz',
  street: 'Mirna 1',
  postalCode: '22000',
  city: 'Sremska Mitrovica',
  phone: '063/12-61-227',
  /** Isti broj u međunarodnom formatu, za `tel:` link. */
  phoneHref: 'tel:+381631261227',
  email: 'office@geo-biz.com',
  website: 'https://geo-biz.com/',
  websiteLabel: 'www.geo-biz.com',
  /** Matični broj. */
  registrationNumber: '63583197',
  /** Poreski identifikacioni broj. */
  taxId: '108624736',
} as const;

/** „Mirna 1, 22000 Sremska Mitrovica“ */
export const COMPANY_ADDRESS = `${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}`;
