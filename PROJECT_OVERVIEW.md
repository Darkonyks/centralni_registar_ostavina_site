# Centralni registar ostavina — javni sajt: Project Overview

> **Živ dokument.** Ažurira se pri svakoj promeni strukture stranice, poruke, CTA linkova,
> cenovnika, kontakt toka, dizajn principa ili arhitekture sajta.
> Poslednja izmena: 2026-10-08 (podaci o firmi Geobiz u footer-u i politici privatnosti;
> Demo/Aplikacija u novom prozoru; ranije 2026-10-06: novi model plaćanja: mesečno, 6 meseci −10%, 12 meseci −20%;
> besplatna prva tri meseca; grb Srbije kao znak; ranije Faza 3 — čuvanje upita u bazi,
> administracija, politika privatnosti, saglasnost za kolačiće, napomena o PDV-u).

## 1. Svrha javnog sajta

`https://registarostavina.rs` je javna prezentaciona stranica aplikacije **Centralni registar
ostavina**. Sajt nije aplikacija i ne sadrži njene funkcije.

Zadatak sajta je da posetiocu za nekoliko desetina sekundi objasni:

- koji problem aplikacija rešava (rasute Excel/lokalne evidencije),
- koje su glavne prednosti (centralizacija, rokovi pod kontrolom, pregled u jednom pogledu),
- kako olakšava svakodnevni rad i smanjuje rizik od propuštenih datuma,
- kako dashboard prikazuje najvažnije informacije odmah posle prijave,
- koliko košta (jednostavan cenovnik prema broju korisnika),

i da ga zatim uputi na **demo okruženje**, na **aplikaciju** ili na **kontakt formu** (upit).

Uz sajt postoji **administracija** (`/admin/`) za pregled svih primljenih upita (sa podatkom o
prihvaćenoj politici privatnosti) i evidencije saglasnosti za kolačiće.

Komunikacija se gradi oko koristi za korisnika, ne oko tehničkih funkcija. Sistem se dalje razvija,
pa sajt namerno ne ulazi u detalje polja, ekrana ni tehničkih naziva privilegija.

## 2. Ciljna publika

1. **Kancelarije i službe koje vode ostavinske predmete** i razmatraju prelazak sa lokalnih
   Excel/VBA evidencija na centralni sistem — za njih su cenovnik i kontakt forma.
2. **Rukovodioci** koji odlučuju o uvođenju sistema i žele brzo razumevanje koristi,
   cene, kontrole pristupa i sledljivosti izmena.
3. **Postojeći korisnici** kojima sajt služi kao ulazna tačka ka aplikaciji (dugme „Aplikacija“).

## 3. Glavna poruka

Centralna ideja: **svi predmeti, rokovi, ročišta i relevantne informacije nalaze se na jednom mestu.**

| Stub                         | Šta komuniciramo                                                            |
| ---------------------------- | --------------------------------------------------------------------------- |
| Sve na jednom mestu          | Jedna centralna baza umesto više tabela, lokalnih računara i evidencija.    |
| Rokovi pod kontrolom         | Važni datumi i ročišta dostupni odmah; manja mogućnost da se nešto previdi. |
| Pregled u jednom pogledu     | Dashboard: aktivni predmeti, ročišta danas / ove nedelje / ovog meseca.     |
| Brža pretraga                | Pretraga i filteri umesto ručnog pregledanja tabela.                        |
| Kontrolisan i bezbedniji rad | Lični nalozi, uloge i privilegije, evidencija važnih izmena.                |

### Pravila sadržaja

- Profesionalan, miran ton; realistične formulacije („smanjuje mogućnost“, „mogu biti evidentirane“).
- **Zabranjeno:** „100% bezbedno“, „nikada više nećete propustiti rok“, „najbolji sistem u Srbiji“,
  „potpuna eliminacija grešaka“ i slične tvrdnje.
- **Bez izmišljenih** statistika, procenata, broja korisnika/predmeta, dostupnosti, testimoniala,
  kontakt podataka, adrese, PIB-a i telefona — koriste se samo dostavljeni podaci
  (`kontakt@registarostavina.rs` i podaci o firmi ispod).
- Firma iza sajta i aplikacije (poslovna informacija, 2026-10-08): **Geobiz Projektovanje i izrada
  softvera PR Darko Nedic**, Mirna 1, 22000 Sremska Mitrovica, tel. 063/12-61-227,
  office@geo-biz.com, https://geo-biz.com/, MB 63583197, PIB 108624736. Jedini izvor:
  `src/config/company.ts` (i JSON-LD u `index.html`). Prikazuje se u footer-u i kao rukovalac
  podacima u politici privatnosti.
- Politika privatnosti opisuje samo stvarnu obradu na sajtu (vidi §9a).
- Cenovnik: bez naziva paketa (Basic/Professional…), bez oznaka „Najpopularnije“/„Preporučujemo“.
- PDV (poslovna informacija, 2026-10-01): pružalac **nije obveznik PDV-a** i PDV se ne obračunava;
  ne koristiti formulacije poput „+ PDV“ ili „bez PDV-a“ (mogu se pogrešno razumeti kao dodatak na cenu).
- Besplatan period (poslovna informacija, 2026-10-05): **prva tri meseca korišćenja aplikacije su
  potpuno besplatna**. Ne dodavati uslove koje nismo dobili (npr. „bez obaveze“, „bez platne kartice“,
  kako se besplatan period nastavlja u plaćenu pretplatu).
- Plaćanje (poslovna informacija, 2026-10-06): mesečna pretplata po osnovnoj ceni; uplatom za 6 meseci
  unapred popust 10%, uplatom za 12 meseci unapred popust 20%. Ne dodavati druge uslove
  (ugovorna obaveza, otkazni rok, način plaćanja) dok ne budu dostavljeni.
- Kontakt: bez garantovanog vremena odgovora („odgovaramo za 24 sata“) dok ne postoji takva politika.
- Bez lorem ipsum sadržaja i bez tehničkih naziva privilegija (`cases.update`, `audit.view`…).
- Mockupi interfejsa su ilustracija i uvek nose oznaku „Ilustrativni prikaz korisničkog interfejsa“.
  Brojevi i brojevi predmeta u mockupima su primer podataka (`src/data/mockup.ts`), ne statistika.

## 4. Struktura landing stranice

Jedna stranica, osam sekcija između header-a i footer-a. Tekstovi su u `src/data/content.ts`,
cenovnik u `src/data/pricing.ts`, id-jevi sekcija u `src/data/navigation.ts` (`SECTION_IDS`).

| #   | Sekcija (komponenta)                           | Anchor          | Sadržaj                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| –   | Header (`layout/Header`)                       | –               | Znak + naziv; linkovi Prednosti, Pregled, Tok predmeta, Cenovnik, Kontakt; CTA Demo (sekundarno) i Aplikacija (primarno); puna navigacija od 1280 px, ispod toga hamburger meni (CTA vidljivi od 640 px).                                                                                                             |
| 1   | Hero (`sections/Hero`)                         | –               | H1 „Svi ostavinski predmeti. Jedno mesto. Potpuna preglednost.“, podnaslov, CTA „Otvori aplikaciju“ / „Pogledaj demo“, tri kratke stavke, mockup dashboard-a.                                                                                                                                                         |
| 2   | Prednosti (`sections/Benefits`)                | `#prednosti`    | Četiri kartice: centralizovana evidencija, rokovi i ročišta, informacije na prvi pogled, brza pretraga.                                                                                                                                                                                                               |
| 3   | Dashboard (`sections/DashboardSection`)        | `#pregled`      | Tamna, vizuelno najjača sekcija; KPI kartice, ročišta danas, tekuća nedelja.                                                                                                                                                                                                                                          |
| 4   | Tok predmeta (`sections/Lifecycle`)            | `#tok-predmeta` | Evidentiranje → Praćenje → Ročište → Odluka → Arhiva; napomene, statusi, uvoz/izvoz.                                                                                                                                                                                                                                  |
| 5   | Kontrolisan pristup (`sections/AccessControl`) | `#bezbednost`   | Nalozi, uloge i privilegije, evidencija važnih aktivnosti; mockup uloge i istorije promena. (Nije u meniju; anchor i dalje radi.)                                                                                                                                                                                     |
| 6   | Cenovnik (`sections/Pricing`)                  | `#cenovnik`     | Besplatan period, izbor načina plaćanja (mesečno / 6 / 12 meseci unapred), četiri kartice prema broju korisnika (vidi §5).                                                                                                                                                                                            |
| 7   | Završni CTA (`sections/FinalCta`)              | –               | „Pogledajte kako izgleda rad sa centralizovanom evidencijom“; „Pogledaj demo“ (primarno) i „Pošalji upit“ (→ `#kontakt`).                                                                                                                                                                                             |
| 8   | Kontakt (`sections/Contact`)                   | `#kontakt`      | Naslov „Želite da vidite kako Centralni registar ostavina može da se uklopi u vaš način rada?“, `mailto:` kontakt email, kontakt forma sa tekstom politike privatnosti i obaveznim poljem za saglasnost (vidi §6, §9a).                                                                                               |
| –   | Footer (`layout/Footer`)                       | –               | Naziv, opis, „Kontakt: kontakt@registarostavina.rs“ (`mailto:`), linkovi Demo, Aplikacija, Politika privatnosti (`#politika-privatnosti`), dugme „Podešavanja kolačića“, `© {tekuća godina} Centralni registar ostavina`; podaci o firmi (pun naziv, adresa, MB, PIB, telefon, email, `geo-biz.com` u novom prozoru). |
| –   | Baner za kolačiće (`consent/CookieBanner`)     | –               | Fiksiran pri dnu ekrana dok posetilac ne izabere „Samo neophodni“ / „Prihvatam sve“ (vidi §9a).                                                                                                                                                                                                                       |

Administracija je zasebna stranica `admin/index.html` (vidi §9b), nije deo javne stranice.

## 5. Cenovnik

Model naplate: **mesečna pretplata** po osnovnoj ceni paketa; **uplatom za 6 meseci unapred
popust 10%**, **uplatom za 12 meseci unapred popust 20%**.

**Besplatan period:** odmah ispod naslova sekcije, pre kartica, istaknut tamnoplavi blok sa
oznakom „3 meseca“ (ćilibarna), naslovom „Prva tri meseca potpuno besplatno“, tekstom „Korišćenje
aplikacije je prva tri meseca potpuno besplatno, bez obzira na broj korisnika.“ i dugmetom
„Pošalji upit“ (→ `#kontakt`). Tekst: `FREE_TRIAL` / `FREE_TRIAL_MONTHS` u `src/data/pricing.ts`.

| Paket           | Mesečno   | 6 meseci unapred (−10%)        | 12 meseci unapred (−20%)       |
| --------------- | --------- | ------------------------------ | ------------------------------ |
| 1–5 korisnika   | 1.500 RSD | 8.100 RSD (1.350 RSD mesečno)  | 14.400 RSD (1.200 RSD mesečno) |
| 6–10 korisnika  | 2.500 RSD | 13.500 RSD (2.250 RSD mesečno) | 24.000 RSD (2.000 RSD mesečno) |
| 11–15 korisnika | 3.500 RSD | 18.900 RSD (3.150 RSD mesečno) | 33.600 RSD (2.800 RSD mesečno) |
| 16+ korisnika   | 4.500 RSD | 24.300 RSD (4.050 RSD mesečno) | 43.200 RSD (3.600 RSD mesečno) |

- Izvor istine: `src/data/pricing.ts` — samo mesečna cena paketa i popusti po periodu
  (`BILLING_PERIODS`); iznosi za period, mesečni iznos i ušteda se računaju (`periodTotal`,
  `effectiveMonthly`, `periodSavings`), da se nikada ne raziđu.
- **Izbor načina plaćanja** iznad kartica: „Mesečno“ (podrazumevano), „6 meseci unapred −10%“,
  „12 meseci unapred −20%“. Prava radio dugmad (`fieldset` „Izaberite način plaćanja“, strelice na
  tastaturi). Prikaz cene preko CSS `:has()` — radi i pre učitavanja JavaScript-a, svi iznosi su u
  prerenderovanom HTML-u; u browser-u bez `:has()` vidi se mesečna cena.
- Kartica za izabrani period: za 6/12 meseci red „~~1.500 RSD~~ −20%“, glavni podatak
  **„1.200 RSD / mesečno“**, ispod „14.400 RSD za 12 meseci“ i „Ušteda 3.600 RSD“; za mesečno
  „1.500 RSD / mesečno“ i „Mesečna pretplata“. Napomena: „Plaća se svakog meseca.“ /
  „Plaća se jednom, za 6 (12) meseci unapred.“ i dugme „Pošalji upit“ (→ `#kontakt`).
- Ispod kartica: „Mesečna pretplata se plaća svakog meseca. Uplatom za 6 meseci unapred ostvaruje
  se popust od 10%, a uplatom za 12 meseci unapred popust od 20%.“ i „Nismo obveznik PDV-a, pa se
  PDV na prikazane cene ne obračunava.“
- Iznosi se formatiraju bez `Intl` (`shared/format.ts`), da prerender i browser daju isti tekst.
- Raspored: 1 kolona (mobilni), 2 × 2 (od 640 px), 4 kolone (od 1280 px).
- Test `Pricing.test.tsx` proverava sve iznose za sva tri načina plaćanja i izbor perioda.

## 6. Kontakt i kontakt forma

**Polja** (sva obavezna; limiti važe i u browser-u i na serveru — `shared/contact.ts`):

| Polje         | Tip        | Najviše znakova | Provera                                                                    |
| ------------- | ---------- | --------------- | -------------------------------------------------------------------------- |
| Ime i prezime | `text`     | 150             | nije prazno                                                                |
| Kancelarija   | `text`     | 200             | nije prazno (naziv kancelarije / organizacije)                             |
| Email         | `email`    | 254             | ispravan format (lokalni deo ≤ 64, domen sa tačkom)                        |
| Broj telefona | `tel`      | 50              | cifre, razmaci, `+ - ( ) / .`, bar 6 cifara — bez jednog obaveznog formata |
| Poruka        | `textarea` | 5.000           | nije prazna; 7 redova, brojač znakova                                      |

Svi unosi se trimuju; jednoredna polja gube prelome redova i kontrolne znakove, poruka zadržava
prelome. Skriveno polje `website` je zamka za botove (honeypot).

**Saglasnost:** iznad dugmeta je pun tekst politike privatnosti (skrolabilan okvir dostupan
tastaturom, `#politika-privatnosti`) i obavezno polje „Prihvatam politiku privatnosti i dajem
saglasnost za prikupljanje i obradu podataka iz ove forme u navedene svrhe.“ Bez njega se upit ne
šalje (poruka uz polje, fokus na polje); server isto odbija upit bez saglasnosti ili sa saglasnošću
za staru verziju politike (`privacyConsent: true`, `privacyPolicyVersion` = trenutna verzija).

**Tok (contact flow):**

1. Turnstile skripta se učitava tek kada je forma blizu ekrana; widget izdaje token (`action: contact`).
2. Klik „Pošalji upit“: provera polja u browser-u (poruke uz polja, fokus na prvo neispravno).
   Bez tokena se zahtev ne šalje („Sačekajte da se sigurnosna provera završi…“).
3. Dugme prelazi u „Slanje...“ i onemogućeno je; `POST /api/contact` sa JSON telom.
4. Server upisuje upit u bazu (sa vremenom i verzijom prihvaćene politike), pa šalje email obaveštenje.
   Uspeh → „Hvala. Vaš upit je uspešno poslat.“ (ostaje prikazano), polja i saglasnost se prazne,
   Turnstile se resetuje.
5. Greška → „Poruku trenutno nije moguće poslati. Pokušajte ponovo ili nam pišite na
   kontakt@registarostavina.rs.“; uneti podaci ostaju, Turnstile se resetuje (token je jednokratan).
6. Rezultat slanja je u `aria-live` regionu; greške polja su povezane preko `aria-describedby`.

Bez JavaScript-a forma je prikazana, ali je slanje onemogućeno uz objašnjenje (`<noscript>`);
kontakt email je uvek vidljiv i klikabilan.

## 7. `POST /api/contact`

Zahtev (`application/json`):

```json
{
  "name": "Ime Prezime",
  "office": "Naziv kancelarije",
  "email": "korisnik@example.com",
  "phone": "+381...",
  "message": "Tekst poruke",
  "turnstileToken": "...",
  "privacyConsent": true,
  "privacyPolicyVersion": "2026-10-08",
  "website": ""
}
```

Obrada (`server/contact.ts`), redom:

| Korak                                    | Neuspeh → status                                                     |
| ---------------------------------------- | -------------------------------------------------------------------- |
| HTTP metod mora biti `POST`              | 405 (`Allow: POST`)                                                  |
| Rate limit po IP adresi                  | 429 (`Retry-After: 600`)                                             |
| `Content-Type: application/json`         | 415                                                                  |
| Telo ≤ 32 KB, ispravan JSON              | 413 / 400                                                            |
| Honeypot prazan                          | 400 (email se ne šalje)                                              |
| Validacija svih polja i saglasnosti      | 400 + `fieldErrors`                                                  |
| Turnstile token prisutan, ≤ 2048 znakova | 400                                                                  |
| Cloudflare `siteverify` uspešan          | 403 (Cloudflare nedostupan → takođe odbijeno)                        |
| Upis u bazu                              | 500 (email se ne šalje)                                              |
| Email obaveštenje                        | ne menja odgovor: upit je sačuvan (200), status obaveštenja „failed“ |
| Neočekivana greška                       | 500                                                                  |

Odgovori: `{ "success": true }` ili `{ "success": false, "message": "Poruku trenutno nije moguće poslati." }`
(uz `fieldErrors` samo kod grešaka validacije). Nema internih detalja, stack trace-a ni HTML-a.
Nepotpuna serverska konfiguracija → 503 i log `contact.not_configured`.

## 8. Cloudflare Turnstile

- Frontend: eksplicitno renderovanje (`?render=explicit`), `action: "contact"`, tema `light`,
  veličina `flexible` (kompaktna ako je širina < 300 px). Javni ključ: `VITE_TURNSTILE_SITE_KEY`.
- Server: token se proverava server-to-server na
  `https://challenges.cloudflare.com/turnstile/v0/siteverify` (secret, token, IP), timeout 5 s.
  Prihvata se samo `success: true`; token izdat za drugu akciju se odbija.
- Secret key (`TURNSTILE_SECRET_KEY`) postoji isključivo na serveru; frontend potvrdi se ne veruje.
- Dozvoljeni hostname-ovi se podešavaju u Cloudflare dashboard-u za widget.
- CSP dozvoljava `script-src` i `frame-src` samo za `https://challenges.cloudflare.com`.

## 9. SMTP konfiguracija i email

Sve kroz environment promenljive (vidi `.env.example`, README): `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_REQUIRE_TLS`,
`CONTACT_RECIPIENT_EMAIL` (podrazumevano `kontakt@registarostavina.rs`).

- Plain-text poruka po obrascu „Novi upit sa sajta Centralni registar ostavina … Vreme prijema“
  (vreme u zoni Europe/Belgrade), uz „Saglasnost sa politikom privatnosti: Da (verzija …)“ i
  „Broj upita u administraciji“.
- Subject: `Upit sa sajta Centralni registar ostavina – {Ime i prezime}`.
- `From`: `"Centralni registar ostavina" <SMTP_FROM_EMAIL>` (domen sa SPF/DKIM); `Reply-To`: korisnik.
- STARTTLS obavezan po podrazumevanoj vrednosti; timeouti konekcije 10 s, soketa 20 s.
- Lokalno: `npm run dev:smtp` (SMTP koji poruke samo ispisuje u terminal).

## 9a. Politika privatnosti i kolačići

- Tekst: `src/data/privacy.ts` (rukovalac, podaci iz forme, kolačići i evidencija izbora, zaštita
  forme/Cloudflare, primaoci, prava, bezbednost, izmene). Opisuje samo stvarnu obradu.
- Verzija: `PRIVACY_POLICY_VERSION` (`shared/consent.ts`, sada `2026-10-08`). Pri suštinskoj izmeni
  teksta povećati verziju: novi upiti beleže novu verziju, a baner za kolačiće se prikazuje ponovo.
- Rok čuvanja upita: najduže dve godine od poslednje komunikacije (brisanje iz administracije).
- **Kolačići:** sajt koristi samo neophodne — `crs_cookie_consent` (izbor, 180 dana, čita ga i browser)
  i `crs_admin_session` (samo administrator, 8 sati). Analitika se trenutno ne koristi.
- **Baner:** „Samo neophodni“ i „Prihvatam sve“ su jednako istaknuti; link ka politici; ne prikazuje
  se u prerenderovanom HTML-u (zavisi od kolačića), pojavljuje se posle učitavanja (fiksiran, bez
  pomeranja sadržaja). „Podešavanja kolačića“ u footer-u ponovo otvara izbor (Escape/„Zatvori“).
- **`POST /api/cookie-consent`** `{ "decision": "all" | "necessary" }`: rate limit 20/10 min po IP,
  telo ≤ 1 KB; u bazu se upisuju id (UUID), vreme, izbor, kategorije, verzija politike, **skraćena IP**
  (IPv4 bez poslednjeg okteta, IPv6 prva tri bloka) i tip browser-a (≤ 300 znakova); odgovor postavlja
  kolačić `crs_cookie_consent=<izbor>.<verzija>.<id>` (`Secure`, `SameSite=Lax`).
- Ako se uvede analitika: učitavati je samo uz izbor „Prihvatam sve“, dopuniti politiku i povećati verziju.

## 9b. Administracija (`/admin/`)

- Zasebna stranica (`admin/index.html`, `src/admin/`), sopstveni JS (`admin-*.js`); posetioci sajta
  ne preuzimaju njen kod. `noindex` (meta + `X-Robots-Tag`), `Disallow: /admin/` u `robots.txt`.
- Jedan nalog: `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (scrypt N=32768, r=8, p=1;
  `npm run admin:hash-password`, lozinka ≥ 12 znakova).
- **Upiti iz kontakt forme:** svi upiti, najnoviji prvi, 25 po strani, pretraga (ime, kancelarija,
  email, telefon, poruka); kolone: primljeno, ime/kancelarija, kontakt, **politika privatnosti
  (Prihvaćena + verzija)**, email obaveštenje (Poslato / Nije poslato / Na čekanju); detalji (cela
  poruka, vreme i verzija saglasnosti), „Odgovori emailom“, trajno brisanje uz dijalog za potvrdu.
- **Saglasnosti za kolačiće:** zbir (ukupno / svi / samo neophodni) i tabela zapisa.
- API: `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`,
  `GET /api/admin/contacts?page=&q=`, `GET|DELETE /api/admin/contacts/:id`,
  `GET /api/admin/cookie-consents?page=`.

## 9c. Baza podataka

- SQLite (`node:sqlite`), fajl `DATABASE_PATH` (podrazumevano `data/registar.db`, u Docker-u
  `/app/data/registar.db` na trajnom volumenu); WAL režim; migracije u `server/db.ts` (`user_version`).
- Tabele: `contact_submissions` (sa `privacy_consent` — CHECK 0/1, `privacy_consent_at`,
  `privacy_policy_version`, `email_status`), `cookie_consents`, `admin_sessions` (samo heš tokena).
- Baza nije u repozitorijumu (`data/` u `.gitignore` i `.dockerignore`); rezervnu kopiju praviti redovno.
- Ako baza ne može da se otvori, sajt radi, a API vraća 503 (`db.open_failed` u logu).

## 10. Bezbednosni model (forma, kolačići, administracija)

- **Autoritet je server**: ista pravila kao u browser-u (`shared/contact.ts`), ali server ih
  primenjuje nezavisno; svaki neispravan zahtev se odbija pre Turnstile provere i slanja.
- **Turnstile** (server-side provera) + **honeypot** protiv automatizovanog slanja.
- **Rate limit**: 5 zahteva po IP adresi u 10 minuta (u memoriji procesa; jedna instanca).
  IP iz proxy header-a samo kada je izričito podešen (`CLIENT_IP_HEADER`), inače adresa konekcije;
  iz liste (`X-Forwarded-For`) uzima se poslednja adresa, koju dodaje proxy (prve može lažirati klijent).
- **Ograničenja**: telo ≤ 32 KB, maksimalne dužine polja, samo `application/json`
  (cross-site slanje zahteva CORS preflight, koji server ne odobrava).
- **Bez injection-a**: plain-text email; jednoredna polja bez preloma redova i kontrolnih znakova, pa ne mogu
  dodati email zaglavlja; adrese se prosleđuju nodemailer-u kao objekti (ime/adresa).
- **Logovi**: samo događaj i tehnički razlog (`contact.saved` + broj upita, `contact.rejected` +
  razlog, `contact.smtp_error` + kod, `admin.login`/`admin.login_failed`, `admin.contact_deleted` +
  broj). Nikada sadržaj poruke, podaci korisnika, lozinke ni Turnstile token.
- **Saglasnost:** server ne prihvata upit bez `privacyConsent: true` za važeću verziju politike; baza
  dodatno ograničava kolonu (CHECK). Vreme saglasnosti beleži server.
- **Administracija:** lozinka samo kao scrypt heš (poređenje u konstantnom vremenu, i za korisničko
  ime); sesijski token 256 bita, u bazi samo SHA-256 heš; kolačić `HttpOnly`, `Secure`,
  `SameSite=Strict`, `Path=/api/admin`, 8 sati; 5 pokušaja prijave po IP u 15 min; izmene (POST/DELETE)
  odbijaju zahteve sa tuđim `Origin` ili `Sec-Fetch-Site: cross-site` (CSRF); svaki zahtev osim prijave
  traži važeću sesiju (401); odgovori `no-store` i `noindex`.
- **Lični podaci u bazi:** minimalni skup; za kolačiće samo skraćena IP; brisanje iz administracije.
- **Tajne**: samo u env promenljivama servera; `.env`, `.env.*` i `data/` su u `.gitignore`.
- **HTTP zaglavlja** (produkcioni server): CSP, `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`; JSON odgovori `Cache-Control: no-store`.

## 11. Dizajn principi

- **Karakter:** profesionalan, moderan, pouzdan, miran, čist; premium ali nenametljiv.
- **Boje:** bela / `slate-50`, tamnoplava paleta `brand-*` (primarna boja aplikacije `#1f4e79`),
  slate za tekst; akcenat ćilibarna (amber) za oznaku „danas“. Uspeh/greška forme: emerald/red.
- **Znak:** grb Srbije (isti kao u aplikaciji) pored naziva u header-u, footer-u, administraciji i
  mockupu aplikacije; `LogoMark` → `src/assets/images/grb-srbija.svg` (optimizovan SVGO-om),
  ukrasna slika (`alt=""`) jer naziv stoji pored. Favicon i slike za deljenje još koriste raniji znak.
- **Tipografija:** Inter (varijabilni, 400–700). H1 u hero-u, H2 po sekciji, H3 u karticama.
- **Kartice:** blag border, diskretna senka, `rounded-2xl`; cenovne kartice su ravnopravne (nijedna istaknuta).
- **Ritam sekcija:** bela → svetlo siva → tamnoplava → bela → svetlo siva → bela (cenovnik) →
  CTA kartica → svetlo siva (kontakt) → bela (footer).
- **Animacije:** diskretno pojavljivanje, hover, smooth scroll; poštuje se `prefers-reduced-motion`.
- **Responsive:** provereno na 1920, 1440, 1366, 1024, 768, 390 i 360 px, bez horizontalnog skrola.
- **Pristupačnost:** semantički HTML, skip link, vidljiv fokus, kontrast ≥ 4.5:1; forma sa pravim
  `<label>` za svako polje, oznakom obaveznih polja, `aria-invalid`/`aria-describedby`, `aria-live`.

## 12. CTA linkovi

| Mesto       | Akcije                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Header      | „Demo“ (sekundarno), „Aplikacija“ (primarno)                                                                             |
| Hero        | „Otvori aplikaciju“ (primarno), „Pogledaj demo“                                                                          |
| Cenovnik    | „Pošalji upit“ na svakoj kartici → `#kontakt`                                                                            |
| Završni CTA | „Pogledaj demo“ (primarno), „Pošalji upit“ → `#kontakt`                                                                  |
| Kontakt     | forma „Pošalji upit“, `mailto:kontakt@registarostavina.rs`                                                               |
| Footer      | „Kontakt: kontakt@registarostavina.rs“ (`mailto:`), „Demo“, „Aplikacija“, „Politika privatnosti“, „Podešavanja kolačića“ |

- Demo: `https://demo.registarostavina.rs`, Aplikacija: `https://app.registarostavina.rs`
  (`APP_URLS` u `src/config/site.ts`, zamena preko `VITE_DEMO_URL` / `VITE_APP_URL`); otvaraju se u novom prozoru (`target="_blank"`, `rel="noopener"`, napomena za čitače ekrana — `src/lib/newWindow.ts`).

## 13. SEO smernice

- `lang="sr-Latn"`; tekst isključivo latinicom.
- Title: `Centralni registar ostavina | Evidencija predmeta i rokova`; meta description iz Faze 1.
- Canonical `https://registarostavina.rs/`, Open Graph + Twitter kartica, JSON-LD `WebSite`
  sa `publisher` (`Organization`: firma iz §3) — bez ocena i cena.
- Tačno jedan H1; po jedan H2 za svaku sekciju (7 H2).
- Cenovnik (svi iznosi) i kontakt email su u prerenderovanom HTML-u — ne zavise od JavaScript-a.
- `robots.txt` (`Disallow: /admin/`, `Disallow: /api/`) i `sitemap.xml` (`lastmod` ažurirati pri
  većim izmenama sadržaja).
- Tekst politike privatnosti je u prerenderovanom HTML-u (deo kontakt forme).

## 14. Arhitektura

- **Frontend:** React 19, TypeScript (strict), Vite 8, Tailwind CSS 4, Lucide React. Prerender pri
  build-u (`scripts/prerender.mjs`) + `hydrateRoot`; CSS ugrađen u HTML.
- **Zajednički kod (`shared/`):** polja, limiti, normalizacija i validacija forme, tipovi API-ja,
  formatiranje iznosa — isti kod u browser-u i na serveru.
- **Server (`server/`):** minimalan `node:http` server bez framework-a — statički `dist/`
  (kompresija, keš, bezbednosna zaglavlja), `/api/*` (kontakt, kolačići, administracija) i
  `/admin/`. Isti handler-i rade i u `npm run dev` / `npm run preview` (Vite middleware u
  `vite.config.ts`). Build: jedan fajl `dist-server/index.js`; runtime zavisnost samo `nodemailer`.
- **Baza:** SQLite preko ugrađenog `node:sqlite` (bez nativnih modula i zasebnog servisa).
- **Dve stranice u Vite build-u:** javna (`index.html`, prerender) i administracija
  (`admin/index.html`, klijentski render); zajednički kod u `vendor-*.js`.
- **Zašto ovako:** najmanje infrastrukture (jedan proces i jedan SQLite fajl, bez servisa trećih
  strana osim Cloudflare Turnstile i SMTP-a); isti obrazac kao na drugim projektima (Docker/Coolify,
  `node:sqlite`). Opcioni `Dockerfile` (Node 24, bez root-a, volumen `/app/data`).
- **Testovi (Vitest):** frontend (jsdom + Testing Library): cenovnik i PDV napomena, validacija
  forme i saglasnosti, slanje, uspeh/greške, Turnstile, baner za kolačiće, administracija (prijava,
  lista sa saglasnošću, detalji, brisanje, kolačići, istekla sesija). Server: validacija, kontakt
  handler sa bazom u memoriji, saglasnost, SMTP greška, baza i migracije, saglasnosti za kolačiće,
  scrypt, administratorski API (sesije, CSRF, rate limit, 401), integracija API-ja, statički server.
- **Performanse:** `content-visibility: auto` za sekcije ispod prvog ekrana (osim kontakt sekcije);
  Turnstile se učitava tek blizu forme; Lighthouse desktop 100, mobilni sa stvarnim usporavanjem
  mreže 94–96 (detalji u README).
- **Kvalitet:** `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`,
  `npm run build` moraju proći bez grešaka.

## 15. Van obima (do sada)

Registracija korisnika, više administratorskih naloga i uloga, CMS i administracija sadržaja
sajta, newsletter, blog, korisnički portal, online plaćanje, analitika, izvoz upita (CSV),
automatsko brisanje starih upita po isteku roka čuvanja.

## 16. Otvorena pitanja / kandidati za narednu fazu

- **Politika privatnosti**: preporučuje se pravni pregled teksta (`src/data/privacy.ts`).
- Automatsko brisanje upita starijih od roka čuvanja (sada ručno iz administracije).
- Pravi Turnstile ključevi, SMTP nalog i SPF/DKIM/DMARC za domen pošiljaoca pri postavljanju.
- Rezervna kopija baze u produkciji (snapshot volumena).
- Ako bude više instanci servera: zajednički rate limit (npr. Redis) ili rate limit na proxy-ju.
- Favicon, `apple-touch-icon.png` i `og-image.png` sa grbom (sada još raniji znak); stvarni snimci
  ekrana aplikacije umesto ilustrativnih mockupa.

## 17. Istorija izmena

| Datum      | Izmena                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-30 | Faza 1: one-page sajt (6 sekcija), prerender, SEO osnove, responsive i a11y provera, dokumentacija.                                                                                                                                                                                                                                                                     |
| 2026-09-30 | Faza 2: cenovnik (4 paketa, godišnje plaćanje), kontakt sekcija i forma, Turnstile, `POST /api/contact` (Node server, SMTP), rate limit, honeypot, testovi (Vitest), meni do 1280 px, izmenjen završni CTA, kontakt u footer-u.                                                                                                                                         |
| 2026-10-01 | Faza 3: SQLite baza (upiti, saglasnosti, sesije), administracija `/admin/` (upiti sa statusom saglasnosti, brisanje, saglasnosti za kolačiće), politika privatnosti uz formu i obavezna saglasnost (i na serveru), baner i `POST /api/cookie-consent`, napomena da pružalac nije obveznik PDV-a, upit se čuva i kad email ne uspe, `content-visibility`, Dockerfile.    |
| 2026-10-05 | Znak pored naziva sistema zamenjen grbom Srbije (`grb-srbija.svg`, optimizovan), u header-u, footer-u, administraciji i mockupu.                                                                                                                                                                                                                                        |
| 2026-10-06 | Cenovnik: istaknut blok „Prva tri meseca potpuno besplatno“ iznad paketa (važi za sve pakete); test. Test-pomoćnici: `listen` izbegava portove koje `fetch` odbija, test-baze se zatvaraju posle testa.                                                                                                                                                                 |
| 2026-10-06 | Cenovnik: umesto samo godišnjeg plaćanja — mesečna pretplata, 6 meseci unapred (−10%) i 12 meseci unapred (−20%); izbor načina plaćanja (radio, CSS `:has()`), kartice sa uštedom; testovi.                                                                                                                                                                             |
| 2026-10-06 | Nove mesečne cene: 1.500 / 2.500 / 3.500 / 4.500 RSD (popusti za 6 i 12 meseci unapred ostaju −10% / −20%).                                                                                                                                                                                                                                                             |
| 2026-10-08 | `.gitignore` je pravilom `data/` isključivao i `src/data/` (tekstovi, cenovnik, politika privatnosti, navigacija, mockup) — pravilo ograničeno na koren (`/data/`), a `src/data/*.ts` rekonstruisani iz ove dokumentacije (tekst politike treba pravno pregledati). `X-Forwarded-For`: uzima se poslednja adresa (rate limit se više ne može zaobići lažnim header-om). |
| 2026-10-08 | Demo i Aplikacija se otvaraju u novom prozoru. Podaci o firmi (Geobiz PR Darko Nedic: adresa, MB, PIB, kontakt) u footer-u, kao rukovalac u politici privatnosti i u JSON-LD (`publisher`); `PRIVACY_POLICY_VERSION` → `2026-10-08`. Dev port 5180 (`DEV_PORT`).                                                                                                        |
