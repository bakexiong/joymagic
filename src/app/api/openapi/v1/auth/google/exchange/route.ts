import { respData, respErr } from "@/shared/lib/resp";
import { findUserByEmailIdentity, normalizeEmail } from "@/shared/models/user";
import { getAllConfigs } from "@/shared/models/config";
import { db } from "@/core/db";
import { user as userTable, account as accountTable } from "@/config/db/schema";
import { getUuid, getNonceStr } from "@/shared/lib/hash";
import {
  ApikeyStatus,
  createApikey,
  getApikeys,
  NewApikey,
} from "@/shared/models/apikey";
import { grantCreditsForNewUser } from "@/shared/models/credit";
import {
  ensureApiKeySyncedToNewApi,
  syncUserToNewApi,
} from "@/shared/services/newapi-sync";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_CLIENT_ID =
  "570930458813-g1uinovef2t0ollqsspam8j2v8c1psm1.apps.googleusercontent.com";

/**
 * POST /api/openapi/v1/auth/google/exchange
 *
 * 接收客户端的 Google authorization code，在服务端完成：
 * 1. 用 client_secret 向 Google 换取 access_token
 * 2. 用 access_token 获取用户信息
 * 3. 注册或查询用户，返回 apiKey
 *
 * Body: { code, codeVerifier, redirectUri }
 * Response: { accessToken, refreshToken, expiresAt, user, apiKey }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, codeVerifier, redirectUri } = body;

    if (!code || !codeVerifier || !redirectUri) {
      return respErr("code, codeVerifier and redirectUri are required");
    }

    const configs = await getAllConfigs();
    const clientSecret =
      configs.google_client_secret || process.env.GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      console.error("[Google Exchange] GOOGLE_CLIENT_SECRET not configured");
      return respErr("server configuration error");
    }

    // 1. 用 code 向 Google 换取 token
    const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: clientSecret,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      const message =
        tokenData.error_description ||
        tokenData.error ||
        "Google token exchange failed";
      return respErr(message);
    }

    const accessToken: string = tokenData.access_token;
    const refreshToken: string | null = tokenData.refresh_token ?? null;
    const expiresIn: number = tokenData.expires_in ?? 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // 2. 用 access_token 获取 Google 用户信息
    const userInfoRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo = await userInfoRes.json();

    if (userInfo.error) {
      return respErr("failed to fetch Google user info");
    }

    const rawEmail: string | undefined = userInfo.email;
    const name: string = userInfo.name || "Google User";
    const picture: string | undefined = userInfo.picture;
    const email = rawEmail ? normalizeEmail(rawEmail) : undefined;

    if (!email) {
      return respErr("Google account has no email");
    }

    // 3. 注册或查询用户
    let apiKey: string | null = null;
    const existingUser = await findUserByEmailIdentity(email);

    if (existingUser) {
      // 已注册，查询 apiKey
      const keys = await getApikeys({
        userId: existingUser.id,
        status: ApikeyStatus.ACTIVE,
        limit: 1,
      });
      if (keys.length > 0) {
        apiKey = keys[0].key;
      } else {
        // 没有 active 的 API Key，自动创建一个
        const apiKeyValue = `sk-${getNonceStr(48)}`;
        const newApikey: NewApikey = {
          id: getUuid(),
          userId: existingUser.id,
          title: "Default",
          key: apiKeyValue,
          status: ApikeyStatus.ACTIVE,
        };
        await createApikey(newApikey);
        apiKey = apiKeyValue;
      }

      // 确保 newapi 侧存在该 apiKey（不阻塞）
      if (apiKey) {
        try {
          await ensureApiKeySyncedToNewApi({
            user: existingUser,
            apiKey,
          });
        } catch (e) {
          console.error("[Google Exchange] ensure apiKey to NewAPI failed:", e);
        }
      }
    } else {
      // 新用户注册
      const userId = getUuid();
      const accountId = getUuid();

      const [newUser] = await db()
        .insert(userTable)
        .values({
          id: userId,
          name,
          email,
          emailVerified: true,
          source: "app",
        })
        .returning();

      // 创建 Google OAuth account 记录
      await db().insert(accountTable).values({
        id: accountId,
        accountId: userId,
        providerId: "google",
        userId,
        accessToken,
        refreshToken,
      });

      // 创建 API Key
      const apiKeyValue = `sk-${getNonceStr(48)}`;
      const newApikey: NewApikey = {
        id: getUuid(),
        userId,
        title: "Default",
        key: apiKeyValue,
        status: ApikeyStatus.ACTIVE,
      };
      await createApikey(newApikey);
      apiKey = apiKeyValue;

      // 授予初始积分（不阻塞）
      try {
        await grantCreditsForNewUser(newUser);
      } catch (e) {
        console.error("[Google Exchange] grant credits failed:", e);
      }

      // 同步到 NewAPI 平台（不阻塞）
      try {
        await syncUserToNewApi(newUser);
      } catch (e) {
        console.error("[Google Exchange] sync to NewAPI failed:", e);
      }
    }

    return respData({
      accessToken,
      refreshToken,
      expiresAt,
      user: { name, email, picture },
      apiKey,
    });
  } catch (e: any) {
    console.error("[Google Exchange] failed:", e);
    return respErr("google auth exchange failed");
  }
}
