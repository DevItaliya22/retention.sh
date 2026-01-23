import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") ?? "").trim().toLowerCase();

  if (!slug) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  const existingBusiness = await prisma.business.findUnique({
    where: { slug },
    select: { id: true },
  });

  return NextResponse.json({ available: !existingBusiness });
}
