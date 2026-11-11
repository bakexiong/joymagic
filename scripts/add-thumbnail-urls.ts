import * as fs from 'fs';
import * as path from 'path';

interface MediaItem {
  id: string;
  src: string;
  type: 'image' | 'video';
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
 * 生成 OSS 图片处理缩略图 URL
 */
function generateThumbnailUrl(originalUrl: string, type: 'image' | 'video'): string {
  if (type === 'video') {
    // 视频暂不支持缩略图
    return originalUrl;
  }

  // 使用 OSS 图片处理参数生成缩略图
  // 参数说明：
  // - resize,w_400: 宽度调整为 400px
  // - quality,q_80: JPEG 质量 80%
  return `${originalUrl}?x-oss-process=image/resize,w_400/quality,q_80`;
}

/**
 * 处理单个媒体项
 */
function processMediaItem(item: MediaItem): MediaItem {
  const { src, type } = item;

  // 如果已经有 thumbnailUrl，跳过
  if (item.thumbnailUrl) {
    return item;
  }

  // 生成缩略图 URL
  const thumbnailUrl = generateThumbnailUrl(src, type);

  return {
    ...item,
    thumbnailUrl,
  };
}

/**
 * 主函数
 */
async function main() {
  // 从命令行参数获取输入文件路径
  const inputArg = process.argv[2];

  if (!inputArg) {
    console.error('❌ 请提供输入 JSON 文件路径');
    console.log('\n使用方法:');
    console.log('  tsx scripts/add-thumbnail-urls.ts <input-json-file>');
    console.log('\n示例:');
    console.log('  tsx scripts/add-thumbnail-urls.ts explore-config-processed.json');
    process.exit(1);
  }

  const inputFile = path.resolve(inputArg);
  const outputFile = inputFile.replace(/\.json$/, '-with-thumbnails.json');

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  console.log('📦 开始添加缩略图 URL...\n');
  console.log(`输入文件: ${inputFile}`);
  console.log(`输出文件: ${outputFile}\n`);

  // 读取配置文件
  const configContent = fs.readFileSync(inputFile, 'utf-8');
  const config: ExploreConfig = JSON.parse(configContent);

  let totalItems = 0;
  let processedCount = 0;
  let skippedCount = 0;

  // 统计总数
  for (const section of config.sections) {
    totalItems += section.items.length;
  }

  console.log(`📊 总共需要处理 ${totalItems} 个媒体项\n`);

  // 处理每个 section
  for (const section of config.sections) {
    console.log(`🔖 处理分类: ${section.sceneName} (${section.items.length} 项)`);

    const processedItems: MediaItem[] = [];

    for (const item of section.items) {
      const hadThumbnail = !!item.thumbnailUrl;
      const processed = processMediaItem(item);
      processedItems.push(processed);

      if (hadThumbnail) {
        skippedCount++;
      } else {
        processedCount++;
        console.log(`  ✅ ${item.id}: 添加缩略图 URL`);
      }
    }

    section.items = processedItems;
  }

  // 保存结果
  console.log('\n💾 保存结果...');
  fs.writeFileSync(outputFile, JSON.stringify(config, null, 2), 'utf-8');

  console.log(`\n✅ 完成！结果已保存到: ${outputFile}`);
  console.log('\n📊 处理统计:');
  console.log(`  - 总数: ${totalItems}`);
  console.log(`  - 添加缩略图: ${processedCount}`);
  console.log(`  - 跳过（已有缩略图）: ${skippedCount}`);
  console.log('\n💡 缩略图 URL 格式:');
  console.log('  原图: https://cdn.example.com/image.jpg');
  console.log('  缩略图: https://cdn.example.com/image.jpg?x-oss-process=image/resize,w_400/quality,q_80');
  console.log('\n🎯 优势:');
  console.log('  - 无需上传额外文件');
  console.log('  - OSS 自动生成和缓存');
  console.log('  - 节省存储空间');
  console.log('  - 按需生成，灵活调整参数');
}

// 运行
main().catch(console.error);
