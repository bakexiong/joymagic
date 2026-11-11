"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import {
  hasTrackedPurchase,
  markPurchaseTracked,
  setGoogleTagUserData,
  trackGoogleAdsConversion,
  trackGoogleTagEvent,
} from "@/shared/lib/google-tag";

type ConfirmedOrder = {
  orderNo: string;
  status: string;
  productId?: string | null;
  productName?: string | null;
  paymentType?: string | null;
  callbackUrl?: string | null;
  amount?: number | null;
  currency?: string | null;
  discountCode?: string | null;
  userEmail?: string | null;
  paidAt?: string | null;
};

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 10;

const copyByLocale: Record<string, Record<string, string>> = {
  zh: {
    checkingTitle: "正在确认支付结果",
    checkingDescription: "我们正在和 Stripe 核对订单，请稍等几秒。",
    successTitle: "购买成功",
    successDescription: "订单已经确认，埋点也已完成上报。",
    failedTitle: "支付未完成",
    failedDescription: "这笔订单暂时没有确认成功，你可以稍后去支付记录查看。",
    errorTitle: "确认支付失败",
    errorDescription: "暂时无法确认订单状态，请稍后重试。",
    primaryAction: "查看订单",
    secondaryAction: "返回定价页",
  },
  default: {
    checkingTitle: "Confirming your payment",
    checkingDescription:
      "We are verifying the order with Stripe. This usually takes a few seconds.",
    successTitle: "Purchase complete",
    successDescription:
      "Your order is confirmed and the conversion event has been reported.",
    failedTitle: "Payment not completed",
    failedDescription:
      "This order has not been confirmed yet. You can check it again from billing later.",
    errorTitle: "Unable to confirm payment",
    errorDescription:
      "We could not confirm the order right now. Please try again in a moment.",
    primaryAction: "View billing",
    secondaryAction: "Back to pricing",
  },
};

function formatAmount(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number" || !currency) {
    return "";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function CheckoutSuccess({ orderNo }: { orderNo: string }) {
  const locale = useLocale();
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const purchaseTrackedRef = useRef(false);

  const copy = copyByLocale[locale?.startsWith("zh") ? "zh" : "default"];

  const isPaid = order?.status === "paid";
  const isFailed =
    order?.status === "failed" || order?.status === "completed" || !!error;

  useEffect(() => {
    let cancelled = false;

    const confirmOrder = async () => {
      attemptRef.current += 1;

      try {
        const response = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_no: orderNo,
          }),
        });

        const payload = await response.json();
        if (!response.ok || payload?.code !== 0) {
          throw new Error(payload?.message || "confirm failed");
        }

        const nextOrder = payload.data as ConfirmedOrder;
        if (cancelled) {
          return;
        }

        setOrder(nextOrder);
        setError(null);

        if (
          nextOrder.status !== "paid" &&
          nextOrder.status !== "failed" &&
          nextOrder.status !== "completed" &&
          attemptRef.current < MAX_ATTEMPTS
        ) {
          timeoutRef.current = window.setTimeout(
            confirmOrder,
            POLL_INTERVAL_MS,
          );
        }
      } catch (nextError: any) {
        if (cancelled) {
          return;
        }

        if (attemptRef.current < MAX_ATTEMPTS) {
          timeoutRef.current = window.setTimeout(
            confirmOrder,
            POLL_INTERVAL_MS,
          );
          return;
        }

        setError(nextError?.message || "confirm failed");
      }
    };

    confirmOrder();

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [orderNo]);

  useEffect(() => {
    if (!isPaid || !order || purchaseTrackedRef.current) {
      return;
    }

    if (hasTrackedPurchase(order.orderNo)) {
      purchaseTrackedRef.current = true;
      return;
    }

    const value = typeof order.amount === "number" ? order.amount / 100 : 0;

    setGoogleTagUserData({
      email: order.userEmail || undefined,
    });
    trackGoogleTagEvent("purchase", {
      transaction_id: order.orderNo,
      value: Number(value.toFixed(2)),
      currency: order.currency || "USD",
      coupon: order.discountCode || undefined,
      items: [
        {
          item_id: order.productId || order.orderNo,
          item_name: order.productName || order.productId || order.orderNo,
          price: Number(value.toFixed(2)),
          quantity: 1,
        },
      ],
    });
    trackGoogleAdsConversion("purchase", {
      transaction_id: order.orderNo,
      value: Number(value.toFixed(2)),
      currency: order.currency || "USD",
    });
    markPurchaseTracked(order.orderNo);
    purchaseTrackedRef.current = true;
  }, [isPaid, order]);

  const summary = useMemo(() => {
    if (!order) {
      return "";
    }

    const amountLabel = formatAmount(order.amount, order.currency);
    if (!order.productName && !amountLabel) {
      return "";
    }

    return [order.productName, amountLabel].filter(Boolean).join(" · ");
  }, [order]);

  const primaryHref =
    order?.callbackUrl ||
    (order?.paymentType === "subscription"
      ? "/settings/billing"
      : "/settings/payments");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {isPaid ? (
            <CheckCircle2 className="mb-4 size-12 text-emerald-500" />
          ) : isFailed ? (
            <XCircle className="mb-4 size-12 text-rose-500" />
          ) : (
            <Loader2 className="mb-4 size-12 animate-spin text-primary" />
          )}

          <h1 className="text-2xl font-semibold">
            {isPaid
              ? copy.successTitle
              : isFailed
                ? error
                  ? copy.errorTitle
                  : copy.failedTitle
                : copy.checkingTitle}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {isPaid
              ? copy.successDescription
              : isFailed
                ? error
                  ? copy.errorDescription
                  : copy.failedDescription
                : copy.checkingDescription}
          </p>

          {summary ? (
            <p className="mt-4 text-sm font-medium text-foreground">
              {summary}
            </p>
          ) : null}

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <a href={primaryHref}>{copy.primaryAction}</a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="/pricing">{copy.secondaryAction}</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
