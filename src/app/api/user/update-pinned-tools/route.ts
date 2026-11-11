import { respData, respErr } from '@/shared/lib/resp';
import { getUserInfo } from '@/shared/models/user';
import { setUserPreference } from '@/shared/models/user-preference';

export async function POST(req: Request) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    const body = await req.json();
    const { pinnedTools } = body;

    if (!Array.isArray(pinnedTools)) {
      return respErr('pinnedTools must be an array');
    }

    // 将数组转换为 JSON 字符串存储到 user_preference 表
    await setUserPreference(user.id, 'pinned_tools', JSON.stringify(pinnedTools));

    return respData({ success: true });
  } catch (e) {
    console.log('update pinned tools failed:', e);
    return respErr('update pinned tools failed');
  }
}
