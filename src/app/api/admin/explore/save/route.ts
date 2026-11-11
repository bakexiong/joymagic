import { NextResponse } from 'next/server';
import { getConfigs, saveConfigs, getConfigsDirectly } from '@/shared/models/config';
import { getUserInfo } from '@/shared/models/user';
import { respData, respErr } from '@/shared/lib/resp';

export async function POST(req: Request) {
  try {
    // 验证用户权限
    const user = await getUserInfo();
    if (!user) {
      return Response.json({ code: -1, message: 'Unauthorized' }, { status: 401 });
    }

    // 解析请求体
    const body = await req.json();
    const { title, subtitle, sections } = body;

    console.log('[API] Saving explore config:', {
      title,
      subtitle,
      sectionsCount: sections?.length
    });

    // 验证数据
    if (!title || !sections || !Array.isArray(sections)) {
      return respErr('Invalid data: title and sections are required');
    }

    // 获取当前配置
    const configs = await getConfigs();

    // 更新 explore 配置
    const exploreConfig = {
      title: title.trim(),
      subtitle: subtitle?.trim() || '',
      sections,
    };

    const exploreConfigStr = JSON.stringify(exploreConfig, null, 2);
    console.log('[API] Explore config string length:', exploreConfigStr.length);

    const nextConfigs = {
      ...configs,
      explore_page_config: exploreConfigStr,
    };

    // 保存配置
    await saveConfigs(nextConfigs);
    console.log('[API] Config saved to database');

    // 验证保存是否成功（直接从数据库读取）
    const savedConfigs = await getConfigsDirectly();
    const savedExploreConfig = savedConfigs['explore_page_config'];

    if (savedExploreConfig) {
      console.log('[API] Verified: Config saved successfully, length:', savedExploreConfig.length);
    } else {
      console.warn('[API] Warning: Config not found after save');
    }

    return respData({
      success: true,
      message: 'Explore config saved successfully',
      saved: !!savedExploreConfig
    });
  } catch (error: any) {
    console.error('[API] Failed to save explore config:', error);
    return respErr(error?.message || 'Failed to save explore config');
  }
}
