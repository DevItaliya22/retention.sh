import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import {
  getCashierSessionFromHeaders,
  type CashierSessionData,
} from "./cashier-session";
import { getCustomerSessionFromHeaders } from "./customer-session";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface AdminAuthContext {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
    role: string | null;
  };
  admin: {
    id: string;
    userId: string;
    businessId: string;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    referralEnabled: boolean;
  };
}

export interface CashierAuthContext {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
    role: string | null;
  };
  cashier: {
    id: string;
    userId: string;
    businessId: string;
    cashierLinkSlug: string;
  };
  business: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CustomerAuthContext {
  user: {
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    role: string;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
    role: string | null;
  };
  customer: {
    id: string;
    userId: string;
    email: string;
  };
}

export type WithAdminAuthHandler<
  T extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
> = (
  request: NextRequest,
  context: AdminAuthContext,
  params: T,
) => Promise<NextResponse>;

export type WithCashierAuthHandler<
  T extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
> = (
  request: NextRequest,
  context: CashierAuthContext,
  params: T,
) => Promise<NextResponse>;

export type WithCustomerAuthHandler<
  T extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
> = (
  request: NextRequest,
  context: CustomerAuthContext,
  params: T,
) => Promise<NextResponse>;

export function withAdminAuth<T extends Record<string, string | string[]>>(
  handler: WithAdminAuthHandler<T>,
): (
  request: NextRequest,
  { params }: { params: Promise<Record<string, string | string[]>> },
) => Promise<NextResponse> {
  return async (request: NextRequest, { params }) => {
    try {
      const resolvedParams = await params;

      const session = (await auth.api.getSession({
        headers: request.headers,
      })) as Session | null;

      if (!session || !session.user) {
        return NextResponse.json(
          { error: "UNAUTHORIZED", message: "Authentication required" },
          { status: 401 },
        );
      }

      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "FORBIDDEN", message: "Admin access required" },
          { status: 403 },
        );
      }

      const admin = await db.admin.findFirst({
        where: { userId: session.user.id },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              referralEnabled: true,
            },
          },
        },
      });

      if (!admin || !admin.business) {
        return NextResponse.json(
          { error: "NOT_FOUND", message: "Admin or business not found" },
          { status: 404 },
        );
      }

      const context: AdminAuthContext = {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role || "ADMIN",
        },
        session: {
          id: session.session?.id || "",
          token: session.session?.token || "",
          expiresAt: session.session?.expiresAt || new Date(),
          role: session.session?.role || session.user.role || "ADMIN",
        },
        admin: {
          id: admin.id,
          userId: admin.userId,
          businessId: admin.businessId,
        },
        business: {
          id: admin.business.id,
          name: admin.business.name,
          slug: admin.business.slug,
          referralEnabled: admin.business.referralEnabled ?? false,
        },
      };

      return await handler(request, context, resolvedParams as T);
    } catch (error) {
      console.error("Admin auth middleware error:", error);
      return NextResponse.json(
        { error: "INTERNAL_ERROR", message: "An error occurred" },
        { status: 500 },
      );
    }
  };
}

export function withCashierAuth<T extends Record<string, string | string[]>>(
  handler: WithCashierAuthHandler<T>,
): (
  request: NextRequest,
  { params }: { params: Promise<Record<string, string | string[]>> },
) => Promise<NextResponse> {
  return async (request: NextRequest, { params }) => {
    try {
      const resolvedParams = await params;
      const session: CashierSessionData | null =
        await getCashierSessionFromHeaders(request.headers.get("cookie"));

      if (!session || !session.user) {
        return NextResponse.json(
          { error: "UNAUTHORIZED", message: "Authentication required" },
          { status: 401 },
        );
      }

      const sessionRole = session.session?.role || session.user.role;

      if (sessionRole !== "CASHIER") {
        return NextResponse.json(
          { error: "FORBIDDEN", message: "Cashier session required" },
          { status: 403 },
        );
      }

      const cashier = await db.cashier.findFirst({
        where: { userId: session.user.id },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!cashier || !cashier.business) {
        return NextResponse.json(
          { error: "NOT_FOUND", message: "Cashier or business not found" },
          { status: 404 },
        );
      }

      if (!cashier.isActive) {
        return NextResponse.json(
          {
            error: "FORBIDDEN",
            message:
              "This cashier account is inactive. Contact your administrator.",
          },
          { status: 403 },
        );
      }

      const context: CashierAuthContext = {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role || "CASHIER",
        },
        session: {
          id: session.session?.id || "",
          token: session.session?.token || "",
          expiresAt: session.session?.expiresAt || new Date(),
          role: session.session?.role || sessionRole,
        },
        cashier: {
          id: cashier.id,
          userId: cashier.userId,
          businessId: cashier.businessId,
          cashierLinkSlug: cashier.cashierLinkSlug,
        },
        business: {
          id: cashier.business.id,
          name: cashier.business.name,
          slug: cashier.business.slug,
        },
      };

      return await handler(request, context, resolvedParams as T);
    } catch (error) {
      console.error("Cashier auth middleware error:", error);
      return NextResponse.json(
        { error: "INTERNAL_ERROR", message: "An error occurred" },
        { status: 500 },
      );
    }
  };
}

export function withCustomerAuth<T extends Record<string, string | string[]>>(
  handler: WithCustomerAuthHandler<T>,
): (
  request: NextRequest,
  { params }: { params: Promise<Record<string, string | string[]>> },
) => Promise<NextResponse> {
  return async (request: NextRequest, { params }) => {
    try {
      const resolvedParams = await params;

      const session = await getCustomerSessionFromHeaders(
        request.headers.get("cookie"),
      );

      if (!session || !session.user) {
        return NextResponse.json(
          { error: "UNAUTHORIZED", message: "Authentication required" },
          { status: 401 },
        );
      }

      if (session.user.role !== "CUSTOMER") {
        return NextResponse.json(
          { error: "FORBIDDEN", message: "Customer access required" },
          { status: 403 },
        );
      }

      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { phoneNumber: true },
      });

      const customer = await db.customer.findUnique({
        where: { userId: session.user.id },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "NOT_FOUND", message: "Customer not found" },
          { status: 404 },
        );
      }

      const context: CustomerAuthContext = {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          phoneNumber: user?.phoneNumber || null,
          role: session.user.role || "CUSTOMER",
        },
        session: {
          id: session.session.id || "",
          token: session.session.token || "",
          expiresAt: session.session.expiresAt || new Date(),
          role: session.session.role || session.user.role || "CUSTOMER",
        },
        customer: {
          id: customer.id,
          userId: customer.userId,
          email: customer.email,
        },
      };

      return await handler(request, context, resolvedParams as T);
    } catch (error) {
      console.error("Customer auth middleware error:", error);
      return NextResponse.json(
        { error: "INTERNAL_ERROR", message: "An error occurred" },
        { status: 500 },
      );
    }
  };
}
