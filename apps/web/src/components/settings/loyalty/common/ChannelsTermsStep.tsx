"use client";

import {
  ChannelSelector,
  TermsConditionsEditor,
} from "@/components/common/form-sections";

export function ChannelsTermsStep() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium">Notification channels</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Channels for point reminders, expiry alerts, etc.
        </p>
        <div className="mt-3">
          <ChannelSelector />
        </div>
      </div>
      <div>
        <TermsConditionsEditor />
      </div>
    </div>
  );
}
