# Mobile Homepage 瀑布流数据优化方案

## 优化概述

本次优化主要解决移动端首页瀑布流图片加载的性能问题，通过优化 JSON 数据结构减少布局偏移（CLS）、加快首屏加载速度、降低带宽消耗。

## 前端已完成的优化

### 1. MediaItem 类型扩展

新增以下字段以支持性能优化：

```typescript
interface MediaItem {
  // ... 原有字段

  // 新增：预计算的宽高比，避免布局偏移
  aspectRatio?: number;

  // 新增：加载优先级（首屏可见设为 high）
  priority?: 'high' | 'low';

  // 新增：响应式图片源
  srcSet?: {
    small?: string;   // 移动端优化 (320-640px)
    medium?: string;  // 平板优化 (640-1024px)
    large?: string;   // 桌面优化 (1024px+)
  };

  // 新增：低质量占位图 base64
  blurDataURL?: string;
}
```

### 2. 智能 GridSize 分配

替换原有的随机分配算法，改为基于图片实际宽高比的智能分配：

- `aspectRatio >= 1.4` → `tall` (竖图)
- `aspectRatio >= 1.1` → `large` (略竖)
- `aspectRatio >= 0.9` → `small` (方图)
- `aspectRatio < 0.9` → `medium` (横图)

### 3. 优先级加载

首个 showcase 组的前 4 个项目自动设置为 `priority: 'high'`，确保首屏内容快速加载。

### 4. 响应式图片支持

MediaCard 组件现在优先使用 `srcSet.small` 作为移动端图片源，并支持 blur placeholder。

## 后端需要提供的数据格式

### 必需字段（REQUIRED）

为了避免布局偏移和提升性能，后端**必须**提供以下字段：

```json
{
  "id": "image-001",
  "type": "image",
  "src": "https://cdn.10b.ai/full/image-001.webp",
  "width": 1024,
  "height": 1536,
  "aspectRatio": 1.5,
  "alt": "AI generated portrait"
}
```

**关键说明：**
- `width` 和 `height`：图片的实际像素尺寸
- `aspectRatio`：预计算的宽高比 (height / width)，前端将直接使用此值避免布局偏移

### 推荐字段（RECOMMENDED）

为了进一步优化性能，强烈建议提供：

```json
{
  "id": "image-001",
  "type": "image",
  "src": "https://cdn.10b.ai/full/image-001.webp",
  "width": 1024,
  "height": 1536,
  "aspectRatio": 1.5,
  "srcSet": {
    "small": "https://cdn.10b.ai/small/image-001.webp",
    "medium": "https://cdn.10b.ai/medium/image-001.webp",
    "large": "https://cdn.10b.ai/large/image-001.webp"
  },
  "blurDataURL": "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=",
  "thumbnail": "https://cdn.10b.ai/thumb/image-001.webp",
  "alt": "AI generated portrait"
}
```

**关键说明：**
- `srcSet.small`：建议尺寸 640px 宽，用于移动端
- `srcSet.medium`：建议尺寸 1024px 宽，用于平板
- `srcSet.large`：建议尺寸 1920px 宽，用于桌面
- `blurDataURL`：低质量占位图（建议 20x20px 的 base64 编码），用于加载时显示
- `thumbnail`：缩略图（可选，主要用于视频）

### 视频特定字段

```json
{
  "id": "video-001",
  "type": "video",
  "src": "https://cdn.10b.ai/videos/video-001.mp4",
  "thumbnail": "https://cdn.10b.ai/thumbs/video-001.webp",
  "width": 1920,
  "height": 1080,
  "aspectRatio": 0.5625,
  "blurDataURL": "data:image/webp;base64,..."
}
```

### 完整示例

```json
{
  "sections": [
    {
      "id": "flux-pro",
      "sceneName": "FLUX Pro",
      "generateUrl": "/text-to-image?model=flux-pro",
      "items": [
        {
          "id": "img-001",
          "type": "image",
          "src": "https://cdn.10b.ai/full/img-001.webp",
          "width": 1024,
          "height": 1536,
          "aspectRatio": 1.5,
          "srcSet": {
            "small": "https://cdn.10b.ai/small/img-001.webp",
            "medium": "https://cdn.10b.ai/medium/img-001.webp",
            "large": "https://cdn.10b.ai/large/img-001.webp"
          },
          "blurDataURL": "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=",
          "alt": "Futuristic cityscape at sunset",
          "generateUrl": "/text-to-image?model=flux-pro&prompt=futuristic+cityscape"
        }
      ]
    }
  ]
}
```

## 性能提升预期

### 1. 减少布局偏移（CLS）
- **优化前**：图片加载后才能计算宽高比，导致布局跳动
- **优化后**：使用预设的 `aspectRatio`，布局稳定，CLS 接近 0

### 2. 加快首屏加载
- **优化前**：加载完整尺寸图片（1-3MB）
- **优化后**：
  - 移动端加载 `srcSet.small`（100-300KB），减少 70-80% 数据传输
  - 使用 `blurDataURL` 立即显示占位图
  - 首屏图片设置 `priority: 'high'` 优先加载

### 3. 降低带宽消耗
- **优化前**：每个 showcase 可能传输所有项目数据
- **优化后**：
  - 只传输前 6 个项目
  - 移除瀑布流不需要的字段（prompt, quality, size 等可在详情页按需加载）
  - 预计减少 30-40% JSON 大小

### 4. 提升渲染性能
- **优化前**：运行时随机分配 gridSize
- **优化后**：基于实际宽高比确定性分配，减少 JavaScript 执行时间

## 实施建议

### 阶段 1：必需字段（立即实施）
1. 确保所有图片/视频都包含 `width`、`height`、`aspectRatio`
2. 这是最小改动，但能显著减少布局偏移

### 阶段 2：响应式图片（推荐）
1. 生成多尺寸图片（small/medium/large）
2. 添加 `srcSet` 字段
3. 预计减少 70% 移动端流量

### 阶段 3：占位图优化（可选）
1. 生成低质量占位图（20x20px）
2. 转换为 base64 并添加到 `blurDataURL`
3. 提升用户体验，减少"白屏"时间

## 兼容性说明

- 所有新增字段都是可选的（`?`），不会破坏现有功能
- 如果后端未提供新字段，前端会回退到原有逻辑
- 建议逐步迁移，优先处理首页数据

## 监控指标

优化后建议监控以下指标：

1. **CLS (Cumulative Layout Shift)**：目标 < 0.1
2. **LCP (Largest Contentful Paint)**：目标 < 2.5s
3. **首屏图片加载时间**：目标 < 1s
4. **带宽消耗**：预计减少 50-70%

## 参考资料

- [Web Vitals - CLS](https://web.dev/cls/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
