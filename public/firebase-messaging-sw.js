/* eslint-disable no-undef */
// Bump this when changing the SW so caches/devtools pick up the new version.
const SW_VERSION = "2026-04-26-broadcast";

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

self.addEventListener("install", (event) => {
  console.log("[SW] install", SW_VERSION);
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate", SW_VERSION);
  event.waitUntil(self.clients.claim());
});

firebase.initializeApp({
  apiKey: "AIzaSyBcdFzCjsn1pkR0QXg2qTeKN9R5Knv-u2E",
  authDomain: "baasti.firebaseapp.com",
  projectId: "baasti",
  storageBucket: "baasti.firebasestorage.app",
  messagingSenderId: "333213415683",
  appId: "1:333213415683:web:72192481ae6a304cb95136",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(async (payload) => {
  console.log("[SW] background message received", payload);
  const title = payload.notification?.title || "New notification";
  const options = {
    body: payload.notification?.body || "",
    icon: "/vite.svg",
    badge: "/vite.svg",
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
