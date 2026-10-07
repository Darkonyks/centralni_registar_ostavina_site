import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cx } from '../../lib/cx';

export interface ControlProps {
  id: string;
  className: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  /** Kratko objašnjenje ispod polja (povezano preko `aria-describedby`). */
  description?: ReactNode;
  /** Dodatak desno od opisa, samo vizuelni (npr. brojač znakova). */
  aside?: ReactNode;
  /** Renderuje kontrolu (`input`/`textarea`) sa pripremljenim id-jem, stilom i ARIA atributima. */
  children: (control: ControlProps) => ReactNode;
}

const CONTROL_BASE =
  'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-colors focus-visible:outline-offset-0';

export function FormField({ id, label, error, description, aside, children }: FormFieldProps) {
  const descriptionId = description ? `${id}-opis` : undefined;
  const errorId = error ? `${id}-greska` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
        <span aria-hidden="true" className="ml-0.5 text-red-700">
          *
        </span>
      </label>
      <div className="mt-1.5">
        {children({
          id,
          className: cx(
            CONTROL_BASE,
            error
              ? 'border-red-600 hover:border-red-700'
              : 'border-slate-300 hover:border-slate-400 focus:border-brand-600',
          ),
          'aria-invalid': Boolean(error),
          'aria-describedby': describedBy,
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      {(description || aside) && (
        <div className="mt-1.5 flex items-start justify-between gap-4 text-sm text-slate-500">
          {description ? <p id={descriptionId}>{description}</p> : <span />}
          {aside}
        </div>
      )}
    </div>
  );
}
