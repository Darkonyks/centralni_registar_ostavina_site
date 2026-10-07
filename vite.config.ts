import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { createApiFromConfig, isApiPath } from './server/api.ts';
import { loadApiConfig, type Env } from './server/config.ts';
import type { RequestHandler } from './server/http.ts';
import { consoleLogger } from './server/logger.ts';

/**
 * API (`/api/*`) i u `npm run dev` / `npm run preview`, sa istim handler-ima kao produkcioni
 * server (server/index.ts). Serverske promenljive se čitaju iz `.env` fajlova.
 */
function api(env: Env): Plugin {
  let handler: RequestHandler | undefined;
  const getHandler = () =>
    (handler ??= createApiFromConfig(loadApiConfig(env), consoleLogger).handler);

  type Next = () => void;
  const mount = (middlewares: {
    use: (
      fn: (
        req: Parameters<RequestHandler>[0],
        res: Parameters<RequestHandler>[1],
        next: Next,
      ) => void,
    ) => void;
  }) => {
    middlewares.use((req, res, next) => {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      if (isApiPath(pathname)) void getHandler()(req, res);
      else next();
    });
  };

  return {
    name: 'site-api',
    configureServer: (server) => mount(server.middlewares),
    configurePreviewServer: (server) => mount(server.middlewares),
  };
}

const root = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    plugins: [react(), tailwindcss(), api(env)],
    build: {
      // Stranica je mala; jedan CSS fajl je brži od dodatnog deljenja.
      cssCodeSplit: false,
      // Serverski bundle-ovi (prerender, API server) ne treba da kopiraju public/.
      copyPublicDir: !isSsrBuild,
      // Dve stranice: javni sajt i administracija (zaseban JS koji posetioci sajta ne preuzimaju).
      rollupOptions: isSsrBuild
        ? undefined
        : {
            input: { main: root('./index.html'), admin: root('./admin/index.html') },
            output: {
              // Zajednički kod obe stranice (React, ikonice, znak, pomoćne funkcije) u jednom fajlu.
              manualChunks: (id: string) =>
                /node_modules|modulepreload-polyfill|[\\/]src[\\/](styles[\\/]|lib[\\/]cx|components[\\/]ui[\\/]LogoMark)/.test(
                  id,
                )
                  ? 'vendor'
                  : undefined,
            },
          },
    },
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'client',
            environment: 'jsdom',
            include: ['src/**/*.test.{ts,tsx}'],
            setupFiles: ['src/test/setup.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'server',
            environment: 'node',
            include: ['server/**/*.test.ts', 'shared/**/*.test.ts'],
          },
        },
      ],
    },
  };
});
