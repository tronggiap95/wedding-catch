import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { setLoadingProgress } from './game/ui/LoadingOverlay';

setLoadingProgress(0.05, 'Đang khởi tạo…');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
