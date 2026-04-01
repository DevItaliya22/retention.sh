import { Suspense } from "react";
import { LoyaltyLoginPageClient } from "./_components/LoyaltyLoginPageClient";

function LoyaltyLoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="h-64 w-full max-w-sm animate-pulse rounded-lg bg-white" />
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
