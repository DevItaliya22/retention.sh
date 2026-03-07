import { db } from "@reelo/db";
import type { DemoScenarioKey } from "../types";
import { CookieSessionClient } from "./http";
import type { RuntimeAccount, TestResult } from "./types";

interface SessionAccount {
  account: RuntimeAccount;
  client: CookieSessionClient;
}

const RUN_NONCE = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function billNumber(key: string): string {
  return `T-${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function phoneFromTag(tag: string): string {
  const clean = `${RUN_NONCE}-${tag}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  let hash = 0;
  for (let i = 0; i < clean.length; i += 1) {
    hash = (hash * 31 + clean.charCodeAt(i)) % 1_000_000_000;
  }
  const tail = String(Math.abs(hash)).padStart(9, "0").slice(0, 9);
  // Indian mobile numbers must start with 6-9.
  return `+919${tail}`;
}

function result(
  name: string,
  accountKey: DemoScenarioKey | "global",
  passed: boolean,
  status?: number,
  details?: string,
): TestResult {
  return { name, accountKey, passed, status, details };
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

async function loginCashier(
  baseUrl: string,
  account: RuntimeAccount,
): Promise<SessionAccount> {
  const client = new CookieSessionClient(baseUrl);
  const login = await client.request<{ session?: unknown; error?: string }>(
    "POST",
    "/api/auth/cashier/login",
    {
      businessSlug: account.businessSlug,
      cashierSlug: account.cashierSlug,
      email: account.cashierEmail,
      password: account.cashierPassword,
    },
  );

  if (!login.ok) {
    throw new Error(
      `Cashier login failed for ${account.accountKey}: ${login.status} ${login.text}`,
    );
  }

  return { account, client };
}

function basePayload(sess: SessionAccount, phone: string, subtotal = 1800) {
  return {
    billNumber: billNumber(sess.account.accountKey),
    phoneNumber: phone,
    name: `Test ${sess.account.accountKey}`,
    subtotal,
    storeDiscount: 100,
    tax: [18],
    lineItems: [
      {
        skuId: sess.account.activeSkuId,
        qty: 1,
        unitPrice: subtotal,
      },
    ],
    paymentMethod: "UPI",
  };
}

async function createBill(
  sess: SessionAccount,
  payload: Record<string, unknown>,
) {
  return sess.client.request<any>("POST", "/api/cashier/bill", payload);
}

async function submitFeedbackForBill(
  sess: SessionAccount,
  billId: string,
): Promise<boolean> {
  const link = await db.feedbackLink.findUnique({
    where: { billId },
    select: { token: true },
  });
  if (!link?.token) return false;

  const submit = await sess.client.request<any>(
    "POST",
    `/api/feedback/${sess.account.businessSlug}/${link.token}`,
    {
      rating: 5,
      comment: "Partner test feedback reward",
      selectedCategories: ["Service"],
      selectedSelectionOptionIds: [],
    },
  );
  return submit.ok;
}

async function fetchPreview(
  sess: SessionAccount,
  phoneNumber: string,
  billAmount: number,
) {
  const qs = new URLSearchParams({
    phone: phoneNumber,
    businessId: sess.account.businessId,
    billAmount: String(billAmount),
    subtotal: String(billAmount),
  });
  return sess.client.request<any>(
    "GET",
    `/api/cashier/loyalty/preview?${qs.toString()}`,
  );
}

async function runSingleAccountBillTests(
  sess: SessionAccount,
): Promise<TestResult[]> {
  const out: TestResult[] = [];
  const phone = phoneFromTag(`${sess.account.accountKey}-base`);

  const valid = await createBill(sess, basePayload(sess, phone));
  out.push(
    result(
      "valid bill should succeed",
      sess.account.accountKey,
      valid.ok,
      valid.status,
      valid.ok ? undefined : valid.text,
    ),
  );

  const hasLoyalty = !!(valid.data as any)?.loyalty;
  const campaignDiscount = Number(
    (valid.data as any)?.campaignDiscount?.totalDiscount ??
      (valid.data as any)?.bill?.campaignDiscountAmount ??
      0,
  );
  const billFinalAmount = Number((valid.data as any)?.bill?.finalAmount ?? 0);
  const billUserPaid = Number((valid.data as any)?.bill?.userPaidAmount ?? -1);
  const approxExpected = Math.max(0, billFinalAmount - campaignDiscount);
  const campaignAndLoyaltyValid =
    valid.ok && hasLoyalty && campaignDiscount >= 0 && billUserPaid >= 0;

  out.push(
    result(
      "campaign + loyalty payload present and bill amount sane",
      sess.account.accountKey,
      campaignAndLoyaltyValid,
      valid.status,
      `campaignDiscount=${campaignDiscount} final=${billFinalAmount} userPaid=${billUserPaid}`,
    ),
  );

  out.push(
    result(
      "campaign discount should reduce payable when discount exists",
      sess.account.accountKey,
      campaignDiscount <= 0 || billUserPaid <= approxExpected + 0.01,
      valid.status,
      `expected<=${approxExpected.toFixed(2)} got=${billUserPaid.toFixed(2)}`,
    ),
  );

  out.push(
    result(
      "bill monetary fields should be finite and bounded",
      sess.account.accountKey,
      valid.ok &&
        isFiniteNumber(campaignDiscount) &&
        isFiniteNumber(billFinalAmount) &&
        isFiniteNumber(billUserPaid) &&
        billUserPaid <= billFinalAmount + 0.01,
      valid.status,
      `campaign=${campaignDiscount} final=${billFinalAmount} userPaid=${billUserPaid}`,
    ),
  );

  const negativeCashback = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-neg-cb`)),
    redeemCashback: -999,
  });
  out.push(
    result(
      "negative redeemCashback rejected",
      sess.account.accountKey,
      negativeCashback.status === 400,
      negativeCashback.status,
      negativeCashback.text,
    ),
  );

  const negativePoints = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-neg-pts`)),
    redeemPoints: -999,
  });
  out.push(
    result(
      "negative redeemPoints rejected",
      sess.account.accountKey,
      negativePoints.status === 400,
      negativePoints.status,
      negativePoints.text,
    ),
  );

  const negativePartnerCashback = await createBill(sess, {
    ...basePayload(
      sess,
      phoneFromTag(`${sess.account.accountKey}-neg-partner`),
    ),
    redeemFromPartnerBusinessId: crypto.randomUUID(),
    redeemPartnerCashback: -10,
  });
  out.push(
    result(
      "negative partner cashback rejected",
      sess.account.accountKey,
      negativePartnerCashback.status === 400,
      negativePartnerCashback.status,
      negativePartnerCashback.text,
    ),
  );

  const missingSubtotal = await createBill(sess, {
    billNumber: billNumber(sess.account.accountKey),
    phoneNumber: phoneFromTag(`${sess.account.accountKey}-missing-subtotal`),
    name: "No subtotal",
  });
  out.push(
    result(
      "missing subtotal and lineItems rejected",
      sess.account.accountKey,
      missingSubtotal.status === 400,
      missingSubtotal.status,
      missingSubtotal.text,
    ),
  );

  const blankBillNumber = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-blank-bn`)),
    billNumber: "",
  });
  out.push(
    result(
      "blank bill number rejected",
      sess.account.accountKey,
      blankBillNumber.status === 400,
      blankBillNumber.status,
      blankBillNumber.text,
    ),
  );

  const duplicateBillNumber = billNumber(`${sess.account.accountKey}-dup-seq`);
  const duplicateFirst = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-dup-first`)),
    billNumber: duplicateBillNumber,
  });
  const duplicateSecond = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-dup-second`)),
    billNumber: duplicateBillNumber,
  });
  out.push(
    result(
      "duplicate bill number should be rejected on second create",
      sess.account.accountKey,
      duplicateFirst.ok && duplicateSecond.status === 409,
      duplicateSecond.status,
      duplicateSecond.text,
    ),
  );

  const invalidSku = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-bad-sku`)),
    lineItems: [{ skuId: "invalid", qty: 1, unitPrice: 100 }],
  });
  out.push(
    result(
      "invalid sku format rejected",
      sess.account.accountKey,
      invalidSku.status === 400,
      invalidSku.status,
      invalidSku.text,
    ),
  );

  const inactiveSku = await createBill(sess, {
    ...basePayload(
      sess,
      phoneFromTag(`${sess.account.accountKey}-inactive-sku`),
    ),
    lineItems: [{ skuId: sess.account.inactiveSkuId, qty: 1, unitPrice: 100 }],
  });
  out.push(
    result(
      "inactive sku rejected",
      sess.account.accountKey,
      inactiveSku.status === 400,
      inactiveSku.status,
      inactiveSku.text,
    ),
  );

  const hugeValues = await createBill(sess, {
    ...basePayload(
      sess,
      phoneFromTag(`${sess.account.accountKey}-huge`),
      99_999_999,
    ),
    storeDiscount: 1,
    tax: [18, 18, 18],
  });
  const userPaid = Number((hugeValues.data as any)?.bill?.userPaidAmount ?? -1);
  out.push(
    result(
      "huge values should not crash or go negative",
      sess.account.accountKey,
      hugeValues.ok && userPaid >= 0,
      hugeValues.status,
      hugeValues.ok ? `userPaid=${userPaid}` : hugeValues.text,
    ),
  );

  const longBillNumber = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-long-bill`)),
    billNumber: "x".repeat(400),
  });
  out.push(
    result(
      "very long bill number rejected",
      sess.account.accountKey,
      longBillNumber.status === 400,
      longBillNumber.status,
      longBillNumber.text,
    ),
  );

  const blankPhone = await createBill(sess, {
    ...basePayload(
      sess,
      phoneFromTag(`${sess.account.accountKey}-blank-phone`),
    ),
    phoneNumber: "",
  });
  out.push(
    result(
      "blank phone rejected",
      sess.account.accountKey,
      blankPhone.status === 400,
      blankPhone.status,
      blankPhone.text,
    ),
  );

  const malformedPhone = await createBill(sess, {
    ...basePayload(
      sess,
      phoneFromTag(`${sess.account.accountKey}-malformed-phone`),
    ),
    phoneNumber: "not-a-phone",
  });
  out.push(
    result(
      "malformed phone should be rejected",
      sess.account.accountKey,
      malformedPhone.status >= 400 && malformedPhone.status < 500,
      malformedPhone.status,
      malformedPhone.text,
    ),
  );

  const negativeTax = await createBill(sess, {
    ...basePayload(
      sess,
      phoneFromTag(`${sess.account.accountKey}-negative-tax`),
    ),
    tax: [-18],
  });
  out.push(
    result(
      "negative tax value rejected",
      sess.account.accountKey,
      negativeTax.status === 400,
      negativeTax.status,
      negativeTax.text,
    ),
  );

  const qtyZero = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-qty-zero`)),
    lineItems: [{ skuId: sess.account.activeSkuId, qty: 0, unitPrice: 100 }],
  });
  out.push(
    result(
      "line item qty=0 rejected",
      sess.account.accountKey,
      qtyZero.status === 400,
      qtyZero.status,
      qtyZero.text,
    ),
  );

  const negativeUnitPrice = await createBill(sess, {
    ...basePayload(sess, phoneFromTag(`${sess.account.accountKey}-unit-neg`)),
    lineItems: [{ skuId: sess.account.activeSkuId, qty: 1, unitPrice: -1 }],
  });
  out.push(
    result(
      "line item negative unit price rejected",
      sess.account.accountKey,
      negativeUnitPrice.status === 400,
      negativeUnitPrice.status,
      negativeUnitPrice.text,
    ),
  );

  const raceBillNumber = billNumber(`${sess.account.accountKey}-dup-race`);
  const raceCalls = Array.from({ length: 5 }).map((_, idx) =>
    createBill(sess, {
      ...basePayload(
        sess,
        phoneFromTag(`${sess.account.accountKey}-race-${idx}`),
      ),
      billNumber: raceBillNumber,
    }),
  );
  const raceResults = await Promise.all(raceCalls);
  const raceSuccessCount = raceResults.filter((r) => r.ok).length;
  const raceConflictCount = raceResults.filter((r) => r.status === 409).length;
  out.push(
    result(
      "duplicate bill number race should allow only one success",
      sess.account.accountKey,
      raceSuccessCount === 1 && raceConflictCount >= 1,
      undefined,
      `success=${raceSuccessCount} conflict=${raceConflictCount}`,
    ),
  );

  return out;
}

async function runFeedbackRewardTest(
  cashbackSess: SessionAccount,
): Promise<TestResult[]> {
  const out: TestResult[] = [];

  const phone = phoneFromTag("feedback-flow-01");
  const bill = await createBill(
    cashbackSess,
    basePayload(cashbackSess, phone, 2400),
  );
  if (!bill.ok) {
    out.push(
      result(
        "feedback setup bill should succeed",
        "cashback",
        false,
        bill.status,
        bill.text,
      ),
    );
    return out;
  }

  const billId = String((bill.data as any)?.bill?.id ?? "");
  const customerId = String((bill.data as any)?.bill?.customerId ?? "");

  const beforeWallet = await db.wallet.findUnique({
    where: {
      businessId_customerId: {
        businessId: cashbackSess.account.businessId,
        customerId,
      },
    },
    select: { cashbackBalance: true },
  });

  const link = await db.feedbackLink.findUnique({
    where: { billId },
    select: { token: true },
  });

  if (!link?.token) {
    out.push(result("feedback link should exist for bill", "cashback", false));
    return out;
  }

  const submit = await cashbackSess.client.request<any>(
    "POST",
    `/api/feedback/${cashbackSess.account.businessSlug}/${link.token}`,
    {
      rating: 5,
      comment: "Automated brutal feedback test",
      selectedCategories: ["Service"],
      selectedSelectionOptionIds: [],
    },
  );

  out.push(
    result(
      "feedback submit should succeed",
      "cashback",
      submit.ok,
      submit.status,
      submit.ok ? undefined : submit.text,
    ),
  );

  const rewardEnabled = Boolean((submit.data as any)?.reward?.enabled);
  out.push(
    result(
      "feedback submit should return reward payload",
      "cashback",
      submit.ok && rewardEnabled,
      submit.status,
      `rewardEnabled=${rewardEnabled}`,
    ),
  );

  const submitAgain = await cashbackSess.client.request<any>(
    "POST",
    `/api/feedback/${cashbackSess.account.businessSlug}/${link.token}`,
    {
      rating: 4,
      comment: "Second submit should fail",
      selectedCategories: ["Service"],
      selectedSelectionOptionIds: [],
    },
  );
  out.push(
    result(
      "feedback submit twice should be blocked",
      "cashback",
      submitAgain.status === 400,
      submitAgain.status,
      submitAgain.text,
    ),
  );

  const afterWallet = await db.wallet.findUnique({
    where: {
      businessId_customerId: {
        businessId: cashbackSess.account.businessId,
        customerId,
      },
    },
    select: { cashbackBalance: true },
  });

  const delta =
    Number(afterWallet?.cashbackBalance ?? 0) -
    Number(beforeWallet?.cashbackBalance ?? 0);
  out.push(
    result(
      "feedback reward should increase wallet cashback",
      "cashback",
      delta >= 20,
      submit.status,
      `walletDelta=${delta}`,
    ),
  );

  return out;
}

async function runReferralLockingTest(
  cashbackSess: SessionAccount,
): Promise<TestResult[]> {
  const out: TestResult[] = [];

  const referrerPhone = phoneFromTag("ref-lock-referrer");
  let referredPhone = phoneFromTag("ref-lock-referred");

  const seedReferrer = await createBill(cashbackSess, {
    billNumber: billNumber("cashback-ref-seed"),
    phoneNumber: referrerPhone,
    name: "Referral Locker",
    subtotal: 0,
    storeDiscount: 0,
    tax: [],
    paymentMethod: "UPI",
  });

  out.push(
    result(
      "referral lock setup bill should succeed",
      "cashback",
      seedReferrer.ok,
      seedReferrer.status,
      seedReferrer.ok ? undefined : seedReferrer.text,
    ),
  );

  if (!seedReferrer.ok) return out;

  const referrerCustomerId = String(
    (seedReferrer.data as any)?.bill?.customerId ?? "",
  );
  const referrerBc = await db.businessCustomer.findUnique({
    where: {
      businessId_customerId: {
        businessId: cashbackSess.account.businessId,
        customerId: referrerCustomerId,
      },
    },
    select: { referralSlug: true },
  });

  if (!referrerBc?.referralSlug) {
    out.push(result("referral slug should exist", "cashback", false));
    return out;
  }

  // Ensure referred phone is not already linked in this business.
  for (let i = 0; i < 8; i += 1) {
    const existing = await db.businessCustomer.findFirst({
      where: {
        businessId: cashbackSess.account.businessId,
        customer: {
          user: {
            phoneNumber: referredPhone,
          },
        },
      },
      select: { customerId: true },
    });
    if (!existing) break;
    referredPhone = phoneFromTag(`ref-lock-referred-${i + 1}`);
  }

  const claim = await cashbackSess.client.request<any>(
    "POST",
    "/api/referral/claim",
    {
      referralSlug: referrerBc.referralSlug,
      phoneNumber: referredPhone,
      name: "Referred Locked Customer",
    },
  );

  out.push(
    result(
      "referral claim should succeed",
      "cashback",
      claim.ok,
      claim.status,
      claim.ok ? undefined : claim.text,
    ),
  );

  if (!claim.ok) return out;

  const duplicateClaim = await cashbackSess.client.request<any>(
    "POST",
    "/api/referral/claim",
    {
      referralSlug: referrerBc.referralSlug,
      phoneNumber: referredPhone,
      name: "Referred Locked Customer",
    },
  );
  out.push(
    result(
      "duplicate referral claim for same phone should fail",
      "cashback",
      duplicateClaim.status === 400,
      duplicateClaim.status,
      duplicateClaim.text,
    ),
  );

  const previewBefore = await fetchPreview(cashbackSess, referrerPhone, 1200);
  const redeemableBefore = Number(
    (previewBefore.data as any)?.preview?.redeemablePoints ?? 0,
  );
  out.push(
    result(
      "referrer reward should be locked before referred first bill",
      "cashback",
      previewBefore.ok && redeemableBefore <= 0.01,
      previewBefore.status,
      `redeemableBefore=${redeemableBefore}`,
    ),
  );

  const referredFirstBill = await createBill(cashbackSess, {
    ...basePayload(cashbackSess, referredPhone, 1600),
    name: "Referred Locked Customer",
  });

  out.push(
    result(
      "referred customer first bill should succeed",
      "cashback",
      referredFirstBill.ok,
      referredFirstBill.status,
      referredFirstBill.ok ? undefined : referredFirstBill.text,
    ),
  );

  if (referredFirstBill.ok) {
    const previewAfter = await fetchPreview(cashbackSess, referrerPhone, 1200);
    const redeemableAfter = Number(
      (previewAfter.data as any)?.preview?.redeemablePoints ?? 0,
    );
    out.push(
      result(
        "referrer reward unlocks after referred first bill",
        "cashback",
        previewAfter.ok && redeemableAfter > 0,
        previewAfter.status,
        `redeemableAfter=${redeemableAfter}`,
      ),
    );
  }

  return out;
}

async function runPartnerFlowTests(
  leftSess: SessionAccount,
  rightSess: SessionAccount,
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const sharedPhone = phoneFromTag("partner-shared-2026");

  const earnLeft = await createBill(leftSess, {
    ...basePayload(leftSess, sharedPhone, 4200),
    phoneNumber: sharedPhone,
  });
  const earnRight = await createBill(rightSess, {
    ...basePayload(rightSess, sharedPhone, 3900),
    phoneNumber: sharedPhone,
  });

  results.push(
    result(
      "partner setup earn bill left",
      "partner_left",
      earnLeft.ok,
      earnLeft.status,
      earnLeft.ok ? undefined : earnLeft.text,
    ),
  );
  results.push(
    result(
      "partner setup earn bill right",
      "partner_right",
      earnRight.ok,
      earnRight.status,
      earnRight.ok ? undefined : earnRight.text,
    ),
  );

  if (!earnLeft.ok || !earnRight.ok) return results;

  // /api/cashier/bill defers loyalty earn; feedback reward gives real wallet cashback via API.
  const leftBillId = String((earnLeft.data as any)?.bill?.id ?? "");
  const rightBillId = String((earnRight.data as any)?.bill?.id ?? "");
  const leftFeedbackOk =
    leftBillId.length > 0
      ? await submitFeedbackForBill(leftSess, leftBillId)
      : false;
  const rightFeedbackOk =
    rightBillId.length > 0
      ? await submitFeedbackForBill(rightSess, rightBillId)
      : false;

  results.push(
    result(
      "left feedback reward seed should succeed",
      "partner_left",
      leftFeedbackOk,
      leftFeedbackOk ? 200 : 500,
    ),
  );
  results.push(
    result(
      "right feedback reward seed should succeed",
      "partner_right",
      rightFeedbackOk,
      rightFeedbackOk ? 200 : 500,
    ),
  );

  const leftPreview = await fetchPreview(leftSess, sharedPhone, 2200);
  const rightPreview = await fetchPreview(rightSess, sharedPhone, 2200);
  const leftPreviewHigh = await fetchPreview(leftSess, sharedPhone, 100_000);
  const rightPreviewHigh = await fetchPreview(rightSess, sharedPhone, 100_000);

  const leftPartners = [
    ...((leftPreview.data as any)?.preview?.partnerRedeemable ?? []),
    ...((leftPreviewHigh.data as any)?.preview?.partnerRedeemable ?? []),
  ];
  const rightPartners = [
    ...((rightPreview.data as any)?.preview?.partnerRedeemable ?? []),
    ...((rightPreviewHigh.data as any)?.preview?.partnerRedeemable ?? []),
  ];
  const leftPartner = leftPartners.find(
    (p: any) => p.partnerBusinessId === rightSess.account.businessId,
  );
  const rightPartner = rightPartners.find(
    (p: any) => p.partnerBusinessId === leftSess.account.businessId,
  );

  results.push(
    result(
      "left preview should include right partner",
      "partner_left",
      (leftPreview.ok || leftPreviewHigh.ok) && !!leftPartner,
      leftPreview.status,
      `previewCount=${leftPartners.length}`,
    ),
  );
  results.push(
    result(
      "right preview should include left partner",
      "partner_right",
      (rightPreview.ok || rightPreviewHigh.ok) && !!rightPartner,
      rightPreview.status,
      `previewCount=${rightPartners.length}`,
    ),
  );

  if (!leftPartner || !rightPartner) return results;

  const leftBeforePartnerBalance = Number(leftPartner.balance ?? 0);
  const leftRedeemAmount = Math.max(
    1,
    Math.min(40, Math.floor(Number(leftPartner.maxRedeemableOnBill) || 0)),
  );

  const leftRedeem = await createBill(leftSess, {
    ...basePayload(leftSess, sharedPhone, 2100),
    phoneNumber: sharedPhone,
    redeemFromPartnerBusinessId: rightSess.account.businessId,
    redeemPartnerCashback: leftRedeemAmount,
  });

  const leftBillPartnerRedeemed = Number(
    (leftRedeem.data as any)?.bill?.partnerRedeemedAmount ?? 0,
  );
  const leftCampaignDiscount = Number(
    (leftRedeem.data as any)?.bill?.campaignDiscountAmount ??
      (leftRedeem.data as any)?.campaignDiscount?.totalDiscount ??
      0,
  );
  const leftLoyaltyCashback = Number(
    (leftRedeem.data as any)?.bill?.cashbackAmount ??
      (leftRedeem.data as any)?.loyalty?.cashbackAmount ??
      0,
  );

  results.push(
    result(
      "left should redeem from right partner",
      "partner_left",
      leftRedeem.ok && leftBillPartnerRedeemed > 0,
      leftRedeem.status,
      leftRedeem.ok
        ? `partnerRedeemed=${leftBillPartnerRedeemed}`
        : leftRedeem.text,
    ),
  );

  results.push(
    result(
      "partner bill should still process campaign and loyalty",
      "partner_left",
      leftRedeem.ok && leftCampaignDiscount >= 0 && leftLoyaltyCashback >= 0,
      leftRedeem.status,
      `campaign=${leftCampaignDiscount} loyaltyCashback=${leftLoyaltyCashback}`,
    ),
  );

  const leftPreviewAfter = await fetchPreview(leftSess, sharedPhone, 2200);
  const leftPartnerAfter = (
    (leftPreviewAfter.data as any)?.preview?.partnerRedeemable ?? []
  ).find((p: any) => p.partnerBusinessId === rightSess.account.businessId);
  const leftAfterPartnerBalance = Number(leftPartnerAfter?.balance ?? 0);

  results.push(
    result(
      "partner balance should reduce after cross redemption",
      "partner_left",
      leftRedeem.ok && leftAfterPartnerBalance <= leftBeforePartnerBalance,
      leftPreviewAfter.status,
      `before=${leftBeforePartnerBalance} after=${leftAfterPartnerBalance}`,
    ),
  );

  const rightRedeemAmount = Math.max(
    1,
    Math.min(35, Math.floor(Number(rightPartner.maxRedeemableOnBill) || 0)),
  );
  const rightRedeem = await createBill(rightSess, {
    ...basePayload(rightSess, sharedPhone, 2050),
    phoneNumber: sharedPhone,
    redeemFromPartnerBusinessId: leftSess.account.businessId,
    redeemPartnerCashback: rightRedeemAmount,
  });
  results.push(
    result(
      "right should redeem from left partner",
      "partner_right",
      rightRedeem.ok &&
        Number((rightRedeem.data as any)?.bill?.partnerRedeemedAmount ?? 0) > 0,
      rightRedeem.status,
      rightRedeem.ok ? undefined : rightRedeem.text,
    ),
  );

  const tooHighPartner = await createBill(leftSess, {
    ...basePayload(leftSess, sharedPhone, 2100),
    phoneNumber: sharedPhone,
    redeemFromPartnerBusinessId: rightSess.account.businessId,
    redeemPartnerCashback: leftRedeemAmount * 200,
  });
  results.push(
    result(
      "too high partner redemption should fail",
      "partner_left",
      !tooHighPartner.ok,
      tooHighPartner.status,
      tooHighPartner.text,
    ),
  );

  const invalidPartner = await createBill(leftSess, {
    ...basePayload(leftSess, sharedPhone, 2100),
    phoneNumber: sharedPhone,
    redeemFromPartnerBusinessId: crypto.randomUUID(),
    redeemPartnerCashback: 10,
  });
  results.push(
    result(
      "invalid partner business should fail",
      "partner_left",
      !invalidPartner.ok,
      invalidPartner.status,
      invalidPartner.text,
    ),
  );

  return results;
}

export async function runApiBrutalTests(
  baseUrl: string,
  runtimeAccounts: Map<DemoScenarioKey, RuntimeAccount>,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const keysToTest: DemoScenarioKey[] = [
    "cashback",
    "tier",
    "amount_spent",
    "visit_made",
  ];

  const sessions = new Map<DemoScenarioKey, SessionAccount>();

  for (const key of keysToTest) {
    const account = runtimeAccounts.get(key);
    if (!account) continue;
    const sess = await loginCashier(baseUrl, account);
    sessions.set(key, sess);
    results.push(...(await runSingleAccountBillTests(sess)));
  }

  const cashbackSess = sessions.get("cashback");
  if (cashbackSess) {
    results.push(...(await runFeedbackRewardTest(cashbackSess)));
    results.push(...(await runReferralLockingTest(cashbackSess)));
  }

  const leftAccount = runtimeAccounts.get("partner_left");
  const rightAccount = runtimeAccounts.get("partner_right");
  if (leftAccount && rightAccount) {
    const leftSess = await loginCashier(baseUrl, leftAccount);
    const rightSess = await loginCashier(baseUrl, rightAccount);
    results.push(...(await runPartnerFlowTests(leftSess, rightSess)));
  }

  return results;
}
