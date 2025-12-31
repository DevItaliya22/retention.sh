"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";

import {
  SelectGroup as SelectGroupPrimitive,
  SelectItem,
  SelectTrigger as SelectTriggerPrimitive,
  SelectValue,
} from "../../select";
import { usePlaybackRate } from "../hooks/use-playback-rate";
import { useMediaStore } from "./media-provider";

interface SelectRootProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>,
  "onValueChange" | "value"
> {
  onValueChange?: (value: string) => void;
  value?: string;
}

export function SelectRoot(props: SelectRootProps) {
  const playbackRate = useMediaStore((state) => state.playbackRate);
  const { setPlaybackRate } = usePlaybackRate();

  return (
    <SelectPrimitive.Root
      onValueChange={(value) => setPlaybackRate(Number(value))}
      value={playbackRate.toString()}
      {...props}
    />
  );
}

SelectRoot.displayName = "PlaybackRateSelectRoot";

export const PlaybackRateSelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof SelectTriggerPrimitive>
>((props, forwardedRef) => {
  const playbackRate = useMediaStore((state) => state.playbackRate);

  return (
    <SelectTriggerPrimitive ref={forwardedRef} {...props}>
      <SelectValue placeholder={`${playbackRate}x`}>
        {playbackRate}x
      </SelectValue>
    </SelectTriggerPrimitive>
  );
});

PlaybackRateSelectTrigger.displayName = "PlaybackRateSelectTrigger";

interface PlaybackRateSelectGroupProps extends React.ComponentProps<
  typeof SelectGroupPrimitive
> {
  suffix?: string;
}

export const PlaybackRateSelectGroup = React.forwardRef<
  HTMLDivElement,
  PlaybackRateSelectGroupProps
>((props, forwardedRef) => {
  const playbackRates = useMediaStore((state) => state.playbackRates);
  const { suffix = "x" } = props;

  return (
    <SelectGroupPrimitive ref={forwardedRef} {...props}>
      {playbackRates.map((rate) => (
        <SelectItem key={rate} value={rate.toString()}>
          {rate}
          {suffix && <span className="text-xs">{suffix}</span>}
        </SelectItem>
      ))}
    </SelectGroupPrimitive>
  );
});

PlaybackRateSelectGroup.displayName = "PlaybackRateSelectGroup";
