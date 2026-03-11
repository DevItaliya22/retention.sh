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
  disabled?: boolean;
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
  disabled = false,
}: TermCardProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={[
        "border-input bg-card flex w-full items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-70"
          : "hover:bg-accent/50 cursor-pointer",
      ].join(" ")}
      onClick={() => {
        if (disabled) return;
        onCheckedChange(!checked);
      }}
      onKeyDown={(e) => {
        if (disabled) return;
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
          disabled={disabled}
        />
      </div>
      <div
        className="flex min-w-0 flex-1 items-center gap-2"
        onClick={(e) => {
          if (disabled) return;
          if (editable) e.stopPropagation();
        }}
      >
        {editable ? (
          <Input
            variant="underline"
            className="min-w-0 flex-1"
            value={value ?? ""}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => onValueChange?.(e.target.value)}
          />
        ) : (
          <span className="max-h-[2.6em] overflow-hidden text-xs leading-snug font-medium break-words whitespace-normal">
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
