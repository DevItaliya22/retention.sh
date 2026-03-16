import { cn } from "@reelo/ui/lib/utils";
import React, { type ReactNode } from "react";

interface InteractiveFieldProps {
  fieldName: string;
  onClick?: (fieldName: string) => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
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
        "group relative block",
        onClick && "cursor-pointer rounded-sm hover:-outline-offset-2",
        className,
      )}
    >
      {children}
      {onClick && (
        <div className="border-primary bg-primary/5 pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-[2.5px] border-dashed opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );
}
