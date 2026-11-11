import {
  CreemProvider,
  DodoPaymentsProvider,
  PaymentManager,
  PayPalProvider,
  StripeProvider,
} from "@/extensions/payment";
import {
  PaymentSession,
  PaymentStatus,
  PaymentType,
} from "@/extensions/payment/types";
import { Configs, getAllConfigs } from "@/shared/models/config";
import {
  createAffiliateCommissionFromPaidOrder,
  createAffiliateCommissionFromRenewal,
} from "@/shared/models/affiliate";

import { getSnowId, getUuid } from "../lib/hash";
import {
  calculateCreditExpirationTime,
  CreditStatus,
  CreditTransactionScene,
  CreditTransactionType,
  NewCredit,
} from "../models/credit";
import {
  findOrderByOrderNo,
  NewOrder,
  Order,
  OrderStatus,
  UpdateOrder,
  updateOrderByOrderNo,
  updateOrderInTransaction,
  updateSubscriptionInTransaction,
} from "../models/order";
import {
  NewSubscription,
  Subscription,
  SubscriptionStatus,
  UpdateSubscription,
  updateSubscriptionBySubscriptionNo,
} from "../models/subscription";
import { emailService } from "../lib/email";
import { SubscriptionInfo } from "@/extensions/payment/types";

/**
 * 发送续期成功邮件（主题样式）
 */
async function sendRenewalEmailWithTheme(opts: {
  subscription: Subscription;
  session: PaymentSession;
  orderNo?: string;
  configs: Configs;
}) {
  const { subscription, session, orderNo } = opts;
  const email =
    subscription.userEmail ||
    session.paymentInfo?.paymentEmail ||
    subscription.user?.email ||
    "";
  const planName =
    subscription.planName || subscription.productName || "Subscription";
  const amountCentsRaw =
    session.paymentInfo?.paymentAmount ?? subscription.amount ?? 0;
  const amountCents = amountCentsRaw ? Number(amountCentsRaw) : 0;
  const currency =
    session.paymentInfo?.paymentCurrency || subscription.currency || "USD";
  const amountDisplay = amountCents
    ? `${(amountCents / 100).toFixed(2)} ${currency}`
    : `${subscription.amount ?? ""}`;
  const userName =
    session.paymentInfo?.paymentUserName ||
    subscription.user?.name ||
    undefined;
  const orderId =
    orderNo ||
    session.paymentInfo?.invoiceId ||
    session.paymentInfo?.transactionId ||
    subscription.subscriptionNo ||
    undefined;
  const renewDate = subscription.currentPeriodStart
    ? new Date(subscription.currentPeriodStart).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  if (email) {
    await emailService.sendRenewalSuccessEmail(
      email,
      planName,
      amountDisplay,
      opts.configs,
      userName,
      orderId,
      renewDate,
      subscription.productName || undefined,
      undefined,
    );
  } else {
    console.warn(
      "[handleRenewalSuccess] skip sending renewal email: no email found",
      {
        subscriptionNo: subscription.subscriptionNo,
        userId: subscription.userId,
      },
    );
  }
}

/**
 * get payment service with configs
 */
export function getPaymentServiceWithConfigs(configs: Configs) {
  const paymentManager = new PaymentManager();

  const defaultProvider = configs.default_payment_provider;

  // add stripe provider
  if (configs.stripe_enabled === "true") {
    let allowedPaymentMethods = configs.stripe_payment_methods || [];
    if (typeof allowedPaymentMethods === "string") {
      try {
        allowedPaymentMethods = JSON.parse(allowedPaymentMethods);
      } catch (e) {
        console.error("parse stripe payment methods error", e);
        allowedPaymentMethods = [];
      }
    }
    paymentManager.addProvider(
      new StripeProvider({
        secretKey: configs.stripe_secret_key,
        publishableKey: configs.stripe_publishable_key,
        signingSecret: configs.stripe_signing_secret,
        allowedPaymentMethods: allowedPaymentMethods as string[],
        allowPromotionCodes: configs.stripe_allow_promotion_codes === "true",
      }),
      defaultProvider === "stripe",
    );
  }

  // add creem provider
  if (configs.creem_enabled === "true") {
    paymentManager.addProvider(
      new CreemProvider({
        apiKey: configs.creem_api_key,
        environment:
          configs.creem_environment === "production" ? "production" : "sandbox",
        signingSecret: configs.creem_signing_secret,
      }),
      defaultProvider === "creem",
    );
  }

  // add dodo provider
  if (configs.dodo_enabled === "true") {
    paymentManager.addProvider(
      new DodoPaymentsProvider({
        apiKey: configs.dodo_api_key,
        webhookKey: configs.dodo_webhook_key,
        environment:
          configs.dodo_environment === "live_mode" ? "live_mode" : "test_mode",
      }),
      defaultProvider === "dodo",
    );
  }

  // add paypal provider
  if (configs.paypal_enabled === "true") {
    paymentManager.addProvider(
      new PayPalProvider({
        clientId: configs.paypal_client_id,
        clientSecret: configs.paypal_client_secret,
        environment:
          configs.paypal_environment === "production"
            ? "production"
            : "sandbox",
      }),
      defaultProvider === "paypal",
    );
  }

  return paymentManager;
}

/**
 * global payment service
 */
let paymentService: PaymentManager | null = null;

/**
 * get payment service instance
 */
export async function getPaymentService(): Promise<PaymentManager> {
  if (true) {
    const configs = await getAllConfigs();
    paymentService = getPaymentServiceWithConfigs(configs);
  }
  return paymentService;
}

const scopedPaymentConfigKeys = [
  "default_payment_provider",
  "stripe_enabled",
  "stripe_secret_key",
  "stripe_publishable_key",
  "stripe_signing_secret",
  "stripe_payment_methods",
  "stripe_promotion_codes",
  "stripe_allow_promotion_codes",
  "creem_enabled",
  "creem_api_key",
  "creem_environment",
  "creem_signing_secret",
  "creem_product_ids",
  "dodo_enabled",
  "dodo_api_key",
  "dodo_environment",
  "dodo_webhook_key",
  "dodo_product_ids",
  "dodo_discount_codes",
  "paypal_enabled",
  "paypal_client_id",
  "paypal_client_secret",
  "paypal_environment",
];

export function getScopedPaymentConfigs(
  configs: Configs,
  prefix: string,
): Configs {
  const scopedConfigs = { ...configs };

  for (const key of scopedPaymentConfigKeys) {
    const scopedValue = configs[`${prefix}_${key}`];
    if (typeof scopedValue === "string" && scopedValue.trim()) {
      scopedConfigs[key] = scopedValue;
    }
  }

  return scopedConfigs;
}

export async function getScopedPaymentService(
  prefix: string,
): Promise<PaymentManager> {
  const configs = await getAllConfigs();
  return getPaymentServiceWithConfigs(getScopedPaymentConfigs(configs, prefix));
}

export async function confirmCheckoutOrder({
  orderNo,
  userId,
}: {
  orderNo: string;
  userId?: string;
}) {
  if (!orderNo) {
    throw new Error("invalid callback params");
  }

  const order = await findOrderByOrderNo(orderNo);
  if (!order) {
    throw new Error("order not found");
  }

  if (!order.paymentSessionId || !order.paymentProvider) {
    throw new Error("invalid order");
  }

  if (userId && order.userId !== userId) {
    throw new Error("order and user not match");
  }

  const paymentService = await getPaymentService();
  const paymentProvider = paymentService.getProvider(order.paymentProvider);
  if (!paymentProvider) {
    throw new Error("payment provider not found");
  }

  const session = await paymentProvider.getPaymentSession({
    sessionId: order.paymentSessionId,
  });

  console.log("[Payment Confirm] Payment session retrieved:", {
    orderNo,
    paymentStatus: session.paymentStatus,
    orderCreditsAmount: order.creditsAmount,
    orderStatus: order.status,
  });

  await handleCheckoutSuccess({
    order,
    session,
  });

  const updatedOrder = await findOrderByOrderNo(orderNo);

  return {
    order: updatedOrder || order,
    session,
  };
}

/**
 * handle checkout success
 */
export async function handleCheckoutSuccess({
  order,
  session,
}: {
  order: Order; // checkout order
  session: PaymentSession; // payment session
}) {
  const orderNo = order.orderNo;
  if (!orderNo) {
    throw new Error("invalid order");
  }

  if (order.paymentType === PaymentType.SUBSCRIPTION) {
    if (!session.subscriptionId || !session.subscriptionInfo) {
      throw new Error("subscription id or subscription info not found");
    }
  }

  console.log("[handleCheckoutSuccess] Processing payment:", {
    orderNo,
    paymentStatus: session.paymentStatus,
    creditsAmount: order.creditsAmount,
    paymentType: order.paymentType,
  });

  // payment success
  if (session.paymentStatus === PaymentStatus.SUCCESS) {
    console.log(
      "[handleCheckoutSuccess] Payment successful, updating order and granting credits",
    );
    // update order status to be paid
    const updateOrder: UpdateOrder = {
      status: OrderStatus.PAID,
      paymentResult: JSON.stringify(session.paymentResult),
      paymentAmount: session.paymentInfo?.paymentAmount,
      paymentCurrency: session.paymentInfo?.paymentCurrency,
      discountAmount:
        session.paymentInfo?.discountAmount ?? order.discountAmount ?? null,
      discountCurrency:
        session.paymentInfo?.discountCurrency || order.discountCurrency || null,
      discountCode: session.paymentInfo?.discountCode || order.discountCode,
      paymentEmail: session.paymentInfo?.paymentEmail,
      paidAt: session.paymentInfo?.paidAt,
      invoiceId: session.paymentInfo?.invoiceId,
      invoiceUrl: session.paymentInfo?.invoiceUrl,
      subscriptionNo: "",
      transactionId: session.paymentInfo?.transactionId,
      paymentUserName: session.paymentInfo?.paymentUserName,
      paymentUserId: session.paymentInfo?.paymentUserId,
    };

    // new subscription
    let newSubscription: NewSubscription | undefined = undefined;
    const subscriptionInfo = session.subscriptionInfo;

    // subscription first payment
    if (subscriptionInfo) {
      // new subscription
      newSubscription = {
        id: getUuid(),
        subscriptionNo: getSnowId(),
        userId: order.userId,
        userEmail: order.paymentEmail || order.userEmail,
        status: subscriptionInfo.status || SubscriptionStatus.ACTIVE,
        paymentProvider: order.paymentProvider,
        subscriptionId: subscriptionInfo.subscriptionId,
        subscriptionResult: JSON.stringify(session.subscriptionResult),
        productId: order.productId,
        description: subscriptionInfo.description || "Subscription Created",
        amount: subscriptionInfo.amount,
        currency: subscriptionInfo.currency,
        interval: subscriptionInfo.interval,
        intervalCount: subscriptionInfo.intervalCount,
        trialPeriodDays: subscriptionInfo.trialPeriodDays,
        currentPeriodStart: subscriptionInfo.currentPeriodStart,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
        billingUrl: subscriptionInfo.billingUrl,
        planName: order.planName || order.productName,
        productName: order.productName,
        creditsAmount: order.creditsAmount,
        creditsValidDays: order.creditsValidDays,
        paymentProductId: order.paymentProductId,
        paymentUserId: session.paymentInfo?.paymentUserId,
        affiliateProfileId: order.affiliateProfileId,
        affiliateReferralId: order.affiliateReferralId,
        affiliateCode: order.affiliateCode,
        affiliateDiscountCode: order.affiliateDiscountCode,
      };

      updateOrder.subscriptionNo = newSubscription.subscriptionNo;
      updateOrder.subscriptionId = session.subscriptionId;
      updateOrder.subscriptionResult = JSON.stringify(
        session.subscriptionResult,
      );
    }

    // grant credit for order
    let newCredit: NewCredit | undefined = undefined;
    console.log("[handleCheckoutSuccess] Checking credits to grant:", {
      orderNo,
      creditsAmount: order.creditsAmount,
      hasCredits: !!(order.creditsAmount && order.creditsAmount > 0),
    });
    if (order.creditsAmount && order.creditsAmount > 0) {
      const credits = order.creditsAmount;
      console.log("[handleCheckoutSuccess] Creating credit record:", {
        orderNo,
        userId: order.userId,
        credits,
        validDays: order.creditsValidDays,
      });
      const expiresAt =
        credits > 0
          ? calculateCreditExpirationTime({
              creditsValidDays: order.creditsValidDays || 0,
              currentPeriodEnd: subscriptionInfo?.currentPeriodEnd,
            })
          : null;

      newCredit = {
        id: getUuid(),
        userId: order.userId,
        userEmail: order.userEmail,
        orderNo: order.orderNo,
        subscriptionNo: newSubscription?.subscriptionNo,
        transactionNo: getSnowId(),
        transactionType: CreditTransactionType.GRANT,
        transactionScene:
          order.paymentType === PaymentType.SUBSCRIPTION
            ? CreditTransactionScene.SUBSCRIPTION
            : CreditTransactionScene.PAYMENT,
        credits: credits,
        remainingCredits: credits,
        description: `Grant credit`,
        expiresAt: expiresAt,
        status: CreditStatus.ACTIVE,
      };
      console.log("[handleCheckoutSuccess] Credit record created:", {
        orderNo,
        creditId: newCredit.id,
        credits: newCredit.credits,
      });
    } else {
      console.log("[handleCheckoutSuccess] No credits to grant:", {
        orderNo,
        creditsAmount: order.creditsAmount,
      });
    }

    console.log("[handleCheckoutSuccess] Updating order in transaction:", {
      orderNo,
      hasSubscription: !!newSubscription,
      hasCredit: !!newCredit,
    });
    const result = await updateOrderInTransaction({
      orderNo,
      updateOrder,
      newSubscription,
      newCredit,
    });
    await createAffiliateCommissionFromPaidOrder({
      order: result.order,
      subscription: result.subscription,
    });
    console.log("[handleCheckoutSuccess] Order updated successfully:", orderNo);
  } else if (
    session.paymentStatus === PaymentStatus.FAILED ||
    session.paymentStatus === PaymentStatus.CANCELED
  ) {
    console.log("[handleCheckoutSuccess] Payment failed or canceled:", {
      orderNo,
      paymentStatus: session.paymentStatus,
    });
    // update order status to be failed
    await updateOrderByOrderNo(orderNo, {
      status: OrderStatus.FAILED,
      paymentResult: JSON.stringify(session.paymentResult),
    });
  } else if (session.paymentStatus === PaymentStatus.PROCESSING) {
    console.log("[handleCheckoutSuccess] Payment processing:", {
      orderNo,
      paymentStatus: session.paymentStatus,
    });
    // update order payment result
    await updateOrderByOrderNo(orderNo, {
      paymentResult: JSON.stringify(session.paymentResult),
    });
  } else {
    console.error("[handleCheckoutSuccess] Unknown payment status:", {
      orderNo,
      paymentStatus: session.paymentStatus,
    });
    throw new Error("unknown payment status");
  }
}

/**
 * handle payment success
 */
export async function handlePaymentSuccess({
  order,
  session,
}: {
  order: Order; // checkout order
  session: PaymentSession; // payment session
}) {
  const orderNo = order.orderNo;
  if (!orderNo) {
    throw new Error("invalid order");
  }

  if (order.paymentType === PaymentType.SUBSCRIPTION) {
    if (!session.subscriptionId || !session.subscriptionInfo) {
      throw new Error("subscription id or subscription info not found");
    }
  }

  // payment success
  if (session.paymentStatus === PaymentStatus.SUCCESS) {
    // update order status to be paid
    const updateOrder: UpdateOrder = {
      status: OrderStatus.PAID,
      paymentResult: JSON.stringify(session.paymentResult),
      paymentAmount: session.paymentInfo?.paymentAmount,
      paymentCurrency: session.paymentInfo?.paymentCurrency,
      discountAmount:
        session.paymentInfo?.discountAmount ?? order.discountAmount ?? null,
      discountCurrency:
        session.paymentInfo?.discountCurrency || order.discountCurrency || null,
      discountCode: session.paymentInfo?.discountCode || order.discountCode,
      paymentEmail: session.paymentInfo?.paymentEmail,
      paymentUserName: session.paymentInfo?.paymentUserName,
      paymentUserId: session.paymentInfo?.paymentUserId,
      paidAt: session.paymentInfo?.paidAt,
      invoiceId: session.paymentInfo?.invoiceId,
      invoiceUrl: session.paymentInfo?.invoiceUrl,
    };

    // new subscription
    let newSubscription: NewSubscription | undefined = undefined;
    const subscriptionInfo = session.subscriptionInfo;

    // subscription first payment
    if (subscriptionInfo) {
      // new subscription
      newSubscription = {
        id: getUuid(),
        subscriptionNo: getSnowId(),
        userId: order.userId,
        userEmail: order.paymentEmail || order.userEmail,
        status: SubscriptionStatus.ACTIVE,
        paymentProvider: order.paymentProvider,
        subscriptionId: subscriptionInfo.subscriptionId,
        subscriptionResult: JSON.stringify(session.subscriptionResult),
        productId: order.productId,
        description: subscriptionInfo.description,
        amount: subscriptionInfo.amount,
        currency: subscriptionInfo.currency,
        interval: subscriptionInfo.interval,
        intervalCount: subscriptionInfo.intervalCount,
        trialPeriodDays: subscriptionInfo.trialPeriodDays,
        currentPeriodStart: subscriptionInfo.currentPeriodStart,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
        planName: order.planName || order.productName,
        billingUrl: subscriptionInfo.billingUrl,
        productName: order.productName,
        creditsAmount: order.creditsAmount,
        creditsValidDays: order.creditsValidDays,
        paymentProductId: order.paymentProductId,
        paymentUserId: session.paymentInfo?.paymentUserId,
        affiliateProfileId: order.affiliateProfileId,
        affiliateReferralId: order.affiliateReferralId,
        affiliateCode: order.affiliateCode,
        affiliateDiscountCode: order.affiliateDiscountCode,
      };

      updateOrder.subscriptionId = session.subscriptionId;
      updateOrder.subscriptionResult = JSON.stringify(
        session.subscriptionResult,
      );
    }

    // grant credit for order
    let newCredit: NewCredit | undefined = undefined;
    if (order.creditsAmount && order.creditsAmount > 0) {
      const credits = order.creditsAmount;
      const expiresAt =
        credits > 0
          ? calculateCreditExpirationTime({
              creditsValidDays: order.creditsValidDays || 0,
              currentPeriodEnd: subscriptionInfo?.currentPeriodEnd,
            })
          : null;

      newCredit = {
        id: getUuid(),
        userId: order.userId,
        userEmail: order.userEmail,
        orderNo: order.orderNo,
        subscriptionNo: newSubscription?.subscriptionNo,
        transactionNo: getSnowId(),
        transactionType: CreditTransactionType.GRANT,
        transactionScene:
          order.paymentType === PaymentType.SUBSCRIPTION
            ? CreditTransactionScene.SUBSCRIPTION
            : CreditTransactionScene.PAYMENT,
        credits: credits,
        remainingCredits: credits,
        description: `Grant credit`,
        expiresAt: expiresAt,
        status: CreditStatus.ACTIVE,
      };
    }

    const result = await updateOrderInTransaction({
      orderNo,
      updateOrder,
      newSubscription,
      newCredit,
    });
    await createAffiliateCommissionFromPaidOrder({
      order: result.order,
      subscription: result.subscription,
    });
  } else {
    throw new Error("unknown payment status");
  }
}

export async function handleSubscriptionRenewal({
  subscription,
  session,
}: {
  subscription: Subscription; // subscription
  session: PaymentSession; // payment session
}) {
  const subscriptionNo = subscription.subscriptionNo;
  if (!subscriptionNo || !subscription.amount || !subscription.currency) {
    throw new Error("invalid subscription");
  }

  if (!session.subscriptionId || !session.subscriptionInfo) {
    throw new Error("invalid payment session");
  }
  if (session.subscriptionId !== subscription.subscriptionId) {
    throw new Error("subscription id mismatch");
  }

  const subscriptionInfo = session.subscriptionInfo;
  if (
    !subscriptionInfo ||
    !subscriptionInfo.currentPeriodStart ||
    !subscriptionInfo.currentPeriodEnd
  ) {
    throw new Error("invalid subscription info");
  }

  // payment success
  if (session.paymentStatus === PaymentStatus.SUCCESS) {
    // update subscription period
    const updateSubscription: UpdateSubscription = {
      currentPeriodStart: subscriptionInfo.currentPeriodStart,
      currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
    };

    const orderNo = getSnowId();
    const currentTime = new Date();

    // renewal order
    const order: NewOrder = {
      id: getUuid(),
      orderNo: orderNo,
      userId: subscription.userId,
      userEmail: subscription.userEmail,
      status: OrderStatus.PAID,
      amount: subscription.amount,
      currency: subscription.currency,
      productId: subscription.productId,
      paymentType: PaymentType.RENEW,
      paymentInterval: subscription.interval,
      paymentProvider: session.provider || subscription.paymentProvider,
      checkoutInfo: "",
      createdAt: currentTime,
      productName: subscription.productName,
      description: "Subscription Renewal",
      callbackUrl: "",
      creditsAmount: subscription.creditsAmount,
      creditsValidDays: subscription.creditsValidDays,
      planName: subscription.planName || "",
      paymentProductId: subscription.paymentProductId,
      paymentResult: JSON.stringify(session.paymentResult),
      paymentAmount: session.paymentInfo?.paymentAmount,
      paymentCurrency: session.paymentInfo?.paymentCurrency,
      discountAmount: session.paymentInfo?.discountAmount ?? null,
      discountCurrency:
        session.paymentInfo?.discountCurrency ||
        session.paymentInfo?.paymentCurrency ||
        subscription.currency ||
        null,
      discountCode:
        session.paymentInfo?.discountCode ||
        subscription.affiliateDiscountCode ||
        "",
      paymentEmail: session.paymentInfo?.paymentEmail,
      paymentUserId: session.paymentInfo?.paymentUserId,
      paidAt: session.paymentInfo?.paidAt,
      invoiceId: session.paymentInfo?.invoiceId,
      invoiceUrl: session.paymentInfo?.invoiceUrl,
      subscriptionNo: subscription.subscriptionNo,
      transactionId: session.paymentInfo?.transactionId,
      paymentUserName: session.paymentInfo?.paymentUserName,
      subscriptionId: session.subscriptionId,
      subscriptionResult: JSON.stringify(session.subscriptionResult),
      affiliateProfileId: subscription.affiliateProfileId,
      affiliateReferralId: subscription.affiliateReferralId,
      affiliateCode: subscription.affiliateCode,
      affiliateDiscountCode: subscription.affiliateDiscountCode,
    };

    // grant credit for renewal order
    let newCredit: NewCredit | undefined = undefined;
    if (order.creditsAmount && order.creditsAmount > 0) {
      const credits = order.creditsAmount;
      const expiresAt =
        credits > 0
          ? calculateCreditExpirationTime({
              creditsValidDays: order.creditsValidDays || 0,
              currentPeriodEnd: subscriptionInfo?.currentPeriodEnd,
            })
          : null;

      newCredit = {
        id: getUuid(),
        userId: order.userId,
        userEmail: order.userEmail,
        orderNo: order.orderNo,
        subscriptionNo: subscription.subscriptionNo,
        transactionNo: getSnowId(),
        transactionType: CreditTransactionType.GRANT,
        transactionScene:
          order.paymentType === PaymentType.SUBSCRIPTION
            ? CreditTransactionScene.SUBSCRIPTION
            : CreditTransactionScene.PAYMENT,
        credits: credits,
        remainingCredits: credits,
        description: `Grant credit`,
        expiresAt: expiresAt,
        status: CreditStatus.ACTIVE,
      };
    }

    const result = await updateSubscriptionInTransaction({
      subscriptionNo,
      updateSubscription,
      newOrder: order,
      newCredit,
    });
    await createAffiliateCommissionFromRenewal({
      subscription: result.subscription,
      order: result.order,
    });
    // 发送续期成功邮件（统一主题样式）
    const configs = await getAllConfigs();
    await sendRenewalEmailWithTheme({
      subscription,
      session,
      orderNo,
      configs,
    });
  } else {
    throw new Error("unknown payment status");
  }
}

export async function handleSubscriptionUpdated({
  subscription,
  session,
}: {
  subscription: Subscription; // subscription
  session: PaymentSession; // payment session
}) {
  const subscriptionNo = subscription.subscriptionNo;
  if (!subscriptionNo || !subscription.amount || !subscription.currency) {
    throw new Error("invalid subscription");
  }

  const subscriptionInfo = session.subscriptionInfo;
  if (!subscriptionInfo || !subscriptionInfo.status) {
    throw new Error("invalid subscription info");
  }

  let updateSubscriptionStatus: SubscriptionStatus = subscriptionInfo.status;

  await updateSubscriptionBySubscriptionNo(subscriptionNo, {
    status: updateSubscriptionStatus,
    currentPeriodStart: subscriptionInfo.currentPeriodStart,
    currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
    canceledAt: subscriptionInfo.canceledAt || null,
    canceledEndAt: subscriptionInfo.canceledEndAt || null,
    canceledReason: subscriptionInfo.canceledReason || "",
    canceledReasonType: subscriptionInfo.canceledReasonType || "",
  });

  // console.log('handle subscription updated', subscriptionInfo);
}

export async function handleSubscriptionCanceled({
  subscription,
  session,
}: {
  subscription: Subscription; // subscription
  session: PaymentSession; // payment session
}) {
  const subscriptionNo = subscription.subscriptionNo;
  if (!subscriptionNo || !subscription.amount || !subscription.currency) {
    throw new Error("invalid subscription");
  }

  const subscriptionInfo = session.subscriptionInfo;
  if (
    !subscriptionInfo ||
    !subscriptionInfo.status ||
    !subscriptionInfo.canceledAt
  ) {
    throw new Error("invalid subscription info");
  }

  await updateSubscriptionBySubscriptionNo(subscriptionNo, {
    status: SubscriptionStatus.CANCELED,
    canceledAt: subscriptionInfo.canceledAt,
    canceledEndAt: subscriptionInfo.canceledEndAt,
    canceledReason: subscriptionInfo.canceledReason,
    canceledReasonType: subscriptionInfo.canceledReasonType,
  });

  // console.log('handle subscription canceled', subscriptionInfo);
}
