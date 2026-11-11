# 数据补全指南

## 概述

为了支持新的性能优化功能，需要为现有的 `explore_page_config` 数据补全以下字段：

1. **sceneName** - 替换 modelName
2. **width, height, aspectRatio** - 图片尺寸信息（避免布局偏移）
3. **likes** - 虚拟点赞数
4. **priority** - 加载优先级（首屏优化）
5. **srcSet** - 响应式图片源（可选，需要后端支持）
6. **blurDataURL** - 占位图（可选，需要后端支持）

## 使用数据补全脚本

### 方式 1：自动补全（推荐）

运行补全脚本自动处理：

```bash
# 安装依赖（如果需要）
npm install

# 运行补全脚本
npx tsx scripts/enrich-explore-data.ts
```

脚本会：
1. 读取当前的 `explore_page_config`
2. 自动补全所有缺失字段
3. 输出完整的 JSON 配置
4. 显示补全统计信息

### 方式 2：手动补全

如果无法运行脚本，可以手动补全数据。

#### 步骤 1：添加 sceneName

将所有 `modelName` 改为 `sceneName`：

```json
// 修改前
{
  "id": "gpt-image-1",
  "modelName": "GPT-image 1 GALLERY"
}

// 修改后
{
  "id": "gpt-image-1",
  "sceneName": "GPT-image 1 GALLERY"
}
```

#### 步骤 2：补全图片尺寸

根据模型类型添加尺寸信息：

| 模型 | 默认尺寸 | aspectRatio |
|------|---------|-------------|
| GPT-image 1 | 1024x1024 | 1 |
| Nano Banana | 1024x1024 | 1 |
| Nano Banana Pro | 1024x1024 | 1 |
| Qwen Image | 1328x1328 | 1 |
| Seedream 4.5 | 2048x2048 | 1 |
| Wan 2.6 | 1280x1280 | 1 |
| 10b.ai | 1024x1024 | 1 |

示例：

```json
{
  "id": "1",
  "type": "image",
  "src": "https://cdn.10b.ai/images/xxx.png",
  "width": 1024,
  "height": 1024,
  "aspectRatio": 1,
  "model": "GPT-image 1"
}
```

**注意**：如果 item 已有 `size` 字段（如 "1024x1024"），可以从中提取尺寸。

#### 步骤 3：添加虚拟点赞数

为每个 item 添加 `likes` 字段（100-9999 之间的随机数）：

```json
{
  "id": "1",
  "likes": 1234
}
```

或者使用脚本中的哈希算法生成确定性的点赞数。

#### 步骤 4：设置优先级

首个 section 的前 4 个 item 设为 `high`，其余设为 `low`：

```json
// 第一个 section 的前 4 个 item
{
  "id": "1",
  "priority": "high"
}

// 其他 item
{
  "id": "5",
  "priority": "low"
}
```

#### 步骤 5：视频类型特殊处理

视频类型的 item 不需要 width、height、aspectRatio：

```json
{
  "id": "9",
  "type": "video",
  "src": "https://cdn.10b.ai/videos/xxx.mp4",
  "likes": 2345,
  "priority": "low"
  // 不需要 width, height, aspectRatio
}
```

## 完整示例

### 补全前

```json
{
  "sections": [
    {
      "id": "gpt-image-1",
      "modelName": "GPT-image 1 GALLERY",
      "items": [
        {
          "id": "1",
          "type": "image",
          "src": "https://cdn.10b.ai/images/xxx.png",
          "model": "GPT-image 1",
          "size": "1024x1024"
        }
      ]
    }
  ]
}
```

### 补全后

```json
{
  "sections": [
    {
      "id": "gpt-image-1",
      "sceneName": "GPT-image 1 GALLERY",
      "items": [
        {
          "id": "1",
          "type": "image",
          "src": "https://cdn.10b.ai/images/xxx.png",
          "model": "GPT-image 1",
          "size": "1024x1024",
          "width": 1024,
          "height": 1024,
          "aspectRatio": 1,
          "likes": 1234,
          "priority": "high"
        }
      ]
    }
  ]
}
```

## 字段说明

### 必需字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| sceneName | string | 场景名称（替换 modelName） | "GPT-image 1 GALLERY" |
| width | number | 图片宽度（像素） | 1024 |
| height | number | 图片高度（像素） | 1024 |
| aspectRatio | number | 宽高比 (height/width) | 1 |
| likes | number | 点赞数 | 1234 |
| priority | string | 加载优先级 | "high" 或 "low" |

### 可选字段（需要后端支持）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| srcSet.small | string | 移动端图片 URL | "https://cdn.10b.ai/small/xxx.webp" |
| srcSet.medium | string | 平板图片 URL | "https://cdn.10b.ai/medium/xxx.webp" |
| srcSet.large | string | 桌面图片 URL | "https://cdn.10b.ai/large/xxx.webp" |
| blurDataURL | string | 占位图 base64 | "data:image/webp;base64,..." |

## 验证补全结果

补全后，检查以下内容：

### 1. 结构验证

```bash
# 检查 JSON 格式是否正确
cat config.json | jq .
```

### 2. 字段完整性

确认每个 image 类型的 item 都有：
- ✅ sceneName（section 级别）
- ✅ width
- ✅ height
- ✅ aspectRatio
- ✅ likes
- ✅ priority

### 3. 数据合理性

- aspectRatio = height / width
- likes 在 100-9999 之间
- 首个 section 的前 4 个 item 的 priority 为 "high"
- 视频类型不包含尺寸字段

## 更新配置

### 通过管理后台

1. 访问 `/admin/explore`
2. 找到 `explore_page_config` 配置
3. 粘贴补全后的 JSON
4. 保存

### 通过 API

```bash
curl -X POST http://localhost:3000/api/admin/config \
  -H "Content-Type: application/json" \
  -d '{
    "key": "explore_page_config",
    "value": "补全后的JSON字符串"
  }'
```

## 常见问题

### Q: 如何确定图片的实际尺寸？

A: 优先级：
1. 从 `size` 字段解析（如 "1024x1024"）
2. 根据 `model` 字段推测默认尺寸
3. 使用通用默认值 1024x1024

### Q: 视频需要补全尺寸吗？

A: 不需要。视频类型的 item 只需要 `likes` 和 `priority`。

### Q: 点赞数如何生成？

A: 两种方式：
1. 使用脚本的哈希算法（确定性，相同 ID 总是相同点赞数）
2. 手动设置随机数（100-9999）

### Q: 如果后端不支持 srcSet 怎么办？

A: srcSet 是可选字段，不影响基本功能。前端会自动回退到使用 `src` 字段。

## 性能提升预期

补全数据后的性能提升：

- **CLS（布局偏移）**：从 0.2-0.5 降至 < 0.1
- **首屏加载时间**：减少 30-50%（如果使用 srcSet）
- **用户体验**：无布局跳动，加载更流畅

## 后续优化

数据补全后，可以进一步优化：

1. **生成响应式图片**：为每张图片生成 small/medium/large 版本
2. **生成占位图**：为每张图片生成低质量 base64 占位图
3. **CDN 优化**：使用 CDN 的图片处理功能动态生成不同尺寸

详见 [mobile-homepage-data-optimization.md](./mobile-homepage-data-optimization.md)
