import { Check } from 'lucide-react';

import { APP_URLS } from '../../config/site';
import { HERO_POINTS } from '../../data/content';
import { HeroMockup } from '../mockups/HeroMockup';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';

export function Hero() {
  return (
    <section aria-labelledby="hero-naslov" className="relative isolate overflow-hidden">
      {/* Diskretna mreža i blagi ton iza mockupa */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(15_23_42/0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42/0.045)_1px,transparent_1px)] mask-[radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent_75%)] bg-size-[56px_56px]"
      />
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 -z-10 h-[36rem] w-[48rem] max-w-full bg-[radial-gradient(closest-side,var(--color-brand-100),transparent)] opacity-70"
      />

      <Container className="grid items-center gap-12 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:grid-cols-2 lg:gap-14 lg:pt-20 lg:pb-24 xl:gap-16">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[13px] font-medium text-brand-800">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-600" />
            Evidencija ostavinskih predmeta
          </p>

          {/* Od sm širine svaka rečenica počinje u novom redu. */}
          <h1
            id="hero-naslov"
            className="mt-6 text-[2.25rem] leading-[1.1] font-semibold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.08] lg:text-[2.5rem] xl:text-[3.125rem]"
          >
            <span className="sm:block">Svi ostavinski predmeti.</span>{' '}
            <span className="sm:block">Jedno mesto.</span>{' '}
            <span className="text-brand-700 sm:block">Potpuna preglednost.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-slate-600 sm:text-xl sm:leading-relaxed">
            Centralizovana evidencija predmeta, ročišta i važnih rokova koja omogućava da u svakom
            trenutku znate šta je završeno, šta predstoji i šta zahteva vašu pažnju.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={APP_URLS.app} size="lg" withArrow>
              Otvori aplikaciju
            </Button>
            <Button href={APP_URLS.demo} size="lg" variant="secondary">
              Pogledaj demo
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
            {HERO_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-slate-600">
                <Check aria-hidden="true" className="size-4 text-brand-600" strokeWidth={2.5} />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <HeroMockup />
      </Container>
    </section>
  );
}
