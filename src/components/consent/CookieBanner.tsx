import { Cookie } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { PRIVACY_POLICY_ANCHOR, type CookieDecision } from '../../../shared/consent';
import { useHydrated } from '../../hooks/useHydrated';
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  currentConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  readConsentCookie,
  saveCookieConsent,
} from '../../lib/cookieConsent';

function subscribe(onChange: () => void) {
  window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
}

const DECISION_LABEL: Record<CookieDecision, string> = {
  all: 'prihvaćeni svi kolačići',
  necessary: 'samo neophodni kolačići',
};

const BUTTON =
  'inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Obaveštenje o kolačićima. Prikazuje se dok posetilac ne izabere opciju (ili kada se politika
 * promeni) i ponovo preko „Podešavanja kolačića“. Izbor se upisuje u bazu (POST /api/cookie-consent).
 * U prerenderovanom HTML-u se ne pojavljuje: o izboru zna tek browser (kolačić).
 */
export function CookieBanner() {
  const hydrated = useHydrated();
  const consent = currentConsent(useSyncExternalStore(subscribe, readConsentCookie, () => null));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState<CookieDecision | null>(null);
  const [failed, setFailed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const open = () => {
      setFailed(false);
      setSettingsOpen(true);
      // Fokus na obaveštenje, da korisnik tastature odmah može da izabere.
      requestAnimationFrame(() => panelRef.current?.focus());
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  // Escape zatvara ponovo otvorena podešavanja (samo kada izbor već postoji).
  const consentId = consent?.id;
  useEffect(() => {
    if (!settingsOpen || !consentId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen, consentId]);

  if (!hydrated || (consent && !settingsOpen)) return null;

  const choose = async (decision: CookieDecision) => {
    setSaving(decision);
    setFailed(false);
    const saved = await saveCookieConsent(decision);
    setSaving(null);
    if (saved) setSettingsOpen(false);
    else setFailed(true);
  };

  const canClose = Boolean(consent);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-labelledby="kolacici-naslov"
      aria-describedby="kolacici-opis"
      className="animate-menu-in fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-16px_rgb(15_23_42/0.35)] outline-none focus-visible:outline-2 focus-visible:outline-brand-600 sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="hidden size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset sm:grid"
        >
          <Cookie className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p id="kolacici-naslov" className="text-base font-semibold text-slate-900">
            Kolačići
          </p>
          <p id="kolacici-opis" className="mt-1 text-sm leading-relaxed text-slate-600">
            Koristimo neophodne kolačiće za rad sajta: čuvanje vašeg izbora i sigurnosnu proveru
            kontakt forme. Analitičke kolačiće trenutno ne koristimo; ako ih uvedemo, koristićemo ih
            samo uz vašu saglasnost. Više u delu{' '}
            <a
              href={`#${PRIVACY_POLICY_ANCHOR}`}
              className="font-medium text-brand-800 underline underline-offset-2"
            >
              Politika privatnosti
            </a>
            .
          </p>
          {consent && settingsOpen && (
            <p className="mt-2 text-sm text-slate-500">
              Trenutni izbor: {DECISION_LABEL[consent.decision]}.
            </p>
          )}
          {failed && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              Izbor trenutno nije moguće sačuvati. Pokušajte ponovo.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {canClose && (
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className={`${BUTTON} text-slate-700 hover:bg-slate-100`}
          >
            Zatvori
          </button>
        )}
        {/* Obe opcije su jednako istaknute. */}
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => void choose('necessary')}
          className={`${BUTTON} bg-brand-700 text-white hover:bg-brand-800`}
        >
          {saving === 'necessary' ? 'Čuvanje...' : 'Samo neophodni'}
        </button>
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => void choose('all')}
          className={`${BUTTON} bg-brand-700 text-white hover:bg-brand-800`}
        >
          {saving === 'all' ? 'Čuvanje...' : 'Prihvatam sve'}
        </button>
      </div>
    </div>
  );
}
