import { useState } from 'react';

import { ADMIN_PAGE_SIZE } from '../../shared/admin';
import type { CookieDecision } from '../../shared/consent';
import { adminApi } from './api';
import { formatDateTime } from './format';
import { Badge, ErrorMessage, Pagination } from './ui';
import { useAdminQuery } from './useAdminQuery';

const DECISION: Record<CookieDecision, { label: string; tone: 'green' | 'slate' }> = {
  all: { label: 'Prihvaćeni svi', tone: 'green' },
  necessary: { label: 'Samo neophodni', tone: 'slate' },
};

export function CookieConsentsView({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useAdminQuery(
    `cookies:${page}`,
    () => adminApi.cookieConsents(page),
    onUnauthorized,
  );

  const summary = data?.summary;
  const stats = [
    { label: 'Ukupno izbora', value: summary?.total },
    { label: 'Prihvaćeni svi kolačići', value: summary?.all },
    { label: 'Samo neophodni', value: summary?.necessary },
  ];

  return (
    <div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <dt className="text-sm text-slate-600">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
              {stat.value ?? '—'}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-slate-600">
        Zapis o svakom izboru u obaveštenju o kolačićima (dokaz o datoj saglasnosti). IP adresa je
        skraćena i ne identifikuje uređaj.
      </p>

      <div className="mt-4">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!data && loading && (
          <p className="py-10 text-center text-sm text-slate-500">Učitavanje…</p>
        )}
        {data && data.items.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
            Još nema zabeleženih izbora.
          </p>
        )}
        {data && data.items.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">Zabeleženi izbori u vezi sa kolačićima</caption>
                <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Vreme
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Izbor
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Verzija politike
                    </th>
                    <th scope="col" className="px-4 py-3">
                      IP (skraćena)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Browser
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                        {formatDateTime(record.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={DECISION[record.decision].tone}>
                          {DECISION[record.decision].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">
                        {record.policyVersion}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {record.ipAnonymized}
                      </td>
                      <td
                        className="max-w-xs px-4 py-3 text-xs break-words text-slate-500"
                        title={record.id}
                      >
                        {record.userAgent || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              pageSize={data.pageSize ?? ADMIN_PAGE_SIZE}
              total={data.total}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
