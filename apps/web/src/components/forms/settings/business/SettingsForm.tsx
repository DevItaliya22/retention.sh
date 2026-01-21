"use client";

import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reelo/ui/components";
import { BusinessSettingsStep } from "./steps/BusinessSettingsStep";
import { CashierSettingsStep } from "./steps/CashierSettingsStep";

interface SettingsFormProps {
  initialData: {
    business: any;
    cashiers: any[];
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/50">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="team">Team (Cashiers)</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6 animate-in fade-in duration-300">
          <BusinessSettingsStep initialData={initialData.business} />
        </TabsContent>

        <TabsContent value="team" className="mt-6 animate-in fade-in duration-300">
          <CashierSettingsStep cashiers={initialData.cashiers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
