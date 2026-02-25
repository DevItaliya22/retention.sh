"use client";

import { fetcher } from "@/lib/fetcher";
import type { UpdatePartnershipSettingsInput } from "@/lib/schemas/partnership";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PartnershipSettings {
  receivePartnershipOffers: boolean;
  maxPartnerAllowed: number;
}

export function usePartnershipSettings() {
  return useQuery<PartnershipSettings, Error>({
    queryKey: ["partnershipSettings"],
    queryFn: () => fetcher<PartnershipSettings>("/api/partnership/settings"),
  });
}

export function useUpdatePartnershipSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    PartnershipSettings,
    Error,
    UpdatePartnershipSettingsInput
  >({
    mutationFn: (data) =>
      fetcher<PartnershipSettings>("/api/partnership/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["partnershipSettings"], updated);
    },
  });
}
