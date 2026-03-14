import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface HowDidYouHearOptionStat {
  name: string;
  count: number;
  percent: number;
}

export interface FeedbackHowDidYouHearResponse {
  enabled: boolean;
  options: HowDidYouHearOptionStat[];
  error?: string;
}

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const businessId = context.business.id;

    const [config, responses] = await Promise.all([
      db.feedbackConfig.findUnique({
        where: { businessId },
        select: {
          isHowDidYouHearEnabled: true,
          howDidYouHearOptions: {
            select: { name: true },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      db.feedbackResponse.findMany({
        where: { businessId },
        select: { howDidYouHear: true },
      }),
    ]);

    if (
      !config?.isHowDidYouHearEnabled ||
      !config.howDidYouHearOptions?.length
    ) {
      return NextResponse.json({
        enabled: false,
        options: [],
      } satisfies FeedbackHowDidYouHearResponse);
    }

    const totalWithAnswer = responses.filter(
      (r) => r.howDidYouHear != null && r.howDidYouHear !== "",
    ).length;
    const counts = new Map<string, number>();
    for (const r of responses) {
      const v = r.howDidYouHear?.trim();
      if (v) {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }

    const options: HowDidYouHearOptionStat[] = config.howDidYouHearOptions.map(
      (opt) => {
        const count = counts.get(opt.name) ?? 0;
        const percent =
          totalWithAnswer > 0
            ? Math.round((count / totalWithAnswer) * 10000) / 100
            : 0;
        return { name: opt.name, count, percent };
      },
    );

    return NextResponse.json({
      enabled: true,
      options,
    } satisfies FeedbackHowDidYouHearResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch how-did-you-hear stats:", error);
    return NextResponse.json(
      {
        enabled: false,
        options: [],
        error:
          sanitizeErrorMessage(error) ??
          "Failed to fetch how-did-you-hear stats",
      } satisfies FeedbackHowDidYouHearResponse,
      { status: 500 },
    );
  }
});
