"use client";

import { buttonVariants } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { Mail } from "lucide-react";
import type { ReactNode } from "react";

interface EmailLinkButtonProps {
  email: string;
  subject?: string;
  body?: string;
  children?: ReactNode;
  className?: string;
  title?: string;
  variant?:
    | "default"
    | "ghost"
    | "link"
    | "outline"
    | "secondary"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon" | "xs";
}

export function EmailLinkButton({
  email,
  subject,
  body,
  children,
  className,
  title = "Open in email client",
  variant = "ghost",
  size = "xs",
}: EmailLinkButtonProps) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  const url = `mailto:${encodeURIComponent(email)}${query ? `?${query}` : ""}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title}
      title={title}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children ?? <Mail className="h-4 w-4" />}
    </a>
  );
}
