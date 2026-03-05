import {
  applyLoyaltyForShopifyOrder,
  deductLoyaltyForShopifyOrderRefund,
} from "@/lib/actions/loyalty/shopify-order";
import { runTransaction } from "@/lib/db/transaction";
import { verifyShopifyWebhook } from "@/lib/shopify/webhook-verify";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_ORDER_GID_PREFIX = "gid://shopify/Order/";

/** Normalize Shopify order id to a short string for storage */
function normalizeShopifyOrderId(id: string | number): string {
  if (typeof id === "number") return String(id);
  if (id.startsWith(SHOPIFY_ORDER_GID_PREFIX))
    return id.slice(SHOPIFY_ORDER_GID_PREFIX.length);
  return String(id);
}

/** Find or create Customer by email for a business; returns customerId. */
async function findOrCreateCustomerByEmail(
  tx: Parameters<Parameters<typeof runTransaction>[0]>[0],
  params: { businessId: string; email: string; name?: string | null },
): Promise<string> {
  const { businessId, email, name } = params;
  const normalizedEmail = email?.trim()?.toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Order has no email");
  }

  let customer = await tx.customer.findFirst({
    where: { email: normalizedEmail },
  });

  if (!customer) {
    const { randomUUID } = await import("node:crypto");
    const placeholderEmail = `shopify-${randomUUID()}@dy.placeholder`;
    const user = await tx.user.create({
      data: {
        name: name || "Customer",
        email: placeholderEmail,
        role: "CUSTOMER",
        emailVerified: false,
      },
    });
    customer = await tx.customer.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
      },
    });
  }

  const existing = await tx.businessCustomer.findUnique({
    where: {
      businessId_customerId: { businessId, customerId: customer.id },
    },
  });
  if (!existing) {
    await tx.businessCustomer.create({
      data: { businessId, customerId: customer.id },
    });
  }

  const walletExists = await tx.wallet.findUnique({
    where: {
      businessId_customerId: { businessId, customerId: customer.id },
    },
  });
  if (!walletExists) {
    await tx.wallet.create({
      data: { businessId, customerId: customer.id },
    });
  }

  return customer.id;
}

const FALLBACK_SKU_CODE = "SHOPIFY-ORDER";

/** Get or create a single fallback SKU per business for unmapped Shopify line items. */
async function getOrCreateFallbackSku(
  tx: Parameters<Parameters<typeof runTransaction>[0]>[0],
  businessId: string,
): Promise<string> {
  let sku = await tx.sku.findFirst({
    where: { businessId, sku: FALLBACK_SKU_CODE },
  });
  if (!sku) {
    sku = await tx.sku.create({
      data: {
        businessId,
        sku: FALLBACK_SKU_CODE,
        name: "Shopify order item",
        isActive: true,
      },
    });
  }
  return sku.id;
}

/** Create a Bill from a Shopify order and return billId. */
async function createBillFromShopifyOrder(
  tx: Parameters<Parameters<typeof runTransaction>[0]>[0],
  params: {
    storeId: string;
    businessId: string;
    customerId: string;
    customerEmail?: string | null;
    orderId: string;
    orderNumber: string | number | null;
    totalAmount: number;
    lineItems: ShopifyLineItem[];
  },
): Promise<string> {
  const {
    storeId,
    businessId,
    customerId,
    customerEmail,
    orderId,
    orderNumber,
    totalAmount,
    lineItems,
  } = params;

  const business = await tx.business.findUnique({
    where: { id: businessId },
    select: { nextBillNumber: true },
  });
  if (!business) throw new Error("Business not found");
  const billNumber = String(business.nextBillNumber);

  const fallbackSkuId = await getOrCreateFallbackSku(tx, businessId);

  const lineItemCreates: Array<{
    skuId: string;
    qty: number;
    unitPrice: number;
  }> = [];
  for (const li of lineItems || []) {
    const qty = Math.max(1, Math.floor(Number(li.quantity) || 1));
    const unitPrice = parseFloat(String(li.price ?? 0)) || 0;
    const productId = li.product_id != null ? String(li.product_id) : null;
    const variantId = li.variant_id != null ? String(li.variant_id) : null;

    let skuId = fallbackSkuId;
    if (productId) {
      const sync = await tx.shopifyProductSync.findFirst({
        where: {
          shopifyStoreId: storeId,
          shopifyProductId: productId,
          shopifyVariantId: variantId ?? null,
        },
        select: { skuId: true },
      });
      if (sync) skuId = sync.skuId;
    }

    const existing = lineItemCreates.find((x) => x.skuId === skuId);
    if (existing) {
      existing.qty += qty;
    } else {
      lineItemCreates.push({ skuId, qty, unitPrice });
    }
  }

  if (lineItemCreates.length === 0) {
    lineItemCreates.push({
      skuId: fallbackSkuId,
      qty: 1,
      unitPrice: totalAmount,
    });
  }

  const bill = await tx.bill.create({
    data: {
      billNumber,
      subtotal: totalAmount,
      storeDiscount: 0,
      finalAmount: totalAmount,
      userPaidAmount: totalAmount,
      notes: `Shopify order ${orderNumber ?? orderId}`,
      paymentMethod: "shopify",
      businessId,
      customerId,
      cashierId: null,
      lineItems: {
        create: lineItemCreates.map((li) => ({
          skuId: li.skuId,
          qty: li.qty,
          unitPrice: li.unitPrice,
        })),
      },
    },
  });

  await tx.business.update({
    where: { id: businessId },
    data: { nextBillNumber: { increment: 1 } },
  });

  const feedbackConfig = await tx.feedbackConfig.findUnique({
    where: { businessId },
    select: { id: true, collectionChannel: true },
  });
  const feedbackLink = await tx.feedbackLink.create({
    data: {
      billId: bill.id,
      configId: feedbackConfig?.id ?? undefined,
    },
  });

  if (feedbackConfig?.collectionChannel) {
    const {
      logFeedbackLinkEmail,
      logFeedbackLinkSms,
      logFeedbackLinkWhatsApp,
    } = await import("@/lib/messaging");
    const businessWithSlug = await tx.business.findUnique({
      where: { id: businessId },
      select: { slug: true },
    });
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://dy.com";
    const feedbackUrl = `${baseUrl}/feedback/${businessWithSlug?.slug ?? ""}/${feedbackLink.token}`;

    if (
      feedbackConfig.collectionChannel === "WHATSAPP" ||
      feedbackConfig.collectionChannel === "SMS"
    ) {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        include: { user: { select: { phoneNumber: true } } },
      });
      const phone = customer?.user?.phoneNumber;
      if (phone) {
        if (feedbackConfig.collectionChannel === "WHATSAPP") {
          await logFeedbackLinkWhatsApp(tx, {
            businessId,
            recipient: phone,
            feedbackUrl,
            billNumber,
            sourceId: feedbackLink.id,
          });
        } else {
          await logFeedbackLinkSms(tx, {
            businessId,
            recipient: phone,
            feedbackUrl,
            billNumber,
            sourceId: feedbackLink.id,
          });
        }
      }
    } else if (feedbackConfig.collectionChannel === "EMAIL") {
      const emailRecipient =
        customerEmail ??
        (
          await tx.customer.findUnique({
            where: { id: customerId },
            select: { email: true },
          })
        )?.email;
      if (emailRecipient) {
        await logFeedbackLinkEmail(tx, {
          businessId,
          recipient: emailRecipient,
          feedbackUrl,
          billNumber,
          sourceId: feedbackLink.id,
        });
      }
    }
  }

  return bill.id;
}

type ShopifyLineItem = {
  product_id?: string | number | null;
  variant_id?: string | number | null;
  quantity?: number | null;
  price?: string | number | null;
  title?: string | null;
};

type ShopifyOrderPayload = {
  id?: string | number;
  email?: string | null;
  total_price?: string | number | null;
  subtotal_price?: string | number | null;
  fulfillment_status?: string | null;
  financial_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  order_number?: number | null;
  name?: string | null;
  contact_email?: string | null;
  line_items?: ShopifyLineItem[] | null;
};

type ShopifyRefundPayload = {
  order_id?: string | number;
  created_at?: string | null;
};

export async function POST(request: NextRequest) {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  // Use raw bytes for HMAC – request.text() can alter encoding; Shopify signs the exact body bytes
  const rawBodyBytes = await request.arrayBuffer();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const secretTrimmed = secret.trim();
  if (!verifyShopifyWebhook(rawBodyBytes, hmac, secretTrimmed)) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Shopify webhook] HMAC failed – debug:", {
        bodyByteLength: rawBodyBytes.byteLength,
        hasHmacHeader: !!hmac,
        hmacHeaderLength: hmac?.length ?? 0,
        secretLength: secretTrimmed.length,
      });
    }
    console.error(
      "[Shopify webhook] 401 HMAC failed. Check SHOPIFY_API_SECRET in .env matches the app Client secret (not Client ID) from Partner Dashboard → your app → Client credentials.",
    );
    return NextResponse.json(
      {
        error:
          "Invalid signature – check SHOPIFY_API_SECRET matches app Client secret",
      },
      { status: 401 },
    );
  }

  const rawBody = new TextDecoder().decode(rawBodyBytes);

  const topic = request.headers.get("x-shopify-topic") || "";
  const shopDomain = request.headers
    .get("x-shopify-shop-domain")
    ?.toLowerCase();
  if (!shopDomain) {
    return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
  }

  const store = await db.shopifyStore.findFirst({
    where: {
      shopDomain: shopDomain.includes(".myshopify.com")
        ? shopDomain
        : `${shopDomain}.myshopify.com`,
      isActive: true,
    },
  });
  if (!store) {
    console.error("[Shopify webhook] No store found for shop:", shopDomain);
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    if (topic === "orders/updated" || topic === "orders/create") {
      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch (parseErr) {
        console.error("[Shopify webhook] Invalid JSON body:", parseErr);
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }

      // Some webhook configs send { order: { ... } }, others send the order at root
      const order = (
        payload && typeof payload === "object" && "order" in payload
          ? (payload as { order: ShopifyOrderPayload }).order
          : (payload as ShopifyOrderPayload)
      ) as ShopifyOrderPayload;

      const orderId =
        order.id != null ? normalizeShopifyOrderId(order.id) : null;
      if (!orderId) {
        console.error("[Shopify webhook] No order id in payload");
        return NextResponse.json({ error: "No order id" }, { status: 400 });
      }

      const totalAmount = parseFloat(String(order.total_price ?? 0)) || 0;
      const fulfillmentStatus = order.fulfillment_status?.toString() || null;
      const financialStatus = order.financial_status?.toString() || null;
      const emailRaw = (order.email || order.contact_email)?.toString()?.trim();
      const email = emailRaw || `shopify-order-${orderId}@placeholder.dy`;

      if (process.env.NODE_ENV !== "production") {
        console.log("[Shopify webhook]", {
          topic,
          shop: shopDomain,
          orderId,
          totalAmount,
          hasLineItems:
            Array.isArray(order.line_items) && order.line_items.length > 0,
        });
      }

      await runTransaction(async (tx) => {
        const customerId = await findOrCreateCustomerByEmail(tx, {
          businessId: store.businessId,
          email,
          name: order.name ?? null,
        });

        const now = new Date();
        const returnWindowDays = store.returnWindowDays ?? 7;
        const returnWindowEndsAt = new Date(now);
        returnWindowEndsAt.setDate(
          returnWindowEndsAt.getDate() + returnWindowDays,
        );

        const existing = await tx.shopifyOrder.findUnique({
          where: {
            shopifyStoreId_shopifyOrderId: {
              shopifyStoreId: store.id,
              shopifyOrderId: orderId,
            },
          },
        });

        if (existing?.refundedAt) {
          return;
        }
        if (
          existing?.loyaltyGrantedAt &&
          fulfillmentStatus !== "fulfilled" &&
          !existing.refundedAt
        ) {
          await deductLoyaltyForShopifyOrderRefund(tx, {
            shopifyOrderId: existing.id,
          });
          await tx.shopifyOrder.update({
            where: { id: existing.id },
            data: {
              refundedAt: new Date(),
              financialStatus: financialStatus ?? undefined,
              fulfillmentStatus: fulfillmentStatus ?? undefined,
            },
          });
        }

        let billId: string | null = existing?.billId ?? null;
        if (!billId) {
          billId = await createBillFromShopifyOrder(tx, {
            storeId: store.id,
            businessId: store.businessId,
            customerId,
            customerEmail: email,
            orderId,
            orderNumber: order.order_number ?? null,
            totalAmount,
            lineItems: order.line_items ?? [],
          });
          if (process.env.NODE_ENV !== "production") {
            console.log(
              "[Shopify webhook] Bill created:",
              billId,
              "for order:",
              orderId,
            );
          }
        }

        const fulfilledAt = fulfillmentStatus === "fulfilled" ? now : null;

        await tx.shopifyOrder.upsert({
          where: {
            shopifyStoreId_shopifyOrderId: {
              shopifyStoreId: store.id,
              shopifyOrderId: orderId,
            },
          },
          create: {
            shopifyStoreId: store.id,
            shopifyOrderId: orderId,
            businessId: store.businessId,
            customerId,
            totalAmount,
            fulfillmentStatus,
            financialStatus,
            fulfilledAt,
            returnWindowEndsAt: fulfilledAt ? returnWindowEndsAt : null,
            billId,
          },
          update: {
            totalAmount,
            fulfillmentStatus,
            financialStatus,
            fulfilledAt: fulfilledAt ?? undefined,
            returnWindowEndsAt: fulfilledAt ? returnWindowEndsAt : undefined,
            billId: billId ?? undefined,
          },
        });

        const isFinanciallyClosed =
          financialStatus === "refunded" || financialStatus === "voided";
        if (
          fulfillmentStatus === "fulfilled" &&
          !existing?.loyaltyGrantedAt &&
          !isFinanciallyClosed
        ) {
          const loyalty = await tx.loyalty.findUnique({
            where: { businessId: store.businessId },
            select: { id: true },
          });
          const orderRecord = await tx.shopifyOrder.findUnique({
            where: {
              shopifyStoreId_shopifyOrderId: {
                shopifyStoreId: store.id,
                shopifyOrderId: orderId,
              },
            },
          });
          if (!orderRecord) return;

          const loyaltyResult = await applyLoyaltyForShopifyOrder(tx, {
            businessId: store.businessId,
            customerId,
            shopifyOrderId: orderRecord.id,
            orderTotalAmount: totalAmount,
            returnWindowEndsAt,
            loyaltyId: loyalty?.id ?? null,
            billId: orderRecord.billId ?? undefined,
          });

          await tx.shopifyOrder.update({
            where: { id: orderRecord.id },
            data: { loyaltyGrantedAt: now },
          });

          if (orderRecord.billId) {
            await tx.bill.update({
              where: { id: orderRecord.billId },
              data: {
                cashbackAmount: loyaltyResult.cashbackAmount,
                userPaidAmount: totalAmount,
              },
            });
          }
        }
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (topic === "orders/cancelled") {
      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      // Shopify may send { order: { ... } } or the order at root
      const order = (
        payload && typeof payload === "object" && "order" in payload
          ? (payload as { order: ShopifyOrderPayload }).order
          : (payload as ShopifyOrderPayload)
      ) as ShopifyOrderPayload;
      const orderId =
        order?.id != null ? normalizeShopifyOrderId(order.id) : null;
      if (!orderId) {
        return NextResponse.json({ error: "No order id" }, { status: 400 });
      }

      await runTransaction(async (tx) => {
        const orderRecord = await tx.shopifyOrder.findUnique({
          where: {
            shopifyStoreId_shopifyOrderId: {
              shopifyStoreId: store.id,
              shopifyOrderId: orderId,
            },
          },
        });
        if (!orderRecord || orderRecord.refundedAt) return;
        if (orderRecord.loyaltyGrantedAt) {
          await deductLoyaltyForShopifyOrderRefund(tx, {
            shopifyOrderId: orderRecord.id,
          });
        }
        await tx.shopifyOrder.update({
          where: { id: orderRecord.id },
          data: { refundedAt: new Date(), financialStatus: "voided" },
        });
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (topic === "orders/delete") {
      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      const order = (
        payload && typeof payload === "object" && "order" in payload
          ? (payload as { order: ShopifyOrderPayload }).order
          : (payload as ShopifyOrderPayload)
      ) as ShopifyOrderPayload;
      const orderId =
        order?.id != null ? normalizeShopifyOrderId(order.id) : null;
      if (!orderId) {
        return NextResponse.json({ error: "No order id" }, { status: 400 });
      }

      await runTransaction(async (tx) => {
        const orderRecord = await tx.shopifyOrder.findUnique({
          where: {
            shopifyStoreId_shopifyOrderId: {
              shopifyStoreId: store.id,
              shopifyOrderId: orderId,
            },
          },
        });
        if (!orderRecord || orderRecord.refundedAt) return;
        if (orderRecord.loyaltyGrantedAt) {
          await deductLoyaltyForShopifyOrderRefund(tx, {
            shopifyOrderId: orderRecord.id,
          });
        }
        await tx.shopifyOrder.update({
          where: { id: orderRecord.id },
          data: { refundedAt: new Date(), financialStatus: "voided" },
        });
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (topic === "refunds/create") {
      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      // Shopify may send { refund: { order_id: ... } } or the refund at root
      const refund = (
        payload && typeof payload === "object" && "refund" in payload
          ? (payload as { refund: ShopifyRefundPayload }).refund
          : (payload as ShopifyRefundPayload)
      ) as ShopifyRefundPayload;
      const orderId =
        refund?.order_id != null
          ? normalizeShopifyOrderId(refund.order_id)
          : null;
      if (!orderId) {
        return NextResponse.json(
          { error: "No order_id in refund" },
          { status: 400 },
        );
      }

      await runTransaction(async (tx) => {
        const orderRecord = await tx.shopifyOrder.findUnique({
          where: {
            shopifyStoreId_shopifyOrderId: {
              shopifyStoreId: store.id,
              shopifyOrderId: orderId,
            },
          },
        });
        if (!orderRecord || orderRecord.refundedAt) return;
        if (orderRecord.loyaltyGrantedAt) {
          await deductLoyaltyForShopifyOrderRefund(tx, {
            shopifyOrderId: orderRecord.id,
          });
        }
        await tx.shopifyOrder.update({
          where: { id: orderRecord.id },
          data: { refundedAt: new Date(), financialStatus: "refunded" },
        });
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    // Duplicate (store + orderId already exists): treat as success so Shopify doesn't retry
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code: string }).code
        : null;
    if (code === "P2002") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.error("[Shopify webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
