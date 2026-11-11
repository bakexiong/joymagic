import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { createOSSProvider } from '../src/extensions/storage/oss';

/**
 * 阿里云 OSS 配置
 */
const ossConfig = {
  region: process.env.OSS_REGION || '',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET || '',
  publicDomain: process.env.OSS_PUBLIC_DOMAIN || '',
};

// 验证配置
if (!ossConfig.region || !ossConfig.accessKeyId || !ossConfig.accessKeySecret || !ossConfig.bucket) {
  console.error('❌ 请在环境变量中设置 OSS 配置：OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET');
  process.exit(1);
}

const ossProvider = createOSSProvider(ossConfig);

// OSS 域名列表（这些域名的图片不需要重新上传）
const OSS_DOMAINS = [
  // 只保留你自己的 OSS 域名
  ossConfig.publicDomain?.replace(/^https?:\/\//, ''),
  'ocdn.10b.ai', // 你的 CDN 域名
].filter(Boolean);

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
 * 检查 URL 是否已经是 OSS 地址
 */
function isOSSUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return OSS_DOMAINS.some(domain => urlObj.hostname === domain);
  } catch {
    return false;
  }
}

/**
 * 下载文件
 */
async function downloadFile(url: string): Promise<Buffer> {
  console.log(`    下载: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageBot/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('下载超时（60秒）');
    }
    throw error;
  }
}

/**
 * 生成缩略图
 */
async function generateThumbnail(buffer: Buffer, type: 'image' | 'video'): Promise<Buffer> {
  if (type === 'video') {
    // 视频暂不生成缩略图
    return buffer;
  }

  try {
    const sharp = require('sharp');

    // 生成 500px 宽度的缩略图
    return await sharp(buffer)
      .resize(500, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.warn('    ⚠️  生成缩略图失败，使用原图:', error);
    return buffer;
  }
}

/**
 * 获取文件的 MIME 类型
 */
function getContentType(url: string, type: 'image' | 'video'): string {
  const ext = path.extname(url).toLowerCase();

  if (type === 'image') {
    const imageTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return imageTypes[ext] || 'image/jpeg';
  } else {
    const videoTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
    };
    return videoTypes[ext] || 'video/mp4';
  }
}

/**
 * 生成 OSS 存储路径
 */
function generateOSSKey(url: string, type: 'image' | 'video', isThumbnail: boolean = false): string {
  const hash = createHash('md5').update(url).digest('hex');
  const ext = path.extname(url) || (type === 'image' ? '.jpg' : '.mp4');
  const folder = type === 'image' ? 'images' : 'videos';
  const subfolder = isThumbnail ? 'thumbnails' : 'original';

  return `explore/${folder}/${subfolder}/${hash}${ext}`;
}

/**
 * 上传文件到 OSS
 */
async function uploadToOSS(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string | null> {
  try {
    const result = await ossProvider.uploadFile({
      body: buffer,
      key,
      contentType,
      disposition: 'inline',
    });

    if (result.success && result.url) {
      return result.url;
    } else {
      console.error(`    ❌ 上传失败: ${result.error}`);
      return null;
    }
  } catch (error) {
    console.error('    ❌ 上传到 OSS 失败:', error);
    return null;
  }
}

/**
 * 处理单个媒体项
 */
async function processMediaItem(item: MediaItem, index: number, total: number): Promise<MediaItem> {
  const { src, type } = item;

  console.log(`\n[${index + 1}/${total}] 处理 ${type}: ${item.id}`);
  console.log(`  原始地址: ${src}`);

  // 检查是否已经是 OSS 地址
  if (isOSSUrl(src)) {
    console.log('  ✅ 已经是 OSS 地址，跳过');
    return item;
  }

  try {
    // 1. 下载原始文件
    const originalBuffer = await downloadFile(src);
    console.log(`  ✅ 下载完成 (${(originalBuffer.length / 1024).toFixed(2)} KB)`);

    // 2. 上传原始文件
    const originalKey = generateOSSKey(src, type, false);
    const contentType = getContentType(src, type);
    console.log(`  ⬆️  上传原始文件...`);
    const originalUrl = await uploadToOSS(originalBuffer, originalKey, contentType);

    if (!originalUrl) {
      console.error('  ❌ 原始文件上传失败，保持原地址');
      return item;
    }

    console.log(`  ✅ 原始文件: ${originalUrl}`);

    // 3. 生成并上传缩略图
    console.log('  🖼️  生成缩略图...');
    const thumbnailBuffer = await generateThumbnail(originalBuffer, type);
    const thumbnailKey = generateOSSKey(src, type, true);
    const thumbnailUrl = await uploadToOSS(thumbnailBuffer, thumbnailKey, contentType);

    if (!thumbnailUrl) {
      console.error('  ❌ 缩略图上传失败');
      return { ...item, src: originalUrl };
    }

    console.log(`  ✅ 缩略图: ${thumbnailUrl}`);
    console.log(`  ✅ 缩略图大小: ${(thumbnailBuffer.length / 1024).toFixed(2)} KB`);

    // 4. 返回更新后的项
    return {
      ...item,
      src: originalUrl,
      thumbnailUrl: thumbnailUrl,
    };
  } catch (error) {
    console.error(`  ❌ 处理失败:`, error);
    return item;
  }
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
    console.log('  tsx scripts/process-explore-images.ts <input-json-file>');
    console.log('\n示例:');
    console.log('  tsx scripts/process-explore-images.ts explore-config.json');
    process.exit(1);
  }

  const inputFile = path.resolve(inputArg);
  const outputFile = inputFile.replace(/\.json$/, '-processed.json');

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  console.log('📦 开始处理 explore-config...\n');
  console.log(`输入文件: ${inputFile}`);
  console.log(`输出文件: ${outputFile}\n`);

  // 读取配置文件
  const configContent = fs.readFileSync(inputFile, 'utf-8');
  const config: ExploreConfig = JSON.parse(configContent);

  let totalItems = 0;
  let processedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // 统计总数
  for (const section of config.sections) {
    totalItems += section.items.length;
  }

  console.log(`📊 总共需要处理 ${totalItems} 个媒体项\n`);

  // 处理每个 section
  for (const section of config.sections) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔖 分类: ${section.sceneName} (${section.items.length} 项)`);
    console.log('='.repeat(80));

    const processedItems: MediaItem[] = [];

    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      const originalSrc = item.src;

      const processed = await processMediaItem(item, processedCount, totalItems);
      processedItems.push(processed);

      if (isOSSUrl(originalSrc)) {
        skippedCount++;
      } else if (processed.src === originalSrc) {
        failedCount++;
      } else {
        processedCount++;
      }

      // 添加延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    section.items = processedItems;
  }

  // 保存结果
  console.log('\n\n' + '='.repeat(80));
  console.log('💾 保存结果...');
  fs.writeFileSync(outputFile, JSON.stringify(config, null, 2), 'utf-8');

  console.log(`\n✅ 完成！结果已保存到: ${outputFile}`);
  console.log('\n📊 处理统计:');
  console.log(`  - 总数: ${totalItems}`);
  console.log(`  - 成功上传: ${processedCount}`);
  console.log(`  - 跳过（已是OSS）: ${skippedCount}`);
  console.log(`  - 失败: ${failedCount}`);
}

// 运行
main().catch(console.error);
