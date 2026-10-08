/**
 * Primer podataka za ilustrativne prikaze interfejsa (mockupe). Nisu statistika
 * niti stvarni predmeti.
 */

export interface MockKpi {
  label: string;
  value: string;
  hint: string;
}

export const MOCK_KPIS: readonly MockKpi[] = [
  { label: 'Aktivni predmeti', value: '128', hint: 'u radu' },
  { label: 'Ročišta danas', value: '3', hint: 'zakazana' },
  { label: 'Ove nedelje', value: '11', hint: 'ročišta' },
  { label: 'Ovog meseca', value: '37', hint: 'ročišta' },
];

export interface MockHearing {
  caseNumber: string;
  internalNumber: string;
  day: string;
  time: string;
  today: boolean;
}

export const MOCK_HEARINGS: readonly MockHearing[] = [
  {
    caseNumber: 'O 412/2026',
    internalNumber: '2026-118',
    day: 'Danas',
    time: '09:30',
    today: true,
  },
  {
    caseNumber: 'O 387/2026',
    internalNumber: '2026-104',
    day: 'Danas',
    time: '11:00',
    today: true,
  },
  {
    caseNumber: 'O 455/2026',
    internalNumber: '2026-131',
    day: 'Danas',
    time: '13:15',
    today: true,
  },
  {
    caseNumber: 'O 298/2026',
    internalNumber: '2026-087',
    day: 'Sreda',
    time: '10:00',
    today: false,
  },
];

export interface MockWeekDay {
  label: string;
  count: number;
  today?: boolean;
}

export const MOCK_WEEK: readonly MockWeekDay[] = [
  { label: 'Pon', count: 2 },
  { label: 'Uto', count: 3, today: true },
  { label: 'Sre', count: 2 },
  { label: 'Čet', count: 3 },
  { label: 'Pet', count: 1 },
];

export const MOCK_ROLE = {
  name: 'Operater',
  permissions: [
    { label: 'Pregled predmeta', allowed: true },
    { label: 'Unos predmeta', allowed: true },
    { label: 'Izmena predmeta', allowed: true },
    { label: 'Zakazivanje ročišta', allowed: true },
    { label: 'Brisanje predmeta', allowed: false },
    { label: 'Upravljanje korisnicima', allowed: false },
  ],
} as const;

export interface MockAuditEntry {
  action: string;
  subject: string;
  role: string;
  time: string;
}

export const MOCK_AUDIT: readonly MockAuditEntry[] = [
  { action: 'Izmenjen datum ročišta', subject: 'O 412/2026', role: 'Operater', time: '10:42' },
  { action: 'Dodata napomena', subject: 'O 387/2026', role: 'Operater', time: '09:15' },
  { action: 'Predmet arhiviran', subject: 'O 201/2026', role: 'Administrator', time: 'juče' },
];
