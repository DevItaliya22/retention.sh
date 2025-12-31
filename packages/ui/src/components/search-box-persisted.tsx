"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { SearchBox } from "./search-box";

type SearchBoxPersistedProps = {
  urlParam?: string;
  debounceTimeoutMs?: number;
  placeholder?: string;
  loading?: boolean;
  showClearButton?: boolean;
  inputClassName?: string;
  disabled?: boolean;
  onChangeDebounced?: (value: string) => void;
  // Custom URL management functions (for Next.js or other routers)
  getSearchParam?: (param: string) => string | null;
  setSearchParam?: (param: string, value: string | null) => void;
};

export function SearchBoxPersisted({
  urlParam = "search",
  debounceTimeoutMs = 500,
  placeholder = "Search...",
  loading = false,
  showClearButton = true,
  inputClassName,
  disabled = false,
  onChangeDebounced,
  getSearchParam,
  setSearchParam,
  ...props
}: SearchBoxPersistedProps) {
  // Default URL management using browser APIs
  const defaultGetSearchParam = (param: string) => {
    if (typeof window === "undefined") return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  const defaultSetSearchParam = (param: string, value: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (value === null || value === "") {
      url.searchParams.delete(param);
      url.searchParams.delete("page"); // Reset pagination when search changes
    } else {
      url.searchParams.set(param, value);
      url.searchParams.delete("page"); // Reset pagination when search changes
    }
    window.history.replaceState({}, "", url.toString());
  };

  const getParam = getSearchParam || defaultGetSearchParam;
  const setParam = setSearchParam || defaultSetSearchParam;

  const [value, setValue] = useState(() => getParam(urlParam) ?? "");
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Set URL param when debounced value changes
  useEffect(() => {
    const currentParam = getParam(urlParam) ?? "";
    if (currentParam !== debouncedValue) {
      setParam(urlParam, debouncedValue);
    }
  }, [debouncedValue, urlParam, getParam, setParam]);

  // Set value when URL param changes (only if user isn't actively typing)
  const handleUrlParamChange = useEffectEvent(
    (
      search: string | null,
      currentValue: string,
      currentDebouncedValue: string,
    ) => {
      // Only update if the value and debouncedValue are synced (the user isn't actively typing)
      if (
        (search ?? "") !== currentValue &&
        currentValue === currentDebouncedValue
      ) {
        setValue(search ?? "");
      }
    },
  );

  useEffect(() => {
    const search = getParam(urlParam);
    handleUrlParamChange(search, value, debouncedValue);
  }, [getParam, urlParam, value, debouncedValue]);

  // Handle debounced changes
  const handleChangeDebounced = (newValue: string) => {
    setDebouncedValue(newValue);
    onChangeDebounced?.(newValue);
  };

  return (
    <SearchBox
      value={value}
      onChange={setValue}
      onChangeDebounced={handleChangeDebounced}
      debounceTimeoutMs={debounceTimeoutMs}
      placeholder={placeholder}
      loading={loading}
      showClearButton={showClearButton}
      inputClassName={inputClassName}
      disabled={disabled}
      {...props}
    />
  );
}
