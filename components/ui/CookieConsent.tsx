"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "cookie_consent";
const CHANGE_EVENT = "cookie-consent-change";

function getSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return true;
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

export default function CookieConsent() {
  const accepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const accept = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  if (accepted) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 p-4 max-w-sm rounded-xl bg-[var(--surface)] border border-[var(--ov-10)] shadow-lg space-y-3"
      role="dialog"
      aria-label="Cookie consent"
    >
      <p className="text-xs text-[var(--muted)]">
        We use essential local storage to enhance your decentralized savings experience.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={accept}
          className="px-3 py-1.5 rounded-lg bg-[#4B6B76] text-white text-xs font-semibold"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
