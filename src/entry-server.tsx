import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import App from './App';

/** Koristi se samo pri build-u, za unapred renderovan HTML stranice (scripts/prerender.mjs). */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
