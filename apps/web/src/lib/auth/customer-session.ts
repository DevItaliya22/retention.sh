import { SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import { db } from "@reelo/db";

export type CustomerSessionData = {
  user: { id: string; name: string; email: string | null; role: string };
  session: { id: string; token: string; expiresAt: Date; role: string };
};

export async function getCustomerSessionFromHeaders(
  cookieHeader: string | null,
): Promise<CustomerSessionData | null> {
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

  const sessionRecord = await db.session.findUnique({
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

  if (role !== "CUSTOMER") {
    return null;
  }

  return {
    user: {
      id: sessionRecord.user.id,
      name: sessionRecord.user.name,
      email: sessionRecord.user.email,
      role,
    },
    session: {
      id: sessionRecord.id,
      token: sessionRecord.token,
      expiresAt: sessionRecord.expiresAt,
      role,
    },
  };
}
