import i18n from "@/i18n/config";

const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Current UI language, normalized to what the backend supports.
 *
 * Strips any region subtag ("ar-EG" -> "ar") and falls back to "en" for
 * anything unsupported, so the value is always safe to send as-is.
 */
export function getCurrentLanguage(): SupportedLanguage {
  const lang = i18n.language?.split("-")[0];
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
    ? (lang as SupportedLanguage)
    : "en";
}

/**
 * Accept-Language header for backend requests.
 *
 * The API resolves response copy AND transactional email language from this
 * header (NestJS AcceptLanguageResolver), so every authenticated request to
 * our own API should carry it — not just the ones made through apiClient.
 */
export function languageHeader(): { "Accept-Language": SupportedLanguage } {
  return { "Accept-Language": getCurrentLanguage() };
}
