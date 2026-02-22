"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { FeedbackExistingSettings } from "@/components/settings/feedback/FeedbackExistingSettings";
import { FeedbackSettingsSkeleton } from "@/components/settings/feedback/FeedbackSettingsSkeleton";
import type { FeedbackConfigDto } from "@/hooks/feedback/useFeedbackConfig";
import { useFeedbackConfigQuery } from "@/hooks/feedback/useFeedbackConfig";
import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms/feedback";

function getDefaultConfig(): FeedbackConfigDto {
  const defaultFollowUp = FEEDBACK_FORM_DEFAULTS.followUpMessage;
  return {
    id: "",
    businessId: null,
    positiveFollowUp: defaultFollowUp,
    negativeFollowUp: defaultFollowUp,
    timing: "IMMEDIATELY",
    delaySeconds: null,
    collectionChannel: "WHATSAPP",
    sendViaSmsIfWpFailed: false,
    feedbackRewardEnabled: false,
    rewardAmount: null,
    isHowDidYouHearEnabled: true,
    negAlertChannelsWp: false,
    negAlertChannelsSms: false,
    negAlertChannelsEmail: false,
    negFeedbackAlertNumber: null,
    negFeedbackAlertSmsNumber: null,
    negFeedbackAlertEmailAddress: null,
    askForOnlineReviews: false,
    onlineReviewLink: null,
    onlineReviewPlatform: null,
    questions: [],
    categories: [],
    howDidYouHearOptions: [],
    branding: null,
  };
}

export function FeedbackSettingsPageClient() {
  const { data, isLoading } = useFeedbackConfigQuery();
  const config = data?.config ?? getDefaultConfig();

  if (isLoading && !data) {
    return (
      <PageLayout
        title="Feedback"
        subtitle="Configure when and how to collect customer feedback"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <FeedbackSettingsSkeleton />
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Feedback"
      subtitle="Configure when and how to collect customer feedback. A feedback link is created for every bill."
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <FeedbackExistingSettings config={config} />
      </ScaffoldContainer>
    </PageLayout>
  );
}
