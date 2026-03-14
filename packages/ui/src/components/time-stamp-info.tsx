"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useEffect, useRef, useState } from "react";
import { formatRelativeTime } from "../lib/format";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

dayjs.extend(utc);

const unixMicroToIsoTimestamp = (unix: string | number): string => {
  return dayjs.unix(Number(unix) / 1000 / 1000).toISOString();
};

const isUnixMicro = (unix: string | number): boolean => {
  const digitLength = String(unix).length === 16;
  const isNum = !Number.isNaN(Number(unix));
  return isNum && digitLength;
};

type TimestampFormatter = {
  utcTimestamp: string | number;
  format?: string;
};

export const timestampLocalFormatter = ({
  utcTimestamp,
  format,
}: TimestampFormatter) => {
  const timestamp = isUnixMicro(utcTimestamp)
    ? unixMicroToIsoTimestamp(utcTimestamp)
    : utcTimestamp;
  return dayjs.utc(timestamp).local().format(format);
};

const timestampUtcFormatter = ({
  utcTimestamp,
  format,
}: TimestampFormatter) => {
  const timestamp = isUnixMicro(utcTimestamp)
    ? unixMicroToIsoTimestamp(utcTimestamp)
    : utcTimestamp;
  return dayjs.utc(timestamp).format(format);
};

function timestampRelativeFormatter({
  utcTimestamp,
}: TimestampFormatter): string {
  const timestamp = isUnixMicro(utcTimestamp)
    ? unixMicroToIsoTimestamp(utcTimestamp)
    : utcTimestamp;
  const date = dayjs.utc(timestamp).toDate();
  return formatRelativeTime(date);
}

function TimestampTooltipRow({
  rowLabel,
  value,
}: {
  rowLabel: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        navigator.clipboard.writeText(value);
      }}
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-x-2 px-2 py-1.5 text-left transition-colors",
        "hover:bg-muted/80 focus:bg-muted/80 focus:outline-none",
        "border-border border-b border-dashed last:border-b-0",
        copied && "bg-muted",
      )}
    >
      <span className="text-muted-foreground shrink-0 text-xs">{rowLabel}</span>
      <span className="text-foreground min-w-0 flex-1 truncate text-right text-xs">
        {copied ? (
          <span className="text-primary font-medium">Copied!</span>
        ) : (
          value
        )}
      </span>
    </button>
  );
}

/**
 * TimestampInfo component displays a timestamp with a tooltip showing various time formats.
 * @param {string|number} props.utcTimestamp - UTC timestamp value. Can be either:
 *   - ISO 8601 string (e.g., "2024-01-01T00:00:00Z")
 *   - Unix microseconds (16-digit number)
 * @param {string} [props.format="DD MMM  HH:mm:ss"] - Display format for the timestamp (using dayjs format)
 * @returns {JSX.Element} Timestamp display with tooltip showing UTC, local, relative, and raw timestamp values
 */
export const TimestampInfo = ({
  utcTimestamp,
  className,
  displayAs = "local",
  format = "DD MMM YY HH:mm:ss",
  labelFormat = "DD MMM YY HH:mm:ss",
  label,
}: {
  className?: string;
  utcTimestamp: string | number;
  displayAs?: "local" | "utc";
  format?: string;
  labelFormat?: string;
  label?: string;
}) => {
  const local = timestampLocalFormatter({ utcTimestamp, format });
  const utc = timestampUtcFormatter({ utcTimestamp, format });
  const relative = timestampRelativeFormatter({ utcTimestamp });
  const [align, setAlign] = useState<"start" | "end">("start");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Position tooltip: top half of viewport → align start (tooltip top lines up); bottom half → align end (tooltip bottom lines up) so it stays on screen
  useEffect(() => {
    const updateAlignment = () => {
      const el = triggerRef.current;
      if (el) {
        const { top } = el.getBoundingClientRect();
        setAlign(top < window.innerHeight / 2 ? "start" : "end");
      }
    };
    updateAlignment();
    window.addEventListener("scroll", updateAlignment, { passive: true });
    window.addEventListener("resize", updateAlignment);
    return () => {
      window.removeEventListener("scroll", updateAlignment);
      window.removeEventListener("resize", updateAlignment);
    };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild ref={triggerRef}>
        <button
          type="button"
          className={cn(
            "group font-inherit inline cursor-default bg-transparent p-0 text-xs",
            "text-foreground-light hover:text-foreground dark:text-foreground-light dark:hover:text-foreground",
            "transition-[color,border-color] duration-150",
            className,
          )}
        >
          <span
            className={cn(
              "border-muted-foreground/60 group-hover:border-muted-foreground border-b border-dashed",
              "dark:border-muted-foreground/50 dark:group-hover:border-muted-foreground",
              "transition-[color,border-color] duration-150",
            )}
          >
            {label
              ? label
              : displayAs === "local"
                ? timestampLocalFormatter({ utcTimestamp, format: labelFormat })
                : timestampUtcFormatter({ utcTimestamp, format: labelFormat })}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        align={align}
        side="right"
        sideOffset={8}
        className={cn(
          "w-max max-w-[min(20rem,90vw)] min-w-52 overflow-hidden p-0 font-mono",
          "bg-popover text-popover-foreground border-border border shadow-md",
        )}
        arrowClassName="bg-popover fill-popover"
      >
        <div className="py-1">
          <TimestampTooltipRow rowLabel="UTC" value={utc} />
          <TimestampTooltipRow rowLabel={localTimezone} value={local} />
          <TimestampTooltipRow rowLabel="Relative" value={relative} />
          <TimestampTooltipRow
            rowLabel="Timestamp"
            value={String(utcTimestamp)}
          />
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
