"use client";

import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms";
import {
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Label,
  Skeleton,
  Textarea,
} from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MessageSquare, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface FeedbackPageClientProps {
  businessSlug: string;
  token: string;
  previewMode?: boolean;
  previewView?: "form" | "thank-you";
  previewBusinessName?: string;
  onPreviewSubmit?: () => void;
  previewConfig?: PublicFeedbackConfig & {
    reward?: { enabled: boolean; amount: number | null };
  };
}

export interface PublicFeedbackConfig {
  id: string;
  positiveFollowUp: string | null;
  negativeFollowUp: string | null;
  questions: { id: string; question: string; iconType: string | null }[];
  categories: { id: string; name: string }[];
  isHowDidYouHearEnabled: boolean;
  howDidYouHearOptions: { id: string; name: string }[];
  selectionOptions: { id: string; label: string }[];
  askForOnlineReviews: boolean;
  onlineReviewLink: string | null;
  onlineReviewPlatform: string | null;
  branding: {
    logo: string | null;
    themeColor: string | null;
    textColor: string | null;
    bannerImage: string | null;
    header: string | null;
    subtitle: string | null;
  } | null;
}

interface OnlineReview {
  link: string;
  platform: string | null;
}

interface PublicFeedbackResponse {
  alreadySubmitted?: boolean;
  config: PublicFeedbackConfig | null;
  /** When alreadySubmitted and config is null, API returns branding at top level */
  branding?: PublicFeedbackConfig["branding"];
  billNumber: string | null;
  billAmount?: number | null;
  billCreatedAt?: string | null;
  currencySymbol?: string;
  followUpMessage?: string;
  reward?: { enabled: boolean; amount: number | null };
  onlineReview?: OnlineReview | null;
  error?: string;
}

interface SubmitResponse {
  success: boolean;
  followUpMessage?: string;
  reward?: { enabled: boolean; amount: number | null };
  onlineReview?: OnlineReview | null;
  error?: string;
}

/** Platform-specific CTA label: Follow for Instagram, Review for Google, Rate for Zomato, etc. */
const platformCtaLabel: Record<string, string> = {
  GOOGLE: "Review us on Google",
  INSTAGRAM: "Follow us on Instagram",
  FACEBOOK: "Review us on Facebook",
  ZOMATO: "Rate us on Zomato",
  OTHER: "Leave a review",
};

function formatBillDate(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

function formatBillTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "";
  }
}

const pageWrapperClass =
  "flex min-h-screen min-h-[100dvh] w-full items-center justify-center bg-white px-4 pb-4 pt-2 font-sans sm:px-6 sm:pb-6 sm:pt-4";
const previewPageWrapperClass =
  "flex min-h-full w-full items-start justify-center bg-white pt-2 sm:pt-3";

const cardClass =
  "w-full max-w-[420px] rounded-[32px] border border-white/10 overflow-hidden flex flex-col bg-white shadow-xl !p-0";
const DEFAULT_THEME_COLOR = "#0f766e";
const DEFAULT_TEXT_COLOR = "#f8fafc";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const value = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(value)) return null;
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value.slice(0, 6);
  const num = Number.parseInt(normalized, 16);
  if (!Number.isFinite(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance >= 0.62;
}

function getContrastTextColor(bgColor: string): string {
  return isLightColor(bgColor) ? "#0f172a" : "#f8fafc";
}

function OnlineReviewCTA({
  review,
  themeColor,
}: {
  review: { link: string; platform: string | null };
  themeColor?: string;
  textColor?: string;
}) {
  const label =
    review.platform && platformCtaLabel[review.platform]
      ? platformCtaLabel[review.platform]
      : FEEDBACK_FORM_DEFAULTS.labels.leaveReview;
  return (
    <a
      href={review.link}
      target="_blank"
      rel="noopener noreferrer"
      className={
        themeColor
          ? "mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition-colors hover:opacity-90 active:scale-[0.98]"
          : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition-colors active:scale-[0.98]"
      }
      style={
        themeColor
          ? {
              borderColor: `${themeColor}B3`,
              backgroundColor: themeColor,
              color: getContrastTextColor(themeColor),
            }
          : undefined
      }
    >
      {label}
      <ExternalLink className="size-4 shrink-0" />
    </a>
  );
}

export function FeedbackPageClient({
  businessSlug,
  token,
  previewMode = false,
  previewView = "form",
  previewBusinessName,
  onPreviewSubmit,
  previewConfig,
}: FeedbackPageClientProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [howDidYouHear, setHowDidYouHear] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSelectionOptionIds, setSelectedSelectionOptionIds] = useState<
    string[]
  >([]);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [reward, setReward] = useState<{
    enabled: boolean;
    amount: number | null;
  } | null>(null);
  const [onlineReview, setOnlineReview] = useState<{
    link: string;
    platform: string | null;
  } | null>(null);
  /** Branding from config, kept in state so thank-you view uses same theme as form */
  const [formBranding, setFormBranding] = useState<{
    themeColor: string;
    textColor: string;
    logo: string | null;
    bannerImage: string | null;
  } | null>(null);

  const { data, isLoading, isError, error } = useQuery<
    PublicFeedbackResponse,
    Error
  >({
    queryKey: ["feedbackPublic", businessSlug, token],
    queryFn: () =>
      fetch(
        `/api/feedback/${encodeURIComponent(businessSlug)}/${encodeURIComponent(token)}`,
      ).then((res) => {
        if (!res.ok) throw new Error("Failed to load feedback");
        return res.json();
      }),
    enabled: !!businessSlug && !!token && !previewMode,
  });

  const previewData: PublicFeedbackResponse | null = previewMode
    ? {
        config: previewConfig ?? null,
        billNumber: "PREVIEW-001",
        billAmount: 1234,
        billCreatedAt: new Date().toISOString(),
        currencySymbol: "₹",
        followUpMessage: previewConfig?.positiveFollowUp ?? undefined,
        reward: previewConfig?.reward ?? undefined,
        onlineReview:
          previewConfig?.askForOnlineReviews && previewConfig?.onlineReviewLink
            ? {
                link: previewConfig.onlineReviewLink,
                platform: previewConfig.onlineReviewPlatform ?? null,
              }
            : null,
      }
    : null;
  const effectiveData = previewData ?? data ?? null;
  const config = effectiveData?.config ?? null;
  const billAmount = effectiveData?.billAmount ?? null;
  const billCreatedAt = effectiveData?.billCreatedAt ?? null;
  const currencySymbol = effectiveData?.currencySymbol ?? "₹";
  const alreadySubmitted =
    previewMode && previewView === "thank-you"
      ? true
      : (effectiveData?.alreadySubmitted ?? false);
  const loadedFollowUp = effectiveData?.followUpMessage ?? null;
  const loadedReward = effectiveData?.reward ?? null;
  const loadedOnlineReview = effectiveData?.onlineReview ?? null;
  const loading = previewMode ? false : isLoading || (!data && !isError);
  const displayBusiness = previewBusinessName || businessSlug;
  const wrapperClass = previewMode ? previewPageWrapperClass : pageWrapperClass;

  // Keep form branding in state so thank-you view uses same theme (not default purple)
  useEffect(() => {
    if (submitStatus === "success") return;
    const b = config?.branding;
    if (!b) return;
    const resolvedTheme = b.themeColor ?? DEFAULT_THEME_COLOR;
    setFormBranding({
      themeColor: resolvedTheme,
      textColor: b.textColor ?? getContrastTextColor(resolvedTheme),
      logo: b.logo ?? null,
      bannerImage: b.bannerImage ?? null,
    });
  }, [config?.branding, submitStatus]);

  const submitFeedback = useCallback(async () => {
    setSubmitStatus("submitting");
    try {
      const res = await fetch(
        `/api/feedback/${encodeURIComponent(businessSlug)}/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            comment: comment.trim() || null,
            howDidYouHear: howDidYouHear.trim() || null,
            selectedCategories,
            selectedSelectionOptionIds,
          }),
        },
      );
      const json: SubmitResponse = await res.json();
      if (!res.ok) {
        setSubmitStatus("error");
        setFollowUpMessage(json.error ?? "Something went wrong.");
        return;
      }
      if (json.success) {
        setSubmitStatus("success");
        setFollowUpMessage(
          json.followUpMessage ?? FEEDBACK_FORM_DEFAULTS.followUpMessage,
        );
        setReward(json.reward ?? null);
        setOnlineReview(json.onlineReview ?? null);
      } else {
        setSubmitStatus("error");
        setFollowUpMessage(json.error ?? "Something went wrong.");
      }
    } catch {
      setSubmitStatus("error");
      setFollowUpMessage("Something went wrong. Please try again.");
    }
  }, [
    businessSlug,
    token,
    rating,
    comment,
    howDidYouHear,
    selectedCategories,
    selectedSelectionOptionIds,
  ]);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const toggleSelectionOption = (id: string) => {
    setSelectedSelectionOptionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (isError || (!loading && !effectiveData)) {
    return (
      <div className={wrapperClass}>
        <Card className={cardClass}>
          <CardHeader className="px-4 pt-6 pb-6 text-center sm:px-6">
            <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <MessageSquare className="size-6" />
            </div>
            <h1 className="text-lg font-semibold sm:text-xl">
              Feedback link invalid
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {error?.message ?? "This link may have expired or is incorrect."}
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Themed thank-you view (already submitted or just submitted)
  const renderThemedThankYou = (
    message: string,
    showReward: boolean,
    rewardAmount: number | null,
    onlineReview: { link: string; platform: string | null } | null,
    themeColor: string,
    textColor: string,
    logo: string | null,
    bannerImage: string | null,
  ) => (
    <div className={pageWrapperClass}>
      <Card className={cardClass}>
        {/* Compact header: logo + check + title in one flow */}
        <div
          className="relative rounded-t-[32px] px-6 pt-8 pb-6 text-center sm:pt-9 sm:pb-7"
          style={{ backgroundColor: themeColor }}
        >
          {bannerImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 rounded-t-[32px]"
                style={{ backgroundColor: themeColor, opacity: 0.88 }}
              />
            </>
          )}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full border border-white/25 bg-white shadow-sm sm:h-14 sm:w-14">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                {logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logo}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span
                    className="text-base font-semibold sm:text-lg"
                    style={{ color: themeColor }}
                  >
                    {(displayBusiness || "B").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <h1
              className="text-[20px] font-bold tracking-tight sm:text-[22px]"
              style={{ color: textColor }}
            >
              {FEEDBACK_FORM_DEFAULTS.thankYouTitle}
            </h1>
          </div>
        </div>
        {/* Content: one card for reward + message, then CTA */}
        <div className="rounded-b-[32px] bg-white px-4 py-5 sm:px-6 sm:py-6">
          <div
            className="rounded-2xl border p-4 shadow-sm sm:p-5"
            style={{
              borderColor: `${themeColor}25`,
              backgroundColor: `${themeColor}06`,
            }}
          >
            {showReward && rewardAmount != null && (
              <p className="text-center text-sm font-semibold text-gray-900">
                {FEEDBACK_FORM_DEFAULTS.rewardAddedToWallet(rewardAmount)}
              </p>
            )}
            <p
              className={`text-center text-sm leading-relaxed text-gray-600 ${
                showReward && rewardAmount != null ? "mt-2" : ""
              }`}
            >
              {message}
            </p>
          </div>
          {onlineReview && (
            <div className="mt-4 flex justify-center">
              <OnlineReviewCTA review={onlineReview} themeColor={themeColor} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const brandingFromConfig = config?.branding ?? data?.branding ?? null;
  const themeColorFallback =
    brandingFromConfig?.themeColor || DEFAULT_THEME_COLOR;
  const textColorFallback =
    brandingFromConfig?.textColor || getContrastTextColor(themeColorFallback);
  const logoFallback = brandingFromConfig?.logo || null;
  const bannerFallback = brandingFromConfig?.bannerImage || null;

  if (alreadySubmitted) {
    const message = loadedFollowUp ?? FEEDBACK_FORM_DEFAULTS.followUpMessage;
    const showReward = Boolean(
      loadedReward?.enabled && loadedReward?.amount != null,
    );
    return renderThemedThankYou(
      message,
      showReward,
      loadedReward?.amount ?? null,
      loadedOnlineReview ?? null,
      themeColorFallback,
      textColorFallback,
      logoFallback,
      bannerFallback,
    );
  }

  if (submitStatus === "success") {
    const showReward = Boolean(reward?.enabled && reward?.amount != null);
    // Use review link from POST response, or fallback to form config so CTA always shows when enabled
    const effectiveOnlineReview =
      onlineReview ??
      (config?.askForOnlineReviews && config?.onlineReviewLink
        ? {
            link: config.onlineReviewLink,
            platform: config.onlineReviewPlatform ?? null,
          }
        : null);
    // Use same source as form: config.branding (from API), then formBranding (synced in effect), then fallback
    const theme =
      brandingFromConfig?.themeColor ??
      formBranding?.themeColor ??
      themeColorFallback;
    const text =
      brandingFromConfig?.textColor ??
      formBranding?.textColor ??
      textColorFallback;
    const logo = brandingFromConfig?.logo ?? formBranding?.logo ?? logoFallback;
    const banner =
      brandingFromConfig?.bannerImage ??
      formBranding?.bannerImage ??
      bannerFallback;
    return renderThemedThankYou(
      followUpMessage,
      showReward,
      reward?.amount ?? null,
      effectiveOnlineReview,
      theme,
      text,
      logo,
      banner,
    );
  }

  if (!loading && !config) {
    return (
      <div className={wrapperClass}>
        <Card className={`${cardClass} border-gray-300/70 bg-white shadow-md`}>
          <div className="relative rounded-t-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-6 pt-8 pb-7 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="relative z-10">
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm">
                <MessageSquare className="size-7 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Feedback
              </h1>
              <p className="mt-1.5 text-sm text-white/85">
                We are preparing this feedback page for you
              </p>
            </div>
          </div>
          <CardHeader className="bg-slate-50 px-5 pt-5 pb-7 text-center sm:px-7">
            <p className="text-sm leading-relaxed text-slate-800 sm:text-[15px]">
              Feedback is not configured for this link yet. Please check back
              later.
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const branding = config?.branding;
  const themeColor = branding?.themeColor || DEFAULT_THEME_COLOR;
  const textColor = branding?.textColor || getContrastTextColor(themeColor);
  const bannerImage = branding?.bannerImage || null;
  const logo = branding?.logo || null;
  const headerText = branding?.header || FEEDBACK_FORM_DEFAULTS.title;
  const subtitleText =
    branding?.subtitle || FEEDBACK_FORM_DEFAULTS.labels.howWasExperience;
  const infoStripBackground = isLightColor(themeColor)
    ? "rgba(15,23,42,0.10)"
    : "rgba(255,255,255,0.16)";

  const showBillStrip = loading || billAmount != null || billCreatedAt != null;
  const headerTitle = loading ? FEEDBACK_FORM_DEFAULTS.title : headerText;
  const headerSubtitle = loading
    ? FEEDBACK_FORM_DEFAULTS.labels.howWasExperience
    : subtitleText;

  return (
    <div className={wrapperClass}>
      <style>{`
        .feedback-form textarea:-webkit-autofill,
        .feedback-form textarea:-webkit-autofill:hover,
        .feedback-form textarea:-webkit-autofill:focus,
        .feedback-form textarea:-webkit-autofill:active,
        .feedback-form input:-webkit-autofill,
        .feedback-form input:-webkit-autofill:hover,
        .feedback-form input:-webkit-autofill:focus,
        .feedback-form input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #000 !important;
        }
      `}</style>
      <Card
        className={`${cardClass} feedback-form`}
        style={{ ["--feedback-theme" as string]: themeColor }}
      >
        <div
          className="relative rounded-t-[32px] px-4 py-5 sm:px-5 sm:py-6"
          style={{ backgroundColor: themeColor }}
        >
          {!loading && bannerImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImage}
                alt=""
                className="absolute inset-0 h-full w-full rounded-t-[32px] object-cover"
              />
              <div
                className="absolute inset-0 rounded-t-[32px]"
                style={{ backgroundColor: themeColor, opacity: 0.88 }}
              />
            </>
          )}

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full border border-white/20 bg-white p-[2px] sm:h-16 sm:w-16">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                  {loading ? (
                    <Skeleton className="h-full w-full rounded-full" />
                  ) : logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt={displayBusiness}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-base font-semibold text-neutral-400 sm:text-lg">
                      {(displayBusiness || "B").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h1
                  className={`text-[18px] leading-tight font-semibold sm:text-[20px] ${
                    isLightColor(themeColor) ? "text-gray-900" : "text-white"
                  }`}
                >
                  {headerTitle}
                </h1>
                <p
                  className={`mt-0.5 text-xs sm:text-sm ${
                    isLightColor(themeColor) ? "text-gray-800" : "text-white/95"
                  }`}
                >
                  {headerSubtitle}
                </p>
              </div>
            </div>

            {showBillStrip && (
              <div
                className="grid min-h-[52px] grid-cols-2 gap-2 rounded-lg px-3 py-3 sm:min-h-[56px] sm:grid-cols-3 sm:gap-3 sm:px-4"
                style={{ backgroundColor: infoStripBackground }}
              >
                {(loading || billAmount != null) && (
                  <div className="flex min-w-0 flex-col items-center justify-center text-center">
                    <p
                      className="text-[10px] font-medium opacity-90 sm:text-xs"
                      style={{ color: textColor }}
                    >
                      Spent
                    </p>
                    <div className="mt-0.5 flex min-h-[18px] items-center justify-center sm:min-h-5">
                      {loading ? (
                        <Skeleton className="block h-4 w-14 rounded bg-gray-300/90 sm:h-[18px] sm:w-16" />
                      ) : (
                        <p
                          className="truncate text-xs font-bold sm:text-sm"
                          style={{ color: textColor }}
                        >
                          {currencySymbol}{" "}
                          {Number(billAmount).toLocaleString("en-IN", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {(loading || billCreatedAt) && (
                  <>
                    <div className="flex min-w-0 flex-col items-center justify-center text-center">
                      <p
                        className="text-[10px] font-medium opacity-90 sm:text-xs"
                        style={{ color: textColor }}
                      >
                        Date
                      </p>
                      <div className="mt-0.5 flex min-h-[18px] items-center justify-center sm:min-h-5">
                        {loading ? (
                          <Skeleton className="block h-4 w-20 rounded bg-gray-300/90 sm:h-[18px] sm:w-24" />
                        ) : (
                          <p
                            className="truncate text-xs font-bold sm:text-sm"
                            style={{ color: textColor }}
                          >
                            {formatBillDate(billCreatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col items-center justify-center text-center">
                      <p
                        className="text-[10px] font-medium opacity-90 sm:text-xs"
                        style={{ color: textColor }}
                      >
                        Time
                      </p>
                      <div className="mt-0.5 flex min-h-[18px] items-center justify-center sm:min-h-5">
                        {loading ? (
                          <Skeleton className="block h-4 w-16 rounded bg-gray-300/90 sm:h-[18px] sm:w-20" />
                        ) : (
                          <p
                            className="truncate text-xs font-bold sm:text-sm"
                            style={{ color: textColor }}
                          >
                            {formatBillTime(billCreatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <CardContent className="space-y-6 px-4 pt-4 pb-6 sm:px-6">
          <div className="space-y-2">
            <label
              className="block text-sm leading-none font-semibold text-black"
              htmlFor="feedback-rating"
            >
              {FEEDBACK_FORM_DEFAULTS.labels.howWasExperience}
            </label>
            {loading ? (
              <div
                className="flex justify-center gap-1 sm:gap-2"
                id="feedback-rating"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2"
                  >
                    <Star className="size-9 text-neutral-400 sm:size-10" />
                  </span>
                ))}
              </div>
            ) : (
              <div
                className="flex justify-center gap-1 sm:gap-2"
                id="feedback-rating"
                role="group"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="focus-visible:ring-ring flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg p-2 focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`size-9 sm:size-10 ${
                        rating !== null && value <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-neutral-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {!loading && config && rating !== null && (
            <>
              {/* Selection options – shown first after rating */}
              {config.selectionOptions &&
                config.selectionOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label
                      className="text-sm"
                      style={{ color: "#111827", opacity: 1 }}
                    >
                      What did you like or not like? (optional)
                    </Label>
                    <div
                      className="overflow-hidden rounded-lg border"
                      style={{
                        borderColor: `${themeColor}40`,
                        backgroundColor: `${themeColor}08`,
                      }}
                    >
                      {config.selectionOptions.map((opt, index) => (
                        <label
                          key={opt.id}
                          htmlFor={`sel-${opt.id}`}
                          className="flex min-h-[44px] cursor-pointer touch-manipulation items-center justify-between gap-3 px-4 py-3 transition-colors hover:opacity-90"
                          style={{
                            borderBottom:
                              index < config.selectionOptions!.length - 1
                                ? `1px solid ${themeColor}20`
                                : undefined,
                            backgroundColor:
                              selectedSelectionOptionIds.includes(opt.id)
                                ? `${themeColor}12`
                                : undefined,
                          }}
                        >
                          <span className="text-sm font-normal text-gray-900">
                            {opt.label}
                          </span>
                          <Checkbox
                            id={`sel-${opt.id}`}
                            checked={selectedSelectionOptionIds.includes(
                              opt.id,
                            )}
                            onCheckedChange={() =>
                              toggleSelectionOption(opt.id)
                            }
                            className="shrink-0 touch-manipulation data-[state=checked]:border-[var(--feedback-theme)] data-[state=checked]:bg-[var(--feedback-theme)] data-[state=checked]:text-white"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback-comment" className="text-sm text-black">
              {FEEDBACK_FORM_DEFAULTS.labels.commentOptional}
            </Label>
            <Textarea
              id="feedback-comment"
              placeholder={FEEDBACK_FORM_DEFAULTS.labels.commentPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={loading}
              className="min-h-[88px] resize-none rounded-[12px] border border-neutral-300 !bg-white text-base text-black placeholder:text-black focus-visible:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-70"
            />
          </div>

          {!loading && config && config.categories.length > 0 && (
            <div className="space-y-2">
              <Label
                className="text-sm"
                style={{ color: "#111827", opacity: 1 }}
              >
                {FEEDBACK_FORM_DEFAULTS.labels.whatCouldWeImprove}
              </Label>
              <div className="flex flex-wrap gap-3">
                {config.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex min-h-[44px] items-center gap-2"
                  >
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={selectedCategories.includes(cat.name)}
                      onCheckedChange={() => toggleCategory(cat.name)}
                      className="touch-manipulation"
                    />
                    <Label
                      htmlFor={`cat-${cat.id}`}
                      className="cursor-pointer touch-manipulation text-sm font-normal text-slate-800"
                    >
                      {cat.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading &&
            config?.isHowDidYouHearEnabled &&
            (config?.howDidYouHearOptions?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <Label
                  htmlFor="feedback-how"
                  className="text-sm"
                  style={{ color: "#111827", opacity: 1 }}
                >
                  {FEEDBACK_FORM_DEFAULTS.labels.howDidYouHear}
                </Label>
                <select
                  id="feedback-how"
                  value={howDidYouHear}
                  onChange={(e) => setHowDidYouHear(e.target.value)}
                  className="focus-visible:ring-ring min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <option value="">
                    {FEEDBACK_FORM_DEFAULTS.labels.selectOption}
                  </option>
                  {config.howDidYouHearOptions.map((opt) => (
                    <option key={opt.id} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {submitStatus === "error" && (
            <p className="text-destructive text-sm">{followUpMessage}</p>
          )}

          <button
            type="button"
            onClick={previewMode ? onPreviewSubmit : submitFeedback}
            disabled={loading || submitStatus === "submitting"}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-medium transition-colors active:opacity-90 disabled:opacity-70"
            style={{ backgroundColor: themeColor, color: textColor }}
          >
            {submitStatus === "submitting"
              ? FEEDBACK_FORM_DEFAULTS.labels.submittingButton
              : FEEDBACK_FORM_DEFAULTS.labels.submitButton}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
