# 实施任务清单

## 阶段 1：后端基础实现

### 任务 1.1：添加 tier-based 计算器类型定义
- [x] 在 `src/config/credit-config.ts` 中的 `CreditCalculator` 类型添加 `'tier-based'`
- [x] 在 `src/shared/models/pricing-config.ts` 中的 `CreditCalculator` 类型添加 `'tier-based'`
- [x] 确保类型定义在两个文件中保持一致

**验证**：TypeScript 编译通过，无类型错误

---

### 任务 1.2：实现层级匹配算法
- [x] 在 `src/config/credit-config.ts` 中实现 `findMatchingTier` 函数
- [x] 实现层级排序逻辑
- [x] 实现边界条件处理（小于最小值、大于最大值）
- [x] 实现层级查找逻辑（向上取整到最近的层级）

**验证**：
- 输入 3，层级 [5, 10, 15, 30]，返回 5
- 输入 7，层级 [5, 10, 15, 30]，返回 10
- 输入 35，层级 [5, 10, 15, 30]，返回 30

---

### 任务 1.3：实现 tier-based 积分计算函数
- [x] 在 `src/config/credit-config.ts` 中实现 `calculateTierBasedCredits` 函数
- [x] 从 `params` 中提取层级参数配置（`paramName`, `tiers`）
- [x] 从请求参数中获取实际值
- [x] 调用 `findMatchingTier` 找到匹配的层级
- [x] 返回匹配的层级值（用于后续查找定价）

**验证**：函数能够正确返回匹配的层级值

---

### 任务 1.4：集成 tier-based 计算器到积分计算流程
- [x] 在 `calculateDynamicCredits` 函数的 switch 语句中添加 `'tier-based'` case
- [x] 调用 `calculateTierBasedCredits` 获取匹配的层级
- [x] 在 `calculateRequiredCredits` 函数中添加 tier-based 的处理逻辑
- [x] 从 `scenarioPricing.tierPricing[tier]` 中获取该层级的定价配置
- [x] 使用 `calculateCreditsFromCost` 计算最终积分

**验证**：tier-based 场景能够正确计算积分

---

## 阶段 2：数据模型扩展

### 任务 2.1：扩展场景配置数据结构
- [x] 在 `DynamicCreditConfig` 的 `params` 中支持 `tiers` 配置
- [x] 定义 `TierConfig` 接口：
  ```typescript
  interface TierConfig {
    paramName: string;
    tiers: number[];
    min?: number;
    max?: number;
  }
  ```
- [x] 更新相关类型定义和文档注释

**验证**：TypeScript 类型检查通过

---

### 任务 2.2：扩展 Provider 定价配置
- [x] 在 `PricingConfigData` 的场景配置中添加 `tierPricing` 字段
- [x] 定义 `TierPricing` 类型：
  ```typescript
  interface TierPricing {
    [tier: number]: {
      costPrice: number;
      profitMargin?: number;
      apiEndpoint?: string;
      requestParams?: any[];
      responseMapping?: any;
      statusQueryEndpoint?: string;
      statusQueryParams?: any[];
      statusQueryResponseMapping?: any;
    }
  }
  ```
- [x] 更新 `src/shared/models/pricing-config.ts` 中的类型定义

**验证**：TypeScript 类型检查通过

---

## 阶段 3：前端场景配置界面

### 任务 3.1：添加 tier-based 计算器选项
- [x] 在 `src/app/[locale]/(admin)/admin/pricing/page.tsx` 的计算器选择下拉框中添加 `tier-based` 选项
- [x] 更新 `getCalculatorDefaultParams` 函数，添加 tier-based 的默认参数

**验证**：管理员可以在添加场景时选择 tier-based 计算器

---

### 任务 3.2：实现层级配置界面
- [x] 当选择 tier-based 计算器时，显示层级配置表单
- [x] 添加"层级参数名称"输入框（如 `num_images`, `duration`）
- [x] 添加"层级列表"输入区域，支持添加/删除层级值
- [x] 添加层级值输入框和"添加层级"按钮
- [x] 显示已添加的层级列表，每个层级有删除按钮
- [x] 添加最小值和最大值输入框（可选）

**验证**：
- 管理员可以输入层级参数名称
- 管理员可以添加多个层级值
- 管理员可以删除已添加的层级值
- 层级列表自动排序显示

---

### 任务 3.3：添加层级配置验证
- [x] 验证层级参数名称不为空
- [x] 验证层级列表至少有一个值
- [x] 验证层级值为正数
- [x] 验证层级值无重复
- [x] 在保存前显示验证错误

**验证**：
- 空参数名称无法保存
- 空层级列表无法保存
- 重复层级值显示错误提示

---

## 阶段 4：前端 Provider 层级定价界面

### 任务 4.1：检测 tier-based 场景并显示层级定价表格
- [x] 在 provider 的场景列表中，检测场景是否使用 tier-based 计算器
- [x] 如果是 tier-based 场景，从场景配置中读取层级列表
- [x] 显示层级定价表格，每个层级一行

**验证**：tier-based 场景显示层级定价表格

---

### 任务 4.2：实现层级定价表格
- [x] 表格列：层级值、成本价格、利润率、售价、积分、操作
- [x] 每行显示一个层级的定价信息
- [x] 成本价格和利润率可编辑
- [x] 售价和积分自动计算并显示
- [x] 添加"展开/收起 API 配置"按钮（可选）

**验证**：
- 表格正确显示所有层级
- 成本价格和利润率可以编辑
- 售价和积分自动更新

---

### 任务 4.3：实现层级 API 配置（可选）
- [ ] 在展开的区域显示 API 配置表单
- [ ] 支持配置 apiEndpoint、requestParams、responseMapping
- [ ] 支持配置 statusQueryEndpoint、statusQueryParams、statusQueryResponseMapping
- [ ] 参考现有的参数组合 API 配置界面

**验证**：管理员可以为每个层级配置独立的 API 端点和参数

---

### 任务 4.4：实现层级定价保存
- [x] 收集所有层级的定价配置
- [x] 构建 `tierPricing` 对象
- [x] 在保存 provider 配置时包含 `tierPricing`
- [x] 调用 `/api/admin/pricing` 接口保存

**验证**：
- 层级定价配置能够正确保存到数据库
- 刷新页面后配置正确显示

---

## 阶段 5：后端 API 支持

### 任务 5.1：更新 pricing API 以支持 tierPricing
- [x] 在 `src/app/api/admin/pricing/route.ts` 中处理 `tierPricing` 字段
- [x] 确保 `tierPricing` 正确保存到数据库
- [x] 确保 `tierPricing` 正确从数据库读取

**验证**：
- POST 请求能够保存 tierPricing
- GET 请求能够返回 tierPricing

---

### 任务 5.2：更新 pricing-config 以支持 tierPricing
- [x] 在 `src/config/pricing-config.ts` 的 `getScenarioPricingAsync` 中处理 `tierPricing`
- [x] 确保 `tierPricing` 正确传递到积分计算函数

**验证**：积分计算函数能够访问 tierPricing 配置

---

## 阶段 6：测试和验证

### 任务 6.1：端到端测试
- [ ] 创建一个测试场景，使用 tier-based 计算器
- [ ] 配置层级列表 [5, 10, 15, 30]
- [ ] 在 provider 中为每个层级配置不同的成本价格
- [ ] 测试不同参数值的积分计算：
  - 参数值 3 → 应按层级 5 计费
  - 参数值 7 → 应按层级 10 计费
  - 参数值 12 → 应按层级 15 计费
  - 参数值 35 → 应按层级 30 计费

**验证**：所有测试用例通过，积分计算正确

---

### 任务 6.2：边界条件测试
- [ ] 测试空层级列表（应显示错误）
- [ ] 测试单个层级（应正常工作）
- [ ] 测试负数参数值（应按最小层级计费或显示错误）
- [ ] 测试非常大的参数值（应按最大层级计费）

**验证**：所有边界条件正确处理

---

### 任务 6.3：UI/UX 测试
- [ ] 测试层级配置界面的用户体验
- [ ] 测试层级定价表格的响应式布局
- [ ] 测试表单验证和错误提示
- [ ] 测试保存和加载流程

**验证**：界面友好，操作流畅，无明显 bug

---

## 阶段 7：文档和清理

### 任务 7.1：更新代码注释
- [ ] 为新增的函数添加 JSDoc 注释
- [ ] 为新增的类型添加说明注释
- [ ] 更新相关配置文件的注释

**验证**：代码注释完整清晰

---

### 任务 7.2：更新用户文档（如果需要）
- [ ] 在管理员文档中添加 tier-based 计费说明
- [ ] 添加配置示例和最佳实践

**验证**：文档清晰易懂

---

## 依赖关系

- 任务 1.2 依赖 1.1
- 任务 1.3 依赖 1.2
- 任务 1.4 依赖 1.3
- 任务 2.1 和 2.2 可以并行
- 任务 3.1 依赖 1.1
- 任务 3.2 依赖 3.1 和 2.1
- 任务 3.3 依赖 3.2
- 任务 4.1 依赖 2.2 和 3.2
- 任务 4.2 依赖 4.1
- 任务 4.3 依赖 4.2
- 任务 4.4 依赖 4.2
- 任务 5.1 和 5.2 依赖阶段 2
- 任务 6.1 依赖所有前面的阶段
- 任务 6.2 和 6.3 依赖 6.1
- 任务 7.1 和 7.2 可以在任何时候进行

## 可并行工作

- 阶段 1 和阶段 2 可以并行
- 任务 3.1、3.2、3.3 完成后，阶段 4 可以并行进行
- 任务 5.1 和 5.2 可以并行
- 任务 6.2 和 6.3 可以并行
- 任务 7.1 和 7.2 可以并行
