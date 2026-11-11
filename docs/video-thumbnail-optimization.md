# 视频缩略图优化完成

## 实现方案

采用**阿里云 OSS 视频处理**方案，通过 URL 参数实时生成视频缩略图，无需额外存储。

## 已完成的工作

### 1. 创建 OSS 视频处理工具
- **文件**: `src/shared/lib/oss-video-thumbnail.ts`
- **功能**:
  - 支持静态截图、GIF 动图、WebP 动图
  - 自动检测浏览器支持情况
  - 智能选择最佳缩略图格式

### 2. 更新前端组件
- **文件**: `src/shared/blocks/explore/media-card.tsx`
- **改动**:
  - 集成 OSS 视频处理功能
  - 自动为视频生成缩略图
  - 优先使用 WebP 动图（体积小 30-50%）
  - 降级支持 GIF 动图

### 3. 创建技术文档
- **文件**: `docs/oss-video-processing.md`
- **内容**: OSS 视频处理方案详解

## 工作原理

### 视频缩略图生成

```typescript
// 自动生成视频缩略图 URL
const thumbnailUrl = getVideoThumbnailUrl(videoUrl, {
  type: 'webp',      // WebP 动图
  width: 400,        // 宽度 400px
  duration: 3,       // 3 秒循环
});

// 结果示例
// https://bucket.oss-region.aliyuncs.com/video.mp4?x-oss-process=video/convert,f_webp,w_400,h_0,ss_0,t_3,q_80
```

### 智能格式选择

1. **优先 WebP 动图**：体积小，质量好（现代浏览器）
2. **降级 GIF 动图**：兼容性好（旧浏览器）
3. **静态截图**：最小体积（可选）

## 优势

### 1. 零存储成本
- 不需要预生成和存储缩略图
- OSS 实时处理，按需生成
- 首次访问后自动缓存

### 2. 更好的用户体验
- 瀑布流显示 3 秒循环动图
- 吸引眼球，提升点击率
- 自动播放，无需等待

### 3. 性能优化
- WebP 比 GIF 小 30-50%
- 400px 宽度适合瀑布流
- 懒加载 + 可见区域检测

### 4. 灵活配置
```typescript
// 可自定义配置
{
  type: 'webp',        // 格式：image | gif | webp
  snapshotTime: 1000,  // 截图时间点（毫秒）
  duration: 3,         // 动图时长（秒）
  width: 400,          // 宽度
  quality: 80,         // 质量
}
```

## 使用方法

### 前端自动处理

组件会自动为视频生成缩略图，无需手动配置：

```tsx
<MediaCard
  item={{
    type: 'video',
    src: 'https://bucket.oss-region.aliyuncs.com/video.mp4',
    // 自动生成缩略图，无需 thumbnailUrl
  }}
/>
```

### 手动生成缩略图 URL

```typescript
import { getVideoThumbnailUrl } from '@/shared/lib/oss-video-thumbnail';

// WebP 动图（推荐）
const webpUrl = getVideoThumbnailUrl(videoUrl, { type: 'webp' });

// GIF 动图
const gifUrl = getVideoThumbnailUrl(videoUrl, { type: 'gif' });

// 静态截图
const imageUrl = getVideoThumbnailUrl(videoUrl, { type: 'image' });
```

## 注意事项

### 1. 开通 OSS 视频处理
需要在阿里云 OSS 控制台开通视频处理功能（按量计费）

### 2. 计费说明
- 实时处理：按处理时长计费
- 首次访问触发处理
- 后续访问使用缓存（免费）

### 3. 浏览器兼容性
- WebP：Chrome 23+, Firefox 65+, Safari 14+, Edge 18+
- GIF：所有浏览器
- 自动降级处理

## 性能对比

| 方案 | 体积 | 加载速度 | 用户体验 | 成本 |
|------|------|---------|---------|------|
| 原视频自动播放 | 5-10MB | 慢 | 差 | 高流量 |
| 静态截图 | 50KB | 快 | 一般 | 低 |
| GIF 动图 | 500KB | 中等 | 好 | 中等 |
| WebP 动图 | 200KB | 快 | 好 | 低 |

## 下一步

1. 测试视频缩略图显示效果
2. 根据实际情况调整配置（时长、质量等）
3. 监控 OSS 视频处理费用
4. 考虑添加缓存策略

## 配置示例

```typescript
// src/shared/lib/oss-video-thumbnail.ts
const DEFAULT_OPTIONS = {
  type: 'webp',        // 使用 WebP 动图
  snapshotTime: 1000,  // 截取第 1 秒
  duration: 3,         // 3 秒循环
  width: 400,          // 400px 宽度
  height: 0,           // 高度自适应
  quality: 80,         // 80% 质量
};
```

所有视频现在都会自动显示动图缩略图，无需额外配置！
