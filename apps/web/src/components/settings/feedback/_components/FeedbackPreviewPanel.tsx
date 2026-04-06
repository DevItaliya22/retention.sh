"use client";

import { FeedbackPageClient } from "@/app/(customer)/feedback/[businessSlug]/[token]/_components/FeedbackPageClient";
import type { FeedbackConfigDto } from "@/hooks/feedback/useFeedbackConfig";
import { useR2Upload } from "@/hooks/storage/useR2Upload";
import {
  DEFAULT_BRANDING_TEXT_COLOR,
  DEFAULT_BRANDING_THEME_COLOR,
} from "@/lib/constants/branding";
import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms/feedback";
import { Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FeedbackPreviewBrandingValues {
  logo: string | null;
  bannerImage: string | null;
  themeColor: string | null;
  textColor: string | null;
  header: string | null;
  subtitle: string | null;
}

export function FeedbackPreviewPanel({
  config,
  brandingValues,
  previewBusinessName,
  previewView = "form",
}: {
  config: FeedbackConfigDto;
  brandingValues: FeedbackPreviewBrandingValues;
  previewBusinessName: string;
  previewView?: "form" | "positive" | "negative";
}) {
  const { getReadSignedUrl } = useR2Upload();
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});

  const resolveKey = useCallback(
    (key: string | null) => {
      if (!key) return null;
      if (key.startsWith("blob:") || key.startsWith("http")) return key;
      return resolvedUrls[key] ?? null;
    },
    [resolvedUrls],
  );

  useEffect(() => {
    const keys = [brandingValues.logo, brandingValues.bannerImage].filter(
      (k): k is string =>
        !!k && !k.startsWith("blob:") && !k.startsWith("http"),
    );
    if (keys.length === 0) return;

    let cancelled = false;
    void Promise.all(
      keys.map(async (k) => {
        if (resolvedUrls[k]) return;
        try {
          const url = await getReadSignedUrl(k);
          if (!cancelled) {
            setResolvedUrls((prev) => ({ ...prev, [k]: url }));
          }
        } catch (_error) {
          // Ignore preview asset resolution failures and keep fallback state.
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [
    brandingValues.logo,
    brandingValues.bannerImage,
    getReadSignedUrl,
    resolvedUrls,
  ]);

  const previewConfig = useMemo(
    () => ({
      id: config.id,
      positiveFollowUp: config.positiveFollowUp,
      negativeFollowUp: config.negativeFollowUp,
      questions: config.questions.map((q) => ({
        id: q.id,
        question: q.question,
        iconType: q.iconType,
      })),
      categories: config.categories.map((c) => ({ id: c.id, name: c.name })),
      isHowDidYouHearEnabled: config.isHowDidYouHearEnabled,
      howDidYouHearOptions: FEEDBACK_FORM_DEFAULTS.howDidYouHearOptions.map(
        (name, index) => ({
          id: `preview-how-${index}`,
          name,
        }),
      ),
      selectionOptions: config.selectionOptions.map((opt) => ({
        id: opt.id,
        label: opt.label,
      })),
      askForOnlineReviews: config.askForOnlineReviews,
      onlineReviewLink: config.onlineReviewLink,
      onlineReviewPlatform: config.onlineReviewPlatform,
      branding: {
        logo: resolveKey(brandingValues.logo),
        bannerImage: resolveKey(brandingValues.bannerImage),
        themeColor: brandingValues.themeColor ?? DEFAULT_BRANDING_THEME_COLOR,
        textColor: brandingValues.textColor ?? DEFAULT_BRANDING_TEXT_COLOR,
        header: brandingValues.header,
        subtitle: brandingValues.subtitle,
      },
      reward: {
        enabled: Boolean(config.feedbackRewardEnabled),
        amount: config.rewardAmount,
      },
    }),
    [brandingValues, config, resolveKey],
  );

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="text-muted-foreground size-4" />
          <p className="text-sm font-medium">Preview</p>
        </div>
      </div>
      <FeedbackPageClient
        businessSlug="preview-business"
        token="preview-token"
        previewMode
        previewView={previewView === "form" ? "form" : "thank-you"}
        previewBusinessName={previewBusinessName}
        previewConfig={{
          ...previewConfig,
          positiveFollowUp:
            previewView === "negative"
              ? previewConfig.negativeFollowUp
              : previewConfig.positiveFollowUp,
        }}
      />
    </div>
  );
}
