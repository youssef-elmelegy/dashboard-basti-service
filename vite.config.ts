import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    // "hidden" emits .map files for upload to GlitchTip without adding a
    // sourceMappingURL comment to the shipped JS, so sources aren't exposed to
    // users but production stack traces are still readable once maps are
    // uploaded. Upload requires a GlitchTip auth token and belongs in CI.
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        // Split the big, stable vendor libraries out of the entry chunk.
        // Two goals: keep anything the login screen doesn't need off the
        // critical path, and give the rest long-lived cache entries that
        // survive app redeploys (vendor code changes far less often than
        // our own). Everything not matched here stays in the entry chunk —
        // deliberately, since a long tail of tiny chunks costs more in
        // requests than it saves in bytes.
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;

          // Loaded on demand by the auth store and useNotifications, so it
          // must be its own chunk to actually stay off the login path.
          if (id.includes("@firebase") || id.includes("/firebase/")) {
            return "firebase";
          }
          // Error reporting: large, and initialized from lib/instrument
          // before app code runs, but no reason to inline it into the entry.
          if (id.includes("@sentry")) return "sentry";
          // date-fns is deliberately NOT grouped with the lazy vendors
          // below: Navbar's NotificationsDropdown formats timestamps with
          // it, so it's a static dep of the app shell. Bundling it with
          // them would drag the whole group into the entry preload and
          // undo the split (measured: +196 KB on first paint).
          if (id.includes("date-fns")) return "date-fns";
          // Only reachable from the handful of routes using tables,
          // date pickers, or drag-and-drop — all lazily loaded.
          if (
            id.includes("@tanstack/table-core") ||
            id.includes("react-day-picker") ||
            id.includes("@dnd-kit")
          ) {
            return "vendor-heavy";
          }
          if (
            id.includes("/react-dom/") ||
            id.includes("/react-router") ||
            id.includes("/react/")
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
  // Strip all console.* and debugger statements from production builds so the
  // deployed app never dumps API errors / debug logs to the browser console.
  // Kept in dev (command === "serve") for local debugging.
  esbuild: {
    drop: command === "build" ? ["console", "debugger"] : [],
  },
}));
