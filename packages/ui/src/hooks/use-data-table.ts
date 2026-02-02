"use client";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  type SingleParser,
  useQueryState,
  type UseQueryStateOptions,
  useQueryStates,
} from "nuqs";
import * as React from "react";
import { getSortingStateParser } from "../lib/parsers";
import {
  ExtendedColumnSort,
  queryKeysFromPrefix,
  QueryKeys,
} from "../types/data-table";
import { useDebouncedCallback } from "./use-debounced-callback";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort";
const FILTERS_KEY = "filters";
const JOIN_OPERATOR_KEY = "joinOperator";
const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

interface UseDataTableProps<TData>
  extends
    Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  /** When set, URL keys become prefix+Key (e.g. prefix "skus" → skusPage, skusPerPage). Use when 2+ tables share the same route. */
  prefix?: string;
  queryKeys?: Partial<QueryKeys>;
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  disableUrlSync?: boolean;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    prefix,
    queryKeys,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
    manualPagination = true,
    manualSorting = true,
    manualFiltering = true,
    disableUrlSync = false,
    ...tableProps
  } = props;
  const resolvedKeys: QueryKeys = prefix
    ? queryKeysFromPrefix(prefix)
    : {
        page: queryKeys?.page ?? PAGE_KEY,
        perPage: queryKeys?.perPage ?? PER_PAGE_KEY,
        sort: queryKeys?.sort ?? SORT_KEY,
        filters: queryKeys?.filters ?? FILTERS_KEY,
        joinOperator: queryKeys?.joinOperator ?? JOIN_OPERATOR_KEY,
      };
  const pageKey = resolvedKeys.page;
  const perPageKey = resolvedKeys.perPage;
  const sortKey = resolvedKeys.sort;
  const filtersKey = resolvedKeys.filters;
  const joinOperatorKey = resolvedKeys.joinOperator;

  const queryStateOptions = React.useMemo<
    Omit<UseQueryStateOptions<string>, "parse">
  >(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    }),
    [
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    ],
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  // Use local state if URL sync is disabled
  const [localPage, setLocalPage] = React.useState(
    initialState?.pagination?.pageIndex
      ? initialState.pagination.pageIndex + 1
      : 1,
  );
  const [localPerPage, setLocalPerPage] = React.useState(
    initialState?.pagination?.pageSize ?? 10,
  );

  const [urlPage, setUrlPage] = useQueryState(
    pageKey,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1),
  );
  const [urlPerPage, setUrlPerPage] = useQueryState(
    perPageKey,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 10),
  );

  const page = disableUrlSync ? localPage : urlPage;
  const setPage = disableUrlSync ? setLocalPage : setUrlPage;
  const perPage = disableUrlSync ? localPerPage : urlPerPage;
  const setPerPage = disableUrlSync ? setLocalPerPage : setUrlPerPage;

  const pagination: PaginationState = React.useMemo(() => {
    return {
      pageIndex: page - 1, // zero-based index -> one-based index
      pageSize: perPage,
    };
  }, [page, perPage]);

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === "function") {
        const newPagination = updaterOrValue(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      } else {
        void setPage(updaterOrValue.pageIndex + 1);
        void setPerPage(updaterOrValue.pageSize);
      }
    },
    [pagination, setPage, setPerPage],
  );

  const columnIds = React.useMemo(() => {
    return new Set(
      columns.map((column) => column.id).filter(Boolean) as string[],
    );
  }, [columns]);

  const [localSorting, setLocalSorting] = React.useState<SortingState>(
    initialState?.sorting ?? [],
  );

  const [urlSorting, setUrlSorting] = useQueryState(
    sortKey,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? []),
  );

  const sorting = disableUrlSync ? localSorting : urlSorting;

  const setSortingWrapper = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (disableUrlSync) {
        if (typeof updaterOrValue === "function") {
          setLocalSorting(updaterOrValue);
        } else {
          setLocalSorting(updaterOrValue);
        }
      } else {
        if (typeof updaterOrValue === "function") {
          const newSorting = updaterOrValue(urlSorting);
          setUrlSorting(newSorting as ExtendedColumnSort<TData>[]);
        } else {
          setUrlSorting(updaterOrValue as ExtendedColumnSort<TData>[]);
        }
      }
    },
    [disableUrlSync, urlSorting, setUrlSorting],
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      setSortingWrapper(updaterOrValue);
    },
    [setSortingWrapper],
  );

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) return {};

    return filterableColumns.reduce<
      Record<string, SingleParser<string> | SingleParser<string[]>>
    >((acc, column) => {
      if (column.meta?.options) {
        acc[column.id ?? ""] = parseAsArrayOf(
          parseAsString,
          ARRAY_SEPARATOR,
        ).withOptions(queryStateOptions);
      } else {
        acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
      }
      return acc;
    }, {});
  }, [filterableColumns, queryStateOptions, enableAdvancedFilter]);

  const [localFilterValues, setLocalFilterValues] = React.useState<
    Record<string, string | string[] | null>
  >({});

  const [urlFilterValues, setUrlFilterValues] = useQueryStates(filterParsers);

  const filterValues = disableUrlSync ? localFilterValues : urlFilterValues;
  const setFilterValues = disableUrlSync
    ? setLocalFilterValues
    : setUrlFilterValues;

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: typeof filterValues) => {
      void setPage(1);
      void setFilterValues(values);
    },
    debounceMs,
  );

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        if (value !== null) {
          const processedValue = Array.isArray(value)
            ? value
            : typeof value === "string" && /[^a-zA-Z0-9]/.test(value)
              ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
              : [value];

          filters.push({
            id: key,
            value: processedValue,
          });
        }
        return filters;
      },
      [],
    );
  }, [filterValues, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;

        const filterUpdates = next.reduce<
          Record<string, string | string[] | null>
        >((acc, filter) => {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            acc[filter.id] = filter.value as string | string[];
          }
          return acc;
        }, {});

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination,
    manualSorting,
    manualFiltering,
    meta: {
      ...tableProps.meta,
      queryKeys: {
        page: pageKey,
        perPage: perPageKey,
        sort: sortKey,
        filters: filtersKey,
        joinOperator: joinOperatorKey,
      },
    },
  });

  return { table, shallow, debounceMs, throttleMs };
}
