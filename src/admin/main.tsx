import '../styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AdminApp } from './AdminApp';

const container = document.getElementById('root');
if (!container) throw new Error('Nedostaje #root element u admin/index.html.');

createRoot(container).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
