import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DeleteDialogProvider } from "@/components/DeleteConfirmationDialog";
import { AuthInitializer } from "@/components/AuthInitializer";
import "@/i18n/config";
import "@/index.css";

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
