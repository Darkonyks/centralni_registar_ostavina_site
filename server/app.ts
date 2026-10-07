import type { IncomingMessage, ServerResponse } from 'node:http';

import { isApiPath } from './api.ts';
import type { RequestHandler } from './http.ts';
import type { Logger } from './logger.ts';

/** Rutiranje: `/api/*` → API, `/admin` → `/admin/`, sve ostalo → statički fajlovi iz `dist/`. */
export function createApp(options: {
  apiHandler: RequestHandler;
  staticHandler: RequestHandler;
  logger: Logger;
}) {
  const { apiHandler, staticHandler, logger } = options;

  return (req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

    if (pathname === '/admin') {
      res.writeHead(301, { Location: '/admin/' });
      res.end();
      return;
    }

    const handler = isApiPath(pathname) ? apiHandler : staticHandler;
    handler(req, res).catch(() => {
      logger.error('server.unexpected_error', { path: pathname });
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end();
    });
  };
}
