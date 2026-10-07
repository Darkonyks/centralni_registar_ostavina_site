import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { ADMIN_GENERIC_ERROR } from '../../shared/admin';
import { LogoMark } from '../components/ui/LogoMark';
import { adminApi, ApiError } from './api';
import { AdminButton, ErrorMessage } from './ui';

interface LoginViewProps {
  onLogin: (username: string) => void;
  /** Poruka pri povratku na prijavu (npr. istekla sesija). */
  notice?: string;
}

const INPUT =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 hover:border-slate-400 focus:border-brand-600 focus-visible:outline-offset-0';

export function LoginView({ onLogin, notice }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username || !password) {
      setError('Unesite korisničko ime i lozinku.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await adminApi.login(username, password);
      onLogin(result.username);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : ADMIN_GENERIC_ERROR);
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-12" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Centralni registar ostavina</p>
            <p className="text-xs text-slate-500">Administracija sajta</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-xl font-semibold text-slate-900">Prijava</h1>
          {notice && !error && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
              {notice}
            </p>
          )}
          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium text-slate-800">
              Korisničko ime
            </label>
            <input
              id="admin-username"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={`mt-1.5 ${INPUT}`}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-800">
              Lozinka
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`mt-1.5 ${INPUT}`}
            />
          </div>
          <div aria-live="polite">{error && <ErrorMessage>{error}</ErrorMessage>}</div>
          <AdminButton type="submit" variant="primary" disabled={submitting} className="w-full">
            <LogIn aria-hidden="true" className="size-4" />
            {submitting ? 'Prijava...' : 'Prijavi se'}
          </AdminButton>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <a href="/" className="underline underline-offset-2 hover:text-slate-800">
            Nazad na sajt
          </a>
        </p>
      </div>
    </main>
  );
}
