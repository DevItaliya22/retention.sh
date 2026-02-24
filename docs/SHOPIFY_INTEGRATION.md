# Shopify integration

How to connect a Shopify store to a Business and sync products (and optionally orders) into dy.

## 1. Shopify app setup

1. In [Shopify Partner Dashboard](https://partners.shopify.com/) create an app (or use a custom app per store for simpler token access).
2. For **OAuth (recommended)**:
   - Get **API key** (client_id) and **API secret** (client_secret).
   - Under **App setup → URLs** set:
     - **Allowed redirection URL(s)**: `https://your-app.com/api/shopify/callback` (and `http://localhost:3000/api/shopify/callback` for dev).
   - Under **Configuration → Admin API integration** enable the scopes you need, e.g. `read_products`, `write_products`, `read_orders`, etc.
3. Add env vars to `apps/web` (e.g. `.env.local`):

```env
# Shopify (same app used for all businesses)
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
```

Ensure `NEXT_PUBLIC_URL` (or your production URL) is set so the OAuth redirect URI matches what you configured in the Shopify app.

Optional: `NEXT_PUBLIC_URL` (or `VERCEL_URL`) is used to build the OAuth redirect URI; ensure it matches the URL you registered in Shopify.

## 2. OAuth flow (connect a store)

1. Admin goes to **Settings → Integrations → Shopify** and clicks **Connect Shopify**.
2. App redirects to `GET /api/shopify/install?shop=myshop.myshopify.com` (shop can be pre-filled from an input).
   - Backend builds `state` with signed `{ businessId, exp }`, then redirects to  
     `https://{shop}/admin/oauth/authorize?client_id=...&scope=...&redirect_uri=...&state=...`
3. Merchant approves in Shopify and is sent to `GET /api/shopify/callback?code=...&shop=...&state=...`.
4. Backend verifies `state`, exchanges `code` for `access_token` via `POST https://{shop}/admin/oauth/access_token`, then creates/updates `ShopifyStore` (businessId, shopDomain, accessToken, scope) and redirects to `/settings/shopify?connected=1`.

## 3. API routes (implemented)

| Route                        | Method | Auth  | Description                                                             |
| ---------------------------- | ------ | ----- | ----------------------------------------------------------------------- |
| `/api/shopify/install`       | GET    | Admin | Redirects to Shopify OAuth; query: `shop` (e.g. `myshop.myshopify.com`) |
| `/api/shopify/callback`      | GET    | -     | OAuth callback; exchanges code, saves store, redirects to settings      |
| `/api/shopify/stores`        | GET    | Admin | List connected stores for current business                              |
| `/api/shopify/stores/[id]`   | DELETE | Admin | Disconnect store (delete ShopifyStore)                                  |
| `/api/shopify/sync/products` | POST   | Admin | Sync products from Shopify to Categories/SKUs + ShopifyProductSync      |

## 4. Product sync (high level)

- `POST /api/shopify/sync/products` uses the first (or specified) connected store for the business.
- Fetches products from Shopify Admin API (`GET /admin/api/2024-01/products.json`) and for each product/variant:
  - Finds or creates a **Category** (e.g. from product type or a default).
  - Finds or creates a **Sku** (businessId, categoryId, sku, name, price, etc.).
  - Creates/updates **ShopifyProductSync** (shopifyStoreId, skuId, shopifyProductId, shopifyVariantId).
- Sync is one-way (Shopify → dy) unless you add a separate “push” flow.

## 5. Webhooks (orders: fulfill → loyalty, return → deduct)

To keep products/orders in sync after initial import, register webhooks in Shopify (e.g. when saving the store after OAuth):

- `products/update`, `products/create`, `products/delete` → update or remove Sku + ShopifyProductSync.
- `orders/create` → optionally create a Bill or an external “order” record for reporting.

Register with `POST https://{shop}/admin/api/2024-01/webhooks.json` using the store’s `accessToken`. Set the webhook URL to your app (e.g. `https://your-app.com/api/shopify/webhooks/products-update`) and verify requests with `X-Shopify-Hmac-Sha256` using `SHOPIFY_API_SECRET`.

## 6. Security

- **State**: Install route signs `state` with `SHOPIFY_API_SECRET` and includes expiry; callback verifies before exchanging the code.
- **Tokens**: Store `accessToken` in `ShopifyStore`; in production consider encrypting at rest.
- **Webhooks**: Always validate `X-Shopify-Hmac-Sha256` and scope requests to the correct business via `shop` (shopDomain).

## 7. Settings UI

- **Settings → Integrations → Shopify** lists connected stores and a **Connect Shopify** button.
- Connect button can link to `/api/shopify/install?shop=` (user types shop domain) or a small form that submits to install with the given shop.
