"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import React, { useImperativeHandle, useRef } from "react";

import { cn } from "../../../lib/utils";
import { MediaReadyState } from "../hooks/use-player";
import { useTimeline } from "../hooks/use-timeline";
import { useTrackEvents } from "../hooks/use-track-events";
import { useMediaStore } from "./media-provider";

export type TimelineRootPropsDocs = Pick<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "disabled" | "orientation"
>;

export const TimelineRoot = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SliderPrimitive.Root>
>((props, ref) => {
  const internalRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const { className, orientation = "horizontal", ...etc } = props;

  const player = useMediaStore((s) => s.player);
  const currentTime = useMediaStore((s) => s.currentTime);
  const duration = useMediaStore((s) => s.duration);
  const currentValue = duration ? (currentTime / duration) * 100 : 0;
  const readyState = useMediaStore((s) => s.readyState);

  const disabled = props.disabled || readyState < MediaReadyState.HAVE_METADATA;

  useImperativeHandle(ref, () => internalRef.current);
  const { getTimeFromEvent, seek, setHoveringTime, setIsHovering } =
    useTimeline();

  const trackEvents = useTrackEvents({
    onPointerDown: (progress, event) => {
      if (duration) {
        const newTime = getTimeFromEvent(event);
        seek(newTime);
      }
    },
    onPointerMove: (progress, isPointerDown, event) => {
      if (duration) {
        const newTime = getTimeFromEvent(event);
        setHoveringTime(newTime);
        setIsHovering(true);

        if (isPointerDown) {
          seek(newTime);
        }
      }
    },
    onPointerUp: () => {
      setIsHovering(false);
    },
    onPointerOut: () => {
      setIsHovering(false);
    },
    orientation,
  });

  return (
    <SliderPrimitive.Root
      aria-label="Timeline Slider"
      className={cn(
        `ease-out-quad relative h-1 rounded-full transition-[height] duration-150 data-[orientation=horizontal]:h-1 active:data-[orientation=horizontal]:h-[7px]`,
        className,
      )}
      orientation={orientation}
      ref={internalRef}
      value={[currentValue]}
      min={0}
      max={100}
      step={0.01}
      {...trackEvents}
      {...etc}
      disabled={disabled}
    />
  );
});

TimelineRoot.displayName = "TimelineRoot";

export const TimelineTrack = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SliderPrimitive.Track>
>((props, ref) => {
  const { className, children, ...etc } = props;

  return (
    <SliderPrimitive.Track
      className={cn(
        `bg-foreground/30 focus-visible:outline-primary/50 relative flex h-full min-h-1 grow flex-row rounded-full focus-visible:outline-2 focus-visible:outline-offset-2`,
        className,
      )}
      ref={ref}
      tabIndex={0}
      {...etc}
    >
      {children}
    </SliderPrimitive.Track>
  );
});

TimelineTrack.displayName = "TimelineTrack";

export const TimelineProgress = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>((props, ref) => {
  const { className, ...etc } = props;
  const progress = useMediaStore((s) => s.progress);

  return (
    <div
      className={cn(
        "bg-primary absolute top-0 left-0 z-10 h-full min-w-[2px] rounded-s-full",
        className,
      )}
      ref={ref}
      style={
        {
          width: `${Math.max(0, Math.min(100, progress * 100))}%`,
        } as React.CSSProperties
      }
      {...etc}
    />
  );
});

TimelineProgress.displayName = "TimelineProgress";

export type TimelineBufferedPropsDocs = Pick<BufferedProps, "variant">;

export type TimelineThumbPropsDocs = Pick<
  ThumbProps,
  "position" | "showWithHover"
>;

interface BufferedProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * How to render buffered ranges
   * - "default": Show each buffered range separately
   * - "combined": Merge all ranges into one
   * - "from-zero": Show ranges from start to their end
   * @default "default"
   */
  variant?: "combined" | "default" | "from-zero";
}

interface ThumbProps extends React.ComponentProps<
  typeof SliderPrimitive.Thumb
> {
  /**
   * Custom position of the thumb in percentage
   */
  position?: number;
  /**
   * Thumb moves with the cursor seeking over the timeline
   */
  showWithHover?: boolean;
}

export const Buffered = React.forwardRef<HTMLDivElement, BufferedProps>(
  (props, ref) => {
    const { className, variant = "default", ...etc } = props;

    const buffered = useMediaStore((s) => s.buffered);
    const duration = useMediaStore((s) => s.duration);
    const { processBufferedRanges } = useTimeline();

    if (!duration || !buffered.length) {
      return null;
    }

    const normalizedPercentages = processBufferedRanges(buffered, variant);

    return (
      <div className={cn("absolute size-full", className)} ref={ref} {...etc}>
        {normalizedPercentages.map(({ startPercent, widthPercent }, index) => (
          <div
            key={`${index}_${startPercent}`}
            className={cn(
              `bg-foreground/30 absolute h-full`,
              variant === "from-zero" && "rounded-e-full",
              className,
            )}
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
            }}
          />
        ))}
      </div>
    );
  },
);

Buffered.displayName = "SliderBuffered";

export const TimelineThumb = React.forwardRef<HTMLDivElement, ThumbProps>(
  (props, ref) => {
    const { className, position, showWithHover = false, ...etc } = props;
    const hoveringTime = useMediaStore((s) => s.hoveringTime);
    const duration = useMediaStore((s) => s.duration);
    const currentTime = useMediaStore((s) => s.currentTime);
    const isHovering = useMediaStore((s) => s.isHovering);

    let finalPosition = 0;

    if (!duration) {
      return null;
    }

    if (position && Number.isFinite(position)) {
      finalPosition = position;
    } else if (showWithHover) {
      finalPosition = (hoveringTime / duration) * 100;
    } else {
      finalPosition = (currentTime / duration) * 100;
    }

    if (showWithHover) {
      return (
        <div
          className={cn(className)}
          data-hovering={isHovering}
          ref={ref}
          {...etc}
          style={{
            left: `${finalPosition}%`,
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      );
    }

    return (
      <SliderPrimitive.Thumb
        className={cn(
          `bg-primary data-disabled:bg-primary/85 size-4 rounded-full`,
          className,
        )}
        ref={ref}
        {...etc}
        style={{
          left: `${finalPosition}%`,
        }}
      />
    );
  },
);

TimelineThumb.displayName = "TimelineThumb";
