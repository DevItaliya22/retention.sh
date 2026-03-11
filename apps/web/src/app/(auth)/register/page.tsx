import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { RegisterPageClient } from "./_components/RegisterPageClient";

export const metadata: Metadata = generateRouteMetadata("/register");

export default function RegisterPage() {
  return <RegisterPageClient />;
}
