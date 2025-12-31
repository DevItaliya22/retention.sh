import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {};

      const mediaQueryList = window.matchMedia(query);

      const listener = () => callback();

      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener("change", listener);
      } else {
        mediaQueryList.addListener(listener);
      }

      return () => {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener("change", listener);
        } else {
          mediaQueryList.removeListener(listener);
        }
      };
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
