import { ACCESS_ITEMS } from '../../data/content';
import { SECTION_IDS } from '../../data/navigation';
import { AccessMockup } from '../mockups/AccessMockup';
import { Container } from '../ui/Container';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

export function AccessControl() {
  return (
    <section
      id={SECTION_IDS.access}
      aria-labelledby="bezbednost-naslov"
      className="border-y border-slate-200/70 bg-slate-50 py-20 sm:py-28"
    >
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <SectionHeading
            id="bezbednost-naslov"
            eyebrow="Kontrolisan pristup"
            title="Informacije dostupne onima kojima su potrebne."
            description="Korisnički nalozi, uloge i privilegije omogućavaju kontrolu nad tim ko može da pregleda ili menja podatke."
          />

          <ul className="mt-10 space-y-6">
            {ACCESS_ITEMS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-slate-200"
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <AccessMockup />
        </Reveal>
      </Container>
    </section>
  );
}
