"use client";

import type shaka from "shaka-player";
import type { StateCreator } from "zustand";

import clamp from "lodash.clamp";
import React, { useCallback } from "react";

import { noop, off, on, toFixedNumber } from "../lib/utils";
import { useGetStore, useMediaStore } from "../ui/media-provider";
import { useInterval } from "./use-interval";
import { MediaReadyState, type PlayerStore } from "./use-player";

export interface TimelineStore {
  buffered: shaka.extern.BufferedRange[];
  currentTime: number;
  duration: number;
  hoveringTime: number;
  isHovering: boolean;
  progress: number;
}

export const createTimelineStore: StateCreator<
  PlayerStore & TimelineStore,
  [],
  [],
  TimelineStore
> = () => ({
  buffered: [],
  currentTime: 0,
  duration: 0,
  hoveringTime: 0,
  isHovering: false,
  progress: 0,
});

export interface useTimelineStatesProps {
  /**
   * Interval in milliseconds to update the states
   * @default 500
   */
  updateDuration?: number;
}

export function useTimeline() {
  const store = useGetStore();
  const mediaRef = useMediaStore((state) => state.mediaRef);
  const duration = useMediaStore((state) => state.duration);

  const getTimeFromEvent = useCallback(
    (event: React.PointerEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const percentage = (event.clientX - rect.left) / rect.width;
      const clampedPercentage = Math.max(0, Math.min(1, percentage));
      return duration ? clampedPercentage * duration : 0;
    },
    [duration],
  );

  const seek = useCallback(
    (time: number) => {
      if (!mediaRef.current || !Number.isFinite(duration)) return;

      const media = mediaRef.current;
      const actualSeekTime = clamp(time, 0, duration);

      store.setState({
        currentTime: actualSeekTime,
        progress: actualSeekTime / duration,
      });

      media.currentTime = actualSeekTime;
    },
    [mediaRef, duration, store],
  );

  const setHoveringTime = useCallback(
    (time: number) => {
      if (!Number.isFinite(store.getState().duration)) return;

      store.setState({
        hoveringTime: time,
      });
    },
    [store],
  );

  function setIsHovering(isHovering: boolean) {
    store.setState({ isHovering });
  }

  const processBufferedRanges = useCallback(
    (
      bufferedRanges: shaka.extern.BufferedRange[],
      variant: "combined" | "default" | "from-zero" = "default",
    ): Array<{ startPercent: number; widthPercent: number }> => {
      if (!bufferedRanges.length || !duration) {
        return [];
      }

      let normalizedBuffered: shaka.extern.BufferedRange[] = [];

      if (variant === "combined") {
        const combinedBuffered = bufferedRanges.reduce(
          (acc, range) => {
            acc.start = Math.min(acc.start, range.start);
            acc.end = Math.max(acc.end, range.end);
            return acc;
          },
          { end: 0, start: Infinity },
        );

        if (combinedBuffered.start !== Infinity) {
          normalizedBuffered = [
            {
              end: combinedBuffered.end,
              start: combinedBuffered.start,
            },
          ];
        }
      } else if (variant === "from-zero") {
        normalizedBuffered = bufferedRanges.map((range) => ({
          end: range.end,
          start: 0,
        }));
      } else {
        normalizedBuffered = bufferedRanges;
      }

      if (!normalizedBuffered.length) {
        return [];
      }

      return normalizedBuffered.map((range) => {
        const startPercent = (range.start / duration) * 100;
        const widthPercent = ((range.end - range.start) / duration) * 100;

        return { startPercent, widthPercent };
      });
    },
    [duration],
  );

  return {
    getTimeFromEvent,
    processBufferedRanges,
    seek,
    setHoveringTime,
    setIsHovering,
  };
}

export function useTimelineStates({
  updateDuration = 500,
}: useTimelineStatesProps = {}) {
  const store = useGetStore();
  const player = useMediaStore((s) => s.player);
  const mediaRef = useMediaStore((state) => state.mediaRef);
  const canPlay = useMediaStore((state) => state.canPlay);
  const readyState = useMediaStore((state) => state.readyState);

  const onTimeUpdate = () => {
    if (!mediaRef.current || !player) return;

    if (readyState < MediaReadyState.HAVE_METADATA) return;

    const currentTime = clamp(
      mediaRef.current.currentTime,
      0,
      store.getState().duration,
    );
    const progress = toFixedNumber(currentTime / store.getState().duration, 4);

    store.setState({
      currentTime,
      progress,
    });
  };

  const onDurationChange = React.useCallback(() => {
    if (!mediaRef.current || !player) return;

    const playerDuration = mediaRef.current.duration;

    if (playerDuration && Number.isFinite(playerDuration)) {
      store.setState({ duration: playerDuration });
    }
  }, [store, mediaRef, player]);

  const onBuffer = React.useCallback(() => {
    if (!player) return;

    const bufferedInfo = player.getBufferedInfo();

    if (player.isBuffering()) {
      return;
    }

    store.setState({ buffered: bufferedInfo.total });
  }, [store, player]);

  useInterval(onTimeUpdate, updateDuration);

  React.useEffect(() => {
    if (!mediaRef.current || !player) return noop;

    const media = mediaRef.current;

    if (canPlay) {
      onTimeUpdate();
      onDurationChange();
      onBuffer();
    }

    on(media, ["durationchange", "loading"], onDurationChange);
    on(media, "progress", onBuffer);
    on(player, ["trackschanged", "loading"], onBuffer);

    return () => {
      off(media, ["durationchange", "loading"], onDurationChange);
      off(media, "progress", onBuffer);
      off(player, ["trackschanged", "loading"], onBuffer);
    };
  }, [mediaRef, player, canPlay]);
}
