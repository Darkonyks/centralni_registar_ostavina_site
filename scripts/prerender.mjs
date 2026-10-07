/**
 * Završni korak build-a: upisuje unapred renderovan HTML u dist/index.html
 * i ugrađuje CSS direktno u stranicu.
 *
 * Pokreće se posle `vite build` (klijent) i `vite build --ssr` (server bundle).
 * - Browser i pretraživači odmah dobijaju kompletan sadržaj, a React ga zatim
 *   samo „oživi“ (hydrateRoot) bez ponovnog iscrtavanja.
 * - Ugrađen CSS (~8 KB kompresovano) uklanja jedan zahtev koji blokira prvi prikaz.
 *   CSS fajl ostaje u dist/assets jer ga koristi i administracija (dist/admin/index.html).
 */
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const templatePath = path.join(distDir, 'index.html');
const ssrDir = path.join(root, 'dist-ssr');
const PLACEHOLDER = '<!--app-html-->';

const { render } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

let html = await readFile(templatePath, 'utf8');
if (!html.includes(PLACEHOLDER)) {
  throw new Error(`Prerender: u ${templatePath} nedostaje ${PLACEHOLDER}.`);
}
html = html.replace(PLACEHOLDER, () => render());

const stylesheet = html.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
if (!stylesheet) {
  throw new Error('Prerender: u dist/index.html nije pronađen CSS fajl.');
}
const [linkTag, cssHref] = stylesheet;
const cssPath = path.join(distDir, cssHref);
const css = await readFile(cssPath, 'utf8');
html = html.replace(linkTag, () => `<style>${css}</style>`);

await writeFile(templatePath, html);
await rm(ssrDir, { recursive: true, force: true });

console.log(`Prerender: dist/index.html sadrži renderovan HTML i ugrađen CSS (${cssHref}).`);
