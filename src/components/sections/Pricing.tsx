import { CalendarCheck, Gift, Info, UsersRound } from 'lucide-react';

import { formatThousands } from '../../../shared/format';
import { SECTION_IDS } from '../../data/navigation';
import {
  BILLING_PERIODS,
  effectiveMonthly,
  FREE_TRIAL,
  FREE_TRIAL_MONTHS,
  periodSavings,
  periodTotal,
  PRICING_NOTE,
  PRICING_TIERS,
  PRICING_VAT_NOTE,
  type BillingPeriodId,
} from '../../data/pricing';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

/**
 * Cena za izabrani način plaćanja se prikazuje preko CSS `:has()` (radio dugmad), pa izbor radi
 * i pre učitavanja JavaScript-a, a svi iznosi su u prerenderovanom HTML-u. Klase moraju biti
 * napisane doslovno da bi ih Tailwind pronašao. Mesečna cena je vidljiva i u browser-u bez `:has()`.
 */
const PERIOD_VISIBILITY: Record<BillingPeriodId, string> = {
  mesecno:
    'group-has-[#placanje-6-meseci:checked]/cenovnik:hidden group-has-[#placanje-12-meseci:checked]/cenovnik:hidden',
  '6-meseci': 'hidden group-has-[#placanje-6-meseci:checked]/cenovnik:block',
  '12-meseci': 'hidden group-has-[#placanje-12-meseci:checked]/cenovnik:block',
};

export function Pricing() {
  return (
    <section
      id={SECTION_IDS.pricing}
      aria-labelledby="cenovnik-naslov"
      className="group/cenovnik py-20 sm:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="cenovnik-naslov"
            align="center"
            eyebrow="Cenovnik"
            title="Jednostavan cenovnik prema broju korisnika"
            description="Cena zavisi od broja korisnika koji rade u sistemu. Pretplata se može plaćati mesečno, a uplatom unapred ostvarujete popust do 20%."
          />
        </Reveal>

        {/* Besplatan period: istaknut iznad paketa, da ga posetilac vidi pre cena. */}
        <Reveal className="mt-10 lg:mt-12">
          <div className="relative isolate overflow-hidden rounded-2xl bg-brand-800 p-6 shadow-[0_24px_48px_-24px_rgb(14_34_54/0.55)] sm:p-7">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_120%_at_0%_50%,rgb(251_191_36/0.18),transparent_70%)]"
            />
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-7">
              <div
                aria-hidden="true"
                className="flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-amber-400 text-brand-950 shadow-lg shadow-amber-950/20"
              >
                <span className="text-4xl leading-none font-bold tabular-nums">
                  {FREE_TRIAL_MONTHS}
                </span>
                <span className="mt-1 text-xs font-semibold tracking-wide uppercase">meseca</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300">
                  <Gift aria-hidden="true" className="size-4" strokeWidth={2} />
                  Besplatan početak
                </p>
                <h3
                  id="besplatni-period"
                  className="mt-1 text-2xl font-semibold tracking-tight text-balance text-white sm:text-[1.75rem]"
                >
                  {FREE_TRIAL.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-pretty text-brand-100">
                  {FREE_TRIAL.description}
                </p>
              </div>
              <Button
                href={`#${SECTION_IDS.contact}`}
                variant="inverse"
                size="lg"
                withArrow
                className="w-full md:w-auto md:shrink-0"
                aria-label="Pošalji upit – prva tri meseca besplatno"
              >
                Pošalji upit
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-10">
          <fieldset className="mx-auto max-w-2xl">
            <legend className="w-full text-center text-sm font-medium text-slate-600">
              Izaberite način plaćanja
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 ring-inset">
              {BILLING_PERIODS.map((period) => (
                <label key={period.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="nacin-placanja"
                    id={`placanje-${period.id}`}
                    value={period.id}
                    defaultChecked={period.id === 'mesecno'}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-12 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-center text-sm font-semibold text-slate-600 transition-colors peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow-sm peer-checked:ring-1 peer-checked:ring-slate-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600 hover:text-slate-900 sm:flex-row sm:gap-2 sm:whitespace-nowrap">
                    {period.months === 1 ? period.label : `${period.label} unapred`}
                    {period.discountPercent > 0 && ' '}
                    {period.discountPercent > 0 && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                        <span className="sr-only">popust</span> −{period.discountPercent}%
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Reveal>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PRICING_TIERS.map((tier, index) => (
            <li key={tier.users}>
              <Reveal delay={index * 70} className="h-full">
                <article
                  aria-label={tier.users}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition duration-200 hover:border-slate-300 hover:shadow-[0_12px_32px_-12px_rgb(15_34_54/0.18)]"
                >
                  <h3 className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                    <span
                      aria-hidden="true"
                      className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset"
                    >
                      <UsersRound className="size-4" strokeWidth={1.75} />
                    </span>
                    {tier.users}
                  </h3>

                  {BILLING_PERIODS.map((period) => (
                    <div
                      key={period.id}
                      data-period={period.id}
                      className={PERIOD_VISIBILITY[period.id]}
                    >
                      {/* Red iznad cene: redovna cena i popust (prazan, iste visine, za mesečno). */}
                      <p className="mt-6 flex h-6 items-center gap-2 text-sm">
                        {period.discountPercent > 0 && (
                          <>
                            <span className="font-medium text-slate-500 tabular-nums">
                              <span className="sr-only">Redovna cena:</span>{' '}
                              <s>{formatThousands(tier.monthly)} RSD</s>
                            </span>{' '}
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                              <span className="sr-only">popust</span> −{period.discountPercent}%
                            </span>
                          </>
                        )}
                      </p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
                          {formatThousands(effectiveMonthly(tier, period))}
                        </span>{' '}
                        <span className="text-lg font-semibold text-slate-900">RSD</span>{' '}
                        <span className="text-sm font-medium text-slate-500">/ mesečno</span>
                      </p>
                      {period.months === 1 ? (
                        <p className="mt-2 min-h-10 text-sm text-slate-600">Mesečna pretplata</p>
                      ) : (
                        <p className="mt-2 min-h-10 text-sm text-slate-600">
                          <span className="block font-semibold text-slate-800 tabular-nums">
                            {`${formatThousands(periodTotal(tier, period))} RSD za ${period.months} meseci`}
                          </span>
                          <span className="block font-medium text-emerald-700 tabular-nums">
                            {`Ušteda ${formatThousands(periodSavings(tier, period))} RSD`}
                          </span>
                        </p>
                      )}

                      <p className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-600">
                        <CalendarCheck
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-brand-600"
                          strokeWidth={1.75}
                        />
                        {period.note}
                      </p>
                    </div>
                  ))}

                  <div className="mt-auto pt-6">
                    <Button
                      href={`#${SECTION_IDS.contact}`}
                      variant="secondary"
                      className="w-full"
                      aria-label={`Pošalji upit – ${tier.users}`}
                    >
                      Pošalji upit
                    </Button>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal>
          <div className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-sm leading-relaxed text-slate-600">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <div>
              <p>{PRICING_NOTE}</p>
              <p className="mt-1 font-medium text-slate-700">{PRICING_VAT_NOTE}</p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
