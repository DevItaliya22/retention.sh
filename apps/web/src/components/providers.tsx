"use client";

import { SessionProvider } from "@/hooks/misc/useSessionContext";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { NuqsAdapter } from "@reelo/ui/components/nuqs-adapter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import * as React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // const theme = localStorage.getItem("theme") || "light";
  const theme = "light";
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <SessionProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            // forcedTheme="light"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
            <Toaster theme={theme as "light" | "dark" | "system"} />
          </NextThemesProvider>
        </SessionProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
