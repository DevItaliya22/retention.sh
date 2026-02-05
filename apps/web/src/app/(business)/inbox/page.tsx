import { auth } from "@/lib/auth/auth";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = generateRouteMetadata("/inbox");

export default async function InboxPage() {
  return (
    <div>
      <h1>Inbox</h1>
    </div>
  );
}
