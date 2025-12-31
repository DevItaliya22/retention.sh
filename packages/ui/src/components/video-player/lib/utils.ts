import type React from "react";

/**
 * No-op function
 * @returns undefined
 */
export function noop() {
  // noop
}

/**
 * Overloaded function for React synthetic events
 */
export function off<R extends HTMLElement>(
  element: EventTarget,
  events: string | string[],
  callback: (event: React.SyntheticEvent<R>) => void,
): EventTarget;

/**
 * Implementation
 */
export function off(
  element: EventTarget,
  events: string | string[],
  callback: (event: any) => void,
): EventTarget {
  if (Array.isArray(events)) {
    events.forEach((event) => {
      element.removeEventListener(event, callback as EventListener);
    });
  } else {
    element.removeEventListener(events, callback as EventListener);
  }

  return element;
}

/**
 * Overloaded function for React synthetic events
 */
export function on<R extends HTMLElement>(
  element: EventTarget,
  events: string | string[],
  callback: (event: React.SyntheticEvent<R>) => void,
): EventTarget;

/**
 * Implementation
 */
export function on(
  element: EventTarget,
  events: string | string[],
  callback: (event: any) => void,
): EventTarget {
  if (Array.isArray(events)) {
    events.forEach((event) => {
      element.addEventListener(event, callback as EventListener);
    });
  } else {
    element.addEventListener(events, callback as EventListener);
  }

  return element;
}

export function toFixedNumber(num: number, digits: number, base = 10) {
  const pow = Math.pow(base, digits);
  return Math.round(num * pow) / pow;
}

export function getDeviceLanguage() {
  const primaryLocale = navigator.language;
  return primaryLocale.split("-")[0];
}
