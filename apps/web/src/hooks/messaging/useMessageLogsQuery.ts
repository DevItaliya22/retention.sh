"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface MessageLogItem {
  id: string;
  businessId: string;
  channel: "EMAIL" | "WHATSAPP" | "SMS";
  recipient: string;
  subject: string | null;
  body: string;
  source: string;
  sourceId: string | null;
  status: string;
  createdAt: string;
}

export interface MessageLogsResponse {
  items: MessageLogItem[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useMessageLogsQuery() {
  const searchParams = useSearchParams();
  const config = getDataTableConfig("messageLogs");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<MessageLogsResponse, Error>({
    queryKey: ["messageLogs", searchParams.toString()],
    queryFn: () => {
      const url = queryString
        ? `/api/message-logs?${queryString}`
        : "/api/message-logs";
      return fetcher<MessageLogsResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
