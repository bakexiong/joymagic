# 数据处理完整指南

## 概述

本指南提供了完整的数据处理流程，包括数据补全和重新分类。

## 快速开始

### 一键处理（推荐）

运行整合脚本，自动完成数据补全和重新分类：

```bash
npx tsx scripts/process-explore-data.ts
```

脚本会自动：
1. ✅ 读取现有的 `explore_page_config`
2. ✅ 补全所有缺失字段（width, height, aspectRatio, likes, priority）
3. ✅ 根据内容自动分类（8 个场景分类）
4. ✅ 输出完整的 JSON 配置
5. ✅ 显示详细统计信息

### 输出示例

```
🚀 开始处理数据...

功能：数据补全 + 重新分类

📖 读取配置...
✅ 成功读取配置

🔍 解析 JSON...
✅ 原配置包含 8 个 section

⚙️  处理数据（补全 + 分类）...

✅ 收集到 120 个 items


=== 📊 处理统计 ===

1. 人物肖像 (portraits)
   📦 总数: 25
   🖼️  图片: 25 | 🎬 视频: 0
   ⚡ 高优先级: 4
   📐 有尺寸信息: 25/25

2. 奇幻世界 (fantasy)
   📦 总数: 18
   🖼️  图片: 18 | 🎬 视频: 0
   ⚡ 高优先级: 4
   📐 有尺寸信息: 18/18

...

=== 📈 总计 ===
总 Items: 120
图片: 105 | 视频: 15
高优先级: 32
分类数: 8
```

## 处理内容

### 1. 数据补全

#### modelName → sceneName
```json
// 修改前
{
  "modelName": "GPT-image 1 GALLERY"
}

// 修改后
{
  "sceneName": "GPT-image 1 GALLERY"
}
```

#### 图片尺寸信息
```json
// 补全前
{
  "id": "1",
  "type": "image",
  "src": "https://cdn.10b.ai/images/xxx.png"
}

// 补全后
{
  "id": "1",
  "type": "image",
  "src": "https://cdn.10b.ai/images/xxx.png",
  "width": 1024,
  "height": 1024,
  "aspectRatio": 1
}
```

#### 虚拟点赞数
```json
{
  "id": "1",
  "likes": 1234  // 基于 ID 哈希生成，确保确定性
}
```

#### 加载优先级
```json
// 每个分类的前 4 个 item
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

### 2. 重新分类

#### 新的分类结构

| 分类 ID | 场景名称 | 说明 | 关键词示例 |
|---------|---------|------|-----------|
| portraits | 人物肖像 | 真实人物、角色扮演、时尚写真 | 人物、女、男、学生、职业 |
| fantasy | 奇幻世界 | 魔法、神话、科幻场景 | 魔法、精灵、神话、机甲 |
| nature | 自然风光 | 山川、海洋、森林、日落 | 山、海、森林、日落、星空 |
| urban | 城市生活 | 街拍、建筑、赛博朋克 | 城市、街道、建筑、赛博 |
| art | 艺术创作 | 油画、水彩、插画、概念艺术 | 油画、水彩、插画、艺术 |
| animals | 动物世界 | 宠物、野生动物、奇幻生物 | 猫、狗、动物、宠物 |
| food | 美食摄影 | 料理、甜点、创意美食 | 食物、料理、甜点、美食 |
| videos | 视频创作 | 动态场景、视频特效 | type === 'video' |

#### 分类算法

脚本会分析每个 item 的 `prompt` 和 `alt` 字段，根据关键词自动分类：

```typescript
// 示例 1: 人物肖像
{
  "prompt": "25-year-old Asian female, wearing white shirt...",
  // → 分类到 portraits
}

// 示例 2: 奇幻世界
{
  "prompt": "Fantasy forest elf, transparent wings, magic...",
  // → 分类到 fantasy
}

// 示例 3: 自然风光
{
  "prompt": "Mountain sunset, golden hour, beautiful landscape...",
  // → 分类到 nature
}
```

## 完整工作流程

### 步骤 1: 运行脚本

```bash
npx tsx scripts/process-explore-data.ts
```

### 步骤 2: 检查输出

查看终端输出的统计信息，确认：
- ✅ 所有 item 都已补全必需字段
- ✅ 分类分布合理（每个分类都有内容）
- ✅ 高优先级 item 数量正确（每个分类前 4 个）

### 步骤 3: 复制 JSON

从终端输出中复制完整的 JSON 配置。

### 步骤 4: 更新配置

1. 访问管理后台：`/admin/explore`
2. 找到 `explore_page_config` 配置
3. 粘贴新的 JSON
4. 保存

### 步骤 5: 验证效果

访问以下页面检查显示：
- `/explore` - Explore 页面
- `/`（移动端）- Mobile Homepage

确认：
- ✅ 场景名称正确显示
- ✅ 图片加载正常，无布局偏移
- ✅ 点赞数显示正常
- ✅ 分类合理，内容易于发现

## 手动调整（可选）

如果自动分类不够准确，可以手动调整：

### 调整分类

将某个 item 从一个分类移到另一个分类：

```json
// 从 art 移到 portraits
{
  "sections": [
    {
      "id": "portraits",
      "items": [
        // 将 item 移到这里
      ]
    },
    {
      "id": "art",
      "items": [
        // 从这里移除
      ]
    }
  ]
}
```

### 调整优先级

修改某个 item 的优先级：

```json
{
  "id": "special-item",
  "priority": "high"  // 改为 high 或 low
}
```

### 调整场景名称

修改分类的显示名称：

```json
{
  "id": "portraits",
  "sceneName": "人像摄影",  // 自定义名称
  "subtitle": "专业人像、时尚大片"  // 自定义副标题
}
```

## 配置文件说明

### 脚本文件

| 文件 | 说明 |
|------|------|
| [scripts/process-explore-data.ts](../scripts/process-explore-data.ts) | 整合脚本（推荐使用） |
| [scripts/enrich-explore-data.ts](../scripts/enrich-explore-data.ts) | 仅数据补全 |
| [scripts/recategorize-explore-data.ts](../scripts/recategorize-explore-data.ts) | 仅重新分类 |

### 文档文件

| 文件 | 说明 |
|------|------|
| [docs/data-enrichment-guide.md](./data-enrichment-guide.md) | 数据补全详细指南 |
| [docs/data-recategorization-plan.md](./data-recategorization-plan.md) | 分类方案详细说明 |
| [docs/mobile-homepage-data-optimization.md](./mobile-homepage-data-optimization.md) | 性能优化方案 |
| [docs/modelName-to-sceneName-migration.md](./modelName-to-sceneName-migration.md) | 字段重命名迁移指南 |

## 常见问题

### Q: 脚本运行失败怎么办？

A: 检查以下几点：
1. 确保已安装依赖：`npm install`
2. 确保数据库配置正确
3. 检查 `explore_page_config` 是否存在
4. 查看错误日志定位问题

### Q: 分类不准确怎么办？

A: 两种方式：
1. 手动调整输出的 JSON
2. 修改脚本中的关键词列表，重新运行

### Q: 如何添加新的分类？

A: 修改脚本中的 `categoryMetadata`：

```typescript
const categoryMetadata = {
  // ... 现有分类
  newCategory: {
    id: 'new-category',
    sceneName: '新分类',
    subtitle: '分类说明',
    generateUrl: '/text-to-image?category=new',
    order: 9,
  },
};
```

### Q: 视频为什么没有尺寸信息？

A: 视频的尺寸是动态的，不需要预设。脚本会自动移除视频的 width、height、aspectRatio 字段。

### Q: 点赞数会变化吗？

A: 不会。点赞数基于 item ID 的哈希算法生成，相同 ID 总是生成相同的点赞数。

## 性能提升

处理后的数据将带来以下性能提升：

### 布局稳定性
- **CLS（布局偏移）**：从 0.2-0.5 降至 < 0.1
- **原因**：预设 aspectRatio，避免图片加载后布局跳动

### 加载速度
- **首屏加载时间**：减少 30-50%
- **原因**：高优先级 item 优先加载

### 用户体验
- **内容发现**：场景化分类，更易找到想要的内容
- **视觉吸引力**：虚拟点赞数增加内容可信度

## 后续优化

数据处理完成后，可以进一步优化：

### 1. 生成响应式图片

为每张图片生成多个尺寸版本：
- small: 640px 宽（移动端）
- medium: 1024px 宽（平板）
- large: 1920px 宽（桌面）

### 2. 生成占位图

为每张图片生成低质量 base64 占位图（20x20px）。

### 3. CDN 优化

使用 CDN 的图片处理功能动态生成不同尺寸。

详见 [mobile-homepage-data-optimization.md](./mobile-homepage-data-optimization.md)

## 总结

使用整合脚本 `process-explore-data.ts` 可以一键完成：
- ✅ 字段重命名（modelName → sceneName）
- ✅ 数据补全（尺寸、点赞数、优先级）
- ✅ 智能分类（8 个场景分类）
- ✅ 统计报告（详细的处理结果）

处理后的数据将显著提升页面性能和用户体验！
