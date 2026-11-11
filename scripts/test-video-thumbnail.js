#!/usr/bin/env node

/**
 * 视频缩略图 URL 测试脚本
 * 用于验证 OSS 视频处理 URL 生成是否正确
 */

const testVideoUrl = 'https://ocdn.10b.ai/explore/videos/original/281c5e8f8d169316eb8b470799e5f7a1.mp4';

console.log('🎬 视频缩略图 URL 测试\n');
console.log('原始视频 URL:');
console.log(testVideoUrl);
console.log('\n' + '='.repeat(80) + '\n');

// 静态截图
const imageUrl = `${testVideoUrl}?x-oss-process=video/snapshot,t_1000,f_jpg,w_400,h_0,m_fast,q_80`;
console.log('📸 静态截图 (JPG):');
console.log(imageUrl);
console.log('');

// GIF 动图
const gifUrl = `${testVideoUrl}?x-oss-process=video/convert,f_gif,w_400,h_0,ss_0,t_3,q_80`;
console.log('🎞️  GIF 动图 (3秒):');
console.log(gifUrl);
console.log('');

// WebP 动图
const webpUrl = `${testVideoUrl}?x-oss-process=video/convert,f_webp,w_400,h_0,ss_0,t_3,q_80`;
console.log('🖼️  WebP 动图 (3秒, 推荐):');
console.log(webpUrl);
console.log('');

console.log('='.repeat(80));
console.log('\n✅ 测试完成！\n');
console.log('💡 提示：');
console.log('1. 复制上面的 URL 到浏览器测试');
console.log('2. 首次访问会触发 OSS 处理（可能需要几秒）');
console.log('3. 后续访问会使用缓存（秒开）');
console.log('4. WebP 动图体积最小，推荐使用');
console.log('');
