import { slugSchema } from "@/lib/schemas/common";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("slug") ?? "";

  const parsed = slugSchema.safeParse(raw.trim().toLowerCase());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid slug";
    return NextResponse.json(
      { available: false, error: message },
      { status: 400 },
    );
  }

  const slug = parsed.data;

  const existingBusiness = await db.business.findUnique({
    where: { slug },
    select: { id: true },
  });

  return NextResponse.json({ available: !existingBusiness });
}
