import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { onTestFinished, vi } from 'vitest';

import { openDatabase, type Database } from './db.ts';
import type { RequestHandler } from './http.ts';
import type { Logger } from './logger.ts';

/**
 * Portovi koje `fetch` odbija („bad port“, Fetch standard). Na Windows-u ih `listen(0)`
 * ponekad dodeli, pa se tada bira drugi port.
 */
const FETCH_BLOCKED_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79, 87, 95, 101, 102,
  103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137, 139, 143, 161, 179, 389, 427, 465,
  512, 513, 514, 515, 526, 530, 531, 532, 540, 548, 554, 556, 563, 587, 601, 636, 989, 990, 993,
  995, 1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668,
  6669, 6679, 6697, 10080,
]);

/** Pokreće handler na nasumičnom portu (127.0.0.1) i vraća njegovu adresu. */
export async function listen(handler: RequestHandler): Promise<{ url: string; server: Server }> {
  for (;;) {
    const server = createServer((req, res) => void handler(req, res));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    if (!FETCH_BLOCKED_PORTS.has(port)) return { url: `http://127.0.0.1:${port}`, server };
    await close(server);
  }
}

export function close(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

export function createTestLogger() {
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } satisfies Logger;
  /** Sve što je logovano, kao jedan string (za proveru da tajne i sadržaj nisu u logu). */
  const dump = () =>
    JSON.stringify([
      ...logger.info.mock.calls,
      ...logger.warn.mock.calls,
      ...logger.error.mock.calls,
    ]);
  return { logger, dump };
}

/** Baza za jedan test (podrazumevano u memoriji); zatvara se automatski kada test završi. */
export function openTestDatabase(file = ':memory:'): Database {
  const db = openDatabase(file);
  onTestFinished(() => {
    if (db.isOpen) db.close();
  });
  return db;
}
