import { requestFcmToken } from "@/config/firebase";
import { notificationApi } from "@/lib/api/notification.api";

let lastRegisteredToken: string | null = null;
let inFlight: Promise<string | null> | null = null;

/**
 * Request an FCM token from the browser and register it with the backend
 * for the currently authenticated admin (uses the session cookie).
 *
 * Safe to call multiple times — dedupes concurrent calls and skips the
 * backend write if the token hasn't changed since the last successful
 * registration in this session.
 */
export function registerFcmWithBackend(): Promise<string | null> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      console.log("[FCM] Requesting token…");
      const token = await requestFcmToken();

      if (!token) {
        console.warn(
          "[FCM] No token obtained — push notifications disabled for this session",
        );
        return null;
      }

      if (token === lastRegisteredToken) {
        console.log("[FCM] Token unchanged, skipping backend registration");
        return token;
      }

      try {
        await notificationApi.registerToken(token);
        lastRegisteredToken = token;
        console.log("[FCM] Token registered with backend");
        return token;
      } catch (err) {
        console.error("[FCM] Failed to register token with backend:", err);
        return null;
      }
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function resetFcmRegistrationCache(): void {
  lastRegisteredToken = null;
}

/**
 * Clear the FCM token both on the backend (so the server stops targeting
 * this admin) and locally (unsubscribe the browser push subscription so a
 * fresh token is minted on the next login). Must be called BEFORE the
 * logout API call — once the auth cookie is gone, the DELETE endpoint
 * would 401.
 */
export async function clearFcmRegistration(): Promise<void> {
  try {
    await notificationApi.clearToken();
    console.log("[FCM] Token cleared on backend");
  } catch (err) {
    console.warn("[FCM] Failed to clear token on backend:", err);
  }

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log("[FCM] Browser push subscription unsubscribed");
      }
    } catch (err) {
      console.warn("[FCM] Failed to unsubscribe browser push:", err);
    }
  }

  lastRegisteredToken = null;
}
