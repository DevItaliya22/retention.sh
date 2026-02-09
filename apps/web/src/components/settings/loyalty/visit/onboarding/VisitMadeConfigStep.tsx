"use client";

import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  useFormContext,
} from "@reelo/ui/components";

const VISIT_INTERVAL_UNITS = [
  { value: "MINUTE", label: "Minute(s)", max: 60 },
  { value: "HOUR", label: "Hour(s)", max: 23 },
  { value: "DAY", label: "Day(s)", max: 31 },
  { value: "WEEK", label: "Week(s)", max: 4 },
  { value: "MONTH", label: "Month(s)", max: 12 },
] as const;

export function VisitMadeConfigStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="pointsPerVisit"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Points per visit</Label>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="1"
                placeholder="1"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(
                    v === "" ? undefined : Math.max(0, parseInt(v, 10) || 0),
                  );
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="visitIntervalEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm font-normal">
                  Require minimum time between visits to count as separate
                  visits
                </span>
              </label>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {form.watch("visitIntervalEnabled") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="visitIntervalValue"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Interval value</Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={1}
                    placeholder="e.g. 24"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const unit = form.watch("visitIntervalUnit");
                      const unitConfig = VISIT_INTERVAL_UNITS.find(
                        (u) => u.value === unit,
                      );
                      const maxVal = unitConfig?.max ?? 60;
                      field.onChange(
                        v === ""
                          ? null
                          : Math.min(maxVal, Math.max(1, parseInt(v, 10) || 1)),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="visitIntervalUnit"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Interval unit</Label>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || null)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VISIT_INTERVAL_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
