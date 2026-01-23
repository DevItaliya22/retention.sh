import { LoginPageClient } from "./_components/LoginPageClient";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";


export const metadata: Metadata = generateRouteMetadata("/login");

export default function LoginPage() {
  return <LoginPageClient />;
}
