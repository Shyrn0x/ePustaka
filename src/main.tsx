import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket errors
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('failed to connect to websocket')) return;
  originalError(...args);
};

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('WebSocket closed without opened')) {
    event.preventDefault();
  }
});


const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  value: async (...args: any[]) => {
    const [resource, config] = args;
    const token = localStorage.getItem('token');
    if (token && typeof resource === 'string' && resource.startsWith('/api/')) {
      const newConfig = config || {};
      newConfig.headers = {
        ...newConfig.headers,
        'Authorization': `Bearer ${token}`
      };
      return originalFetch(resource, newConfig);
    }
    return originalFetch.apply(window, args as any);
  },
  configurable: true,
  writable: true
});

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <App />
  </StrictMode>,
);
