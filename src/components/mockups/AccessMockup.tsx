import { Check, History, Minus, ShieldCheck } from 'lucide-react';

import { MOCK_AUDIT, MOCK_ROLE } from '../../data/mockup';
import { cx } from '../../lib/cx';

/** Ilustracija uloge sa privilegijama i istorije promena. Nije snimak ekrana stvarnog sistema. */
export function AccessMockup() {
  return (
    <figure className="w-full">
      <div
        role="img"
        aria-label="Ilustracija: uloga Operater sa dozvoljenim i nedozvoljenim akcijama, i istorija promena sa opisom izmene, predmetom, ulogom korisnika i vremenom."
        className="grid gap-4"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset">
              <ShieldCheck className="size-4.5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Uloga</p>
              <p className="text-sm font-semibold text-slate-900">{MOCK_ROLE.name}</p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {MOCK_ROLE.permissions.map((permission) => (
              <li
                key={permission.label}
                className={cx(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                  permission.allowed ? 'bg-slate-50 text-slate-800' : 'text-slate-500',
                )}
              >
                {permission.allowed ? (
                  <Check className="size-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
                ) : (
                  <Minus className="size-3.5 shrink-0" strokeWidth={2.5} />
                )}
                {permission.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Istorija promena</p>
            <History className="size-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <ol className="mt-4 space-y-3">
            {MOCK_AUDIT.map((entry) => (
              <li key={entry.action} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-900">{entry.action}</p>
                  <p className="truncate text-[11px] text-slate-500 tabular-nums">
                    {entry.subject} · {entry.role}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                  {entry.time}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-slate-500">
        Ilustrativni prikaz korisničkog interfejsa
      </figcaption>
    </figure>
  );
}
