import { DAILY_WORK, LIFECYCLE_STEPS } from '../../data/content';
import { SECTION_IDS } from '../../data/navigation';
import { cx } from '../../lib/cx';
import { Container } from '../ui/Container';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

export function Lifecycle() {
  return (
    <section
      id={SECTION_IDS.lifecycle}
      aria-labelledby="tok-predmeta-naslov"
      className="py-20 sm:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="tok-predmeta-naslov"
            align="center"
            eyebrow="Svakodnevni rad"
            title="Od evidentiranja do arhive"
            description="Predmet ostaje u jedinstvenoj evidenciji tokom celog svog životnog ciklusa."
          />
        </Reveal>

        <Reveal className="mt-14 lg:mt-16">
          <ol className="grid gap-8 lg:grid-cols-5 lg:gap-6">
            {LIFECYCLE_STEPS.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className={cx(
                  'relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center',
                  // Linija do sledećeg koraka: vertikalna na mobilnom, horizontalna na desktopu.
                  'not-last:after:absolute not-last:after:bg-brand-200',
                  'not-last:after:top-14 not-last:after:-bottom-6 not-last:after:left-[calc(1.5rem-0.5px)] not-last:after:w-px',
                  'lg:not-last:after:top-[calc(1.5rem-0.5px)] lg:not-last:after:right-[calc(-50%+0.5rem)] lg:not-last:after:bottom-auto lg:not-last:after:left-[calc(50%+2rem)] lg:not-last:after:h-px lg:not-last:after:w-auto',
                )}
              >
                <span
                  aria-hidden="true"
                  className="relative grid size-12 shrink-0 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-brand-200"
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="pt-1 lg:mt-5 lg:pt-0">
                  <p className="text-xs font-semibold text-brand-600 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600 lg:mx-auto lg:max-w-[14rem]">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-16 lg:mt-20">
          <ul className="grid divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 md:grid-cols-3 md:divide-x md:divide-y-0">
            {DAILY_WORK.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4 p-6">
                <Icon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-brand-700"
                  strokeWidth={1.75}
                />
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
