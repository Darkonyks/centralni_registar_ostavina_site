/**
 * Tekst politike privatnosti (prikazuje se u kontakt formi, `#politika-privatnosti`).
 * Opisuje samo stvarnu obradu na sajtu.
 *
 * Pri svakoj suštinskoj izmeni teksta povećati PRIVACY_POLICY_VERSION u shared/consent.ts.
 * Domen i kontakt adresa: ažurirati i ovde pri promeni domena (vidi README).
 *
 * NAPOMENA (2026-10-08): fajl je rekonstruisan iz dokumentacije jer originalni nije bio
 * u repozitorijumu. Tekst treba pravno pregledati.
 */
import { COMPANY, COMPANY_ADDRESS } from '../config/company';
import { CONTACT_EMAIL } from '../config/site';

/** Rukovalac podacima: firma koja stoji iza sajta i aplikacije (src/config/company.ts). */
export const PRIVACY_CONTROLLER = `${COMPANY.legalName}, ${COMPANY_ADDRESS}, matični broj ${COMPANY.registrationNumber}, PIB ${COMPANY.taxId}`;

export interface PrivacySection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  /** Pasusi posle liste. */
  after?: readonly string[];
}

export const PRIVACY_POLICY: {
  title: string;
  effectiveDate: string;
  intro: readonly string[];
  sections: readonly PrivacySection[];
} = {
  title: 'Politika privatnosti',
  effectiveDate: '8. 10. 2026.',
  intro: [
    'Ova politika opisuje koje podatke o ličnosti prikupljamo na sajtu registarostavina.rs, u koje svrhe i koja prava imate u vezi sa tim podacima.',
  ],
  sections: [
    {
      heading: 'Rukovalac podacima',
      paragraphs: [
        `Rukovalac podacima je ${PRIVACY_CONTROLLER}. Za sva pitanja u vezi sa obradom podataka možete nam pisati na ${CONTACT_EMAIL}.`,
        `Kontakt rukovaoca: tel. ${COMPANY.phone}, ${COMPANY.email}.`,
      ],
    },
    {
      heading: 'Podaci iz kontakt forme',
      paragraphs: ['Kada pošaljete upit putem kontakt forme, obrađujemo sledeće podatke:'],
      items: [
        'ime i prezime,',
        'naziv kancelarije ili organizacije,',
        'email adresu i broj telefona,',
        'sadržaj poruke,',
        'vreme slanja upita i verziju politike privatnosti koju ste prihvatili.',
      ],
      after: [
        'Podatke koristimo isključivo da bismo odgovorili na vaš upit i pružili informacije o aplikaciji, demo pristupu i korišćenju sistema. Osnov obrade je vaš pristanak, koji dajete označavanjem polja ispod ovog teksta i koji možete opozvati u svakom trenutku, bez uticaja na zakonitost obrade pre opoziva.',
        'Upite čuvamo najduže dve godine od poslednje komunikacije, a zatim ih brišemo.',
      ],
    },
    {
      heading: 'Kolačići i evidencija izbora',
      paragraphs: [
        'Sajt koristi samo neophodne kolačiće: kolačić u kome se čuva vaš izbor u vezi sa kolačićima (180 dana) i, samo za administratora sajta, kolačić sesije administracije (8 sati). Analitički i reklamni kolačići se ne koriste.',
        'Kada izaberete opciju u obaveštenju o kolačićima, beležimo izbor, vreme, verziju politike, skraćenu IP adresu (bez poslednjeg dela, tako da ne identifikuje uređaj) i tip browser-a, kako bismo mogli da pokažemo da je izbor dat. Izbor možete promeniti u svakom trenutku preko linka „Podešavanja kolačića“ u podnožju stranice.',
      ],
    },
    {
      heading: 'Zaštita forme od zloupotrebe',
      paragraphs: [
        'Kontakt forma je zaštićena uslugom Cloudflare Turnstile, koja proverava da upit ne šalje automatizovani program. Pri toj proveri Cloudflare obrađuje tehničke podatke o vašem browser-u i IP adresi, u skladu sa sopstvenom politikom privatnosti.',
      ],
    },
    {
      heading: 'Primaoci podataka',
      paragraphs: [
        'Podatke ne prodajemo i ne ustupamo trećim licima u marketinške svrhe. Pristup imaju samo ovlašćena lica koja odgovaraju na upite, kao i pružaoci usluga koji nam omogućavaju rad sajta (hosting, slanje email obaveštenja, zaštita forme), isključivo u meri potrebnoj za pružanje tih usluga.',
      ],
    },
    {
      heading: 'Vaša prava',
      paragraphs: ['U skladu sa Zakonom o zaštiti podataka o ličnosti imate pravo da:'],
      items: [
        'dobijete informaciju o tome da li obrađujemo vaše podatke i pristup tim podacima,',
        'zahtevate ispravku netačnih ili dopunu nepotpunih podataka,',
        'zahtevate brisanje podataka,',
        'zahtevate ograničenje obrade,',
        'opozovete pristanak u svakom trenutku,',
        'podnesete pritužbu Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti.',
      ],
      after: [`Zahtev možete poslati na ${CONTACT_EMAIL}.`],
    },
    {
      heading: 'Bezbednost podataka',
      paragraphs: [
        'Podaci se prenose šifrovanom vezom (HTTPS) i čuvaju na serveru kome pristup imaju samo ovlašćena lica. Pristup administraciji zaštićen je lozinkom.',
      ],
    },
    {
      heading: 'Izmene politike',
      paragraphs: [
        'Ako izmenimo ovu politiku, nova verzija biće objavljena na ovoj stranici, sa novim datumom i oznakom verzije. Obaveštenje o kolačićima tada se prikazuje ponovo.',
      ],
    },
  ],
};
