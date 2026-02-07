"use client";

import type { FileLoadedPayload } from "@/components/common/csv-mapping";
import { CsvHeaderMapping } from "@/components/common/csv-mapping";
import { useManageSku } from "@/hooks/sku/useManageSku";
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

const SKU_COLUMN_CONFIG = {
  requiredColumns: ["sku", "name"] as const,
  optionalColumns: ["description", "price", "unit", "isactive"] as const,
};

function parseBoolean(val: unknown): boolean {
  if (val === undefined || val === null || val === "") return true;
  const s = String(val).toLowerCase().trim();
  return s === "true" || s === "yes" || s === "1";
}

function parsePrice(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(String(val).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

interface SkuImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkuImportSheet({ isOpen, onClose }: SkuImportSheetProps) {
  const { import: importMutation } = useManageSku();
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
      toast.error("Please map at least SKU and Name columns");
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
        const sku = String(mapped.sku ?? "").trim();
        const name = String(mapped.name ?? "").trim();
        if (!sku || !name) return null;
        return {
          sku,
          name,
          description:
            mapped.description !== undefined && mapped.description !== ""
              ? String(mapped.description).trim()
              : null,
          price: parsePrice(mapped.price),
          unit:
            mapped.unit !== undefined && mapped.unit !== ""
              ? String(mapped.unit).trim()
              : null,
          categoryId: null,
          isActive: parseBoolean(mapped.isactive),
        };
      })
      .filter(Boolean) as {
      sku: string;
      name: string;
      description: string | null;
      price: number | null;
      unit: string | null;
      categoryId: null;
      isActive: boolean;
    }[];

    if (items.length === 0) {
      toast.error("No valid rows to import (SKU and Name are required)");
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
              `Imported ${created} SKU(s)${failed > 0 ? `, ${failed} failed` : ""}`,
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
    isMappingValid(SKU_COLUMN_CONFIG, mapping) &&
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
          <SheetTitle>Import SKUs</SheetTitle>
          <SheetDescription>
            Upload a CSV or Excel file and map columns to import SKUs in bulk.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="py-4">
            <CsvHeaderMapping
              config={SKU_COLUMN_CONFIG}
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
