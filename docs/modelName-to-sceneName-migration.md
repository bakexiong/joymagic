# ModelName 到 SceneName 迁移指南

## 概述

我们已将代码中的 `modelName` 字段重命名为 `sceneName`，以更准确地反映其语义（场景名称而非模型名称）。

## 代码修改完成

以下文件已更新：
- ✅ `src/shared/models/explore-config.ts` - ExploreSection 接口
- ✅ `src/shared/lib/mobile-homepage.ts` - 数据转换函数
- ✅ `src/shared/blocks/explore/gallery-section.tsx` - 组件接口和使用
- ✅ `src/app/[locale]/(landing)/explore/page.tsx` - 页面组件
- ✅ `docs/mobile-homepage-data-optimization.md` - 文档示例

## 数据库配置需要更新

### 配置位置

数据存储在数据库的 `configs` 表中，配置键为 `explore_page_config`。

### 当前数据格式（需要修改）

```json
{
  "sections": [
    {
      "id": "gpt-image-1",
      "modelName": "GPT-image 1 GALLERY",  ← 需要改为 sceneName
      "viewAllText": "View all of GPT-image 1 Gallery",
      "items": [...]
    }
  ]
}
```

### 目标数据格式

```json
{
  "sections": [
    {
      "id": "gpt-image-1",
      "sceneName": "GPT-image 1 GALLERY",  ← 已改为 sceneName
      "viewAllText": "View all of GPT-image 1 Gallery",
      "items": [...]
    }
  ]
}
```

## 迁移步骤

### 方式 1：通过管理后台更新（推荐）

1. 访问管理后台：`/admin/explore`
2. 编辑 `explore_page_config` 配置
3. 将所有 `modelName` 字段替换为 `sceneName`
4. 保存配置

### 方式 2：通过 SQL 更新

```sql
-- 备份当前配置
SELECT * FROM configs WHERE key = 'explore_page_config';

-- 更新配置（将 modelName 替换为 sceneName）
UPDATE configs
SET value = REPLACE(value, '"modelName":', '"sceneName":')
WHERE key = 'explore_page_config';
```

### 方式 3：通过脚本批量更新

创建迁移脚本 `scripts/migrate-modelName-to-sceneName.ts`：

```typescript
import { getConfigs, updateConfig } from '@/shared/models/config';

async function migrate() {
  const configs = await getConfigs();
  const raw = configs['explore_page_config'];

  if (!raw) {
    console.log('No explore_page_config found');
    return;
  }

  try {
    const data = JSON.parse(raw);

    // 将所有 modelName 改为 sceneName
    if (data.sections && Array.isArray(data.sections)) {
      data.sections = data.sections.map((section: any) => {
        if (section.modelName) {
          return {
            ...section,
            sceneName: section.modelName,
            modelName: undefined, // 移除旧字段
          };
        }
        return section;
      });
    }

    // 保存更新后的配置
    await updateConfig('explore_page_config', JSON.stringify(data, null, 2));
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
```

## 验证迁移

### 1. 检查 API 响应

```bash
curl http://localhost:3000/api/explore
```

确认返回的 JSON 中使用的是 `sceneName` 而非 `modelName`。

### 2. 检查页面渲染

访问以下页面确认正常显示：
- `/explore` - Explore 页面
- `/` (移动端) - Mobile Homepage

### 3. 检查控制台

打开浏览器控制台，确认没有以下错误：
- `Cannot read property 'modelName' of undefined`
- TypeScript 类型错误

## 兼容性说明

### 向后兼容

代码已更新为只使用 `sceneName`，不再支持 `modelName`。如果数据库中仍使用 `modelName`，页面将无法正确显示场景名称。

### 回滚方案

如果需要回滚：

1. 恢复代码到之前的版本
2. 或者将数据库配置改回 `modelName`

```sql
UPDATE configs
SET value = REPLACE(value, '"sceneName":', '"modelName":')
WHERE key = 'explore_page_config';
```

## 注意事项

1. **必须同步更新**：代码和数据库配置必须同时更新，否则会导致显示错误
2. **备份数据**：更新前务必备份 `explore_page_config` 配置
3. **测试环境先行**：建议先在测试环境验证迁移脚本
4. **缓存清理**：更新后可能需要清理应用缓存

## 影响范围

### 受影响的功能
- ✅ Explore 页面 - 场景名称显示
- ✅ Mobile Homepage - 瀑布流场景标题
- ✅ Gallery Section - 场景标题渲染

### 不受影响的功能
- ✅ 图片生成功能
- ✅ 视频生成功能
- ✅ 用户认证
- ✅ 其他配置项

## 时间线

- **代码更新**：已完成 ✅
- **数据库迁移**：待执行 ⏳
- **验证测试**：待执行 ⏳
- **生产部署**：待执行 ⏳

## 联系支持

如果迁移过程中遇到问题，请检查：
1. 数据库配置是否正确更新
2. 应用是否重启以加载新配置
3. 浏览器缓存是否已清理
