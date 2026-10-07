import { createTransport, type SendMailOptions } from 'nodemailer';

import type { ContactData } from '../shared/contact.ts';
import type { SmtpConfig } from './config.ts';

export const SENDER_NAME = 'Centralni registar ostavina';
const TIME_ZONE = 'Europe/Belgrade';

export type SendMail = (message: SendMailOptions) => Promise<void>;

/** „30.09.2026. 14:05:09 (Europe/Belgrade)“ – isti zapis nezavisno od lokalizacije servera. */
export function formatReceivedAt(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day}.${parts.month}.${parts.year}. ${parts.hour}:${parts.minute}:${parts.second} (${TIME_ZONE})`;
}

/**
 * Plain-text poruka (bez HTML-a, pa nema ni HTML injection-a).
 * `from` je uvek adresa sa našeg domena; adresa korisnika ide samo u `Reply-To`.
 * Polja su već normalizovana (jedan red, bez kontrolnih znakova), pa ne mogu ubaciti zaglavlja.
 */
export function buildContactEmail(
  data: ContactData,
  options: {
    from: string;
    to: string;
    receivedAt: Date;
    /** Broj upita u bazi (administracija). */
    id: number;
    /** Verzija politike privatnosti koju je korisnik prihvatio. */
    privacyPolicyVersion: string;
  },
): SendMailOptions {
  const text = [
    'Novi upit sa sajta Centralni registar ostavina',
    '',
    'Ime i prezime:',
    data.name,
    '',
    'Kancelarija:',
    data.office,
    '',
    'Email:',
    data.email,
    '',
    'Telefon:',
    data.phone,
    '',
    'Poruka:',
    data.message,
    '',
    'Vreme prijema:',
    formatReceivedAt(options.receivedAt),
    '',
    'Saglasnost sa politikom privatnosti:',
    `Da (verzija ${options.privacyPolicyVersion})`,
    '',
    'Broj upita u administraciji:',
    String(options.id),
    '',
  ].join('\n');

  return {
    from: { name: SENDER_NAME, address: options.from },
    to: options.to,
    replyTo: { name: data.name, address: data.email },
    subject: `Upit sa sajta Centralni registar ostavina – ${data.name}`,
    text,
    // Bez HTML verzije i bez praćenja; poruka ide samo interno na kontakt adresu.
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

export function createSmtpSender(smtp: SmtpConfig): SendMail {
  const transporter = createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    requireTLS: !smtp.secure && smtp.requireTls,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password ?? '' } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return async (message) => {
    await transporter.sendMail(message);
  };
}
