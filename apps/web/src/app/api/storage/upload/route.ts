import { withAdminAuth } from "@/lib/auth/middleware";
import { getUploadSignedUrl, r2KeyBuilders } from "@/lib/storage/r2";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { NextResponse } from "next/server";
import { z } from "zod";

const uploadBodySchema = z.object({
  type: z.enum([
    "business_logo",
    "business_banner",
    "campaign_logo",
    "campaign_banner",
  ]),
  campaignId: z.string().uuid().optional(),
  filename: z.string().max(255),
  contentType: z.string().max(255),
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const url = new URL(request.url);
    const bodyParams = {
      type: url.searchParams.get("type"),
      campaignId: url.searchParams.get("campaignId") || undefined,
      filename: url.searchParams.get("filename"),
      contentType: url.searchParams.get("contentType"),
    };

    const validation = validateSchema(uploadBodySchema, bodyParams);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const businessId = context.business.id;

    let key: string;

    if (data.type === "business_logo") {
      key = r2KeyBuilders.businessBranding(businessId, "logo", data.filename);
    } else if (data.type === "business_banner") {
      key = r2KeyBuilders.businessBranding(businessId, "banner", data.filename);
    } else if (
      data.type === "campaign_logo" ||
      data.type === "campaign_banner"
    ) {
      if (!data.campaignId) {
        return NextResponse.json(
          { error: "campaignId is required for campaign assets" },
          { status: 400 },
        );
      }
      key = r2KeyBuilders.campaignAsset(
        businessId,
        data.campaignId,
        data.type === "campaign_logo" ? "logo" : "banner",
        data.filename,
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported upload type" },
        { status: 400 },
      );
    }

    const uploadUrl = await getUploadSignedUrl({
      key,
      contentType: data.contentType,
    });

    return NextResponse.json({
      key,
      uploadUrl,
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
