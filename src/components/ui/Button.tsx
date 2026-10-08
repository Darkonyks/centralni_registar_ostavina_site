import { ArrowRight } from 'lucide-react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { NEW_WINDOW_ATTRS, NEW_WINDOW_LABEL } from '../../lib/newWindow';

type ButtonVariant = 'primary' | 'secondary' | 'inverse' | 'inverse-outline';
type ButtonSize = 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-white shadow-sm shadow-brand-950/10 hover:bg-brand-800 active:bg-brand-900',
  secondary:
    'bg-white text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 hover:ring-slate-400',
  inverse: 'bg-white text-brand-900 hover:bg-brand-50 focus-visible:outline-white',
  'inverse-outline':
    'text-white ring-1 ring-white/35 ring-inset hover:bg-white/10 hover:ring-white/60 focus-visible:outline-white',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

interface ButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Strelica posle teksta, za glavni poziv na akciju. */
  withArrow?: boolean;
  /** Otvara link u novom prozoru/tabu (Demo i Aplikacija), uz napomenu za čitače ekrana. */
  newWindow?: boolean;
}

/** Link stilizovan kao dugme. Sve akcije na sajtu vode na druge adrese, pa je element uvek `<a>`. */
export function Button({
  href,
  children,
  variant = 'primary',
  size = 'md',
  withArrow = false,
  newWindow = false,
  className,
  ...rest
}: ButtonProps) {
  return (
    <a
      href={href}
      {...(newWindow && NEW_WINDOW_ATTRS)}
      className={cx(
        'group inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors duration-150',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
      {newWindow && <span className="sr-only">{NEW_WINDOW_LABEL}</span>}
      {withArrow && (
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-150 motion-safe:group-hover:translate-x-0.5"
        />
      )}
    </a>
  );
}
