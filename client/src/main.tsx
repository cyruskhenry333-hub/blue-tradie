import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSentry } from './sentry';
import { RootErrorBoundary } from './components/ErrorBoundary';

// First-load diagnostic logging
console.log('[Blue Tradie] App initializing...', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  online: navigator.onLine,
});

// Initialize Sentry monitoring
initSentry();

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

console.log('[Blue Tradie] App render complete');
