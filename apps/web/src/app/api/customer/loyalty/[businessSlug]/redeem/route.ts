import { applyAdminConvertPointsToReward } from "@/lib/actions/loyalty";
import { withCustomerAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { businessSlugParamSchema } from "@/lib/schemas/common";
import { customerLoyaltyRedeemBodySchema } from "@/lib/schemas/customer-loyalty-redeem";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = withCustomerAuth<{ businessSlug: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const paramValidation = validateSchema(businessSlugParamSchema, params);
      if (!paramValidation.success) {
        return NextResponse.json(
          { success: false, error: paramValidation.error },
          { status: 400 },
        );
      }
      const { businessSlug } = paramValidation.data;

      const business = await db.business.findUnique({
        where: { slug: businessSlug },
        select: { id: true, isServiceEnabled: true },
      });
      if (!business) {
        return NextResponse.json(
          { success: false, error: "Business not found" },
          { status: 404 },
        );
      }
      if (
        !isServiceEnabled(
          business.isServiceEnabled as IsServiceEnabled | null | undefined,
          "loyalty",
        )
      ) {
        return NextResponse.json(
          { success: false, error: "Loyalty is not enabled for this business" },
          { status: 403 },
        );
      }

      const businessCustomer = await db.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId: business.id,
            customerId: context.customer.id,
          },
        },
        select: { customerId: true },
      });
      if (!businessCustomer) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 },
        );
      }

      let bodyJson: unknown;
      try {
        bodyJson = await request.json();
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid JSON body" },
          { status: 400 },
        );
      }

      const bodyValidation = validateSchema(
        customerLoyaltyRedeemBodySchema,
        bodyJson,
      );
      if (!bodyValidation.success) {
        return NextResponse.json(
          { success: false, error: bodyValidation.error },
          { status: 400 },
        );
      }

      const result = await runTransaction(async (tx) =>
        applyAdminConvertPointsToReward(tx, {
          businessId: business.id,
          customerId: businessCustomer.customerId,
          rewardStageId: bodyValidation.data.rewardStageId,
          initiator: "customer",
        }),
      );

      return NextResponse.json({ success: true, result });
    } catch (error: unknown) {
      const message = sanitizeErrorMessage(error);
      const status =
        typeof message === "string" &&
        (message.includes("Insufficient") ||
          message.includes("Invalid reward stage") ||
          message.includes("Only free-item rewards"))
          ? 400
          : 500;
      return NextResponse.json(
        { success: false, error: message || "Failed to redeem reward" },
        { status },
      );
    }
  },
);
