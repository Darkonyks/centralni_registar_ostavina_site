# Centralni registar ostavina — prezentacioni sajt

Javni one-page sajt koji predstavlja aplikaciju **Centralni registar ostavina** (prednosti,
cenovnik, kontakt forma), sa administracijom za pregled primljenih upita i saglasnosti za kolačiće.
Sajt nije sama aplikacija; vodi posetioca na demo, na aplikaciju ili do kontakt forme.

Produkcioni domen: **https://registarostavina.rs** · administracija: **/admin/**

| Link       | Adresa                           |
| ---------- | -------------------------------- |
| Demo       | https://demo.registarostavina.rs |
| Aplikacija | https://app.registarostavina.rs  |
| Kontakt    | kontakt@registarostavina.rs      |

Sadržaj, struktura stranice i ključne odluke opisani su u [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).

> **Bezbednost:** Turnstile **secret key** nikada ne ide u frontend (nikada sa prefiksom
> `VITE_`), a **SMTP lozinka** i **heš admin lozinke** nikada ne idu u repozitorijum.
> Baza (`data/`) sadrži lične podatke i takođe je van repozitorijuma. Sve to je u `.gitignore`.

## Tehnologije

- React 19 + TypeScript (strict), Vite 8, Tailwind CSS 4, Lucide React
- Minimalan Node.js server (`node:http`, bez framework-a): statički sajt, `/api/*`, `/admin/`
- SQLite preko ugrađenog `node:sqlite` (bez nativnih zavisnosti), Nodemailer (SMTP),
  Cloudflare Turnstile (zaštita forme)
- Vitest + Testing Library (testovi), ESLint 10 (typescript-eslint, react-hooks, jsx-a11y), Prettier

## Pokretanje

Potreban je Node.js **22.13+** (preporučeno 24, zbog `node:sqlite`).

```bash
npm install
npm run dev       # razvojni server, http://localhost:5180 (sajt, /admin/ i /api/*; port: DEV_PORT)
npm run build     # production build: dist/ (sajt + administracija) + dist-server/ (Node server)
npm run preview   # pregled production build-a, http://localhost:4173 (sa /api/*)
npm start         # produkcioni server: node dist-server/index.js (posle npm run build)
```

Dodatne komande:

```bash
npm test                     # svi testovi (frontend + server), jednom
npm run test:watch           # testovi u watch režimu
npm run typecheck            # TypeScript provera
npm run lint                 # ESLint
npm run format               # Prettier (format:check samo proverava)
npm run dev:smtp             # lokalni SMTP za razvoj (poruke se samo ispisuju u terminal)
npm run admin:hash-password  # heš administratorske lozinke za ADMIN_PASSWORD_HASH
```

### Šta radi `npm run build`

1. `typecheck` — TypeScript provera celog projekta (frontend, server, zajednički kod).
2. `build:client` — Vite build dve stranice: `index.html` (sajt) i `admin/index.html` (administracija).
   Zajednički kod (React, ikonice) je u `vendor-*.js`; posetioci sajta ne preuzimaju kod administracije.
3. `build:ssr` — pomoćni bundle (`src/entry-server.tsx`), samo za prerender.
4. `prerender` — `scripts/prerender.mjs` upisuje renderovan HTML u `dist/index.html` i ugrađuje CSS.
5. `build:server` — Node server (`server/index.ts`) u jedan fajl: `dist-server/index.js`.

## Environment promenljive

Sve promenljive su opisane u [.env.example](.env.example). Kopirati ga u `.env.local`
(`npm run dev` / `npm run preview`) ili `.env` (`npm start`), ili ih postaviti kao promenljive
procesa/kontejnera.

| Promenljiva               | Gde      | Obavezna | Opis                                                               |
| ------------------------- | -------- | -------- | ------------------------------------------------------------------ |
| `VITE_TURNSTILE_SITE_KEY` | frontend | da       | Javni Turnstile site key; ugrađuje se u JS **pri build-u**         |
| `VITE_DEMO_URL`           | frontend | ne       | Zamena Demo linka                                                  |
| `VITE_APP_URL`            | frontend | ne       | Zamena linka aplikacije                                            |
| `TURNSTILE_SECRET_KEY`    | server   | da       | Turnstile secret key — **samo na serveru**                         |
| `CONTACT_RECIPIENT_EMAIL` | server   | ne       | Primalac obaveštenja (podrazumevano kontakt@registarostavina.rs)   |
| `SMTP_HOST`               | server   | da       | SMTP server                                                        |
| `SMTP_PORT`               | server   | ne       | 587 (STARTTLS) ili 465 (TLS); podrazumevano prema `SMTP_SECURE`    |
| `SMTP_SECURE`             | server   | ne       | `true` = TLS od početka (465), `false` = STARTTLS (587)            |
| `SMTP_USER`               | server   | ne\*     | SMTP korisnik (\*ako je postavljen, obavezna je i lozinka)         |
| `SMTP_PASSWORD`           | server   | ne\*     | SMTP lozinka — **nikada u repozitorijum**                          |
| `SMTP_FROM_EMAIL`         | server   | da       | Pošiljalac, npr. `noreply@registarostavina.rs` (domen sa SPF/DKIM) |
| `SMTP_REQUIRE_TLS`        | server   | ne       | Podrazumevano `true`; `false` samo za lokalni test SMTP            |
| `DATABASE_PATH`           | server   | ne       | SQLite fajl (podrazumevano `data/registar.db`); mora biti trajan   |
| `ADMIN_USERNAME`          | server   | da\*\*   | Korisničko ime administratora                                      |
| `ADMIN_PASSWORD_HASH`     | server   | da\*\*   | scrypt heš lozinke (`npm run admin:hash-password`)                 |
| `PORT`, `HOST`            | server   | ne       | Adresa produkcionog servera (podrazumevano `0.0.0.0:3000`)         |
| `CLIENT_IP_HEADER`        | server   | ne       | Header sa IP adresom klijenta iza proxy-ja                         |

\*\* Bez njih sajt i forma rade, ali prijava u administraciju nije moguća.

Ako nešto obavezno nedostaje, server se ipak pokreće (sajt radi), a u log upisuje
`contact.not_configured` / `admin.not_configured` sa imenima promenljivih koje nedostaju.

## Administracija (`/admin/`)

- Jedan administratorski nalog iz `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`.
- Heš lozinke: `npm run admin:hash-password` (lozinka najmanje 12 znakova; unosi se u terminal i
  ne prikazuje se). Rezultat (`scrypt:32768:8:1:…`) upisati u `ADMIN_PASSWORD_HASH`.
- Kartica **Upiti iz kontakt forme**: svi primljeni upiti (najnoviji prvi), pretraga, za svaki upit
  da li je prihvaćena politika privatnosti (vreme i verzija) i da li je email obaveštenje poslato;
  detalji, odgovor emailom i trajno brisanje uz potvrdu.
- Kartica **Saglasnosti za kolačiće**: zbir izbora i zapis svakog izbora.
- Sesija traje 8 sati (HttpOnly, Secure, SameSite=Strict kolačić ograničen na `/api/admin`);
  5 pokušaja prijave po IP adresi u 15 minuta.
- Stranica i API nisu za indeksiranje (`noindex`, `robots.txt`).

## Baza podataka

SQLite fajl na putanji `DATABASE_PATH` (kreira se automatski, zajedno sa direktorijumom).
Šema se vodi migracijama u `server/db.ts` (`PRAGMA user_version`); nove migracije se samo dodaju.

| Tabela                | Sadržaj                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `contact_submissions` | ime, kancelarija, email, telefon, poruka, vreme, saglasnost (da/ne, vreme, verzija), status email obaveštenja |
| `cookie_consents`     | id izbora, vreme, izbor (svi / samo neophodni), kategorije, verzija politike, skraćena IP, tip browser-a      |
| `admin_sessions`      | SHA-256 heš sesijskog tokena, korisnik, vreme isteka                                                          |

- Upit se upisuje u bazu pre slanja email obaveštenja; ako email ne uspe, upit ostaje sačuvan
  (status „Nije poslato“ u administraciji), a korisnik dobija potvrdu.
- **Rezervna kopija:** u produkciji redovno kopirati direktorijum sa bazom (npr. noćni snapshot
  volumena). Za kopiju dok server radi: `sqlite3 registar.db ".backup kopija.db"`.
- Brisanje na zahtev lica (pravo na brisanje) radi se iz administracije.

## Politika privatnosti, saglasnost i kolačići

- Tekst politike je u `src/data/privacy.ts` i prikazuje se u kontakt formi (skrolabilan okvir,
  `#politika-privatnosti`) iznad obaveznog polja „Prihvatam politiku privatnosti…“.
  Bez označenog polja upit se ne šalje — proverava i server (400, upit se ne čuva).
- Verzija politike: `PRIVACY_POLICY_VERSION` u `shared/consent.ts`. **Pri svakoj suštinskoj izmeni
  teksta povećati verziju** — novi upiti beleže novu verziju, a baner za kolačiće se prikazuje ponovo.
- Rukovalac podacima: `PRIVACY_CONTROLLER` u `src/data/privacy.ts`, sastavljen iz podataka o firmi
  u `src/config/company.ts` (Geobiz PR Darko Nedic; isti podaci su u footer-u i u JSON-LD-u
  `index.html`). Pri promeni podataka o firmi ažurirati oba fajla i povećati verziju politike.
- Baner za kolačiće: „Samo neophodni“ / „Prihvatam sve“ (jednako istaknuti); izbor se upisuje u bazu
  (`POST /api/cookie-consent`) i čuva u kolačiću `crs_cookie_consent` (180 dana). Footer ima
  „Podešavanja kolačića“ za promenu izbora. Sajt trenutno koristi samo neophodne kolačiće.
- Cene: pružalac nije obveznik PDV-a — napomena „Nismo obveznik PDV-a, pa se PDV na prikazane cene
  ne obračunava.“ je u cenovniku (`src/data/pricing.ts`).

## Kontakt forma i Cloudflare Turnstile

Tok slanja:

1. Kada se forma približi ekranu, učitava se Turnstile skripta i widget izdaje token.
2. Browser proverava polja i saglasnost (samo radi UX) i šalje JSON na `POST /api/contact`.
3. Server: rate limit → veličina i format tela → honeypot → validacija polja i saglasnosti →
   provera tokena kod Cloudflare-a → upis u bazu → email obaveštenje.
4. Odgovor je uvek generički: `{ "success": true }` ili
   `{ "success": false, "message": "Poruku trenutno nije moguće poslati." }` (uz eventualne greške polja).

Podešavanje Turnstile-a (Cloudflare dashboard → Turnstile → Add widget): hostname
`registarostavina.rs`; site key → `VITE_TURNSTILE_SITE_KEY` (pa `npm run build`); secret key →
`TURNSTILE_SECRET_KEY` na serveru.

Za lokalni razvoj Cloudflare nudi javne test ključeve:

| Namena                         | Site key                   | Secret key                            |
| ------------------------------ | -------------------------- | ------------------------------------- |
| Provera uvek prolazi           | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Provera uvek pada (na serveru) | `1x00000000000000000000AA` | `2x0000000000000000000000000000000AA` |

Test ključevi ne smeju u produkciju (widget tada prikazuje „For testing only“).

### Lokalno pokretanje (forma + administracija)

```bash
# terminal 1 – lokalni SMTP koji poruke samo ispisuje
npm run dev:smtp

# heš lozinke za lokalnog administratora
npm run admin:hash-password

# .env.local
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_REQUIRE_TLS=false
SMTP_FROM_EMAIL=noreply@registarostavina.rs
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt:32768:8:1:...

# terminal 2
npm run dev        # sajt: http://localhost:5180, administracija: http://localhost:5180/admin/
```

Lokalna baza je `data/registar.db`. Pažnja: `.env.local` važi i za `npm run build`, pa ga pre
produkcionog build-a ukloniti ili zameniti pravim ključevima.

## Email / SMTP

- Poruka je **plain text** (bez HTML-a), na adresu `CONTACT_RECIPIENT_EMAIL`.
- Subject: `Upit sa sajta Centralni registar ostavina – {Ime i prezime}`.
- Sadrži sva polja, vreme prijema, saglasnost sa politikom (verzija) i broj upita u administraciji.
- `From`: `"Centralni registar ostavina" <SMTP_FROM_EMAIL>`; `Reply-To`: korisnik.
- Domen iz `SMTP_FROM_EMAIL` mora imati ispravne SPF/DKIM (i po mogućstvu DMARC) zapise.
- STARTTLS je obavezan (`SMTP_REQUIRE_TLS=true`) osim uz `SMTP_SECURE=true` (port 465).

## Produkcioni deployment

Zahtevi:

- Node.js 22.13+ (preporučeno 24);
- build: `npm ci` + `npm run build` sa pravim `VITE_TURNSTILE_SITE_KEY`;
- pokretanje: `dist/`, `dist-server/`, `package.json`, `package-lock.json`, `npm ci --omit=dev`,
  pa `npm start` (systemd servis ili kontejner);
- **trajan disk za bazu** (`DATABASE_PATH`) i njegova redovna rezervna kopija;
- serverske promenljive (Turnstile, SMTP, `ADMIN_*`) postavljene na serveru;
- HTTPS ispred servera (Cloudflare, nginx, Traefik…); HSTS podesiti na proxy-ju;
- jedna instanca servera (SQLite fajl i rate limit su lokalni za proces).

**Docker** (npr. Coolify): priložen je `Dockerfile` (Node 24, bez root privilegija, volumen
`/app/data`). `VITE_TURNSTILE_SITE_KEY` se prosleđuje kao build argument, a tajne kao env
promenljive kontejnera; na `/app/data` montirati trajni (imenovani) volumen.

Server sam servira `dist/` (brotli/gzip, `/assets/*` sa trajnim keširanjem, HTML sa `no-cache`) i
postavlja bezbednosna zaglavlja (CSP sa dozvolom za `challenges.cloudflare.com`, `X-Frame-Options`,
`nosniff`, `Referrer-Policy`, `Permissions-Policy`; `/admin/` i `/api/admin/*` sa `noindex`).

Iza proxy-ja podesiti `CLIENT_IP_HEADER` (`cf-connecting-ip` za Cloudflare, `x-forwarded-for` za
nginx/Traefik), inače bi svi posetioci delili rate limit adrese proxy-ja. Header koristiti samo ako
server nije direktno dostupan sa interneta, jer se inače može lažirati. Iz liste
`X-Forwarded-For` server uzima **poslednju** adresu (onu koju je dodao proxy ispred servera), pa
lažne adrese koje klijent sam pošalje ne utiču na rate limit. Zato `x-forwarded-for` koristiti samo
kada je ispred servera tačno jedan proxy; iza Cloudflare-a koristiti `cf-connecting-ip`.

## Produkcioni domen

Domen `registarostavina.rs` upisan je na sledećim mestima; pri promeni domena ažurirati sva:

- `index.html` — `canonical`, `og:url`, `og:image`, JSON-LD
- `public/robots.txt` — adresa sitemap-a
- `public/sitemap.xml` — adresa stranice (i `lastmod` pri većim izmenama sadržaja)
- `src/config/site.ts` — `SITE.url`, podrazumevani Demo/App URL-ovi i `CONTACT_EMAIL`
- `src/data/privacy.ts` — tekst politike privatnosti
- Turnstile widget u Cloudflare dashboard-u — dozvoljeni hostname

## Struktura projekta

```text
index.html                 javna stranica: meta tagovi, SEO, Open Graph, preload fonta
admin/index.html           administracija (noindex)
public/                    favicon.svg, apple-touch-icon.png, og-image.png, robots.txt, sitemap.xml
scripts/
  prerender.mjs            završni korak build-a (prerender + ugrađen CSS)
  dev-smtp.mjs             lokalni SMTP za razvoj (npm run dev:smtp)
  hash-password.mjs        heš admin lozinke (npm run admin:hash-password)
shared/                    kod koji koriste i browser i server
  contact.ts               polja forme, limiti, normalizacija, validacija (uključujući saglasnost)
  consent.ts               verzija politike, kolačić sa izborom, kategorije
  admin.ts                 tipovi administratorskog API-ja
  format.ts                zapis iznosa (2.500, 30.000)
server/                    Node server (produkcija) i API (i za dev/preview)
  index.ts, app.ts         ulaz servera, rutiranje (/api/*, /admin → /admin/, statički fajlovi)
  api.ts                   rutiranje /api/* i povezivanje sa bazom i konfiguracijom
  contact.ts               POST /api/contact
  cookieConsent.ts         POST /api/cookie-consent
  admin.ts, auth.ts        /api/admin/* (prijava, sesije, upiti, saglasnosti); scrypt i tokeni
  db.ts, store.ts          SQLite (migracije) i pristup podacima
  turnstile.ts, email.ts   Cloudflare provera; poruka i SMTP slanje
  static.ts, http.ts, cookies.ts, rateLimit.ts, config.ts, logger.ts
  *.test.ts                serverski testovi (baza u memoriji, pravi lokalni SMTP)
src/
  App.tsx, main.tsx, entry-server.tsx   javna stranica (hydrate) i render za prerender
  admin/                   administracija: AdminApp, LoginView, ContactsView, ContactDetailDialog,
                           CookieConsentsView, Dialog, ui, api, useAdminQuery (+ AdminApp.test.tsx)
  config/site.ts           APP_URLS, CONTACT_EMAIL, TURNSTILE_SITE_KEY
  data/                    tekstovi, cenovnik (pricing.ts), politika privatnosti (privacy.ts), navigacija
  components/
    layout/                Header (mobilni meni do 1280 px), Footer, BrandLink
    sections/              Hero, Benefits, DashboardSection, Lifecycle, AccessControl,
                           Pricing, FinalCta, Contact
    contact/               ContactForm, FormField, PrivacyPolicy, TurnstileWidget
    consent/               CookieBanner
    mockups/, ui/          ilustrativni prikazi interfejsa; Button, Container, SectionHeading…
  hooks/, lib/             useInView, useScrolled, useHydrated; cx, turnstile, contactApi, cookieConsent
  assets/fonts/            Inter (podskup) i licenca fonta (OFL)
  styles/index.css         Tailwind, tema, bazni stilovi, animacije, content-visibility
Dockerfile, .dockerignore  opcioni kontejner za produkciju
```

## Performanse

Lighthouse 12, produkcioni server lokalno (brotli): desktop 100 / 100 / 100 / 100 (performanse,
pristupačnost, najbolje prakse, SEO); mobilni profil sa stvarnim usporavanjem mreže
(`--throttling-method=devtools`) 94–96 / 100 / 100 / 100.

- Sekcije ispod prvog ekrana koriste `content-visibility: auto` (manje rada pri učitavanju).
- Turnstile skripta se učitava tek kada se kontakt forma približi ekranu; baner za kolačiće se
  pojavljuje posle učitavanja (fiksiran, bez pomeranja sadržaja).
- Napomena: na mašini na kojoj je mereno Chrome prijavljuje veličine fajlova bez kompresije,
  pa podrazumevana simulacija mobilnog profila daje pesimističnije rezultate.

## Font

**Inter 4.1** (SIL Open Font License, `src/assets/fonts/OFL.txt`), jedan varijabilni fajl
(400–700, ~26 KB), sveden na osnovnu latinicu, srpska slova i tipografske znake:

```bash
pip install fonttools brotli
python -m fontTools.varLib.instancer InterVariable.woff2 wght=400:700 opsz=drop -o inter-inst.ttf
python -m fontTools.subset inter-inst.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0106-0107,U+010C-010D,U+0110-0111,U+0160-0161,U+017D-017E,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2039-203A,U+2190-2193,U+20AC,U+2122,U+2212" \
  --layout-features="kern,liga,calt,ccmp,locl,mark,mkmk,tnum,case" \
  --flavor=woff2 --no-hinting --desubroutinize \
  --output-file=src/assets/fonts/inter-var-sr-latin.woff2
```

`InterVariable.woff2` je iz npm paketa `inter-ui` (4.1.x), direktorijum `variable/`.

## Slike za deljenje

`public/og-image.png` (1200×630) i `public/apple-touch-icon.png` (180×180) su statički fajlovi.

## Znak (grb Srbije)

Pored naziva sistema (header, footer, administracija, mockup aplikacije) prikazuje se grb Srbije,
isti kao u aplikaciji (`logo.svg`). Komponenta `LogoMark` učitava optimizovanu kopiju
`src/assets/images/grb-srbija.svg` (54 KB, ~16 KB kompresovano) kao keširanu sliku. Original je
`grb-srbija.svg` u korenu projekta (127 KB). Optimizovana kopija je napravljena komandom:

```bash
npx svgo@4 grb-srbija.svg -o src/assets/images/grb-srbija.svg --precision 2 --multipass
```

Ako se grb promeni, ponoviti komandu. `public/favicon.svg`, `apple-touch-icon.png` i
`og-image.png` za sada i dalje koriste raniji privremeni znak (dokument).
