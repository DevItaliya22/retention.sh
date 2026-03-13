"use client";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  PixelIcon,
  SaveButton,
  Skeleton,
} from "@reelo/ui/components";
import { RefreshCw, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const SHOPIFY_INSTALL_PATH = "/api/shopify/install";

const connectSchema = z.object({
  shop: z.string().min(1, "Store domain is required").trim(),
});

type ConnectForm = z.infer<typeof connectSchema>;

const storeSettingsSchema = z.object({
  shopName: z.string(),
  shopDomain: z.string(),
  returnWindowDays: z.number().min(1, "Min 1 day").max(365, "Max 365 days"),
});

type StoreSettingsForm = z.infer<typeof storeSettingsSchema>;

type ConnectStatus = "idle" | "redirecting" | "error";

function ConnectStoreCard({ initialError }: { initialError?: string | null }) {
  const [status, setStatus] = useState<ConnectStatus>(
    initialError ? "error" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState(initialError || "");

  const form = useForm<ConnectForm>({
    resolver: zodResolver(connectSchema),
    defaultValues: { shop: "" },
  });

  const handleConnect = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) return;

    const values = form.getValues();
    const shop = values.shop
      .trim()
      .toLowerCase()
      .replace(/\.myshopify\.com$/, "");

    if (!shop) {
      form.setError("shop", {
        message:
          "Enter your Shopify store domain (e.g. my-store or my-store.myshopify.com)",
      });
      return;
    }

    setStatus("redirecting");
    const url = `${SHOPIFY_INSTALL_PATH}?shop=${encodeURIComponent(
      shop.includes(".") ? shop : `${shop}.myshopify.com`,
    )}`;
    window.location.href = url;
  }, [form]);

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Connect a store
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Enter your Shopify store domain. You will be redirected to Shopify to
          authorize access.
        </CardDescription>
      </CardHeader>

      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        {status === "redirecting" ? (
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <PixelIcon state="loading" />
            <p className="text-muted-foreground text-sm">
              Connecting to Shopify...
            </p>
          </CardContent>
        ) : status === "error" ? (
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <PixelIcon state="error" />
            <p className="text-destructive text-sm">
              {errorMessage || "Connection failed."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus("idle");
                setErrorMessage("");
              }}
            >
              Try again
            </Button>
          </CardContent>
        ) : (
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleConnect();
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
                <FormField
                  control={form.control}
                  name="shop"
                  render={({ field }) => (
                    <FormItem className={SETTINGS_ROW_CLASS}>
                      <div className={SETTINGS_LABEL_CLASS}>
                        <FormLabel className="text-sm">Store domain</FormLabel>
                      </div>
                      <div className={SETTINGS_CONTROL_CLASS}>
                        <FormControl>
                          <Input
                            variant="underline"
                            placeholder="my-store or my-store.myshopify.com"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-foreground-lighter text-xs">
                          Enter your store name or full .myshopify.com domain.
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex shrink-0 items-center justify-end gap-2 border-0 px-4 py-2">
                <Button
                  type="submit"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Connect store
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
      </Card>
    </Card>
  );
}

function StoreSettingsCard({
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
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [syncDialogSubmitting, setSyncDialogSubmitting] = useState(false);
  const [disconnectDialogSubmitting, setDisconnectDialogSubmitting] =
    useState(false);
  const form = useForm<StoreSettingsForm>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      shopName: store.shopName || store.shopDomain,
      shopDomain: store.shopDomain,
      returnWindowDays: store.returnWindowDays ?? 7,
    },
  });

  useEffect(() => {
    form.reset({
      shopName: store.shopName || store.shopDomain,
      shopDomain: store.shopDomain,
      returnWindowDays: store.returnWindowDays ?? 7,
    });
  }, [store, form]);

  useEffect(() => {
    if (!syncProductsPending && syncDialogSubmitting) {
      setSyncDialogOpen(false);
      setSyncDialogSubmitting(false);
    }
  }, [syncProductsPending, syncDialogSubmitting]);

  useEffect(() => {
    if (!disconnectPending && disconnectDialogSubmitting) {
      setDisconnectDialogOpen(false);
      setDisconnectDialogSubmitting(false);
    }
  }, [disconnectPending, disconnectDialogSubmitting]);

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

  const storeMetaLine = useMemo(() => {
    const parts: string[] = [];
    if (store._count.productSyncs > 0)
      parts.push(`${store._count.productSyncs} products linked`);
    if (store.lastSyncedAt)
      parts.push(
        `Last synced: ${new Date(store.lastSyncedAt).toLocaleString()}`,
      );
    return parts.length
      ? parts.join(" · ")
      : "Manage your connected Shopify store and sync products to your SKU catalog.";
  }, [store._count.productSyncs, store.lastSyncedAt]);

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground flex items-center justify-between gap-2 pr-3 text-base leading-none font-semibold">
          <span>Connected store</span>
          <PixelIcon state="success" />
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          {storeMetaLine}
        </CardDescription>
      </CardHeader>

      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel className="text-sm">Store name</FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Input variant="underline" disabled {...field} />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shopDomain"
                render={({ field }) => (
                  <FormItem className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel className="text-sm">Store domain</FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Input variant="underline" disabled {...field} />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
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
                        Points from Shopify orders are locked until this many
                        days after fulfillment (then redeemable).
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
            <CardFooter className="flex shrink-0 items-center justify-end gap-2 border-0 px-4 py-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncDialogOpen(true)}
                  disabled={syncProductsPending}
                >
                  Sync products
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDisconnectDialogOpen(true)}
                  disabled={disconnectPending}
                >
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Disconnect
                  </span>
                </Button>
                <SaveButton
                  onSave={runSubmit}
                  disabled={!form.formState.isDirty}
                  variant="outline"
                  labels={{
                    idle: "Save changes",
                    loading: "Saving",
                    success: "Saved",
                  }}
                />
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <AlertDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync products from Shopify?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sync products from your connected Shopify store into
              your product catalog. This may take a few moments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={syncProductsPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSyncDialogSubmitting(true);
                onSyncProducts();
              }}
            >
              <span className="inline-flex items-center gap-2">
                {syncProductsPending && <PixelIcon state="loading" />}
                <RefreshCw className="h-4 w-4" />
                Sync products
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Shopify store?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect your Shopify store from Reelo. Existing
              synced products will remain in your catalog but will no longer be
              updated automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDisconnectDialogSubmitting(true);
                onDisconnect(store.id);
              }}
              className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
            >
              <span className="inline-flex items-center gap-2">
                {disconnectPending && <PixelIcon state="loading" />}
                <Trash2 className="h-4 w-4" />
                Disconnect
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export function ShopifySettingsPageClient() {
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useShopifyStores();
  const disconnect = useDisconnectShopifyStore();
  const syncProducts = useSyncShopifyProducts();
  const updateStore = useUpdateShopifyStore();

  const connectedParam = searchParams.get("connected");
  const errorParam = searchParams.get("error");

  const errorMessage = useMemo(() => {
    if (!errorParam) return null;
    const messages: Record<string, string> = {
      config: "Shopify integration is not configured.",
      missing_params: "Missing OAuth parameters.",
      invalid_state: "Invalid or expired link. Please try connecting again.",
      token_exchange: "Could not complete connection. Try again.",
      server_error: "Something went wrong. Please try again.",
    };
    return messages[errorParam] || "Connection failed.";
  }, [errorParam]);

  useEffect(() => {
    if (connectedParam === "1") {
      toast.success("Shopify store connected successfully.");
    }
    if (errorParam) {
      toast.error(errorMessage || "Connection failed.");
    }
  }, [connectedParam, errorParam, errorMessage]);

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

  if (isLoading && !data) {
    return (
      <DashboardPageShell
        title="Shopify"
        subtitle="Connect your Shopify store to sync products into your catalog"
        contentVariant="contained"
      >
        <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
          <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
            <div className="flex items-center gap-2">
              <PixelIcon state="loading" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="mt-1 h-4 w-64" />
          </CardHeader>
          <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </Card>
      </DashboardPageShell>
    );
  }

  if (isError) {
    return (
      <DashboardPageShell
        title="Shopify"
        subtitle="Connect your Shopify store to sync products into your catalog"
        contentVariant="contained"
      >
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <PixelIcon state="error" />
          <p className="text-destructive text-sm">
            Failed to load stores. Please try again.
          </p>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="Shopify"
      subtitle="Connect your Shopify store to sync products into your catalog"
      contentVariant="contained"
    >
      <div className="space-y-6 pb-12">
        {!hasStores && <ConnectStoreCard initialError={errorMessage} />}

        {hasStores &&
          stores.map((store) => (
            <StoreSettingsCard
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
    </DashboardPageShell>
  );
}
