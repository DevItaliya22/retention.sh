"use client";

import * as React from "react";
import { NuqsAdapter as NextAppNuqsAdapter } from "nuqs/adapters/next/app";

export function NuqsAdapter({ children }: { children: React.ReactNode }) {
  return <NextAppNuqsAdapter>{children}</NextAppNuqsAdapter>;
}

