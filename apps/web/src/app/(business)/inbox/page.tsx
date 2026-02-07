import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/inbox");

export default async function InboxPage() {
  return (
    <div>
      <h1>Inbox</h1>
    </div>
  );
}
