"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
  type DataTableConfigId,
} from "@/lib/utils/data-table-params";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

/**
 * Generic hook for data-table queries that follow the standard pattern of
 * reading page/sort/filter params from the URL and fetching a paginated API
 * endpoint.  Each entity-specific hook (useCustomersQuery, useSkusQuery, …)
 * delegates here to avoid duplicating identical logic.
 */
export function useDataTableQuery<TResponse>(
  tableId: DataTableConfigId,
  queryKey: string,
  endpoint: string,
) {
  const searchParams = useSearchParams();
  const config = getDataTableConfig(tableId);
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<TResponse, Error>({
    queryKey: [queryKey, searchParams.toString()],
    queryFn: () => {
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      return fetcher<TResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
