export const env = {
  // API Configuration
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",

  // Feature flags
  DEBUG_MODE: import.meta.env.DEV,

  // GlitchTip / Sentry error monitoring (optional — disabled if unset).
  // Mirrors the backend's SENTRY_DSN / SENTRY_RELEASE convention; the VITE_
  // prefix is required for Vite to expose the value to client code.
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  SENTRY_RELEASE: import.meta.env.VITE_SENTRY_RELEASE,
};
