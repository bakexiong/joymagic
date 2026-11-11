"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, TicketPercent, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/core/i18n/navigation";
import { SmartIcon } from "@/shared/blocks/common";
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
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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
  const isTitan =
    productIdLower === "titan" || productIdLower.startsWith("titan-");
  const highlightPlan = isProPlan || isLegacyCreatorPlan;

  return {
    highlightPlan,
    isTitan,
    highlightLabel: item.label,
  };
}

const PURCHASE_BUTTONS_DISABLED = false;

export function Pricing({
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
  const [productId, setProductId] = useState<string | null>(null);
  const [itemCurrencies, setItemCurrencies] = useState<
    Record<string, { selectedCurrency: string; displayedItem: PricingItem }>
  >({});
  const [creatorCountdown, setCreatorCountdown] = useState("");
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [discountTargetProductId, setDiscountTargetProductId] = useState<
    string | null
  >(null);
  const [discountValidation, setDiscountValidation] =
    useState<DiscountValidationState>({
      status: "idle",
      code: "",
      message: "",
    });

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

    const key = "creator_offer_deadline_v2";
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
    if (pricing.items) {
      const defaultGroup =
        pricing.groups?.find((g) => g.name === "yearly")?.name ||
        pricing.groups?.[0]?.name;
      const itemsInGroup = defaultGroup
        ? pricing.items.filter((i) => !i.group || i.group === defaultGroup)
        : pricing.items;
      const featuredInGroup = itemsInGroup.find((i) => i.is_featured);
      setProductId(
        featuredInGroup?.product_id ||
          itemsInGroup[0]?.product_id ||
          pricing.items[0]?.product_id,
      );
      setIsLoading(false);
    }
  }, [pricing.items, pricing.groups]);

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
      if (!user) {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      const params = {
        product_id: item.product_id,
        currency: item.currency,
        locale: locale || "en",
        payment_provider: paymentProvider || "",
        metadata: {},
        discount_code: discountCode,
      };

      setIsLoading(true);
      setProductId(item.product_id);

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
        setProductId(null);
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      toast.error(
        resolveCheckoutErrorMessage(error) ||
          t("credit_modal.errors.checkout_failed"),
      );
      setIsLoading(false);
      setProductId(null);
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

  return (
    <section
      id={pricing.id}
      className={cn(
        "relative overflow-hidden bg-[#f5f2e8] pb-20 pt-[calc(44px+var(--locale-banner-height,0px))]",
        pricing.className,
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f9f6ef_0%,#f3efdf_55%,#f5f2e8_100%)]" />
      </div>

      <div className="container relative z-10 px-6">
        {pricing.sr_only_title && (
          <h1 className="sr-only">{pricing.sr_only_title}</h1>
        )}

        <div className="mx-auto max-w-7xl px-2 py-1 text-center">
          <h2 className="text-balance text-[42px] font-semibold leading-[0.94] tracking-[-0.06em] text-[#161616] md:text-[56px] lg:text-[64px]">
            {pricing.title}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#5d6472] md:text-base">
            {pricing.description}
          </p>
          {pricing.disclaimer && pricing.disclaimer !== pricing.description && (
            <p className="mx-auto mt-2 max-w-3xl text-xs leading-5 text-[#7f8795] md:text-sm">
              {pricing.disclaimer}
            </p>
          )}
        </div>

        {pricing.groups && pricing.groups.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Tabs
              value={group}
              onValueChange={setGroup}
              className="w-full max-w-xl"
            >
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-full border border-black/8 bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                {pricing.groups.map((item) => (
                  <TabsTrigger
                    key={item.name}
                    value={item.name || ""}
                    className="rounded-full px-5 py-3 text-sm font-medium text-[#6a7282] data-[state=active]:bg-[#ffc62e] data-[state=active]:text-black"
                  >
                    {item.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div
          className="mt-8 grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${Math.max(visibleItems.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {visibleItems.map((item) => {
            const isCurrentPlan =
              !!currentSubscription &&
              currentSubscription.productId === item.product_id;
            const currencyState = itemCurrencies[item.product_id];
            const displayedItem = currencyState?.displayedItem || item;
            const selectedCurrency =
              currencyState?.selectedCurrency || item.currency;
            const currencies = getCurrenciesFromItem(item);
            const { highlightPlan, isTitan, highlightLabel } =
              getPlanTone(item);

            return (
              <article
                key={item.product_id}
                className={cn(
                  "relative flex min-h-[700px] flex-col overflow-hidden rounded-[30px] border border-[#e7e1d2] bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1",
                  highlightPlan &&
                    "border-[#ffc62e] shadow-[0_22px_52px_rgba(255,198,46,0.22)]",
                  isTitan && "border-[#111111]",
                )}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,198,46,0.14),transparent_42%)]" />
                {highlightPlan && (
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,198,46,0.18),transparent_45%)]" />
                )}

                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-black/8 bg-[#f5f2e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7282]">
                          {item.interval}
                        </span>
                        {highlightLabel && (
                          <span className="inline-flex rounded-full border border-[#ffc62e] bg-[#fff4c0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c6414]">
                            {highlightLabel}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-[30px] font-semibold tracking-[-0.04em] text-[#171717]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#5d6472]">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {currencies.length > 1 && (
                      <Select
                        value={selectedCurrency}
                        onValueChange={(currency) =>
                          handleCurrencyChange(item.product_id, currency)
                        }
                      >
                        <SelectTrigger className="h-10 min-w-[92px] rounded-full border-black/8 bg-[#f7f3e8] px-3 text-xs uppercase tracking-[0.18em] text-[#171717]">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem
                              key={currency.currency}
                              value={currency.currency}
                              className="text-xs"
                            >
                              {currency.currency.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="mt-6 border-t border-black/8 pt-5">
                    <div className="flex flex-col gap-2">
                      <span
                        className={cn(
                          "whitespace-nowrap font-semibold leading-none",
                          highlightPlan
                            ? "text-4xl tracking-[-0.06em] text-[#171717] md:text-5xl"
                            : isTitan
                              ? "text-4xl tracking-[-0.05em] text-[#171717] md:text-5xl"
                              : "text-[42px] tracking-[-0.05em] text-[#171717] md:text-[52px]",
                        )}
                      >
                        {formatDisplayedPrice(displayedItem.price)}
                      </span>
                      {(displayedItem.original_price || displayedItem.unit) && (
                        <div className="flex items-center justify-between gap-3">
                          {displayedItem.unit ? (
                            <p className="text-xs uppercase tracking-[0.2em] text-[#6a7282]">
                              {displayedItem.unit}
                            </p>
                          ) : (
                            <span />
                          )}
                          {displayedItem.original_price && (
                            <p className="text-sm text-[#8a8f99] line-through">
                              {displayedItem.original_price}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <PlanChip>
                        {locale.startsWith("zh")
                          ? `${item.credits || displayedItem.amount} 积分`
                          : `${item.credits || displayedItem.amount} credits`}
                      </PlanChip>
                      <PlanChip>
                        {locale.startsWith("zh")
                          ? `${item.valid_days || 365} 天有效`
                          : `${item.valid_days || 365} days validity`}
                      </PlanChip>
                      <PlanChip>
                        {locale.startsWith("zh")
                          ? "全模型访问"
                          : "All model access"}
                      </PlanChip>
                    </div>
                  </div>

                  {highlightPlan && (
                    <div className="mt-4 flex items-center justify-between rounded-[22px] border border-[#ffc62e] bg-[#fff4c0] px-4 py-3">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6414]">
                        <Zap className="size-4" />
                        {locale.startsWith("zh") ? "限时加赠" : "Bonus window"}
                      </span>
                      <span className="font-mono text-sm font-semibold text-[#171717]">
                        {creatorCountdown || "..."}
                      </span>
                    </div>
                  )}

                  <div className="mt-6 flex-1">
                    {item.features_title && (
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6a7282]">
                        {item.features_title}
                      </p>
                    )}
                    <ul className="mt-4 space-y-3">
                      {item.features?.map((feature, index) => (
                        <li
                          key={`${item.product_id}-${index}`}
                          className="flex gap-3"
                        >
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#ffd24d] bg-[#fff4c0] text-[#8c6414]">
                            <Check className="size-3" />
                          </span>
                          <span className="text-sm leading-6 text-[#2f3440]">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 space-y-3">
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="flex h-12 w-full items-center justify-center rounded-full border border-black/10 bg-[#f2f0eb] text-sm font-semibold text-[#8a8f99]"
                      >
                        {t("page.current_plan")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePayment(item)}
                        disabled={PURCHASE_BUTTONS_DISABLED || isLoading}
                        className={cn(
                          "flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
                          highlightPlan
                            ? "bg-black text-white hover:bg-[#222]"
                            : "border border-black/10 bg-[#ffc62e] text-black hover:bg-[#ffbc10]",
                        )}
                      >
                        {isLoading && item.product_id === productId ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {t("page.processing")}
                          </>
                        ) : (
                          <>
                            {item.button?.icon && (
                              <SmartIcon
                                name={item.button.icon as string}
                                className="size-4"
                              />
                            )}
                            {item.button?.title}
                          </>
                        )}
                      </button>
                    )}

                    <Collapsible
                      open={
                        discountTargetProductId === item.product_id ||
                        !!discountCodeInput
                      }
                      onOpenChange={(open) =>
                        setDiscountTargetProductId(
                          open ? item.product_id : null,
                        )
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#6a7282] transition-colors hover:text-black"
                        >
                          <TicketPercent className="size-3.5" />
                          Discount code
                          <ChevronDown
                            className={cn(
                              "size-3.5 transition-transform",
                              (discountTargetProductId === item.product_id ||
                                !!discountCodeInput) &&
                                "rotate-180",
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
                          onBlur={() =>
                            void validateDiscountCode({ silent: true })
                          }
                          placeholder="Discount code"
                          className="mt-3 h-11 w-full rounded-full border border-black/10 bg-[#f7f3e8] px-4 text-sm font-medium uppercase tracking-[0.12em] text-black outline-none placeholder:text-black/24 focus:border-black/25"
                        />
                        {discountCodeInput.trim() ? (
                          <p
                            className={cn(
                              "mt-2 text-xs",
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
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-14">
          <div className="mb-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8c6414]">
              Compare Plans
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#171717]">
              Compare plans
            </h3>
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

function PlanChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-black/8 bg-[#f7f3e8] px-3 py-1.5 text-xs font-medium text-[#384252]">
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
