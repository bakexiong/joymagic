# OSS 上传脚本使用说明

## 功能说明

此脚本用于将 `explore-config-processed.json` 中的所有图片和视频上传到阿里云 OSS，并生成缩略图用于瀑布流展示。

## 主要功能

1. **下载原始文件**：从 CDN 下载所有图片和视频
2. **生成缩略图**：为图片生成 400px 宽度的缩略图（保持宽高比）
3. **上传到 OSS**：将原始文件和缩略图上传到阿里云 OSS
4. **更新配置**：生成新的配置文件，包含 OSS URL 和缩略图 URL

## 前置准备

### 1. 安装依赖

```bash
pnpm add sharp
```

### 2. 配置 OSS 凭证

复制环境变量模板：

```bash
cp .env.oss.example .env.oss
```

编辑 `.env.oss` 文件，填入你的阿里云 OSS 配置：

```env
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_PUBLIC_DOMAIN=https://your-bucket.oss-cn-hangzhou.aliyuncs.com
```

### 3. 获取 OSS 凭证

登录阿里云控制台：
1. 进入 OSS 控制台
2. 创建或选择一个 Bucket
3. 在 AccessKey 管理中创建 AccessKey
4. 记录 Region、AccessKeyId、AccessKeySecret、Bucket 名称

## 使用方法

### 运行脚本

**方法一：使用快捷脚本（推荐）**

```bash
./scripts/run-oss-upload.sh
```

这个脚本会自动：
- 检查 `.env.oss` 配置文件
- 安装 `sharp` 依赖（如果未安装）
- 验证 OSS 配置
- 运行上传任务

**方法二：手动运行**

```bash
# 加载环境变量并运行
export $(cat .env.oss | grep -v '^#' | grep -v '^$' | xargs) && pnpm tsx scripts/upload-to-oss-with-thumbnails.ts
```

或者使用 npx：

```bash
export $(cat .env.oss | grep -v '^#' | grep -v '^$' | xargs) && npx tsx scripts/upload-to-oss-with-thumbnails.ts
```

**方法三：直接在命令行中设置环境变量**

```bash
OSS_REGION=oss-cn-hangzhou \
OSS_ACCESS_KEY_ID=your_key \
OSS_ACCESS_KEY_SECRET=your_secret \
OSS_BUCKET=your_bucket \
OSS_PUBLIC_DOMAIN=https://cdn.example.com \
pnpm tsx scripts/upload-to-oss-with-thumbnails.ts
```

## 输出结果

脚本会生成 `explore-config-oss.json` 文件，结构如下：

```json
{
  "sections": [
    {
      "items": [
        {
          "id": "1",
          "type": "image",
          "src": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/explore/images/original/xxx.jpg",
          "thumbnailUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/explore/images/thumbnails/xxx.jpg",
          "original_image_url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/explore/images/original/yyy.jpg"
        }
      ]
    }
  ]
}
```

## OSS 目录结构

```
explore/
├── images/
│   ├── original/          # 原始图片
│   │   └── {md5hash}.jpg
│   └── thumbnails/        # 缩略图
│       └── {md5hash}.jpg
└── videos/
    ├── original/          # 原始视频
    │   └── {md5hash}.mp4
    └── thumbnails/        # 视频缩略图（需要 ffmpeg）
        └── {md5hash}.jpg
```

## 注意事项

1. **视频缩略图**：当前脚本不支持视频缩略图生成，需要安装 ffmpeg 并实现视频帧提取
2. **上传速度**：脚本会在每个文件上传后延迟 500ms，避免请求过快
3. **错误处理**：如果某个文件上传失败，会保留原始 URL，继续处理下一个
4. **断点续传**：当前不支持断点续传，如果中断需要重新运行

## 视频缩略图支持（可选）

如需支持视频缩略图，需要：

1. 安装 ffmpeg：
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg
```

2. 安装 fluent-ffmpeg：
```bash
pnpm add fluent-ffmpeg @types/fluent-ffmpeg
```

3. 修改脚本中的 `generateThumbnail` 函数以支持视频帧提取

## 故障排查

### 上传失败

- 检查 OSS 凭证是否正确
- 检查 Bucket 是否存在且有写入权限
- 检查网络连接

### 缩略图生成失败

- 确保已安装 sharp：`pnpm add sharp`
- 检查图片格式是否支持

### 内存不足

如果处理大量文件导致内存不足，可以修改脚本分批处理：

```bash
NODE_OPTIONS='--max-old-space-size=4096' tsx scripts/upload-to-oss-with-thumbnails.ts
```

## 后续步骤

上传完成后，需要更新前端代码以使用缩略图：

1. 瀑布流默认显示 `thumbnailUrl`
2. 点击查看大图时加载 `src`（原始图片）
3. 视频播放时使用 `src`（原始视频）
