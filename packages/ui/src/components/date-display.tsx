"use client";

import * as React from "react";
import { formatDate, formatRelativeTime } from "../lib/format";
import { TimestampInfo } from "./time-stamp-info";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface DateDisplayProps {
  date: Date | string | number | null | undefined;
  className?: string;
  formatOptions?: Intl.DateTimeFormatOptions;
  relative?: boolean;
  variant?: "current" | "timestampInfo";
}

export function DateDisplay({
  date,
  className,
  formatOptions,
  relative,
  variant = "current",
}: DateDisplayProps) {
  // If formatOptions is provided, default to absolute formatting (relative=false)
  // Otherwise, default to relative formatting (relative=true)
  const shouldUseRelative = relative ?? !formatOptions;
  const dateObj = React.useMemo(() => {
    if (!date) return null;
    const parsed = new Date(date);
    // Check if date is valid
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }, [date]);

  const [displayedText, setDisplayedText] = React.useState(() => {
    if (!dateObj) return "";
    if (shouldUseRelative) {
      return formatRelativeTime(dateObj);
    }
    return formatDate(dateObj, formatOptions);
  });

  // Update relative time periodically if using relative format
  React.useEffect(() => {
    if (!dateObj) {
      setDisplayedText("");
      return;
    }

    if (!shouldUseRelative) {
      setDisplayedText(formatDate(dateObj, formatOptions));
      return;
    }

    // Update immediately
    setDisplayedText(formatRelativeTime(dateObj));

    // Calculate interval based on how old the date is
    const diffInSeconds = Math.floor(
      (new Date().getTime() - dateObj.getTime()) / 1000,
    );

    let intervalMs = 60000; // Default: 1 minute

    if (diffInSeconds < 60) {
      intervalMs = 10000; // Update every 10 seconds for very recent dates
    } else if (diffInSeconds < 3600) {
      intervalMs = 60000; // Update every minute for dates less than 1 hour old
    } else if (diffInSeconds < 86400) {
      intervalMs = 3600000; // Update every hour for dates less than 1 day old
    } else {
      intervalMs = 86400000; // Update daily for older dates
    }

    const interval = setInterval(() => {
      setDisplayedText(formatRelativeTime(dateObj));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [dateObj, formatOptions, shouldUseRelative]);

  const tooltipContent = React.useMemo(() => {
    if (!dateObj) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      }).format(dateObj);
    } catch {
      return "";
    }
  }, [dateObj]);

  if (!dateObj || !displayedText) return null;

  if (variant === "timestampInfo") {
    return (
      <TimestampInfo
        utcTimestamp={dateObj.toISOString()}
        label={displayedText}
        className={className}
      />
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>{displayedText}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}
