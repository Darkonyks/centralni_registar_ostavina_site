import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` u prerenderovanom HTML-u i tokom hidratacije, `true` čim React preuzme stranicu.
 * Koristi se za elemente koji rade tek uz JavaScript (npr. slanje forme).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
