import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { createHash } from 'crypto';
import { createOSSProvider } from '../src/extensions/storage/oss';

/**
 * 阿里云 OSS 配置
 * 请在环境变量中设置以下值：
 * OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET, OSS_PUBLIC_DOMAIN
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

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumbnailUrl?: string;
  original_image_url?: string;
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
 * 下载文件
 */
async function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        if (response.headers.location) {
          downloadFile(response.headers.location).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * 生成缩略图（使用 sharp 库）
 */
async function generateThumbnail(buffer: Buffer, type: 'image' | 'video'): Promise<Buffer> {
  try {
    const sharp = require('sharp');

    if (type === 'image') {
      // 图片缩略图：宽度 400px，保持宽高比
      return await sharp(buffer)
        .resize(400, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } else {
      // 视频缩略图：暂不支持，返回原始 buffer
      console.warn('⚠️  视频缩略图生成需要 ffmpeg，当前跳过');
      return buffer;
    }
  } catch (error) {
    console.error('生成缩略图失败:', error);
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
    });

    if (result.success && result.url) {
      return result.url;
    } else {
      console.error(`上传失败: ${result.error}`);
      return null;
    }
  } catch (error) {
    console.error('上传到 OSS 失败:', error);
    return null;
  }
}

/**
 * 处理单个媒体项
 */
async function processMediaItem(item: MediaItem): Promise<MediaItem> {
  const { src, type, original_image_url } = item;

  console.log(`\n处理 ${type}: ${src}`);

  try {
    // 1. 下载原始文件
    console.log('  ⬇️  下载原始文件...');
    const originalBuffer = await downloadFile(src);

    // 2. 上传原始文件
    console.log('  ⬆️  上传原始文件...');
    const originalKey = generateOSSKey(src, type, false);
    const contentType = getContentType(src, type);
    const originalUrl = await uploadToOSS(originalBuffer, originalKey, contentType);

    if (!originalUrl) {
      console.error('  ❌ 原始文件上传失败');
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

    // 4. 处理 original_image_url（用于 image-to-video）
    let newOriginalImageUrl: string | undefined = original_image_url;
    if (original_image_url) {
      console.log('  ⬇️  下载 original_image_url...');
      const originalImageBuffer = await downloadFile(original_image_url);
      const originalImageKey = generateOSSKey(original_image_url, 'image', false);
      const originalImageContentType = getContentType(original_image_url, 'image');
      const uploadResult = await uploadToOSS(originalImageBuffer, originalImageKey, originalImageContentType);
      newOriginalImageUrl = uploadResult ?? undefined;

      if (newOriginalImageUrl) {
        console.log(`  ✅ original_image_url: ${newOriginalImageUrl}`);
      }
    }

    // 5. 返回更新后的项
    return {
      ...item,
      src: originalUrl,
      thumbnailUrl: thumbnailUrl,
      ...(newOriginalImageUrl && { original_image_url: newOriginalImageUrl }),
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
  const inputFile = path.join(__dirname, '../explore-config-processed.json');
  const outputFile = path.join(__dirname, '../explore-config-oss.json');

  console.log('📦 开始处理 explore-config...\n');
  console.log(`输入文件: ${inputFile}`);
  console.log(`输出文件: ${outputFile}\n`);

  // 读取配置文件
  const configContent = fs.readFileSync(inputFile, 'utf-8');
  const config: ExploreConfig = JSON.parse(configContent);

  let totalItems = 0;
  let processedCount = 0;

  // 统计总数
  for (const section of config.sections) {
    totalItems += section.items.length;
  }

  console.log(`📊 总共需要处理 ${totalItems} 个媒体项\n`);

  // 处理每个 section
  for (const section of config.sections) {
    console.log(`\n🔖 处理分类: ${section.sceneName} (${section.items.length} 项)`);
    console.log('='.repeat(60));

    const processedItems: MediaItem[] = [];

    for (const item of section.items) {
      const processed = await processMediaItem(item);
      processedItems.push(processed);
      processedCount++;

      console.log(`\n进度: ${processedCount}/${totalItems}`);

      // 添加延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    section.items = processedItems;
  }

  // 保存结果
  console.log('\n\n💾 保存结果...');
  fs.writeFileSync(outputFile, JSON.stringify(config, null, 2), 'utf-8');

  console.log(`\n✅ 完成！结果已保存到: ${outputFile}`);
  console.log(`📊 处理统计: ${processedCount}/${totalItems} 项`);
}

// 运行
main().catch(console.error);
