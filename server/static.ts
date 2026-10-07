import { readFile, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

import type { RequestHandler } from './http.ts';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.txt', '.xml', '.json']);

/**
 * Content-Security-Policy za stranicu. Turnstile zahteva skriptu i iframe sa
 * challenges.cloudflare.com; stilovi su ugrađeni u HTML pri build-u ('unsafe-inline').
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

interface CachedFile {
  body: Buffer;
  br?: Buffer;
  gzip?: Buffer;
}

function cacheControl(urlPath: string, ext: string): string {
  if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (ext === '.html') return 'no-cache';
  return 'public, max-age=86400';
}

/**
 * Statički fajlovi iz `dist/`. Sadržaj se ne menja dok proces radi (novi deploy = restart),
 * pa se fajlovi i njihove kompresovane verzije čuvaju u memoriji.
 */
export function createStaticHandler(rootDir: string): RequestHandler {
  const root = path.resolve(rootDir);
  const cache = new Map<string, CachedFile>();

  async function load(filePath: string): Promise<CachedFile | null> {
    const cached = cache.get(filePath);
    if (cached) return cached;
    try {
      const info = await stat(filePath);
      if (!info.isFile()) return null;
      const file: CachedFile = { body: await readFile(filePath) };
      cache.set(filePath, file);
      return file;
    } catch {
      return null;
    }
  }

  function notFound(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
    res.end('Stranica nije pronađena.');
  }

  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD', ...SECURITY_HEADERS });
      res.end();
      return;
    }

    let urlPath: string;
    try {
      urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    } catch {
      notFound(res);
      return;
    }
    if (urlPath.includes('\0')) {
      notFound(res);
      return;
    }
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    const filePath = path.join(root, path.normalize(urlPath));
    if (!filePath.startsWith(root + path.sep)) {
      notFound(res);
      return;
    }

    const file = await load(filePath);
    if (!file) {
      notFound(res);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers: Record<string, string> = {
      'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': cacheControl(urlPath, ext),
      ...SECURITY_HEADERS,
    };
    if (ext === '.html') headers['Content-Security-Policy'] = CONTENT_SECURITY_POLICY;
    if (urlPath.startsWith('/admin/')) headers['X-Robots-Tag'] = 'noindex, nofollow';

    let body = file.body;
    if (COMPRESSIBLE.has(ext)) {
      headers.Vary = 'Accept-Encoding';
      const accepted = String(req.headers['accept-encoding'] ?? '');
      if (/\bbr\b/.test(accepted)) {
        file.br ??= brotliCompressSync(file.body, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
        });
        body = file.br;
        headers['Content-Encoding'] = 'br';
      } else if (/\bgzip\b/.test(accepted)) {
        file.gzip ??= gzipSync(file.body, { level: 9 });
        body = file.gzip;
        headers['Content-Encoding'] = 'gzip';
      }
    }

    headers['Content-Length'] = String(body.length);
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  };
}
