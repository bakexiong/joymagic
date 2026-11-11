import {
  PaymentEvent,
  PaymentEventType,
  SubscriptionCycleType,
} from "@/extensions/payment/types";
import { findOrderByOrderNo } from "@/shared/models/order";
import { findSubscriptionByProviderSubscriptionId } from "@/shared/models/subscription";
import {
  handleCheckoutSuccess,
  handleSubscriptionCanceled,
  handleSubscriptionRenewal,
  handleSubscriptionUpdated,
} from "@/shared/services/payment";

export async function handlePaymentNotifyEvent({
  event,
  provider,
}: {
  event: PaymentEvent;
  provider: string;
}) {
  const eventType = event.eventType;
  if (!eventType) {
    throw new Error("event type not found");
  }

  const session = event.paymentSession;
  if (!session) {
    throw new Error("payment session not found");
  }

  console.log("[payment notify shared] start", {
    provider,
    eventType,
    orderNo: session.metadata?.order_no || "",
    transactionId: session.paymentInfo?.transactionId || "",
    subscriptionId: session.subscriptionId || "",
    paymentStatus: session.paymentStatus || "",
    subscriptionCycleType: session.paymentInfo?.subscriptionCycleType || "",
  });

  if (eventType === PaymentEventType.CHECKOUT_SUCCESS) {
    const orderNo = session.metadata.order_no;

    if (!orderNo) {
      throw new Error("order no not found");
    }

    console.log(
      "[payment notify shared] resolving order for checkout success",
      {
        provider,
        orderNo,
      },
    );

    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      throw new Error("order not found");
    }

    console.log("[payment notify shared] order found for checkout success", {
      provider,
      orderNo,
      orderStatus: order.status,
      paymentProvider: order.paymentProvider,
    });

    await handleCheckoutSuccess({
      order,
      session,
    });
  } else if (eventType === PaymentEventType.PAYMENT_SUCCESS) {
    if (session.subscriptionId && session.subscriptionInfo) {
      if (
        session.paymentInfo?.subscriptionCycleType ===
        SubscriptionCycleType.RENEWAL
      ) {
        console.log(
          "[payment notify shared] resolving subscription for renewal",
          {
            provider,
            subscriptionId: session.subscriptionId,
          },
        );
        const existingSubscription =
          await findSubscriptionByProviderSubscriptionId({
            provider,
            subscriptionId: session.subscriptionId,
          });
        if (!existingSubscription) {
          throw new Error("subscription not found");
        }

        console.log("[payment notify shared] subscription found for renewal", {
          provider,
          subscriptionNo: existingSubscription.subscriptionNo,
          subscriptionId: existingSubscription.subscriptionId,
          status: existingSubscription.status,
        });

        await handleSubscriptionRenewal({
          subscription: existingSubscription,
          session,
        });
      } else {
        console.log("not handle subscription first payment");
      }
    } else {
      console.log("not handle one-time payment");
    }
  } else if (eventType === PaymentEventType.SUBSCRIBE_UPDATED) {
    if (!session.subscriptionId || !session.subscriptionInfo) {
      throw new Error("subscription id or subscription info not found");
    }

    console.log("[payment notify shared] resolving subscription for update", {
      provider,
      subscriptionId: session.subscriptionId,
      nextStatus: session.subscriptionInfo.status || "",
    });

    const existingSubscription = await findSubscriptionByProviderSubscriptionId(
      {
        provider,
        subscriptionId: session.subscriptionId,
      },
    );
    if (!existingSubscription) {
      throw new Error("subscription not found");
    }

    console.log("[payment notify shared] subscription found for update", {
      provider,
      subscriptionNo: existingSubscription.subscriptionNo,
      currentStatus: existingSubscription.status,
      nextStatus: session.subscriptionInfo.status || "",
    });

    await handleSubscriptionUpdated({
      subscription: existingSubscription,
      session,
    });
  } else if (eventType === PaymentEventType.SUBSCRIBE_CANCELED) {
    if (!session.subscriptionId || !session.subscriptionInfo) {
      throw new Error("subscription id or subscription info not found");
    }

    console.log("[payment notify shared] resolving subscription for cancel", {
      provider,
      subscriptionId: session.subscriptionId,
      nextStatus: session.subscriptionInfo.status || "",
    });

    const existingSubscription = await findSubscriptionByProviderSubscriptionId(
      {
        provider,
        subscriptionId: session.subscriptionId,
      },
    );
    if (!existingSubscription) {
      throw new Error("subscription not found");
    }

    console.log("[payment notify shared] subscription found for cancel", {
      provider,
      subscriptionNo: existingSubscription.subscriptionNo,
      currentStatus: existingSubscription.status,
      nextStatus: session.subscriptionInfo.status || "",
    });

    await handleSubscriptionCanceled({
      subscription: existingSubscription,
      session,
    });
  } else {
    console.log("not handle other event type: " + eventType);
  }
}
