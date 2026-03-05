import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { MessageLogsPageClient } from "./_components/MessageLogsPageClient";

export const metadata: Metadata = generateRouteMetadata("/message-logs");

export default function MessageLogsPage() {
  return <MessageLogsPageClient />;
}
