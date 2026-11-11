import { respData, respErr } from '@/shared/lib/resp';
import { findUserByEmail, updateUser } from '@/shared/models/user';
import {
  verifySignature,
  verifyOpenApiKey,
  forbiddenResponse,
} from '@/shared/lib/api-security';

/**
 * OpenAPI 个人信息保存接口
 *
 * 请求参数：
 * - email: 用户邮箱（必填，用于查找用户）
 * - name: 用户名（可选）
 * - image: 头像 URL（可选）
 * - country: 国家代码（可选）
 *
 * 安全校验：
 * - OpenAPI API Key 验证
 * - 参数签名验证
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, image, country } = body;

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

    // 构建更新数据（只更新提供的字段）
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (country !== undefined) updateData.country = country;

    // 如果没有任何字段需要更新
    if (Object.keys(updateData).length === 0) {
      return respErr('no fields to update');
    }

    // 更新用户信息
    const updatedUser = await updateUser(user.id, updateData);

    return respData({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        country: updatedUser.country,
      },
    });
  } catch (e: any) {
    console.error('openapi update-profile failed:', e);
    return respErr('update profile failed');
  }
}
