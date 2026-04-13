import { z } from "zod";

export const customerLoyaltyRedeemBodySchema = z.object({
  rewardStageId: z.string().uuid("Invalid reward stage ID"),
});

export type CustomerLoyaltyRedeemBody = z.infer<
  typeof customerLoyaltyRedeemBodySchema
>;
