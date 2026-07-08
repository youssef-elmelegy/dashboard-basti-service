import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslations from "./locales/en.json";
import arTranslations from "./locales/ar.json";
import { invalidateAllStores } from "@/stores/invalidateAllOnLanguageChange";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
    },
    fallbackLng: "en",
    // Normalize region codes (e.g. "ar-EG" -> "ar") so language checks and
    // direction handling stay reliable regardless of the detected locale.
    supportedLngs: ["en", "ar"],
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

// Keep <html dir/lang> in sync with the active language for EVERY route
// (including ones outside the app layout, e.g. login). This makes `dir` the
// single source of truth so logical CSS properties flip automatically.
const applyDirection = (language?: string) => {
  if (typeof document === "undefined") return;
  const lng = language || i18n.language || "en";
  const isRTL = lng.startsWith("ar");
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = isRTL ? "ar" : "en";
};

// i18next initializes asynchronously, so `i18n.language` may not be resolved
// at import time. Apply once eagerly, then again once init finishes and on
// every subsequent language change, so first-load (e.g. saved Arabic) is correct.
applyDirection();
i18n.on("initialized", () => applyDirection());
i18n.on("languageChanged", (lng: string) => applyDirection(lng));

// API-backed data (names, labels, etc.) is locale-dependent, so every
// store that caches API responses must be invalidated on language change
// to refetch in the new language. This also fires once for the initial
// language-detection event on load, but stores are empty at that point so
// invalidating is a harmless no-op.
i18n.on("languageChanged", () => invalidateAllStores());

export default i18n;
