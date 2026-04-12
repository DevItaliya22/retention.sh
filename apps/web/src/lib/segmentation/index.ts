export { getSegmentsOverview } from "./aggregate";
export type { SegmentSummary, SegmentsOverviewResponse } from "./aggregate";
export { classifyCustomer } from "./classify";
export { DEFAULT_SEGMENTS } from "./defaults";
export { evaluateSegment } from "./evaluate";
export {
  getSegmentCustomerIds,
  getSegmentCustomerIdsForSlugs,
} from "./get-segment-ids";
export { seedDefaultSegments } from "./seed";
export {
  DEFAULT_SYSTEM_SLUG_TO_PALETTE_INDEX,
  SEGMENT_TAG_PALETTE,
  getDefaultTagHexForSlug,
  getSegmentTagHex,
  segmentCardSurfaceStyle,
  segmentIconSurfaceStyle,
  tagColourForPersist,
} from "./segment-tag-colours";
export type { SegmentTagHex } from "./segment-tag-colours";
export type { CustomerData, SegmentConfig } from "./types";
