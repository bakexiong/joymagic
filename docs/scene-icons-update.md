# 场景图标更新文档

## 概述

本次更新为所有 AI 场景添加了自定义图标 URL，并添加了 OSS 缩略图参数以优化加载性能。

## 更新内容

### 1. 图标映射表

为以下场景配置了专属图标：

#### 图片 AI 场景
- **文本生成图片** (`text-to-image`): `icon/text_to_image.png`
- **图片转图片** (`image-to-image`): `icon/image_to_image.png`
- **Qwen 图片分层** (`qwen-image-layered`): `icon/qwen_image_layered.png`
- **图片擦除** (`image-eraser`): `icon/%20image_eraser.png`
- **背景移除** (`image-background-remover`): `icon/background_remove.png`
- **图片放大** (`image-upscaler`): `icon/image_upscaler.png`

#### 视频 AI 场景
- **视频换脸** (`video-face-swap`): `icon/video_face_swap.png`
- **文本生成视频** (`text-to-video`): `icon/text_to_video.png`
- **图片生成视频** (`image-to-video`): `icon/image_video.png`
- **动作控制** (`motion-control`): `icon/motion_control.png`
- **Longcat Avatar** (`longcat-avatar`): `icon/longcat_avatar.png`

### 2. OSS 缩略图参数

所有图标 URL 都添加了 OSS 图片处理参数：
```
?x-oss-process=image/resize,m_fill,w_64,h_64
```

这将图标缩放到 64x64 像素，优化加载性能。

### 3. 更新的文件

#### 配置文件
- 所有语言的 `landing.json` 文件（14 个语言目录）
  - `src/config/locale/messages/*/landing.json`

#### 组件文件
1. **CreateLayout** (`src/shared/blocks/create/create-layout.tsx`)
   - 更新了 3 处图标渲染逻辑
   - 优先显示 `icon_url`，回退到 `icon` 字符串或 React 组件

2. **Header** (`src/themes/default/blocks/header.tsx`)
   - 更新了 `CustomMenuItem` 组件
   - 添加了 `icon_url` 参数支持
   - 更新了 3 处 `CustomMenuItem` 调用

3. **AddToolsDialog** (`src/shared/blocks/create/add-tools-dialog.tsx`)
   - 更新了工具列表图标显示
   - 支持在"添加工具"对话框中显示自定义图标
   - 优先显示 `icon_url`，回退到 `icon` 或 Pin 图标

#### 脚本文件
- `scripts/update-scene-icons.ts` - 自动化更新脚本

## 图标显示优先级

组件中的图标显示逻辑按以下优先级：

1. **icon_url** - 如果存在，显示图片
2. **icon (string)** - 如果是字符串，使用 SmartIcon 组件
3. **icon (ReactNode)** - 如果是 React 组件，直接渲染
4. **fallback** - 显示首字母缩写或默认图标

## 示例

### 配置示例
```json
{
  "title": "图片放大",
  "url": "/image-upscaler",
  "icon": "Maximize2",
  "description": "使用 AI 将图片放大至 4K、8K 或 16K",
  "icon_url": "https://ocdn.10b.ai/icon/image_upscaler.png?x-oss-process=image/resize,m_fill,w_64,h_64"
}
```

### 组件渲染示例
```tsx
{tool.icon_url ? (
  <img
    src={tool.icon_url}
    alt={label}
    className="size-6 object-contain"
  />
) : typeof tool.icon === "string" ? (
  <SmartIcon
    name={tool.icon}
    className="size-5 text-white/82"
  />
) : tool.icon ? (
  tool.icon
) : (
  <span className="text-[13px] font-semibold text-white/82">
    {/* 首字母缩写 */}
  </span>
)}
```

## 使用方法

### 运行更新脚本
```bash
pnpm tsx scripts/update-scene-icons.ts
```

### 添加新场景图标
1. 将图标上传到 OSS: `ocdn.10b.ai/icon/`
2. 在 `scripts/update-scene-icons.ts` 的 `sceneIconMap` 中添加映射
3. 运行更新脚本

### 修改缩略图尺寸
在 `addOssThumbnailParams` 函数中修改 `width` 和 `height` 参数：
```typescript
function addOssThumbnailParams(url: string, width: number = 64, height: number = 64)
```

## 性能优化

- 使用 OSS 缩略图参数，减少图片加载大小
- 图标尺寸统一为 64x64 像素
- 支持浏览器缓存

## 兼容性

- 保持向后兼容，未配置 `icon_url` 的场景仍使用原有的 `icon` 字段
- 支持 Lucide React 图标和自定义图片图标混用

## 注意事项

1. 图标 URL 必须是可访问的公开 URL
2. 建议使用 PNG 格式，支持透明背景
3. 原始图标尺寸建议不小于 128x128 像素
4. OSS 图片处理参数仅对 OSS 域名有效

## 后续优化建议

1. 考虑添加图标预加载机制
2. 支持 WebP 格式以进一步优化性能
3. 添加图标加载失败的降级处理
4. 考虑使用 CDN 加速图标加载
