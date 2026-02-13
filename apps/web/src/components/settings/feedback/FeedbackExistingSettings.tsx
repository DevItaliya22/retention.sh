"use client";

import { SettingsFieldGroup } from "@/components/common/settings/SettingsFieldGroup";
import type { FeedbackConfigDto } from "@/hooks/feedback/useFeedbackConfig";
import { useUpdateFeedbackConfig } from "@/hooks/feedback/useFeedbackConfig";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from "@reelo/ui/components";
import { useTransition } from "react";
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

interface FeedbackExistingSettingsProps {
  config: FeedbackConfigDto;
}

export function FeedbackExistingSettings({
  config,
}: FeedbackExistingSettingsProps) {
  const { mutateAsync: updateConfig } = useUpdateFeedbackConfig();
  const [howDidYouHearPending, startHowDidYouHearTransition] = useTransition();

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

  const handleUpdateOnlineReviews = async (values: Record<string, string>) => {
    try {
      await updateConfig({
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

  const handleHowDidYouHearChange = async (enabled: boolean) => {
    startHowDidYouHearTransition(async () => {
      try {
        await updateConfig({ isHowDidYouHearEnabled: enabled });
        toast.success("Settings updated successfully");
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update",
        );
      }
    });
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

      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            How did you hear about us?
          </CardTitle>
          <CardDescription className="text-xs">
            Ask customers how they discovered your business
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row items-center justify-between px-6 py-4">
          <span className="text-sm">
            Enable &quot;How did you hear about us?&quot;
          </span>
          <Switch
            checked={config.isHowDidYouHearEnabled}
            onCheckedChange={handleHowDidYouHearChange}
            disabled={howDidYouHearPending}
          />
        </CardContent>
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

      <SettingsFieldGroup
        title="Online reviews"
        description="Prompt customers to leave a review"
        fields={[
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
          askForOnlineReviews: config.askForOnlineReviews ? "true" : "false",
          onlineReviewPlatform: config.onlineReviewPlatform ?? "",
          onlineReviewLink: config.onlineReviewLink ?? "",
        }}
        onSubmit={handleUpdateOnlineReviews}
      />

      <SettingsFieldGroup
        title="Feedback rewards"
        description="Reward customers for submitting feedback (e.g. loyalty points)"
        fields={[
          {
            name: "feedbackRewardEnabled",
            label: "Enable reward",
            type: "checkbox",
            checkboxLabel: "Give reward for feedback",
          },
          {
            name: "rewardAmount",
            label: "Reward amount (points)",
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
    </div>
  );
}
