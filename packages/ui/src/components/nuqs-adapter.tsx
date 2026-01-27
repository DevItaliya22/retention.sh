"use client";

import { NuqsAdapter as NextAppNuqsAdapter } from "nuqs/adapters/next/app";
import * as React from "react";

export function NuqsAdapter({ children }: { children: React.ReactNode }) {
  return <NextAppNuqsAdapter>{children}</NextAppNuqsAdapter>;
}
