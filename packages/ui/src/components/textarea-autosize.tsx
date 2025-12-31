import * as React from "react";
import TextareaAutosizeLib from "react-textarea-autosize";
import { cn } from "../lib/utils";

interface TextareaAutosizeProps extends Omit<
  React.ComponentProps<typeof TextareaAutosizeLib>,
  "className"
> {
  className?: string;
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
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex w-full resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
