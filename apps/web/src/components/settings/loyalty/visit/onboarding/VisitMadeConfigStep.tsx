"use client";

import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
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
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="pointsPerVisit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Points per visit</FormLabel>
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
          <FormItem className="border-input flex flex-row items-center justify-between border-b py-4">
            <div className="space-y-0.5">
              <FormLabel>Minimum time between visits</FormLabel>
              <p className="text-muted-foreground text-sm">
                Require a minimum interval to count as separate visits
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
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
                <FormLabel>Interval value</FormLabel>
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
                <FormLabel>Interval unit</FormLabel>
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

      <FormField
        control={form.control}
        name="allowSameBillRedemption"
        render={({ field }) => (
          <FormItem className="border-input flex flex-row items-center justify-between border-b py-4">
            <div className="space-y-0.5">
              <FormLabel>Use points on same bill</FormLabel>
              <p className="text-muted-foreground text-sm">
                If off, points are available from the next bill only
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
