import grbSrbija from '../../assets/images/grb-srbija.svg';
import { cx } from '../../lib/cx';

interface LogoMarkProps {
  /** Visina znaka (npr. `h-10`); širina sledi iz proporcije grba. */
  className?: string;
}

/**
 * Znak sistema: grb Srbije (isti kao u aplikaciji). Ukrasni element – naziv sistema stoji
 * odmah pored, pa je `alt` prazan. Fajl je optimizovana verzija `grb-srbija.svg` (SVGO).
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <img
      src={grbSrbija}
      alt=""
      // Proporcija grba (33 × 63), da prostor bude rezervisan pre učitavanja slike.
      width={33}
      height={63}
      decoding="async"
      className={cx('w-auto shrink-0 select-none', className)}
      draggable={false}
    />
  );
}
