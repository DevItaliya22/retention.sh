"use client";

import React from "react";

import { cn } from "../../../lib/utils";
import { durationDateTime, formatTimestamp } from "../lib/time";
import { useMediaStore } from "./media-provider";

const HOURS_IN_SECONDS = 60 * 60;

/**
 * Elapsed time
 * @note formatted as HH:MM:SS where HH only shows if > 1 hour
 */
export const Elapsed = React.forwardRef<
  HTMLTimeElement,
  React.HTMLProps<HTMLTimeElement>
>((props, forwardedRef) => {
  const { className, ...etc } = props;
  const currentTime = useMediaStore((s) => s.currentTime);
  const duration = useMediaStore((s) => s.duration);
  const player = useMediaStore((s) => s.player);

  return (
    <time
      dateTime={durationDateTime(currentTime, player?.seekRange())}
      role="timer"
      {...etc}
      className={cn("tabular-nums", className)}
      ref={forwardedRef}
    >
      <span className="sr-only">Elapsed</span>
      {formatTimestamp(currentTime, duration > HOURS_IN_SECONDS)}
    </time>
  );
});

Elapsed.displayName = "Elapsed";

/**
 * Remaining time
 * @note formatted as HH:MM:SS where HH only shows if > 1 hour
 */
export const Remaining = React.forwardRef<
  HTMLTimeElement,
  React.HTMLProps<HTMLTimeElement>
>((props, forwardedRef) => {
  const { className, ...etc } = props;
  const duration = useMediaStore((s) => s.duration);
  const currentTime = useMediaStore((s) => s.currentTime);
  const player = useMediaStore((s) => s.player);

  return (
    <time
      className={cn("tabular-nums", className)}
      dateTime={durationDateTime(duration - currentTime, player?.seekRange())}
      role="timer"
      {...etc}
      ref={forwardedRef}
    >
      <span className="sr-only">Remaining</span>
      <span aria-hidden>&minus;</span>
      {formatTimestamp(duration - currentTime, duration > HOURS_IN_SECONDS)}
    </time>
  );
});

Remaining.displayName = "Remaining";

/**
 * Total Duration of the content
 * @note formatted as HH:MM:SS where HH only shows if > 1 hour
 * @description Time is formatted as HH:MM:SS where HH will only be shown if time has hour
 */
export const Duration = React.forwardRef<
  HTMLTimeElement,
  React.HTMLProps<HTMLTimeElement>
>((props, forwardedRef) => {
  const { className, ...etc } = props;
  const duration = useMediaStore((s) => s.duration);
  const player = useMediaStore((s) => s.player);

  return (
    <time
      className={cn("tabular-nums", className)}
      dateTime={durationDateTime(duration, player?.seekRange())}
      ref={forwardedRef}
      {...etc}
    >
      <span className="sr-only">Duration</span>
      {formatTimestamp(duration, duration > HOURS_IN_SECONDS)}
    </time>
  );
});

Duration.displayName = "Duration";

export const HoverTime = React.forwardRef<
  HTMLTimeElement,
  React.HTMLProps<HTMLTimeElement>
>((props, forwardedRef) => {
  const { className, ...etc } = props;
  const hoveringTime = useMediaStore((s) => s.hoveringTime);
  const player = useMediaStore((s) => s.player);
  const duration = useMediaStore((s) => s.duration);

  return (
    <time
      className={cn("tabular-nums", className)}
      dateTime={durationDateTime(hoveringTime, player?.seekRange())}
      ref={forwardedRef}
      {...etc}
    >
      <span className="sr-only">Seek To:</span>
      {formatTimestamp(hoveringTime, duration > HOURS_IN_SECONDS)}
    </time>
  );
});

HoverTime.displayName = "HoverTime";
