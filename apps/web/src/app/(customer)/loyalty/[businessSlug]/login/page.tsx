import { Suspense } from "react";
import { LoyaltyLoginPageClient } from "./_components/LoyaltyLoginPageClient";

function LoyaltyLoginFallback() {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <div className="bg-muted h-64 w-full max-w-sm animate-pulse rounded-lg" />
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
