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
import { useCallback, useState } from "react";

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
  billNumber: string | null;
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

const platformLabel: Record<string, string> = {
  GOOGLE: "Google",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  ZOMATO: "Zomato",
  OTHER: "Leave a review",
};

const pageWrapperClass =
  "bg-[#F4F4F5] flex min-h-screen min-h-[100dvh] w-full items-center justify-center p-4 sm:p-6";

const cardClass =
  "w-full max-w-[420px] rounded-[32px] border border-gray-200/70 bg-white shadow-sm overflow-hidden flex flex-col";

function OnlineReviewCTA({
  review,
}: {
  review: { link: string; platform: string | null };
}) {
  const label =
    review.platform && platformLabel[review.platform]
      ? `Leave us a review on ${platformLabel[review.platform]}`
      : FEEDBACK_FORM_DEFAULTS.labels.leaveReview;
  return (
    <a
      href={review.link}
      target="_blank"
      rel="noopener noreferrer"
      className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition-colors active:scale-[0.98]"
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
  const billNumber = data?.billNumber ?? null;
  const alreadySubmitted = data?.alreadySubmitted ?? false;
  const loadedFollowUp = data?.followUpMessage ?? null;
  const loadedReward = data?.reward ?? null;
  const loadedOnlineReview = data?.onlineReview ?? null;

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

  // Already submitted: reward at top, then thank you + message
  if (alreadySubmitted) {
    const message = loadedFollowUp ?? FEEDBACK_FORM_DEFAULTS.followUpMessage;
    const showReward = loadedReward?.enabled && loadedReward?.amount != null;
    const showOnlineReview = loadedOnlineReview != null;
    return (
      <div className={pageWrapperClass}>
        <Card className={cardClass}>
          <CardHeader className="px-4 pt-6 pb-6 text-center sm:px-6">
            <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <MessageSquare className="size-6" />
            </div>
            {showReward && (
              <p className="text-foreground mb-2 text-sm font-medium">
                {FEEDBACK_FORM_DEFAULTS.rewardAddedToWallet(
                  loadedReward!.amount!,
                )}
              </p>
            )}
            <h1 className="text-lg font-semibold sm:text-xl">
              {FEEDBACK_FORM_DEFAULTS.thankYouTitle}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
              {message}
            </p>
            {showOnlineReview && (
              <OnlineReviewCTA review={loadedOnlineReview} />
            )}
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitStatus === "success") {
    const showReward = reward?.enabled && reward?.amount != null;
    const showOnlineReview = onlineReview != null;
    return (
      <div className={pageWrapperClass}>
        <Card className={cardClass}>
          <CardHeader className="px-4 pt-6 pb-6 text-center sm:px-6">
            <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <MessageSquare className="size-6" />
            </div>
            {showReward && (
              <p className="text-foreground mb-2 text-sm font-medium">
                {FEEDBACK_FORM_DEFAULTS.rewardAddedToWallet(reward!.amount!)}
              </p>
            )}
            <h1 className="text-lg font-semibold sm:text-xl">
              {FEEDBACK_FORM_DEFAULTS.thankYouTitle}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
              {followUpMessage}
            </p>
            {showOnlineReview && <OnlineReviewCTA review={onlineReview} />}
          </CardHeader>
        </Card>
      </div>
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
      <Card className={cardClass}>
        {/* Branded header similar to referral card */}
        <div
          className="relative px-6 pt-10 pb-12 text-center"
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
                className="absolute inset-0"
                style={{ backgroundColor: themeColor, opacity: 0.88 }}
              />
            </>
          )}

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-white/15 p-[3px]">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={businessSlug}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-lg font-medium text-neutral-400">
                    {(businessSlug || "B").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <h1
              className="text-[20px] leading-snug font-semibold"
              style={{ color: textColor }}
            >
              {headerText}
            </h1>
            <p
              className="mt-1 text-xs leading-relaxed opacity-80"
              style={{ color: textColor }}
            >
              {subtitleText}
            </p>
            {billNumber && (
              <p className="mt-2 text-xs text-white/70">Bill #{billNumber}</p>
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

          {/* Comment */}
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

          {/* Selection options (e.g. what you liked / didn't like) – grouped list */}
          {config.selectionOptions && config.selectionOptions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">
                What did you like or not like? (optional)
              </Label>
              <div className="bg-card rounded-lg border">
                {config.selectionOptions.map((opt, index) => (
                  <label
                    key={opt.id}
                    htmlFor={`sel-${opt.id}`}
                    className={`hover:bg-muted/50 flex min-h-[44px] cursor-pointer touch-manipulation items-center justify-between gap-3 px-4 py-3 transition-colors ${
                      index < config.selectionOptions!.length - 1
                        ? "border-b"
                        : ""
                    }`}
                  >
                    <span className="text-foreground text-sm font-normal">
                      {opt.label}
                    </span>
                    <Checkbox
                      id={`sel-${opt.id}`}
                      checked={selectedSelectionOptionIds.includes(opt.id)}
                      onCheckedChange={() => toggleSelectionOption(opt.id)}
                      className="shrink-0 touch-manipulation"
                    />
                  </label>
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
