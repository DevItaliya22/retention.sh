import { auth } from "@/lib/auth/auth";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import { headers } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/inbox");

export default async function InboxPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log(session?.user,"From inbox page");

  return (
    <div>
      <h1>Inbox</h1>
    </div>
  );
}