import { Mail, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ContactSubmission } from '../../shared/admin';
import { Dialog } from './Dialog';
import { formatDateTime } from './format';
import { AdminButton, ConsentBadge, EmailStatusBadge } from './ui';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[15px] break-words text-slate-900">{children}</dd>
    </div>
  );
}

interface ContactDetailDialogProps {
  contact: ContactSubmission;
  onClose: () => void;
  onDelete: () => void;
}

export function ContactDetailDialog({ contact, onClose, onDelete }: ContactDetailDialogProps) {
  const replySubject = encodeURIComponent('Re: Upit sa sajta Centralni registar ostavina');

  return (
    <Dialog
      title={`Upit #${contact.id}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <AdminButton variant="danger" onClick={onDelete}>
            <Trash2 aria-hidden="true" className="size-4" />
            Obriši upit
          </AdminButton>
          <a
            href={`mailto:${contact.email}?subject=${replySubject}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Mail aria-hidden="true" className="size-4" />
            Odgovori emailom
          </a>
        </>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Primljeno">{formatDateTime(contact.createdAt)}</Field>
        <Field label="Ime i prezime">{contact.name}</Field>
        <Field label="Kancelarija">{contact.office}</Field>
        <Field label="Email">
          <a
            href={`mailto:${contact.email}`}
            className="text-brand-800 underline underline-offset-2"
          >
            {contact.email}
          </a>
        </Field>
        <Field label="Telefon">
          <a
            href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
            className="text-brand-800 underline underline-offset-2"
          >
            {contact.phone}
          </a>
        </Field>
        <Field label="Email obaveštenje">
          <EmailStatusBadge status={contact.emailStatus} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Politika privatnosti">
            <span className="flex flex-wrap items-center gap-2">
              <ConsentBadge accepted={contact.privacyConsent} />
              {contact.privacyConsent && (
                <span className="text-sm text-slate-600">
                  {formatDateTime(contact.privacyConsentAt)}, verzija{' '}
                  {contact.privacyPolicyVersion ?? '—'}
                </span>
              )}
            </span>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Poruka">
            <span className="block rounded-lg bg-slate-50 p-4 whitespace-pre-wrap ring-1 ring-slate-200">
              {contact.message}
            </span>
          </Field>
        </div>
      </dl>
    </Dialog>
  );
}
