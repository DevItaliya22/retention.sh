import {
  isAllowedTagColourHex,
  normalizeTagColourHex,
} from "@/lib/segmentation/segment-tag-colours";
import { z } from "zod";

const tagColourRefine = (v: string | null | undefined) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (normalizeTagColourHex(v) != null && isAllowedTagColourHex(v));

/** Create: omitted / empty → null (use slug default). */
const tagColourCreateSchema = z
  .union([z.undefined(), z.null(), z.string()])
  .refine(tagColourRefine, {
    message: "Tag colour must be a #RRGGBB value from the palette",
  })
  .transform((v) => {
    if (v === undefined || v === null || v === "") return null;
    return normalizeTagColourHex(v)!;
  });

/** Update: omitted → undefined (do not clear DB); null → clear override. */
const tagColourUpdateSchema = z
  .union([z.undefined(), z.null(), z.string()])
  .refine(tagColourRefine, {
    message: "Tag colour must be a #RRGGBB value from the palette",
  })
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === null || v === "") return null;
    return normalizeTagColourHex(v)!;
  });

const SEGMENT_OPERATORS = [
  "LESS_THAN",
  "GREATER_THAN",
  "LESS_THAN_OR_EQUAL",
  "GREATER_THAN_OR_EQUAL",
  "IN_RANGE",
  "NOT_IN_RANGE",
] as const;

const RECENCY_UNITS = ["DAYS", "MONTHS"] as const;

export const RECENCY_DAYS_MIN = 0;
export const RECENCY_DAYS_MAX = 3660;
export const RECENCY_MONTHS_MIN = 1;
export const RECENCY_MONTHS_MAX = 12;
export const FREQUENCY_MIN = 0;
export const FREQUENCY_MAX = 1000;
export const MONETARY_MIN = 0;
export const MONETARY_MAX = 100; // for RATIO (multiple of avg)
export const MONETARY_ABSOLUTE_MAX = 999_999_999; // for ABSOLUTE (₹)

/** Max segment rows per business (system + custom). */
export const SEGMENTS_MAX_PER_BUSINESS = 20;
/** Default / max `limit` for GET /api/segments */
export const SEGMENTS_LIST_DEFAULT_LIMIT = 20;
export const SEGMENT_NAME_MAX_LENGTH = 30;
export const SEGMENT_SLUG_MAX_LENGTH = 40;
export const SEGMENT_DESCRIPTION_MAX_LENGTH = 200;

export const segmentParamSchema = z.object({
  segment: z.string().min(1).max(100),
});

export const segmentCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100).optional(),
  name: z.string().max(255).trim().optional(),
  email: z.string().max(254).trim().optional(),
});

export type SegmentCustomersQueryInput = z.infer<
  typeof segmentCustomersQuerySchema
>;

const recencyConfigSchema = z
  .object({
    recencyOperator: z.enum(SEGMENT_OPERATORS).optional().nullable(),
    recencyValue: z.number().optional().nullable(),
    recencyValue2: z.number().optional().nullable(),
    recencyUnit: z.enum(RECENCY_UNITS).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.recencyOperator) return true;
      if (["IN_RANGE", "NOT_IN_RANGE"].includes(data.recencyOperator)) {
        return (
          data.recencyValue != null &&
          data.recencyValue2 != null &&
          data.recencyValue <= data.recencyValue2
        );
      }
      return data.recencyValue != null;
    },
    { message: "Recency value(s) required for operator" },
  )
  .refine(
    (data) => {
      if (!data.recencyOperator || data.recencyValue == null) return true;
      const unit = data.recencyUnit ?? "DAYS";
      if (unit === "MONTHS") {
        if (
          data.recencyValue < RECENCY_MONTHS_MIN ||
          data.recencyValue > RECENCY_MONTHS_MAX
        )
          return false;
        if (
          data.recencyValue2 != null &&
          (data.recencyValue2 < RECENCY_MONTHS_MIN ||
            data.recencyValue2 > RECENCY_MONTHS_MAX)
        )
          return false;
      } else {
        if (
          data.recencyValue < RECENCY_DAYS_MIN ||
          data.recencyValue > RECENCY_DAYS_MAX
        )
          return false;
        if (
          data.recencyValue2 != null &&
          (data.recencyValue2 < RECENCY_DAYS_MIN ||
            data.recencyValue2 > RECENCY_DAYS_MAX)
        )
          return false;
      }
      return true;
    },
    {
      message: `Recency: days ${RECENCY_DAYS_MIN}-${RECENCY_DAYS_MAX}, months ${RECENCY_MONTHS_MIN}-${RECENCY_MONTHS_MAX}`,
    },
  );

const frequencyConfigSchema = z
  .object({
    frequencyOperator: z.enum(SEGMENT_OPERATORS).optional().nullable(),
    frequencyValue: z
      .number()
      .int()
      .min(FREQUENCY_MIN, `Frequency must be ${FREQUENCY_MIN}-${FREQUENCY_MAX}`)
      .max(FREQUENCY_MAX, `Frequency must be ${FREQUENCY_MIN}-${FREQUENCY_MAX}`)
      .optional()
      .nullable(),
    frequencyValue2: z
      .number()
      .int()
      .min(FREQUENCY_MIN)
      .max(FREQUENCY_MAX)
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (!data.frequencyOperator) return true;
      if (["IN_RANGE", "NOT_IN_RANGE"].includes(data.frequencyOperator)) {
        return (
          data.frequencyValue != null &&
          data.frequencyValue2 != null &&
          data.frequencyValue <= data.frequencyValue2
        );
      }
      return data.frequencyValue != null;
    },
    { message: "Frequency value(s) required for operator" },
  );

const MONETARY_UNITS = ["RATIO", "ABSOLUTE"] as const;

const monetaryConfigSchema = z
  .object({
    monetaryUnit: z.enum(MONETARY_UNITS).optional().nullable(),
    monetaryOperator: z.enum(SEGMENT_OPERATORS).optional().nullable(),
    monetaryValue: z.number().optional().nullable(),
    monetaryValue2: z.number().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.monetaryOperator || data.monetaryValue == null) return true;
      const unit = data.monetaryUnit ?? "RATIO";
      if (unit === "ABSOLUTE") {
        if (
          data.monetaryValue < MONETARY_MIN ||
          data.monetaryValue > MONETARY_ABSOLUTE_MAX
        )
          return false;
        if (
          data.monetaryValue2 != null &&
          (data.monetaryValue2 < MONETARY_MIN ||
            data.monetaryValue2 > MONETARY_ABSOLUTE_MAX)
        )
          return false;
      } else {
        if (
          data.monetaryValue < MONETARY_MIN ||
          data.monetaryValue > MONETARY_MAX
        )
          return false;
        if (
          data.monetaryValue2 != null &&
          (data.monetaryValue2 < MONETARY_MIN ||
            data.monetaryValue2 > MONETARY_MAX)
        )
          return false;
      }
      return true;
    },
    {
      message: `Monetary: RATIO ${MONETARY_MIN}-${MONETARY_MAX}x, ABSOLUTE ₹${MONETARY_MIN}-${MONETARY_ABSOLUTE_MAX}`,
    },
  )
  .refine(
    (data) => {
      if (!data.monetaryOperator) return true;
      if (["IN_RANGE", "NOT_IN_RANGE"].includes(data.monetaryOperator)) {
        return (
          data.monetaryValue != null &&
          data.monetaryValue2 != null &&
          data.monetaryValue <= data.monetaryValue2
        );
      }
      return data.monetaryValue != null;
    },
    { message: "Monetary value(s) required for operator" },
  );

export const createSegmentSchema = z
  .object({
    name: z.string().min(1).max(SEGMENT_NAME_MAX_LENGTH).trim(),
    slug: z
      .string()
      .min(1)
      .max(SEGMENT_SLUG_MAX_LENGTH)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
      .trim(),
    description: z
      .string()
      .max(SEGMENT_DESCRIPTION_MAX_LENGTH)
      .trim()
      .optional()
      .nullable(),
    proTip: z.string().max(1000).trim().optional().nullable(),
    sortOrder: z.number().int().min(0).optional(),
    tagColour: tagColourCreateSchema,
  })
  .merge(recencyConfigSchema)
  .merge(frequencyConfigSchema)
  .merge(monetaryConfigSchema);

export const updateSegmentSchema = createSegmentSchema
  .omit({ tagColour: true })
  .partial()
  .merge(
    z.object({
      tagColour: tagColourUpdateSchema.optional(),
    }),
  );

export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;
