"use client";

import { PAYMENTS_AVAILABLE } from "@/config/site";
import { notifyBetaPurchase } from "@/shared/blocks/payment/beta-purchase-notice";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import confetti from "canvas-confetti";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Shield,
  TicketPercent,
  X,
} from "lucide-react";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import {
  COMPARISON_TABLE_DATA,
  PAYG_COMPARISON_ROWS,
} from "@/themes/default/blocks/pricing-comparison-table";

import { PricingPlanCard } from "./pricing-plan-card";

export type PricingPlan = {
  id: string;
  productId?: string;
  currency?: string;
  paymentProvider?: string;
  name: string;
  description?: string;
  price: string;
  originalPrice?: string;
  credits: string;
  bonus?: string;
  features?: string[];
  ctaLabel: string;
  tag?: string;
  highlight?: boolean;
  accent?: ReactNode;
  group?: "one-time" | "monthly" | "yearly";
};

type PricingGroup = {
  id: "one-time" | "monthly" | "yearly";
  label: string;
  badge?: string;
};

type PricingModalDisplayState = {
  date: string;
  count: number;
  firstShownAt: number | null;
  lastShownAt: number | null;
};

type DiscountPanelCopy = {
  title: string;
  description: string;
  placeholder: string;
  apply: string;
  applied: string;
  remove: string;
  helper: string;
  appliedLabel: string;
  rateLabel: string;
};

const COMPARISON_ROW_LABEL_FALLBACKS: Record<string, string> = {
  credits_year: "Credits / Year",
  credits_month: "Credits / Month",
  credits: "Credits",
  image_gen: "Image Gen",
  video_seedance_2_0: "Video-Seedance 2.0",
  use_all_models: "Use All Models",
  priority: "Priority",
  multiple_tasks: "Multiple Tasks",
};

const ALL_MODELS_VALUE = "__ALL_MODELS__";

const PRICING_MODAL_DISPLAY_KEY = "credit_pricing_modal_display_state_v1";
const PRICING_MODAL_MAX_DAILY_SHOWS = 2;
const PRICING_MODAL_SECOND_SHOW_DELAY_MS = 5 * 60 * 1000;

const palette: CSSProperties = {
  "--modal-bg": "#111114",
  "--modal-border": "#2A2A2F",
  "--tab-bg": "#18181C",
  "--tab-active-bg": "#24242B",
  "--tab-active-text": "#FFD36A",
  "--tab-text": "#A7A8B4",
  "--card-bg": "#18181C",
  "--card-bg-active": "#1F1F25",
  "--card-border": "#2A2A2F",
  "--card-selected-border": "#F5D873",
  "--text-main": "#FFFFFF",
  "--text-soft": "#C9C9D1",
  "--text-muted": "#8D8D96",
  "--accent-cyan": "#00E0FF",
  "--accent-gold": "#FFD36A",
} as CSSProperties;

const desktopPalette: CSSProperties = {
  "--bg-dark": "#16161E",
  "--bg-panel": "#1C1C26",
  "--bg-card": "#222230",
  "--bg-card-highlight": "#252233",
  "--text-white": "#FFFFFF",
  "--text-light": "#E8E8EF",
  "--text-soft": "#B8B7C6",
  "--text-muted": "#7A7889",
  "--violet": "#8A36FF",
  "--violet-bright": "#D52FEA",
  "--pink": "#FF3D6E",
  "--green": "#1ED97E",
  "--border-default": "rgba(255,255,255,0.08)",
  "--border-strong": "rgba(255,255,255,0.12)",
  "--shadow-violet": "0 18px 50px rgba(138, 54, 255, 0.24)",
} as CSSProperties;

function fireConfetti() {
  const duration = 700;
  const end = Date.now() + duration;
  const colors = ["#FFD36A", "#F5D873", "#00E0FF", "#FFFFFF"];

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 45,
      origin: { x: 0, y: 0.55 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 45,
      origin: { x: 1, y: 0.55 },
      colors,
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

function splitPrice(price: string): { value: string; unit: string } {
  const normalized = price.trim();
  const slashIndex = normalized.lastIndexOf("/");
  if (slashIndex > 0 && slashIndex < normalized.length - 1) {
    const rawUnit = normalized.slice(slashIndex);
    return {
      value: normalized.slice(0, slashIndex).trim(),
      unit: rawUnit
        .replace("/month", "/mo")
        .replace("/Month", "/mo")
        .replace("/MONTH", "/mo"),
    };
  }

  return { value: normalized, unit: "" };
}

function getPlanLabelKey(plan: PricingPlan) {
  if (plan.id.includes("starter")) return "starter";
  if (plan.id.includes("professional")) return "professional";
  return "titan";
}

function getCompactPlanName(
  plan: PricingPlan,
  t: ReturnType<typeof useTranslations>,
) {
  return t(`credit_modal.plan_labels.${getPlanLabelKey(plan)}`);
}

function getDesktopGroupLabel(
  group: PricingGroup,
  locale: string,
  payAsYouGoLabel: string,
) {
  if (group.id !== "one-time") return group.label;
  if (locale.startsWith("en")) return payAsYouGoLabel;
  return group.label;
}

function getDesktopTitleClassName(locale: string) {
  if (locale.startsWith("ja") || locale.startsWith("ko")) {
    return "text-[10px] lg:text-[11px] xl:text-[13px]";
  }

  if (locale.startsWith("zh")) {
    return "text-[12px] lg:text-[14px] xl:text-[16px]";
  }

  return "text-[13px] lg:text-[15px] xl:text-[17px]";
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDisplayState(): PricingModalDisplayState {
  return {
    date: getTodayKey(),
    count: 0,
    firstShownAt: null,
    lastShownAt: null,
  };
}

function readPricingModalDisplayState(): PricingModalDisplayState {
  if (typeof window === "undefined") return getDefaultDisplayState();

  try {
    const raw = window.localStorage.getItem(PRICING_MODAL_DISPLAY_KEY);
    if (!raw) return getDefaultDisplayState();

    const parsed = JSON.parse(raw) as Partial<PricingModalDisplayState>;
    const state: PricingModalDisplayState = {
      date: parsed.date || getTodayKey(),
      count: typeof parsed.count === "number" ? parsed.count : 0,
      firstShownAt:
        typeof parsed.firstShownAt === "number" ? parsed.firstShownAt : null,
      lastShownAt:
        typeof parsed.lastShownAt === "number" ? parsed.lastShownAt : null,
    };

    return state.date === getTodayKey() ? state : getDefaultDisplayState();
  } catch {
    return getDefaultDisplayState();
  }
}

function writePricingModalDisplayState(state: PricingModalDisplayState) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(PRICING_MODAL_DISPLAY_KEY, JSON.stringify(state));
}

function canShowPricingModalNow() {
  const state = readPricingModalDisplayState();
  const now = Date.now();

  if (state.count >= PRICING_MODAL_MAX_DAILY_SHOWS) {
    return false;
  }

  if (
    state.count === 1 &&
    state.firstShownAt &&
    now - state.firstShownAt < PRICING_MODAL_SECOND_SHOW_DELAY_MS
  ) {
    return false;
  }

  return true;
}

function markPricingModalShown() {
  const state = readPricingModalDisplayState();
  const now = Date.now();

  writePricingModalDisplayState({
    date: getTodayKey(),
    count: Math.min(state.count + 1, PRICING_MODAL_MAX_DAILY_SHOWS),
    firstShownAt: state.firstShownAt ?? now,
    lastShownAt: now,
  });
}

export function CreditPricingModal({
  open,
  onOpenChange,
  plans: plansProp,
  onSelectPlan: onSelectPlanProp,
  loadingPlanId,
  bypassFrequencyControl = false,
  discountCodeValue = "",
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  appliedDiscountCode,
  appliedDiscountRateLabel,
  appliedDiscountAffiliateName,
  discountLoading = false,
  discountCopy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans?: PricingPlan[];
  onSelectPlan?: (plan: PricingPlan) => void;
  loadingPlanId?: string | null;
  bypassFrequencyControl?: boolean;
  discountCodeValue?: string;
  onDiscountCodeChange?: (value: string) => void;
  onApplyDiscount?: () => void;
  onRemoveDiscount?: () => void;
  appliedDiscountCode?: string;
  appliedDiscountRateLabel?: string;
  appliedDiscountAffiliateName?: string;
  discountLoading?: boolean;
  discountCopy?: DiscountPanelCopy;
}) {
  const onSelectPlan = (plan: PricingPlan) => {
    if (!PAYMENTS_AVAILABLE) {
      notifyBetaPurchase();
      return;
    }
    onSelectPlanProp?.(plan);
  };
  useEffect(() => {
    if (open && !PAYMENTS_AVAILABLE) {
      onOpenChange(false);
      notifyBetaPurchase();
    }
  }, [open, onOpenChange]);
  const t = useTranslations("pricing");
  const locale = useLocale();
  const hasTriggeredConfetti = useRef(false);
  const hasHandledOpenAttempt = useRef(false);
  const isMobile = useIsMobile();
  const [showDiscountPanel, setShowDiscountPanel] = useState(false);

  const defaultPricingGroups: PricingGroup[] = [
    {
      id: "yearly",
      label: t("credit_modal.tabs.yearly.label"),
    },
    {
      id: "monthly",
      label: t("credit_modal.tabs.monthly.label"),
    },
    {
      id: "one-time",
      label: t("credit_modal.tabs.one_time.label"),
    },
  ];

  const defaultPlans: PricingPlan[] = [
    {
      id: "starter",
      productId: "Starter",
      currency: "USD",
      name: t("credit_modal.plans.starter.name"),
      originalPrice: "$29.0",
      price: "$18.9",
      credits: t("credit_modal.plans.starter.credits"),
      ctaLabel: t("credit_modal.plans.starter.cta_label"),
      group: "one-time",
    },
    {
      id: "professional",
      productId: "Premium",
      currency: "USD",
      name: t("credit_modal.plans.professional.name"),
      originalPrice: "$80",
      price: "$29.9",
      credits: t("credit_modal.plans.professional.credits"),
      bonus: t("credit_modal.plans.professional.bonus"),
      ctaLabel: t("credit_modal.plans.professional.cta_label"),
      highlight: true,
      group: "one-time",
    },
    {
      id: "titan",
      productId: "Titan",
      currency: "USD",
      name: t("credit_modal.plans.titan.name"),
      originalPrice: "$199",
      price: "$99.9",
      credits: t("credit_modal.plans.titan.credits"),
      bonus: t("credit_modal.plans.titan.bonus"),
      ctaLabel: t("credit_modal.plans.titan.cta_label"),
      group: "one-time",
    },
    {
      id: "monthly-starter",
      productId: "Starter-Monthly",
      currency: "USD",
      name: t("credit_modal.plans.monthly_starter.name"),
      originalPrice: "$26.0",
      price: "$16.9/mo",
      credits: t("credit_modal.plans.monthly_starter.credits"),
      ctaLabel: t("credit_modal.plans.monthly_starter.cta_label"),
      group: "monthly",
    },
    {
      id: "monthly-professional",
      productId: "Premium-Monthly",
      currency: "USD",
      name: t("credit_modal.plans.monthly_professional.name"),
      originalPrice: "$80",
      price: "$26.9/mo",
      credits: t("credit_modal.plans.monthly_professional.credits"),
      bonus: t("credit_modal.plans.monthly_professional.bonus"),
      ctaLabel: t("credit_modal.plans.monthly_professional.cta_label"),
      highlight: true,
      group: "monthly",
    },
    {
      id: "monthly-titan",
      productId: "Titan-Monthly",
      currency: "USD",
      name: t("credit_modal.plans.monthly_titan.name"),
      originalPrice: "$199",
      price: "$89.9/mo",
      credits: t("credit_modal.plans.monthly_titan.credits"),
      bonus: t("credit_modal.plans.monthly_titan.bonus"),
      ctaLabel: t("credit_modal.plans.monthly_titan.cta_label"),
      group: "monthly",
    },
    {
      id: "yearly-starter",
      productId: "Starter-Yearly",
      currency: "USD",
      name: t("credit_modal.plans.yearly_starter.name"),
      originalPrice: "$179",
      price: "$9.9/mo",
      credits: t("credit_modal.plans.yearly_starter.credits"),
      ctaLabel: t("credit_modal.plans.yearly_starter.cta_label"),
      group: "yearly",
    },
    {
      id: "yearly-professional",
      productId: "Premium-Yearly",
      currency: "USD",
      name: t("credit_modal.plans.yearly_professional.name"),
      originalPrice: "$80",
      price: "$19.9/mo",
      credits: t("credit_modal.plans.yearly_professional.credits"),
      bonus: t("credit_modal.plans.yearly_professional.bonus"),
      ctaLabel: t("credit_modal.plans.yearly_professional.cta_label"),
      highlight: true,
      group: "yearly",
    },
    {
      id: "yearly-titan",
      productId: "Titan-Yearly",
      currency: "USD",
      name: t("credit_modal.plans.yearly_titan.name"),
      originalPrice: "$199",
      price: "$59.8/mo",
      credits: t("credit_modal.plans.yearly_titan.credits"),
      bonus: t("credit_modal.plans.yearly_titan.bonus"),
      ctaLabel: t("credit_modal.plans.yearly_titan.cta_label"),
      group: "yearly",
    },
  ];

  const plans = plansProp ?? defaultPlans;

  const [activeGroup, setActiveGroup] = useState<
    "one-time" | "monthly" | "yearly"
  >("yearly");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Trigger confetti when modal opens
  useEffect(() => {
    if (open && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      const timer = setTimeout(() => {
        fireConfetti();
      }, 200);
      return () => clearTimeout(timer);
    }
    if (!open) {
      hasTriggeredConfetti.current = false;
    }
  }, [open]);

  const filteredPlans = useMemo(
    () => plans.filter((plan) => !plan.group || plan.group === activeGroup),
    [plans, activeGroup],
  );

  useEffect(() => {
    if (filteredPlans.length === 0) {
      setSelectedPlanId("");
      return;
    }

    setSelectedPlanId((prev) => {
      if (filteredPlans.some((plan) => plan.id === prev)) {
        return prev;
      }

      const preferred = filteredPlans.find((plan) => plan.highlight);
      return preferred?.id || filteredPlans[0].id;
    });
  }, [filteredPlans]);

  const selectedPlan = filteredPlans.find((plan) => plan.id === selectedPlanId);
  const isSubmitting = Boolean(
    selectedPlan && loadingPlanId === selectedPlan.id,
  );

  const creatorCountdown = useCreatorCountdown();

  useEffect(() => {
    if (appliedDiscountCode) {
      setShowDiscountPanel(true);
    }
  }, [appliedDiscountCode]);

  useEffect(() => {
    if (!open) {
      hasHandledOpenAttempt.current = false;
      return;
    }

    if (bypassFrequencyControl) {
      hasHandledOpenAttempt.current = true;
      return;
    }

    if (hasHandledOpenAttempt.current) {
      return;
    }

    hasHandledOpenAttempt.current = true;

    if (!canShowPricingModalNow()) {
      onOpenChange(false);
      return;
    }

    markPricingModalShown();
  }, [open, onOpenChange, bypassFrequencyControl]);

  if (!PAYMENTS_AVAILABLE) return null;

  if (!isMobile) {
    return (
      <DesktopCreditPricingModal
        open={open}
        onOpenChange={onOpenChange}
        plans={plansProp}
        loadingPlanId={loadingPlanId}
        onSelectPlan={onSelectPlan}
        creatorCountdown={creatorCountdown}
        locale={locale}
        discountCodeValue={discountCodeValue}
        onDiscountCodeChange={onDiscountCodeChange}
        onApplyDiscount={onApplyDiscount}
        onRemoveDiscount={onRemoveDiscount}
        appliedDiscountCode={appliedDiscountCode}
        appliedDiscountRateLabel={appliedDiscountRateLabel}
        appliedDiscountAffiliateName={appliedDiscountAffiliateName}
        discountLoading={discountLoading}
        discountCopy={discountCopy}
      />
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100100] bg-[rgba(10,10,13,0.82)] backdrop-blur-[3px]" />
        <DialogPrimitive.Content
          style={{
            ...palette,
            maxHeight: isMobile
              ? "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 1rem)"
              : "90vh",
          }}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-[100101] w-[calc(100%-1rem)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-[var(--modal-border)] bg-[var(--modal-bg)] px-3 py-3 shadow-[0_32px_80px_rgba(15,23,42,0.22)] focus-visible:outline-none flex flex-col sm:w-[calc(100%-2rem)] sm:max-w-[520px] sm:rounded-[28px] sm:px-5 sm:py-5",
          )}
        >
          <DialogPrimitive.Close className="absolute right-3 top-3 z-50 inline-flex size-8 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-soft)] transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,224,255,0.4)] sm:right-4 sm:top-4 sm:size-9">
            <X className="size-4 sm:size-[18px]" />
            <span className="sr-only">{t("credit_modal.close")}</span>
          </DialogPrimitive.Close>

          <div className="flex flex-1 flex-col overflow-x-hidden">
            <header className="px-2 pt-2 text-center sm:px-3 sm:pt-3">
              <DialogPrimitive.Title className="text-[clamp(1.4rem,6vw,1.9rem)] font-extrabold leading-tight tracking-tight text-[#FFD36A] drop-shadow-[0_0_20px_rgba(255,211,106,0.2)]">
                {t("credit_modal.title")}
              </DialogPrimitive.Title>
            </header>

            <div className="mt-3 flex justify-center px-2 sm:mt-4 sm:px-3">
              <div className="inline-grid w-full grid-cols-3 rounded-[12px] bg-[var(--tab-bg)] p-1">
                {defaultPricingGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroup(group.id)}
                    className={cn(
                      "h-9 rounded-[10px] px-2 text-[clamp(0.75rem,3.2vw,0.9rem)] font-semibold leading-tight transition-all duration-200 sm:h-10",
                      activeGroup === group.id
                        ? "bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-[0_0_18px_rgba(255,211,106,0.22)]"
                        : "text-[var(--tab-text)] hover:text-[var(--text-soft)]",
                    )}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex-1 overflow-x-hidden overflow-y-auto px-1 pb-1 sm:mt-4 sm:px-2 sm:pb-2">
              <div className="space-y-2 pt-6 sm:space-y-2.5 sm:pt-7">
                {filteredPlans.map((plan) => {
                  const { value, unit } = splitPrice(plan.price);
                  const isSelected = plan.id === selectedPlanId;

                  return (
                    <PricingPlanCard
                      key={plan.id}
                      highlighted={isSelected}
                      selected={isSelected}
                      selectable
                      showSelectionIndicator
                      badge={
                        plan.highlight
                          ? t("credit_modal.badges.most_popular")
                          : undefined
                      }
                      badgeClassName="bg-gradient-to-r from-[#FFD36A] to-[#F5D873] px-3 py-0.5 text-[10px] text-[#18181C] shadow-[0_0_20px_rgba(255,211,106,0.35)] ring-1 ring-white/20 sm:px-4 sm:py-1 sm:text-xs"
                      selectionIndicatorClassName={cn(
                        isSelected
                          ? "right-3 top-3 border-[var(--accent-cyan)] bg-[var(--accent-cyan)] text-[#111114] sm:right-3.5 sm:top-3.5"
                          : "right-3 top-3 border-[var(--card-border)] bg-[#111114] text-transparent sm:right-3.5 sm:top-3.5",
                      )}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "rounded-[18px] px-4 py-2.5 transition-all duration-200 sm:rounded-[22px] sm:px-5 sm:py-3.5 relative overflow-visible",
                        plan.highlight && "ring-1 ring-amber-200/30",
                        isSelected
                          ? "bg-[var(--card-bg-active)] border-[var(--card-selected-border)] shadow-[0_0_35px_rgba(0,224,255,0.16)]"
                          : "bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[#4DA8FF]",
                      )}
                    >
                      {plan.highlight && (
                        <div className="pointer-events-none absolute inset-0 rounded-[18px] sm:rounded-[22px] overflow-hidden">
                          <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_50%_0%,rgba(255,211,106,0.15),transparent_60%)]" />
                          <div className="absolute inset-0 opacity-30 [background:linear-gradient(120deg,transparent,rgba(255,211,106,0.3),transparent)] [background-size:200%_100%] animate-[shimmer_3s_linear_infinite]" />
                        </div>
                      )}
                      <div className="space-y-2 text-center sm:space-y-2.5 relative z-10">
                        <h3
                          className={cn(
                            "text-[clamp(1.1rem,5vw,1.35rem)] font-bold leading-tight",
                            plan.highlight
                              ? "text-amber-50"
                              : "text-[var(--text-main)]",
                          )}
                        >
                          {t(
                            `credit_modal.plan_labels.${getPlanLabelKey(plan)}`,
                          )}
                        </h3>

                        <div className="flex items-end justify-center gap-1.5 sm:gap-2">
                          {plan.originalPrice && (
                            <span className="text-[clamp(0.75rem,3.2vw,0.9rem)] text-[var(--text-muted)] line-through">
                              {plan.originalPrice}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-[clamp(1.75rem,8vw,2.25rem)] font-extrabold leading-none",
                              plan.highlight
                                ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,211,106,0.4)]"
                                : "text-[var(--text-main)]",
                            )}
                          >
                            {value}
                          </span>
                          {unit && (
                            <span className="pb-0.5 text-[clamp(0.75rem,3.2vw,0.95rem)] font-semibold text-[var(--text-muted)]">
                              {unit}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-[clamp(0.75rem,3.2vw,0.9rem)] font-medium text-[var(--text-soft)] sm:space-y-1.5">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <CheckCircle2 className="size-3.5 text-[var(--accent-gold)] sm:size-4" />
                            <span>{plan.credits}</span>
                          </div>
                          {plan.bonus && (
                            <div className="flex items-center justify-center gap-1.5 text-[var(--accent-cyan)] sm:gap-2">
                              <TicketPercent className="size-3.5 text-[var(--accent-cyan)] sm:size-4" />
                              <span>{plan.bonus}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </PricingPlanCard>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 space-y-1.5 px-2 pb-1 sm:mt-4 sm:space-y-2 sm:px-3 sm:pb-1.5">
              <button
                type="button"
                onClick={() => selectedPlan && onSelectPlan?.(selectedPlan)}
                disabled={!selectedPlan || isSubmitting}
                className="h-12 w-full rounded-full bg-[linear-gradient(90deg,#FFD36A,#F5D873)] text-[clamp(0.9rem,3.8vw,1.05rem)] font-bold text-[#111114] shadow-[0_14px_30px_rgba(245,216,115,0.32)] transition-all duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 sm:h-13"
              >
                {isSubmitting
                  ? t("page.processing")
                  : `${selectedPlan?.ctaLabel || t("credit_modal.default_cta")} →`}
              </button>
              {discountCopy ? (
                <div className="rounded-[16px] border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setShowDiscountPanel((value) => !value)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--text-main)]">
                        {discountCopy.title}
                      </p>
                      <p className="pt-0.5 text-[10px] leading-4 text-[var(--text-muted)]">
                        {appliedDiscountCode
                          ? `${discountCopy.applied}: ${appliedDiscountCode}`
                          : discountCopy.placeholder}
                      </p>
                    </div>
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/8 bg-black/15 text-[var(--text-soft)]">
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform duration-200",
                          showDiscountPanel && "rotate-180",
                        )}
                      />
                    </span>
                  </button>

                  {showDiscountPanel ? (
                    <div className="mt-2.5 space-y-2 border-t border-white/6 pt-2.5">
                      <div className="flex gap-2">
                        <input
                          value={discountCodeValue}
                          onChange={(event) =>
                            onDiscountCodeChange?.(
                              event.target.value.toUpperCase(),
                            )
                          }
                          placeholder={discountCopy.placeholder}
                          className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--card-border)] bg-black/20 px-3 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)]"
                        />
                        {appliedDiscountCode ? (
                          <button
                            type="button"
                            onClick={onRemoveDiscount}
                            className="shrink-0 rounded-xl border border-[var(--card-border)] px-3 text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
                          >
                            {discountCopy.remove}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onApplyDiscount}
                            className="shrink-0 rounded-xl bg-[linear-gradient(90deg,#FFD36A,#F5D873)] px-3 text-xs font-bold text-[#111114] transition hover:brightness-105"
                          >
                            {discountLoading ? "..." : discountCopy.apply}
                          </button>
                        )}
                      </div>
                      {appliedDiscountCode && (
                        <p className="text-[11px] text-[var(--text-soft)]">
                          {discountCopy.rateLabel}: {appliedDiscountRateLabel}
                          {appliedDiscountAffiliateName
                            ? ` · ${appliedDiscountAffiliateName}`
                            : ""}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <p className="text-center text-[clamp(0.7rem,2.8vw,0.8rem)] text-[var(--text-muted)]">
                {t("credit_modal.recurring_billing_note")}
              </p>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function useCreatorCountdown() {
  const [creatorCountdown, setCreatorCountdown] = useState<string>("");

  useEffect(() => {
    const COUNTDOWN_DURATION = 10 * 60 * 1000;
    if (typeof window === "undefined") return;

    const key = "creator_offer_deadline_v2";
    const now = Date.now();
    let deadline = Number(window.localStorage.getItem(key));
    if (
      !deadline ||
      Number.isNaN(deadline) ||
      deadline < now ||
      deadline - now > COUNTDOWN_DURATION
    ) {
      deadline = now + COUNTDOWN_DURATION;
      window.localStorage.setItem(key, String(deadline));
    }

    const formatCountdown = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      const centiseconds = Math.floor((ms % 1000) / 10);

      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0",
      )}:${String(centiseconds).padStart(2, "0")}`;
    };

    const updateCountdown = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        deadline = Date.now() + COUNTDOWN_DURATION;
        window.localStorage.setItem(key, String(deadline));
        setCreatorCountdown(formatCountdown(COUNTDOWN_DURATION));
        return;
      }

      setCreatorCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 10);
    return () => window.clearInterval(timer);
  }, []);

  return creatorCountdown;
}

function DesktopCreditPricingModal({
  open,
  onOpenChange,
  plans,
  loadingPlanId,
  onSelectPlan,
  creatorCountdown,
  locale,
  discountCodeValue = "",
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  appliedDiscountCode,
  appliedDiscountRateLabel,
  appliedDiscountAffiliateName,
  discountLoading = false,
  discountCopy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans?: PricingPlan[];
  loadingPlanId?: string | null;
  onSelectPlan?: (plan: PricingPlan) => void;
  creatorCountdown: string;
  locale: string;
  discountCodeValue?: string;
  onDiscountCodeChange?: (value: string) => void;
  onApplyDiscount?: () => void;
  onRemoveDiscount?: () => void;
  appliedDiscountCode?: string;
  appliedDiscountRateLabel?: string;
  appliedDiscountAffiliateName?: string;
  discountLoading?: boolean;
  discountCopy?: DiscountPanelCopy;
}) {
  const t = useTranslations("pricing");
  const defaultPricingGroups: PricingGroup[] = [
    {
      id: "yearly",
      label: t("credit_modal.tabs.yearly.label"),
      badge: t("credit_modal.tabs.yearly.badge"),
    },
    {
      id: "monthly",
      label: t("credit_modal.tabs.monthly.label"),
    },
    {
      id: "one-time",
      label: t("credit_modal.tabs.one_time.label"),
    },
  ];

  const defaultPlans: PricingPlan[] = [
    {
      id: "starter",
      productId: "Starter",
      currency: "USD",
      name: t("credit_modal.plans.starter.name"),
      description: t("credit_modal.plans.starter.description"),
      originalPrice: "$29.0",
      price: "$18.9",
      credits: t("credit_modal.plans.starter.credits"),
      features: [
        t("credit_modal.plans.starter.features.1"),
        t("credit_modal.plans.starter.features.2"),
        t("credit_modal.plans.starter.features.3"),
        t("credit_modal.plans.starter.features.4"),
        t("credit_modal.plans.starter.features.5"),
      ],
      ctaLabel: t("credit_modal.plans.starter.cta_label"),
      group: "one-time",
    },
    {
      id: "professional",
      productId: "Premium",
      currency: "USD",
      name: t("credit_modal.plans.professional.name"),
      description: t("credit_modal.plans.professional.description"),
      originalPrice: "$80",
      price: "$29.9",
      credits: t("credit_modal.plans.professional.credits"),
      bonus: t("credit_modal.plans.professional.bonus"),
      tag: t("credit_modal.plans.professional.tag"),
      highlight: true,
      features: [
        t("credit_modal.plans.professional.features.1"),
        t("credit_modal.plans.professional.features.2"),
        t("credit_modal.plans.professional.features.3"),
        t("credit_modal.plans.professional.features.4"),
      ],
      ctaLabel: t("credit_modal.plans.professional.cta_label"),
      group: "one-time",
    },
    {
      id: "titan",
      productId: "Titan",
      currency: "USD",
      name: t("credit_modal.plans.titan.name"),
      description: t("credit_modal.plans.titan.description"),
      originalPrice: "$199",
      price: "$99.9",
      credits: t("credit_modal.plans.titan.credits"),
      bonus: t("credit_modal.plans.titan.bonus"),
      features: [
        t("credit_modal.plans.titan.features.1"),
        t("credit_modal.plans.titan.features.2"),
        t("credit_modal.plans.titan.features.3"),
        t("credit_modal.plans.titan.features.4"),
      ],
      ctaLabel: t("credit_modal.plans.titan.cta_label"),
      group: "one-time",
    },
    {
      id: "monthly-starter",
      productId: "Starter-Monthly",
      currency: "USD",
      name: t("credit_modal.plans.monthly_starter.name"),
      description: t("credit_modal.plans.monthly_starter.description"),
      originalPrice: "$26.0",
      price: "$16.9/mo",
      credits: t("credit_modal.plans.monthly_starter.credits"),
      features: [
        t("credit_modal.plans.monthly_starter.features.1"),
        t("credit_modal.plans.monthly_starter.features.2"),
        t("credit_modal.plans.monthly_starter.features.3"),
        t("credit_modal.plans.monthly_starter.features.4"),
        t("credit_modal.plans.monthly_starter.features.5"),
      ],
      ctaLabel: t("credit_modal.plans.monthly_starter.cta_label"),
      group: "monthly",
    },
    {
      id: "monthly-professional",
      productId: "Premium-Monthly",
      currency: "USD",
      name: t("credit_modal.plans.monthly_professional.name"),
      description: t("credit_modal.plans.monthly_professional.description"),
      originalPrice: "$80",
      price: "$26.9/mo",
      credits: t("credit_modal.plans.monthly_professional.credits"),
      bonus: t("credit_modal.plans.monthly_professional.bonus"),
      tag: t("credit_modal.plans.monthly_professional.tag"),
      highlight: true,
      features: [
        t("credit_modal.plans.monthly_professional.features.1"),
        t("credit_modal.plans.monthly_professional.features.2"),
        t("credit_modal.plans.monthly_professional.features.3"),
        t("credit_modal.plans.monthly_professional.features.4"),
      ],
      ctaLabel: t("credit_modal.plans.monthly_professional.cta_label"),
      group: "monthly",
    },
    {
      id: "monthly-titan",
      productId: "Titan-Monthly",
      currency: "USD",
      name: t("credit_modal.plans.monthly_titan.name"),
      description: t("credit_modal.plans.monthly_titan.description"),
      originalPrice: "$199",
      price: "$89.9/mo",
      credits: t("credit_modal.plans.monthly_titan.credits"),
      bonus: t("credit_modal.plans.monthly_titan.bonus"),
      features: [
        t("credit_modal.plans.monthly_titan.features.1"),
        t("credit_modal.plans.monthly_titan.features.2"),
        t("credit_modal.plans.monthly_titan.features.3"),
        t("credit_modal.plans.monthly_titan.features.4"),
      ],
      ctaLabel: t("credit_modal.plans.monthly_titan.cta_label"),
      group: "monthly",
    },
    {
      id: "yearly-starter",
      productId: "Starter-Yearly",
      currency: "USD",
      name: t("credit_modal.plans.yearly_starter.name"),
      description: t("credit_modal.plans.yearly_starter.description"),
      originalPrice: "$179",
      price: "$9.9/mo",
      credits: t("credit_modal.plans.yearly_starter.credits"),
      features: [
        t("credit_modal.plans.yearly_starter.features.1"),
        t("credit_modal.plans.yearly_starter.features.2"),
        t("credit_modal.plans.yearly_starter.features.3"),
        t("credit_modal.plans.yearly_starter.features.4"),
        t("credit_modal.plans.yearly_starter.features.5"),
      ],
      ctaLabel: t("credit_modal.plans.yearly_starter.cta_label"),
      group: "yearly",
    },
    {
      id: "yearly-professional",
      productId: "Premium-Yearly",
      currency: "USD",
      name: t("credit_modal.plans.yearly_professional.name"),
      description: t("credit_modal.plans.yearly_professional.description"),
      originalPrice: "$80",
      price: "$19.9/mo",
      credits: t("credit_modal.plans.yearly_professional.credits"),
      bonus: t("credit_modal.plans.yearly_professional.bonus"),
      tag: t("credit_modal.plans.yearly_professional.tag"),
      highlight: true,
      features: [
        t("credit_modal.plans.yearly_professional.features.1"),
        t("credit_modal.plans.yearly_professional.features.2"),
        t("credit_modal.plans.yearly_professional.features.3"),
        t("credit_modal.plans.yearly_professional.features.4"),
      ],
      ctaLabel: t("credit_modal.plans.yearly_professional.cta_label"),
      group: "yearly",
    },
    {
      id: "yearly-titan",
      productId: "Titan-Yearly",
      currency: "USD",
      name: t("credit_modal.plans.yearly_titan.name"),
      description: t("credit_modal.plans.yearly_titan.description"),
      originalPrice: "$199",
      price: "$59.8/mo",
      credits: t("credit_modal.plans.yearly_titan.credits"),
      bonus: t("credit_modal.plans.yearly_titan.bonus"),
      features: [
        t("credit_modal.plans.yearly_titan.features.1"),
        t("credit_modal.plans.yearly_titan.features.2"),
        t("credit_modal.plans.yearly_titan.features.3"),
        t("credit_modal.plans.yearly_titan.features.4"),
      ],
      ctaLabel: t("credit_modal.plans.yearly_titan.cta_label"),
      group: "yearly",
    },
  ];

  const desktopPlans = plans ?? defaultPlans;
  const [activeGroup, setActiveGroup] = useState<
    "one-time" | "monthly" | "yearly"
  >("yearly");
  const filteredPlans = useMemo(
    () =>
      desktopPlans.filter((plan) => !plan.group || plan.group === activeGroup),
    [desktopPlans, activeGroup],
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  useEffect(() => {
    if (filteredPlans.length === 0) {
      setSelectedPlanId("");
      return;
    }

    setSelectedPlanId((prev) => {
      if (filteredPlans.some((plan) => plan.id === prev)) {
        return prev;
      }

      const preferred = filteredPlans.find((plan) => plan.highlight);
      return preferred?.id || filteredPlans[0]?.id || "";
    });
  }, [filteredPlans]);

  const selectedPlan = filteredPlans.find((plan) => plan.id === selectedPlanId);
  const tableRows = COMPARISON_TABLE_DATA[activeGroup] ?? PAYG_COMPARISON_ROWS;
  const allModelsLabel = t.has("credit_modal.comparison.values.all_models")
    ? t("credit_modal.comparison.values.all_models")
    : "All";

  const countdownSegments = (creatorCountdown || "25:55:97").split(":");

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100100] bg-[rgba(11,11,12,0.85)] backdrop-blur-sm" />
        <DialogPrimitive.Content
          style={{
            ...desktopPalette,
            maxHeight: "min(86vh, 840px)",
          }}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-[100101] flex w-[min(calc(100vw-40px),1120px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-dark)] text-[13px] text-[var(--text-light)] shadow-[0_26px_90px_rgba(0,0,0,0.52)] focus-visible:outline-none lg:w-[min(calc(100vw-56px),1160px)] lg:rounded-[24px] xl:rounded-[28px]",
          )}
        >
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_100%,rgba(255,61,110,0.12),transparent_28%),radial-gradient(circle_at_72%_18%,rgba(138,54,255,0.16),transparent_22%),linear-gradient(180deg,#1a1a23_0%,#171720_100%)]" />
          <DialogPrimitive.Close className="absolute right-5 top-5 z-20 inline-flex size-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-[var(--text-soft)] transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 lg:right-6 lg:top-6 lg:size-11 xl:right-8 xl:top-8 xl:size-12">
            <X className="size-4 lg:size-[18px] xl:size-5" />
            <span className="sr-only">{t("credit_modal.close")}</span>
          </DialogPrimitive.Close>

          <div className="grid max-h-[min(86vh,840px)] grid-cols-[minmax(0,1.24fr)_minmax(335px,0.76fr)] overflow-hidden">
            <section className="overflow-y-auto border-r border-white/8 px-3 py-3 lg:px-4 lg:py-4 xl:px-5 xl:py-5 2xl:px-6 2xl:py-6">
              <div className="relative overflow-hidden rounded-[18px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.01))] lg:rounded-[20px] xl:rounded-[22px]">
                <div className="grid grid-cols-[1.55fr_repeat(3,minmax(0,0.82fr))] border-b border-white/8 px-4 py-3.5 lg:px-4 lg:py-4 xl:px-5 xl:py-4.5">
                  <div className="text-[12px] font-black uppercase tracking-[0.1em] text-white/32 lg:text-[13px] xl:text-[14px]">
                    {t("credit_modal.comparison.features_label")}
                  </div>
                  {filteredPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative text-center text-[12px] font-black uppercase tracking-[0.04em] lg:text-[13px] xl:text-[14px]",
                        plan.highlight ? "text-[#d285ff]" : "text-white/34",
                      )}
                    >
                      <span className="block leading-tight">
                        {getCompactPlanName(plan, t)}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  {tableRows.map((row, rowIndex) => (
                    <div
                      key={`${activeGroup}-${row.labelKey}`}
                      className={cn(
                        "grid grid-cols-[1.55fr_repeat(3,minmax(0,0.82fr))] items-center px-4 py-3 lg:px-4 lg:py-3.5 xl:px-5 xl:py-4",
                        rowIndex % 2 === 1 && "bg-white/[0.012]",
                        rowIndex < tableRows.length - 1 &&
                          "border-b border-white/6",
                      )}
                    >
                      <div className="pr-3 text-[13px] font-semibold leading-snug text-white lg:pr-4 lg:text-[14px] xl:pr-5 xl:text-[15px]">
                        {t.has(`credit_modal.comparison.rows.${row.labelKey}`)
                          ? t(`credit_modal.comparison.rows.${row.labelKey}`)
                          : COMPARISON_ROW_LABEL_FALLBACKS[row.labelKey]}
                      </div>
                      {row.values.map((value, valueIndex) => (
                        <div
                          key={`${row.labelKey}-${valueIndex}`}
                          className={cn(
                            "flex items-center justify-center text-[12px] font-semibold text-white/72 lg:text-[13px] xl:text-[14px]",
                            valueIndex === 1 && "text-[#c88cff]",
                          )}
                        >
                          {typeof value === "boolean" ? (
                            value ? (
                              <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-[var(--green)] lg:size-6 xl:size-[26px]">
                                <Check
                                  className="size-3 text-white lg:size-3.5"
                                  strokeWidth={3}
                                />
                              </span>
                            ) : (
                              <span className="text-white/24">-</span>
                            )
                          ) : (
                            <span className="text-center leading-tight">
                              {value === ALL_MODELS_VALUE
                                ? allModelsLabel
                                : value}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-y-auto px-3 py-3 lg:px-3.5 lg:py-3.5 xl:px-4 xl:py-4 2xl:px-5 2xl:py-5">
              <div className="flex min-h-full flex-col">
                <div className="space-y-1.5 pb-2.5 lg:space-y-2 lg:pb-3 xl:space-y-2.5 xl:pb-3">
                  <DialogPrimitive.Title
                    className={cn(
                      "flex items-center gap-1.5 pr-10 font-black leading-none tracking-[-0.05em] text-transparent bg-[linear-gradient(90deg,#8A36FF_0%,#D52FEA_52%,#FF4A6E_100%)] bg-clip-text lg:gap-2",
                      getDesktopTitleClassName(locale),
                    )}
                  >
                    <Shield
                      className="size-3.5 shrink-0 text-[#8A36FF] lg:size-4 xl:size-[18px]"
                      fill="currentColor"
                      strokeWidth={1.5}
                    />
                    <span className="whitespace-nowrap">
                      {t("credit_modal.title").replace("🎉 ", "")}
                    </span>
                  </DialogPrimitive.Title>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {countdownSegments.map((segment, index) => {
                      const unit =
                        index === 0
                          ? t("credit_modal.countdown_units.minute")
                          : index === 1
                            ? t("credit_modal.countdown_units.second")
                            : t("credit_modal.countdown_units.centisecond");
                      return (
                        <div
                          key={`${unit}-${segment}`}
                          className="flex items-center gap-1.5"
                        >
                          <div className="flex min-w-[54px] items-end justify-center rounded-[10px] border border-white/8 bg-white/[0.04] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] lg:min-w-[58px] xl:min-w-[62px]">
                            <span className="text-[14px] font-black leading-none text-white lg:text-[15px] xl:text-[16px]">
                              {segment}
                            </span>
                            <span className="ml-1 pb-0.5 text-[9px] font-bold text-white/34 lg:text-[10px] xl:text-[11px]">
                              {unit}
                            </span>
                          </div>
                          {index < countdownSegments.length - 1 && (
                            <span className="text-[14px] font-black text-white/24 lg:text-[15px] xl:text-[16px]">
                              :
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="inline-flex max-w-full flex-wrap rounded-[16px] border border-white/8 bg-white/[0.035] p-1 lg:flex-nowrap lg:rounded-full">
                    {defaultPricingGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setActiveGroup(group.id)}
                        className={cn(
                          "flex min-w-[96px] flex-1 items-center justify-center gap-1.5 rounded-[12px] px-2 py-1.5 text-[10px] font-extrabold transition-all duration-200 lg:min-w-[100px] lg:px-2.5 lg:py-2 lg:text-[10px] xl:min-w-[108px] xl:gap-1.5 xl:rounded-full xl:px-3 xl:py-2 xl:text-[11px]",
                          activeGroup === group.id
                            ? "bg-[linear-gradient(90deg,#7E39FF_0%,#D72EEA_100%)] text-white shadow-[0_10px_24px_rgba(138,54,255,0.16)]"
                            : "text-white/60 hover:text-white",
                        )}
                      >
                        <span className="whitespace-nowrap">
                          {getDesktopGroupLabel(
                            group,
                            locale,
                            t("credit_modal.tabs.one_time_short"),
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-white/8 pt-2.5 lg:space-y-1.5 xl:space-y-2">
                  {filteredPlans.map((plan) => {
                    const isSelected = plan.id === selectedPlanId;
                    const { value, unit } = splitPrice(plan.price);
                    const compactName = getCompactPlanName(plan, t);

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={cn(
                          "relative w-full cursor-pointer rounded-[15px] border px-3 py-2 text-left transition-colors duration-200 lg:rounded-[16px] lg:px-3.5 lg:py-2.5 xl:rounded-[18px] xl:px-4 xl:py-3",
                          isSelected
                            ? "border-[#7650ff] bg-[linear-gradient(180deg,rgba(65,46,105,0.36),rgba(36,34,49,0.96))] shadow-[0_0_0_1px_rgba(118,80,255,0.18),0_14px_30px_rgba(118,80,255,0.12)]"
                            : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] hover:border-white/16 hover:bg-white/[0.045]",
                        )}
                      >
                        {plan.highlight && (
                          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#7E39FF_0%,#D72EEA_100%)] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-white shadow-[0_8px_18px_rgba(138,54,255,0.14)] lg:px-3 lg:text-[9px] xl:px-3.5 xl:text-[10px]">
                            {t("credit_modal.badges.most_popular")}
                          </span>
                        )}

                        <div className="flex items-center justify-between gap-2 lg:gap-2.5">
                          <div className="min-w-0 space-y-1">
                            <div className="max-w-[150px] lg:max-w-[165px] xl:max-w-[180px]">
                              <div>
                                <div className="whitespace-nowrap text-[13px] font-black leading-none text-white lg:text-[14px] xl:text-[15px]">
                                  {compactName}
                                </div>
                                <div className="mt-1 text-[9px] font-semibold leading-snug text-white/42 lg:text-[10px] xl:text-[11px]">
                                  {plan.credits}
                                </div>
                              </div>
                              {plan.bonus && (
                                <span className="inline-flex w-fit max-w-full whitespace-nowrap rounded-full border border-[#6f45ff]/70 bg-[rgba(124,72,255,0.12)] px-2 py-1 text-[8px] font-bold leading-none text-[#ae8cff] lg:px-2.5 lg:text-[9px] xl:text-[10px]">
                                  {plan.bonus}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5 lg:gap-2 xl:gap-2.5">
                            <div className="text-right">
                              {plan.originalPrice && (
                                <div className="mb-0.5 text-[9px] font-bold text-white/22 line-through lg:text-[10px] xl:text-[11px]">
                                  {plan.originalPrice}
                                </div>
                              )}
                              <div className="flex items-end gap-1">
                                <span
                                  className={cn(
                                    "text-[21px] font-black leading-[0.9] tracking-[-0.04em] lg:text-[24px] xl:text-[26px]",
                                    plan.highlight
                                      ? "text-[#fff7ff] drop-shadow-[0_2px_14px_rgba(220,120,255,0.2)]"
                                      : "text-white",
                                  )}
                                >
                                  {value}
                                </span>
                                {unit && (
                                  <span
                                    className={cn(
                                      "pb-0.5 text-[9px] font-bold uppercase tracking-[0.03em] lg:text-[10px] xl:text-[11px]",
                                      plan.highlight
                                        ? "text-white/82"
                                        : "text-white/60",
                                    )}
                                  >
                                    {unit}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              className={cn(
                                "mt-0.5 inline-flex size-5 shrink-0 rounded-full border-[3px] transition-all lg:size-[22px] xl:size-6",
                                isSelected
                                  ? "border-[#a44cff] bg-white shadow-[0_0_0_3px_rgba(164,76,255,0.18)] lg:shadow-[0_0_0_4px_rgba(164,76,255,0.22)]"
                                  : "border-white/20 bg-transparent",
                              )}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto pt-1.5 lg:pt-2 xl:pt-2.5">
                  {discountCopy ? (
                    <div className="mb-3 rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-white">
                            {discountCopy.title}
                          </p>
                          <p className="pt-1 text-[11px] leading-5 text-white/46">
                            {discountCopy.description}
                          </p>
                        </div>
                        {appliedDiscountCode ? (
                          <span className="inline-flex shrink-0 rounded-full border border-[#7650ff]/60 bg-[#7650ff]/14 px-2.5 py-1 text-[10px] font-bold text-[#cfb7ff]">
                            {discountCopy.appliedLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <input
                          value={discountCodeValue}
                          onChange={(event) =>
                            onDiscountCodeChange?.(
                              event.target.value.toUpperCase(),
                            )
                          }
                          placeholder={discountCopy.placeholder}
                          className="h-11 min-w-0 flex-1 rounded-[14px] border border-white/10 bg-black/20 px-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-white outline-none placeholder:text-white/28 focus:border-[#9d74ff]"
                        />
                        {appliedDiscountCode ? (
                          <button
                            type="button"
                            onClick={onRemoveDiscount}
                            className="shrink-0 rounded-[14px] border border-white/12 px-4 text-[12px] font-semibold text-white transition hover:border-white/24 hover:bg-white/[0.05]"
                          >
                            {discountCopy.remove}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onApplyDiscount}
                            className="shrink-0 rounded-[14px] bg-[linear-gradient(90deg,#7E39FF_0%,#D72EEA_100%)] px-4 text-[12px] font-bold text-white shadow-[0_10px_24px_rgba(138,54,255,0.18)] transition hover:brightness-105"
                          >
                            {discountLoading ? "..." : discountCopy.apply}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 rounded-[14px] border border-white/6 bg-black/10 px-3.5 py-2.5">
                        {appliedDiscountCode ? (
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold text-[#ffd36a]">
                              {discountCopy.applied}: {appliedDiscountCode}
                            </p>
                            <p className="text-[11px] text-white/60">
                              {discountCopy.rateLabel}:{" "}
                              {appliedDiscountRateLabel}
                              {appliedDiscountAffiliateName
                                ? ` · ${appliedDiscountAffiliateName}`
                                : ""}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] leading-5 text-white/40">
                            {discountCopy.helper}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => selectedPlan && onSelectPlan?.(selectedPlan)}
                    disabled={
                      !selectedPlan || loadingPlanId === selectedPlan?.id
                    }
                    className="flex h-[40px] w-full cursor-pointer items-center justify-center rounded-[15px] bg-[linear-gradient(90deg,#7D39FF_0%,#D830E8_52%,#FF3D6E_100%)] text-[13px] font-black text-white shadow-[0_14px_32px_rgba(172,57,255,0.22)] transition hover:brightness-105 hover:shadow-[0_16px_36px_rgba(172,57,255,0.26)] disabled:cursor-not-allowed disabled:opacity-70 lg:h-[42px] lg:rounded-[16px] lg:text-[14px] xl:h-[46px] xl:rounded-[18px] xl:text-[15px]"
                  >
                    {loadingPlanId === selectedPlan?.id
                      ? t("page.processing")
                      : `${selectedPlan?.ctaLabel || t("credit_modal.default_cta")} →`}
                  </button>
                  <p className="pt-1 text-center text-[9px] font-semibold text-white/24 lg:pt-1.5 lg:text-[10px] xl:text-[11px]">
                    {t("credit_modal.recurring_billing_note")}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
