import type { LucideIcon } from 'lucide-react';
import { CalendarCheck, CalendarDays, CalendarRange, FolderOpen } from 'lucide-react';

import { MOCK_HEARINGS, MOCK_KPIS, MOCK_WEEK } from '../../data/mockup';
import { cx } from '../../lib/cx';

const KPI_ICONS: readonly LucideIcon[] = [FolderOpen, CalendarCheck, CalendarRange, CalendarDays];

const TODAY = MOCK_HEARINGS.filter((hearing) => hearing.today);
const WEEK_MAX = Math.max(...MOCK_WEEK.map((day) => day.count));

/** Ilustracija dnevnog i nedeljnog pregleda na dashboard-u. Nije snimak ekrana stvarnog sistema. */
export function DashboardMockup() {
  return (
    <figure className="w-full">
      <div
        role="img"
        aria-label="Ilustracija dashboarda: kartice Aktivni predmeti, Ročišta danas, Ove nedelje i Ovog meseca, raspored ročišta za danas i pregled tekuće nedelje po danima."
        className="@container rounded-2xl bg-white p-4 shadow-[0_40px_80px_-32px_rgb(0_0_0/0.55)] ring-1 ring-white/10 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Dashboard</p>
            <p className="text-xs text-slate-500">Pregled obaveza</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            Danas · utorak
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 @2xl:grid-cols-4">
          {MOCK_KPIS.map((kpi, index) => {
            const Icon = KPI_ICONS[index] ?? FolderOpen;
            return (
              <div key={kpi.label} className="rounded-xl border border-slate-200 p-3 @sm:p-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
                    <Icon className="size-3.5" strokeWidth={2} />
                  </span>
                  <p className="text-[11px] leading-tight font-medium text-slate-600 @sm:text-xs">
                    {kpi.label}
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{kpi.hint}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 @xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* Raspored za danas */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-900">Ročišta danas</p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
                {TODAY.length} zakazana
              </span>
            </div>
            <ol className="relative mt-4 space-y-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[calc(3.8125rem-0.5px)] before:w-px before:bg-slate-200">
              {TODAY.map((hearing) => (
                <li key={hearing.caseNumber} className="relative flex items-start gap-4">
                  <span className="w-10 shrink-0 pt-px text-right text-xs font-semibold text-slate-900 tabular-nums">
                    {hearing.time}
                  </span>
                  <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full border-2 border-white bg-amber-400 ring-1 ring-amber-300" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-slate-900 tabular-nums">
                      {hearing.caseNumber}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Ročište · interni br. {hearing.internalNumber}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tekuća nedelja */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-900">Tekuća nedelja</p>
              <span className="text-[11px] text-slate-500 tabular-nums">
                {MOCK_WEEK.reduce((sum, day) => sum + day.count, 0)} ročišta
              </span>
            </div>
            <ul className="mt-3 space-y-1">
              {MOCK_WEEK.map((day) => (
                <li
                  key={day.label}
                  className={cx(
                    'flex items-center gap-3 rounded-md px-2 py-1.5',
                    day.today && 'bg-brand-50',
                  )}
                >
                  <span
                    className={cx(
                      'w-8 text-[11px] font-medium',
                      day.today ? 'text-brand-800' : 'text-slate-500',
                    )}
                  >
                    {day.label}
                  </span>
                  <span className="flex flex-1 gap-1">
                    {Array.from({ length: WEEK_MAX }, (_, slot) => (
                      <span
                        key={slot}
                        className={cx(
                          'h-2 flex-1 rounded-full',
                          slot < day.count
                            ? day.today
                              ? 'bg-brand-600'
                              : 'bg-brand-300'
                            : 'bg-slate-100',
                        )}
                      />
                    ))}
                  </span>
                  <span className="w-4 text-right text-xs font-semibold text-slate-900 tabular-nums">
                    {day.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-slate-400">
        Ilustrativni prikaz korisničkog interfejsa
      </figcaption>
    </figure>
  );
}
