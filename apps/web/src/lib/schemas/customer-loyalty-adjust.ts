import { z } from "zod";

const descriptionField = z.string().max(500).trim().optional();

/** POST body for /api/customers/[slugId]/loyalty-adjust */
export const customerLoyaltyAdjustBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cashback_delta"),
    delta: z.number().finite(),
    description: descriptionField,
  }),
  z.object({
    action: z.literal("points_delta"),
    delta: z.number().int(),
    description: descriptionField,
  }),
  z.object({
    action: z.literal("add_free_item"),
    skuName: z
      .string()
      .min(1, "Item name is required")
      .max(200, "Item name is too long"),
    skuId: z.string().uuid().optional().nullable(),
    description: descriptionField,
  }),
  z.object({
    action: z.literal("remove_free_item"),
    freeItemId: z.string().uuid("Invalid free item ID"),
  }),
  z.object({
    action: z.literal("convert_points"),
    rewardStageId: z.string().uuid("Invalid reward stage ID"),
    /** Base ₹ for PERCENTAGE_DISCOUNT rewards; omit for CASH_DISCOUNT / FREE_ITEM */
    referencePurchaseAmount: z.number().positive().finite().optional(),
  }),
]);

export type CustomerLoyaltyAdjustBody = z.infer<
  typeof customerLoyaltyAdjustBodySchema
>;
