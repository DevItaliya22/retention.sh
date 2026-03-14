import { useEffect, useState } from "react";

/**
 * True when the browser is Chromium-based (Chrome, Edge, Opera, etc.).
 * False for Safari, Firefox, and others. Used to enable gooey SVG filter
 * and layout animations only where they perform well.
 */
export function isChromium(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return true;
  if (ua.includes("Edg")) return true;
  if (ua.includes("OPR") || ua.includes("Opera")) return true;
  if (ua.includes("Safari") && !ua.includes("Chrome")) return false;
  if (ua.includes("iPhone") || ua.includes("iPad")) return false;
  return false;
}

/** Client-only: true after mount when the browser is Chromium. Defaults to false to avoid hydration mismatch. */
export function useIsChromium(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    setValue(isChromium());
  }, []);
  return value;
}
