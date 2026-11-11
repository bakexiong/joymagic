"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, TicketPercent, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/core/i18n/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAppContext } from "@/shared/contexts/app";
import {
  CheckoutRequestError,
  requestCheckoutSession,
} from "@/shared/lib/payment-checkout";
import { cn } from "@/shared/lib/utils";
import { Subscription } from "@/shared/models/subscription";
import {
  PricingCurrency,
  PricingItem,
  Pricing as PricingType,
} from "@/shared/types/blocks/pricing";
import { PricingComparisonTable } from "@/themes/default/blocks/pricing-comparison-table";

function getCurrenciesFromItem(item: PricingItem | null): PricingCurrency[] {
  if (!item) return [];

  const defaultCurrency: PricingCurrency = {
    currency: item.currency,
    amount: item.amount,
    price: item.price || "",
    original_price: item.original_price || "",
  };

  if (item.currencies && item.currencies.length > 0) {
    return [defaultCurrency, ...item.currencies];
  }

  return [defaultCurrency];
}

function getInitialCurrency(
  currencies: PricingCurrency[],
  locale: string,
  defaultCurrency: string,
): string {
  if (currencies.length === 0) return defaultCurrency;

  if (locale === "zh") {
    const cnyCurrency = currencies.find(
      (c) => c.currency.toLowerCase() === "cny",
    );
    if (cnyCurrency) {
      return cnyCurrency.currency;
    }
  }

  return defaultCurrency;
}

function formatDisplayedPrice(price?: string) {
  if (!price) return "";
  return price.replace(/\/month\b/gi, "/mo");
}

type DiscountValidationState = {
  status: "idle" | "checking" | "valid" | "invalid";
  code: string;
  message: string;
};

function getPlanTone(item: PricingItem) {
  const productIdLower = item.product_id?.toLowerCase() ?? "";
  const isLegacyCreatorPlan = productIdLower === "standard";
  const isProPlan =
    productIdLower === "premium" ||
    productIdLower.startsWith("premium-") ||
    item.title?.toLowerCase().includes("professional");
  const highlightPlan = isLegacyCreatorPlan || isProPlan;

  return {
    highlightPlan,
    highlightLabel: item.label,
  };
}

const PURCHASE_BUTTONS_DISABLED = false;

export function PricingMobile({
  pricing,
  className,
  currentSubscription,
}: {
  pricing: PricingType;
  className?: string;
  currentSubscription?: Subscription;
}) {
  const locale = useLocale();
  const t = useTranslations("pricing");
  const { user, configs } = useAppContext();
  const router = useRouter();

  const [group, setGroup] = useState(() => {
    const currentItem = pricing.items?.find(
      (i) => i.product_id === currentSubscription?.productId,
    );

    const featuredGroup = pricing.groups?.find((g) => g.is_featured);
    const defaultGroup =
      pricing.groups?.find((g) => g.name === "yearly")?.name ||
      pricing.groups?.[0]?.name;
    return currentItem?.group || featuredGroup?.name || defaultGroup;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [creatorCountdown, setCreatorCountdown] = useState("");
  const [discountValidation, setDiscountValidation] =
    useState<DiscountValidationState>({
      status: "idle",
      code: "",
      message: "",
    });
  const [itemCurrencies, setItemCurrencies] = useState<
    Record<string, { selectedCurrency: string; displayedItem: PricingItem }>
  >({});

  useEffect(() => {
    if (pricing.items && pricing.items.length > 0) {
      const initialCurrencyStates: Record<
        string,
        { selectedCurrency: string; displayedItem: PricingItem }
      > = {};

      pricing.items.forEach((item) => {
        const currencies = getCurrenciesFromItem(item);
        const selectedCurrency = getInitialCurrency(
          currencies,
          locale,
          item.currency,
        );
        const currencyData = currencies.find(
          (c) => c.currency.toLowerCase() === selectedCurrency.toLowerCase(),
        );

        initialCurrencyStates[item.product_id] = {
          selectedCurrency,
          displayedItem: currencyData
            ? {
                ...item,
                currency: currencyData.currency,
                amount: currencyData.amount,
                price: currencyData.price,
                original_price: currencyData.original_price,
                payment_product_id:
                  currencyData.payment_product_id || item.payment_product_id,
                payment_providers:
                  currencyData.payment_providers || item.payment_providers,
              }
            : item,
        };
      });

      setItemCurrencies(initialCurrencyStates);
    }
  }, [pricing.items, locale]);

  useEffect(() => {
    const COUNTDOWN_DURATION = 10 * 60 * 1000;
    if (typeof window === "undefined") return;

    const key = "creator_offer_deadline_v2_mobile";
    const now = Date.now();
    let deadline = Number(localStorage.getItem(key));
    if (
      !deadline ||
      Number.isNaN(deadline) ||
      deadline < now ||
      deadline - now > COUNTDOWN_DURATION
    ) {
      deadline = now + COUNTDOWN_DURATION;
      localStorage.setItem(key, String(deadline));
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
        localStorage.setItem(key, String(deadline));
        setCreatorCountdown(formatCountdown(COUNTDOWN_DURATION));
        return;
      }
      setCreatorCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 10);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pricing.items || pricing.items.length === 0) {
      return;
    }

    const itemsInGroup = group
      ? pricing.items.filter((i) => !i.group || i.group === group)
      : pricing.items;
    const featuredInGroup = itemsInGroup.find((i) => i.is_featured);
    const fallbackProductId =
      featuredInGroup?.product_id ||
      itemsInGroup[0]?.product_id ||
      pricing.items[0]?.product_id ||
      null;

    setSelectedProductId((prev) => {
      if (prev && itemsInGroup.some((i) => i.product_id === prev)) {
        return prev;
      }
      return fallbackProductId;
    });
  }, [pricing.items, pricing.groups, group]);

  const handleCurrencyChange = (productIdValue: string, currency: string) => {
    const item = pricing.items?.find((i) => i.product_id === productIdValue);
    if (!item) return;

    const currencies = getCurrenciesFromItem(item);
    const currencyData = currencies.find(
      (c) => c.currency.toLowerCase() === currency.toLowerCase(),
    );

    if (currencyData) {
      setItemCurrencies((prev) => ({
        ...prev,
        [productIdValue]: {
          selectedCurrency: currency,
          displayedItem: {
            ...item,
            currency: currencyData.currency,
            amount: currencyData.amount,
            price: currencyData.price,
            original_price: currencyData.original_price,
            payment_product_id:
              currencyData.payment_product_id || item.payment_product_id,
            payment_providers:
              currencyData.payment_providers || item.payment_providers,
          },
        },
      }));
    }
  };

  const resolveCheckoutErrorMessage = (error: unknown) => {
    const message = String((error as { message?: string })?.message || "");
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

  const validateDiscountCode = async (opts?: {
    silent?: boolean;
  }): Promise<string | null> => {
    const input = discountCodeInput.trim().toUpperCase();
    if (!input) {
      setDiscountValidation({
        status: "idle",
        code: "",
        message: "",
      });
      return "";
    }

    if (
      discountValidation.status === "valid" &&
      discountValidation.code === input
    ) {
      return input;
    }

    setDiscountValidation({
      status: "checking",
      code: input,
      message: "",
    });

    try {
      const response = await fetch("/api/payment/discount-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: input }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.code !== 0) {
        throw new Error(payload?.message || "discount code is invalid");
      }

      const normalizedCode = String(payload?.data?.code || input).toUpperCase();
      setDiscountCodeInput(normalizedCode);
      setDiscountValidation({
        status: "valid",
        code: normalizedCode,
        message: locale.startsWith("zh") ? "折扣码有效" : "Valid code",
      });
      return normalizedCode;
    } catch (error) {
      const message =
        resolveCheckoutErrorMessage(error) ||
        t("credit_modal.discount.errors.invalid");
      setDiscountValidation({
        status: "invalid",
        code: input,
        message,
      });
      if (!opts?.silent) {
        toast.error(message);
      }
      return null;
    }
  };

  const handleCheckout = async (
    item: PricingItem,
    paymentProvider?: string,
    discountCode?: string,
  ) => {
    const callbackUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/";

    try {
      const params = {
        product_id: item.product_id,
        currency: item.currency,
        locale: locale || "en",
        payment_provider: paymentProvider || "",
        metadata: {},
        discount_code: discountCode,
      };

      setIsLoading(true);
      setLoadingProductId(item.product_id);

      const { checkoutUrl } = await requestCheckoutSession(params, {
        productId: item.product_id,
        productName: item.product_name,
        currency: item.currency,
        value: item.amount / 100,
        paymentProvider: paymentProvider || "",
        discountCode,
      });

      window.location.href = checkoutUrl;
    } catch (error) {
      if (error instanceof CheckoutRequestError && error.status === 401) {
        setIsLoading(false);
        setLoadingProductId(null);
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      toast.error(
        resolveCheckoutErrorMessage(error) ||
          t("credit_modal.errors.checkout_failed"),
      );
      setIsLoading(false);
      setLoadingProductId(null);
    }
  };

  const handlePayment = async (item: PricingItem) => {
    const callbackUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/";

    if (!user) {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    const displayedItem =
      itemCurrencies[item.product_id]?.displayedItem || item;
    const validatedDiscountCode = await validateDiscountCode();
    if (validatedDiscountCode === null) {
      return;
    }

    await handleCheckout(
      displayedItem,
      resolvePaymentProvider(displayedItem, configs.default_payment_provider),
      validatedDiscountCode || undefined,
    );
  };

  const visibleItems = useMemo(
    () =>
      pricing.items?.filter((item) => !item.group || item.group === group) ||
      [],
    [pricing.items, group],
  );

  const selectedItem =
    visibleItems.find((item) => item.product_id === selectedProductId) ||
    visibleItems[0] ||
    null;

  const selectedDisplayedItem = selectedItem
    ? itemCurrencies[selectedItem.product_id]?.displayedItem || selectedItem
    : null;

  const isSelectedCurrentPlan = !!(
    selectedItem &&
    currentSubscription &&
    currentSubscription.productId === selectedItem.product_id
  );

  return (
    <section
      id={pricing.id}
      className={cn(
        "relative overflow-hidden bg-[#f5f2e8] pb-10 pt-[calc(42px+var(--locale-banner-height,0px))]",
        pricing.className,
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#f9f6ef_0%,#f3efdf_55%,#f5f2e8_100%)]" />

      <div className="container relative z-10 px-4">
        {pricing.sr_only_title && (
          <h1 className="sr-only">{pricing.sr_only_title}</h1>
        )}

        <div className="px-1 py-1 text-center">
          <h2 className="text-balance text-[34px] font-semibold leading-[0.95] tracking-[-0.05em] text-[#171717]">
            {pricing.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#5d6472]">
            {pricing.description}
          </p>
          {pricing.disclaimer && pricing.disclaimer !== pricing.description && (
            <p className="mt-3 text-xs leading-5 text-[#7f8795]">
              {pricing.disclaimer}
            </p>
          )}

          {pricing.groups && pricing.groups.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-full border border-black/8 bg-white p-1 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
              {pricing.groups.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setGroup(item.name || "")}
                  className={cn(
                    "rounded-full px-3 py-2.5 text-xs font-medium transition-colors",
                    group === item.name
                      ? "bg-[#ffc62e] text-black"
                      : "text-[#6a7282]",
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {visibleItems.map((item) => {
            const isSelected = selectedItem?.product_id === item.product_id;
            const currencyState = itemCurrencies[item.product_id];
            const displayedItem = currencyState?.displayedItem || item;
            const selectedCurrency =
              currencyState?.selectedCurrency || item.currency;
            const currencies = getCurrenciesFromItem(item);
            const { highlightPlan, highlightLabel } = getPlanTone(item);

            return (
              <div
                key={item.product_id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedProductId(item.product_id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedProductId(item.product_id);
                  }
                }}
                className={cn(
                  "w-full rounded-[28px] border p-5 text-left transition-all",
                  isSelected
                    ? "border-[#111111] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.07)]"
                    : "border-[#e7e1d2] bg-white",
                  highlightPlan && "border-[#ffc62e] bg-[#fffdf7]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-[#f5f2e8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6a7282]">
                        {item.interval}
                      </span>
                      {highlightLabel && (
                        <span className="rounded-full border border-[#ffc62e] bg-[#fff4c0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8c6414]">
                          {highlightLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-[#171717]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#5d6472]">
                      {item.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-black bg-[#ffc62e] text-black"
                        : "border-black/12 text-transparent",
                    )}
                  >
                    <Check className="size-3.5" />
                  </span>
                </div>

                <div className="mt-4 border-t border-black/8 pt-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-end gap-2">
                      <span
                        className={cn(
                          "whitespace-nowrap font-semibold leading-none",
                          highlightPlan
                            ? "text-[38px] tracking-[-0.06em] text-[#171717]"
                            : "text-[32px] tracking-[-0.04em] text-[#171717]",
                        )}
                      >
                        {formatDisplayedPrice(displayedItem.price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {displayedItem.original_price ? (
                        <span className="text-xs text-[#8a8f99] line-through">
                          {displayedItem.original_price}
                        </span>
                      ) : (
                        <span />
                      )}

                      {currencies.length > 1 && (
                        <Select
                          value={selectedCurrency}
                          onValueChange={(currency) =>
                            handleCurrencyChange(item.product_id, currency)
                          }
                        >
                          <SelectTrigger
                            onClick={(event) => event.stopPropagation()}
                            className="h-9 min-w-[84px] rounded-full border-black/8 bg-[#f5f2e8] px-3 text-[11px] uppercase tracking-[0.18em] text-[#171717]"
                          >
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem
                                key={currency.currency}
                                value={currency.currency}
                              >
                                {currency.currency.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <MobileChip>
                      {locale.startsWith("zh")
                        ? `${item.credits || displayedItem.amount} 积分`
                        : `${item.credits || displayedItem.amount} credits`}
                    </MobileChip>
                    <MobileChip>
                      {locale.startsWith("zh")
                        ? `${item.valid_days || 365} 天有效`
                        : `${item.valid_days || 365} days`}
                    </MobileChip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedItem && (
          <div className="sticky bottom-0 z-20 mt-5 rounded-t-[28px] border border-b-0 border-black/10 bg-[#fffaf0]/95 px-4 pb-4 pt-4 backdrop-blur-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a7282]">
                  {locale.startsWith("zh") ? "已选择方案" : "Selected plan"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#171717]">
                  {selectedItem.title}
                </h3>
                <p className="mt-1 text-lg font-semibold text-[#171717]">
                  {selectedDisplayedItem?.price}
                </p>
              </div>
            </div>

            {getPlanTone(selectedItem).highlightPlan && (
              <div className="mb-4 flex items-center justify-between rounded-[20px] border border-[#ffc62e] bg-[#fff4c0] px-4 py-3">
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c6414]">
                  <Zap className="size-4" />
                  {locale.startsWith("zh") ? "限时加赠" : "Bonus window"}
                </span>
                <span className="font-mono text-sm text-[#171717]">
                  {creatorCountdown || "..."}
                </span>
              </div>
            )}

            <Collapsible
              open={discountOpen || !!discountCodeInput}
              onOpenChange={setDiscountOpen}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="mb-3 flex w-full items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#6a7282]"
                >
                  <TicketPercent className="size-4" />
                  Discount code
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      (discountOpen || !!discountCodeInput) && "rotate-180",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <input
                  value={discountCodeInput}
                  onChange={(event) => {
                    const value = event.target.value.toUpperCase();
                    setDiscountCodeInput(value);
                    if (value !== discountValidation.code) {
                      setDiscountValidation({
                        status: "idle",
                        code: "",
                        message: "",
                      });
                    }
                  }}
                  onBlur={() => void validateDiscountCode({ silent: true })}
                  placeholder="Discount code"
                  className="mb-3 h-12 w-full rounded-full border border-black/10 bg-[#f5f2e8] px-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#171717] outline-none placeholder:text-black/24 focus:border-black/25"
                />
                {discountCodeInput.trim() ? (
                  <p
                    className={cn(
                      "-mt-1 mb-3 text-xs",
                      discountValidation.status === "invalid"
                        ? "text-[#FF2047]"
                        : discountValidation.status === "valid"
                          ? "text-[#1c9c52]"
                          : "text-[#6a7282]",
                    )}
                  >
                    {discountValidation.status === "checking"
                      ? locale.startsWith("zh")
                        ? "校验中..."
                        : "Checking..."
                      : discountValidation.message}
                  </p>
                ) : null}
              </CollapsibleContent>
            </Collapsible>

            {isSelectedCurrentPlan ? (
              <button
                disabled
                className="w-full rounded-full border border-black/10 bg-[#f2f0eb] py-3.5 text-base font-semibold text-[#8a8f99]"
              >
                {t("page.current_plan")}
              </button>
            ) : (
              <button
                onClick={() => selectedItem && handlePayment(selectedItem)}
                disabled={
                  PURCHASE_BUTTONS_DISABLED ||
                  !selectedItem ||
                  (isLoading && loadingProductId === selectedItem.product_id)
                }
                className="w-full rounded-full bg-black py-3.5 text-base font-semibold text-white transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading &&
                selectedItem &&
                loadingProductId === selectedItem.product_id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    {t("page.processing")}
                  </span>
                ) : (
                  selectedItem.button?.title || "Buy now"
                )}
              </button>
            )}
          </div>
        )}

        <div className="mt-8">
          <div className="mb-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6414]">
              Compare Plans
            </p>
          </div>
          <PricingComparisonTable
            group={group || "yearly"}
            locale={locale}
            planTitles={visibleItems.map((i) => i.title || "")}
          />
        </div>
      </div>
    </section>
  );
}

function MobileChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-black/8 bg-[#f7f3e8] px-3 py-1.5 text-[11px] font-medium text-[#384252]">
      {children}
    </span>
  );
}

function resolvePaymentProvider(
  item: PricingItem,
  defaultPaymentProvider?: string,
) {
  const allowedProviders = item.payment_providers || [];
  if (allowedProviders.length === 0) {
    return defaultPaymentProvider || "";
  }

  if (
    defaultPaymentProvider &&
    allowedProviders.includes(defaultPaymentProvider)
  ) {
    return defaultPaymentProvider;
  }

  return allowedProviders[0] || defaultPaymentProvider || "";
}
