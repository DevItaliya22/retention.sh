"use client";

import { MobileLayout } from "./MobileLayout";

interface StateViewProps {
  title?: string;
  message: string;
  destructive?: boolean;
}

export function StateView({
  title = "Loyalty",
  message,
  destructive = false,
}: StateViewProps) {
  return (
    <MobileLayout>
      <header className="border-b px-4 py-3">
        <h1 className="text-base font-semibold">{title}</h1>
      </header>
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <p
          className={
            destructive
              ? "text-destructive text-sm font-medium"
              : "text-muted-foreground text-sm"
          }
        >
          {message}
        </p>
      </div>
    </MobileLayout>
  );
}
