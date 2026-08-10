// MUST be the first import: initializes Sentry/GlitchTip before any app code runs.
import "@/lib/instrument";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DeleteDialogProvider } from "@/components/DeleteConfirmationDialog";
import { AuthInitializer } from "@/components/AuthInitializer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { clearStaleChunkGuard } from "@/lib/stale-chunk";
import "@/i18n/config";
import "@/index.css";

// Reaching this line means the entry chunk parsed and the current bundle is
// intact, so release the one-shot reload guard for the next deploy. Must run
// before render: a crash during render should still be able to recover.
clearStaleChunkGuard();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/*
      Outermost boundary: the router's errorElement cannot catch throws from the
      providers below or from RouterProvider itself, so this is what stands
      between such a crash and a blank white page.
    */}
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <DeleteDialogProvider>
          <AuthInitializer>
            <RouterProvider router={router} />
            {/*
              Sibling of the router, not a child of any route, so toasts survive
              navigation. Inside ThemeProvider because it reads the active theme.
            */}
            <Toaster />
          </AuthInitializer>
        </DeleteDialogProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
