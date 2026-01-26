"use client";

import { SessionProvider } from "@/hooks/misc/useSessionContext";
import { NuqsAdapter } from "@reelo/ui/components/nuqs-adapter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";
import { Toaster } from "sonner";

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
            <Toaster
              theme={theme as "light" | "dark" | "system"}
              visibleToasts={5}
              position="bottom-right"
              gap={12}
              expand={true}
              // richColors
              toastOptions={{
                duration: 4000,
              }}
            />
          </NextThemesProvider>
        </SessionProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
