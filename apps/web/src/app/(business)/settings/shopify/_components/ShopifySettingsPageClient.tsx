"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import type { ShopifyStoreItem } from "@/hooks/shopify/useShopifyStores";
import {
  useDisconnectShopifyStore,
  useShopifyStores,
  useSyncShopifyProducts,
  useUpdateShopifyStore,
} from "@/hooks/shopify/useShopifyStores";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";
import { RefreshCw, ShoppingBag, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const SHOPIFY_INSTALL_PATH = "/api/shopify/install";

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
  const [returnWindowDays, setReturnWindowDays] = useState(
    store.returnWindowDays ?? 7,
  );
  const hasReturnWindowChanged =
    (store.returnWindowDays ?? 7) !== returnWindowDays;
  const isValidReturnWindow = returnWindowDays >= 1 && returnWindowDays <= 365;

  const handleSaveReturnWindow = useCallback(() => {
    if (!hasReturnWindowChanged || !isValidReturnWindow) return;
    updateStore
      .mutateAsync({ storeId: store.id, returnWindowDays })
      .then(() => toast.success("Return window updated."))
      .catch(() => toast.error("Failed to update return window."));
  }, [
    store.id,
    returnWindowDays,
    hasReturnWindowChanged,
    isValidReturnWindow,
    updateStore,
  ]);

  return (
    <li className="border-border flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium">{store.shopName || store.shopDomain}</p>
        <p className="text-muted-foreground text-sm">
          {store.shopDomain}
          {store._count.productSyncs > 0 && (
            <> · {store._count.productSyncs} products linked</>
          )}
        </p>
        {store.lastSyncedAt && (
          <p className="text-muted-foreground text-xs">
            Last synced: {new Date(store.lastSyncedAt).toLocaleString()}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <label
            htmlFor={`return-window-${store.id}`}
            className="text-muted-foreground text-sm"
          >
            Return window (days):
          </label>
          <input
            id={`return-window-${store.id}`}
            type="number"
            min={1}
            max={365}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 w-16 rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            value={returnWindowDays}
            onChange={(e) =>
              setReturnWindowDays(
                Math.min(365, Math.max(1, Number(e.target.value) || 1)),
              )
            }
          />
          {hasReturnWindowChanged && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSaveReturnWindow}
              disabled={updateStore.isPending || !isValidReturnWindow}
            >
              Save
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          Points from Shopify orders are locked until this many days after
          fulfillment (then redeemable).
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncProducts}
          disabled={syncProductsPending}
        >
          <RefreshCw
            className={`h-4 w-4 ${syncProductsPending ? "animate-spin" : ""}`}
          />
          Sync products
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDisconnect(store.id)}
          disabled={disconnectPending}
        >
          <Trash2 className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    </li>
  );
}

export function ShopifySettingsPageClient() {
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useShopifyStores();
  const disconnect = useDisconnectShopifyStore();
  const syncProducts = useSyncShopifyProducts();
  const updateStore = useUpdateShopifyStore();
  const [shopInput, setShopInput] = useState("");

  // Toast from OAuth callback
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

  const handleConnect = useCallback(() => {
    const shop = shopInput
      .trim()
      .toLowerCase()
      .replace(/\.myshopify\.com$/, "");
    if (!shop) {
      toast.error(
        "Enter your Shopify store domain (e.g. my-store or my-store.myshopify.com)",
      );
      return;
    }
    const url = `${SHOPIFY_INSTALL_PATH}?shop=${encodeURIComponent(shop.includes(".") ? shop : `${shop}.myshopify.com`)}`;
    window.location.href = url;
  }, [shopInput]);

  const handleDisconnect = useCallback(
    async (storeId: string) => {
      try {
        await disconnect.mutateAsync(storeId);
        toast.success("Store disconnected.");
      } catch (err) {
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
    <PageLayout
      title="Shopify"
      subtitle="Connect your Shopify store to sync products into your catalog"
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <div className="space-y-6">
          {/* Connect new store */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4" />
                Connect a store
              </CardTitle>
              <CardDescription>
                Enter your Shopify store domain. You will be redirected to
                Shopify to authorize access.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="shop-domain"
                  className="text-muted-foreground text-sm"
                >
                  Store domain
                </label>
                <input
                  id="shop-domain"
                  type="text"
                  placeholder="my-store or my-store.myshopify.com"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full max-w-sm rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  value={shopInput}
                  onChange={(e) => setShopInput(e.target.value)}
                />
              </div>
              <Button onClick={handleConnect} disabled={!shopInput.trim()}>
                Connect Shopify
              </Button>
            </CardContent>
          </Card>

          {/* Connected stores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected stores</CardTitle>
              <CardDescription>
                Manage connected Shopify stores and sync products to your SKU
                catalog.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !data ? (
                <Skeleton className="h-24 w-full rounded-md" />
              ) : isError ? (
                <p className="text-destructive text-sm">
                  Failed to load stores. Please try again.
                </p>
              ) : !hasStores ? (
                <p className="text-muted-foreground text-sm">
                  No stores connected yet. Connect a store above to get started.
                </p>
              ) : (
                <ul className="space-y-4">
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
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
