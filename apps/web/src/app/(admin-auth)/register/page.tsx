import { RegisterPageClient } from "./_components/RegisterPageClient";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/register");

export default function RegisterPage() {
  return <RegisterPageClient />;
}
