/**
 * Tekstovi sekcija javne stranice. Pravila sadržaja: PROJECT_OVERVIEW.md §3
 * (miran ton, realistične formulacije, bez izmišljenih statistika i apsolutnih tvrdnji).
 */
import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  ArrowLeftRight,
  CalendarClock,
  ClipboardList,
  Database,
  Eye,
  FilePlus2,
  Gavel,
  History,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Search,
  StickyNote,
  UserCog,
} from 'lucide-react';

export interface IconItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Kratke stavke ispod CTA dugmadi u hero sekciji. */
export const HERO_POINTS: readonly string[] = [
  'Jedna centralna baza',
  'Rokovi i ročišta na jednom mestu',
  'Kontrolisan pristup',
];

export const BENEFITS: readonly IconItem[] = [
  {
    icon: Database,
    title: 'Centralizovana evidencija',
    description:
      'Svi predmeti u jednoj bazi umesto u više tabela i na različitim računarima. Svi ovlašćeni korisnici rade nad istim podacima.',
  },
  {
    icon: CalendarClock,
    title: 'Rokovi i ročišta pod kontrolom',
    description:
      'Važni datumi i zakazana ročišta dostupni su odmah, što smanjuje mogućnost da se nešto previdi.',
  },
  {
    icon: LayoutDashboard,
    title: 'Informacije na prvi pogled',
    description:
      'Dashboard prikazuje aktivne predmete i ročišta za danas, ovu nedelju i ovaj mesec odmah posle prijave.',
  },
  {
    icon: Search,
    title: 'Brza pretraga',
    description:
      'Pretraga i filteri umesto ručnog pregledanja tabela — do traženog predmeta za nekoliko sekundi.',
  },
];

export const DASHBOARD_POINTS: readonly string[] = [
  'Broj aktivnih predmeta',
  'Ročišta zakazana za danas',
  'Pregled ročišta za tekuću nedelju i mesec',
  'Brz prelaz na predmet iz pregleda',
];

export const LIFECYCLE_STEPS: readonly IconItem[] = [
  {
    icon: FilePlus2,
    title: 'Evidentiranje',
    description: 'Predmet se unosi jednom, sa osnovnim podacima i internim brojem.',
  },
  {
    icon: ListChecks,
    title: 'Praćenje',
    description: 'Status, napomene i važni datumi vode se uz predmet.',
  },
  {
    icon: Gavel,
    title: 'Ročište',
    description: 'Zakazana ročišta vidljiva su u pregledu i na dashboard-u.',
  },
  {
    icon: ClipboardList,
    title: 'Odluka',
    description: 'Ishod i datum odluke evidentiraju se u istom predmetu.',
  },
  {
    icon: Archive,
    title: 'Arhiva',
    description: 'Završeni predmeti ostaju dostupni za pretragu i pregled.',
  },
];

export const DAILY_WORK: readonly IconItem[] = [
  {
    icon: StickyNote,
    title: 'Napomene uz predmet',
    description: 'Važne informacije ostaju zapisane uz predmet, a ne u posebnim beleškama.',
  },
  {
    icon: Eye,
    title: 'Jasni statusi',
    description: 'U svakom trenutku se vidi šta je u toku, šta predstoji i šta je završeno.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Uvoz i izvoz podataka',
    description: 'Postojeće evidencije mogu se preneti u sistem, a podaci izvesti po potrebi.',
  },
];

export const ACCESS_ITEMS: readonly IconItem[] = [
  {
    icon: KeyRound,
    title: 'Lični korisnički nalozi',
    description: 'Svaki korisnik se prijavljuje sopstvenim nalogom.',
  },
  {
    icon: UserCog,
    title: 'Uloge i privilegije',
    description: 'Uloga određuje ko može da pregleda, a ko da menja podatke.',
  },
  {
    icon: History,
    title: 'Evidencija važnih izmena',
    description:
      'Važne aktivnosti mogu biti evidentirane, sa vremenom i korisnikom koji ih je izvršio.',
  },
];
