"use client";

import { SettingsFieldGroup } from "@/components/common/settings/SettingsFieldGroup";
import { DashboardPageShell } from "@/components/layouts";
import {
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "@/components/settings/loyalty/common";
import type { ShopifyStoreItem } from "@/hooks/shopify/useShopifyStores";
import {
  useDisconnectShopifyStore,
  useShopifyStores,
  useSyncShopifyProducts,
  useUpdateShopifyStore,
} from "@/hooks/shopify/useShopifyStores";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SaveButton,
  Skeleton,
} from "@reelo/ui/components";
import { RefreshCw, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const SHOPIFY_INSTALL_PATH = "/api/shopify/install";

const returnWindowSchema = z.object({
  returnWindowDays: z.number().min(1, "Min 1 day").max(365, "Max 365 days"),
});

type ReturnWindowForm = z.infer<typeof returnWindowSchema>;

function StoreCard({
  store,
  onSyncProducts,
  onDisconnect,
  syncProductsPending,
  disconnectPending,
  updateStore,
}: {
  store: ShopifyStoreItem;
  onSyncProducts: () => void;
  onDisconnect: (storeId: string) => void;
  syncProductsPending: boolean;
  disconnectPending: boolean;
  updateStore: ReturnType<typeof useUpdateShopifyStore>;
}) {
  const form = useForm<ReturnWindowForm>({
    resolver: zodResolver(returnWindowSchema),
    defaultValues: {
      returnWindowDays: store.returnWindowDays ?? 7,
    },
  });

  useEffect(() => {
    form.reset({ returnWindowDays: store.returnWindowDays ?? 7 });
  }, [store.returnWindowDays, form]);

  const runSubmit = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    await updateStore.mutateAsync({
      storeId: store.id,
      returnWindowDays: values.returnWindowDays,
    });
    toast.success("Return window updated.");
    form.reset(values, { keepDefaultValues: false });
  }, [store.id, form, updateStore]);

  return (
    <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-4 pt-4 pb-0">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          {store.shopName || store.shopDomain}
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          {store.shopDomain}
          {store._count.productSyncs > 0 && (
            <> · {store._count.productSyncs} products linked</>
          )}
          {store.lastSyncedAt && (
            <> · Last synced: {new Date(store.lastSyncedAt).toLocaleString()}</>
          )}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4 pt-4">
            <FormField
              control={form.control}
              name="returnWindowDays"
              render={({ field }) => (
                <FormItem className={SETTINGS_ROW_CLASS}>
                  <div className={SETTINGS_LABEL_CLASS}>
                    <FormLabel className="text-sm">
                      Return window (days)
                    </FormLabel>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      Points from Shopify orders are locked until this many days
                      after fulfillment (then redeemable).
                    </p>
                  </div>
                  <div className={SETTINGS_CONTROL_CLASS}>
                    <FormControl>
                      <Input
                        variant="underline"
                        type="number"
                        min={1}
                        max={365}
                        placeholder="7"
                        value={field.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(
                            v === ""
                              ? 7
                              : Math.min(
                                  365,
                                  Math.max(1, parseInt(v, 10) || 1),
                                ),
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex shrink-0 items-center justify-between gap-2 border-0 px-4 py-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSyncProducts}
                disabled={syncProductsPending}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${syncProductsPending ? "animate-spin" : ""}`}
                />
                Sync products
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDisconnect(store.id)}
                disabled={disconnectPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
            <SaveButton
              onSave={runSubmit}
              disabled={!form.formState.isDirty}
              labels={{
                idle: "Save changes",
                loading: "Saving",
                success: "Saved",
              }}
            />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export function ShopifySettingsPageClient() {
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useShopifyStores();
  const disconnect = useDisconnectShopifyStore();
  const syncProducts = useSyncShopifyProducts();
  const updateStore = useUpdateShopifyStore();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected === "1") {
      toast.success("Shopify store connected successfully.");
    }
    if (error) {
      const messages: Record<string, string> = {
        config: "Shopify integration is not configured.",
        missing_params: "Missing OAuth parameters.",
        invalid_state: "Invalid or expired link. Please try connecting again.",
        token_exchange: "Could not complete connection. Try again.",
        server_error: "Something went wrong. Please try again.",
      };
      toast.error(messages[error] || "Connection failed.");
    }
  }, [searchParams]);

  const handleConnectSubmit = useCallback(
    async (values: Record<string, string>) => {
      const shop = (values.shop ?? "")
        .trim()
        .toLowerCase()
        .replace(/\.myshopify\.com$/, "");
      if (!shop) {
        return {
          success: false,
          error:
            "Enter your Shopify store domain (e.g. my-store or my-store.myshopify.com)",
        };
      }
      const url = `${SHOPIFY_INSTALL_PATH}?shop=${encodeURIComponent(shop.includes(".") ? shop : `${shop}.myshopify.com`)}`;
      window.location.href = url;
      return { success: true };
    },
    [],
  );

  const handleDisconnect = useCallback(
    async (storeId: string) => {
      try {
        await disconnect.mutateAsync(storeId);
        toast.success("Store disconnected.");
      } catch {
        toast.error("Failed to disconnect store.");
      }
    },
    [disconnect],
  );

  const handleSyncProducts = useCallback(async () => {
    try {
      const res = await syncProducts.mutateAsync();
      if (res.message) toast.success(res.message);
      else toast.success("Products synced.");
    } catch {
      toast.error("Product sync failed. Check that the store is connected.");
    }
  }, [syncProducts]);

  const stores = data?.items ?? [];
  const hasStores = stores.length > 0;

  return (
    <DashboardPageShell
      title="Shopify"
      subtitle="Connect your Shopify store to sync products into your catalog"
      contentVariant="contained"
    >
      <div className="space-y-6 pb-12">
        {!hasStores && (
          <SettingsFieldGroup
            title="Connect a store"
            description="Enter your Shopify store domain. You will be redirected to Shopify to authorize access."
            fields={[
              {
                name: "shop",
                label: "Store domain",
                placeholder: "my-store or my-store.myshopify.com",
                helpText:
                  "Enter your store name or full .myshopify.com domain.",
              },
            ]}
            defaultValues={{ shop: "" }}
            onSubmit={handleConnectSubmit}
          />
        )}

        <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
          <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
            <CardTitle className="text-foreground text-base leading-none font-semibold">
              Connected store
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-0.5 text-sm">
              {hasStores
                ? "Manage your connected Shopify store and sync products to your SKU catalog."
                : "Your connected Shopify store will appear here. One store per portal."}
            </CardDescription>
          </CardHeader>
          <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
            <CardContent className="overflow-hidden px-4 py-4">
              {isLoading && !data ? (
                <Skeleton className="h-24 w-full rounded-md" />
              ) : isError ? (
                <p className="text-destructive text-sm">
                  Failed to load stores. Please try again.
                </p>
              ) : !hasStores ? (
                <p className="text-muted-foreground text-sm">
                  No store connected yet. Connect a store above to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {stores.map((store) => (
                    <StoreCard
                      key={store.id}
                      store={store}
                      onSyncProducts={handleSyncProducts}
                      onDisconnect={handleDisconnect}
                      syncProductsPending={syncProducts.isPending}
                      disconnectPending={disconnect.isPending}
                      updateStore={updateStore}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Card>
      </div>
    </DashboardPageShell>
  );
}
