import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import App from './App';

// Uključuje animaciju pojavljivanja sekcija tek kada JavaScript radi,
// tako da je unapred renderovan sadržaj vidljiv i bez njega.
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');
}

const container = document.getElementById('root');
if (!container) throw new Error('Nedostaje #root element u index.html.');

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Production build sadrži unapred renderovan HTML (scripts/prerender.mjs); u dev režimu je #root prazan.
if (container.firstElementChild) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
