"use client";

import { useCallback, useSyncExternalStore } from "react";

function getStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item != null ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageValue(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function subscribeToStorage(key: string, callback: () => void): () => void {
  const handler = (e: StorageEvent | Event) => {
    if (e instanceof StorageEvent && e.key !== key) return;
    callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener("local-storage-update", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("local-storage-update", handler);
  };
}

/**
 * Generic hook for reading and writing to localStorage with SSR safety.
 * Returns [value, setValue] where setValue updates both state and localStorage.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback(
    () => getStorageValue(key, defaultValue),
    [key, defaultValue],
  );

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const subscribe = useCallback(
    (callback: () => void) => subscribeToStorage(key, callback),
    [key],
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const nextValue =
        typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      setStorageValue(key, nextValue);
      // Trigger re-render (storage event fires only for other tabs)
      window.dispatchEvent(new Event("local-storage-update"));
    },
    [key, value],
  );

  return [value, setValue];
}
