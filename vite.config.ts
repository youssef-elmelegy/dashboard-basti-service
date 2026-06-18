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
  // Strip all console.* and debugger statements from production builds so the
  // deployed app never dumps API errors / debug logs to the browser console.
  // Kept in dev (command === "serve") for local debugging.
  esbuild: {
    drop: command === "build" ? ["console", "debugger"] : [],
  },
}));
