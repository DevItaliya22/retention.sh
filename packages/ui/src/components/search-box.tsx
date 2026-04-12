"use client";

import { cn } from "@reelo/ui/lib/utils";
import { Loader2, Search, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useDebouncedCallback } from "use-debounce";
import { Kbd } from "./kbd";

type SearchBoxProps = {
  value: string;
  loading?: boolean;
  showClearButton?: boolean;
  showKbdShortcut?: boolean;
  onChange: (value: string) => void;
  onChangeDebounced?: (value: string) => void;
  debounceTimeoutMs?: number;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
};

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  (
    {
      value,
      loading,
      showClearButton = true,
      showKbdShortcut = true,
      onChange,
      onChangeDebounced,
      debounceTimeoutMs = 500,
      inputClassName,
      placeholder = "Search...",
      disabled = false,
    },
    forwardedRef,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(forwardedRef, () => inputRef.current!);

    const debounced = useDebouncedCallback(
      (value: string) => onChangeDebounced?.(value),
      debounceTimeoutMs,
    );

    const onKeyDown = useCallback((e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // only focus on filter input when:
      // - user is not typing in an input or textarea
      // - there is no existing modal backdrop (i.e. no other modal is open)
      if (
        (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) &&
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    }, []);

    useEffect(() => {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [onKeyDown]);

    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {loading && value.length > 0 ? (
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          ) : (
            <Search className="text-muted-foreground h-4 w-4" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-inset",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            showKbdShortcut && !showClearButton && value.length === 0
              ? "pr-20 pl-10"
              : "pr-10 pl-10",
            inputClassName,
          )}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            debounced(e.target.value);
          }}
          disabled={disabled}
          autoCapitalize="none"
        />
        {showKbdShortcut && value.length === 0 && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
          </div>
        )}
        {showClearButton && value.length > 0 && (
          <button
            onClick={() => {
              onChange("");
              onChangeDebounced?.("");
            }}
            className="pointer-events-auto absolute inset-y-0 right-0 flex items-center pr-3"
            type="button"
          >
            <X className="text-muted-foreground hover:text-foreground h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);

SearchBox.displayName = "SearchBox";
