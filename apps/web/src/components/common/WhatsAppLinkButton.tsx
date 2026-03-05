"use client";

import { buttonVariants } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

interface WhatsAppLinkButtonProps {
  phoneNumber: string;
  message: string;
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

export function WhatsAppLinkButton({
  phoneNumber,
  message,
  children,
  className,
  title = "Open in WhatsApp",
  variant = "ghost",
  size = "xs",
}: WhatsAppLinkButtonProps) {
  const e164 = phoneNumber.replace(/^\+/, "");
  const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(e164)}&text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title}
      title={title}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children ?? <MessageCircle className="h-4 w-4" />}
    </a>
  );
}
