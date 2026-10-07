import { CheckCircle2, CircleAlert, Send } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';

import {
  CONTACT_FIELDS,
  CONTACT_MAX_LENGTH,
  HONEYPOT_FIELD,
  validateContactInput,
  type ContactData,
  type ContactField,
  type ContactFieldErrors,
} from '../../../shared/contact';
import {
  PRIVACY_CONSENT_FIELD,
  PRIVACY_POLICY_ANCHOR,
  PRIVACY_POLICY_VERSION,
  PRIVACY_VERSION_FIELD,
} from '../../../shared/consent';
import { formatThousands } from '../../../shared/format';
import { CONTACT_EMAIL, TURNSTILE_SITE_KEY } from '../../config/site';
import { useHydrated } from '../../hooks/useHydrated';
import { submitContact } from '../../lib/contactApi';
import { cx } from '../../lib/cx';
import { FormField } from './FormField';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TurnstileWidget, type TurnstileHandle } from './TurnstileWidget';

const EMPTY: ContactData = { name: '', office: '', email: '', phone: '', message: '' };

const INPUTS: ReadonlyArray<{
  name: Exclude<ContactField, 'message'>;
  label: string;
  type: 'text' | 'email' | 'tel';
  autoComplete: string;
}> = [
  { name: 'name', label: 'Ime i prezime', type: 'text', autoComplete: 'name' },
  { name: 'office', label: 'Kancelarija', type: 'text', autoComplete: 'organization' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Broj telefona', type: 'tel', autoComplete: 'tel' },
];

export const SUCCESS_MESSAGE = 'Hvala. Vaš upit je uspešno poslat.';
const TURNSTILE_PENDING = 'Sačekajte da se sigurnosna provera završi, pa ponovo pošaljite upit.';
const TURNSTILE_FAILED = 'Sigurnosna provera nije uspela. Osvežite stranicu i pokušajte ponovo.';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const fieldId = (field: ContactField) => `kontakt-${field}`;
const CONSENT_ID = 'kontakt-saglasnost';
const CONSENT_ERROR_ID = 'kontakt-saglasnost-greska';
const POLICY_HEADING_ID = 'politika-privatnosti-naslov';

interface ContactFormProps {
  /** Javni Turnstile ključ; podrazumevano iz VITE_TURNSTILE_SITE_KEY. */
  turnstileSiteKey?: string;
}

export function ContactForm({ turnstileSiteKey = TURNSTILE_SITE_KEY }: ContactFormProps) {
  const hydrated = useHydrated();
  const [values, setValues] = useState<ContactData>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [turnstileMessage, setTurnstileMessage] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const submitting = status === 'submitting';
  const configured = turnstileSiteKey !== '';

  /** Polja forme + saglasnost, u obliku koji proverava i server. */
  const toInput = (data: ContactData, accepted: boolean) => ({
    ...data,
    [PRIVACY_CONSENT_FIELD]: accepted,
    [PRIVACY_VERSION_FIELD]: PRIVACY_POLICY_VERSION,
  });

  // Posle prvog pokušaja slanja poruke uz polja se osvežavaju dok korisnik kuca.
  const revalidate = (data: ContactData, accepted: boolean) => {
    if (!attempted) return;
    const result = validateContactInput(toInput(data, accepted));
    setErrors(result.ok ? {} : result.errors);
  };

  const updateField = (field: ContactField, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    revalidate(next, consent);
  };

  const updateConsent = (accepted: boolean) => {
    setConsent(accepted);
    revalidate(values, accepted);
  };

  const handleToken = (next: string | null) => {
    setToken(next);
    if (next) setTurnstileMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setAttempted(true);

    const result = validateContactInput(toInput(values, consent));
    if (!result.ok) {
      setErrors(result.errors);
      const first = CONTACT_FIELDS.find((field) => result.errors[field]);
      document.getElementById(first ? fieldId(first) : CONSENT_ID)?.focus();
      return;
    }
    setErrors({});

    if (!token) {
      setTurnstileMessage(TURNSTILE_PENDING);
      return;
    }

    setStatus('submitting');
    const outcome = await submitContact({
      ...toInput(result.data, consent),
      turnstileToken: token,
      [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
    });

    // Token je jednokratan: posle svakog pokušaja traži se novi.
    setToken(null);
    turnstileRef.current?.reset();

    if (outcome.ok) {
      setValues(EMPTY);
      setConsent(false);
      setAttempted(false);
      setStatus('success');
    } else {
      if (outcome.fieldErrors) setErrors(outcome.fieldErrors);
      setStatus('error');
    }
  };

  return (
    <form
      method="post"
      action="/api/contact"
      noValidate
      onSubmit={handleSubmit}
      aria-describedby="kontakt-napomena"
      className="relative"
    >
      <p id="kontakt-napomena" className="text-sm text-slate-500">
        Sva polja su obavezna.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {INPUTS.map((input) => (
          <FormField
            key={input.name}
            id={fieldId(input.name)}
            label={input.label}
            error={errors[input.name]}
          >
            {(control) => (
              <input
                {...control}
                name={input.name}
                type={input.type}
                autoComplete={input.autoComplete}
                required
                maxLength={CONTACT_MAX_LENGTH[input.name]}
                value={values[input.name]}
                onChange={(event) => updateField(input.name, event.target.value)}
              />
            )}
          </FormField>
        ))}

        <div className="sm:col-span-2">
          <FormField
            id={fieldId('message')}
            label="Poruka"
            error={errors.message}
            description={`Najviše ${formatThousands(CONTACT_MAX_LENGTH.message)} znakova.`}
            aside={
              <span aria-hidden="true" className="shrink-0 tabular-nums">
                {formatThousands(values.message.length)} /{' '}
                {formatThousands(CONTACT_MAX_LENGTH.message)}
              </span>
            }
          >
            {(control) => (
              <textarea
                {...control}
                name="message"
                rows={7}
                required
                maxLength={CONTACT_MAX_LENGTH.message}
                value={values.message}
                onChange={(event) => updateField('message', event.target.value)}
                className={cx(control.className, 'min-h-40 resize-y')}
              />
            )}
          </FormField>
        </div>
      </div>

      {/* Zamka za botove: nevidljivo polje koje ljudi ne popunjavaju. */}
      <div aria-hidden="true" className="absolute -left-[10000px] size-px overflow-hidden">
        <label htmlFor="kontakt-website">Ovo polje ostavite prazno</label>
        <input
          ref={honeypotRef}
          id="kontakt-website"
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {/* Politika privatnosti i saglasnost: bez označenog polja upit se ne šalje (proverava i server). */}
      <div className="mt-6">
        {/* tabIndex: tekst u skrolabilnom okviru mora moći da se pomera tastaturom (WCAG 2.1.1). */}
        <div
          id={PRIVACY_POLICY_ANCHOR}
          role="region"
          aria-labelledby={POLICY_HEADING_ID}
          tabIndex={0}
          className="max-h-64 scroll-mt-24 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <PrivacyPolicy headingId={POLICY_HEADING_ID} />
        </div>

        <div className="mt-4 flex items-start gap-3">
          <input
            id={CONSENT_ID}
            name={PRIVACY_CONSENT_FIELD}
            type="checkbox"
            required
            checked={consent}
            onChange={(event) => updateConsent(event.target.checked)}
            aria-invalid={Boolean(errors.privacyConsent)}
            aria-describedby={errors.privacyConsent ? CONSENT_ERROR_ID : undefined}
            className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-slate-400 accent-brand-700"
          />
          <label
            htmlFor={CONSENT_ID}
            className="cursor-pointer text-sm leading-relaxed text-slate-800"
          >
            Prihvatam politiku privatnosti i dajem saglasnost za prikupljanje i obradu podataka iz
            ove forme u navedene svrhe.
            <span aria-hidden="true" className="ml-0.5 text-red-700">
              *
            </span>
          </label>
        </div>
        {errors.privacyConsent && (
          <p id={CONSENT_ERROR_ID} className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {errors.privacyConsent}
          </p>
        )}
      </div>

      <div className="mt-6">
        {configured ? (
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            onToken={handleToken}
            onError={() => setTurnstileMessage(TURNSTILE_FAILED)}
          />
        ) : (
          <p className="text-sm text-slate-600">
            Slanje forme trenutno nije dostupno. Pišite nam na{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-brand-700 underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        )}
        {turnstileMessage && (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {turnstileMessage}
          </p>
        )}
      </div>

      <noscript>
        <p className="mt-4 text-sm text-slate-600">
          Za slanje forme potreban je JavaScript. Možete nam pisati i direktno na {CONTACT_EMAIL}.
        </p>
      </noscript>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={!hydrated || submitting || !configured}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-6 text-base font-semibold text-white shadow-sm shadow-brand-950/10 transition-colors hover:bg-brand-800 active:bg-brand-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700 disabled:shadow-none"
        >
          {submitting ? 'Slanje...' : 'Pošalji upit'}
          {!submitting && <Send aria-hidden="true" className="size-4" />}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {status === 'success' && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {SUCCESS_MESSAGE}
          </p>
        )}
        {status === 'error' && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              Poruku trenutno nije moguće poslati. Pokušajte ponovo ili nam pišite na{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </span>
          </p>
        )}
      </div>
    </form>
  );
}
