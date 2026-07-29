/* eslint-disable no-undef */
// Bump this when changing the SW so caches/devtools pick up the new version.
const SW_VERSION = "2026-06-18-fcm-project-fix";

// Keep this SDK version in lockstep with the `firebase` npm package used by the
// app (see package.json). A mismatch makes the SW and the app open the same
// IndexedDB stores at different schema versions, which throws
// "VersionError: The requested version (1) is less than the existing version (2)"
// and blocks getToken().
importScripts(
  "https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js",
);

self.addEventListener("install", (event) => {
  console.log("[SW] install", SW_VERSION);
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate", SW_VERSION);
  event.waitUntil(self.clients.claim());
});

// Must match app/config/firebase.ts and the backend's FIREBASE_PROJECT_ID
// (basty-notifications). The old `baasti` project here meant the SW was wired
// to a different sender than the token the app minted, so background pushes
// never matched.
firebase.initializeApp({
  apiKey: "AIzaSyDS87lgVSCSvjaAMd1ieYLJHPmt-MefQqk",
  authDomain: "basty-notifications.firebaseapp.com",
  projectId: "basty-notifications",
  storageBucket: "basty-notifications.firebasestorage.app",
  messagingSenderId: "492102922262",
  appId: "1:492102922262:web:8bd8ad2919512e06a64537",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(async (payload) => {
  console.log("[SW] background message received", payload);
  const title = payload.notification?.title || "New notification";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logo.svg",
    badge: "/logo.svg",
    data: payload.data || {},
    tag: payload.data?.notificationId || undefined,
  };

  try {
    const clientList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    console.log(`[SW] broadcasting to ${clientList.length} client(s)`);
    for (const client of clientList) {
      client.postMessage({
        type: "NOTIFICATION_RECEIVED",
        data: payload.data || {},
      });
    }
  } catch (err) {
    console.warn("[SW] broadcast failed", err);
  }

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              data: event.notification.data || {},
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return null;
      }),
  );
});
