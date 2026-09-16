"use client";

import { useEffect, useState } from "react";

/**
 * Registers the PWA service worker and offers a one-tap opt-in for local
 * browser notifications (permission prompts must follow a user gesture, so
 * we never call requestPermission() automatically).
 *
 * This covers realtime, in-tab notifications. Wiring true push (delivered
 * while the app is closed) needs a provider - see README "Push notifications".
 */
export default function NotificationSetup() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if ("Notification" in window && Notification.permission === "default") {
      // Deferred to a microtask so this isn't a synchronous setState-in-effect.
      queueMicrotask(() => setShowBanner(true));
    }
  }, []);

  if (!showBanner) return null;

  return (
    <div className="chip-primary flex items-center justify-between gap-3 px-4 py-2 text-sm">
      <span>Vill du få notiser om nya händelser och meddelanden?</span>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={async () => {
            await Notification.requestPermission();
            setShowBanner(false);
          }}
          className="rounded-md bg-[var(--color-primary)] px-3 py-1 font-semibold text-[var(--color-primary-text)]"
        >
          Aktivera
        </button>
        <button onClick={() => setShowBanner(false)} className="px-2 font-medium opacity-70">
          Inte nu
        </button>
      </div>
    </div>
  );
}
