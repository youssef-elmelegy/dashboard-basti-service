import {
  notificationApi,
  type SupportedLanguage,
} from "@/lib/api/notification.api";

export type { SupportedLanguage };

let lastSyncedLanguage: SupportedLanguage | null = null;

/** Normalizes a detected locale (e.g. "ar-EG") to a supported language. */
export function normalizeLanguage(language?: string): SupportedLanguage {
  return language?.startsWith("ar") ? "ar" : "en";
}

/**
 * Persist the admin's language on the backend so FCM pushes are delivered in
 * it. Notifications are stored bilingually, so this only picks a side — it
 * never triggers a translation.
 *
 * Safe to call on every login and every language switch: it skips the write if
 * the language hasn't changed since the last successful sync, and swallows
 * errors so a failed sync never blocks the UI (the push simply stays in the
 * previously synced language).
 */
export async function syncLanguageWithBackend(
  language?: string,
): Promise<void> {
  const normalized = normalizeLanguage(language);
  if (normalized === lastSyncedLanguage) return;

  try {
    await notificationApi.updateLanguage(normalized);
    lastSyncedLanguage = normalized;
  } catch (err) {
    console.warn("[i18n] Failed to sync language with backend:", err);
  }
}

/**
 * Clears the cached value so the next sync always hits the backend. Call on
 * logout — the next admin to log in on this browser may prefer another
 * language, and must not be skipped by the previous session's cache.
 */
export function resetLanguageSyncCache(): void {
  lastSyncedLanguage = null;
}
