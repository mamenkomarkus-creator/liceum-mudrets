"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const KEY = "lm-cookie-notice-seen";
const EVENT = "lm-cookie-notice";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function seen(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * The site sets no tracking cookies, so this is an information notice rather than a consent request:
 * there is nothing to opt in or out of, and dismissing it changes nothing but hiding it.
 */
export function CookieNotice() {
  const dismissed = useSyncExternalStore(subscribe, seen, () => true);
  if (dismissed) return null;

  function close() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // private mode — the notice just shows again next visit
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <aside
      aria-label="Повідомлення про cookie"
      className="fixed inset-x-3 bottom-3 z-40 rounded-xl border border-border bg-card p-4 shadow-lg sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-sm"
    >
      <p className="text-sm leading-relaxed text-foreground/85">
        Сайт не використовує cookie для реклами чи стеження. Закладки й коментарі зберігаються лише у вашому браузері.{" "}
        <Link href="/privacy#cookies" className="font-medium text-primary underline underline-offset-2">
          Докладніше
        </Link>
      </p>
      <button
        type="button"
        onClick={close}
        className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-[filter] duration-150 ease-out hover:brightness-110"
      >
        Зрозуміло
      </button>
    </aside>
  );
}
