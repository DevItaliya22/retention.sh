"use client";

import { fetcher } from "@/lib/fetcher";
import type {
  PartnerRequestStatus,
  SendPartnerRequestInput,
} from "@/lib/schemas/partnership";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PartnerBusiness {
  id: string;
  name: string;
  slug: string;
}

export interface PartnerRequestItem {
  id: string;
  senderBusinessId: string;
  receiverBusinessId: string;
  status: PartnerRequestStatus;
  partnershipId: string | null;
  senderBusiness?: PartnerBusiness;
  receiverBusiness?: PartnerBusiness;
  createdAt: string;
  updatedAt: string;
}

interface PartnerRequestsResponse {
  items: PartnerRequestItem[];
}

export function usePartnerRequests(direction: "incoming" | "outgoing") {
  return useQuery<PartnerRequestsResponse, Error>({
    queryKey: ["partnerRequests", direction],
    queryFn: () =>
      fetcher<PartnerRequestsResponse>(
        `/api/partnership/requests?direction=${direction}`,
      ),
  });
}

export function useSendPartnerRequest() {
  const queryClient = useQueryClient();

  return useMutation<PartnerRequestItem, Error, SendPartnerRequestInput>({
    mutationFn: (data) =>
      fetcher<PartnerRequestItem>("/api/partnership/requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerRequests"] });
    },
  });
}

export function useRespondPartnerRequest() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    {
      id: string;
      action: "accept" | "reject" | "permanently_reject";
    }
  >({
    mutationFn: ({ id, action }) =>
      fetcher(`/api/partnership/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerRequests"] });
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
    },
  });
}

export function useUnPermanentReject() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: (requestId) =>
      fetcher(`/api/partnership/requests/${requestId}`, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerRequests"] });
    },
  });
}
