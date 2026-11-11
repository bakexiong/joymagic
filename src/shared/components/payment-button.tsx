"use client";

import { useLocale } from "next-intl";
import { PAYMENTS_AVAILABLE } from "@/config/site";
import { useRouter } from "@/core/i18n/navigation";

import { Button } from "@/shared/components/ui/button";
import { useAppContext } from "@/shared/contexts/app";

interface PaymentButtonProps {
  /**
   * Minimum credits threshold. Button will only show if user has less than this amount.
   * @default 20
   */
  minCredits?: number;
  /**
   * Custom button text
   */
  buttonText?: string;
  /**
   * Custom pricing page URL
   * @default '/pricing'
   */
  pricingUrl?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function PaymentButton({
  minCredits = 20,
  buttonText,
  pricingUrl = "/pricing",
  className,
}: PaymentButtonProps) {
  const { user } = useAppContext();
  const locale = useLocale();
  const router = useRouter();
  const label = PAYMENTS_AVAILABLE
    ? buttonText || "Click to Pay"
    : locale.startsWith("zh")
      ? "查看计划价格"
      : "View planned pricing";

  // 未登录时始终展示；登录后在积分不足 minCredits 时展示
  const isFreeUser = !user;
  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const hasLowCredits = !!user && remainingCredits < minCredits;
  const shouldShow = isFreeUser || hasLowCredits;

  // Return null if conditions are not met (default behavior: hidden)
  if (shouldShow) {
    return (
      <Button
        onClick={() => {
          router.push(pricingUrl);
        }}
        className={`w-full mt-3 h-11 rounded-2xl text-base font-semibold text-white shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 animate-pulse transition-transform duration-300 hover:scale-[1.02] ${className || ""}`}
        size="default"
      >
        {PAYMENTS_AVAILABLE && <span className="mr-2">💳</span>}
        {label}
      </Button>
    );
  }
  return null;
}
