import {
  applyAdminAddFreeItem,
  applyAdminCashbackAdjustment,
  applyAdminConvertPointsToReward,
  applyAdminPointsAdjustment,
  applyAdminRemoveFreeItem,
} from "@/lib/actions/loyalty";
import { withAdminAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { customerSlugIdParamSchema } from "@/lib/schemas/customer";
import { customerLoyaltyAdjustBodySchema } from "@/lib/schemas/customer-loyalty-adjust";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAdminAuth<{ slugId: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const paramValidation = validateSchema(customerSlugIdParamSchema, params);
      if (!paramValidation.success) {
        return NextResponse.json(
          { error: paramValidation.error, success: false },
          { status: 400 },
        );
      }
      const { slugId } = paramValidation.data;

      if (!isServiceEnabled(context.business.isServiceEnabled, "loyalty")) {
        return NextResponse.json(
          {
            error: "Loyalty is not enabled for this business",
            success: false,
          },
          { status: 403 },
        );
      }

      let bodyJson: unknown;
      try {
        bodyJson = await request.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body", success: false },
          { status: 400 },
        );
      }

      const bodyValidation = validateSchema(
        customerLoyaltyAdjustBodySchema,
        bodyJson,
      );
      if (!bodyValidation.success) {
        return NextResponse.json(
          { error: bodyValidation.error, success: false },
          { status: 400 },
        );
      }
      const body = bodyValidation.data;

      const businessCustomer = await db.businessCustomer.findFirst({
        where: { slugId, businessId: context.business.id },
        select: { customerId: true },
      });
      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", success: false },
          { status: 404 },
        );
      }

      const loyalty = await db.loyalty.findUnique({
        where: { businessId: context.business.id },
        select: { id: true, loyaltyType: true },
      });
      if (!loyalty) {
        return NextResponse.json(
          { error: "No loyalty program configured", success: false },
          { status: 400 },
        );
      }

      const { customerId } = businessCustomer;
      const loyaltyId = loyalty.id;

      const result = await runTransaction(async (tx) => {
        switch (body.action) {
          case "cashback_delta": {
            const r = await applyAdminCashbackAdjustment(tx, {
              businessId: context.business.id,
              customerId,
              loyaltyId,
              delta: body.delta,
              description: body.description,
            });
            return { kind: "cashback_delta" as const, ...r };
          }
          case "points_delta": {
            if (
              loyalty.loyaltyType !== "AMOUNT_SPENT" &&
              loyalty.loyaltyType !== "VISIT_MADE"
            ) {
              throw new Error(
                "Points adjustments apply only to AMOUNT_SPENT or VISIT_MADE programs",
              );
            }
            const r = await applyAdminPointsAdjustment(tx, {
              businessId: context.business.id,
              customerId,
              loyaltyId,
              loyaltyPointsKind: loyalty.loyaltyType,
              delta: body.delta,
              description: body.description,
            });
            return { kind: "points_delta" as const, ...r };
          }
          case "add_free_item": {
            if (body.skuId) {
              const sku = await tx.sku.findFirst({
                where: {
                  id: body.skuId,
                  businessId: context.business.id,
                },
                select: { id: true },
              });
              if (!sku) {
                throw new Error("SKU not found for this business");
              }
            }
            return applyAdminAddFreeItem(tx, {
              businessId: context.business.id,
              customerId,
              loyaltyId,
              skuName: body.skuName,
              skuId: body.skuId ?? null,
              description: body.description,
            });
          }
          case "remove_free_item": {
            return applyAdminRemoveFreeItem(tx, {
              businessId: context.business.id,
              customerId,
              loyaltyId,
              freeItemId: body.freeItemId,
            });
          }
          case "convert_points": {
            return applyAdminConvertPointsToReward(tx, {
              businessId: context.business.id,
              customerId,
              rewardStageId: body.rewardStageId,
              referencePurchaseAmount: body.referencePurchaseAmount,
            });
          }
        }
      });

      return NextResponse.json({ success: true, result });
    } catch (error: unknown) {
      console.error("Customer loyalty adjust error:", error);
      const message = sanitizeErrorMessage(error);
      const status =
        typeof message === "string" &&
        (message.includes("not found") ||
          message.includes("Insufficient") ||
          message.includes("below zero"))
          ? 400
          : 500;
      return NextResponse.json(
        {
          success: false,
          error: message || "Failed to update loyalty",
        },
        { status },
      );
    }
  },
);
