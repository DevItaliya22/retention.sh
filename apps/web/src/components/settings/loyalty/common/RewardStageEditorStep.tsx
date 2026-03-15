"use client";

import { RewardStagesTabbedSection } from "@/components/settings/loyalty/common";
import { createDefaultRewardStage } from "@/lib/loyalty/form-defaults";

const DEFAULT_STAGE = createDefaultRewardStage();

export function RewardStageEditorStep() {
  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground max-w-md text-sm">
        Add reward stages. Customers redeem points for these rewards.
      </p>
      <RewardStagesTabbedSection
        title="Reward stages"
        description="Customers redeem points for these rewards."
        addButtonLabel="Add reward stage"
        gooeyId="loyalty-onboarding-reward-stages-gooey"
        defaultStage={DEFAULT_STAGE}
      />
    </div>
  );
}
