"use client";

export interface SidebarData {
  isLoading: boolean;
}

export function useSidebarData(): SidebarData {
  return {
    isLoading: false,
  };
}
