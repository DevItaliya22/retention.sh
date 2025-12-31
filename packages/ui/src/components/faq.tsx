"use client";

import { cn } from "@reelo/ui/lib/utils";
import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

export interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  value?: string;
}

export interface FAQProps {
  items: FAQItem[];
  title?: string;
  badge?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export function FAQ({
  items,
  title,
  badge,
  className,
  itemClassName,
  triggerClassName,
  contentClassName,
  type = "single",
  collapsible = true,
  ...props
}: FAQProps) {
  return (
    <div
      className={cn(
        "grid gap-4 border-t pt-4 md:grid-cols-3 md:gap-10",
        className,
      )}
    >
      {title && (
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-medium">{title}</h3>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
      <Accordion
        {...({
          type,
          collapsible,
          className: cn("md:col-span-2", !title && "md:col-span-3"),
          "data-slot": "accordion",
          defaultValue: props.defaultValue,
          value: props.value,
          onValueChange: props.onValueChange,
        } as React.ComponentProps<typeof Accordion>)}
      >
        {items.map((item, index) => (
          <AccordionItem
            key={item.value || `item-${index}`}
            value={item.value || `item-${index}`}
            className={itemClassName}
          >
            <AccordionTrigger className={triggerClassName}>
              {item.question}
            </AccordionTrigger>
            <AccordionContent className={contentClassName}>
              {typeof item.answer === "string" ? (
                <p className="text-foreground-light">{item.answer}</p>
              ) : (
                item.answer
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
