import * as Sentry from "@sentry/node";
import version from "../version.json";

export function initSentry() {
  // Only initialize Sentry if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.log('[SENTRY] No DSN provided, monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: version.build,
    integrations: [
      Sentry.httpIntegration({ tracing: true }),
      Sentry.expressIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out demo-related errors in production
      if (process.env.NODE_ENV === 'production' && 
          event.message?.includes('demo') ||
          event.exception?.values?.[0]?.value?.includes('demo')) {
        return null;
      }
      return event;
    }
  });

  console.log(`[SENTRY] Initialized for ${process.env.NODE_ENV} environment, release: ${version.build}`);
}

export { Sentry };