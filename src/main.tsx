import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RedesignApp from './RedesignApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RedesignApp />
  </StrictMode>,
);
