import { SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import { prisma } from "@reelo/db";
import { headers } from "next/headers";

export type CashierSessionData = {
  user: { id: string; name: string; email: string | null; role: string };
  session: { id: string; token: string; expiresAt: Date; role: string };
};

export async function getCashierSession() {
  const headersList = await headers();

  const cookieHeader = headersList.get("cookie") || "";
  const sessionToken = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!sessionToken) {
    return null;
  }

  const sessionRecord = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!sessionRecord || sessionRecord.expiresAt <= new Date()) {
    return null;
  }

  const role = sessionRecord.role || sessionRecord.user.role;

  if (role !== "CASHIER") {
    return null;
  }

  // Cashiers store login email on Cashier, not User
  const cashier = await prisma.cashier.findUnique({
    where: { userId: sessionRecord.userId },
    select: { email: true },
  });
  const displayEmail = cashier?.email ?? sessionRecord.user.email;

  return {
    user: {
      id: sessionRecord.user.id,
      name: sessionRecord.user.name,
      email: displayEmail,
      role: role,
    },
    session: {
      id: sessionRecord.id,
      token: sessionRecord.token,
      expiresAt: sessionRecord.expiresAt,
      role: role,
    },
  };
}

export async function getCashierSessionFromHeaders(
  cookieHeader: string | null,
): Promise<CashierSessionData | null> {
  if (!cookieHeader) {
    return null;
  }

  const sessionToken = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!sessionToken) {
    return null;
  }

  const sessionRecord = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!sessionRecord || sessionRecord.expiresAt <= new Date()) {
    return null;
  }

  const role = sessionRecord.role || sessionRecord.user.role;

  if (role !== "CASHIER") {
    return null;
  }

  // Cashiers store login email on Cashier, not User
  const cashier = await prisma.cashier.findUnique({
    where: { userId: sessionRecord.userId },
    select: { email: true },
  });
  const displayEmail = cashier?.email ?? sessionRecord.user.email;

  return {
    user: {
      id: sessionRecord.user.id,
      name: sessionRecord.user.name,
      email: displayEmail,
      role: role,
    },
    session: {
      id: sessionRecord.id,
      token: sessionRecord.token,
      expiresAt: sessionRecord.expiresAt,
      role: role,
    },
  };
}
