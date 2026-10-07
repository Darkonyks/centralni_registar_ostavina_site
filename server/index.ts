/**
 * Produkcioni server: statički sajt iz `dist/` (javna stranica i `/admin/`) + API (`/api/*`).
 * Pokretanje: `npm start` (posle `npm run build`). Konfiguracija: environment promenljive
 * ili `.env` u korenu projekta (vidi `.env.example`).
 */
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

import { createApiFromConfig } from './api.ts';
import { createApp } from './app.ts';
import { loadServerConfig } from './config.ts';
import { consoleLogger } from './logger.ts';
import { createStaticHandler } from './static.ts';

const config = loadServerConfig(process.env);
const logger = consoleLogger;

// Bundle je u dist-server/, statički sajt u dist/.
const staticDir = fileURLToPath(new URL('../dist', import.meta.url));

const api = createApiFromConfig(config, logger);
const server = createServer(
  createApp({
    apiHandler: api.handler,
    staticHandler: createStaticHandler(staticDir),
    logger,
  }),
);
server.headersTimeout = 10_000;
server.requestTimeout = 30_000;

server.listen(config.port, config.host, () => {
  logger.info('server.started', { host: config.host, port: config.port });
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      api.db?.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
