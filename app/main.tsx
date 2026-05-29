import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { router } from "@/routes";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DeleteDialogProvider } from "@/components/DeleteConfirmationDialog";
import { AuthInitializer } from "@/components/AuthInitializer";
import "@/i18n/config";
import "@/index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Enable structured logs (experimental in both SDK and GlitchTip).
  _experiments: { enableLogs: true },
  integrations: [
    // Forward console.log / .info / .warn / .error from the browser to GlitchTip Logs.
    Sentry.consoleLoggingIntegration({
      levels: ["log", "info", "warn", "error"],
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DeleteDialogProvider>
        <AuthInitializer>
          <RouterProvider router={router} />
        </AuthInitializer>
      </DeleteDialogProvider>
    </ThemeProvider>
  </StrictMode>,
);
