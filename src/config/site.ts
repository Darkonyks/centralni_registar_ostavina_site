/**
 * Centralna konfiguracija sajta. Svi Demo/Aplikacija linkovi koriste APP_URLS;
 * URL-ovi se ne upisuju direktno u komponente.
 *
 * Za staging ili lokalni rad vrednosti se mogu zameniti preko env promenljivih
 * VITE_DEMO_URL i VITE_APP_URL (vidi README.md).
 */
export const APP_URLS = {
  demo: import.meta.env.VITE_DEMO_URL || 'https://demo.registarostavina.rs',
  app: import.meta.env.VITE_APP_URL || 'https://app.registarostavina.rs',
} as const;

export const SITE = {
  name: 'Centralni registar ostavina',
  url: 'https://registarostavina.rs',
} as const;

/** Javna kontakt adresa prikazana na sajtu (mailto linkovi). Primalac poruka iz forme je serverska promenljiva CONTACT_RECIPIENT_EMAIL. */
export const CONTACT_EMAIL = 'kontakt@registarostavina.rs';

/**
 * Javni Turnstile site key (nije tajna; ugrađuje se u JS pri build-u).
 * Secret key postoji isključivo na serveru (TURNSTILE_SECRET_KEY).
 */
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
