// IMPORTANT: this file must be imported as the VERY FIRST line of main.tsx so
// Sentry can install its global handlers before any app code runs.
//
// Mirrors backend-basti-service/src/instrument.ts. The dashboard reports to a
// SEPARATE GlitchTip project from the backend: this DSN ships inside the client
// bundle and is therefore public (DSNs are write-only ingest keys, so this is
// expected for browser SDKs — but never reuse the backend's server-side DSN).
import * as Sentry from "@sentry/react";
import { env } from "@/config/env";

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: import.meta.env.MODE,
  // Release tag — CI passes the git SHA so we can correlate errors with deploys.
  release: env.SENTRY_RELEASE,
  // Disable entirely if no DSN is set (e.g., local dev without GlitchTip).
  enabled: !!env.SENTRY_DSN,
  // Don't leak user/request details to the issue tracker by default.
  sendDefaultPii: false,
  // Keep the SDK's default integrations — they include GlobalHandlers (uncaught
  // errors + unhandled promise rejections), Breadcrumbs, Dedupe and LinkedErrors.
  // Passing `integrations: []` would REPLACE that list, silently limiting reports
  // to what the error boundaries catch and missing async/event-handler throws.
  //
  // Errors only: browserTracing and replay are NOT defaults, so omitting them
  // here is enough — GlitchTip's support for them is partial and they're the
  // expensive, high-volume parts of the SDK.
});

/**
 * Report a caught render error to GlitchTip.
 *
 * Single choke point for every error boundary in the app, so swapping the
 * backing service later is a one-file change. `componentStack` is what makes a
 * minified production trace legible, so it's attached as context rather than
 * dropped.
 *
 * Safe to call when Sentry is disabled — captureException is a no-op then.
 */
export function reportError(
  error: unknown,
  componentStack?: string | null,
): void {
  Sentry.captureException(error, {
    contexts: componentStack ? { react: { componentStack } } : undefined,
  });

  // Stripped by esbuild.drop in production builds; kept so a crash is still
  // visible in the console during local development.
  if (import.meta.env.DEV) {
    console.error("Unhandled render error:", error);
  }
}
