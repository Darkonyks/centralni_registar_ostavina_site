import { CheckCircle2 } from 'lucide-react';

import { DASHBOARD_POINTS } from '../../data/content';
import { SECTION_IDS } from '../../data/navigation';
import { DashboardMockup } from '../mockups/DashboardMockup';
import { Container } from '../ui/Container';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

export function DashboardSection() {
  return (
    <section
      id={SECTION_IDS.dashboard}
      aria-labelledby="pregled-naslov"
      className="relative isolate overflow-hidden bg-brand-950 py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -top-40 right-0 -z-10 h-[40rem] w-[56rem] max-w-full bg-[radial-gradient(closest-side,rgb(68_122_170/0.35),transparent)]"
      />

      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <SectionHeading
            id="pregled-naslov"
            tone="dark"
            eyebrow="Dashboard"
            title="Znate šta vas čeka pre nego što počnete da pretražujete predmete."
            description="Dashboard objedinjuje informacije koje su korisniku potrebne na početku radnog dana."
          />

          <ul className="mt-8 space-y-3">
            {DASHBOARD_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[15px] text-slate-200">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-brand-300"
                  strokeWidth={1.75}
                />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-10 border-l-2 border-amber-400/80 pl-5">
            <h3 className="text-lg font-semibold text-white">Manje traženja. Više pregleda.</h3>
            <p className="mt-2 leading-relaxed text-slate-300">
              Umesto otvaranja različitih tabela i evidencija, ključni podaci dostupni su odmah
              nakon prijave.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <DashboardMockup />
        </Reveal>
      </Container>
    </section>
  );
}
