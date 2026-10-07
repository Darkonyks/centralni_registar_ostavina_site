import { useEffect, useEffectEvent, useState } from 'react';

import { ADMIN_GENERIC_ERROR } from '../../shared/admin';
import { ApiError } from './api';

interface QueryState<T> {
  key: string;
  data?: T;
  error?: string;
}

/**
 * Učitava podatke za dati ključ (npr. strana + pretraga). Prethodni podaci ostaju prikazani
 * dok se novi učitavaju. Odgovor 401 (istekla sesija) prosleđuje se `onUnauthorized`.
 */
export function useAdminQuery<T>(key: string, load: () => Promise<T>, onUnauthorized: () => void) {
  const [state, setState] = useState<QueryState<T> | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${key}#${reloadCount}`;
  const loadData = useEffectEvent(load);
  const handleUnauthorized = useEffectEvent(onUnauthorized);

  useEffect(() => {
    let cancelled = false;
    loadData().then(
      (data) => {
        if (!cancelled) setState({ key: requestKey, data });
      },
      (error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          handleUnauthorized();
          return;
        }
        setState((previous) => ({
          key: requestKey,
          data: previous?.data,
          error: error instanceof ApiError ? error.message : ADMIN_GENERIC_ERROR,
        }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  return {
    data: state?.data,
    error: state?.key === requestKey ? state.error : undefined,
    loading: state?.key !== requestKey,
    reload: () => setReloadCount((count) => count + 1),
  };
}
