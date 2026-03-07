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
export type { CustomerData, SegmentConfig } from "./types";
