import { APP_URLS } from '../../config/site';
import { SECTION_IDS } from '../../data/navigation';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { Reveal } from '../ui/Reveal';

export function FinalCta() {
  return (
    <section aria-labelledby="cta-naslov" className="py-20 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl bg-brand-800 px-6 py-14 text-center sm:px-12 sm:py-16 lg:py-20">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] mask-[radial-gradient(ellipse_70%_70%_at_50%_0%,black,transparent_80%)] bg-size-[48px_48px]"
            />
            <h2
              id="cta-naslov"
              className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl sm:leading-[1.15]"
            >
              Pogledajte kako izgleda rad sa centralizovanom evidencijom
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-pretty text-brand-100">
              Isprobajte demo okruženje Centralnog registra ostavina ili nam pošaljite upit sa
              pitanjima o uvođenju i korišćenju sistema.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href={APP_URLS.demo} newWindow variant="inverse" size="lg" withArrow>
                Pogledaj demo
              </Button>
              <Button href={`#${SECTION_IDS.contact}`} variant="inverse-outline" size="lg">
                Pošalji upit
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
