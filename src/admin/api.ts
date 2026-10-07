import {
  ADMIN_GENERIC_ERROR,
  type AdminSession,
  type ContactSubmission,
  type CookieConsentPage,
  type Page,
} from '../../shared/admin';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ApiError(0, 'Server trenutno nije dostupan. Proverite vezu i pokušajte ponovo.');
  }
  const data = (await response.json().catch(() => null)) as (T & { message?: unknown }) | null;
  if (!response.ok || data === null) {
    const message = typeof data?.message === 'string' ? data.message : ADMIN_GENERIC_ERROR;
    throw new ApiError(response.status, message);
  }
  return data;
}

export const adminApi = {
  session: () => request<AdminSession>('/api/admin/session'),
  login: (username: string, password: string) =>
    request<{ success: true; username: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ success: true }>('/api/admin/logout', { method: 'POST' }),
  contacts: (page: number, query: string) =>
    request<Page<ContactSubmission>>(
      `/api/admin/contacts?page=${page}&q=${encodeURIComponent(query)}`,
    ),
  deleteContact: (id: number) =>
    request<{ success: true }>(`/api/admin/contacts/${id}`, { method: 'DELETE' }),
  cookieConsents: (page: number) =>
    request<CookieConsentPage>(`/api/admin/cookie-consents?page=${page}`),
};
