/** Fires a local browser notification when the tab isn't in focus. Best-effort. */
export function notifyLocal(title: string, body: string, icon = "/icons/icon.svg") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (document.visibilityState === "visible") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon });
  } catch {
    // Notification can throw in some embedded contexts - safe to ignore.
  }
}
