"use client";

import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms";
import {
  Button,
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
  askForOnlineReviews: boolean;
  onlineReviewLink: string | null;
  onlineReviewPlatform: string | null;
  branding: unknown;
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
      className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 mt-4 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
    >
      {label}
      <ExternalLink className="size-4" />
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
  }, [businessSlug, token, rating, comment, howDidYouHear, selectedCategories]);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  if (isLoading || (!data && !isError)) {
    return (
      <div className="bg-muted/30 flex min-h-[50vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="bg-primary/10 mx-auto mb-2 size-12 rounded-full" />
            <Skeleton className="mx-auto h-6 w-24" />
            <Skeleton className="mx-auto mt-2 h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-muted/30 flex min-h-[50vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <MessageSquare className="size-6" />
            </div>
            <h1 className="text-xl font-semibold">Feedback link invalid</h1>
            <p className="text-muted-foreground text-sm">
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
      <div className="bg-muted/30 flex min-h-[50vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
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
            <h1 className="text-xl font-semibold">
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
      <div className="bg-muted/30 flex min-h-[50vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <MessageSquare className="size-6" />
            </div>
            {showReward && (
              <p className="text-foreground mb-2 text-sm font-medium">
                {FEEDBACK_FORM_DEFAULTS.rewardAddedToWallet(reward!.amount!)}
              </p>
            )}
            <h1 className="text-xl font-semibold">
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
      <div className="bg-muted/30 flex min-h-[50vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-muted text-muted-foreground mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <MessageSquare className="size-6" />
            </div>
            <h1 className="text-xl font-semibold">Feedback</h1>
            <p className="text-muted-foreground text-sm">
              Feedback is not configured for this link yet. Please check back
              later.
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 flex min-h-[50vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
            <MessageSquare className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">We’d love your feedback</h1>
          {billNumber && (
            <p className="text-muted-foreground text-sm">Bill #{billNumber}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating 1–5 */}
          <div className="space-y-2">
            <Label>{FEEDBACK_FORM_DEFAULTS.labels.howWasExperience}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="focus-visible:ring-ring rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`size-8 ${
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
            <Label htmlFor="feedback-comment">
              {FEEDBACK_FORM_DEFAULTS.labels.commentOptional}
            </Label>
            <Textarea
              id="feedback-comment"
              placeholder={FEEDBACK_FORM_DEFAULTS.labels.commentPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Categories */}
          {config.categories.length > 0 && (
            <div className="space-y-2">
              <Label>{FEEDBACK_FORM_DEFAULTS.labels.whatCouldWeImprove}</Label>
              <div className="flex flex-wrap gap-3">
                {config.categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={selectedCategories.includes(cat.name)}
                      onCheckedChange={() => toggleCategory(cat.name)}
                    />
                    <Label
                      htmlFor={`cat-${cat.id}`}
                      className="cursor-pointer text-sm font-normal"
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
                <Label htmlFor="feedback-how">
                  {FEEDBACK_FORM_DEFAULTS.labels.howDidYouHear}
                </Label>
                <select
                  id="feedback-how"
                  value={howDidYouHear}
                  onChange={(e) => setHowDidYouHear(e.target.value)}
                  className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
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

          <Button
            type="button"
            onClick={submitFeedback}
            disabled={submitStatus === "submitting"}
            className="w-full"
          >
            {submitStatus === "submitting"
              ? FEEDBACK_FORM_DEFAULTS.labels.submittingButton
              : FEEDBACK_FORM_DEFAULTS.labels.submitButton}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
