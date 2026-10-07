import type { ButtonHTMLAttributes, ReactNode } from 'react';

import type { EmailStatus } from '../../shared/admin';
import { cx } from '../lib/cx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'bg-white text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-50',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  ghost: 'text-slate-700 hover:bg-slate-100',
};

export function AdminButton({
  variant = 'secondary',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}

type Tone = 'green' | 'amber' | 'red' | 'slate' | 'brand';

const TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-800 ring-red-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-100',
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function ConsentBadge({ accepted }: { accepted: boolean }) {
  return accepted ? (
    <Badge tone="green">Prihvaćena</Badge>
  ) : (
    <Badge tone="red">Nije prihvaćena</Badge>
  );
}

const EMAIL_STATUS: Record<EmailStatus, { label: string; tone: Tone }> = {
  sent: { label: 'Poslato', tone: 'green' },
  failed: { label: 'Nije poslato', tone: 'amber' },
  pending: { label: 'Na čekanju', tone: 'slate' },
};

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  const { label, tone } = EMAIL_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Stranice" className="flex items-center justify-between gap-4 pt-4">
      <AdminButton disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prethodna
      </AdminButton>
      <p className="text-sm text-slate-600">
        Strana {page} od {pages}
      </p>
      <AdminButton disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Sledeća
      </AdminButton>
    </nav>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200"
    >
      {children}
    </p>
  );
}
