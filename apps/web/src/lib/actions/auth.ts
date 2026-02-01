"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@reelo/db";
import { headers } from "next/headers";

export async function checkAdminHasBusiness() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { hasBusiness: false };
  }

  const admin = await db.admin.findUnique({
    where: { userId: session.user.id },
  });

  return { hasBusiness: !!admin };
}
