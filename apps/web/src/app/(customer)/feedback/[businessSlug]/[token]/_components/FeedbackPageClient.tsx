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
}

interface PublicFeedbackConfig {
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
  "bg-[#F4F4F5] flex min-h-screen min-h-[100dvh] w-full items-center justify-center px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-4";

const cardClass =
  "w-full max-w-[420px] rounded-[32px] border border-gray-200/70 bg-white shadow-sm overflow-hidden flex flex-col !p-0";

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
              borderColor: `${themeColor}40`,
              backgroundColor: `${themeColor}12`,
              color: themeColor,
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
    enabled: !!businessSlug && !!token,
  });

  const config = data?.config ?? null;
  const billAmount = data?.billAmount ?? null;
  const billCreatedAt = data?.billCreatedAt ?? null;
  const currencySymbol = data?.currencySymbol ?? "₹";
  const alreadySubmitted = data?.alreadySubmitted ?? false;
  const loadedFollowUp = data?.followUpMessage ?? null;
  const loadedReward = data?.reward ?? null;
  const loadedOnlineReview = data?.onlineReview ?? null;

  // Keep form branding in state so thank-you view uses same theme (not default purple)
  useEffect(() => {
    if (submitStatus === "success") return;
    const b = config?.branding;
    if (!b) return;
    setFormBranding({
      themeColor: b.themeColor ?? "#000000",
      textColor: b.textColor ?? "#ffffff",
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

  if (isLoading || (!data && !isError)) {
    return (
      <div className={pageWrapperClass}>
        <Card className={cardClass}>
          <CardHeader className="px-4 pt-6 pb-4 text-center sm:px-6">
            <Skeleton className="bg-primary/10 mx-auto mb-2 size-12 rounded-full" />
            <Skeleton className="mx-auto h-6 w-24" />
            <Skeleton className="mx-auto mt-2 h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6 sm:px-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={pageWrapperClass}>
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
                    {(businessSlug || "B").charAt(0).toUpperCase()}
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
  const themeColorFallback = brandingFromConfig?.themeColor || "#7c3aed";
  const textColorFallback = brandingFromConfig?.textColor || "#ffffff";
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

  if (!config) {
    return (
      <div className={pageWrapperClass}>
        <Card className={cardClass}>
          <CardHeader className="px-4 pt-6 pb-6 text-center sm:px-6">
            <div className="bg-muted text-muted-foreground mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <MessageSquare className="size-6" />
            </div>
            <h1 className="text-lg font-semibold sm:text-xl">Feedback</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Feedback is not configured for this link yet. Please check back
              later.
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const branding = config.branding;
  const themeColor = branding?.themeColor || "#000000";
  const textColor = branding?.textColor || "#ffffff";
  const bannerImage = branding?.bannerImage || null;
  const logo = branding?.logo || null;
  const headerText = branding?.header || "We'd love your feedback";
  const subtitleText =
    branding?.subtitle || FEEDBACK_FORM_DEFAULTS.labels.howWasExperience;

  return (
    <div className={pageWrapperClass}>
      <Card
        className={cardClass}
        style={{ ["--feedback-theme" as string]: themeColor }}
      >
        {/* Merged header: logo left, text right, bill row inside same block */}
        <div
          className="relative rounded-t-[32px] px-4 py-5 sm:px-5 sm:py-6"
          style={{ backgroundColor: themeColor }}
        >
          {bannerImage && (
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
            {/* Row 1: Logo left, title + subtitle right */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full border border-white/20 bg-white p-[2px] sm:h-16 sm:w-16">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt={businessSlug}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-base font-semibold text-neutral-400 sm:text-lg">
                      {(businessSlug || "B").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h1
                  className="text-[18px] leading-tight font-semibold sm:text-[20px]"
                  style={{ color: textColor }}
                >
                  {headerText}
                </h1>
                <p
                  className="mt-0.5 text-xs opacity-90 sm:text-sm"
                  style={{ color: textColor }}
                >
                  {subtitleText}
                </p>
              </div>
            </div>

            {/* Row 2: Spent | Date | Time merged in header */}
            {(billAmount != null || billCreatedAt) && (
              <div
                className="grid grid-cols-2 gap-2 rounded-lg px-3 py-3 sm:grid-cols-3 sm:gap-3 sm:px-4"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                {billAmount != null && (
                  <div className="min-w-0 text-center">
                    <p
                      className="text-[10px] font-medium opacity-90 sm:text-xs"
                      style={{ color: textColor }}
                    >
                      Spent
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs font-bold sm:text-sm"
                      style={{ color: textColor }}
                    >
                      {currencySymbol}{" "}
                      {Number(billAmount).toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
                {billCreatedAt && (
                  <>
                    <div className="min-w-0 text-center">
                      <p
                        className="text-[10px] font-medium opacity-90 sm:text-xs"
                        style={{ color: textColor }}
                      >
                        Date
                      </p>
                      <p
                        className="mt-0.5 truncate text-xs font-bold sm:text-sm"
                        style={{ color: textColor }}
                      >
                        {formatBillDate(billCreatedAt)}
                      </p>
                    </div>
                    <div className="min-w-0 text-center">
                      <p
                        className="text-[10px] font-medium opacity-90 sm:text-xs"
                        style={{ color: textColor }}
                      >
                        Time
                      </p>
                      <p
                        className="mt-0.5 truncate text-xs font-bold sm:text-sm"
                        style={{ color: textColor }}
                      >
                        {formatBillTime(billCreatedAt)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <CardContent className="space-y-6 px-4 pt-4 pb-6 sm:px-6">
          {/* Rating 1–5: touch-friendly stars */}
          <div className="space-y-2">
            <Label className="text-sm">
              {FEEDBACK_FORM_DEFAULTS.labels.howWasExperience}
            </Label>
            <div className="flex justify-center gap-1 sm:gap-2">
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
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* After star selection: selection options first, then comment */}
          {rating !== null && (
            <>
              {/* Selection options – shown first after rating */}
              {config.selectionOptions &&
                config.selectionOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">
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

              {/* Comment – shown after selection options */}
              <div className="space-y-2">
                <Label htmlFor="feedback-comment" className="text-sm">
                  {FEEDBACK_FORM_DEFAULTS.labels.commentOptional}
                </Label>
                <Textarea
                  id="feedback-comment"
                  placeholder={FEEDBACK_FORM_DEFAULTS.labels.commentPlaceholder}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="min-h-[88px] resize-none text-base"
                />
              </div>
            </>
          )}

          {/* Categories */}
          {config.categories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">
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
                      className="cursor-pointer touch-manipulation text-sm font-normal"
                    >
                      {cat.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How did you hear about us */}
          {config.isHowDidYouHearEnabled &&
            config.howDidYouHearOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="feedback-how" className="text-sm">
                  {FEEDBACK_FORM_DEFAULTS.labels.howDidYouHear}
                </Label>
                <select
                  id="feedback-how"
                  value={howDidYouHear}
                  onChange={(e) => setHowDidYouHear(e.target.value)}
                  className="border-input bg-background focus-visible:ring-ring min-h-[44px] w-full rounded-lg border px-3 py-3 text-base focus-visible:ring-2 focus-visible:outline-none"
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
            onClick={submitFeedback}
            disabled={submitStatus === "submitting"}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-medium transition-colors active:opacity-90"
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
