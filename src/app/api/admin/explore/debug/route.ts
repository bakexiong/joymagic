import { getConfigsDirectly } from '@/shared/models/config';
import { getUserInfo } from '@/shared/models/user';
import { respData, respErr } from '@/shared/lib/resp';

export async function GET() {
  try {
    // 验证用户权限
    const user = await getUserInfo();
    if (!user) {
      return Response.json({ code: -1, message: 'Unauthorized' }, { status: 401 });
    }

    // 直接从数据库读取配置
    const configs = await getConfigsDirectly();
    const exploreConfig = configs['explore_page_config'];

    console.log('[API] Current explore_page_config in database:');
    console.log('- Exists:', !!exploreConfig);
    console.log('- Length:', exploreConfig?.length || 0);
    console.log('- First 200 chars:', exploreConfig?.substring(0, 200));

    return respData({
      exists: !!exploreConfig,
      length: exploreConfig?.length || 0,
      preview: exploreConfig?.substring(0, 500),
      full: exploreConfig
    });
  } catch (error: any) {
    console.error('[API] Failed to get explore config:', error);
    return respErr(error?.message || 'Failed to get explore config');
  }
}
