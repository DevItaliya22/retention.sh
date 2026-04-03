import { cn } from "@reelo/ui/lib/utils";
import React, { type ReactNode } from "react";

interface InteractiveFieldProps {
  fieldName: string;
  onClick?: (fieldName: string) => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isFocused?: boolean;
}

export function InteractiveField({
  fieldName,
  onClick,
  children,
  className,
  style,
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
        <div className="border-primary bg-primary/5 pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-[2.5px] border-dashed opacity-0 transition-opacity group-hover/cf:opacity-100" />
      )}
    </div>
  );
}
