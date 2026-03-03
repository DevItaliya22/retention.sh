import { auth } from "@/lib/auth/auth";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = generateRouteMetadata("/");

export default async function BusinessPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Cast user to any to access role property if types are missing
  const user = session.user as any;

  if (user?.role === "ADMIN") {
    redirect("/dashboard");
  } else {
    // If they are not ADMIN, they likely haven't completed onboarding
    redirect("/welcome");
  }
}
