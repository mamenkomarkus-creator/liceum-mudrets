"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "lm-local-store";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** localStorage-backed JSON state, shared between components and tabs. Renders `fallback` on the server. */
export function useLocalJson<T>(key: string, fallback: T): [T, (next: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null
  );

  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
    // `fallback` is a constant literal at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const write = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage unavailable (private mode) — the change simply isn't persisted
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key]
  );

  return [value, write];
}
