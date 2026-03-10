"use client";

import { RfmSection } from "@/components/dashboard/sections";
import { Suspense } from "react";

export default function CustomersRfmPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <RfmSection />
    </Suspense>
  );
}
