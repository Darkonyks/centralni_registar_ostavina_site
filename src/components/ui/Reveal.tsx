import type { ReactNode } from 'react';

import { useInView } from '../../hooks/useInView';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Kašnjenje u milisekundama, za blago stepenasto pojavljivanje. */
  delay?: number;
}

/**
 * Diskretno pojavljivanje sadržaja ispod prvog ekrana. Stilovi su u `styles/index.css`
 * i ne primenjuju se uz `prefers-reduced-motion` ili bez podrške za IntersectionObserver.
 */
export function Reveal({ children, className, delay }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-reveal=""
      data-visible={inView}
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
