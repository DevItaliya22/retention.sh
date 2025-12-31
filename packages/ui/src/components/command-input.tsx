import { cn } from "@reelo/ui/lib/utils";
import { Search } from "lucide-react";
import * as React from "react";

interface CommandInputProps extends React.ComponentProps<"input"> {
  placeholder?: string;
  className?: string;
}

export const CommandInput = React.forwardRef<
  HTMLInputElement,
  CommandInputProps
>(({ className, placeholder = "Search...", ...props }, ref) => {
  return (
    <div className="flex items-center px-2">
      <Search className="h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        className={cn(
          "placeholder:text-muted-foreground flex h-9 w-full rounded-md border-none bg-transparent px-3 py-3 text-xs outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        aria-autocomplete="list"
        role="combobox"
        {...props}
      />
    </div>
  );
});

CommandInput.displayName = "CommandInput";
