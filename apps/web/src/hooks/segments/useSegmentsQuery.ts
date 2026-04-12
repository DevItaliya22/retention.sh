"use client";

import { fetcher } from "@/lib/fetcher";
import { SEGMENTS_LIST_DEFAULT_LIMIT } from "@/lib/schemas/segment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface SegmentItem {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description: string | null;
  proTip: string | null;
  /** Null/absent = use default colour for slug */
  tagColour?: string | null;
  recencyOperator: string | null;
  recencyValue: number | null;
  recencyValue2: number | null;
  recencyUnit: string | null;
  frequencyOperator: string | null;
  frequencyValue: number | null;
  frequencyValue2: number | null;
  monetaryUnit: string | null;
  monetaryOperator: string | null;
  monetaryValue: number | null;
  monetaryValue2: number | null;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentsListResponse {
  items: SegmentItem[];
  /** Total segments for this business (for caps); items may be truncated by limit */
  total: number;
}

export function useSegmentsQuery() {
  return useQuery<SegmentsListResponse, Error>({
    queryKey: ["segments"],
    queryFn: () =>
      fetcher<SegmentsListResponse>(
        `/api/segments?limit=${SEGMENTS_LIST_DEFAULT_LIMIT}`,
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useSegmentMutation() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["segments"] });
    queryClient.invalidateQueries({ queryKey: ["analytics", "segments"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create segment");
      }
      return res.json();
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/segments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update segment");
      }
      return res.json();
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/segments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete segment");
      }
    },
    onSuccess: invalidate,
  });

  return {
    createSegment: createMutation.mutateAsync,
    updateSegment: updateMutation.mutateAsync,
    deleteSegment: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
