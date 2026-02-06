import * as React from "react";
import TextareaAutosizeLib from "react-textarea-autosize";
import { cn } from "../lib/utils";

interface TextareaAutosizeProps extends Omit<
  React.ComponentProps<typeof TextareaAutosizeLib>,
  "className"
> {
  className?: string;
  variant?: "default" | "underline";
  maxRows?: number;
  minRows?: number;
  onHeightChange?: (height: number, meta: { rowHeight: number }) => void;
  cacheMeasurements?: boolean;
}

const TextareaAutosize = React.forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps
>(
  (
    {
      className,
      variant = "default",
      maxRows,
      minRows = 1,
      onHeightChange,
      cacheMeasurements = false,
      ...props
    },
    ref,
  ) => {
    return (
      <TextareaAutosizeLib
        ref={ref}
        data-slot="textarea-autosize"
        className={cn(
          variant === "underline"
            ? "text-foreground placeholder:text-muted-foreground/60 border-input focus-visible:border-primary flex w-full min-w-0 resize-none border-0 border-b bg-transparent dark:bg-transparent px-0 py-3 text-base leading-relaxed outline-none transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
            : cn(
                "border-input placeholder:text-muted-foreground dark:bg-input/30 flex w-full resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              ),
          className,
        )}
        maxRows={maxRows}
        minRows={minRows}
        onHeightChange={onHeightChange}
        cacheMeasurements={cacheMeasurements}
        {...props}
      />
    );
  },
);

TextareaAutosize.displayName = "TextareaAutosize";

export { TextareaAutosize };
export type { TextareaAutosizeProps };
