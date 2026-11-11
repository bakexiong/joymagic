import { PERMISSIONS } from '@/core/rbac';
import { getCountryCodeFromRequest } from '@/shared/lib/geo-server';
import { hasServerNsfwAccessGrant } from '@/shared/lib/nsfw-access';
import { respData, respErr } from '@/shared/lib/resp';
import { getRemainingCredits } from '@/shared/models/credit';
import {
  getUserInfo,
  findUserById,
  grantUserNsfwWhitelist,
  updateUser,
} from '@/shared/models/user';
import { getUserPreference } from '@/shared/models/user-preference';
import { hasPermission } from '@/shared/services/rbac';

export async function POST(req: Request) {
  try {
    // get sign user info
    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    // 不再自动“赠送/发放”免费次数；直接读取用户当前 freeImageGenerations
    let updatedUser = await findUserById(user.id);

    if (
      updatedUser &&
      !updatedUser.nsfwWhitelisted &&
      (await hasServerNsfwAccessGrant())
    ) {
      updatedUser = await grantUserNsfwWhitelist(user.id);
    }

    // check if user is admin
    const isAdmin = await hasPermission(user.id, PERMISSIONS.ADMIN_ACCESS);

    // get remaining credits
    const remainingCredits = await getRemainingCredits(user.id);

    // update country if missing
    if (!updatedUser?.country) {
      const country = await getCountryCodeFromRequest(req.headers);
      if (country) {
        updatedUser = await updateUser(updatedUser.id, { country });
      }
    }

    // 只有用户真正保存过 pinned_tools 配置时，才返回该字段。
    // 未配置时保持 undefined，让前端回退到默认固定工具。
    let pinnedTools: string[] | undefined;
    const pinnedToolsStr = await getUserPreference(user.id, 'pinned_tools');
    if (pinnedToolsStr) {
      try {
        pinnedTools = JSON.parse(pinnedToolsStr);
      } catch (e) {
        console.error('Failed to parse pinnedTools:', e);
      }
    }

    return respData({
      ...updatedUser,
      isAdmin,
      credits: { remainingCredits },
      freeImageGenerations: updatedUser?.freeImageGenerations ?? 0,
      pinnedTools,
    });
  } catch (e) {
    console.log('get user info failed:', e);
    return respErr('get user info failed');
  }
}
