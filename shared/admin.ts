/** Tipovi administratorskog API-ja (`/api/admin/*`), zajednički za server i admin aplikaciju. */

import type { CookieDecision } from './consent.ts';

export type EmailStatus = 'pending' | 'sent' | 'failed';

export interface ContactSubmission {
  id: number;
  /** ISO 8601, UTC. */
  createdAt: string;
  name: string;
  office: string;
  email: string;
  phone: string;
  message: string;
  privacyConsent: boolean;
  privacyConsentAt: string | null;
  privacyPolicyVersion: string | null;
  emailStatus: EmailStatus;
}

export interface CookieConsentRecord {
  id: string;
  createdAt: string;
  decision: CookieDecision;
  categories: string[];
  policyVersion: string;
  ipAnonymized: string;
  userAgent: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CookieConsentSummary {
  total: number;
  all: number;
  necessary: number;
}

export type CookieConsentPage = Page<CookieConsentRecord> & { summary: CookieConsentSummary };

export interface AdminSession {
  authenticated: true;
  username: string;
}

export const ADMIN_PAGE_SIZE = 25;
export const ADMIN_LOGIN_ERROR = 'Pogrešno korisničko ime ili lozinka.';
export const ADMIN_GENERIC_ERROR = 'Zahtev trenutno nije moguće izvršiti.';
