import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ADMIN_PAGE_SIZE, type ContactSubmission } from '../../shared/admin';
import { adminApi, ApiError } from './api';
import { ContactDetailDialog } from './ContactDetailDialog';
import { Dialog } from './Dialog';
import { formatDateTime } from './format';
import { AdminButton, ConsentBadge, EmailStatusBadge, ErrorMessage, Pagination } from './ui';
import { useAdminQuery } from './useAdminQuery';

interface ContactsViewProps {
  onUnauthorized: () => void;
}

export function ContactsView({ onUnauthorized }: ContactsViewProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ContactSubmission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Pretraga kreće 300 ms posle poslednjeg otkucaja.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, error, loading, reload } = useAdminQuery(
    `contacts:${page}:${query}`,
    () => adminApi.contacts(page, query),
    onUnauthorized,
  );

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteContact(confirmDelete.id);
      setNotice(`Upit #${confirmDelete.id} je obrisan.`);
      setConfirmDelete(null);
      setSelected(null);
      reload();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) onUnauthorized();
      else setDeleteError(caught instanceof ApiError ? caught.message : 'Brisanje nije uspelo.');
    } finally {
      setDeleting(false);
    }
  };

  const items = data?.items ?? [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Pretraga upita</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pretraga: ime, kancelarija, email, telefon, poruka"
            className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 hover:border-slate-400 focus:border-brand-600 focus-visible:outline-offset-0"
          />
        </label>
        <p className="text-sm text-slate-600" aria-live="polite">
          {data ? `Ukupno upita: ${data.total}` : ''}
          {loading && data ? ' · učitavanje…' : ''}
        </p>
      </div>

      <div aria-live="polite" className="mt-3 empty:mt-0">
        {notice && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {notice}
          </p>
        )}
      </div>

      <div className="mt-4">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!data && loading && (
          <p className="py-10 text-center text-sm text-slate-500">Učitavanje…</p>
        )}
        {data && items.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
            {query ? 'Nema upita koji odgovaraju pretrazi.' : 'Još nema primljenih upita.'}
          </p>
        )}

        {items.length > 0 && (
          <>
            {/* Desktop: tabela */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Primljeni upiti iz kontakt forme</caption>
                <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Primljeno
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Ime i prezime / kancelarija
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Kontakt
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Politika privatnosti
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Obaveštenje
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">Akcije</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((contact) => (
                    <tr key={contact.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                        {formatDateTime(contact.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{contact.name}</p>
                        <p className="text-slate-600">{contact.office}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="break-all text-slate-900">{contact.email}</p>
                        <p className="text-slate-600">{contact.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <ConsentBadge accepted={contact.privacyConsent} />
                        {contact.privacyPolicyVersion && (
                          <p className="mt-1 text-xs text-slate-500">
                            v{contact.privacyPolicyVersion}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <EmailStatusBadge status={contact.emailStatus} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminButton
                          onClick={() => setSelected(contact)}
                          aria-label={`Detalji upita #${contact.id} (${contact.name})`}
                        >
                          Detalji
                        </AdminButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobilni: kartice */}
            <ul className="space-y-3 md:hidden">
              {items.map((contact) => (
                <li key={contact.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{contact.name}</p>
                      <p className="text-sm text-slate-600">{contact.office}</p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-500 tabular-nums">
                      {formatDateTime(contact.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm break-all text-slate-700">
                    {contact.email} · {contact.phone}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">Politika:</span>
                    <ConsentBadge accepted={contact.privacyConsent} />
                    <EmailStatusBadge status={contact.emailStatus} />
                  </div>
                  <AdminButton
                    className="mt-3 w-full"
                    onClick={() => setSelected(contact)}
                    aria-label={`Detalji upita #${contact.id} (${contact.name})`}
                  >
                    Detalji
                  </AdminButton>
                </li>
              ))}
            </ul>

            <Pagination
              page={data?.page ?? page}
              pageSize={data?.pageSize ?? ADMIN_PAGE_SIZE}
              total={data?.total ?? 0}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {selected && !confirmDelete && (
        <ContactDetailDialog
          contact={selected}
          onClose={() => setSelected(null)}
          onDelete={() => {
            setDeleteError(null);
            setConfirmDelete(selected);
          }}
        />
      )}

      {confirmDelete && (
        <Dialog
          title="Brisanje upita"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <AdminButton onClick={() => setConfirmDelete(null)} disabled={deleting}>
                Odustani
              </AdminButton>
              <AdminButton variant="danger" onClick={() => void handleDelete()} disabled={deleting}>
                {deleting ? 'Brisanje...' : 'Obriši trajno'}
              </AdminButton>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-slate-700">
            Upit #{confirmDelete.id} ({confirmDelete.name},{' '}
            {formatDateTime(confirmDelete.createdAt)}) biće trajno obrisan iz baze. Ova radnja se ne
            može poništiti.
          </p>
          {deleteError && (
            <div className="mt-4">
              <ErrorMessage>{deleteError}</ErrorMessage>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}
