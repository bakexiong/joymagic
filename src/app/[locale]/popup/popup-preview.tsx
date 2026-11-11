"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import { PricingPrompt } from "@/shared/blocks/payment/pricing-prompt";
import { type PricingPlan } from "@/shared/blocks/pricing/credit-pricing-modal";
import { Button } from "@/shared/components/ui/button";
import { useAppContext } from "@/shared/contexts/app";
import {
  CheckoutRequestError,
  normalizeCheckoutValue,
  requestCheckoutSession,
} from "@/shared/lib/payment-checkout";

export default function PopupPreview() {
  const locale = useLocale();
  const { user, setIsShowSignModal, configs } = useAppContext();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PricingPlan) => {
    const productId = plan.productId || plan.id;
    const currency = (plan.currency || "USD").toUpperCase();
    const paymentProvider =
      plan.paymentProvider || configs?.default_payment_provider || "stripe";

    if (!user) {
      setIsShowSignModal(true);
      throw new Error("signin required");
    }

    if (!productId) {
      toast.error("No product configured for this plan.");
      throw new Error("missing product id");
    }

    try {
      setLoadingPlanId(plan.id);

      const params = {
        product_id: productId,
        currency,
        locale: locale || "en",
        payment_provider: paymentProvider,
        metadata: {},
      };

      const { checkoutUrl } = await requestCheckoutSession(params, {
        productId,
        productName: plan.name,
        currency,
        value: normalizeCheckoutValue(plan.price),
        paymentProvider,
      });
      if (!checkoutUrl) {
        throw new Error("checkout url not found");
      }

      window.location.href = checkoutUrl;
    } catch (error: any) {
      if (error instanceof CheckoutRequestError && error.status === 401) {
        setIsShowSignModal(true);
        throw new Error("signin required");
      }

      console.log("checkout failed: ", error);
      if (error?.message !== "signin required") {
        toast.error("checkout failed: " + error?.message);
      }
      throw error;
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <PricingPrompt
      onSelectPlan={handleSelectPlan}
      loadingPlanId={loadingPlanId}
      autoPrompt={false}
    >
      {(openModal) => (
        <div className="relative min-h-screen overflow-hidden bg-[#0B0B0C] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(77,168,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(245,216,115,0.1),transparent_35%)]" />
          <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
            <div className="flex flex-col gap-3">
              <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#2A2A2F] bg-[#18181C] px-3 py-1 text-xs font-semibold tracking-[0.08em] text-[#00E0FF] shadow-[0_0_16px_rgba(0,224,255,0.2)]">
                Live preview
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-[#FFD36A] sm:text-5xl">
                Pricing Popup Showcase
              </h1>
              <p className="mx-auto max-w-2xl text-base text-[#C9C9D1] sm:text-lg">
                Click the gold button to open the new credit pricing modal with
                the dark, gold, and neon blue styling.
              </p>
            </div>

            <Button
              onClick={openModal}
              className="bg-[linear-gradient(90deg,#FFD36A,#F5D873)] text-black shadow-[0_0_24px_rgba(0,224,255,0.22)] transition hover:shadow-[0_0_28px_rgba(0,224,255,0.35)]"
            >
              Open pricing popup
            </Button>

            <p className="text-sm text-[#8D8D96]">
              Theme tokens are embedded in the modal, so it will look the same
              wherever you drop it.
            </p>
          </div>
        </div>
      )}
    </PricingPrompt>
  );
}
