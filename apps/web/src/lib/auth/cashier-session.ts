import { prisma } from "@reelo/db";
import { headers } from "next/headers";

export async function getCashierSession() {
  const headersList = await headers();
  
  const cookieHeader = headersList.get("cookie") || "";
  const sessionToken = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("reelo.session.token="))
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

  return {
    user: {
      id: sessionRecord.user.id,
      name: sessionRecord.user.name,
      email: sessionRecord.user.email,
      role: role,
    },
    session: {
      id: sessionRecord.id,
      token: sessionRecord.token,
      expiresAt: sessionRecord.expiresAt,
    },
  };
}

export async function getCashierSessionFromHeaders(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const sessionToken = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("reelo.session.token="))
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

  return {
    user: {
      id: sessionRecord.user.id,
      name: sessionRecord.user.name,
      email: sessionRecord.user.email,
      role: role,
    },
    session: {
      id: sessionRecord.id,
      token: sessionRecord.token,
      expiresAt: sessionRecord.expiresAt,
    },
  };
}
