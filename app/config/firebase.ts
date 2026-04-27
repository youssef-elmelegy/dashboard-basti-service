import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyDS87lgVSCSvjaAMd1ieYLJHPmt-MefQqk",
  authDomain: "basty-notifications.firebaseapp.com",
  projectId: "basty-notifications",
  storageBucket: "basty-notifications.firebasestorage.app",
  messagingSenderId: "492102922262",
  appId: "1:492102922262:web:8bd8ad2919512e06a64537",
  measurementId: "G-Z9LK5PGJQJ",
};

export const VAPID_KEY =
  "BGTXyEK4kOH2_3LbHOV1wJl4RgLNk7zoZgJ_7JEE9YpeRCFKZfFkCBZ2lNpvgfCB7r9NYLIWk15zFfPNTrLKW-c";

const SERVICE_WORKER_URL = "/firebase-messaging-sw.js";

let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) {
    console.warn("[FCM] Firebase Messaging is not supported in this browser");
    return null;
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(getFirebaseApp());
  }
  return messagingInstance;
}

export async function registerFirebaseServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("[FCM] Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      SERVICE_WORKER_URL,
      { scope: "/" },
    );
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.error("[FCM] Service worker registration failed:", err);
    return null;
  }
}

function isPushServiceError(err: unknown): boolean {
  if (!err) return false;
  const name = (err as { name?: string }).name;
  const message = (err as { message?: string }).message ?? "";
  return (
    name === "AbortError" ||
    /push service error/i.test(message) ||
    /registration failed/i.test(message)
  );
}

async function clearStalePushSubscription(
  registration: ServiceWorkerRegistration,
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log("[FCM] Cleared stale push subscription");
      return true;
    }
  } catch (err) {
    console.warn("[FCM] Failed to clear stale push subscription:", err);
  }
  return false;
}

export async function requestFcmToken(): Promise<string | null> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  if (Notification.permission === "denied") {
    console.warn(
      "[FCM] Notification permission was denied — push will not work until the user re-enables it in browser settings",
    );
    return null;
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") {
    console.warn(`[FCM] Notification permission not granted (${permission})`);
    return null;
  }

  const serviceWorkerRegistration = await registerFirebaseServiceWorker();
  if (!serviceWorkerRegistration) return null;

  const tryGetToken = () =>
    getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    });

  try {
    const token = await tryGetToken();
    if (!token) {
      console.warn(
        "[FCM] getToken returned empty — VAPID key may be wrong or messaging is blocked",
      );
    }
    return token || null;
  } catch (err) {
    if (isPushServiceError(err)) {
      console.warn(
        "[FCM] getToken failed with push service error — clearing stale subscription and retrying",
        err,
      );
      const cleared = await clearStalePushSubscription(
        serviceWorkerRegistration,
      );
      if (cleared) {
        try {
          const token = await tryGetToken();
          return token || null;
        } catch (retryErr) {
          console.error("[FCM] getToken retry also failed:", retryErr);
          return null;
        }
      }
    }
    console.error("[FCM] getToken failed:", err);
    return null;
  }
}

export async function subscribeToForegroundMessages(
  handler: (payload: MessagePayload) => void,
): Promise<() => void> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}
