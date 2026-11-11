import { and, count, desc, eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { credit, order, session, subscription } from '@/config/db/schema';
import { PaymentSession, PaymentType, SubscriptionInfo } from '@/extensions/payment/types';

import { NewCredit } from './credit';
import {
  NewSubscription,
  UpdateSubscription,
  updateSubscriptionBySubscriptionNo,
} from './subscription';
import { appendUserToResult, User } from './user';
import { emailService } from '../lib/email';
import { getAllConfigs, Configs } from './config';

export type Order = typeof order.$inferSelect & {
  user?: User;
};
export type NewOrder = typeof order.$inferInsert;
export type UpdateOrder = Partial<
  Omit<NewOrder, 'id' | 'orderNo' | 'createdAt'>
>;

export enum OrderStatus {
  // processing status
  PENDING = 'pending', // order saved, waiting for checkout
  CREATED = 'created', // checkout success
  // final status
  COMPLETED = 'completed', // checkout completed, but failed
  PAID = 'paid', // order paid success
  FAILED = 'failed', // order paid, but failed
}

/**
 * create order
 */
export async function createOrder(newOrder: NewOrder) {
  const [result] = await db().insert(order).values(newOrder).returning();

  return result;
}

/**
 * get orders
 */
export async function getOrders({
  orderNo,
  userId,
  status,
  getUser,
  paymentType,
  paymentProvider,
  page = 1,
  limit = 30,
}: {
  orderNo?: string;
  userId?: string;
  status?: OrderStatus;
  getUser?: boolean;
  paymentType?: PaymentType;
  paymentProvider?: string;
  page?: number;
  limit?: number;
} = {}): Promise<Order[]> {
  const result = await db()
    .select()
    .from(order)
    .where(
      and(
        orderNo ? eq(order.orderNo, orderNo) : undefined,
        userId ? eq(order.userId, userId) : undefined,
        status ? eq(order.status, status) : undefined,
        paymentType ? eq(order.paymentType, paymentType) : undefined,
        paymentProvider ? eq(order.paymentProvider, paymentProvider) : undefined
      )
    )
    .orderBy(desc(order.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  if (getUser) {
    return appendUserToResult(result);
  }

  return result;
}

/**
 * get orders count
 */
export async function getOrdersCount({
  orderNo,
  userId,
  paymentType,
  status,
  paymentProvider,
}: {
  orderNo?: string;
  userId?: string;
  paymentType?: PaymentType;
  paymentProvider?: string;
  status?: OrderStatus;
} = {}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(order)
    .where(
      and(
        orderNo ? eq(order.orderNo, orderNo) : undefined,
        userId ? eq(order.userId, userId) : undefined,
        status ? eq(order.status, status) : undefined,
        paymentType ? eq(order.paymentType, paymentType) : undefined,
        paymentProvider ? eq(order.paymentProvider, paymentProvider) : undefined
      )
    );

  return result?.count || 0;
}

/**
 * find order by id
 */
export async function findOrderById(id: string) {
  const [result] = await db().select().from(order).where(eq(order.id, id));

  return result;
}

/**
 * find order by order no
 */
export async function findOrderByOrderNo(orderNo: string) {
  const [result] = await db()
    .select()
    .from(order)
    .where(eq(order.orderNo, orderNo));

  return result;
}

/**
 * update order
 */
export async function updateOrderByOrderNo(
  orderNo: string,
  updateOrder: UpdateOrder
) {
  const [result] = await db()
    .update(order)
    .set(updateOrder)
    .where(eq(order.orderNo, orderNo))
    .returning();

  return result;
}

/**
 * update order by order id
 */
export async function updateOrderByOrderId(
  orderId: string,
  updateOrder: UpdateOrder
) {
  const [result] = await db()
    .update(order)
    .set(updateOrder)
    .where(eq(order.id, orderId))
    .returning();

  return result;
}

export async function updateOrderInTransaction({
  orderNo,
  updateOrder,
  newSubscription,
  newCredit,
}: {
  orderNo: string;
  updateOrder: UpdateOrder;
  newSubscription?: NewSubscription;
  newCredit?: NewCredit;
}) {
  if (!orderNo || !updateOrder) {
    throw new Error('orderNo and updateOrder are required');
  }

  // only update order, no need transaction
  if (!newSubscription && !newCredit) {
    return updateOrderByOrderNo(orderNo, updateOrder);
  }

  // deal with subscription
  let shouldSendSubscriptionEmail = false;
  let subscriptionInfoForEmail: SubscriptionInfo | undefined = undefined;
  let shouldSendOneTimePaymentEmail = false;
  let configsForEmail: Configs | undefined = undefined;

  // need transaction
  const result = await db().transaction(async (tx) => {
    // 在事务内获取配置，避免事务外查询数据库时连接失效
    try {
      configsForEmail = await getAllConfigs();
    } catch (error) {
      console.warn('[updateOrderInTransaction] 在事务内获取配置失败，将在邮件发送时重试:', error);
    }
    let result: any = {
      order: null,
      subscription: null,
      credit: null,
    };
    if (newSubscription) {
      let existingSubscription: any = null;
      if (newSubscription.subscriptionId && newSubscription.paymentProvider) {
        // not create subscription with same subscription id and payment provider
        const [existingSubscriptionResult] = await tx
          .select()
          .from(subscription)
          .where(
            and(
              eq(subscription.subscriptionId, newSubscription.subscriptionId),
              eq(subscription.paymentProvider, newSubscription.paymentProvider)
            )
          );

        existingSubscription = existingSubscriptionResult;
      }

      if (!existingSubscription) {
        // create subscription
        const [subscriptionResult] = await tx
          .insert(subscription)
          .values(newSubscription)
          .returning();

        existingSubscription = subscriptionResult;
        shouldSendSubscriptionEmail = true;

        // build subscriptionInfo from newSubscription for email
        if (newSubscription.currentPeriodStart && newSubscription.currentPeriodEnd) {
          subscriptionInfoForEmail = {
            subscriptionId: newSubscription.subscriptionId || '',
            planId: newSubscription.productId || undefined,
            productId: newSubscription.productId || undefined,
            description: newSubscription.description || undefined,
            amount: newSubscription.amount ? Number(newSubscription.amount) : undefined,
            currency: newSubscription.currency || undefined,
            interval: newSubscription.interval as any,
            intervalCount: newSubscription.intervalCount || undefined,
            trialPeriodDays: newSubscription.trialPeriodDays || undefined,
            currentPeriodStart: new Date(newSubscription.currentPeriodStart),
            currentPeriodEnd: new Date(newSubscription.currentPeriodEnd),
            billingUrl: undefined,
            status: newSubscription.status as any,
          };
        }
      }

      result.subscription = existingSubscription;
    }
    if (newCredit) {
      // not create credit with same order no
      let [existingCredit] = await tx
        .select()
        .from(credit)
        .where(eq(credit.orderNo, orderNo));

      if (!existingCredit) {
        // create credit
        const [creditResult] = await tx
          .insert(credit)
          .values(newCredit)
          .returning();

        existingCredit = creditResult;
        shouldSendOneTimePaymentEmail = true;
      }

      result.credit = existingCredit;
    }

    // update order
    const [orderResult] = await tx
      .update(order)
      .set(updateOrder)
      .where(eq(order.orderNo, orderNo))
      .returning();

    result.order = orderResult;
    return result;
  });
  // 异步发送邮件，不阻塞事务
  if (shouldSendSubscriptionEmail) {
    //将order和updateOrder合并
    const orderForEmail = { ...result.order as Order, ...updateOrder };
    await sendSubscriptionEmailWithTheme({
      order: orderForEmail as Order,
      subscriptionInfo: subscriptionInfoForEmail,
      orderNo,
      configs: configsForEmail
    }).catch((error) => {
      console.error('[updateOrderInTransaction] Failed to send subscription email:', error);
    });
  } else if (shouldSendOneTimePaymentEmail) {
    // 一次性付款邮件同样需要合并 order + updateOrder，确保 userEmail/paymentEmail 等字段齐全
    const orderForEmail = { ...result.order as Order, ...updateOrder };
    await sendOneTimePaymentEmailWithTheme({
      order: orderForEmail as Order,
      orderNo,
      paymentInfo: undefined, // paymentInfo will be extracted from order
      configs: configsForEmail, // 传递在事务内获取的配置
    }).catch((error) => {
      console.error('[updateOrderInTransaction] Failed to send one-time payment email:', error);
    });
  }
  return result;
}

export async function updateSubscriptionInTransaction({
  subscriptionNo,
  updateSubscription,
  newOrder,
  newCredit,
}: {
  subscriptionNo: string; // subscription unique id in table
  updateSubscription: UpdateSubscription;
  newOrder?: NewOrder;
  newCredit?: NewCredit;
}) {
  if (!subscriptionNo || !updateSubscription) {
    throw new Error('subscriptionNo and updateSubscription are required');
  }

  // only update order, no need transaction
  if (!newOrder && !newCredit) {
    return updateSubscriptionBySubscriptionNo(
      subscriptionNo,
      updateSubscription
    );
  }

  // need transaction
  const result = await db().transaction(async (tx) => {
    let result: any = {
      order: null,
      subscription: null,
      credit: null,
    };

    // deal with order
    if (newOrder) {
      let existingOrder: any = null;
      if (newOrder.transactionId && newOrder.paymentProvider) {
        // not create order with same payment transaction id and payment provider
        const [existingOrderResult] = await tx
          .select()
          .from(order)
          .where(
            and(
              eq(order.transactionId, newOrder.transactionId),
              eq(order.paymentProvider, newOrder.paymentProvider)
            )
          );

        existingOrder = existingOrderResult;
      }

      if (!existingOrder) {
        // create order
        const [orderResult] = await tx
          .insert(order)
          .values(newOrder)
          .returning();

        existingOrder = orderResult;
      }

      result.order = existingOrder;
    }

    // deal with credit
    if (newCredit) {
      let existingCredit: any = null;
      if (result.order && result.order.orderNo) {
        // not create credit with same order no
        const [existingCreditResult] = await tx
          .select()
          .from(credit)
          .where(eq(credit.orderNo, result.order.orderNo));

        existingCredit = existingCreditResult;
      }

      if (!existingCredit) {
        // create credit
        const [creditResult] = await tx
          .insert(credit)
          .values(newCredit)
          .returning();

        existingCredit = creditResult;
      }

      result.credit = existingCredit;
    }

    // update subscription
    const [subscriptionResult] = await tx
      .update(subscription)
      .set(updateSubscription)
      .where(eq(subscription.subscriptionNo, subscriptionNo))
      .returning();

    result.subscription = subscriptionResult;

    return result;
  });

  return result;
}


/**
 * 统一发送订阅确认邮件（主题样式）
 */
async function sendSubscriptionEmailWithTheme(opts: {
  order: Order;
  subscriptionInfo?: SubscriptionInfo;
  orderNo: string;
  configs?: Configs;
}) {
  const { order, subscriptionInfo, orderNo } = opts;
  const email = order.userEmail || order.paymentEmail || '';
  const planName = order.planName || order.productName || 'Subscription';
  const amountCentsRaw = order.paymentAmount ?? order.amount ?? 0;
  const amountCents = amountCentsRaw ? Number(amountCentsRaw) : 0;
  const currency = order.paymentCurrency || order.currency || 'USD';
  const amountDisplay = amountCents
    ? `${(amountCents / 100).toFixed(2)} ${currency}`
    : `${order.amount ?? ''}`;
  const userName = order.paymentUserName || order.user?.name || undefined;
  const orderId = order.orderNo || undefined;
  const validPeriod = subscriptionInfo?.currentPeriodEnd
    ? subscriptionInfo.currentPeriodEnd.toISOString().split('T')[0]
    : undefined;
  const renewDate = subscriptionInfo?.currentPeriodStart
    ? subscriptionInfo.currentPeriodStart.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : undefined;

  if (email) {
    await emailService.sendSubscriptionConfirmationEmail(
      email,
      planName,
      amountDisplay,
      opts.configs || await getAllConfigs(),
      userName,
      orderId,
      validPeriod,
      order.productName || undefined,
      undefined,
      renewDate
    );
  } else {
    console.log('[handleCheckoutSuccess] skip sending subscription email: no email found', {
      orderNo,
      userId: order.userId,
    });
  }
}

/**
 * 发送一次性付款邮件（主题样式）
 */
async function sendOneTimePaymentEmailWithTheme(opts: {
  order: Order;
  orderNo: string;
  paymentInfo?: PaymentSession['paymentInfo'];
  configs?: Configs;
}) {
  const { order, orderNo, paymentInfo } = opts;
  const email = order.userEmail || paymentInfo?.paymentEmail || order.paymentEmail || '';
  const itemName = order.productName || order.planName || 'One-time purchase';
  const amountCentsRaw =
    paymentInfo?.paymentAmount ?? order.paymentAmount ?? order.amount ?? 0;
  const amountCents = amountCentsRaw ? Number(amountCentsRaw) : 0;
  const currency =
    paymentInfo?.paymentCurrency ||
    order.paymentCurrency ||
    order.currency ||
    'USD';
  const amountDisplay = amountCents
    ? `${(amountCents / 100).toFixed(2)} ${currency}`
    : `${order.amount ?? ''}`;
  const orderId = order.orderNo || undefined;
  const purchaseDate =
    paymentInfo?.paidAt ||
    new Date();
  const purchaseDateStr = purchaseDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (email) {
    await emailService.sendOneTimePaymentEmail(
      email,
      amountDisplay,
      opts.configs || await getAllConfigs(),
      itemName,
      orderId,
      undefined,
      purchaseDateStr
    );
  } else {
    console.log('[handleCheckoutSuccess] skip sending one-time email: no email found', {
      orderNo,
      userId: order.userId,
    });
  }
}