import { create } from "zustand";

import type { PlaybackRateStore } from "../hooks/use-playback-rate";
import type { PlayerStore } from "../hooks/use-player";
import type { TimelineStore } from "../hooks/use-timeline";
import type { VolumeStore } from "../hooks/use-volume";

import { createPlaybackRateStore } from "../hooks/use-playback-rate";
import { createPlayerStore } from "../hooks/use-player";
import { createTimelineStore } from "../hooks/use-timeline";
import { createVolumeStore } from "../hooks/use-volume";

export interface CreateMediaStoreProps {
  debug?: boolean;
}

export type TypeMediaStore = PlaybackRateStore &
  PlayerStore &
  TimelineStore &
  VolumeStore;

export function createMediaStore(initProps?: Partial<CreateMediaStoreProps>) {
  const mediaStore = create<TypeMediaStore>()((...etc) => ({
    ...createPlayerStore(...etc),
    ...createVolumeStore(...etc),
    ...createTimelineStore(...etc),
    ...createPlaybackRateStore(...etc),
    ...initProps,
  }));
  return mediaStore;
}
