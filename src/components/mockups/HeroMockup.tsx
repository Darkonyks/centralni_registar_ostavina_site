import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  CalendarDays,
  FolderOpen,
  LayoutDashboard,
  Lock,
  Search,
  UsersRound,
} from 'lucide-react';

import { MOCK_HEARINGS, MOCK_KPIS } from '../../data/mockup';
import { cx } from '../../lib/cx';
import { LogoMark } from '../ui/LogoMark';

const SIDEBAR_ITEMS: ReadonlyArray<{ icon: LucideIcon; label: string; active?: boolean }> = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: FolderOpen, label: 'Predmeti' },
  { icon: CalendarDays, label: 'Ročišta' },
  { icon: Archive, label: 'Arhiva' },
  { icon: UsersRound, label: 'Korisnici' },
];

/** Ilustracija dashboard-a u prozoru aplikacije. Nije snimak ekrana stvarnog sistema. */
export function HeroMockup() {
  return (
    <figure className="relative mx-auto w-full max-w-2xl lg:max-w-none">
      <div
        role="img"
        aria-label="Ilustracija dashboarda: broj aktivnih predmeta, ročišta danas, ove nedelje i ovog meseca, sa listom predstojećih ročišta."
        className="@container overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_32px_64px_-24px_rgb(14_34_54/0.28)] ring-1 ring-slate-900/[0.03]"
      >
        {/* Traka prozora */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex w-12 shrink-0 gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
            <Lock className="size-3 shrink-0" strokeWidth={2} />
            <span className="truncate">app.registarostavina.rs</span>
          </div>
          <div className="w-12 shrink-0" />
        </div>

        <div className="flex">
          {/* Bočni meni – samo kada ima dovoljno mesta */}
          <div className="hidden w-40 shrink-0 border-r border-slate-100 bg-slate-50/70 p-3 @xl:block">
            <div className="flex items-center gap-2 px-2 pt-1 pb-4">
              <LogoMark className="h-7" />
              <span className="text-xs font-semibold text-slate-900">Registar</span>
            </div>
            <ul className="space-y-0.5">
              {SIDEBAR_ITEMS.map(({ icon: Icon, label, active }) => (
                <li
                  key={label}
                  className={cx(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                    active
                      ? 'bg-white font-semibold text-brand-800 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500',
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={2} />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="@container/main min-w-0 flex-1 p-4 @md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-slate-500">Pregled</p>
                <p className="text-sm font-semibold text-slate-900">Dashboard</p>
              </div>
              <div className="hidden w-44 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-500 @md/main:flex">
                <Search className="size-3.5" strokeWidth={2} />
                Pretraga predmeta…
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 @lg/main:grid-cols-4">
              {MOCK_KPIS.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] leading-tight font-medium text-slate-500">
                    {kpi.label}
                  </p>
                  <p className="mt-1.5 text-xl font-semibold text-slate-900 tabular-nums">
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-900">Predstojeća ročišta</p>
                <span className="text-[11px] font-medium text-brand-700">Prikaži sve</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {MOCK_HEARINGS.map((hearing) => (
                  <li key={hearing.caseNumber} className="flex items-center gap-3 px-3 py-2.5">
                    <div
                      className={cx(
                        'w-14 shrink-0 border-l-2 pl-2',
                        hearing.today ? 'border-amber-400' : 'border-slate-200',
                      )}
                    >
                      <p
                        className={cx(
                          'text-[11px] font-medium',
                          hearing.today ? 'text-amber-800' : 'text-slate-500',
                        )}
                      >
                        {hearing.day}
                      </p>
                      <p className="text-xs font-semibold text-slate-900 tabular-nums">
                        {hearing.time}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900 tabular-nums">
                        {hearing.caseNumber}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        Interni br. {hearing.internalNumber}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-800 ring-1 ring-brand-100">
                      U toku
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-slate-500">
        Ilustrativni prikaz korisničkog interfejsa
      </figcaption>
    </figure>
  );
}
