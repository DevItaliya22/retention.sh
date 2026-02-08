"use client";

import { ExpiryReminderFields } from "@/components/common/form-sections";

export function ExpiryReminderStep() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Configure when to send point reminders and when earned points expire.
      </p>
      <ExpiryReminderFields />
    </div>
  );
}
