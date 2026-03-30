import { getReadSignedUrl, normalizeR2Key } from "@/lib/storage/r2";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  src: z.string().max(4096),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const validation = validateSchema(querySchema, {
      src: url.searchParams.get("src"),
    });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const key = normalizeR2Key(validation.data.src);
    if (!key)
      return NextResponse.json(
        { error: "Invalid image path" },
        { status: 400 },
      );

    const signedUrl = await getReadSignedUrl(key, 300);
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
}
