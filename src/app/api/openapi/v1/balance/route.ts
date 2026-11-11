import { respData } from '@/shared/lib/resp';
import { authenticateApiKey } from '@/shared/lib/api-auth';
import { verifyOpenApiKey, forbiddenResponse } from '@/shared/lib/api-security';
import { getNewApiService } from '@/extensions/newapi';

/**
 * OpenAPI 余额查询接口
 * 
 * 注意：此接口不需要登录校验（middleware 已排除所有 /api 路由）
 * 仅通过 OpenAPI API Key 和用户 API Key 进行安全校验
 */
export async function GET(req: Request) {
  // 安全校验：OpenAPI API Key 验证
  // 优先从 X-OpenAPI-Key 读取，如果没有则从 Authorization 读取（向后兼容）
  const { valid: keyValid, error: keyError } = verifyOpenApiKey(req);
  if (!keyValid) {
    return forbiddenResponse(keyError);
  }

  // 用户 API Key 认证
  // 如果提供了 X-OpenAPI-Key，则从 Authorization 读取用户 API Key
  // 如果没有提供 X-OpenAPI-Key，则 Authorization 已被用于 OpenAPI API Key 验证，需要单独处理
  const openApiKeyHeader = req.headers.get('X-OpenAPI-Key');
  if (!openApiKeyHeader) {
    // 如果没有 X-OpenAPI-Key，说明 Authorization 已被用于 OpenAPI API Key 验证
    // 这种情况下无法同时验证用户 API Key，返回错误
    return forbiddenResponse('X-OpenAPI-Key header is required for balance query');
  }

  // API Key 认证（从 Authorization 读取用户 API Key）
  const { user, error } = await authenticateApiKey(req);
  if (error) return error;

  const newApiService = getNewApiService();
  if (!newApiService) {
    return respData({ balance: null, available: false });
  }

  try {
    const result = await newApiService.getBalance(user!.email);
    console.log('result', result);
    if (result.success) {
      return respData({
        balance: result.balance,
        usedBalance: result.usedBalance,
        totalBalance: result.totalBalance,
        currency: 'USD',
        available: true,
      });
    }

    return respData({
      balance: null,
      available: false,
      error: 'NewAPI balance query unavailable',
    });
  } catch (e) {
    console.error('get newapi balance failed:', e);
    return respData({
      balance: null,
      available: false,
      error: 'NewAPI balance query unavailable',
    });
  }
}
