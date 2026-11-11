"use client";

import { PAYMENTS_AVAILABLE } from "@/config/site";
import { notifyBetaPurchase } from "@/shared/blocks/payment/beta-purchase-notice";

import {
  trackGoogleAdsConversion,
  trackGoogleTagEvent,
} from "@/shared/lib/google-tag";

export class CheckoutRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CheckoutRequestError";
    this.status = status;
  }
}

export interface CheckoutRequestPayload {
  product_id: string;
  currency?: string;
  locale?: string;
  payment_provider?: string;
  metadata?: Record<string, unknown>;
  discount_code?: string;
}

interface BeginCheckoutTrackingInput {
  productId: string;
  productName?: string;
  currency?: string;
  value?: number;
  paymentProvider?: string;
  discountCode?: string;
}

export function normalizeCheckoutValue(value?: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function requestCheckoutSession(
  params: CheckoutRequestPayload,
  tracking: BeginCheckoutTrackingInput,
) {
  if (!PAYMENTS_AVAILABLE) {
    notifyBetaPurchase();
    throw new CheckoutRequestError(
      "Purchases are not available during public beta",
      503,
    );
  }

  const response = await fetch("/api/payment/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (response.status === 401) {
    throw new CheckoutRequestError("signin required", 401);
  }

  if (!response.ok) {
    throw new CheckoutRequestError(
      `request failed with status ${response.status}`,
      response.status,
    );
  }

  const { code, message, data } = await response.json();
  if (code !== 0) {
    throw new CheckoutRequestError(message);
  }

  const { checkoutUrl } = data || {};
  if (!checkoutUrl) {
    throw new CheckoutRequestError("checkout url not found");
  }

  trackGoogleTagEvent("begin_checkout", {
    currency: tracking.currency || params.currency || "USD",
    value:
      typeof tracking.value === "number"
        ? Number(tracking.value.toFixed(2))
        : 0,
    payment_provider: tracking.paymentProvider || params.payment_provider || "",
    coupon: tracking.discountCode || params.discount_code || undefined,
    items: [
      {
        item_id: tracking.productId,
        item_name: tracking.productName || tracking.productId,
        price:
          typeof tracking.value === "number"
            ? Number(tracking.value.toFixed(2))
            : undefined,
        quantity: 1,
      },
    ],
  });

  trackGoogleAdsConversion("begin_checkout", {
    value:
      typeof tracking.value === "number"
        ? Number(tracking.value.toFixed(2))
        : 0,
    currency: tracking.currency || params.currency || "USD",
  });

  return data as { checkoutUrl: string; sessionId?: string };
}
