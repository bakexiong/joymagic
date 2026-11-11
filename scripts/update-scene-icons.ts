/**
 * 更新场景图标 URL，添加 OSS 缩略图参数
 *
 * 使用方法:
 * pnpm tsx scripts/update-scene-icons.ts
 */

import fs from 'fs';
import path from 'path';

// 场景图标映射表
const sceneIconMap: Record<string, string> = {
  // 图片 AI 场景
  'text-to-image': 'https://ocdn.10b.ai/icon/text_to_image.png',
  'image-to-image': 'https://ocdn.10b.ai/icon/image_to_image.png',
  'qwen-image-layered': 'https://ocdn.10b.ai/icon/qwen_image_layered.png',
  'image-eraser': 'https://ocdn.10b.ai/icon/%20image_eraser.png',
  'image-background-remover': 'https://ocdn.10b.ai/icon/background_remove.png',
  'image-upscaler': 'https://ocdn.10b.ai/icon/image_upscaler.png',

  // 视频 AI 场景
  'video-face-swap': 'https://ocdn.10b.ai/icon/video_face_swap.png',
  'text-to-video': 'https://ocdn.10b.ai/icon/text_to_video.png',
  'image-to-video': 'https://ocdn.10b.ai/icon/image_video.png',
  'motion-control': 'https://ocdn.10b.ai/icon/motion_control.png',
  'longcat-avatar': 'https://ocdn.10b.ai/icon/longcat_avatar.png',
};

/**
 * 为 OSS URL 添加缩略图参数
 * @param url 原始 URL
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @returns 带缩略图参数的 URL
 */
function addOssThumbnailParams(url: string, width: number = 64, height: number = 64): string {
  if (!url.includes('oss-ap-southeast-1.aliyuncs.com')) {
    return url;
  }

  // 添加 OSS 图片处理参数
  return `${url}?x-oss-process=image/resize,m_fill,w_${width},h_${height}`;
}

/**
 * 根据 URL 路径匹配场景类型
 */
function getSceneTypeFromUrl(url: string): string | null {
  if (!url) return null;

  // 匹配 /text-to-image/xxx, /image-to-image/xxx 等
  const match = url.match(/\/(text-to-image|image-to-image|image-upscaler|image-background-remover|image-eraser|qwen-image-layered|video-face-swap|text-to-video|image-to-video|motion-control|longcat-avatar)/);
  return match ? match[1] : null;
}

/**
 * 递归更新导航项的图标 URL
 */
function updateNavItemIcons(items: any[]): any[] {
  return items.map(item => {
    const updated = { ...item };

    // 如果有 URL，尝试匹配场景类型
    if (updated.url) {
      const sceneType = getSceneTypeFromUrl(updated.url);
      if (sceneType && sceneIconMap[sceneType]) {
        const iconUrl = sceneIconMap[sceneType];
        updated.icon_url = addOssThumbnailParams(iconUrl);
        console.log(`✓ 更新场景图标: ${updated.title || updated.name} -> ${sceneType}`);
      }
    }

    // 递归处理子项
    if (updated.children && Array.isArray(updated.children)) {
      updated.children = updateNavItemIcons(updated.children);
    }

    return updated;
  });
}

/**
 * 更新 landing.json 文件
 */
function updateLandingJson(filePath: string) {
  console.log(`\n处理文件: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // 更新 header.nav.items
    if (data.header?.nav?.items) {
      data.header.nav.items = updateNavItemIcons(data.header.nav.items);
    }

    // 写回文件
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✓ 文件已更新: ${filePath}`);
  } catch (error) {
    console.error(`✗ 处理文件失败: ${filePath}`, error);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('开始更新场景图标...\n');

  const localeDir = path.join(process.cwd(), 'src/config/locale/messages');
  const locales = fs.readdirSync(localeDir).filter(dir => {
    const stat = fs.statSync(path.join(localeDir, dir));
    return stat.isDirectory();
  });

  console.log(`找到 ${locales.length} 个语言目录: ${locales.join(', ')}\n`);

  for (const locale of locales) {
    const landingJsonPath = path.join(localeDir, locale, 'landing.json');
    if (fs.existsSync(landingJsonPath)) {
      updateLandingJson(landingJsonPath);
    }
  }

  console.log('\n✓ 所有文件处理完成！');
  console.log('\n图标 URL 示例:');
  Object.entries(sceneIconMap).slice(0, 3).forEach(([scene, url]) => {
    console.log(`  ${scene}: ${addOssThumbnailParams(url)}`);
  });
}

main();
