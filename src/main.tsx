import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Global error handler to catch rendering errors
window.addEventListener('error', (e) => {
  console.error('[APP ERROR]', e.message, e.filename, e.lineno, e.colno, e.error?.stack);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[APP REJECTION]', e.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
