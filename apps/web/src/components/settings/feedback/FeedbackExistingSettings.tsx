"use client";

import { BrandingFieldGroup } from "@/components/common/settings/BrandingFieldGroup";
import { SettingsFieldGroup } from "@/components/common/settings/SettingsFieldGroup";
import type {
  FeedbackConfigDto,
  FeedbackSelectionOptionDto,
} from "@/hooks/feedback/useFeedbackConfig";
import {
  useCreateFeedbackSelectionOption,
  useDeleteFeedbackSelectionOption,
  useReorderFeedbackSelectionOptions,
  useUpdateFeedbackConfig,
  useUpdateFeedbackSelectionOption,
} from "@/hooks/feedback/useFeedbackConfig";
import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms/feedback";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SaveButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  Textarea,
} from "@reelo/ui/components";
import { GripVertical, Trash2 } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const TIMING_OPTIONS = [
  { value: "IMMEDIATELY", label: "Immediately" },
  { value: "AFTER_DELAY", label: "After delay" },
];

const COLLECTION_CHANNEL_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
  { value: "CASHIER_PORTAL", label: "Cashier portal" },
];

const ONLINE_REVIEW_PLATFORM_OPTIONS = [
  { value: "GOOGLE", label: "Google" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "ZOMATO", label: "Zomato" },
  { value: "OTHER", label: "Other" },
];

type SectionSaveHandle = {
  save: () => Promise<void>;
};

const discoveryAndReviewsSchema = z
  .object({
    isHowDidYouHearEnabled: z.string(),
    askForOnlineReviews: z.string(),
    onlineReviewPlatform: z.string(),
    onlineReviewLink: z.string(),
  })
  .refine(
    (data) => {
      if (data.askForOnlineReviews !== "true") return true;
      return (
        (data.onlineReviewPlatform?.trim() ?? "").length > 0 &&
        (data.onlineReviewLink?.trim() ?? "").length > 0
      );
    },
    {
      message:
        "Platform and Review link are required when review prompt is on.",
      path: ["onlineReviewLink"],
    },
  );

type DiscoveryAndReviewsValues = z.infer<typeof discoveryAndReviewsSchema>;

const timingAndCollectionSchema = z.object({
  timing: z.string(),
  delaySeconds: z.string().optional(),
  collectionChannel: z.string(),
  sendViaSmsIfWpFailed: z.string(),
});

type TimingAndCollectionValues = z.infer<typeof timingAndCollectionSchema>;

const followUpRewardsSchema = z.object({
  positiveFollowUp: z.string().optional(),
  negativeFollowUp: z.string().optional(),
  feedbackRewardEnabled: z.string().optional(),
  rewardAmount: z.string().optional(),
});

type FollowUpRewardsValues = z.infer<typeof followUpRewardsSchema>;

const DiscoveryAndReviewsCard = forwardRef<
  SectionSaveHandle,
  {
    config: FeedbackConfigDto;
    onSubmit: (values: Record<string, string>) => Promise<{
      success: boolean;
      error?: string;
    }>;
    embedded?: boolean;
    onDirtyChange?: (dirty: boolean) => void;
  }
>(function DiscoveryAndReviewsCard(
  { config, onSubmit, embedded = false, onDirtyChange },
  ref,
) {
  const form = useForm<DiscoveryAndReviewsValues>({
    resolver: zodResolver(discoveryAndReviewsSchema),
    defaultValues: {
      isHowDidYouHearEnabled: config.isHowDidYouHearEnabled ? "true" : "false",
      askForOnlineReviews: config.askForOnlineReviews ? "true" : "false",
      onlineReviewPlatform: config.onlineReviewPlatform ?? "",
      onlineReviewLink: config.onlineReviewLink ?? "",
    },
  });
  const askForOnlineReviewsOn = form.watch("askForOnlineReviews") === "true";

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    const result = await onSubmit({
      isHowDidYouHearEnabled: values.isHowDidYouHearEnabled,
      askForOnlineReviews: values.askForOnlineReviews,
      onlineReviewPlatform: values.onlineReviewPlatform,
      onlineReviewLink: values.onlineReviewLink,
    });
    if (result.success) {
      toast.success("Settings updated successfully");
      form.reset(form.getValues(), { keepDefaultValues: false });
    } else {
      toast.error(result.error || "Failed to update settings");
      throw new Error(result.error);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      save: runSubmit,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, config],
  );

  const content = (
    <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
      <CardHeader className="mb-2 gap-0 border-0 px-4 pt-4 pb-0">
        <CardTitle className="text-foreground text-sm font-semibold">
          Discovery & reviews
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1 text-sm">
          Ask how customers found you and prompt them to leave a review after
          feedback.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <FormField
              control={form.control}
              name="isHowDidYouHearEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <FormLabel className="text-sm">How did you hear</FormLabel>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === "true"}
                          onCheckedChange={(v) =>
                            field.onChange(v ? "true" : "false")
                          }
                        />
                        <span className="text-muted-foreground text-sm">
                          Ask customers how they discovered your business
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="askForOnlineReviews"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <FormLabel className="text-sm">
                      Ask for online reviews
                    </FormLabel>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === "true"}
                          onCheckedChange={(v) =>
                            field.onChange(v ? "true" : "false")
                          }
                        />
                        <span className="text-muted-foreground text-sm">
                          Show review prompt after feedback
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="onlineReviewPlatform"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <FormLabel className="text-sm">Platform</FormLabel>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={!askForOnlineReviewsOn}
                      >
                        <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ONLINE_REVIEW_PLATFORM_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="onlineReviewLink"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <FormLabel className="text-sm">Review link</FormLabel>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <FormControl>
                      <Input
                        variant="underline"
                        type="text"
                        {...field}
                        value={field.value || ""}
                        placeholder="https://..."
                        disabled={!askForOnlineReviewsOn}
                        className="rounded-none border-0 border-b bg-transparent px-0 shadow-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </form>
      </Form>
    </Card>
  );

  if (embedded) return content;

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Discovery & reviews
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Ask how customers found you and prompt them to leave a review after
          feedback
        </CardDescription>
      </CardHeader>
      {content}
      <CardFooter className="flex shrink-0 items-center justify-end border-0 px-4 py-2">
        <SaveButton
          onSave={runSubmit}
          disabled={!form.formState.isDirty}
          labels={{
            idle: "Save changes",
            loading: "Saving",
            success: "Saved",
          }}
        />
      </CardFooter>
    </Card>
  );
});

const TimingAndCollectionCard = forwardRef<
  SectionSaveHandle,
  {
    config: FeedbackConfigDto;
    onSubmit: (values: Record<string, string>) => Promise<{
      success: boolean;
      error?: string;
    }>;
    embedded?: boolean;
    onDirtyChange?: (dirty: boolean) => void;
  }
>(function TimingAndCollectionCard(
  { config, onSubmit, embedded = false, onDirtyChange },
  ref,
) {
  const form = useForm<TimingAndCollectionValues>({
    resolver: zodResolver(timingAndCollectionSchema),
    defaultValues: {
      timing: config.timing,
      delaySeconds:
        config.delaySeconds != null ? String(config.delaySeconds) : "",
      collectionChannel: config.collectionChannel,
      sendViaSmsIfWpFailed: config.sendViaSmsIfWpFailed ? "true" : "false",
    },
  });

  const timing = form.watch("timing");

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    const result = await onSubmit({
      timing: values.timing,
      delaySeconds: values.delaySeconds ?? "",
      collectionChannel: values.collectionChannel,
      sendViaSmsIfWpFailed: values.sendViaSmsIfWpFailed ?? "false",
    });
    if (result.success) {
      toast.success("Settings updated successfully");
      form.reset(values, { keepDefaultValues: false });
    } else {
      toast.error(result.error || "Failed to update settings");
      throw new Error(result.error);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      save: runSubmit,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, config],
  );

  const content = (
    <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
      <CardHeader className="mb-2 gap-0 border-0 px-4 pt-4 pb-0">
        <CardTitle className="text-foreground text-sm font-semibold">
          Timing & collection
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1 text-sm">
          When and how to collect feedback from customers.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <FormField
              control={form.control}
              name="timing"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel className="text-sm">When to ask</FormLabel>
                  </div>
                  <div className="col-span-8">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMING_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="delaySeconds"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <FormLabel className="text-sm">Delay (seconds)</FormLabel>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <FormControl>
                      <Input
                        variant="underline"
                        type="number"
                        {...field}
                        value={field.value || ""}
                        placeholder="0"
                        min={0}
                        disabled={timing !== "AFTER_DELAY"}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collectionChannel"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel className="text-sm">
                      Collection channel
                    </FormLabel>
                  </div>
                  <div className="col-span-8">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLECTION_CHANNEL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sendViaSmsIfWpFailed"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel className="text-sm">
                      Send via SMS if WhatsApp fails
                    </FormLabel>
                  </div>
                  <div className="col-span-8">
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === "true"}
                          onCheckedChange={(v) =>
                            field.onChange(v ? "true" : "false")
                          }
                        />
                        <span className="text-muted-foreground text-sm">
                          Fallback to SMS
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </form>
      </Form>
    </Card>
  );

  if (embedded) return content;

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Timing & collection
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          When and how to collect feedback
        </CardDescription>
      </CardHeader>
      {content}
      <CardFooter className="flex shrink-0 items-center justify-end border-0 px-4 py-2">
        <SaveButton
          onSave={runSubmit}
          disabled={!form.formState.isDirty}
          labels={{
            idle: "Save changes",
            loading: "Saving",
            success: "Saved",
          }}
        />
      </CardFooter>
    </Card>
  );
});

function FollowUpRewardsSelectionCard({
  config,
  onSubmit,
}: {
  config: FeedbackConfigDto;
  onSubmit: (values: Record<string, string>) => Promise<{
    success: boolean;
    error?: string;
  }>;
}) {
  const form = useForm<FollowUpRewardsValues>({
    resolver: zodResolver(followUpRewardsSchema),
    defaultValues: {
      positiveFollowUp: config.positiveFollowUp ?? "",
      negativeFollowUp: config.negativeFollowUp ?? "",
      feedbackRewardEnabled: config.feedbackRewardEnabled ? "true" : "false",
      rewardAmount:
        config.rewardAmount != null ? String(config.rewardAmount) : "",
    },
  });

  const rewardEnabled = form.watch("feedbackRewardEnabled") === "true";

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    const result = await onSubmit({
      positiveFollowUp: values.positiveFollowUp ?? "",
      negativeFollowUp: values.negativeFollowUp ?? "",
      feedbackRewardEnabled: values.feedbackRewardEnabled ?? "false",
      rewardAmount: values.rewardAmount ?? "",
    });
    if (result.success) {
      toast.success("Settings updated successfully");
      form.reset(values, { keepDefaultValues: false });
    } else {
      toast.error(result.error || "Failed to update settings");
      throw new Error(result.error);
    }
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Feedback experience
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Follow-up messages, rewards, and selection options shown to customers.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 py-4">
            <Card className="border-border/45 bg-background/55 flex flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
              <CardHeader className="mb-2 gap-0 border-0 px-4 pt-4 pb-0">
                <CardTitle className="text-foreground text-sm font-semibold">
                  Follow-up messages
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1 text-sm">
                  Messages shown after positive or negative feedback.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-4 px-4 py-4">
                <FormField
                  control={form.control}
                  name="positiveFollowUp"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4 flex flex-col gap-2">
                        <FormLabel className="text-sm">
                          Positive follow-up
                        </FormLabel>
                      </div>
                      <div className="col-span-8 flex flex-col gap-1">
                        <FormControl>
                          <Textarea
                            variant="underline"
                            {...field}
                            value={field.value || ""}
                            placeholder="Thank you for your feedback!"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="negativeFollowUp"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4 flex flex-col gap-2">
                        <FormLabel className="text-sm">
                          Negative follow-up
                        </FormLabel>
                      </div>
                      <div className="col-span-8 flex flex-col gap-1">
                        <FormControl>
                          <Textarea
                            variant="underline"
                            {...field}
                            value={field.value || ""}
                            placeholder="We're sorry to hear that. We'll look into it."
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/45 bg-background/55 flex flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
              <CardHeader className="mb-2 gap-0 border-0 px-4 pt-4 pb-0">
                <CardTitle className="text-foreground text-sm font-semibold">
                  Feedback rewards
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1 text-sm">
                  Credit cashback to the customer&apos;s wallet when they submit
                  feedback.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-4 px-4 py-4">
                <FormField
                  control={form.control}
                  name="feedbackRewardEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4">
                        <FormLabel className="text-sm">Enable reward</FormLabel>
                      </div>
                      <div className="col-span-8">
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={field.value === "true"}
                              onCheckedChange={(v) =>
                                field.onChange(v ? "true" : "false")
                              }
                            />
                            <span className="text-muted-foreground text-sm">
                              Give cashback for feedback
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rewardAmount"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4 flex flex-col gap-2">
                        <FormLabel className="text-sm">
                          Reward amount (₹ cashback)
                        </FormLabel>
                      </div>
                      <div className="col-span-8 flex flex-col gap-1">
                        <FormControl>
                          <Input
                            variant="underline"
                            type="number"
                            {...field}
                            value={field.value || ""}
                            placeholder="0"
                            min={0}
                            disabled={!rewardEnabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/45 bg-background/55 flex flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
              <CardContent className="px-4 py-4">
                <div className="flex flex-col gap-4 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <div className="text-foreground text-sm font-semibold">
                      Selection options
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Options customers can select when giving feedback (for
                      example what they liked or did not like). Order is used on
                      the feedback form.
                    </p>
                    <SelectionOptionsSuggestions
                      options={config.selectionOptions ?? []}
                    />
                  </div>
                  <div className="col-span-8">
                    <SelectionOptionsSection
                      options={config.selectionOptions ?? []}
                      embedded
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter className="flex shrink-0 items-center justify-end border-0 px-4 py-2">
            <SaveButton
              onSave={runSubmit}
              disabled={!form.formState.isDirty}
              labels={{
                idle: "Save changes",
                loading: "Saving",
                success: "Saved",
              }}
            />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function SelectionOptionsSection({
  options,
  embedded = false,
}: {
  options: FeedbackSelectionOptionDto[];
  embedded?: boolean;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const createOption = useCreateFeedbackSelectionOption();
  const updateOption = useUpdateFeedbackSelectionOption();
  const deleteOption = useDeleteFeedbackSelectionOption();
  const reorderOptions = useReorderFeedbackSelectionOptions();

  const hasOptions = options.length > 0;

  const handleAdd = useCallback(async () => {
    const label = newLabel.trim();
    if (!label) return;
    try {
      await createOption.mutateAsync({ label, seq: options.length });
      setNewLabel("");
      toast.success("Option added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add option");
    }
  }, [newLabel, options.length, createOption]);

  const handleReorder = useCallback(
    async (reordered: FeedbackSelectionOptionDto[]) => {
      const orderedIds = reordered.map((o) => o.id);
      if (orderedIds.join() === options.map((o) => o.id).join()) return;
      try {
        await reorderOptions.mutateAsync({ orderedIds });
        toast.success("Order updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update order");
      }
    },
    [options, reorderOptions],
  );

  const handleUpdateLabel = useCallback(
    async (id: string, label: string) => {
      const trimmed = label.trim();
      const opt = options.find((o) => o.id === id);
      if (!opt || trimmed === opt.label) {
        setEditingId(null);
        return;
      }
      try {
        await updateOption.mutateAsync({ id, label: trimmed });
        setEditingId(null);
        toast.success("Option updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update option");
      }
    },
    [options, updateOption],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteOption.mutateAsync(id);
        toast.success("Option removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove option");
      }
    },
    [deleteOption],
  );

  const content = (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          className="min-h-9 flex-1"
          placeholder="Add option (e.g. Friendly staff)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={!newLabel.trim() || createOption.isPending}
        >
          Add
        </Button>
      </div>
      {hasOptions ? (
        <Sortable
          value={options}
          getItemValue={(item) => item.id}
          onValueChange={(next) => handleReorder(next)}
        >
          <SortableContent className="flex flex-col gap-2">
            {options.map((opt) => (
              <SortableItem
                key={opt.id}
                value={opt.id}
                className="border-input bg-background flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <SortableItemHandle
                  className="text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="size-4" />
                </SortableItemHandle>
                {editingId === opt.id ? (
                  <Input
                    className="min-h-9 flex-1"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={() => handleUpdateLabel(opt.id, editLabel)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    className="min-h-9 flex-1 text-left text-sm"
                    onClick={() => {
                      setEditingId(opt.id);
                      setEditLabel(opt.label);
                    }}
                  >
                    {opt.label}
                  </button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                  aria-label="Remove option"
                  onClick={() => handleDelete(opt.id)}
                  disabled={deleteOption.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </SortableItem>
            ))}
          </SortableContent>
        </Sortable>
      ) : (
        <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-5 text-sm">
          No options yet. Add the first option above.
        </div>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Selection options
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Options customers can select when giving feedback (for example what
          they liked or did not like). Order is used on the feedback form.
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <CardContent className="overflow-hidden px-4 py-4">
          {content}
        </CardContent>
      </Card>
    </Card>
  );
}

function SelectionOptionsSuggestions({
  options,
}: {
  options: FeedbackSelectionOptionDto[];
}) {
  const createOption = useCreateFeedbackSelectionOption();
  const normalizedExisting = useMemo(
    () =>
      new Set(
        options.map((opt) => opt.label.trim().toLowerCase()).filter(Boolean),
      ),
    [options],
  );
  const suggestedDefaults = useMemo(
    () =>
      FEEDBACK_FORM_DEFAULTS.selectionOptions.filter(
        (label) => !normalizedExisting.has(label.trim().toLowerCase()),
      ),
    [normalizedExisting],
  );

  const handleAddSuggestedDefault = useCallback(
    async (label: string) => {
      try {
        await createOption.mutateAsync({ label });
        toast.success("Option added");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to add suggestion",
        );
      }
    },
    [createOption],
  );

  if (suggestedDefaults.length === 0) return null;

  return (
    <div className="border-border/60 bg-background/60 flex flex-col gap-2 rounded-lg border px-3 py-3">
      <div className="text-muted-foreground text-xs">Suggested defaults</div>
      <div className="flex flex-wrap gap-2">
        {suggestedDefaults.map((label) => (
          <Button
            key={label}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleAddSuggestedDefault(label)}
            disabled={createOption.isPending}
            className="h-7 px-2 text-xs"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface FeedbackExistingSettingsProps {
  config: FeedbackConfigDto;
}

export function FeedbackExistingSettings({
  config,
}: FeedbackExistingSettingsProps) {
  const { mutateAsync: updateConfig } = useUpdateFeedbackConfig();
  const discoveryRef = useRef<SectionSaveHandle>(null);
  const timingRef = useRef<SectionSaveHandle>(null);
  const [discoveryDirty, setDiscoveryDirty] = useState(false);
  const [timingDirty, setTimingDirty] = useState(false);

  const handleUpdateBranding = async (values: Record<string, string>) => {
    try {
      await updateConfig({
        branding: {
          logo: values.logo || null,
          themeColor: values.themeColor || null,
          textColor: values.textColor || null,
          bannerImage: values.bannerImage || null,
          header: values.header || null,
          subtitle: values.subtitle || null,
        },
      });
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update",
      };
    }
  };

  const handleUpdateFollowUpAndRewards = async (
    values: Record<string, string>,
  ) => {
    try {
      await updateConfig({
        positiveFollowUp: values.positiveFollowUp || null,
        negativeFollowUp: values.negativeFollowUp || null,
        feedbackRewardEnabled: values.feedbackRewardEnabled === "true",
        rewardAmount: values.rewardAmount ? Number(values.rewardAmount) : null,
      });
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update",
      };
    }
  };

  const handleUpdateTimingAndCollection = async (
    values: Record<string, string>,
  ) => {
    try {
      await updateConfig({
        timing: values.timing as "IMMEDIATELY" | "AFTER_DELAY",
        delaySeconds: values.delaySeconds ? Number(values.delaySeconds) : null,
        collectionChannel: values.collectionChannel as
          | "WHATSAPP"
          | "SMS"
          | "EMAIL"
          | "CASHIER_PORTAL",
        sendViaSmsIfWpFailed: values.sendViaSmsIfWpFailed === "true",
      });
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update",
      };
    }
  };

  const handleUpdateNegativeAlerts = async (values: Record<string, string>) => {
    try {
      await updateConfig({
        negAlertChannelsWp: values.negAlertChannelsWp === "true",
        negAlertChannelsSms: values.negAlertChannelsSms === "true",
        negAlertChannelsEmail: values.negAlertChannelsEmail === "true",
        negFeedbackAlertNumber: values.negFeedbackAlertNumber || null,
        negFeedbackAlertSmsNumber: values.negFeedbackAlertSmsNumber || null,
        negFeedbackAlertEmailAddress:
          values.negFeedbackAlertEmailAddress || null,
      });
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update",
      };
    }
  };

  const handleUpdateDiscoveryAndReviews = async (
    values: Record<string, string>,
  ) => {
    try {
      const askOn = values.askForOnlineReviews === "true";
      await updateConfig({
        isHowDidYouHearEnabled: values.isHowDidYouHearEnabled === "true",
        askForOnlineReviews: askOn,
        onlineReviewLink: askOn
          ? values.onlineReviewLink?.trim() || null
          : null,
        onlineReviewPlatform: askOn
          ? (values.onlineReviewPlatform as
              | "GOOGLE"
              | "INSTAGRAM"
              | "FACEBOOK"
              | "ZOMATO"
              | "OTHER") || null
          : null,
      });
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update",
      };
    }
  };

  return (
    <div className="space-y-6">
      <FollowUpRewardsSelectionCard
        config={config}
        onSubmit={handleUpdateFollowUpAndRewards}
      />

      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Collection & reviews
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Configure when to ask for feedback and whether to prompt for online
            reviews.
          </CardDescription>
        </CardHeader>
        <div className="space-y-3">
          <DiscoveryAndReviewsCard
            ref={discoveryRef}
            config={config}
            onSubmit={handleUpdateDiscoveryAndReviews}
            onDirtyChange={setDiscoveryDirty}
            embedded
          />
          <TimingAndCollectionCard
            ref={timingRef}
            config={config}
            onSubmit={handleUpdateTimingAndCollection}
            onDirtyChange={setTimingDirty}
            embedded
          />
        </div>
        <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
          <SaveButton
            onSave={async () => {
              const tasks = [
                discoveryRef.current?.save(),
                timingRef.current?.save(),
              ].filter(Boolean) as Array<Promise<void>>;
              await Promise.all(tasks);
            }}
            disabled={!(discoveryDirty || timingDirty)}
            labels={{
              idle: "Save changes",
              loading: "Saving",
              success: "Saved",
            }}
          />
        </CardFooter>
      </Card>

      <SettingsFieldGroup
        title="Negative feedback alerts"
        description="Get notified when customers leave negative feedback"
        fields={[
          {
            name: "negAlertChannelsWp",
            label: "Alert via WhatsApp",
            type: "checkbox",
            checkboxLabel: "Send alert to WhatsApp",
          },
          {
            name: "negAlertChannelsSms",
            label: "Alert via SMS",
            type: "checkbox",
            checkboxLabel: "Send alert via SMS",
          },
          {
            name: "negAlertChannelsEmail",
            label: "Alert via email",
            type: "checkbox",
            checkboxLabel: "Send alert via email",
          },
          {
            name: "negFeedbackAlertNumber",
            label: "WhatsApp number",
            placeholder: "+91...",
            optional: true,
          },
          {
            name: "negFeedbackAlertSmsNumber",
            label: "SMS number",
            placeholder: "+91...",
            optional: true,
          },
          {
            name: "negFeedbackAlertEmailAddress",
            label: "Alert email address",
            placeholder: "alerts@example.com",
            optional: true,
          },
        ]}
        defaultValues={{
          negAlertChannelsWp: config.negAlertChannelsWp ? "true" : "false",
          negAlertChannelsSms: config.negAlertChannelsSms ? "true" : "false",
          negAlertChannelsEmail: config.negAlertChannelsEmail
            ? "true"
            : "false",
          negFeedbackAlertNumber: config.negFeedbackAlertNumber ?? "",
          negFeedbackAlertSmsNumber: config.negFeedbackAlertSmsNumber ?? "",
          negFeedbackAlertEmailAddress:
            config.negFeedbackAlertEmailAddress ?? "",
        }}
        onSubmit={handleUpdateNegativeAlerts}
      />

      <BrandingFieldGroup
        title="Branding"
        description="Customize appearance of the feedback page"
        defaultValues={{
          logo: config.branding?.logo ?? "",
          themeColor: config.branding?.themeColor ?? "",
          textColor: config.branding?.textColor ?? "",
          bannerImage: config.branding?.bannerImage ?? "",
          header: config.branding?.header ?? "",
          subtitle: config.branding?.subtitle ?? "",
        }}
        onSubmit={handleUpdateBranding}
      />
    </div>
  );
}
