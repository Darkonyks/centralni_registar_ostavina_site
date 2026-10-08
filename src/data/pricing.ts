/**
 * Cenovnik — izvor istine za sve iznose na sajtu.
 *
 * Upisuju se samo mesečna cena paketa i popust po načinu plaćanja; iznos za period,
 * efektivna mesečna cena i ušteda se računaju, da se nikada ne raziđu.
 */

export type BillingPeriodId = 'mesecno' | '6-meseci' | '12-meseci';

export interface BillingPeriod {
  id: BillingPeriodId;
  label: string;
  months: number;
  discountPercent: number;
  /** Napomena na kartici paketa. */
  note: string;
}

export const BILLING_PERIODS: readonly BillingPeriod[] = [
  {
    id: 'mesecno',
    label: 'Mesečno',
    months: 1,
    discountPercent: 0,
    note: 'Plaća se svakog meseca.',
  },
  {
    id: '6-meseci',
    label: '6 meseci',
    months: 6,
    discountPercent: 10,
    note: 'Plaća se jednom, za 6 meseci unapred.',
  },
  {
    id: '12-meseci',
    label: '12 meseci',
    months: 12,
    discountPercent: 20,
    note: 'Plaća se jednom, za 12 meseci unapred.',
  },
];

export interface PricingTier {
  /** Naziv paketa prema broju korisnika (bez komercijalnih naziva). */
  users: string;
  /** Osnovna mesečna cena u RSD. */
  monthly: number;
}

export const PRICING_TIERS: readonly PricingTier[] = [
  { users: '1–5 korisnika', monthly: 1500 },
  { users: '6–10 korisnika', monthly: 2500 },
  { users: '11–15 korisnika', monthly: 3500 },
  { users: '16+ korisnika', monthly: 4500 },
];

/** Mesečni iznos uz popust za izabrani način plaćanja. */
export function effectiveMonthly(tier: PricingTier, period: BillingPeriod): number {
  return (tier.monthly * (100 - period.discountPercent)) / 100;
}

/** Ukupan iznos za ceo period (plaća se jednom, unapred). */
export function periodTotal(tier: PricingTier, period: BillingPeriod): number {
  return effectiveMonthly(tier, period) * period.months;
}

/** Ušteda u odnosu na mesečno plaćanje za isti broj meseci. */
export function periodSavings(tier: PricingTier, period: BillingPeriod): number {
  return tier.monthly * period.months - periodTotal(tier, period);
}

export const FREE_TRIAL_MONTHS = 3;

export const FREE_TRIAL = {
  title: 'Prva tri meseca potpuno besplatno',
  description:
    'Korišćenje aplikacije je prva tri meseca potpuno besplatno, bez obzira na broj korisnika.',
} as const;

export const PRICING_NOTE =
  'Mesečna pretplata se plaća svakog meseca. Uplatom za 6 meseci unapred ostvaruje se popust od 10%, a uplatom za 12 meseci unapred popust od 20%.';

export const PRICING_VAT_NOTE = 'Nismo obveznik PDV-a, pa se PDV na prikazane cene ne obračunava.';
