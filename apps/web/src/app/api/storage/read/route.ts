import { normalizeR2Key, readR2ObjectAsUint8Array } from "@/lib/storage/r2";
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
    if (!key) {
      return NextResponse.json(
        { error: "Invalid image path" },
        { status: 400 },
      );
    }

    const bytes = await readR2ObjectAsUint8Array(key);
    const lowerKey = key.toLowerCase();
    const contentType = lowerKey.endsWith(".png")
      ? "image/png"
      : lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")
        ? "image/jpeg"
        : lowerKey.endsWith(".webp")
          ? "image/webp"
          : lowerKey.endsWith(".gif")
            ? "image/gif"
            : lowerKey.endsWith(".svg")
              ? "image/svg+xml"
              : "application/octet-stream";

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to read file. Please try again.",
      },
      { status: 500 },
    );
  }
}
