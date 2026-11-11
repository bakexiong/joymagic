# OSS 上传和缩略图配置完成

## 已完成的工作

### 1. 创建 OSS 上传脚本
- **文件**: `scripts/upload-to-oss-with-thumbnails.ts`
- **功能**:
  - 下载所有图片和视频
  - 生成 400px 宽度的缩略图（图片）
  - 上传原始文件和缩略图到阿里云 OSS
  - 生成新的配置文件 `explore-config-oss.json`

### 2. 更新前端组件
- **文件**: `src/shared/blocks/explore/media-card.tsx`
- **改动**:
  - 添加 `thumbnailUrl` 字段支持
  - 瀑布流默认显示缩略图（`thumbnailUrl` 或 `thumbnail`）
  - 点击查看大图时使用原始图片（`src`）
  - 向下兼容旧的 `thumbnail` 字段

### 3. 创建配置文档
- **文件**: `.env.oss.example` - OSS 环境变量模板
- **文件**: `docs/oss-upload-guide.md` - 详细使用说明

## 使用步骤

### 1. 安装依赖
```bash
pnpm add sharp
```

### 2. 配置 OSS 凭证
```bash
cp .env.oss.example .env.oss
# 编辑 .env.oss 填入你的阿里云 OSS 配置
```

### 3. 运行上传脚本

**方法一：使用快捷脚本（推荐）**
```bash
./scripts/run-oss-upload.sh
```

**方法二：手动运行**
```bash
export $(cat .env.oss | grep -v '^#' | grep -v '^$' | xargs) && pnpm tsx scripts/upload-to-oss-with-thumbnails.ts
```

或者使用 npx：
```bash
export $(cat .env.oss | grep -v '^#' | grep -v '^$' | xargs) && npx tsx scripts/upload-to-oss-with-thumbnails.ts
```

### 4. 替换配置文件
上传完成后，将生成的 `explore-config-oss.json` 替换为 `explore-config-processed.json`

## 数据结构

上传后的配置文件结构：
```json
{
  "sections": [
    {
      "items": [
        {
          "id": "1",
          "type": "image",
          "src": "https://your-oss.com/explore/images/original/xxx.jpg",
          "thumbnailUrl": "https://your-oss.com/explore/images/thumbnails/xxx.jpg"
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
│   └── thumbnails/        # 缩略图 (400px 宽)
└── videos/
    ├── original/          # 原始视频
    └── thumbnails/        # 视频缩略图（需要 ffmpeg）
```

## 性能优化

1. **瀑布流加载**: 默认显示 400px 缩略图，减少带宽消耗
2. **懒加载**: 只有可见区域的图片才会加载
3. **渐进式加载**: 缩略图 → 原始图片
4. **向下兼容**: 支持旧的 `thumbnail` 字段

## 注意事项

1. 视频缩略图需要安装 ffmpeg（当前脚本跳过视频缩略图生成）
2. 脚本会在每个文件上传后延迟 500ms，避免请求过快
3. 如果上传失败，会保留原始 URL 继续处理
4. 建议先测试少量数据，确认无误后再批量上传

## 下一步

1. 配置阿里云 OSS 凭证
2. 运行上传脚本
3. 验证上传结果
4. 替换配置文件
5. 测试前端显示效果
