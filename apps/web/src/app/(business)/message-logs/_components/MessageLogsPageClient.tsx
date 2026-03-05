"use client";

import { DashboardPageShell } from "@/components/layouts";
import { MessageLogsTable } from "@/components/message-logs/MessageLogsTable";
import { MessageLogsTableSkeleton } from "@/components/message-logs/MessageLogsTableSkeleton";
import { Suspense } from "react";

export function MessageLogsPageClient() {
  return (
    <DashboardPageShell
      title="Message logs"
      subtitle="Messages queued for sending via email, WhatsApp, or SMS. Use the actions to manually send."
    >
      <Suspense fallback={<MessageLogsTableSkeleton />}>
        <MessageLogsTable />
      </Suspense>
    </DashboardPageShell>
  );
}
