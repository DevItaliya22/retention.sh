"use client";

import { CsvHeaderMapping } from "@/components/common/csv-mapping";
import type { FileLoadedPayload } from "@/components/common/csv-mapping";
import { useManageCategory } from "@/hooks/category/useManageCategory";
import {
  applyMappingToRow,
  getMappingForBackend,
  isMappingValid,
  normalizeHeadersForSelect,
  parseCsvToRows,
  type ColumnMapping,
} from "@/lib/utils/csv-mapping";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  Button,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@reelo/ui/components";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const CATEGORY_COLUMN_CONFIG = {
  requiredColumns: ["name"] as const,
  optionalColumns: ["description", "sortorder"] as const,
};

interface CategoryImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryImportSheet({
  isOpen,
  onClose,
}: CategoryImportSheetProps) {
  const { import: importMutation } = useManageCategory();
  const [filePayload, setFilePayload] = useState<FileLoadedPayload | null>(
    null,
  );
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const mappingRef = useRef<ColumnMapping>({});

  const handleMappingChange = useCallback((m: ColumnMapping) => {
    mappingRef.current = m;
    setMapping(m);
  }, []);

  const handleFileLoaded = useCallback((payload: FileLoadedPayload) => {
    setFilePayload(payload);
  }, []);

  const buildDataRows = useCallback((): Record<string, unknown>[] => {
    if (!filePayload) return [];

    if (filePayload.type === "csv") {
      const rows = parseCsvToRows(filePayload.text);
      if (rows.length < 2) return [];
      const rawHeaders = rows[0] ?? [];
      const headers = normalizeHeadersForSelect(rawHeaders);
      const result: Record<string, unknown>[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] ?? [];
        const obj: Record<string, unknown> = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx] ?? "";
        });
        result.push(obj);
      }
      return result;
    }

    if (filePayload.type === "excel") {
      const rows = filePayload.rows;
      if (rows.length < 2) return [];
      const headers = rows[0] ?? [];
      const result: Record<string, unknown>[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] ?? [];
        const obj: Record<string, unknown> = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx] ?? "";
        });
        result.push(obj);
      }
      return result;
    }

    return [];
  }, [filePayload]);

  const handleImport = useCallback(() => {
    const backendMapping = getMappingForBackend(mappingRef.current);
    if (Object.keys(backendMapping).length === 0) {
      toast.error("Please map at least the Name column");
      return;
    }

    const dataRows = buildDataRows();
    if (dataRows.length === 0) {
      toast.error("No data rows to import");
      return;
    }

    const items = dataRows
      .map((row) => {
        const mapped = applyMappingToRow(row, mappingRef.current);
        const name = String(mapped.name ?? "").trim();
        if (!name) return null;

        const sortOrderValue = mapped.sortorder;
        let sortOrder: number | undefined;
        if (
          sortOrderValue !== undefined &&
          sortOrderValue !== null &&
          sortOrderValue !== ""
        ) {
          const parsed = Number(String(sortOrderValue).trim());
          if (Number.isFinite(parsed) && parsed >= 0) {
            sortOrder = Math.floor(parsed);
          }
        }

        return {
          name,
          description:
            mapped.description !== undefined && mapped.description !== ""
              ? String(mapped.description).trim()
              : null,
          sortOrder,
          parentId: null,
        };
      })
      .filter(Boolean) as {
      name: string;
      description: string | null;
      sortOrder?: number;
      parentId: null;
    }[];

    if (items.length === 0) {
      toast.error("No valid rows to import (Name is required)");
      return;
    }

    importMutation.mutate(
      { items },
      {
        onSuccess: (res) => {
          if (res.error) {
            toast.error(res.error);
            return;
          }
          const { created, failed } = res;
          if (created > 0) {
            toast.success(
              `Imported ${created} category(s)${failed > 0 ? `, ${failed} failed` : ""}`,
            );
          }
          if (failed > 0 && created === 0) {
            toast.error(
              `Import failed: ${res.errors?.[0]?.message ?? "Unknown error"}`,
            );
            return;
          }
          onClose();
          setFilePayload(null);
          setMapping({});
          mappingRef.current = {};
        },
        onError: (err) => {
          toast.error(getErrorMessageFromResponse(err) ?? "Import failed");
        },
      },
    );
  }, [buildDataRows, importMutation, onClose]);

  const canImport =
    filePayload &&
    isMappingValid(CATEGORY_COLUMN_CONFIG, mapping) &&
    !importMutation.isPending;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
        setFilePayload(null);
        setMapping({});
        mappingRef.current = {};
      }
    },
    [onClose],
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Import Categories</SheetTitle>
          <SheetDescription>
            Upload a CSV or Excel file and map columns to import categories in
            bulk.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="py-4">
            <CsvHeaderMapping
              config={CATEGORY_COLUMN_CONFIG}
              onMappingChange={handleMappingChange}
              onFileLoaded={handleFileLoaded}
              logMappingToConsole={false}
              className="min-w-0"
            />
          </div>
        </ScrollArea>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!canImport}>
            {importMutation.isPending ? "Importing…" : "Import"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
