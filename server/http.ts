import type { IncomingMessage, ServerResponse } from 'node:http';

export type RequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export class HttpError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(status: number, reason: string) {
    super(reason);
    this.status = status;
    this.reason = reason;
  }
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(payload);
}

/**
 * Čita JSON telo zahteva uz ograničenje veličine. Prekoračenje (po `Content-Length`
 * ili tokom čitanja) daje 413, neispravan JSON 400.
 */
export async function readJsonBody(req: IncomingMessage, maxBytes: number): Promise<unknown> {
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError(413, 'body_too_large');
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = chunk as Buffer;
    size += buffer.length;
    if (size > maxBytes) throw new HttpError(413, 'body_too_large');
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

/**
 * IP adresa klijenta. Header (npr. `cf-connecting-ip`) se koristi samo ako je izričito
 * podešen, jer ga inače svako može lažirati.
 */
export function getClientIp(req: IncomingMessage, trustedHeader?: string): string {
  if (trustedHeader) {
    const value = req.headers[trustedHeader];
    const first = (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? 'unknown';
}
