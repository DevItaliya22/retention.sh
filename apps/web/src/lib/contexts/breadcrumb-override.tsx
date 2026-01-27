"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface BreadcrumbOverrideContextValue {
  segmentLabel: string | null;
  setSegmentLabel: (label: string | null) => void;
}

const BreadcrumbOverrideContext =
  createContext<BreadcrumbOverrideContextValue | null>(null);

export function BreadcrumbOverrideProvider({ children }: { children: ReactNode }) {
  const [segmentLabel, setSegmentLabel] = useState<string | null>(null);
  const setLabel = useCallback((label: string | null) => {
    setSegmentLabel(label);
  }, []);
  return (
    <BreadcrumbOverrideContext.Provider
      value={{ segmentLabel, setSegmentLabel: setLabel }}
    >
      {children}
    </BreadcrumbOverrideContext.Provider>
  );
}

export function useBreadcrumbOverride(): BreadcrumbOverrideContextValue | null {
  return useContext(BreadcrumbOverrideContext);
}
