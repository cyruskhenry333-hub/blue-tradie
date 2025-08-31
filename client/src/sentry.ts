import * as Sentry from "@sentry/react";
import version from "../../version.json";

export function initSentry() {
  // Only initialize Sentry if DSN is provided
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log('[SENTRY] No DSN provided, monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    release: version.build,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Filter out demo-related errors in production
      if (import.meta.env.MODE === 'production' && 
          (event.message?.includes('demo') ||
           event.exception?.values?.[0]?.value?.includes('demo'))) {
        return null;
      }
      return event;
    }
  });

  console.log(`[SENTRY] Initialized for ${import.meta.env.MODE} environment, release: ${version.build}`);
}

export { Sentry };