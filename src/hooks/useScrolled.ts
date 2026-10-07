import { useCallback, useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

/** Da li je stranica skrolovana više od `threshold` piksela. Na serveru uvek `false`. */
export function useScrolled(threshold = 8): boolean {
  const getSnapshot = useCallback(() => window.scrollY > threshold, [threshold]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
