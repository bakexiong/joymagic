# Scripts 使用说明

## process-explore-images.ts

批量处理 explore 配置文件中的图片，将非 OSS 图片上传到 OSS 并生成缩略图。

### 快速开始

```bash
# 1. 确保安装了 sharp 依赖
pnpm install sharp

# 2. 配置环境变量（.env.local）
OSS_REGION=oss-ap-southeast-1
OSS_ACCESS_KEY_ID=your_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET=your_bucket
OSS_PUBLIC_DOMAIN=https://your-cdn.com

# 3. 运行脚本
pnpm process:images explore-config-processed.json

# 或者使用 tsx 直接运行
npx tsx scripts/process-explore-images.ts explore-config-processed.json
```

### 功能特性

✅ **智能识别**：自动跳过已经是 OSS 地址的图片
✅ **缩略图生成**：自动生成 400px 宽度的缩略图
✅ **超时控制**：下载 60s、上传 120s 超时保护
✅ **错误处理**：单个文件失败不影响整体流程
✅ **进度显示**：实时显示处理进度和统计信息

### 输出结果

脚本会生成 `{原文件名}-processed.json`，包含：
- 更新后的 `src` 字段（OSS 地址）
- 新增的 `thumbnailUrl` 字段（缩略图地址）

### 详细文档

查看 [README-PROCESS-IMAGES.md](../README-PROCESS-IMAGES.md) 获取完整文档。

## 其他脚本

- `upload-to-oss-with-thumbnails.ts` - 旧版上传脚本（已被 process-explore-images.ts 替代）
- `sync-strapi-posts.ts` - 同步 Strapi 文章
- `init-rbac.ts` - 初始化 RBAC 权限
- `assign-role.ts` - 分配用户角色
