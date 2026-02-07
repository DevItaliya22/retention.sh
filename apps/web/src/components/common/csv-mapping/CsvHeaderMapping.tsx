"use client";

import {
  COLUMN_MAPPING_SKIP,
  createAutoMapping,
  getMappingForBackend,
  isMappingValid,
  normalizeHeadersForSelect,
  parseCsvHeaders,
  type ColumnMapping,
  type ColumnMappingConfig,
} from "@/lib/utils/csv-mapping";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@reelo/ui/components";
import { useCallback, useState } from "react";
import * as XLSX from "xlsx";

const SKIP_LABEL = "— Skip";

export type FileLoadedPayload =
  | { type: "csv"; text: string }
  | { type: "excel"; rows: string[][] };

export interface CsvHeaderMappingProps {
  /** Required and optional column keys (our schema). Lowercase, no special chars. */
  config: ColumnMappingConfig;
  /** Called whenever the mapping changes. Use getMappingForBackend(mapping) for backend. */
  onMappingChange?: (mapping: ColumnMapping) => void;
  /** Called when mapping becomes valid (all required mapped). Receives backend-ready mapping. */
  onValidMapping?: (mapping: ColumnMapping) => void;
  /** Optional: log mapping to console when valid (for debugging / future backend use). */
  logMappingToConsole?: boolean;
  /** Called when a CSV or Excel file is loaded. Use to show preview (headers + first rows). */
  onFileLoaded?: (payload: FileLoadedPayload) => void;
  className?: string;
}

export function CsvHeaderMapping({
  config,
  onMappingChange,
  onValidMapping,
  logMappingToConsole = true,
  onFileLoaded,
  className,
}: CsvHeaderMappingProps) {
  const [userHeaders, setUserHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});

  const allOurColumns = [
    ...config.requiredColumns,
    ...(config.optionalColumns ?? []),
  ];

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const name = file.name.toLowerCase();

      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = () => {
          const buffer = reader.result;
          if (!(buffer instanceof ArrayBuffer)) return;
          const workbook = XLSX.read(buffer, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = firstSheetName
            ? workbook.Sheets[firstSheetName]
            : undefined;
          if (!worksheet) {
            setUserHeaders([]);
            setMapping({});
            onMappingChange?.({});
            onFileLoaded?.({ type: "excel", rows: [] });
            return;
          }
          const aoa = XLSX.utils.sheet_to_json<string[]>(worksheet, {
            header: 1,
            raw: false,
            defval: "",
          }) as string[][];
          const rows = aoa.map((r) =>
            r.map((c) => (c != null ? String(c).trim() : "")),
          );
          const rawFirst = rows[0] ?? [];
          const headers = normalizeHeadersForSelect(rawFirst);
          const rowsWithNormalizedHeader = [headers, ...rows.slice(1)];

          // Auto-map headers that match
          const autoMapping = createAutoMapping(headers, config);

          setUserHeaders(headers);
          setMapping(autoMapping);
          onMappingChange?.(autoMapping);
          onFileLoaded?.({ type: "excel", rows: rowsWithNormalizedHeader });
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          const rawHeaders = parseCsvHeaders(text);
          const headers = normalizeHeadersForSelect(rawHeaders);

          // Auto-map headers that match
          const autoMapping = createAutoMapping(headers, config);

          setUserHeaders(headers);
          setMapping(autoMapping);
          onMappingChange?.(autoMapping);
          onFileLoaded?.({ type: "csv", text });
        };
        reader.readAsText(file);
      }
      e.target.value = "";
    },
    [config, onFileLoaded, onMappingChange],
  );

  const setMappingForColumn = useCallback(
    (ourCol: string, userHeader: string) => {
      setMapping((prev) => {
        const next = { ...prev, [ourCol]: userHeader };
        onMappingChange?.(next);
        if (isMappingValid(config, next)) {
          const forBackend = getMappingForBackend(next);
          onValidMapping?.(forBackend);
          if (logMappingToConsole) {
            // eslint-disable-next-line no-console
            console.log(
              "[CsvHeaderMapping] one-to-one mapping (ourCol -> userHeader):",
              forBackend,
            );
          }
        }
        return next;
      });
    },
    [config, onMappingChange, onValidMapping, logMappingToConsole],
  );

  return (
    <div className={className}>
      <div className="mb-4">
        <Label className="text-foreground mb-2 block text-sm font-medium">
          Upload sample CSV or Excel
        </Label>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFile}
          className="border-input bg-background text-foreground file:bg-primary file:text-primary-foreground block w-full cursor-pointer rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:px-3 file:py-1 file:text-sm"
        />
        {userHeaders.length > 0 && (
          <p className="text-muted-foreground mt-1 text-xs">
            Detected {userHeaders.length} column(s):{" "}
            {userHeaders.slice(0, 5).join(", ")}
            {userHeaders.length > 5 ? "…" : ""}
          </p>
        )}
      </div>

      {userHeaders.length > 0 && (
        <div className="space-y-3">
          <Label className="text-foreground text-sm font-medium">
            Map your columns to our columns
          </Label>
          <div className="border-border divide-border divide-y rounded-md border">
            {allOurColumns.map((ourCol) => {
              const isRequired = config.requiredColumns.includes(ourCol);
              const value = mapping[ourCol] ?? "";
              return (
                <div
                  key={ourCol}
                  className="flex flex-wrap items-center gap-3 px-3 py-2 sm:flex-nowrap"
                >
                  <span className="text-foreground min-w-[120px] text-sm">
                    {ourCol}
                    {isRequired && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </span>
                  <Select
                    value={value === "" ? "__empty__" : value}
                    onValueChange={(v) =>
                      setMappingForColumn(
                        ourCol,
                        v === "__empty__" || v === COLUMN_MAPPING_SKIP
                          ? isRequired
                            ? ""
                            : COLUMN_MAPPING_SKIP
                          : v,
                      )
                    }
                  >
                    <SelectTrigger className="min-w-[180px]">
                      <SelectValue placeholder="Select column…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">
                        <span className="text-muted-foreground">
                          Select column…
                        </span>
                      </SelectItem>
                      {!isRequired && (
                        <SelectItem value={COLUMN_MAPPING_SKIP}>
                          {SKIP_LABEL}
                        </SelectItem>
                      )}
                      {userHeaders.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h.startsWith("__empty_") ? "(empty column)" : h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
          {isMappingValid(config, mapping) && (
            <p className="text-muted-foreground text-xs">
              All required columns are mapped. Check console for backend mapping
              (ourCol → userHeader).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
