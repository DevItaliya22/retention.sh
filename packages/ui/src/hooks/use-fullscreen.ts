"use client";

import * as React from "react";

interface UseFullscreenReturn {
  isFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
}

interface FullscreenHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

async function requestElementFullscreen(element: HTMLElement) {
  const el = element as FullscreenHTMLElement;
  if (el.requestFullscreen) return await el.requestFullscreen();
  if (el.webkitRequestFullscreen) return await el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return await el.mozRequestFullScreen();
  if (el.msRequestFullscreen) return await el.msRequestFullscreen();
}

async function exitDocumentFullscreen() {
  const doc = document as FullscreenDocument;
  if (document.exitFullscreen) return await document.exitFullscreen();
  if (doc.webkitExitFullscreen) return await doc.webkitExitFullscreen();
  if (doc.mozCancelFullScreen) return await doc.mozCancelFullScreen();
  if (doc.msExitFullscreen) return await doc.msExitFullscreen();
}

export function useFullscreen(
  targetRef: React.RefObject<HTMLElement | null>,
): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!getFullscreenElement());
    };

    onChange();

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener(
      "webkitfullscreenchange",
      onChange as EventListener,
    );

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onChange as EventListener,
      );
    };
  }, []);

  const enterFullscreen = React.useCallback(async () => {
    if (getFullscreenElement()) return;
    const el = targetRef.current;
    if (!el) return;
    try {
      await requestElementFullscreen(el);
    } catch (error) {
      console.warn("Failed to enter fullscreen", { error });
    }
  }, [targetRef]);

  const exitFullscreen = React.useCallback(async () => {
    if (!getFullscreenElement()) return;
    try {
      await exitDocumentFullscreen();
    } catch (error) {
      console.warn("Failed to exit fullscreen", { error });
    }
  }, []);

  const toggleFullscreen = React.useCallback(async () => {
    if (getFullscreenElement()) return await exitFullscreen();
    return await enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
