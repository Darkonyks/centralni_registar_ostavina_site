import { LogOut } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { LogoMark } from '../components/ui/LogoMark';
import { cx } from '../lib/cx';
import { adminApi } from './api';
import { ContactsView } from './ContactsView';
import { CookieConsentsView } from './CookieConsentsView';
import { LoginView } from './LoginView';
import { AdminButton } from './ui';

type Auth =
  | { status: 'loading' }
  | { status: 'anonymous'; notice?: string }
  | { status: 'authenticated'; username: string };

const SESSION_EXPIRED = 'Sesija je istekla. Prijavite se ponovo.';

const TABS = [
  { id: 'upiti', label: 'Upiti iz kontakt forme' },
  { id: 'kolacici', label: 'Saglasnosti za kolačiće' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function AdminApp() {
  const [auth, setAuth] = useState<Auth>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    adminApi.session().then(
      (session) => {
        if (!cancelled) setAuth({ status: 'authenticated', username: session.username });
      },
      () => {
        if (!cancelled) setAuth({ status: 'anonymous' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (auth.status === 'loading') {
    return (
      <p className="grid min-h-screen place-items-center text-sm text-slate-500" aria-live="polite">
        Učitavanje…
      </p>
    );
  }

  if (auth.status === 'anonymous') {
    return (
      <LoginView
        notice={auth.notice}
        onLogin={(username) => setAuth({ status: 'authenticated', username })}
      />
    );
  }

  return (
    <Dashboard
      username={auth.username}
      onLogout={() => setAuth({ status: 'anonymous' })}
      onUnauthorized={() => setAuth({ status: 'anonymous', notice: SESSION_EXPIRED })}
    />
  );
}

function Dashboard({
  username,
  onLogout,
  onUnauthorized,
}: {
  username: string;
  onLogout: () => void;
  onUnauthorized: () => void;
}) {
  const [tab, setTab] = useState<TabId>('upiti');
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ upiti: null, kolacici: null });

  const logout = async () => {
    try {
      await adminApi.logout();
    } finally {
      onLogout();
    }
  };

  // Strelice levo/desno menjaju karticu (WAI-ARIA tabs).
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const index = TABS.findIndex((item) => item.id === tab);
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length]!;
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <LogoMark className="h-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">Administracija</p>
              <p className="truncate text-xs text-slate-500">Centralni registar ostavina</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="hidden rounded-md px-2 text-sm text-slate-600 hover:text-slate-900 sm:block"
            >
              Sajt
            </a>
            <span className="hidden text-sm text-slate-500 sm:inline">· {username}</span>
            <AdminButton variant="ghost" onClick={() => void logout()}>
              <LogOut aria-hidden="true" className="size-4" />
              Odjava
            </AdminButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="sr-only">Administracija sajta</h1>
        <div
          role="tablist"
          aria-label="Pregled podataka"
          className="flex gap-1 border-b border-slate-200"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[item.id] = element;
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => setTab(item.id)}
              onKeyDown={onTabKeyDown}
              className={cx(
                '-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4',
                tab === item.id
                  ? 'border-brand-700 text-brand-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          className="pt-6 focus-visible:outline-offset-4"
        >
          {tab === 'upiti' ? (
            <ContactsView onUnauthorized={onUnauthorized} />
          ) : (
            <CookieConsentsView onUnauthorized={onUnauthorized} />
          )}
        </div>
      </main>
    </div>
  );
}
