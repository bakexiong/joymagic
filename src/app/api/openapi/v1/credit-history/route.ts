import { respData, respErr } from '@/shared/lib/resp';
import { findUserByEmail } from '@/shared/models/user';
import { getCredits, getCreditsCount } from '@/shared/models/credit';
import {
  verifySignature,
  verifyOpenApiKey,
  forbiddenResponse,
} from '@/shared/lib/api-security';

/**
 * OpenAPI 积分记录接口
 *
 * 请求参数：
 * - email: 用户邮箱
 * - page: 页码（可选，默认 1）
 * - limit: 每页数量（可选，默认 30）
 *
 * 安全校验：
 * - OpenAPI API Key 验证
 * - 参数签名验证
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, page = 1, limit = 30 } = body;

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

    const user = await findUserByEmail(email);
    if (!user) {
      return respErr('user not found');
    }

    // 获取积分记录
    const credits = await getCredits({
      userId: user.id,
      page: Number(page),
      limit: Number(limit),
    });

    // 获取总数
    const total = await getCreditsCount({
      userId: user.id,
    });

    return respData({
      list: credits.map((credit) => ({
        id: credit.id,
        transactionNo: credit.transactionNo,
        transactionType: credit.transactionType,
        transactionScene: credit.transactionScene,
        credits: credit.credits,
        status: credit.status,
        description: credit.description,
        expiresAt: credit.expiresAt,
        createdAt: credit.createdAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (e: any) {
    console.error('openapi credit-history failed:', e);
    return respErr('get credit history failed');
  }
}
