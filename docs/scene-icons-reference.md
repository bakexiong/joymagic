# 场景图标快速参考

## 图标 URL 格式

```
https://ocdn.10b.ai/icon/{icon_name}.png?x-oss-process=image/resize,m_fill,w_64,h_64
```

## 场景图标映射表

| 场景类型 | 场景标识 | 图标文件名 | 完整 URL |
|---------|---------|-----------|---------|
| 文本生成图片 | `text-to-image` | `text_to_image.png` | [查看](https://ocdn.10b.ai/icon/text_to_image.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| 图片转图片 | `image-to-image` | `image_to_image.png` | [查看](https://ocdn.10b.ai/icon/image_to_image.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| Qwen 图片分层 | `qwen-image-layered` | `qwen_image_layered.png` | [查看](https://ocdn.10b.ai/icon/qwen_image_layered.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| 图片擦除 | `image-eraser` | `%20image_eraser.png` | [查看](https://ocdn.10b.ai/icon/%20image_eraser.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| 背景移除 | `image-background-remover` | `background_remove.png` | [查看](https://ocdn.10b.ai/icon/background_remove.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| 图片放大 | `image-upscaler` | `image_upscaler.png` | [查看](https://ocdn.10b.ai/icon/image_upscaler.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| 视频换脸 | `video-face-swap` | `video_face_swap.png` | [查看](https://ocdn.10b.ai/icon/video_face_swap.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| 文本生成视频 | `text-to-video` | `text_to_video.png` | [查看](https://ocdn.10b.ai/icon/text_to_video.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| 图片生成视频 | `image-to-video` | `image_video.png` | [查看](https://ocdn.10b.ai/icon/image_video.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| 动作控制 | `motion-control` | `motion_control.png` | [查看](https://ocdn.10b.ai/icon/motion_control.png?x-oss-process=image/resize,m_fill,w_64,h_64) |
| Longcat Avatar | `longcat-avatar` | `longcat_avatar.png` | [查看](https://ocdn.10b.ai/icon/longcat_avatar.png?x-oss-process=image/resize,m_fill,w_64,h_64) |

## 使用示例

### 在配置文件中使用

```json
{
  "title": "图片放大",
  "url": "/image-upscaler",
  "icon": "Maximize2",
  "description": "使用 AI 将图片放大至 4K、8K 或 16K",
  "icon_url": "https://ocdn.10b.ai/icon/image_upscaler.png?x-oss-process=image/resize,m_fill,w_64,h_64"
}
```

### 在组件中渲染

```tsx
// CreateLayout 组件
{tool.icon_url ? (
  <img
    src={tool.icon_url}
    alt={label}
    className="size-6 object-contain"
  />
) : typeof tool.icon === "string" ? (
  <SmartIcon name={tool.icon} className="size-5" />
) : null}
```

```tsx
// Header 组件
{icon_url ? (
  <img src={icon_url} alt={title} className="h-6 w-6 object-contain" />
) : icon ? (
  <SmartIcon name={icon} className="h-5 w-5" />
) : null}
```

## 添加新图标

1. 上传图标到 OSS：
   ```
   ocdn.10b.ai/icon/your_icon.png
   ```

2. 在 `scripts/update-scene-icons.ts` 中添加映射：
   ```typescript
   const sceneIconMap: Record<string, string> = {
     'your-scene': 'https://ocdn.10b.ai/icon/your_icon.png',
   };
   ```

3. 运行更新脚本：
   ```bash
   pnpm tsx scripts/update-scene-icons.ts
   ```

## OSS 图片处理参数说明

- `x-oss-process=image/resize` - 图片缩放处理
- `m_fill` - 填充模式，保持宽高比
- `w_64,h_64` - 目标尺寸 64x64 像素

### 其他可用参数

```
# 不同尺寸
?x-oss-process=image/resize,m_fill,w_32,h_32   # 32x32
?x-oss-process=image/resize,m_fill,w_128,h_128 # 128x128

# 格式转换
?x-oss-process=image/format,webp               # 转换为 WebP

# 质量压缩
?x-oss-process=image/quality,q_80              # 80% 质量
```

## 验证更新

```bash
# 检查配置文件中的 icon_url 数量
grep -c "icon_url" src/config/locale/messages/zh/landing.json

# 查看具体的 icon_url
grep "icon_url" src/config/locale/messages/zh/landing.json | head -5
```

## 统计信息

- ✅ 11 个场景图标已配置
- ✅ 14 个语言配置文件已更新
- ✅ 每个语言文件包含 39 个 icon_url 字段
- ✅ 2 个组件已支持 icon_url 渲染
