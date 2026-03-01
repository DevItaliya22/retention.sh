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
} from "@reelo/ui/components";
import { GripVertical, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
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

function DiscoveryAndReviewsCard({
  config,
  onSubmit,
}: {
  config: FeedbackConfigDto;
  onSubmit: (values: Record<string, string>) => Promise<{
    success: boolean;
    error?: string;
  }>;
}) {
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
  const isDirty = form.formState.isDirty;

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
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
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
                      <FormLabel className="text-sm">
                        How did you hear
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
            <CardFooter className="flex shrink-0 items-center justify-end border-0 px-4 py-2">
              <SaveButton
                onSave={runSubmit}
                disabled={!isDirty}
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
    </Card>
  );
}

function SelectionOptionsSection({
  options,
}: {
  options: FeedbackSelectionOptionDto[];
}) {
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const createOption = useCreateFeedbackSelectionOption();
  const updateOption = useUpdateFeedbackSelectionOption();
  const deleteOption = useDeleteFeedbackSelectionOption();
  const reorderOptions = useReorderFeedbackSelectionOptions();

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
          <div className="flex flex-col gap-2">
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
          </div>
        </CardContent>
      </Card>
    </Card>
  );
}

interface FeedbackExistingSettingsProps {
  config: FeedbackConfigDto;
}

export function FeedbackExistingSettings({
  config,
}: FeedbackExistingSettingsProps) {
  const { mutateAsync: updateConfig } = useUpdateFeedbackConfig();

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

  const handleUpdateFollowUp = async (values: Record<string, string>) => {
    try {
      await updateConfig({
        positiveFollowUp: values.positiveFollowUp || null,
        negativeFollowUp: values.negativeFollowUp || null,
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

  const handleUpdateRewards = async (values: Record<string, string>) => {
    try {
      await updateConfig({
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

  return (
    <div className="space-y-6">
      <SettingsFieldGroup
        title="Follow-up messages"
        description="Messages shown after positive or negative feedback"
        fields={[
          {
            name: "positiveFollowUp",
            label: "Positive follow-up",
            type: "textarea",
            placeholder: "Thank you for your feedback!",
            optional: true,
          },
          {
            name: "negativeFollowUp",
            label: "Negative follow-up",
            type: "textarea",
            placeholder: "We're sorry to hear that. We'll look into it.",
            optional: true,
          },
        ]}
        defaultValues={{
          positiveFollowUp: config.positiveFollowUp ?? "",
          negativeFollowUp: config.negativeFollowUp ?? "",
        }}
        onSubmit={handleUpdateFollowUp}
      />

      <SettingsFieldGroup
        title="Feedback rewards"
        description="Credit cashback to the customer's wallet when they submit feedback."
        fields={[
          {
            name: "feedbackRewardEnabled",
            label: "Enable reward",
            type: "checkbox",
            checkboxLabel: "Give cashback for feedback",
          },
          {
            name: "rewardAmount",
            label: "Reward amount (₹ cashback)",
            type: "number",
            placeholder: "0",
            optional: true,
            min: 0,
          },
        ]}
        defaultValues={{
          feedbackRewardEnabled: config.feedbackRewardEnabled
            ? "true"
            : "false",
          rewardAmount:
            config.rewardAmount != null ? String(config.rewardAmount) : "",
        }}
        onSubmit={handleUpdateRewards}
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

      <SettingsFieldGroup
        title="Timing & collection"
        description="When and how to collect feedback"
        fields={[
          {
            name: "timing",
            label: "When to ask",
            type: "select",
            options: TIMING_OPTIONS,
          },
          {
            name: "delaySeconds",
            label: "Delay (seconds)",
            type: "number",
            placeholder: "0",
            optional: true,
            min: 0,
            helpText: "Used when timing is After delay",
          },
          {
            name: "collectionChannel",
            label: "Collection channel",
            type: "select",
            options: COLLECTION_CHANNEL_OPTIONS,
          },
          {
            name: "sendViaSmsIfWpFailed",
            label: "Send via SMS if WhatsApp fails",
            type: "checkbox",
            checkboxLabel: "Fallback to SMS",
          },
        ]}
        defaultValues={{
          timing: config.timing,
          delaySeconds:
            config.delaySeconds != null ? String(config.delaySeconds) : "",
          collectionChannel: config.collectionChannel,
          sendViaSmsIfWpFailed: config.sendViaSmsIfWpFailed ? "true" : "false",
        }}
        onSubmit={handleUpdateTimingAndCollection}
      />

      <DiscoveryAndReviewsCard
        config={config}
        onSubmit={handleUpdateDiscoveryAndReviews}
      />

      <SelectionOptionsSection options={config.selectionOptions ?? []} />

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
    </div>
  );
}
