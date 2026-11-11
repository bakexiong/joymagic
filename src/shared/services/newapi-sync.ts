import { getNewApiService } from '@/extensions/newapi';
import { getNonceStr, getUuid } from '@/shared/lib/hash';
import {
  ApikeyStatus,
  createApikey,
  getApikeys,
  NewApikey,
} from '@/shared/models/apikey';
import {
  DEFAULT_NEW_USER_GRANT_QUOTA,
  getTopupAmountsConfigFromDB,
} from '@/shared/models/pricing-config';


/**
 * 确保 newapi 侧存在该用户的 apiKey（不存在则同步一次）
 * - 优先通过邮箱查询 token 列表确认是否存在
 * - 若查询失败/用户不存在/无该 token，则用 register 触发一次同步（grant_quota=0）
 */
export async function ensureApiKeySyncedToNewApi(input: {
  user: { id: string; email: string; name?: string | null };
  apiKey: string;
}): Promise<void> {
  const newApiService = getNewApiService();
  if (!newApiService) return;

  const email = input.user.email?.trim();
  const apiKey = input.apiKey?.trim();
  if (!email || !apiKey) return;

  try {
    const balanceResult = await newApiService.getBalance(email);
    if (balanceResult.success) {
      const tokens = balanceResult.tokens || [];
      const existed = tokens.some((t) => t.key === apiKey);
      if (existed) return;
    }
  } catch (e) {
    // ignore and fallback to register
  }

  const config = await getTopupAmountsConfigFromDB();
  const grantQuota =
    typeof config?.newUserGrantQuota === 'number' && config.newUserGrantQuota >= 0
      ? config.newUserGrantQuota
      : DEFAULT_NEW_USER_GRANT_QUOTA;
  // 回退：触发一次 register 同步 token（不赠送额度）
  const result = await newApiService.register({
    email,
    api_key: apiKey,
    grant_quota: grantQuota,
    display_name: input.user.name || email.split('@')[0],
  });

  if (!result.success) {
    console.error(
      `[NewAPI Sync] failed to ensure apiKey for ${email}: ${result.error}`
    );
  }
}

/**
 * 同步用户到 NewAPI 平台
 * 在用户注册后异步调用，不阻塞主注册流程
 */
export async function syncUserToNewApi(user: any): Promise<void> {
  const newApiService = getNewApiService();
  if (!newApiService) {
    return; // NewAPI 未配置，跳过
  }

  if (!user?.id || !user?.email) {
    console.warn('[NewAPI Sync] user id or email is missing, skip sync');
    return;
  }

  // 获取或创建用户的 API Key
  let apiKey: string;
  const existingKeys = await getApikeys({
    userId: user.id,
    status: ApikeyStatus.ACTIVE,
    limit: 1,
  });

  if (existingKeys.length > 0) {
    apiKey = existingKeys[0].key;
  } else {
    // 为新用户自动创建一个 API Key
    const key = `sk-${getNonceStr(48)}`;
    const newApikey: NewApikey = {
      id: getUuid(),
      userId: user.id,
      title: 'Default',
      key,
      status: ApikeyStatus.ACTIVE,
    };
    await createApikey(newApikey);
    apiKey = key;
  }

  const config = await getTopupAmountsConfigFromDB();
  const grantQuota =
    typeof config?.newUserGrantQuota === 'number' && config.newUserGrantQuota >= 0
      ? config.newUserGrantQuota
      : DEFAULT_NEW_USER_GRANT_QUOTA;

  const result = await newApiService.register({
    email: user.email,
    api_key: apiKey,
    grant_quota: grantQuota,
    display_name: user.name || user.email.split('@')[0],
  });

  if (result.success) {
    console.log(
      `[NewAPI Sync] user ${user.email} synced to NewAPI, userId: ${result.userId}`
    );
  } else {
    console.error(
      `[NewAPI Sync] failed to sync user ${user.email}: ${result.error}`
    );
  }
}