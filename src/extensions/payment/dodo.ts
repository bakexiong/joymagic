import DodoPayments from "dodopayments";

import {
  CheckoutSession,
  PaymentBilling,
  PaymentConfigs,
  PaymentCustomField,
  PaymentEvent,
  PaymentEventType,
  PaymentInterval,
  PaymentOrder,
  PaymentProvider,
  PaymentSession,
  PaymentStatus,
  PaymentType,
  SubscriptionCycleType,
  SubscriptionInfo,
  SubscriptionStatus,
} from "./types";

/**
 * Dodo Payments provider configs
 * @docs https://docs.dodopayments.com/
 */
export interface DodoPaymentsConfigs extends PaymentConfigs {
  apiKey: string;
  webhookKey?: string;
  environment?: "live_mode" | "test_mode";
}

/**
 * Dodo Payments provider implementation
 * @website https://dodopayments.com/
 */
export class DodoPaymentsProvider implements PaymentProvider {
  readonly name = "dodo";
  configs: DodoPaymentsConfigs;

  private client: DodoPayments;

  constructor(configs: DodoPaymentsConfigs) {
    this.configs = configs;
    this.client = new DodoPayments({
      bearerToken: configs.apiKey,
      webhookKey: configs.webhookKey,
      environment: configs.environment || "test_mode",
    });
  }

  async createPayment({
    order,
  }: {
    order: PaymentOrder;
  }): Promise<CheckoutSession> {
    try {
      if (!order.productId) {
        throw new Error("productId is required for Dodo Payments");
      }

      if (!order.customer?.email) {
        throw new Error("customer email is required");
      }

      const payload: any = {
        product_cart: [
          {
            product_id: order.productId,
            quantity: order.quantity || 1,
          },
        ],
        customer: {
          email: order.customer.email,
          name: order.customer.name || undefined,
        },
        billing_currency: normalizeCurrency(order.price?.currency),
        cancel_url: order.cancelUrl,
        return_url: order.successUrl,
        discount_code: order.discount?.code || undefined,
        metadata: serializeMetadata(order.metadata),
        custom_fields: order.customFields?.map(mapCustomField),
      };

      if (order.type === PaymentType.SUBSCRIPTION) {
        payload.subscription_data = {
          trial_period_days: order.plan?.trialPeriodDays || undefined,
        };
      } else if (order.price?.amount) {
        payload.product_cart[0].amount = order.price.amount;
      }

      const result = await this.client.checkoutSessions.create(payload);
      if (!result.session_id || !result.checkout_url) {
        throw new Error("create payment failed");
      }

      return {
        provider: this.name,
        checkoutParams: payload,
        checkoutInfo: {
          sessionId: result.session_id,
          checkoutUrl: result.checkout_url,
        },
        checkoutResult: result,
        metadata: order.metadata || {},
      };
    } catch (error) {
      throw error;
    }
  }

  async getPaymentSession({
    sessionId,
  }: {
    sessionId: string;
  }): Promise<PaymentSession> {
    try {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }

      const checkoutSession =
        await this.client.checkoutSessions.retrieve(sessionId);

      return await this.buildPaymentSessionFromCheckoutSession(checkoutSession);
    } catch (error) {
      throw error;
    }
  }

  async getPaymentEvent({ req }: { req: Request }): Promise<PaymentEvent> {
    try {
      const rawBody = await req.text();
      if (!rawBody) {
        throw new Error("Invalid webhook request");
      }

      const headers = Object.fromEntries(req.headers.entries());
      console.log("[dodo webhook] received request", {
        headerKeys: Object.keys(headers).sort(),
        hasWebhookId: Boolean(headers["webhook-id"]),
        hasWebhookSignature: Boolean(headers["webhook-signature"]),
        hasWebhookTimestamp: Boolean(headers["webhook-timestamp"]),
        webhookId: headers["webhook-id"] || "",
        webhookTimestamp: headers["webhook-timestamp"] || "",
        hasWebhookKeyConfig: Boolean(this.configs.webhookKey),
        environment: this.configs.environment || "test_mode",
        rawBodyLength: rawBody.length,
      });

      const event = this.client.webhooks.unwrap(rawBody, {
        headers,
        key: this.configs.webhookKey,
      });
      console.log("[dodo webhook] signature verified", {
        eventType: event.type,
        businessId: (event as any).business_id || "",
      });

      let paymentSession: PaymentSession | undefined = undefined;
      let eventType: PaymentEventType | undefined = undefined;

      switch (event.type) {
        case "payment.succeeded": {
          paymentSession = await this.buildPaymentSessionFromPayment(
            event.data as any,
          );

          const subscriptionInfo = paymentSession.subscriptionInfo;
          const isRenewal =
            paymentSession.paymentInfo?.subscriptionCycleType ===
            SubscriptionCycleType.RENEWAL;

          if (subscriptionInfo && isRenewal) {
            eventType = PaymentEventType.PAYMENT_SUCCESS;
          } else {
            eventType = PaymentEventType.CHECKOUT_SUCCESS;
          }
          break;
        }
        case "payment.failed":
        case "payment.cancelled": {
          paymentSession = await this.buildPaymentSessionFromPayment(
            event.data as any,
          );
          eventType = PaymentEventType.PAYMENT_FAILED;
          break;
        }
        case "subscription.active":
        case "subscription.updated":
        case "subscription.plan_changed":
        case "subscription.on_hold":
        case "subscription.failed":
        case "subscription.renewed": {
          paymentSession = this.buildPaymentSessionFromSubscription(
            event.data as any,
          );
          eventType = PaymentEventType.SUBSCRIBE_UPDATED;
          break;
        }
        case "subscription.cancelled":
        case "subscription.expired": {
          paymentSession = this.buildPaymentSessionFromSubscription(
            event.data as any,
          );
          eventType = PaymentEventType.SUBSCRIBE_CANCELED;
          break;
        }
        default:
          throw new Error(`Not handle dodo event type: ${event.type}`);
      }

      if (!eventType || !paymentSession) {
        throw new Error("Invalid webhook event");
      }

      console.log("[dodo webhook] mapped event", {
        sourceEventType: event.type,
        mappedEventType: eventType,
        paymentStatus: paymentSession.paymentStatus,
        transactionId: paymentSession.paymentInfo?.transactionId || "",
        subscriptionId: paymentSession.subscriptionId || "",
        orderNo: paymentSession.metadata?.order_no || "",
        paymentUserId: paymentSession.paymentInfo?.paymentUserId || "",
        subscriptionCycleType:
          paymentSession.paymentInfo?.subscriptionCycleType || "",
      });

      return {
        eventType,
        eventResult: event,
        paymentSession,
      };
    } catch (error) {
      console.error("[dodo webhook] getPaymentEvent failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getPaymentBilling({
    customerId,
    returnUrl,
  }: {
    customerId: string;
    returnUrl?: string;
  }): Promise<PaymentBilling> {
    try {
      const result = await this.client.customers.customerPortal.create(
        customerId,
        {
          return_url: returnUrl,
        },
      );

      if (!result.link) {
        throw new Error("get billing url failed");
      }

      return {
        billingUrl: result.link,
      };
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscription({
    subscriptionId,
  }: {
    subscriptionId: string;
  }): Promise<PaymentSession> {
    try {
      const result = await this.client.subscriptions.update(subscriptionId, {
        cancel_at_next_billing_date: true,
        cancel_reason: "cancelled_by_customer",
      });

      return this.buildPaymentSessionFromSubscription(result as any);
    } catch (error) {
      throw error;
    }
  }

  private async buildPaymentSessionFromCheckoutSession(
    checkoutSession: any,
  ): Promise<PaymentSession> {
    let payment: any = undefined;
    let subscription: any = undefined;

    if (checkoutSession.payment_id) {
      payment = await this.client.payments.retrieve(checkoutSession.payment_id);
    }

    if (payment?.subscription_id) {
      subscription = await this.client.subscriptions.retrieve(
        payment.subscription_id,
      );
    }

    return this.buildPaymentSession({
      checkoutSession,
      payment,
      subscription,
    });
  }

  private async buildPaymentSessionFromPayment(payment: any) {
    let subscription: any = undefined;

    if (payment.subscription_id) {
      subscription = await this.client.subscriptions.retrieve(
        payment.subscription_id,
      );
    }

    return this.buildPaymentSession({
      payment,
      subscription,
    });
  }

  private buildPaymentSessionFromSubscription(
    subscription: any,
  ): PaymentSession {
    const subscriptionInfo = this.buildSubscriptionInfo(subscription);

    return {
      provider: this.name,
      paymentStatus: this.mapSubscriptionPaymentStatus(subscription.status),
      paymentInfo: {
        paymentAmount: subscription.recurring_pre_tax_amount || 0,
        paymentCurrency: normalizeCurrency(subscription.currency) || "USD",
        paymentEmail: subscription.customer?.email,
        paymentUserName: subscription.customer?.name,
        paymentUserId: subscription.customer?.customer_id,
      },
      subscriptionId: subscription.subscription_id,
      subscriptionInfo,
      subscriptionResult: subscription,
      metadata: serializeMetadata(subscription.metadata),
    };
  }

  private buildPaymentSession({
    checkoutSession,
    payment,
    subscription,
  }: {
    checkoutSession?: any;
    payment?: any;
    subscription?: any;
  }): PaymentSession {
    const paymentInfo = payment
      ? this.buildPaymentInfo({
          payment,
          subscription,
        })
      : undefined;

    return {
      provider: this.name,
      paymentStatus: this.mapPaymentStatus(
        payment?.status || checkoutSession?.payment_status,
      ),
      paymentInfo,
      paymentResult: payment || checkoutSession,
      subscriptionId: subscription?.subscription_id || payment?.subscription_id,
      subscriptionInfo: subscription
        ? this.buildSubscriptionInfo(subscription)
        : undefined,
      subscriptionResult: subscription,
      metadata: serializeMetadata(
        payment?.metadata || subscription?.metadata || {},
      ),
    };
  }

  private buildPaymentInfo({
    payment,
    subscription,
  }: {
    payment: any;
    subscription?: any;
  }) {
    const paymentInfo: PaymentSession["paymentInfo"] = {
      description: payment.payment_method || undefined,
      transactionId: payment.payment_id,
      amount: payment.total_amount,
      currency: normalizeCurrency(payment.currency),
      paymentAmount: payment.total_amount,
      paymentCurrency: normalizeCurrency(payment.currency) || "USD",
      paymentEmail: payment.customer?.email,
      paymentUserName: payment.customer?.name,
      paymentUserId: payment.customer?.customer_id,
      paidAt: payment.created_at ? new Date(payment.created_at) : undefined,
      invoiceId: payment.invoice_id || undefined,
      invoiceUrl: payment.invoice_url || undefined,
    };

    if (subscription?.subscription_id) {
      paymentInfo.subscriptionCycleType = this.isRenewalPayment({
        payment,
        subscription,
      })
        ? SubscriptionCycleType.RENEWAL
        : SubscriptionCycleType.CREATE;
    }

    return paymentInfo;
  }

  private buildSubscriptionInfo(subscription: any): SubscriptionInfo {
    const currentPeriodStart = toDate(
      subscription.previous_billing_date || subscription.created_at,
    );
    const currentPeriodEnd = toDate(
      subscription.next_billing_date ||
        subscription.expires_at ||
        subscription.created_at,
    );

    return {
      subscriptionId: subscription.subscription_id,
      productId: subscription.product_id,
      description: subscription.product_id,
      amount: subscription.recurring_pre_tax_amount,
      currency: normalizeCurrency(subscription.currency),
      interval: mapInterval(
        subscription.subscription_period_interval ||
          subscription.payment_frequency_interval,
      ),
      intervalCount:
        subscription.subscription_period_count ||
        subscription.payment_frequency_count,
      trialPeriodDays: subscription.trial_period_days || undefined,
      currentPeriodStart,
      currentPeriodEnd,
      metadata: serializeMetadata(subscription.metadata),
      status: mapSubscriptionStatus(
        subscription.status,
        subscription.cancel_at_next_billing_date,
      ),
      canceledAt: subscription.cancelled_at
        ? new Date(subscription.cancelled_at)
        : undefined,
      canceledEndAt: subscription.cancel_at_next_billing_date
        ? currentPeriodEnd
        : undefined,
      canceledReason: subscription.cancel_at_next_billing_date
        ? "cancel_at_next_billing_date"
        : undefined,
      canceledReasonType: subscription.cancel_at_next_billing_date
        ? "customer_requested"
        : undefined,
    };
  }

  private isRenewalPayment({
    payment,
    subscription,
  }: {
    payment: any;
    subscription: any;
  }) {
    const paymentAt = toTimestamp(payment.created_at);
    const subscriptionCreatedAt = toTimestamp(subscription.created_at);
    const previousBillingAt = toTimestamp(subscription.previous_billing_date);

    if (!paymentAt || !subscriptionCreatedAt) {
      return false;
    }

    if (
      previousBillingAt &&
      Math.abs(paymentAt - previousBillingAt) <= 10 * 60 * 1000 &&
      Math.abs(subscriptionCreatedAt - previousBillingAt) > 10 * 60 * 1000
    ) {
      return true;
    }

    return Math.abs(paymentAt - subscriptionCreatedAt) > 10 * 60 * 1000;
  }

  private mapPaymentStatus(status?: string | null): PaymentStatus {
    switch (status) {
      case "succeeded":
        return PaymentStatus.SUCCESS;
      case "failed":
        return PaymentStatus.FAILED;
      case "cancelled":
        return PaymentStatus.CANCELED;
      default:
        return PaymentStatus.PROCESSING;
    }
  }

  private mapSubscriptionPaymentStatus(status?: string | null): PaymentStatus {
    switch (status) {
      case "failed":
        return PaymentStatus.FAILED;
      case "cancelled":
      case "expired":
        return PaymentStatus.CANCELED;
      default:
        return PaymentStatus.SUCCESS;
    }
  }
}

function mapCustomField(customField: PaymentCustomField) {
  return {
    field_type: mapCustomFieldType(customField.type),
    key: customField.name,
    label: customField.label,
    required: customField.isRequired,
    options: Array.isArray(customField.metadata?.options)
      ? customField.metadata.options
      : undefined,
    placeholder:
      typeof customField.metadata?.placeholder === "string"
        ? customField.metadata.placeholder
        : undefined,
  };
}

function mapCustomFieldType(type: string) {
  switch (type) {
    case "number":
    case "email":
    case "url":
    case "date":
    case "dropdown":
    case "boolean":
      return type;
    default:
      return "text";
  }
}

function mapInterval(interval?: string | null): PaymentInterval {
  switch (interval) {
    case "Day":
      return PaymentInterval.DAY;
    case "Week":
      return PaymentInterval.WEEK;
    case "Year":
      return PaymentInterval.YEAR;
    case "Month":
    default:
      return PaymentInterval.MONTH;
  }
}

function mapSubscriptionStatus(
  status?: string | null,
  cancelAtNextBillingDate?: boolean | null,
): SubscriptionStatus {
  if (status === "active" && cancelAtNextBillingDate) {
    return SubscriptionStatus.PENDING_CANCEL;
  }

  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "cancelled":
      return SubscriptionStatus.CANCELED;
    case "expired":
      return SubscriptionStatus.EXPIRED;
    case "failed":
      return SubscriptionStatus.PAST_DUE;
    case "pending":
      return SubscriptionStatus.INCOMPLETE;
    case "on_hold":
      return SubscriptionStatus.PAUSED;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}

function serializeMetadata(metadata?: Record<string, any>) {
  const entries = Object.entries(metadata || {}).filter(
    ([key, value]) => key && value !== undefined && value !== null,
  );

  return Object.fromEntries(
    entries.map(([key, value]) => [key, String(value)]),
  );
}

function normalizeCurrency(currency?: string | null) {
  return currency ? currency.toUpperCase() : undefined;
}

function toDate(value?: string | null) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function toTimestamp(value?: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
