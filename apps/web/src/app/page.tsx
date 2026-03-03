import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

import { redirect } from "next/navigation";

export const metadata: Metadata = generateRouteMetadata("/");

export default function HomePage() {
  return redirect("/dashboard");
}
