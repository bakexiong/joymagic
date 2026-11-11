import * as fs from 'fs';
import * as path from 'path';

/**
 * 将所有视频的 MP4 缩略图替换为 WebP 动图
 */

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumbnailUrl?: string;
  [key: string]: any;
}

interface Section {
  id: string;
  sceneName: string;
  items: MediaItem[];
  [key: string]: any;
}

interface ExploreConfig {
  title: string;
  sections: Section[];
  [key: string]: any;
}

/**
 * 生成视频缩略图 URL
 */
function generateVideoThumbnailUrl(videoUrl: string, type: 'webp' | 'gif' | 'image' = 'webp'): string {
  // 检查是否是 OSS URL
  if (!videoUrl.includes('aliyuncs.com') && !videoUrl.includes('oss-')) {
    console.warn(`⚠️  非 OSS URL，跳过: ${videoUrl}`);
    return videoUrl;
  }

  // 移除已有的处理参数
  const baseUrl = videoUrl.split('?')[0];

  if (type === 'image') {
    // 静态截图
    const params = [
      'video/snapshot',
      't_1000',
      'f_jpg',
      'w_400',
      'h_0',
      'm_fast',
      'q_80',
    ].join(',');

    return `${baseUrl}?x-oss-process=${params}`;
  } else if (type === 'gif') {
    // GIF 动图
    const params = [
      'video/convert',
      'f_gif',
      'w_400',
      'h_0',
      'ss_0',
      't_3',
      'q_80',
    ].join(',');

    return `${baseUrl}?x-oss-process=${params}`;
  } else {
    // WebP 动图（推荐）
    const params = [
      'video/convert',
      'f_webp',
      'w_400',
      'h_0',
      'ss_0',
      't_3',
      'q_80',
    ].join(',');

    return `${baseUrl}?x-oss-process=${params}`;
  }
}

/**
 * 处理配置文件
 */
function processConfig(config: ExploreConfig, thumbnailType: 'webp' | 'gif' | 'image' = 'webp', forceUpdate: boolean = false): ExploreConfig {
  let videoCount = 0;
  let processedCount = 0;
  let skippedCount = 0;

  for (const section of config.sections) {
    for (const item of section.items) {
      if (item.type === 'video') {
        videoCount++;

        // 检查是否需要更新
        const needsUpdate = forceUpdate ||
                           !item.thumbnailUrl ||
                           item.thumbnailUrl.endsWith('.mp4') ||
                           !item.thumbnailUrl.includes('x-oss-process');

        if (!needsUpdate) {
          console.log(`  ⏭️  已是动图缩略图，跳过: ${item.id}`);
          skippedCount++;
          continue;
        }

        // 生成缩略图 URL
        const thumbnailUrl = generateVideoThumbnailUrl(item.src, thumbnailType);

        if (thumbnailUrl !== item.src) {
          item.thumbnailUrl = thumbnailUrl;
          processedCount++;
          console.log(`  ✅ 更新为 ${thumbnailType.toUpperCase()} 动图: ${item.id}`);
        }
      }
    }
  }

  console.log(`\n📊 处理统计:`);
  console.log(`  - 视频总数: ${videoCount}`);
  console.log(`  - 已更新: ${processedCount}`);
  console.log(`  - 已跳过: ${skippedCount}`);

  return config;
}

/**
 * 主函数
 */
async function main() {
  const inputFile = path.join(__dirname, '../explore-config-processed.json');
  const outputFile = path.join(__dirname, '../explore-config-processed.json');
  const backupFile = path.join(__dirname, '../explore-config-processed.json.webp-backup');

  console.log('🎬 将视频缩略图更新为动图...\n');
  console.log(`输入文件: ${inputFile}`);
  console.log(`输出文件: ${outputFile}`);
  console.log(`备份文件: ${backupFile}\n`);

  // 读取配置文件
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  const configContent = fs.readFileSync(inputFile, 'utf-8');
  const config: ExploreConfig = JSON.parse(configContent);

  // 备份原文件
  console.log('💾 备份原文件...');
  fs.writeFileSync(backupFile, configContent, 'utf-8');
  console.log(`✅ 备份完成: ${backupFile}\n`);

  // 处理配置
  console.log('🔄 更新视频缩略图为动图...\n');

  // 可以选择缩略图类型：'webp' | 'gif' | 'image'
  const thumbnailType = (process.env.THUMBNAIL_TYPE as 'webp' | 'gif' | 'image') || 'webp';
  const forceUpdate = process.env.FORCE_UPDATE === 'true';

  console.log(`📸 缩略图类型: ${thumbnailType}`);
  console.log(`🔄 强制更新: ${forceUpdate ? '是' : '否'}\n`);

  const processedConfig = processConfig(config, thumbnailType, forceUpdate);

  // 保存结果
  console.log('\n💾 保存结果...');
  fs.writeFileSync(outputFile, JSON.stringify(processedConfig, null, 2), 'utf-8');

  console.log(`\n✅ 完成！配置已更新: ${outputFile}`);
  console.log(`\n💡 提示:`);
  console.log(`  1. 原文件已备份到: ${backupFile}`);
  console.log(`  2. 所有视频现在使用 ${thumbnailType.toUpperCase()} 动图作为缩略图`);
  console.log(`  3. 如需使用其他格式:`);
  console.log(`     THUMBNAIL_TYPE=gif pnpm tsx scripts/update-video-thumbnails-to-animated.ts`);
  console.log(`  4. 支持的格式: webp (推荐), gif, image`);
  console.log(`  5. 启动开发服务器测试: pnpm dev`);
}

// 运行
main().catch(console.error);
