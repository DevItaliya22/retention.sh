"use client";

import { SessionProvider } from "@/hooks/misc/useSessionContext";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NuqsAdapter } from "@reelo/ui/components/nuqs-adapter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
          </NextThemesProvider>
        </SessionProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
