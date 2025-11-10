import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSentry } from './sentry';
import { RootErrorBoundary } from './components/ErrorBoundary';

// Initialize Sentry monitoring
initSentry();

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
