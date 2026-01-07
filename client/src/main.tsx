import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSentry } from './sentry';
import { RootErrorBoundary } from './components/ErrorBoundary';
import { getAllowedCountries } from "@shared/market-config";

// First-load diagnostic logging
console.log('[Blue Tradie] App initializing...', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  online: navigator.onLine,
});

// Market lock diagnostic (helps verify runtime config injection)
console.log('[MARKET]', {
  lock: window.__BT_CONFIG__?.marketLock || 'none',
  allowedCountries: getAllowedCountries(),
});

// Initialize Sentry monitoring
initSentry();

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

console.log('[Blue Tradie] App render complete');
