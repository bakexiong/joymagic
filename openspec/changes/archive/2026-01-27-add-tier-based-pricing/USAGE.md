# Tier-Based 层级计费使用说明

## 功能概述

Tier-based 层级计费允许根据参数值（如图片数量、视频时长）自动匹配到对应的层级进行计费。系统会自动向上取整到最近的层级。

## 使用步骤

### 1. 创建 Tier-Based 场景

在 Admin Pricing 页面：

1. 点击"添加场景"按钮
2. 填写场景信息：
   - **场景名称**：例如 `tier-image-generator`
   - **类型**：选择"动态积分 (Dynamic)"
   - **计算器类型**：选择"层级计费 (Tier Based)"
3. 配置层级参数：
   - **层级参数名称**：输入参数名（如 `num_images`）
   - **层级列表**：添加层级值（如 5, 10, 15, 30）
4. 点击"添加"保存

### 2. 配置 Provider 层级定价

目前 Provider 层级定价需要通过 API 或数据库直接配置。

#### 方法 1：通过 API 配置

发送 POST 请求到 `/api/admin/pricing`：

```json
{
  "providers": [
    {
      "name": "Provider Name",
      "scenarios": [
        {
          "name": "tier-image-generator",
          "costPrice": 0.01,
          "profitMargin": 0.3,
          "tierPricing": {
            "5": {
              "costPrice": 0.05,
              "profitMargin": 0.3
            },
            "10": {
              "costPrice": 0.08,
              "profitMargin": 0.3
            },
            "15": {
              "costPrice": 0.12,
              "profitMargin": 0.3
            },
            "30": {
              "costPrice": 0.20,
              "profitMargin": 0.3
            }
          }
        }
      ]
    }
  ]
}
```

#### 方法 2：通过数据库配置

直接编辑数据库中的 `pricing_config` 配置，在对应 provider 的场景中添加 `tierPricing` 字段。

### 3. 使用场景

客户端调用 API 时，系统会自动根据参数值匹配层级：

```javascript
// 请求 3 张图片
POST /api/ai/tier-image-generator/generate
{
  "num_images": 3,
  // 其他参数...
}
// 系统会按层级 5 计费
```

```javascript
// 请求 12 张图片
POST /api/ai/tier-image-generator/generate
{
  "num_images": 12,
  // 其他参数...
}
// 系统会按层级 15 计费
```

## 层级匹配规则

- **小于最小层级**：按最小层级计费（如请求 3 张，层级 [5, 10, 15, 30]，按 5 计费）
- **在两个层级之间**：向上取整到较大层级（如请求 7 张，按 10 计费）
- **大于最大层级**：按最大层级计费（如请求 35 张，按 30 计费）

## 配置示例

### 示例 1：图片生成按数量计费

```json
{
  "场景配置": {
    "name": "batch-image-gen",
    "type": "dynamic",
    "calculator": "tier-based",
    "params": {
      "tiers": {
        "paramName": "num_images",
        "tiers": [5, 10, 15, 30]
      }
    }
  },
  "Provider 定价": {
    "tierPricing": {
      "5": { "costPrice": 0.05, "profitMargin": 0.3 },
      "10": { "costPrice": 0.08, "profitMargin": 0.3 },
      "15": { "costPrice": 0.12, "profitMargin": 0.3 },
      "30": { "costPrice": 0.20, "profitMargin": 0.3 }
    }
  }
}
```

### 示例 2：视频生成按时长计费

```json
{
  "场景配置": {
    "name": "tier-video-gen",
    "type": "dynamic",
    "calculator": "tier-based",
    "params": {
      "tiers": {
        "paramName": "duration",
        "tiers": [5, 10, 15, 30]
      }
    }
  },
  "Provider 定价": {
    "tierPricing": {
      "5": { "costPrice": 0.10, "profitMargin": 0.3 },
      "10": { "costPrice": 0.18, "profitMargin": 0.3 },
      "15": { "costPrice": 0.25, "profitMargin": 0.3 },
      "30": { "costPrice": 0.45, "profitMargin": 0.3 }
    }
  }
}
```

## 高级配置

### 为每个层级配置独立的 API 端点

```json
{
  "tierPricing": {
    "5": {
      "costPrice": 0.05,
      "profitMargin": 0.3,
      "apiEndpoint": "/api/provider/batch-small",
      "requestParams": [
        {
          "name": "batch_size",
          "source": "static",
          "value": "5"
        }
      ]
    },
    "30": {
      "costPrice": 0.20,
      "profitMargin": 0.3,
      "apiEndpoint": "/api/provider/batch-large",
      "requestParams": [
        {
          "name": "batch_size",
          "source": "static",
          "value": "30"
        }
      ]
    }
  }
}
```

## 注意事项

1. **层级值必须是正数**
2. **层级列表至少需要一个值**
3. **层级参数名称必须与 API 请求参数匹配**
4. **每个层级都需要配置 costPrice**
5. **profitMargin 可选，不设置则使用默认利润率**

## 后续改进

Provider 层级定价的可视化配置界面正在开发中，届时可以直接在 Admin Pricing 页面中为每个层级配置定价，无需手动编辑 JSON。

## 故障排查

### 错误：No pricing configuration found for tier X

**原因**：该层级没有配置定价信息

**解决**：在 provider 的 `tierPricing` 中添加该层级的配置

### 错误：Parameter X not found in request params

**原因**：请求参数中缺少层级参数

**解决**：确保 API 请求中包含配置的层级参数（如 `num_images`）

### 错误：Tier configuration not found in params

**原因**：场景配置中缺少 tiers 配置

**解决**：检查场景的 params 配置，确保包含 `tiers` 对象
