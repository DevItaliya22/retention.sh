"use client";

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
import {
  Button,
  Input,
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@reelo/ui/components";
import { GripVertical, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

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
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Selection options</h3>
        <p className="text-muted-foreground text-xs">
          Options customers can select when giving feedback (e.g. what they
          liked or didn&apos;t like). Order is used on the feedback form.
        </p>
      </div>
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
      await updateConfig({
        isHowDidYouHearEnabled: values.isHowDidYouHearEnabled === "true",
        askForOnlineReviews: values.askForOnlineReviews === "true",
        onlineReviewLink: values.onlineReviewLink || null,
        onlineReviewPlatform:
          (values.onlineReviewPlatform as
            | "GOOGLE"
            | "INSTAGRAM"
            | "FACEBOOK"
            | "ZOMATO"
            | "OTHER") || null,
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

      <SettingsFieldGroup
        title="Discovery & reviews"
        description="Ask how customers found you and prompt them to leave a review after feedback"
        fields={[
          {
            name: "isHowDidYouHearEnabled",
            label: "How did you hear about us?",
            type: "checkbox",
            checkboxLabel: "Ask customers how they discovered your business",
          },
          {
            name: "askForOnlineReviews",
            label: "Ask for online reviews",
            type: "checkbox",
            checkboxLabel: "Show review prompt after feedback",
          },
          {
            name: "onlineReviewPlatform",
            label: "Platform",
            type: "select",
            options: ONLINE_REVIEW_PLATFORM_OPTIONS,
            optional: true,
          },
          {
            name: "onlineReviewLink",
            label: "Review link",
            placeholder: "https://...",
            optional: true,
          },
        ]}
        defaultValues={{
          isHowDidYouHearEnabled: config.isHowDidYouHearEnabled
            ? "true"
            : "false",
          askForOnlineReviews: config.askForOnlineReviews ? "true" : "false",
          onlineReviewPlatform: config.onlineReviewPlatform ?? "",
          onlineReviewLink: config.onlineReviewLink ?? "",
        }}
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
