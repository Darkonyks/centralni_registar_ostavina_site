import { PRIVACY_POLICY_ANCHOR } from '../../../shared/consent';
import { COMPANY, COMPANY_ADDRESS } from '../../config/company';
import { CONTACT_EMAIL, SITE } from '../../config/site';
import { FOOTER_LINKS } from '../../data/navigation';
import { openCookieSettings } from '../../lib/cookieConsent';
import { NEW_WINDOW_ATTRS, NEW_WINDOW_LABEL } from '../../lib/newWindow';
import { Container } from '../ui/Container';
import { BrandLink } from './BrandLink';

const FOOTER_LINK =
  'rounded-sm text-sm font-medium text-slate-700 underline-offset-4 hover:text-brand-700 hover:underline';
const COMPANY_LINK = 'text-slate-600 underline-offset-4 hover:text-brand-700 hover:underline';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <BrandLink />
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Centralizovana evidencija ostavinskih predmeta, ročišta i rokova.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Kontakt:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-brand-800 underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <nav aria-label="Linkovi u podnožju">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  {...(link.newWindow && NEW_WINDOW_ATTRS)}
                  className={FOOTER_LINK}
                >
                  {link.label}
                  {link.newWindow && <span className="sr-only">{NEW_WINDOW_LABEL}</span>}
                </a>
              </li>
            ))}
            <li>
              <a href={`#${PRIVACY_POLICY_ANCHOR}`} className={FOOTER_LINK}>
                Politika privatnosti
              </a>
            </li>
            <li>
              <button type="button" onClick={openCookieSettings} className={FOOTER_LINK}>
                Podešavanja kolačića
              </button>
            </li>
          </ul>
        </nav>
      </Container>

      <div className="border-t border-slate-200">
        <Container className="flex flex-col gap-4 py-6 md:flex-row md:items-start md:justify-between md:gap-10">
          {/* Godina se računa i pri build-u i u browser-u; na prelazu godine mogu se razlikovati. */}
          <p className="shrink-0 text-sm text-slate-500" suppressHydrationWarning>
            © {new Date().getFullYear()} {SITE.name}
          </p>

          <div className="text-sm leading-relaxed text-slate-500 md:text-right">
            <p>
              Sajt i aplikaciju razvija i održava{' '}
              <span className="font-medium text-slate-700">{COMPANY.legalName}</span>
            </p>
            <address className="not-italic">
              {COMPANY_ADDRESS} · MB: {COMPANY.registrationNumber} · PIB: {COMPANY.taxId}
              <br />
              Tel.{' '}
              <a href={COMPANY.phoneHref} className={COMPANY_LINK}>
                {COMPANY.phone}
              </a>{' '}
              ·{' '}
              <a href={`mailto:${COMPANY.email}`} className={COMPANY_LINK}>
                {COMPANY.email}
              </a>{' '}
              ·{' '}
              <a href={COMPANY.website} {...NEW_WINDOW_ATTRS} className={COMPANY_LINK}>
                {COMPANY.websiteLabel}
                <span className="sr-only">{NEW_WINDOW_LABEL}</span>
              </a>
            </address>
          </div>
        </Container>
      </div>
    </footer>
  );
}
