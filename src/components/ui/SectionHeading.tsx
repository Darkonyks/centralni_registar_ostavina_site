import type { ReactNode } from 'react';

import { cx } from '../../lib/cx';

interface SectionHeadingProps {
  /** Id naslova, za `aria-labelledby` na sekciji. */
  id: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'light',
  className,
}: SectionHeadingProps) {
  const dark = tone === 'dark';

  return (
    <div className={cx('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      <p
        className={cx(
          'inline-flex items-center gap-2 text-sm font-semibold',
          dark ? 'text-brand-200' : 'text-brand-700',
        )}
      >
        <span
          aria-hidden="true"
          className={cx('h-px w-5', dark ? 'bg-brand-300/60' : 'bg-brand-600/50')}
        />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cx(
          'mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl sm:leading-[1.15]',
          dark ? 'text-white' : 'text-slate-900',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cx(
            'mt-4 text-lg leading-relaxed text-pretty',
            dark ? 'text-slate-300' : 'text-slate-600',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
