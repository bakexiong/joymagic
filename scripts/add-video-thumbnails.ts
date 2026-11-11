import * as fs from 'fs';
import * as path from 'path';

/**
 * 为视频添加缩略图 URL
 * 使用阿里云 OSS 视频处理功能
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
      't_1000',      // 截取第 1 秒
      'f_jpg',       // JPG 格式
      'w_400',       // 宽度 400px
      'h_0',         // 高度自适应
      'm_fast',      // 快速模式
      'q_80',        // 质量 80%
    ].join(',');

    return `${baseUrl}?x-oss-process=${params}`;
  } else if (type === 'gif') {
    // GIF 动图
    const params = [
      'video/convert',
      'f_gif',       // GIF 格式
      'w_400',       // 宽度 400px
      'h_0',         // 高度自适应
      'ss_0',        // 从第 0 秒开始
      't_3',         // 持续 3 秒
      'q_80',        // 质量 80%
    ].join(',');

    return `${baseUrl}?x-oss-process=${params}`;
  } else {
    // WebP 动图（推荐）
    const params = [
      'video/convert',
      'f_webp',      // WebP 格式
      'w_400',       // 宽度 400px
      'h_0',         // 高度自适应
      'ss_0',        // 从第 0 秒开始
      't_3',         // 持续 3 秒
      'q_80',        // 质量 80%
    ].join(',');

    return `${baseUrl}?x-oss-process=${params}`;
  }
}

/**
 * 处理配置文件
 */
function processConfig(config: ExploreConfig, thumbnailType: 'webp' | 'gif' | 'image' = 'webp'): ExploreConfig {
  let videoCount = 0;
  let processedCount = 0;

  for (const section of config.sections) {
    for (const item of section.items) {
      if (item.type === 'video') {
        videoCount++;

        // 如果已有 thumbnailUrl，跳过
        if (item.thumbnailUrl) {
          console.log(`  ⏭️  已有缩略图，跳过: ${item.id}`);
          continue;
        }

        // 生成缩略图 URL
        const thumbnailUrl = generateVideoThumbnailUrl(item.src, thumbnailType);

        if (thumbnailUrl !== item.src) {
          item.thumbnailUrl = thumbnailUrl;
          processedCount++;
          console.log(`  ✅ 生成缩略图: ${item.id}`);
        }
      }
    }
  }

  console.log(`\n📊 处理统计:`);
  console.log(`  - 视频总数: ${videoCount}`);
  console.log(`  - 已处理: ${processedCount}`);
  console.log(`  - 已跳过: ${videoCount - processedCount}`);

  return config;
}

/**
 * 主函数
 */
async function main() {
  const inputFile = path.join(__dirname, '../explore-config-processed.json');
  const outputFile = path.join(__dirname, '../explore-config-processed.json');
  const backupFile = path.join(__dirname, '../explore-config-processed.json.video-backup');

  console.log('🎬 开始处理视频缩略图...\n');
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
  console.log('🔄 处理视频缩略图...\n');

  // 可以选择缩略图类型：'webp' | 'gif' | 'image'
  const thumbnailType = (process.env.THUMBNAIL_TYPE as 'webp' | 'gif' | 'image') || 'webp';
  console.log(`📸 缩略图类型: ${thumbnailType}\n`);

  const processedConfig = processConfig(config, thumbnailType);

  // 保存结果
  console.log('\n💾 保存结果...');
  fs.writeFileSync(outputFile, JSON.stringify(processedConfig, null, 2), 'utf-8');

  console.log(`\n✅ 完成！配置已更新: ${outputFile}`);
  console.log(`\n💡 提示:`);
  console.log(`  1. 原文件已备份到: ${backupFile}`);
  console.log(`  2. 如需使用其他格式，设置环境变量:`);
  console.log(`     THUMBNAIL_TYPE=gif pnpm tsx scripts/add-video-thumbnails.ts`);
  console.log(`  3. 支持的格式: webp (推荐), gif, image`);
  console.log(`  4. 启动开发服务器测试: pnpm dev`);
}

// 运行
main().catch(console.error);
