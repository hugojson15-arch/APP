// Minimal service worker: makes the app installable and receives push
// events. Actual push delivery requires wiring a provider (see README's
// "Push notifications" section) - this worker just displays whatever it's
// given so that piece can be dropped in later without touching the client.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Lag-app", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Lag-app", {
      body: payload.body,
      icon: "/icons/icon.svg",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/"));
});
