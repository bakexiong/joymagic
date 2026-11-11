# 阿里云 OSS 视频处理方案

## 方案概述

阿里云 OSS 提供了强大的视频处理功能，可以通过 URL 参数直接生成视频截帧和动图，无需额外存储。

## 支持的功能

### 1. 视频截帧（推荐用于缩略图）

通过 `x-oss-process=video/snapshot` 参数获取视频某一时刻的截图：

```
https://bucket.oss-region.aliyuncs.com/video.mp4?x-oss-process=video/snapshot,t_1000,f_jpg,w_400,h_0,m_fast
```

参数说明：
- `t_1000`: 截取第 1000ms 的帧
- `f_jpg`: 输出格式为 JPG
- `w_400`: 宽度 400px
- `h_0`: 高度自适应
- `m_fast`: 快速模式

### 2. 视频转动图（GIF）

通过 `x-oss-process=video/convert` 参数将视频片段转为 GIF：

```
https://bucket.oss-region.aliyuncs.com/video.mp4?x-oss-process=video/convert,f_gif,w_400,h_0,ss_0,t_3
```

参数说明：
- `f_gif`: 输出格式为 GIF
- `w_400`: 宽度 400px
- `h_0`: 高度自适应
- `ss_0`: 从第 0 秒开始
- `t_3`: 持续 3 秒

### 3. 视频转码（WebP 动图，更小体积）

```
https://bucket.oss-region.aliyuncs.com/video.mp4?x-oss-process=video/convert,f_webp,w_400,h_0,ss_0,t_3
```

## 推荐方案

### 方案一：静态截帧（最快，最省流量）
- 瀑布流显示：视频第 1 秒的静态截图
- 鼠标悬停：播放原视频
- 优点：加载速度快，流量消耗小
- 缺点：无动态效果

### 方案二：短 GIF 动图（平衡方案）
- 瀑布流显示：3 秒循环 GIF
- 点击查看：播放完整视频
- 优点：有动态效果，吸引眼球
- 缺点：比静态图大，但可接受

### 方案三：WebP 动图（最优方案）
- 瀑布流显示：3 秒 WebP 动图
- 点击查看：播放完整视频
- 优点：体积比 GIF 小 30-50%，质量更好
- 缺点：需要浏览器支持 WebP（现代浏览器都支持）

## 实现方式

### 方式一：URL 参数（推荐）

直接在前端使用 OSS 处理参数，无需修改上传脚本：

```typescript
// 生成视频缩略图 URL
function getVideoThumbnail(videoUrl: string, type: 'image' | 'gif' | 'webp' = 'image'): string {
  if (type === 'image') {
    // 静态截图
    return `${videoUrl}?x-oss-process=video/snapshot,t_1000,f_jpg,w_400,h_0,m_fast`;
  } else if (type === 'gif') {
    // GIF 动图
    return `${videoUrl}?x-oss-process=video/convert,f_gif,w_400,h_0,ss_0,t_3`;
  } else {
    // WebP 动图
    return `${videoUrl}?x-oss-process=video/convert,f_webp,w_400,h_0,ss_0,t_3`;
  }
}
```

### 方式二：持久化处理

如果需要固定的缩略图 URL，可以使用 OSS 的持久化处理功能，将处理结果保存为新文件。

## 注意事项

1. **开通视频处理服务**：需要在阿里云 OSS 控制台开通视频处理功能
2. **计费说明**：视频处理按处理时长计费，实时处理不额外存储
3. **浏览器兼容性**：WebP 动图需要现代浏览器支持
4. **性能优化**：首次访问会触发处理，后续访问会使用缓存

## 成本对比

假设 1000 个视频，每个视频 10 秒：

| 方案 | 存储成本 | 流量成本 | 处理成本 |
|------|---------|---------|---------|
| 静态截图 | 0 | 最低 | 极低 |
| GIF 动图 | 0 | 中等 | 低 |
| WebP 动图 | 0 | 较低 | 低 |
| 预生成存储 | 高 | 低 | 一次性 |

## 推荐配置

```typescript
// 配置文件
export const VIDEO_THUMBNAIL_CONFIG = {
  // 缩略图类型：'image' | 'gif' | 'webp'
  type: 'webp',

  // 截图时间点（毫秒）
  snapshotTime: 1000,

  // 动图持续时间（秒）
  gifDuration: 3,

  // 缩略图宽度
  width: 400,

  // 质量（1-100）
  quality: 80,
};
```
