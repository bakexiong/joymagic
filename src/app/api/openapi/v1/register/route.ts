import { respData, respErr } from "@/shared/lib/resp";
import { findUserByEmailIdentity, normalizeEmail } from "@/shared/models/user";
import { db } from "@/core/db";
import { user as userTable, account as accountTable } from "@/config/db/schema";
import { getUuid, getNonceStr } from "@/shared/lib/hash";
import {
  ApikeyStatus,
  createApikey,
  NewApikey,
  getApikeys,
} from "@/shared/models/apikey";
import { grantCreditsForNewUser } from "@/shared/models/credit";
import { syncUserToNewApi } from "@/shared/services/newapi-sync";
import {
  verifySignature,
  verifyOpenApiKey,
  forbiddenResponse,
} from "@/shared/lib/api-security";

// 简单的密码哈希（与 better-auth 的 credential 兼容）
async function hashPassword(password: string): Promise<string> {
  const { createHash } = await import("crypto");
  // better-auth 使用 bcrypt，这里用简单哈希作为 OpenAPI 注册
  // 实际生产中应使用 bcrypt
  const hash = createHash("sha256").update(password).digest("hex");
  return hash;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, source } = body;
    const normalizedEmail = normalizeEmail(String(email || ""));

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

    // 参数校验
    if (!normalizedEmail || !password) {
      return respErr("email and password are required");
    }

    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return respErr("invalid email format");
    }

    if (password.length < 6) {
      return respErr("password must be at least 6 characters");
    }

    // 检查邮箱是否已注册，已注册则直接返回用户信息和已有/新建的 API Key
    const existingUser = await findUserByEmailIdentity(normalizedEmail);
    if (existingUser) {
      const [existingApikey] = await getApikeys({
        userId: existingUser.id,
        status: ApikeyStatus.ACTIVE,
        page: 1,
        limit: 1,
      });

      let apiKeyValue = existingApikey?.key;

      // 没有激活的 API Key 时，为旧用户补发一个
      if (!apiKeyValue) {
        apiKeyValue = `sk-${getNonceStr(48)}`;
        const newApikey: NewApikey = {
          id: getUuid(),
          userId: existingUser.id,
          title: "Default",
          key: apiKeyValue,
          status: ApikeyStatus.ACTIVE,
        };
        await createApikey(newApikey);
      }

      return respData({
        apiKey: apiKeyValue,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        },
        source: existingUser.source || source || "openapi",
      });
    }

    // 创建用户
    const userId = getUuid();
    const accountId = getUuid();
    const hashedPassword = await hashPassword(password);

    const [newUser] = await db()
      .insert(userTable)
      .values({
        id: userId,
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        emailVerified: true, // OpenAPI 注册默认已验证
        source: source || "openapi", // 保存注册来源
      })
      .returning();

    // 创建 credential account
    await db().insert(accountTable).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });

    // 为用户创建 API Key
    const apiKeyValue = `sk-${getNonceStr(48)}`;
    const newApikey: NewApikey = {
      id: getUuid(),
      userId,
      title: "Default",
      key: apiKeyValue,
      status: ApikeyStatus.ACTIVE,
    };
    await createApikey(newApikey);

    // 授予初始积分
    try {
      await grantCreditsForNewUser(newUser);
    } catch (e) {
      console.error("[OpenAPI Register] grant credits failed:", e);
    }

    // 同步到 NewAPI 平台
    try {
      await syncUserToNewApi(newUser);
    } catch (e) {
      console.error("[OpenAPI Register] sync to NewAPI failed:", e);
    }

    return respData({
      apiKey: apiKeyValue,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      source: source || "openapi",
    });
  } catch (e: any) {
    console.error("openapi register failed:", e);
    return respErr("register failed");
  }
}
