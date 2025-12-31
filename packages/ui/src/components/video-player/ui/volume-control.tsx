"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import React, { useImperativeHandle, useRef, useState } from "react";

import { cn } from "../../../lib/utils";
import { MediaReadyState } from "../hooks/use-player";
import { useTrackEvents } from "../hooks/use-track-events";
import { useVolume } from "../hooks/use-volume";
import { useMediaStore } from "./media-provider";

const VOLUME_RESET_BASE = 0.05;

export type VolumeRootPropsDocs = Pick<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "disabled" | "orientation"
>;

export const VolumeRoot = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SliderPrimitive.Root>
>((props, ref) => {
  const internalRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const { className, orientation = "horizontal", ...etc } = props;
  const volume = useMediaStore((state) => state.volume);
  const hasAudio = useMediaStore((state) => state.hasAudio);
  const muted = useMediaStore((state) => state.muted);
  const readyState = useMediaStore((state) => state.readyState);
  const [currentValue, setCurrentValue] = useState(volume);

  const disabled = props.disabled || readyState < MediaReadyState.HAVE_METADATA;

  useImperativeHandle(ref, () => internalRef.current);
  const { setVolume } = useVolume();

  const getVolumeFromEvent = (event: React.PointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let percentage: number;

    if (orientation === "vertical") {
      percentage = 1 - (event.clientY - rect.top) / rect.height;
    } else {
      percentage = (event.clientX - rect.left) / rect.width;
    }

    return Math.max(0, Math.min(1, percentage));
  };

  const trackEvents = useTrackEvents({
    onPointerDown: (progress, event) => {
      if (disabled) return;
      const newVolume = getVolumeFromEvent(event);
      setCurrentValue(newVolume);
      setVolume(newVolume);
    },
    onPointerMove: (progress, isPointerDown, event) => {
      if (disabled) return;
      if (isPointerDown) {
        const newVolume = getVolumeFromEvent(event);
        setCurrentValue(newVolume);
        setVolume(newVolume);
      }
    },
    orientation,
  });

  if (!hasAudio) {
    return null;
  }

  const currentVolumeValue = muted
    ? 0
    : currentValue === 0
      ? VOLUME_RESET_BASE
      : volume;

  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex touch-none items-center justify-center select-none",
        className,
      )}
      max={1}
      min={0}
      orientation={orientation}
      ref={internalRef}
      step={0.01}
      value={[currentVolumeValue]}
      {...trackEvents}
      {...etc}
      disabled={disabled}
    />
  );
});

VolumeRoot.displayName = "VolumeRoot";

export const VolumeTrack = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SliderPrimitive.Track>
>((props, ref) => {
  const { className, ...etc } = props;

  return (
    <SliderPrimitive.Track
      className={cn(
        "bg-primary/30 relative size-full overflow-hidden rounded-md",
        className,
      )}
      ref={ref}
      {...etc}
    />
  );
});

VolumeTrack.displayName = "VolumeTrack";

export const VolumeProgress = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SliderPrimitive.Range>
>((props, ref) => {
  const { className, ...etc } = props;

  return (
    <SliderPrimitive.Range
      className={cn(
        `bg-primary data-disabled:bg-primary/20 h-full`,
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-full",
        className,
      )}
      ref={ref}
      {...etc}
    />
  );
});

VolumeProgress.displayName = "VolumeProgress";

export type VolumeThumbPropsDocs = Pick<ThumbProps, "showVolumeText">;

interface ThumbProps extends React.ComponentProps<
  typeof SliderPrimitive.Thumb
> {
  /**
   * Whether to show volume percentage as aria text
   * @default true
   */
  showVolumeText?: boolean;
}

export const VolumeThumb = React.forwardRef<HTMLDivElement, ThumbProps>(
  (props, ref) => {
    const { className, showVolumeText = true, ...etc } = props;
    const volume = useMediaStore((state) => state.volume);
    const displayValue = Number((volume * 100).toFixed(2));

    return (
      <SliderPrimitive.Thumb
        aria-label="Volume"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={displayValue}
        aria-valuetext={
          showVolumeText ? `${displayValue.toString()}% volume` : undefined
        }
        className={cn(
          `bg-primary focus-visible:outline-primary/50 data-disabled:bg-primary/85 block size-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2`,
          className,
        )}
        ref={ref}
        {...etc}
      />
    );
  },
);

VolumeThumb.displayName = "VolumeThumb";
