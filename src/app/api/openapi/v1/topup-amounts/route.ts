import { respData } from '@/shared/lib/resp';
import { verifyOpenApiKey, forbiddenResponse } from '@/shared/lib/api-security';
import { getTopupAmountsConfigFromDB } from '@/shared/models/pricing-config';

/**
 * GET /api/openapi/v1/topup-amounts
 * 获取可用充值档位列表（供桌面端使用）
 * 仅需 OpenAPI Key 验证，不需要用户认证
 */
export async function GET(req: Request) {
  const { valid, error } = verifyOpenApiKey(req);
  if (!valid) {
    return forbiddenResponse(error);
  }

  try {
    const config = await getTopupAmountsConfigFromDB();

    if (!config) {
      const defaultAmounts = [
        { name: '$5', productId: '', amount: 5, enabled: true, order: 1 },
        { name: '$10', productId: '', amount: 10, enabled: true, order: 2 },
        { name: '$20', productId: '', amount: 20, enabled: true, order: 3 },
        { name: '$50', productId: '', amount: 50, enabled: true, order: 4 },
        { name: '$100', productId: '', amount: 100, enabled: true, order: 5 },
      ];
      return respData({ amounts: defaultAmounts });
    }

    const enabledAmounts = config.amounts
      .filter((item) => item.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return respData({ amounts: enabledAmounts });
  } catch (e: any) {
    console.error('[OpenAPI topup-amounts] failed:', e);
    return respData({ amounts: [] });
  }
}
