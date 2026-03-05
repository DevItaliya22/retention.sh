import { withAdminAuth } from "@/lib/auth/middleware";
import { messageLogQuerySchema } from "@/lib/schemas/message-log";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import type { Prisma } from "@reelo/db";
import { type MessageChannel, type MessageSource, db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(messageLogQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          items: [],
          total: 0,
          page: 1,
          perPage: 10,
        },
        { status: 400 },
      );
    }

    const {
      page = 1,
      perPage = 10,
      sort,
      channel,
      source,
      dateFrom,
      dateTo,
    } = validation.data;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: Prisma.MessageLogWhereInput = {
      businessId: context.business.id,
    };

    if (channel) {
      where.channel = channel as MessageChannel;
    }

    if (source) {
      where.source = source as MessageSource;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    type OrderBy = {
      createdAt?: "asc" | "desc";
      channel?: "asc" | "desc";
      source?: "asc" | "desc";
    };
    const orderBy: OrderBy = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      const dir = direction === "desc" ? "desc" : "asc";
      if (field === "createdAt") orderBy.createdAt = dir;
      else if (field === "channel") orderBy.channel = dir;
      else if (field === "source") orderBy.source = dir;
      else orderBy.createdAt = "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [items, total] = await Promise.all([
      db.messageLog.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      db.messageLog.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      perPage,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) ?? "Failed to fetch message logs",
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
      },
      { status: 500 },
    );
  }
});
