import { respData, respErr } from '@/shared/lib/resp';
import { findUserByEmail } from '@/shared/models/user';
import { ApikeyStatus, getApikeys } from '@/shared/models/apikey';
import {
  verifySignature,
  verifyOpenApiKey,
  forbiddenResponse,
} from '@/shared/lib/api-security';

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

    const user = await findUserByEmail(email);
    if (!user) {
      return respErr('user not found');
    }

    // 查询用户的活跃 API Key
    const keys = await getApikeys({
      userId: user.id,
      status: ApikeyStatus.ACTIVE,
      limit: 1,
    });

    const apiKey = keys.length > 0 ? keys[0].key : null;

    return respData({
      apiKey,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (e: any) {
    console.error('openapi get-user failed:', e);
    return respErr('get user failed');
  }
}
