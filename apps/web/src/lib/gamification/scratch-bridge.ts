/**
 * Migration bridge: map legacy ScratchCard rows to unified GameCampaign when needed.
 * Prefer new `GameCampaign` with `type: SCRATCH_CARD` and `legacyScratchCardId` set during data migration.
 */
export function scratchCardToGameType(): "SCRATCH_CARD" {
  return "SCRATCH_CARD";
}
