"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/core/i18n/navigation";
import {
  CreditPricingModal,
  type PricingPlan,
} from "@/shared/blocks/pricing/credit-pricing-modal";
import { useAppContext } from "@/shared/contexts/app";
import {
  CheckoutRequestError,
  normalizeCheckoutValue,
  requestCheckoutSession,
} from "@/shared/lib/payment-checkout";

type RenderTrigger = (open: () => void) => ReactNode;

type AppliedDiscountState = {
  code: string;
  discountRateBps: number;
  affiliateName?: string;
};

export function PricingPrompt({
  children,
  onSelectPlan,
  loadingPlanId,
  signInCallbackUrl,
  autoPrompt = true,
}: {
  children?: RenderTrigger;
  onSelectPlan?: (plan: PricingPlan) => Promise<void> | void;
  loadingPlanId?: string | null;
  /**
   * 未登录触发跳转到登录页时，登录完成后的回跳地址（相对路径）。
   * 不传则默认使用当前页面 path + search。
   */
  signInCallbackUrl?: string;
  autoPrompt?: boolean;
}) {
  const isPricingModalDisabled = true;
  const [open, setOpen] = useState(false);
  const [openMode, setOpenMode] = useState<"auto" | "manual">("auto");
  const {
    user,
    fetchUserInfo,
    isShowPaymentModal,
    setIsShowPaymentModal,
    isShowSignModal,
    isShowDomainMigrationNotice,
    configs,
  } = useAppContext();
  const locale = useLocale();
  const t = useTranslations("pricing");
  const router = useRouter();
  const fetchUserInfoRef = useRef(fetchUserInfo);
  const [internalLoadingPlanId, setInternalLoadingPlanId] = useState<
    string | null
  >(null);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] =
    useState<AppliedDiscountState | null>(null);
  const [discountApplying, setDiscountApplying] = useState(false);

  const getEffectiveSignInCallbackUrl = () => {
    if (signInCallbackUrl) return signInCallbackUrl;
    return typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";
  };

  useEffect(() => {
    fetchUserInfoRef.current = fetchUserInfo;
  }, [fetchUserInfo]);

  useEffect(() => {
    if (isPricingModalDisabled) {
      if (isShowPaymentModal) {
        setIsShowPaymentModal(false);
      }
      return;
    }

    if (!isShowPaymentModal) {
      return;
    }

    setOpenMode("manual");
    setOpen(true);
  }, [isShowPaymentModal]);

  const hasPaid = useMemo(
    () => (user?.credits?.remainingCredits || 0) > 6,
    [user?.credits?.remainingCredits],
  );

  useEffect(() => {
    if (isPricingModalDisabled || !autoPrompt) {
      return;
    }

    let firstTimer: number | undefined;
    let intervalTimer: number | undefined;

    const checkAndPrompt = async () => {
      if (open) {
        return;
      }

      // Don't show pricing modal if sign-in modal is already showing
      if (isShowSignModal) {
        return;
      }

      // Guests are treated as unpaid.
      if (!user?.id) {
        if (!isShowDomainMigrationNotice) {
          setOpenMode("auto");
          setOpen(true);
        }
        return;
      }

      try {
        const latestUser = await fetchUserInfoRef.current();
        const paidAfterCheck = (latestUser?.credits?.remainingCredits || 0) > 6;

        if (!paidAfterCheck && !isShowDomainMigrationNotice) {
          setOpenMode("auto");
          setOpen(true);
        }
      } catch (error) {
        // Ignore fetch errors and fall back to existing state
        const paidAfterCheck = (user?.credits?.remainingCredits || 0) > 6;
        if (!paidAfterCheck && !isShowDomainMigrationNotice) {
          setOpenMode("auto");
          setOpen(true);
        }
      }
    };

    if (!hasPaid) {
      firstTimer = window.setTimeout(checkAndPrompt, 60_000); // First prompt after 1 minute
      intervalTimer = window.setInterval(checkAndPrompt, 1 * 60_000); // Re-check every 5 minutes
    }

    return () => {
      if (firstTimer) {
        window.clearTimeout(firstTimer);
      }
      if (intervalTimer) {
        window.clearInterval(intervalTimer);
      }
    };
  }, [
    autoPrompt,
    hasPaid,
    user?.id,
    isShowSignModal,
    isShowDomainMigrationNotice,
    open,
  ]);

  useEffect(() => {
    if (isPricingModalDisabled || !autoPrompt || typeof window === "undefined") {
      return;
    }

    const handleDomainNoticeClosed = () => {
      if (open || isShowSignModal || hasPaid) {
        return;
      }

      setOpenMode("manual");
      setOpen(true);
    };

    window.addEventListener(
      "domain-migration-notice-closed",
      handleDomainNoticeClosed,
    );

    return () => {
      window.removeEventListener(
        "domain-migration-notice-closed",
        handleDomainNoticeClosed,
      );
    };
  }, [autoPrompt, hasPaid, isShowSignModal, open]);

  const resolveDiscountErrorMessage = (error: any) => {
    const message = String(error?.message || "");
    switch (message) {
      case "affiliate_discount_code_already_used":
        return t("credit_modal.discount.errors.already_used");
      case "discount code is expired":
        return t("credit_modal.discount.errors.expired");
      case "discount code is invalid":
        return t("credit_modal.discount.errors.invalid");
      case "discount code is required":
        return t("credit_modal.discount.errors.empty");
      case "request failed with status 500":
      case "request failed with status 400":
      case "request failed with status 404":
      case "request failed with status 401":
      case "request failed with status 403":
      case "request failed with status 429":
        return t("credit_modal.errors.checkout_failed");
      default:
        return message;
    }
  };

  const defaultSelectPlan = async (plan: PricingPlan) => {
    const productId = plan.productId || plan.id;
    const currency = (plan.currency || "USD").toUpperCase();
    const paymentProvider =
      plan.paymentProvider || configs?.default_payment_provider || "stripe";

    if (!user) {
      // Save plan info to localStorage for auto checkout after login
      const planData = {
        productId,
        productName: plan.name,
        currency,
        paymentProvider,
        locale: locale || "en",
        metadata: {},
        planId: plan.id,
        amountValue: normalizeCheckoutValue(plan.price),
        discountCode: appliedDiscount?.code || "",
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "pending_checkout_plan",
          JSON.stringify(planData),
        );
        // Set callbackUrl so we can return to a desired page after login
        window.localStorage.setItem(
          "signin_callback_url",
          getEffectiveSignInCallbackUrl(),
        );
      }
      const callbackUrl = getEffectiveSignInCallbackUrl();
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      throw new Error("signin required");
    }

    if (!productId) {
      toast.error(t("credit_modal.errors.no_product"));
      throw new Error("missing product id");
    }

    try {
      setInternalLoadingPlanId(plan.id);

      const params = {
        product_id: productId,
        currency,
        locale: locale || "en",
        payment_provider: paymentProvider,
        metadata: {},
        discount_code: appliedDiscount?.code || undefined,
      };

      const { checkoutUrl } = await requestCheckoutSession(params, {
        productId,
        productName: plan.name,
        currency,
        value: normalizeCheckoutValue(plan.price),
        paymentProvider,
        discountCode: appliedDiscount?.code || undefined,
      });

      window.location.href = checkoutUrl;
    } catch (error: any) {
      if (error instanceof CheckoutRequestError && error.status === 401) {
        const callbackUrl = getEffectiveSignInCallbackUrl();
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        throw new Error("signin required");
      }

      if (error?.message !== "signin required") {
        const resolvedMessage = resolveDiscountErrorMessage(error);
        if (resolvedMessage) {
          toast.error(resolvedMessage);
        } else {
          toast.error(t("credit_modal.errors.checkout_failed"));
        }
      }
      throw error;
    } finally {
      setInternalLoadingPlanId(null);
    }
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    const runHandler = onSelectPlan || defaultSelectPlan;
    try {
      await runHandler(plan);
    } catch {
      // Keep modal open on error so user can retry.
      return;
    }
    setOpen(false);
  };

  const discountCopy = {
    title: t("credit_modal.discount.title"),
    description: t("credit_modal.discount.description"),
    placeholder: t("credit_modal.discount.placeholder"),
    apply: t("credit_modal.discount.apply"),
    applied: t("credit_modal.discount.applied"),
    remove: t("credit_modal.discount.remove"),
    success: t("credit_modal.discount.success"),
    invalid: t("credit_modal.discount.errors.invalid"),
    empty: t("credit_modal.discount.errors.empty"),
    helper: t("credit_modal.discount.helper"),
    appliedLabel: t("credit_modal.discount.applied_label"),
    rateLabel: t("credit_modal.discount.rate_label"),
  };

  const handleApplyDiscountCode = async () => {
    const input = discountCodeInput.trim();
    if (!input) {
      toast.error(discountCopy.empty);
      return;
    }

    try {
      setDiscountApplying(true);
      const response = await fetch("/api/payment/discount-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: input }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.code !== 0) {
        throw new Error(payload?.message || discountCopy.invalid);
      }

      const normalizedCode = payload.data?.code || input.toUpperCase();
      setAppliedDiscount({
        code: normalizedCode,
        discountRateBps: payload.data?.discountRateBps || 0,
        affiliateName: payload.data?.affiliateName || undefined,
      });
      setDiscountCodeInput(normalizedCode);
      toast.success(discountCopy.success);
    } catch (error: any) {
      toast.error(resolveDiscountErrorMessage(error) || discountCopy.invalid);
    } finally {
      setDiscountApplying(false);
    }
  };

  const handleRemoveDiscountCode = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput("");
  };

  const effectiveLoadingPlanId = loadingPlanId ?? internalLoadingPlanId;

  if (isPricingModalDisabled) {
    return <>{children?.(() => {})}</>;
  }

  return (
    <>
      {children?.(() => {
        if (open) {
          return;
        }
        if (isShowDomainMigrationNotice) {
          return;
        }
        setOpenMode("manual");
        setOpen(true);
      })}
      <CreditPricingModal
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setIsShowPaymentModal(false);
          }
        }}
        onSelectPlan={handleSelectPlan}
        loadingPlanId={effectiveLoadingPlanId}
        bypassFrequencyControl={openMode === "manual"}
        discountCodeValue={discountCodeInput}
        onDiscountCodeChange={setDiscountCodeInput}
        onApplyDiscount={handleApplyDiscountCode}
        onRemoveDiscount={handleRemoveDiscountCode}
        appliedDiscountCode={appliedDiscount?.code || ""}
        appliedDiscountRateLabel={
          appliedDiscount?.discountRateBps
            ? `${(appliedDiscount.discountRateBps / 100).toFixed(
                appliedDiscount.discountRateBps % 100 === 0 ? 0 : 2,
              )}%`
            : ""
        }
        appliedDiscountAffiliateName={appliedDiscount?.affiliateName || ""}
        discountLoading={discountApplying}
        discountCopy={discountCopy}
      />
    </>
  );
}
