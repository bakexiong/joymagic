import { findApikeyByKey } from '@/shared/models/apikey';
import { findUserById } from '@/shared/models/user';
import { respErr } from '@/shared/lib/resp';

/**
 * 从请求中提取 API Key（Bearer Token）
 */
function extractApiKey(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return authHeader.trim();
}

/**
 * API Key 认证中间件
 * 验证 Bearer Token，返回关联的用户信息
 */
export async function authenticateApiKey(req: Request) {
  const key = extractApiKey(req);
  if (!key) {
    return { user: null, error: respErr('API Key is required') };
  }

  const apikey = await findApikeyByKey(key);
  if (!apikey) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({
          code: -1,
          message: 'Invalid or deleted API Key',
          success: false,
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const user = await findUserById(apikey.userId);
  if (!user) {
    return { user: null, error: respErr('User not found') };
  }

  return { user, error: null };
}
