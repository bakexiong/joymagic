import { respData, respErr } from '@/shared/lib/resp';
import { findUserByEmail, updateUser } from '@/shared/models/user';
import {
  verifySignature,
  verifyOpenApiKey,
  forbiddenResponse,
} from '@/shared/lib/api-security';
import { db } from '@/core/db';
import { user, session, account } from '@/config/db/schema';
import { eq } from 'drizzle-orm';

/**
 * OpenAPI 删除账号接口
 *
 * 请求参数：
 * - email: 用户邮箱
 *
 * 安全校验：
 * - OpenAPI API Key 验证
 * - 参数签名验证
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    // 安全校验：API Key 验证
    const { valid: keyValid, error: keyError } = verifyOpenApiKey(req);
    if (!keyValid) {
      return forbiddenResponse(keyError);
    }

    // 安全校验：参数签名验证
    const { valid, error: signError } = verifySignature(req, body);
    if (!valid) {
      return forbiddenResponse(signError);
    }

    if (!email) {
      return respErr('email is required');
    }

    const existingUser = await findUserByEmail(email);
    if (!existingUser) {
      return respErr('user not found');
    }

    // 删除用户相关数据（级联删除会自动处理 session 和 account）
    await db().delete(user).where(eq(user.id, existingUser.id));

    return respData({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (e: any) {
    console.error('openapi delete-account failed:', e);
    return respErr('delete account failed');
  }
}
