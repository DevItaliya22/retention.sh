import { cn } from "@reelo/ui/lib/utils";
import React, { type ReactNode } from "react";

interface InteractiveFieldProps {
  fieldName: string;
  onClick?: (fieldName: string) => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Keeps the dashed outline visible after the user clicked this region. */
  isFocused?: boolean;
}

export function InteractiveField({
  fieldName,
  onClick,
  children,
  className,
  style,
  isFocused = false,
}: InteractiveFieldProps) {
  return (
    <div
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(fieldName);
        }
      }}
      style={style}
      className={cn(
        "group/cf relative block",
        onClick && "cursor-pointer rounded-sm",
        className,
      )}
    >
      {children}
      {onClick && (
        <div
          className={cn(
            "border-primary bg-primary/5 pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-[2.5px] border-dashed transition-opacity",
            isFocused ? "opacity-100" : "opacity-0 group-hover/cf:opacity-100",
          )}
        />
      )}
    </div>
  );
}
