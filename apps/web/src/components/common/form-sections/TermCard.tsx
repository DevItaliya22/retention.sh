"use client";

import { Button, Checkbox, Input } from "@reelo/ui/components";
import { X } from "lucide-react";

interface TermCardProps {
  label?: string;
  value?: string;
  editable?: boolean;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  onValueChange?: (next: string) => void;
  onRemove?: () => void;
  placeholder?: string;
}

export function TermCard({
  label,
  value,
  editable = false,
  checked,
  onCheckedChange,
  onValueChange,
  onRemove,
  placeholder,
}: TermCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="border-input bg-card hover:bg-accent/50 flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors"
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCheckedChange(!checked);
        }
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(Boolean(v))}
          className="mt-0.5 shrink-0"
        />
      </div>
      <div
        className="flex min-w-0 flex-1 items-center gap-2"
        onClick={(e) => editable && e.stopPropagation()}
      >
        {editable ? (
          <Input
            variant="underline"
            className="min-w-0 flex-1"
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onValueChange?.(e.target.value)}
          />
        ) : (
          <span className="truncate text-xs leading-snug font-medium">
            {label}
          </span>
        )}
      </div>
      {editable && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
