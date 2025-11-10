/**
 * Dedicated Bull Queue Worker Process
 * Runs background jobs without binding to HTTP port
 * For use with Render worker service or separate worker dynos
 */

import { initSentry } from "./sentry";

// Initialize Sentry for error tracking in workers
initSentry();

console.log('[Worker] Starting Bull queue workers...');

// Import and start automation worker
import "./workers/automationWorker";

console.log('[Worker] All workers initialized and listening for jobs');

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('[Worker] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
