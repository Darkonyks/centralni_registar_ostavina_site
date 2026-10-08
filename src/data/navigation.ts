import { APP_URLS } from '../config/site';

/** Id-jevi (anchor-i) sekcija javne stranice. */
export const SECTION_IDS = {
  benefits: 'prednosti',
  dashboard: 'pregled',
  lifecycle: 'tok-predmeta',
  access: 'bezbednost',
  pricing: 'cenovnik',
  contact: 'kontakt',
} as const;

export interface NavLink {
  label: string;
  href: string;
  /** Otvara se u novom prozoru (aplikacija i demo su zasebni sajtovi). */
  newWindow?: boolean;
}

/** Glavna navigacija (sekcija „Kontrolisan pristup“ namerno nije u meniju). */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Prednosti', href: `#${SECTION_IDS.benefits}` },
  { label: 'Pregled', href: `#${SECTION_IDS.dashboard}` },
  { label: 'Tok predmeta', href: `#${SECTION_IDS.lifecycle}` },
  { label: 'Cenovnik', href: `#${SECTION_IDS.pricing}` },
  { label: 'Kontakt', href: `#${SECTION_IDS.contact}` },
];

/** Linkovi u footer-u (pored „Politika privatnosti“ i „Podešavanja kolačića“). */
export const FOOTER_LINKS: readonly NavLink[] = [
  { label: 'Demo', href: APP_URLS.demo, newWindow: true },
  { label: 'Aplikacija', href: APP_URLS.app, newWindow: true },
];
