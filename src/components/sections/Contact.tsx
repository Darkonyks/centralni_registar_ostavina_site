import { Mail } from 'lucide-react';

import { CONTACT_EMAIL } from '../../config/site';
import { SECTION_IDS } from '../../data/navigation';
import { ContactForm } from '../contact/ContactForm';
import { Container } from '../ui/Container';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

export function Contact() {
  return (
    <section
      id={SECTION_IDS.contact}
      aria-labelledby="kontakt-naslov"
      className="border-t border-slate-200/70 bg-slate-50 py-20 sm:py-28"
    >
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <SectionHeading
            id="kontakt-naslov"
            eyebrow="Kontakt"
            title="Želite da vidite kako Centralni registar ostavina može da se uklopi u vaš način rada?"
            description="Pošaljite nam osnovne podatke i vaš upit. Javićemo vam se sa dodatnim informacijama o aplikaciji, demo pristupu i korišćenju sistema."
          />

          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset"
            >
              <Mail className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Pišite nam direktno</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-base font-semibold break-all text-brand-800 underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-8">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">Pošaljite upit</h3>
            <div className="mt-2">
              <ContactForm />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
