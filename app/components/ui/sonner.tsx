import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/providers/useTheme";

/**
 * App-wide toast host. Mounted once in main.tsx, inside ThemeProvider so it can
 * read the active theme.
 *
 * Two things are deliberately derived rather than hardcoded:
 *
 * - `theme`: our ThemeProvider models "system" as a *resolved* class on <html>,
 *   but sonner wants the literal string. Passing "system" through works because
 *   sonner resolves it via matchMedia the same way ThemeProvider does.
 * - `position`: toasts belong on the side the UI reads *from*, so RTL flips the
 *   horizontal anchor. `dir` on <html> is owned by i18n/config.ts; we key off
 *   the language rather than reading the DOM so it re-renders on switch.
 */
export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const isRTL = i18n.language.startsWith("ar");

  return (
    <Sonner
      theme={theme}
      dir={isRTL ? "rtl" : "ltr"}
      position={isRTL ? "top-left" : "top-right"}
      richColors
      closeButton
      // Map sonner's internals onto our design tokens so toasts match the rest
      // of the app in both themes instead of shipping sonner's default palette.
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  );
}
