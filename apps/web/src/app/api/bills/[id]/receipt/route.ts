import { withAdminAuth } from "@/lib/auth/middleware";
import { r2KeyBuilders, uploadObject } from "@/lib/storage/r2";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const receiptParamSchema = z.object({
  id: z.string().uuid("Invalid bill ID"),
});

const receiptQuerySchema = z.object({
  filename: z.string().max(255),
  contentType: z.string().max(255).optional(),
});

export const POST = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const paramValidation = validateSchema(receiptParamSchema, params);
      if (!paramValidation.success) {
        return NextResponse.json(
          { error: paramValidation.error, bill: null },
          { status: 400 },
        );
      }

      const url = new URL(request.url);
      const queryValidation = validateSchema(receiptQuerySchema, {
        filename: url.searchParams.get("filename"),
        contentType: url.searchParams.get("contentType") || undefined,
      });
      if (!queryValidation.success) {
        return NextResponse.json(
          { error: queryValidation.error, bill: null },
          { status: 400 },
        );
      }

      const bill = await db.bill.findFirst({
        where: {
          id: paramValidation.data.id,
          businessId: context.business.id,
        },
      });

      if (!bill) {
        return NextResponse.json(
          { error: "Bill not found", bill: null },
          { status: 404 },
        );
      }

      const buffer = Buffer.from(await request.arrayBuffer());

      const key = r2KeyBuilders.billReceipt(
        context.business.id,
        bill.id,
        queryValidation.data.filename,
      );

      const uploaded = await uploadObject({
        key,
        body: buffer,
        contentType: queryValidation.data.contentType,
      });

      const updatedBill = await db.bill.update({
        where: { id: bill.id },
        data: {
          receiptUrl: uploaded.url,
          receiptKey: uploaded.key,
        },
      });

      return NextResponse.json({ bill: updatedBill });
    } catch (error: unknown) {
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to upload receipt. Please try again.",
          bill: null,
        },
        { status: 500 },
      );
    }
  },
);
