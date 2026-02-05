import { LoyaltyLoginPageClient } from "./LoyaltyLoginPageClient";
import { Suspense } from "react";

function LoyaltyLoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="h-64 w-full max-w-sm animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export default function LoyaltyLoginPage() {
  return (
    <Suspense fallback={<LoyaltyLoginFallback />}>
      <LoyaltyLoginPageClient />
    </Suspense>
  );
}
