import { withAdminAuth } from "@/lib/auth/middleware";
import { getSignedObjectUrl } from "@/lib/storage/r2";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  src: z.string().max(4096),
});

function resolveKeyFromSrc(src: string) {
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return parts.slice(1).join("/");
  } catch {
    return null;
  }
}

function isBusinessBrandingKey(key: string, businessId: string) {
  return (
    key.startsWith(`business/${businessId}/branding/`) ||
    key.startsWith(`private/business/${businessId}/branding/`)
  );
}

export const GET = withAdminAuth(async (request, context) => {
  try {
    const url = new URL(request.url);
    const validation = validateSchema(querySchema, {
      src: url.searchParams.get("src"),
    });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const key = resolveKeyFromSrc(validation.data.src);
    if (!key || !isBusinessBrandingKey(key, context.business.id)) {
      return NextResponse.json(
        { error: "Invalid branding image path" },
        { status: 400 },
      );
    }

    const signedUrl = await getSignedObjectUrl(key, 300);
    return NextResponse.json({ url: signedUrl });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to generate signed URL. Please try again.",
      },
      { status: 500 },
    );
  }
});
