# Shopify app config – dev only

Local setup with ngrok. Replace `xxxx` with your actual ngrok subdomain (e.g. `abc123`).

---

## 1. Start ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL, e.g. `https://xxxx.ngrok-free.app`.

---

## 2. Partner Dashboard (dev)

| Field                    | Value                                                     |
| ------------------------ | --------------------------------------------------------- |
| **App URL**              | `https://xxxx.ngrok-free.app`                             |
| **Redirect URLs**        | `https://xxxx.ngrok-free.app/api/shopify/callback`        |
| **Scopes**               | `read_products,write_products,read_orders,read_customers` |
| **Webhooks API Version** | 2026-01 (or latest)                                       |

**Scopes:** Use only the four scopes above. Do **not** add webhook topic names (`orders/create`, `orders/updated`, etc.) — those are not scopes; the app registers webhooks via the API when you connect a store.

---

## 3. Env (`apps/web/.env.local`)

In the Partner Dashboard you see **Client ID** and **Client secret** — use those:

- **Client ID** → `SHOPIFY_API_KEY`
- **Client secret** → `SHOPIFY_API_SECRET` (must be exact – webhook 401 = wrong or swapped value)

```env
SHOPIFY_API_KEY=your_client_id_from_dashboard
SHOPIFY_API_SECRET=your_client_secret_from_dashboard
NEXT_PUBLIC_URL=https://xxxx.ngrok-free.app
```

(Plus your existing DB, auth, etc.)

---

## 4. Webhooks (orders → bills + loyalty)

You **do not** create webhooks in the Shopify Admin. The app creates them when you connect a store.

### Setup steps

1. **Ensure steps 1–3 are done** (ngrok, Partner Dashboard, `.env` with `NEXT_PUBLIC_URL` and `SHOPIFY_API_SECRET`).
2. **Request protected customer data access** (required for order webhooks). In Partner Dashboard → your app → **Configuration** (or **App setup**) → find **Customer data** / **Protected customer data** / **API access** and submit the request. For dev you can approve the data usage so order webhooks work. If you skip this, you’ll get **403** when the app tries to register webhooks on connect.
3. In **our app**: go to **Settings → Shopify**, enter your dev store’s domain (e.g. `your-store.myshopify.com`), click **Connect**.
4. Complete the Shopify OAuth flow (install the app on the store). After redirect back, the app will register these webhooks via the API:
   - `orders/create`
   - `orders/updated`
   - `orders/cancelled`
   - `refunds/create`
     All point to `https://<your-ngrok>/api/shopify/webhooks/orders` and are signed with your app’s Client secret.

### If you already added webhooks manually

- In **Shopify Admin** (the store): **Settings → Notifications → Webhooks** (or **Event webhooks**). Delete any webhooks whose URL is your app’s `/api/shopify/webhooks/orders`.
- In **our app**: **Settings → Shopify** → **Disconnect** the store, then **Connect** again. The app will re-register webhooks via API (correct signing).

### Verify

Create a test order in the Shopify store. In the terminal where `pnpm dev` runs you should see logs like `[Shopify webhook]` and `Bill created: ...`. If you get **401**, follow "Still getting 401?" below.

### 403: “You do not have permission to create webhooks… protected customer data”

Order and refund webhooks use **protected customer data**. You must request access in the Partner Dashboard before the app can register them.

1. Open **[Partners](https://partners.shopify.com) → Your app** (the one you use for this project).
2. In the app’s sidebar go to **Configuration** (or **App setup**) and find **“Customer data”** or **“API access”** or **“Protected customer data”** / **“Distribution”**.
3. Open **“Request access”** or **“Protected customer data access”** and complete the form. For development you can answer “yes” to the data usage questions so you can use order webhooks on your dev store.
4. Save. Access is often granted immediately for dev; if it’s pending, wait for approval.
5. In **our app**: **Settings → Shopify** → **Disconnect** the store, then **Connect** again so the app can register the webhooks.

After access is granted, webhook registration on connect should succeed and you won’t see the 403.

### Still getting 401?

1. **Remove manual webhooks**  
   In the **store’s** Shopify Admin: **Settings → Notifications → Webhooks** (or **Event webhooks**). Delete **every** webhook whose URL contains `/api/shopify/webhooks/orders`. Manual webhooks are signed with a different key and will always return 401.

2. **Reconnect so the app registers webhooks**  
   In **our app**: **Settings → Shopify** → **Disconnect** the store, then **Connect** again (same store domain). Complete OAuth. The app will register `orders/create`, `orders/updated`, `orders/cancelled`, `refunds/create` via the API; those are signed with your app’s Client secret.

3. **Check `.env`**
   - `SHOPIFY_API_SECRET` must be exactly the **Client secret** from Partner Dashboard → your app → Client credentials (not Client ID).
   - No extra spaces, no quotes around the value.
   - Restart the dev server after changing `.env`.

4. **Confirm webhook source**  
   After step 1 and 2, create a new test order. If you still get 401, in Shopify Admin → Settings → Notifications → Webhooks, confirm the webhooks listed there were created by your app (they appear after Connect). If you still see old entries pointing to your URL, delete them and disconnect/reconnect again.

---

## 5. Dev flow

1. `pnpm dev` (app on 3000).
2. `ngrok http 3000` in another terminal.
3. Use the **same** ngrok URL everywhere: App URL, Redirect URLs, `NEXT_PUBLIC_URL`.
4. Install app on a dev store, then in our app: Settings → Shopify, enter store’s `.myshopify.com` domain, click Connect. Webhooks are registered automatically.
