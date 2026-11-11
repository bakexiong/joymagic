import { randomUUID } from "crypto";

import { and, eq } from "drizzle-orm";
import {
  PaymentInterval,
  PaymentType,
} from "@/extensions/payment/types";
import { db } from "@/core/db";
import { credit, order, subscription } from "@/config/db/schema";
import {
  createAffiliateCommissionFromPaidOrder,
  createAffiliateCommissionFromRenewal,
} from "@/shared/models/affiliate";
import { getSnowId, getUuid } from "@/shared/lib/hash";
import {
  calculateCreditExpirationTime,
  CreditStatus,
  CreditTransactionScene,
  CreditTransactionType,
  type NewCredit,
} from "@/shared/models/credit";
import {
  createGooglePlayEvent,
  findGooglePlayPurchaseByToken,
  findGooglePlayPurchaseByServerOrderNo,
  getGooglePlayEntitlementsByUserId,
  getGooglePlayPurchasesByUserId,
  saveGooglePlayPurchase,
  type GooglePlayPurchase,
  type NewGooglePlayPurchase,
} from "@/shared/models/google-play-iap";
import { getAllConfigs } from "@/shared/models/config";
import {
  OrderStatus,
  updateSubscriptionInTransaction,
  type NewOrder,
} from "@/shared/models/order";
import {
  SubscriptionStatus,
  updateSubscriptionBySubscriptionNo,
  type NewSubscription,
} from "@/shared/models/subscription";

type ProductType = "inapp" | "subs";

type VerifyRequest = {
  userId: string;
  packageName: string;
  productId: string;
  productType: ProductType;
  purchaseToken: string;
  orderId?: string;
  purchaseTime?: string;
  clientTraceId?: string;
  idempotencyKey?: string | null;
  notificationType?: string | null;
  restoreTaskId?: string | null;
};

type GoogleProductMapping = {
  entitlementCode?: string;
  entitlementType?: "one_time" | "subscription";
  productName?: string;
  planName?: string;
  creditsAmount?: number;
  creditsValidDays?: number;
  amount?: number;
  currency?: string;
  paymentProductId?: string;
  interval?: "day" | "week" | "month" | "year";
  intervalCount?: number;
  trialPeriodDays?: number;
};

type VerifiedPurchase = {
  packageName: string;
  productId: string;
  productType: ProductType;
  purchaseToken: string;
  orderId?: string;
  verifyStatus: string;
  purchaseState: string;
  acknowledgementState: number;
  entitlementCode: string;
  entitlementStatus: string;
  purchaseTime: Date | null;
  startAt: Date | null;
  expireAt: Date | null;
  rawPayload: Record<string, unknown>;
};

type RtdnEnvelope = {
  message?: {
    data?: string;
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
};

type ParsedRtdnMessage = {
  packageName: string;
  productId: string;
  productType: ProductType;
  purchaseToken: string;
  notificationType: string;
  rawPayload: Record<string, unknown>;
};

const GOOGLE_PLAY_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_PLAY_API_BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

let cachedAccessToken: { token: string; expireAt: number } | null = null;

function getConfigValue(configs: Record<string, string>, key: string, fallbackEnvKey?: string) {
  const configValue = configs[key];
  if (configValue !== undefined && configValue !== null && configValue !== "") {
    return configValue;
  }

  return fallbackEnvKey ? process.env[fallbackEnvKey] || "" : "";
}

async function getGooglePlayConfigs() {
  const configs = await getAllConfigs();

  return {
    allowedPackageNames: getConfigValue(
      configs,
      "google_play_allowed_package_names",
      "GOOGLE_PLAY_ALLOWED_PACKAGE_NAMES"
    ) || getConfigValue(configs, "google_play_allowed_package_names", "GOOGLE_PLAY_PACKAGE_NAME"),
    serviceAccountJson: getConfigValue(
      configs,
      "google_play_service_account_json",
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"
    ),
    productMappings: getConfigValue(
      configs,
      "google_play_product_mappings",
      "GOOGLE_PLAY_PRODUCT_MAPPINGS"
    ),
    rtdnToken: getConfigValue(
      configs,
      "google_play_rtdn_token",
      "GOOGLE_PLAY_RTDN_TOKEN"
    ),
    internalApiToken: getConfigValue(
      configs,
      "google_play_internal_api_token",
      "GOOGLE_PLAY_INTERNAL_API_TOKEN"
    ),
  };
}

async function getAllowedPackageNames() {
  const googlePlayConfigs = await getGooglePlayConfigs();
  return (googlePlayConfigs.allowedPackageNames || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function assertAllowedPackageName(packageName: string) {
  const allowed = await getAllowedPackageNames();
  if (!allowed.length) {
    return;
  }

  if (!allowed.includes(packageName)) {
    throw new Error("packageName does not match server configuration");
  }
}

async function getProductMappings(): Promise<Record<string, GoogleProductMapping>> {
  const googlePlayConfigs = await getGooglePlayConfigs();
  const raw = googlePlayConfigs.productMappings;
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, GoogleProductMapping>;
    return parsed ?? {};
  } catch (error) {
    console.error("[GooglePlayIAP] invalid GOOGLE_PLAY_PRODUCT_MAPPINGS:", error);
    return {};
  }
}

async function getProductMapping(productId: string): Promise<GoogleProductMapping> {
  const mappings = await getProductMappings();
  return mappings[productId] ?? {};
}

async function mapEntitlementCode(productId: string) {
  return (await getProductMapping(productId)).entitlementCode || productId;
}

function mapPaymentInterval(interval?: string | null) {
  switch (interval) {
    case "day":
      return PaymentInterval.DAY;
    case "week":
      return PaymentInterval.WEEK;
    case "year":
      return PaymentInterval.YEAR;
    case "month":
    default:
      return PaymentInterval.MONTH;
  }
}

function toDateFromMillis(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const timestamp = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp);
}

function toIsoString(date: Date | null) {
  return date ? date.toISOString() : null;
}

function base64UrlEncode(value: string | Uint8Array) {
  const buffer = typeof value === "string" ? Buffer.from(value) : Buffer.from(value);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function signJwt(assertion: string, privateKeyPem: string) {
  const normalized = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const keyData = Buffer.from(normalized, "base64");
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(assertion)
  );

  return base64UrlEncode(new Uint8Array(signature));
}

async function getGooglePlayAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expireAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const googlePlayConfigs = await getGooglePlayConfigs();
  const rawServiceAccount = googlePlayConfigs.serviceAccountJson;
  if (!rawServiceAccount) {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured");
  }

  const serviceAccount = JSON.parse(rawServiceAccount) as {
    client_email: string;
    private_key: string;
    token_uri?: string;
  };

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is invalid");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: GOOGLE_PLAY_SCOPE,
      aud: serviceAccount.token_uri || GOOGLE_OAUTH_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    })
  );
  const unsignedJwt = `${header}.${payload}`;
  const signature = await signJwt(unsignedJwt, serviceAccount.private_key);
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch(serviceAccount.token_uri || GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`failed to get Google access token: ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };

  cachedAccessToken = {
    token: data.access_token,
    expireAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}

async function fetchGooglePlayJson<T>(path: string, init?: RequestInit) {
  const accessToken = await getGooglePlayAccessToken();
  const response = await fetch(`${GOOGLE_PLAY_API_BASE}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Play API request failed: ${text}`);
  }

  return (await response.json()) as T;
}

async function mapVerifiedSubscription(
  input: VerifyRequest,
  payload: Record<string, unknown>
): Promise<VerifiedPurchase> {
  const expiryTime = toDateFromMillis(payload.expiryTimeMillis as string | number | undefined);
  const startTime = toDateFromMillis(payload.startTimeMillis as string | number | undefined);
  const paymentState = Number(payload.paymentState ?? 0);
  const acknowledgementState = Number(payload.acknowledgementState ?? 0);
  const cancelReason = payload.cancelReason;

  let verifyStatus = "PURCHASED";
  let entitlementStatus = "ACTIVE";

  if (paymentState === 0) {
    verifyStatus = "PENDING";
    entitlementStatus = "PENDING";
  } else if (cancelReason !== undefined && cancelReason !== null) {
    verifyStatus = "CANCELED";
    entitlementStatus = "REVOKED";
  } else if (expiryTime && expiryTime.getTime() <= Date.now()) {
    verifyStatus = "EXPIRED";
    entitlementStatus = "EXPIRED";
  }

  return {
    packageName: input.packageName,
    productId: input.productId,
    productType: input.productType,
    purchaseToken: input.purchaseToken,
    orderId: (payload.orderId as string | undefined) || input.orderId,
    verifyStatus,
    purchaseState: verifyStatus,
    acknowledgementState,
    entitlementCode: await mapEntitlementCode(input.productId),
    entitlementStatus,
    purchaseTime: startTime,
    startAt: startTime,
    expireAt: expiryTime,
    rawPayload: payload,
  };
}

async function mapVerifiedInapp(
  input: VerifyRequest,
  payload: Record<string, unknown>
): Promise<VerifiedPurchase> {
  const purchaseState = Number(payload.purchaseState ?? 0);
  const acknowledgementState = Number(payload.acknowledgementState ?? 0);
  const purchaseTime = toDateFromMillis(payload.purchaseTimeMillis as string | number | undefined);

  let verifyStatus = "PURCHASED";
  let entitlementStatus = "ACTIVE";

  if (purchaseState === 1) {
    verifyStatus = "CANCELED";
    entitlementStatus = "REVOKED";
  } else if (purchaseState === 2) {
    verifyStatus = "PENDING";
    entitlementStatus = "PENDING";
  }

  return {
    packageName: input.packageName,
    productId: input.productId,
    productType: input.productType,
    purchaseToken: input.purchaseToken,
    orderId: (payload.orderId as string | undefined) || input.orderId,
    verifyStatus,
    purchaseState: verifyStatus,
    acknowledgementState,
    entitlementCode: await mapEntitlementCode(input.productId),
    entitlementStatus,
    purchaseTime,
    startAt: purchaseTime,
    expireAt: null,
    rawPayload: payload,
  };
}

async function verifyAgainstGoogle(input: VerifyRequest): Promise<VerifiedPurchase> {
  await assertAllowedPackageName(input.packageName);

  if (input.productType === "subs") {
    const payload = await fetchGooglePlayJson<Record<string, unknown>>(
      `${encodeURIComponent(input.packageName)}/purchases/subscriptions/${encodeURIComponent(
        input.productId
      )}/tokens/${encodeURIComponent(input.purchaseToken)}`
    );
    return await mapVerifiedSubscription(input, payload);
  }

  const payload = await fetchGooglePlayJson<Record<string, unknown>>(
    `${encodeURIComponent(input.packageName)}/purchases/products/${encodeURIComponent(
      input.productId
    )}/tokens/${encodeURIComponent(input.purchaseToken)}`
  );
  return await mapVerifiedInapp(input, payload);
}

async function acknowledgePurchase(verifiedPurchase: VerifiedPurchase, developerPayload: string) {
  if (verifiedPurchase.acknowledgementState === 1) {
    return false;
  }

  const path =
    verifiedPurchase.productType === "subs"
      ? `${encodeURIComponent(
          verifiedPurchase.packageName
        )}/purchases/subscriptions/${encodeURIComponent(
          verifiedPurchase.productId
        )}/tokens/${encodeURIComponent(verifiedPurchase.purchaseToken)}:acknowledge`
      : `${encodeURIComponent(
          verifiedPurchase.packageName
        )}/purchases/products/${encodeURIComponent(
          verifiedPurchase.productId
        )}/tokens/${encodeURIComponent(verifiedPurchase.purchaseToken)}:acknowledge`;

  await fetchGooglePlayJson(path, {
    method: "POST",
    body: JSON.stringify({ developerPayload }),
  });

  verifiedPurchase.acknowledgementState = 1;
  return true;
}

function buildPurchaseRecord(
  input: VerifyRequest,
  verifiedPurchase: VerifiedPurchase,
  existingPurchase?: GooglePlayPurchase | null
): NewGooglePlayPurchase {
  return {
    id: existingPurchase?.id || getUuid(),
    serverOrderNo: existingPurchase?.serverOrderNo || `IAP${getSnowId()}`,
    userId: input.userId,
    platform: "google",
    packageName: verifiedPurchase.packageName,
    productId: verifiedPurchase.productId,
    productType: verifiedPurchase.productType,
    purchaseToken: verifiedPurchase.purchaseToken,
    orderId: verifiedPurchase.orderId,
    purchaseState: verifiedPurchase.purchaseState,
    verifyStatus: verifiedPurchase.verifyStatus,
    entitlementCode: verifiedPurchase.entitlementCode,
    entitlementStatus: verifiedPurchase.entitlementStatus,
    acknowledgementState: verifiedPurchase.acknowledgementState,
    purchaseTime: verifiedPurchase.purchaseTime,
    startAt: verifiedPurchase.startAt,
    expireAt: verifiedPurchase.expireAt,
    lastVerifiedAt: new Date(),
    lastNotificationType: input.notificationType || existingPurchase?.lastNotificationType || null,
    lastNotificationAt: input.notificationType ? new Date() : existingPurchase?.lastNotificationAt || null,
    restoreTaskId: input.restoreTaskId || null,
    linkedOrderNo: existingPurchase?.linkedOrderNo || null,
    linkedSubscriptionNo: existingPurchase?.linkedSubscriptionNo || null,
    clientTraceId: input.clientTraceId || null,
    idempotencyKey: input.idempotencyKey || null,
    googlePayload: JSON.stringify(verifiedPurchase.rawPayload),
    deletedAt: null,
  };
}

function buildEntitlementResponse(purchase: GooglePlayPurchase) {
  return {
    entitlementCode: purchase.entitlementCode,
    status: purchase.entitlementStatus,
    productId: purchase.productId,
    platform: purchase.platform,
    startAt: toIsoString(purchase.startAt),
    expireAt: toIsoString(purchase.expireAt),
  };
}

function getGooglePlayPaymentProvider() {
  return "google_play";
}

function isPurchaseGrantable(verifiedPurchase: VerifiedPurchase) {
  return (
    verifiedPurchase.verifyStatus === "PURCHASED" &&
    ["ACTIVE", "PENDING_CANCEL"].includes(verifiedPurchase.entitlementStatus)
  );
}

function isRenewalPurchase(
  existingPurchase: GooglePlayPurchase,
  verifiedPurchase: VerifiedPurchase
) {
  if (
    verifiedPurchase.productType !== "subs" ||
    !existingPurchase.linkedSubscriptionNo ||
    !verifiedPurchase.orderId
  ) {
    return false;
  }

  if (existingPurchase.orderId && existingPurchase.orderId === verifiedPurchase.orderId) {
    return false;
  }

  if (
    existingPurchase.expireAt &&
    verifiedPurchase.expireAt &&
    verifiedPurchase.expireAt.getTime() <= existingPurchase.expireAt.getTime()
  ) {
    return false;
  }

  return true;
}

async function grantGooglePlayPurchaseToBillingLedger(opts: {
  existingPurchase?: GooglePlayPurchase | null;
  savedPurchase: GooglePlayPurchase;
  verifiedPurchase: VerifiedPurchase;
}) {
  const { existingPurchase, savedPurchase, verifiedPurchase } = opts;

  if (!isPurchaseGrantable(verifiedPurchase)) {
    return {
      linkedOrderNo: savedPurchase.linkedOrderNo,
      linkedSubscriptionNo: savedPurchase.linkedSubscriptionNo,
    };
  }

  const mapping = await getProductMapping(verifiedPurchase.productId);
  const paymentProvider = getGooglePlayPaymentProvider();
  const productName =
    mapping.productName || mapping.planName || verifiedPurchase.productId;
  const planName = mapping.planName || mapping.productName || productName;
  const amount =
    mapping.amount ??
    (verifiedPurchase.rawPayload.priceAmountMicros
      ? Math.round(Number(verifiedPurchase.rawPayload.priceAmountMicros) / 10000)
      : 0);
  const currency =
    mapping.currency ||
    (verifiedPurchase.rawPayload.priceCurrencyCode as string | undefined) ||
    "USD";
  const creditsAmount = Number(mapping.creditsAmount ?? 0);
  const creditsValidDays = Number(mapping.creditsValidDays ?? 0);
  const paymentProductId = mapping.paymentProductId || verifiedPurchase.productId;
  const transactionId = verifiedPurchase.orderId || savedPurchase.purchaseToken;

  if (verifiedPurchase.productType === "inapp") {
    if (savedPurchase.linkedOrderNo) {
      return {
        linkedOrderNo: savedPurchase.linkedOrderNo,
        linkedSubscriptionNo: savedPurchase.linkedSubscriptionNo,
      };
    }

    const orderNo = getSnowId();
    const newCredit: NewCredit | undefined =
      creditsAmount > 0
        ? {
            id: getUuid(),
            userId: savedPurchase.userId,
            userEmail: null,
            orderNo,
            subscriptionNo: "",
            transactionNo: getSnowId(),
            transactionType: CreditTransactionType.GRANT,
            transactionScene: CreditTransactionScene.PAYMENT,
            credits: creditsAmount,
            remainingCredits: creditsAmount,
            description: "Grant credit",
            expiresAt: calculateCreditExpirationTime({
              creditsValidDays,
            }),
            status: CreditStatus.ACTIVE,
          }
        : undefined;

    const newOrder: NewOrder = {
      id: getUuid(),
      orderNo,
      userId: savedPurchase.userId,
      userEmail: null,
      status: OrderStatus.PAID,
      amount,
      currency,
      productId: savedPurchase.productId,
      paymentType: PaymentType.ONE_TIME,
      paymentInterval: PaymentInterval.ONE_TIME,
      paymentProvider,
      paymentSessionId: null,
      checkoutInfo: "",
      checkoutResult: null,
      paymentResult: savedPurchase.googlePayload,
      discountCode: null,
      discountAmount: null,
      discountCurrency: null,
      paymentEmail: null,
      paymentAmount: amount,
      paymentCurrency: currency,
      paidAt: savedPurchase.purchaseTime || new Date(),
      createdAt: new Date(),
      description: "Google Play Purchase",
      productName,
      subscriptionId: null,
      subscriptionResult: null,
      checkoutUrl: null,
      callbackUrl: "",
      creditsAmount,
      creditsValidDays,
      planName,
      paymentProductId,
      invoiceId: null,
      invoiceUrl: null,
      subscriptionNo: "",
      transactionId,
      paymentUserName: null,
      paymentUserId: savedPurchase.userId,
    };

    const result = await db().transaction(async (tx) => {
      const [existingOrder] = await tx
        .select()
        .from(order)
        .where(
          and(
            eq(order.transactionId, transactionId),
            eq(order.paymentProvider, paymentProvider)
          )
        )
        .limit(1);

      const createdOrder =
        existingOrder ||
        (
          await tx.insert(order).values(newOrder).returning()
        )[0];

      let createdCredit = null;
      if (newCredit) {
        [createdCredit] = await tx
          .select()
          .from(credit)
          .where(eq(credit.orderNo, createdOrder.orderNo))
          .limit(1);

        if (!createdCredit) {
          [createdCredit] = await tx.insert(credit).values(newCredit).returning();
        }
      }

      return {
        order: createdOrder,
        credit: createdCredit,
      };
    });

    return {
      linkedOrderNo: result.order.orderNo,
      linkedSubscriptionNo: null,
    };
  }

  if (!savedPurchase.linkedSubscriptionNo) {
    const orderNo = getSnowId();
    const subscriptionNo = getSnowId();
    const interval = mapPaymentInterval(mapping.interval);
    const newSubscription: NewSubscription = {
      id: getUuid(),
      subscriptionNo,
      userId: savedPurchase.userId,
      userEmail: null,
      status: SubscriptionStatus.ACTIVE,
      paymentProvider,
      subscriptionId: savedPurchase.purchaseToken,
      subscriptionResult: savedPurchase.googlePayload,
      productId: savedPurchase.productId,
      description: "Google Play Subscription",
      amount,
      currency,
      interval,
      intervalCount: mapping.intervalCount ?? 1,
      trialPeriodDays: mapping.trialPeriodDays,
      currentPeriodStart: savedPurchase.startAt,
      currentPeriodEnd: savedPurchase.expireAt,
      billingUrl: null,
      planName,
      productName,
      creditsAmount,
      creditsValidDays,
      paymentProductId,
      paymentUserId: savedPurchase.userId,
    };

    const newCredit: NewCredit | undefined =
      creditsAmount > 0
        ? {
            id: getUuid(),
            userId: savedPurchase.userId,
            userEmail: null,
            orderNo,
            subscriptionNo,
            transactionNo: getSnowId(),
            transactionType: CreditTransactionType.GRANT,
            transactionScene: CreditTransactionScene.SUBSCRIPTION,
            credits: creditsAmount,
            remainingCredits: creditsAmount,
            description: "Grant credit",
            expiresAt: calculateCreditExpirationTime({
              creditsValidDays,
              currentPeriodEnd: savedPurchase.expireAt || undefined,
            }),
            status: CreditStatus.ACTIVE,
          }
        : undefined;

    const newOrder: NewOrder = {
      id: getUuid(),
      orderNo,
      userId: savedPurchase.userId,
      userEmail: null,
      status: OrderStatus.PAID,
      amount,
      currency,
      productId: savedPurchase.productId,
      paymentType: PaymentType.SUBSCRIPTION,
      paymentInterval: interval,
      paymentProvider,
      paymentSessionId: null,
      checkoutInfo: "",
      checkoutResult: null,
      paymentResult: savedPurchase.googlePayload,
      discountCode: null,
      discountAmount: null,
      discountCurrency: null,
      paymentEmail: null,
      paymentAmount: amount,
      paymentCurrency: currency,
      paidAt: savedPurchase.purchaseTime || new Date(),
      createdAt: new Date(),
      description: "Google Play Subscription",
      productName,
      subscriptionId: savedPurchase.purchaseToken,
      subscriptionResult: savedPurchase.googlePayload,
      checkoutUrl: null,
      callbackUrl: "",
      creditsAmount,
      creditsValidDays,
      planName,
      paymentProductId,
      invoiceId: null,
      invoiceUrl: null,
      subscriptionNo,
      transactionId,
      paymentUserName: null,
      paymentUserId: savedPurchase.userId,
    };

    const result = await db().transaction(async (tx) => {
      const [existingOrder] = await tx
        .select()
        .from(order)
        .where(
          and(
            eq(order.transactionId, transactionId),
            eq(order.paymentProvider, paymentProvider)
          )
        )
        .limit(1);

      const [existingSubscription] = await tx
        .select()
        .from(subscription)
        .where(
          and(
            eq(subscription.subscriptionId, savedPurchase.purchaseToken),
            eq(subscription.paymentProvider, paymentProvider)
          )
        )
        .limit(1);

      const createdOrder =
        existingOrder ||
        (
          await tx.insert(order).values(newOrder).returning()
        )[0];
      const createdSubscription =
        existingSubscription ||
        (
          await tx.insert(subscription).values(newSubscription).returning()
        )[0];

      let createdCredit = null;
      if (newCredit) {
        [createdCredit] = await tx
          .select()
          .from(credit)
          .where(eq(credit.orderNo, createdOrder.orderNo))
          .limit(1);

        if (!createdCredit) {
          [createdCredit] = await tx.insert(credit).values(newCredit).returning();
        }
      }

      return {
        order: createdOrder,
        subscription: createdSubscription,
        credit: createdCredit,
      };
    });

    await createAffiliateCommissionFromPaidOrder({
      order: result.order,
      subscription: result.subscription,
    });

    return {
      linkedOrderNo: result.order.orderNo,
      linkedSubscriptionNo: result.subscription?.subscriptionNo || subscriptionNo,
    };
  }

  if (!existingPurchase || !isRenewalPurchase(existingPurchase, verifiedPurchase)) {
    await updateSubscriptionBySubscriptionNo(savedPurchase.linkedSubscriptionNo, {
      status:
        savedPurchase.entitlementStatus === "ACTIVE"
          ? SubscriptionStatus.ACTIVE
          : savedPurchase.entitlementStatus === "REVOKED"
            ? SubscriptionStatus.CANCELED
            : SubscriptionStatus.EXPIRED,
      currentPeriodStart: savedPurchase.startAt,
      currentPeriodEnd: savedPurchase.expireAt,
    });

    return {
      linkedOrderNo: savedPurchase.linkedOrderNo,
      linkedSubscriptionNo: savedPurchase.linkedSubscriptionNo,
    };
  }

  const renewalOrderNo = getSnowId();
  const renewalOrder: NewOrder = {
    id: getUuid(),
    orderNo: renewalOrderNo,
    userId: savedPurchase.userId,
    userEmail: null,
    status: OrderStatus.PAID,
    amount,
    currency,
    productId: savedPurchase.productId,
    paymentType: PaymentType.RENEW,
    paymentInterval: mapPaymentInterval(mapping.interval),
    paymentProvider,
    checkoutInfo: "",
    createdAt: new Date(),
    productName,
    description: "Google Play Subscription Renewal",
    callbackUrl: "",
    creditsAmount,
    creditsValidDays,
    planName,
    paymentProductId,
    paymentResult: savedPurchase.googlePayload,
    paymentAmount: amount,
    paymentCurrency: currency,
    paymentEmail: null,
    paymentUserId: savedPurchase.userId,
    paidAt: savedPurchase.purchaseTime || new Date(),
    subscriptionNo: savedPurchase.linkedSubscriptionNo,
    transactionId,
    paymentUserName: null,
    subscriptionId: savedPurchase.purchaseToken,
    subscriptionResult: savedPurchase.googlePayload,
  };

  const renewalCredit: NewCredit | undefined =
    creditsAmount > 0
      ? {
          id: getUuid(),
          userId: savedPurchase.userId,
          userEmail: null,
          orderNo: renewalOrderNo,
          subscriptionNo: savedPurchase.linkedSubscriptionNo,
          transactionNo: getSnowId(),
          transactionType: CreditTransactionType.GRANT,
          transactionScene: CreditTransactionScene.RENEWAL,
          credits: creditsAmount,
          remainingCredits: creditsAmount,
          description: "Grant credit",
          expiresAt: calculateCreditExpirationTime({
            creditsValidDays,
            currentPeriodEnd: savedPurchase.expireAt || undefined,
          }),
          status: CreditStatus.ACTIVE,
        }
      : undefined;

  const renewalResult = await updateSubscriptionInTransaction({
    subscriptionNo: savedPurchase.linkedSubscriptionNo,
    updateSubscription: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: savedPurchase.startAt,
      currentPeriodEnd: savedPurchase.expireAt,
    },
    newOrder: renewalOrder,
    newCredit: renewalCredit,
  });

  await createAffiliateCommissionFromRenewal({
    subscription: renewalResult.subscription,
    order: renewalResult.order,
  });

  return {
    linkedOrderNo: renewalResult.order.orderNo,
    linkedSubscriptionNo: renewalResult.subscription.subscriptionNo,
  };
}

export async function verifyAndStoreGooglePlayPurchase(input: VerifyRequest) {
  const existingPurchase = await findGooglePlayPurchaseByToken(input.purchaseToken);
  const verifiedPurchase = await verifyAgainstGoogle(input);

  if (verifiedPurchase.verifyStatus === "PURCHASED") {
    await acknowledgePurchase(
      verifiedPurchase,
      existingPurchase?.serverOrderNo || `IAP${getSnowId()}`
    );
  }

  const purchaseRecord = buildPurchaseRecord(input, verifiedPurchase, existingPurchase);
  let savedPurchase = await saveGooglePlayPurchase(purchaseRecord, existingPurchase);

  const ledgerResult = await grantGooglePlayPurchaseToBillingLedger({
    existingPurchase,
    savedPurchase,
    verifiedPurchase,
  });

  if (
    ledgerResult.linkedOrderNo !== savedPurchase.linkedOrderNo ||
    ledgerResult.linkedSubscriptionNo !== savedPurchase.linkedSubscriptionNo
  ) {
    savedPurchase = await saveGooglePlayPurchase(
      {
        ...purchaseRecord,
        linkedOrderNo: ledgerResult.linkedOrderNo || null,
        linkedSubscriptionNo: ledgerResult.linkedSubscriptionNo || null,
      },
      savedPurchase
    );
  }

  await createGooglePlayEvent({
    id: getUuid(),
    eventType: input.notificationType ? "rtdn_verify" : "verify",
    notificationType: input.notificationType || null,
    purchaseToken: input.purchaseToken,
    packageName: input.packageName,
    productId: input.productId,
    processStatus: "success",
    payload: JSON.stringify({
      request: input,
      response: verifiedPurchase.rawPayload,
    }),
    errorMessage: null,
  });

  const entitlements = await getGooglePlayEntitlementsByUserId(input.userId);

  return {
    alreadyProcessed:
      !!existingPurchase &&
      existingPurchase.verifyStatus === "PURCHASED" &&
      savedPurchase.verifyStatus === "PURCHASED",
    purchase: savedPurchase,
    entitlements: entitlements.map(buildEntitlementResponse),
  };
}

export async function getGooglePlayEntitlements(userId: string) {
  const entitlements = await getGooglePlayEntitlementsByUserId(userId);
  return entitlements.map(buildEntitlementResponse);
}

export async function restoreGooglePlayPurchases(userId: string, packageName: string) {
  assertAllowedPackageName(packageName);

  const taskId = `restore-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const purchases = await getGooglePlayPurchasesByUserId(userId, {
    packageName,
    includeExpired: true,
  });

  const results = await Promise.allSettled(
    purchases.map((purchase) =>
      verifyAndStoreGooglePlayPurchase({
        userId,
        packageName: purchase.packageName,
        productId: purchase.productId,
        productType: purchase.productType as ProductType,
        purchaseToken: purchase.purchaseToken,
        orderId: purchase.orderId || undefined,
        restoreTaskId: taskId,
      })
    )
  );

  await createGooglePlayEvent({
    id: getUuid(),
    eventType: "restore",
    notificationType: null,
    purchaseToken: null,
    packageName,
    productId: null,
    processStatus: results.some((item) => item.status === "rejected") ? "partial_success" : "success",
    payload: JSON.stringify({
      userId,
      taskId,
      total: purchases.length,
      successCount: results.filter((item) => item.status === "fulfilled").length,
    }),
    errorMessage: null,
  });

  return {
    taskId,
    total: purchases.length,
    restoredCount: results.filter((item) => item.status === "fulfilled").length,
  };
}

function decodePubSubMessage(data: string) {
  const decoded = Buffer.from(data, "base64").toString("utf8");
  return JSON.parse(decoded) as Record<string, unknown>;
}

export async function verifyGooglePlayWebhookRequest(req: Request) {
  const googlePlayConfigs = await getGooglePlayConfigs();
  const expectedSecret = googlePlayConfigs.rtdnToken;
  if (!expectedSecret) {
    return { valid: true as const };
  }

  const providedSecret =
    req.headers.get("X-Google-Play-Webhook-Secret") ||
    req.headers.get("X-Webhook-Secret") ||
    req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (!providedSecret || providedSecret !== expectedSecret) {
    return { valid: false as const, error: "Invalid RTDN secret" };
  }

  return { valid: true as const };
}

export async function verifyGooglePlayInternalRequest(req: Request) {
  const googlePlayConfigs = await getGooglePlayConfigs();
  const expectedToken = googlePlayConfigs.internalApiToken;
  if (!expectedToken) {
    return { valid: true as const };
  }

  const providedToken =
    req.headers.get("X-Internal-Token") ||
    req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (!providedToken || providedToken !== expectedToken) {
    return { valid: false as const, error: "Invalid internal token" };
  }

  return { valid: true as const };
}

export function parseRtdnPayload(payload: Record<string, unknown>): ParsedRtdnMessage {
  const envelope = payload as RtdnEnvelope;
  const messagePayload =
    envelope.message?.data && typeof envelope.message.data === "string"
      ? decodePubSubMessage(envelope.message.data)
      : payload;

  const subscriptionNotification = messagePayload.subscriptionNotification as
    | Record<string, unknown>
    | undefined;
  const oneTimeProductNotification = messagePayload.oneTimeProductNotification as
    | Record<string, unknown>
    | undefined;
  const packageName = messagePayload.packageName as string | undefined;

  if (!packageName) {
    throw new Error("RTDN packageName is required");
  }

  if (subscriptionNotification) {
    return {
      packageName,
      productId: subscriptionNotification.subscriptionId as string,
      productType: "subs",
      purchaseToken: subscriptionNotification.purchaseToken as string,
      notificationType: String(subscriptionNotification.notificationType ?? "subscription"),
      rawPayload: messagePayload,
    };
  }

  if (oneTimeProductNotification) {
    return {
      packageName,
      productId: oneTimeProductNotification.sku as string,
      productType: "inapp",
      purchaseToken: oneTimeProductNotification.purchaseToken as string,
      notificationType: String(oneTimeProductNotification.notificationType ?? "one_time_product"),
      rawPayload: messagePayload,
    };
  }

  throw new Error("Unsupported RTDN payload");
}

export async function processGooglePlayRtdn(payload: Record<string, unknown>) {
  const parsed = parseRtdnPayload(payload);
  const purchase = await findGooglePlayPurchaseByToken(parsed.purchaseToken);

  if (!purchase) {
    throw new Error("RTDN purchase token not found locally");
  }

  const result = await verifyAndStoreGooglePlayPurchase({
    userId: purchase.userId,
    packageName: parsed.packageName,
    productId: parsed.productId,
    productType: parsed.productType,
    purchaseToken: parsed.purchaseToken,
    orderId: purchase.orderId || undefined,
    notificationType: parsed.notificationType,
  });

  return {
    notificationType: parsed.notificationType,
    serverOrderNo: result.purchase.serverOrderNo,
  };
}

export async function retryGooglePlayAcknowledge(input: {
  purchaseToken?: string;
  serverOrderNo?: string;
}) {
  const purchase =
    (input.purchaseToken
      ? await findGooglePlayPurchaseByToken(input.purchaseToken)
      : null) ||
    (input.serverOrderNo
      ? await findGooglePlayPurchaseByServerOrderNo(input.serverOrderNo)
      : null);

  if (!purchase) {
    throw new Error("purchase not found");
  }

  const verifiedPurchase = await verifyAgainstGoogle({
    userId: purchase.userId,
    packageName: purchase.packageName,
    productId: purchase.productId,
    productType: purchase.productType as ProductType,
    purchaseToken: purchase.purchaseToken,
    orderId: purchase.orderId || undefined,
  });

  const acknowledged = await acknowledgePurchase(
    verifiedPurchase,
    purchase.serverOrderNo
  );

  const savedPurchase = await saveGooglePlayPurchase(
    buildPurchaseRecord(
      {
        userId: purchase.userId,
        packageName: purchase.packageName,
        productId: purchase.productId,
        productType: purchase.productType as ProductType,
        purchaseToken: purchase.purchaseToken,
        orderId: purchase.orderId || undefined,
      },
      verifiedPurchase,
      purchase
    ),
    purchase
  );

  await createGooglePlayEvent({
    id: getUuid(),
    eventType: "ack_retry",
    notificationType: null,
    purchaseToken: purchase.purchaseToken,
    packageName: purchase.packageName,
    productId: purchase.productId,
    processStatus: "success",
    payload: JSON.stringify({
      acknowledged,
      serverOrderNo: purchase.serverOrderNo,
    }),
    errorMessage: null,
  });

  return {
    acknowledged,
    purchase: savedPurchase,
  };
}
