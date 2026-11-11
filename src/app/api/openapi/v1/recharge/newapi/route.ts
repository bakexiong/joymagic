import { respData, respErr } from '@/shared/lib/resp';
import { authenticateApiKey } from '@/shared/lib/api-auth';
import {
  verifyOpenApiKey,
  forbiddenResponse,
  verifySignature,
} from '@/shared/lib/api-security';
import { getNewApiService } from '@/extensions/newapi';
import { getSnowId, getUuid } from '@/shared/lib/hash';
import {
  createOrder,
  NewOrder,
  OrderStatus,
} from '@/shared/models/order';
import { PaymentInterval, PaymentType } from '@/extensions/payment/types';
import { getAllConfigs } from '@/shared/models/config';

/**
 * POST /api/openapi/v1/recharge/newapi
 * 
 * 通过用户 API Key，直接为 NewAPI 账号赠送指定金额（美元）。
 * 
 * 认证方式：
 * - X-OpenAPI-Key: 平台级 OpenAPI Key（用于鉴权调用方）
 * - Authorization: Bearer <user-api-key>（用于定位具体用户）
 * - X-Timestamp / X-Nonce / X-Signature：基于 OPENAPI_SECRET 的 HMAC-SHA256 参数签名
 * 
 * 请求体（JSON）：
 * - amount: number  赠送金额（单位：美元，>0）
 *
 * 侧边效果：
 * - 会在本地订单表中写入一条「API NewAPI Gift」订单记录，方便对账与审计
 */
export async function POST(req: Request) {
  // OpenAPI Key 校验
  const { valid: keyValid, error: keyError } = verifyOpenApiKey(req);
  if (!keyValid) {
    return forbiddenResponse(keyError);
  }

  // 必须提供 X-OpenAPI-Key，Authorization 用于用户 API Key
  const openApiKeyHeader = req.headers.get('X-OpenAPI-Key');
  if (!openApiKeyHeader) {
    return forbiddenResponse('X-OpenAPI-Key header is required');
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { amount } = body as { amount?: number };

    // 参数签名校验（依赖 OPENAPI_SECRET）
    const { valid, error: signError } = verifySignature(req, body);
    if (!valid) {
      return forbiddenResponse(signError);
    }

    // 用户 API Key 认证
    const { user, error: authError } = await authenticateApiKey(req);
    if (authError) return authError;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return respErr('amount is required and must be a positive number');
    }

    const newApiService = getNewApiService();
    if (!newApiService) {
      return respErr('NewAPI service is not configured');
    }

    // 创建内部订单记录（不走第三方支付，仅记账）
    const orderNo = getSnowId();
    const configs = await getAllConfigs();
    const now = new Date();

    const order: NewOrder = {
      id: getUuid(),
      orderNo,
      userId: user!.id,
      userEmail: user!.email,
      status: OrderStatus.PAID,
      amount: Math.round(amount * 100),
      currency: 'usd',
      productId: 'openapi-newapi-gift',
      paymentType: PaymentType.ONE_TIME,
      paymentInterval: PaymentInterval.ONE_TIME,
      paymentProvider: 'internal',
      checkoutInfo: JSON.stringify({
        reason: 'OpenAPI NewAPI Gift',
        triggered_by: 'openapi',
      }),
      createdAt: now,
      productName: `API NewAPI Gift $${amount.toFixed(2)}`,
      description: `API NewAPI Gift $${amount.toFixed(2)}`,
      callbackUrl: `${configs.app_url}/recharge`,
      creditsAmount: 0,
      paymentProductId: 'openapi-newapi-gift',
      // 直接标记为已付，不存在真正支付会话
      paymentResult: JSON.stringify({ type: 'internal_gift', via: 'openapi' }),
      paymentAmount: Math.round(amount * 100),
      paymentCurrency: 'usd',
      paymentEmail: user!.email,
      paidAt: now,
    };

    await createOrder(order);

    const result = await newApiService.recharge({
      email: user!.email,
      amount,
    });

    if (!result.success) {
      return respErr(result.error || 'NewAPI recharge failed');
    }

    return respData({
      orderNo,
      email: user!.email,
      amount,
      balance: result.balanceAfter ?? null,
      rechargeAmount: result.rechargeAmount ?? amount,
    });
  } catch (e: any) {
    console.error('[OpenAPI NewAPI recharge] failed:', e);
    return respErr(e?.message ?? 'recharge failed');
  }
}

