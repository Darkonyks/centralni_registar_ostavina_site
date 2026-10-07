import { BENEFITS } from '../../data/content';
import { SECTION_IDS } from '../../data/navigation';
import { Container } from '../ui/Container';
import { FeatureCard } from '../ui/FeatureCard';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

export function Benefits() {
  return (
    <section
      id={SECTION_IDS.benefits}
      aria-labelledby="prednosti-naslov"
      className="border-t border-slate-200/70 bg-slate-50 py-20 sm:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="prednosti-naslov"
            eyebrow="Prednosti"
            title="Jedna evidencija umesto više nepovezanih tabela"
            description="Centralni registar ostavina zamenjuje lokalne Excel evidencije jedinstvenim sistemom. Svi ovlašćeni korisnici rade nad istim, ažurnim podacima."
          />
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
          {BENEFITS.map((benefit, index) => (
            <li key={benefit.title}>
              <Reveal delay={index * 70} className="h-full">
                <FeatureCard {...benefit} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
