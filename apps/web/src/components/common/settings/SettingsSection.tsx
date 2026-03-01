"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import type { ReactNode } from "react";

/**
 * Wrapper for settings sections that need the same card style as SettingsField
 * and SettingsFieldGroup (e.g. tables, custom forms). Use SettingsField for
 * single fields and SettingsFieldGroup for multi-field forms.
 */
export function SettingsSection({
  title,
  description,
  children,
  contentClassName,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <CardContent
          className={cn("min-h-0 overflow-hidden px-4 py-4", contentClassName)}
        >
          {children}
        </CardContent>
      </Card>
    </Card>
  );
}
