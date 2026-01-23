import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/");

export default function HomePage() {
  return redirect("inbox")
}