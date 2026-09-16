/** Fires a local browser notification when the tab isn't in focus. Best-effort. */
export function notifyLocal(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (document.visibilityState === "visible") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icons/icon-192.png" });
  } catch {
    // Notification can throw in some embedded contexts - safe to ignore.
  }
}
