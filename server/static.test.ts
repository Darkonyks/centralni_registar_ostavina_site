import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createApp } from './app.ts';
import type { RequestHandler } from './http.ts';
import { createStaticHandler } from './static.ts';
import { close, createTestLogger, listen } from './testUtils.ts';

let root: string;
let server: Server;
let baseUrl: string;
const apiHandler = vi.fn<RequestHandler>(async (_req, res) => {
  res.writeHead(204).end();
});

beforeAll(async () => {
  const parent = await mkdtemp(path.join(tmpdir(), 'crs-static-'));
  root = path.join(parent, 'dist');
  await mkdir(path.join(root, 'assets'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<!doctype html><title>Test</title>');
  await mkdir(path.join(root, 'admin'), { recursive: true });
  await writeFile(path.join(root, 'admin', 'index.html'), '<!doctype html><title>Admin</title>');
  await writeFile(path.join(root, 'assets', 'index-abc123.js'), 'console.log(1);'.repeat(50));
  await writeFile(path.join(parent, 'secret.env'), 'SMTP_PASSWORD=tajna');

  const { logger } = createTestLogger();
  const started = await listen(async (req, res) =>
    createApp({ apiHandler, staticHandler: createStaticHandler(root), logger })(req, res),
  );
  server = started.server;
  baseUrl = started.url;
});

afterAll(async () => {
  await close(server);
  await rm(path.dirname(root), { recursive: true, force: true });
});

/** Sirov HTTP zahtev (fetch normalizuje `..` u putanji, pa ga ne možemo koristiti za ovaj test). */
function rawGet(pathname: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl);
    const req = request({ host: url.hostname, port: url.port, path: pathname }, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => (body += chunk.toString()));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

describe('statički server', () => {
  it('servira index.html sa CSP i bezbednosnim zaglavljima, bez keširanja', async () => {
    const response = await fetch(`${baseUrl}/`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    const csp = response.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("script-src 'self' https://challenges.cloudflare.com");
    expect(csp).toContain('frame-src https://challenges.cloudflare.com');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('fajlove iz /assets kešira trajno i kompresuje (brotli)', async () => {
    const response = await fetch(`${baseUrl}/assets/index-abc123.js`, {
      headers: { 'Accept-Encoding': 'br' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('content-encoding')).toBe('br');
    // fetch automatski dekompresuje telo
    expect(await response.text()).toBe('console.log(1);'.repeat(50));
  });

  it.each(['/../secret.env', '/%2e%2e/secret.env', '/assets/../../secret.env', '/..%2fsecret.env'])(
    'ne dozvoljava izlazak iz dist/ (%s)',
    async (pathname) => {
      const response = await rawGet(pathname);
      expect(response.status).toBe(404);
      expect(response.body).not.toContain('tajna');
    },
  );

  it('nepostojeći fajl vraća 404', async () => {
    expect((await fetch(`${baseUrl}/nema.html`)).status).toBe(404);
  });

  it('svi /api/* zahtevi idu na API handler', async () => {
    expect((await fetch(`${baseUrl}/api/contact`, { method: 'POST' })).status).toBe(204);
    expect((await fetch(`${baseUrl}/api/admin/session`)).status).toBe(204);
    expect(apiHandler).toHaveBeenCalledTimes(2);
  });

  it('/admin preusmerava na /admin/, a administracija nije za indeksiranje', async () => {
    const redirect = await fetch(`${baseUrl}/admin`, { redirect: 'manual' });
    expect(redirect.status).toBe(301);
    expect(redirect.headers.get('location')).toBe('/admin/');

    const page = await fetch(`${baseUrl}/admin/`);
    expect(page.status).toBe(200);
    expect(page.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(page.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  });

  it('odbija metode osim GET/HEAD za statičke fajlove', async () => {
    const response = await fetch(`${baseUrl}/`, { method: 'POST' });
    expect(response.status).toBe(405);
  });
});
