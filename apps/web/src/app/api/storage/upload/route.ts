import { withAdminAuth } from "@/lib/auth/middleware";
import { r2KeyBuilders, uploadObject } from "@/lib/storage/r2";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { NextResponse } from "next/server";
import { z } from "zod";

const uploadBodySchema = z.object({
  type: z.enum(["avatar", "business_logo", "business_banner", "bill_receipt"]),
  billId: z.string().uuid().optional(),
  filename: z.string().max(255),
  contentType: z.string().max(255).optional(),
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.startsWith("application/octet-stream")) {
      return NextResponse.json(
        {
          error: "Invalid content type. Expected application/octet-stream.",
        },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const bodyParams = {
      type: url.searchParams.get("type"),
      billId: url.searchParams.get("billId") || undefined,
      filename: url.searchParams.get("filename"),
      contentType: url.searchParams.get("contentType") || undefined,
    };

    const validation = validateSchema(uploadBodySchema, bodyParams);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const businessId = context.business.id;
    const userId = context.user.id;

    const buffer = Buffer.from(await request.arrayBuffer());

    let key: string;

    if (data.type === "avatar") {
      key = r2KeyBuilders.avatar(userId, data.filename);
    } else if (data.type === "business_logo") {
      key = r2KeyBuilders.businessBranding(businessId, "logo", data.filename);
    } else if (data.type === "business_banner") {
      key = r2KeyBuilders.businessBranding(businessId, "banner", data.filename);
    } else {
      if (!data.billId) {
        return NextResponse.json(
          { error: "billId is required for bill_receipt" },
          { status: 400 },
        );
      }
      key = r2KeyBuilders.billReceipt(businessId, data.billId, data.filename);
    }

    const result = await uploadObject({
      key,
      body: buffer,
      contentType: data.contentType,
    });

    return NextResponse.json({
      url: result.url,
      key: result.key,
      contentType: result.contentType,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to upload file. Please try again.",
      },
      { status: 500 },
    );
  }
});
