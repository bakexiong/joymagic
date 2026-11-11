import {
  PaymentType,
  PaymentInterval,
  PaymentOrder,
} from "@/extensions/payment/types";
import { getSnowId, getUuid } from "@/shared/lib/hash";
import { respData, respErr } from "@/shared/lib/resp";
import { authenticateApiKey } from "@/shared/lib/api-auth";
import { verifyOpenApiKey, forbiddenResponse } from "@/shared/lib/api-security";
import { getAllConfigs } from "@/shared/models/config";
import {
  createOrder,
  NewOrder,
  OrderStatus,
  updateOrderByOrderNo,
} from "@/shared/models/order";
import { getPaymentService } from "@/shared/services/payment";

/**
 * POST /api/openapi/v1/recharge
 * 桌面端充值接口：创建支付订单并返回 checkout URL
 *
 * 认证：X-OpenAPI-Key + Authorization: Bearer <user-api-key>
 * Body: { amount: number, paymentProductId?: string }
 */
export async function POST(req: Request) {
  // OpenAPI Key 验证
  const { valid: keyValid, error: keyError } = verifyOpenApiKey(req);
  if (!keyValid) {
    return forbiddenResponse(keyError);
  }

  // 必须提供 X-OpenAPI-Key，Authorization 用于用户 API Key
  const openApiKeyHeader = req.headers.get("X-OpenAPI-Key");
  if (!openApiKeyHeader) {
    return forbiddenResponse("X-OpenAPI-Key header is required");
  }

  // 用户 API Key 认证
  const { user, error: authError } = await authenticateApiKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { amount, paymentProductId } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return respErr("amount is required and must be a positive number");
    }

    if (!paymentProductId || typeof paymentProductId !== "string") {
      return respErr("paymentProductId is required");
    }

    const configs = await getAllConfigs();
    const paymentService = await getPaymentService();
    const paymentProviderName = paymentService.resolveProviderName({
      preferredProvider: configs.default_payment_provider,
    });
    if (!paymentProviderName) {
      return respErr("no payment provider configured");
    }

    const paymentProvider = paymentService.getProvider(paymentProviderName);
    if (!paymentProvider?.name) {
      return respErr("payment provider is not configured");
    }

    const orderNo = getSnowId();
    const currency = "usd";

    const checkoutOrder: PaymentOrder = {
      description: `API Top-up $${amount.toFixed(2)}`,
      customer: { name: user!.name ?? undefined, email: user!.email },
      type: PaymentType.ONE_TIME,
      productId: paymentProductId.trim(),
      metadata: {
        app_name: configs.app_name,
        order_no: orderNo,
        user_id: user!.id,
        api_recharge: true,
      },
      successUrl: `${configs.app_url}/api/api-recharge/callback?order_no=${orderNo}`,
      cancelUrl: `${configs.app_url}/recharge`,
    };

    const order: NewOrder = {
      id: getUuid(),
      orderNo,
      userId: user!.id,
      userEmail: user!.email,
      status: OrderStatus.PENDING,
      amount: Math.round(amount * 100),
      currency,
      productId: paymentProductId.trim(),
      paymentType: PaymentType.ONE_TIME,
      paymentInterval: PaymentInterval.ONE_TIME,
      paymentProvider: paymentProvider.name,
      checkoutInfo: JSON.stringify(checkoutOrder),
      createdAt: new Date(),
      productName: `API Top-up $${amount.toFixed(2)}`,
      description: `API Top-up $${amount.toFixed(2)}`,
      callbackUrl: `${configs.app_url}/recharge?success=1`,
      creditsAmount: 0,
      paymentProductId: paymentProductId.trim(),
    };

    await createOrder(order);

    const result = await paymentProvider.createPayment({
      order: checkoutOrder,
    });

    await updateOrderByOrderNo(orderNo, {
      status: OrderStatus.CREATED,
      checkoutInfo: JSON.stringify(result.checkoutParams),
      checkoutResult: JSON.stringify(result.checkoutResult),
      checkoutUrl: result.checkoutInfo.checkoutUrl,
      paymentSessionId: result.checkoutInfo.sessionId,
      paymentProvider: result.provider,
    });

    return respData(result.checkoutInfo);
  } catch (e: any) {
    console.error("[OpenAPI recharge] failed:", e);
    return respErr(e?.message ?? "recharge failed");
  }
}
