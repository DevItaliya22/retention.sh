"use client";

import type { FileLoadedPayload } from "@/components/common/csv-mapping";
import { CsvHeaderMapping } from "@/components/common/csv-mapping";
import { useManageBill } from "@/hooks/bills/useManageBill";
import {
  billImportItemSchema,
  type BillImportItemInput,
} from "@/lib/schemas/bill";
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

const BILL_COLUMN_CONFIG = {
  requiredColumns: ["billnumber", "phone"] as const,
  optionalColumns: [
    "name",
    "email",
    "amount",
    "notes",
    "addressline1",
    "addressline2",
    "city",
    "state",
    "country",
    "postalcode",
  ] as const,
};

function parseAmount(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

interface BillImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillImportSheet({ isOpen, onClose }: BillImportSheetProps) {
  const { import: importMutation } = useManageBill();
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
      toast.error("Please map at least Bill Number and Phone columns");
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
        const billNumber = String(mapped.billnumber ?? "").trim();
        const phoneNumber = String(mapped.phone ?? "").trim();
        if (!billNumber || !phoneNumber) return null;

        return {
          billNumber,
          phoneNumber,
          name:
            mapped.name !== undefined && mapped.name !== ""
              ? String(mapped.name).trim()
              : null,
          email:
            mapped.email !== undefined && mapped.email !== ""
              ? String(mapped.email).trim()
              : null,
          addressLine1:
            mapped.addressline1 !== undefined && mapped.addressline1 !== ""
              ? String(mapped.addressline1).trim()
              : null,
          addressLine2:
            mapped.addressline2 !== undefined && mapped.addressline2 !== ""
              ? String(mapped.addressline2).trim()
              : null,
          city:
            mapped.city !== undefined && mapped.city !== ""
              ? String(mapped.city).trim()
              : null,
          state:
            mapped.state !== undefined && mapped.state !== ""
              ? String(mapped.state).trim()
              : null,
          country:
            mapped.country !== undefined && mapped.country !== ""
              ? String(mapped.country).trim()
              : null,
          postalCode:
            mapped.postalcode !== undefined && mapped.postalcode !== ""
              ? String(mapped.postalcode).trim()
              : null,
          amount: parseAmount(mapped.amount),
          notes:
            mapped.notes !== undefined && mapped.notes !== ""
              ? String(mapped.notes).trim()
              : null,
        };
      })
      .filter(Boolean) as {
      billNumber: string;
      phoneNumber: string;
      name: string | null;
      email: string | null;
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      postalCode: string | null;
      amount: number | null;
      notes: string | null;
    }[];

    if (items.length === 0) {
      toast.error(
        "No valid rows to import (Bill Number and Phone are required)",
      );
      return;
    }

    const validItems: BillImportItemInput[] = [];
    const validationErrors: { row: number; error: unknown }[] = [];

    items.forEach((item, index) => {
      const result = billImportItemSchema.safeParse(item);
      if (result.success) {
        validItems.push(result.data);
      } else {
        validationErrors.push({
          row: index + 2,
          error: result.error.format(),
        });
      }
    });

    if (validationErrors.length > 0) {
      console.group("❌ Import Validation Errors");
      console.log(
        "The following rows failed local validation and were NOT sent to the server:",
      );
      validationErrors.forEach(({ row, error }) => {
        console.log(`Row ${row}:`, error);
      });
      console.groupEnd();

      toast.error(
        `Validation failed for ${validationErrors.length} row(s). Check console for details.`,
      );
      return;
    }

    importMutation.mutate(
      { items: validItems },
      {
        onSuccess: (res) => {
          if (res.error) {
            toast.error(res.error);
            return;
          }

          const { created, failed, errors } = res;

          if (failed > 0) {
            console.group("❌ Import Server Errors");
            console.log("The following rows failed on the server:");
            errors.forEach((err) => {
              console.log(`Row ${err.row}: ${err.message} (${err.billNumber})`);
            });
            console.groupEnd();
          }

          if (created > 0) {
            toast.success(
              `Imported ${created} bill(s)${failed > 0 ? `. ${failed} failed (check console)` : ""}`,
            );
          }

          if (failed > 0 && created === 0) {
            toast.error(
              `All ${failed} rows failed. Check console for details.`,
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
    isMappingValid(BILL_COLUMN_CONFIG, mapping) &&
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
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Import Bills</SheetTitle>
          <SheetDescription>
            Upload a CSV or Excel file and map columns to import bills in bulk.
            Bill number and phone are required.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 pr-4">
          <div className="py-4">
            <CsvHeaderMapping
              config={BILL_COLUMN_CONFIG}
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
