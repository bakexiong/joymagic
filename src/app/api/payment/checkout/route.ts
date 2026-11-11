import { getTranslations } from "next-intl/server";

import {
  PaymentInterval,
  PaymentOrder,
  PaymentPrice,
  PaymentType,
} from "@/extensions/payment/types";
import { getSnowId, getUuid } from "@/shared/lib/hash";
import { respData, respErr } from "@/shared/lib/resp";
import { getUTMFromCookie, utmDataToDbFields } from "@/shared/lib/utm-server";
import { getAllConfigs } from "@/shared/models/config";
import {
  assertUserCanUseAffiliateDiscountCode,
  attachAffiliateAttributionToCheckout,
  getAffiliateDiscountForCheckout,
} from "@/shared/models/affiliate";
import {
  createOrder,
  NewOrder,
  OrderStatus,
  updateOrderByOrderNo,
} from "@/shared/models/order";
import { getUserInfo } from "@/shared/models/user";
import { getPaymentService } from "@/shared/services/payment";
import { PricingCurrency } from "@/shared/types/blocks/pricing";

export async function POST(req: Request) {
  try {
    const {
      product_id,
      currency,
      locale,
      payment_provider,
      metadata,
      discount_code,
    } = await req.json();
    if (!product_id) {
      return respErr("product_id is required");
    }

    const t = await getTranslations({
      locale: locale || "en",
      namespace: "pricing",
    });
    const pricing = t.raw("pricing");

    const pricingItem = pricing.items.find(
      (item: any) => item.product_id === product_id,
    );

    if (!pricingItem) {
      return respErr("pricing item not found");
    }

    if (!pricingItem.product_id && !pricingItem.amount) {
      return respErr("invalid pricing item");
    }

    // get sign user
    const user = await getUserInfo();
    if (!user || !user.email) {
      return respErr("no auth, please sign in");
    }

    // get configs
    const configs = await getAllConfigs();

    // Validate payment provider against allowed providers
    // First check currency-specific payment_providers if currency is provided
    let allowedProviders: string[] | undefined;

    if (
      currency &&
      currency.toLowerCase() !== (pricingItem.currency || "usd").toLowerCase()
    ) {
      const selectedCurrencyData = pricingItem.currencies?.find(
        (c: PricingCurrency) =>
          c.currency.toLowerCase() === currency.toLowerCase(),
      );
      allowedProviders = selectedCurrencyData?.payment_providers;
    }

    // Fallback to default payment_providers if not found in currency config
    if (!allowedProviders || allowedProviders.length === 0) {
      allowedProviders = pricingItem.payment_providers;
    }

    // get default payment provider
    const paymentService = await getPaymentService();

    const paymentProviderName = paymentService.resolveProviderName({
      preferredProvider: payment_provider || configs.default_payment_provider,
      allowedProviders,
    });
    if (!paymentProviderName) {
      return respErr("no payment provider configured");
    }

    const paymentProvider = paymentService.getProvider(paymentProviderName);
    if (!paymentProvider || !paymentProvider.name) {
      return respErr("no payment provider configured");
    }

    // checkout currency and amount - calculate from server-side data only (never trust client input)
    // Security: currency can be provided by frontend, but amount must be calculated server-side
    const defaultCurrency = (pricingItem.currency || "usd").toLowerCase();
    let checkoutCurrency = defaultCurrency;
    let checkoutAmount = pricingItem.amount;

    // If currency is provided, validate it and find corresponding amount from server-side data
    if (currency) {
      const requestedCurrency = currency.toLowerCase();

      // Check if requested currency is the default currency
      if (requestedCurrency === defaultCurrency) {
        checkoutCurrency = defaultCurrency;
        checkoutAmount = pricingItem.amount;
      } else if (pricingItem.currencies && pricingItem.currencies.length > 0) {
        // Find amount for the requested currency in currencies list
        const selectedCurrencyData = pricingItem.currencies.find(
          (c: PricingCurrency) =>
            c.currency.toLowerCase() === requestedCurrency,
        );
        if (selectedCurrencyData) {
          // Valid currency found, use it
          checkoutCurrency = requestedCurrency;
          checkoutAmount = selectedCurrencyData.amount;
        }
        // If currency not found in list, fallback to default (already set above)
      }
      // If no currencies list exists, fallback to default (already set above)
    }

    // get payment interval
    const paymentInterval: PaymentInterval =
      pricingItem.interval || PaymentInterval.ONE_TIME;

    // get payment type
    const paymentType =
      paymentInterval === PaymentInterval.ONE_TIME
        ? PaymentType.ONE_TIME
        : PaymentType.SUBSCRIPTION;

    const orderNo = getSnowId();

    // get payment product id from pricing table in local file
    // First try to get currency-specific payment_product_id
    let paymentProductId = "";

    // If currency is provided and different from default, check currency-specific payment_product_id
    if (currency && currency.toLowerCase() !== defaultCurrency) {
      const selectedCurrencyData = pricingItem.currencies?.find(
        (c: PricingCurrency) =>
          c.currency.toLowerCase() === currency.toLowerCase(),
      );
      if (selectedCurrencyData?.payment_product_id) {
        paymentProductId = selectedCurrencyData.payment_product_id;
      }
    }

    // Fallback to default payment_product_id if not found in currency config
    if (!paymentProductId) {
      paymentProductId = pricingItem.payment_product_id || "";
    }

    // If still not found, get from payment provider's config
    if (!paymentProductId) {
      paymentProductId = await getPaymentProductId(
        pricingItem.product_id,
        paymentProviderName,
        checkoutCurrency,
      );
    }

    // get preset promotion code for product_id
    const promotionCode = await getPromotionCode(
      product_id,
      paymentProviderName,
      checkoutCurrency,
    );
    const appliedAffiliateDiscount = discount_code
      ? await getAffiliateDiscountForCheckout({
          discountCode: String(discount_code),
          amountCents: checkoutAmount,
          currency: checkoutCurrency,
        })
      : null;
    const appliedAffiliateDiscountCode = appliedAffiliateDiscount?.code || "";
    if (appliedAffiliateDiscountCode) {
      await assertUserCanUseAffiliateDiscountCode({
        userId: user.id,
        discountCode: appliedAffiliateDiscountCode,
      });
    }
    const usesProviderDiscountCode =
      ["creem", "dodo"].includes(paymentProviderName) &&
      !!appliedAffiliateDiscountCode;
    if (appliedAffiliateDiscount && !usesProviderDiscountCode) {
      checkoutAmount = appliedAffiliateDiscount.finalAmountCents;
    }

    // build checkout price with correct amount for selected currency
    const checkoutPrice: PaymentPrice = {
      amount: checkoutAmount,
      currency: checkoutCurrency,
    };

    if (!paymentProductId) {
      // checkout price validation
      if (!checkoutPrice.amount || !checkoutPrice.currency) {
        return respErr("invalid checkout price");
      }
    } else {
      paymentProductId = paymentProductId.trim();
    }

    let callbackBaseUrl = `${configs.app_url}`;
    if (locale && locale !== configs.default_locale) {
      callbackBaseUrl += `/${locale}`;
    }

    const callbackUrl =
      paymentType === PaymentType.SUBSCRIPTION
        ? `${callbackBaseUrl}/settings/billing`
        : `${callbackBaseUrl}/settings/payments`;
    const successPageUrl = `${callbackBaseUrl}/checkout/success?order_no=${orderNo}`;

    // build checkout order
    const checkoutOrder: PaymentOrder = {
      description: pricingItem.product_name,
      customer: {
        name: user.name,
        email: user.email,
      },
      type: paymentType,
      metadata: {
        app_name: configs.app_name,
        order_no: orderNo,
        user_id: user.id,
        ...(metadata || {}),
      },
      successUrl: successPageUrl,
      cancelUrl: `${callbackBaseUrl}/pricing`,
    };

    // checkout with predefined product
    if (paymentProductId) {
      checkoutOrder.productId = paymentProductId;
    }

    // checkout dynamically
    checkoutOrder.price = checkoutPrice;
    if (paymentType === PaymentType.SUBSCRIPTION) {
      // subscription mode
      checkoutOrder.plan = {
        interval: paymentInterval,
        name: pricingItem.product_name,
      };
    } else {
      // one-time mode
    }

    if (usesProviderDiscountCode) {
      checkoutOrder.discount = {
        code: appliedAffiliateDiscountCode,
      };
    } else if (promotionCode && !appliedAffiliateDiscountCode) {
      checkoutOrder.discount = {
        code: promotionCode,
      };
    }

    const currentTime = new Date();

    // 获取 UTM 数据
    const utmData = await getUTMFromCookie();
    const utmFields = utmDataToDbFields(utmData);
    const affiliateFields = await attachAffiliateAttributionToCheckout({
      userId: user.id,
      discountCode: appliedAffiliateDiscountCode,
    });

    // build order info
    const order: NewOrder = {
      id: getUuid(),
      orderNo: orderNo,
      userId: user.id,
      userEmail: user.email,
      status: OrderStatus.PENDING,
      amount: checkoutAmount, // use the amount for selected currency
      currency: checkoutCurrency,
      productId: pricingItem.product_id,
      paymentType: paymentType,
      paymentInterval: paymentInterval,
      paymentProvider: paymentProvider.name,
      checkoutInfo: JSON.stringify(checkoutOrder),
      createdAt: currentTime,
      productName: pricingItem.product_name,
      description: pricingItem.description,
      callbackUrl: callbackUrl,
      creditsAmount: pricingItem.credits,
      creditsValidDays: pricingItem.valid_days,
      planName: pricingItem.plan_name || "",
      paymentProductId: paymentProductId,
      discountCode: appliedAffiliateDiscountCode || promotionCode,
      discountAmount: usesProviderDiscountCode
        ? null
        : appliedAffiliateDiscount?.discountAmountCents || null,
      discountCurrency: usesProviderDiscountCode
        ? null
        : appliedAffiliateDiscount?.currency || null,
      affiliateDiscountCode: appliedAffiliateDiscountCode || null,
      ...affiliateFields,
      // UTM tracking fields
      ...utmFields,
    };

    // create order
    console.log("[Payment Checkout] Creating order:", {
      orderNo,
      userId: user.id,
      productId: pricingItem.product_id,
      creditsAmount: order.creditsAmount,
      amount: order.amount,
      currency: order.currency,
    });
    await createOrder(order);
    console.log("[Payment Checkout] Order created successfully:", orderNo);

    try {
      // create payment
      const result = await paymentProvider.createPayment({
        order: checkoutOrder,
      });

      // update order status to created, waiting for payment
      await updateOrderByOrderNo(orderNo, {
        status: OrderStatus.CREATED, // means checkout created, waiting for payment
        checkoutInfo: JSON.stringify(result.checkoutParams),
        checkoutResult: JSON.stringify(result.checkoutResult),
        checkoutUrl: result.checkoutInfo.checkoutUrl,
        paymentSessionId: result.checkoutInfo.sessionId,
        paymentProvider: result.provider,
      });

      return respData(result.checkoutInfo);
    } catch (e: any) {
      // update order status to completed, means checkout failed
      await updateOrderByOrderNo(orderNo, {
        status: OrderStatus.COMPLETED, // means checkout failed
        checkoutInfo: JSON.stringify(checkoutOrder),
      });

      return respErr("checkout failed: " + e.message);
    }
  } catch (e: any) {
    console.log("checkout failed:", e);
    return respErr("checkout failed: " + e.message);
  }
}

// get payemt product id from payment provider's config
async function getPaymentProductId(
  productId: string,
  provider: string,
  checkoutCurrency: string,
) {
  const configKeyByProvider: Record<string, string> = {
    creem: "creem_product_ids",
    dodo: "dodo_product_ids",
  };

  const configKey = configKeyByProvider[provider];
  if (!configKey) {
    return;
  }

  try {
    const configs = await getAllConfigs();
    const rawProductIds = configs[configKey];
    if (rawProductIds) {
      const productIds = JSON.parse(rawProductIds);
      return (
        productIds[`${productId}_${checkoutCurrency}`] || productIds[productId]
      );
    }
  } catch (e: any) {
    console.log("get payment product id failed:", e);
    return;
  }
}

// get promotion code from payment provider's config
async function getPromotionCode(
  productId: string,
  provider: string,
  checkoutCurrency: string,
) {
  const configKeyByProvider: Record<string, string> = {
    stripe: "stripe_promotion_codes",
    dodo: "dodo_discount_codes",
  };

  const configKey = configKeyByProvider[provider];
  if (!configKey) {
    return;
  }

  try {
    const configs = await getAllConfigs();
    const rawPromotionCodes = configs[configKey];
    if (rawPromotionCodes) {
      const promotionCodes = JSON.parse(rawPromotionCodes);
      return (
        promotionCodes[`${productId}_${checkoutCurrency}`] ||
        promotionCodes[productId]
      );
    }
  } catch (e: any) {
    console.log("get promotion code failed:", e);
    return;
  }
}
