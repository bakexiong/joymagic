# 设计文档：Wavespeed API 重构

## 上下文

当前项目存在两套并行的 API 路由系统：

1. **旧系统**：`/api/wavespeed/*` - 每个场景都有独立的实现文件
   - 例如：`/api/wavespeed/image-to-image/route.ts`
   - 例如：`/api/wavespeed/image-upscaler/status/route.ts`
   - 约 45 个路由文件

2. **新系统**：`/api/ai/[scene]/generate` 和 `/api/ai/status`
   - 统一的生成接口，通过 `pricing-config.ts` 配置驱动
   - 统一的状态查询接口，支持所有场景

前端组件中混合使用了两套系统，导致维护困难。

## 目标 / 非目标

### 目标
- 统一所有 API 路由到新的架构
- 简化代码维护，减少重复代码
- 确保所有场景都能正常工作
- 保持功能完整性（生成、状态查询、错误处理等）

### 非目标
- 不改变 API 的请求/响应格式（除非必要）
- 不改变业务逻辑（积分扣除、错误处理等）
- 不改变前端组件的用户界面

## 决策

### 决策 1：使用场景名称映射

**决策**：将旧的路径映射到场景名称，通过 `pricing-config.ts` 中的配置来驱动新路由。

**理由**：
- 新路由系统已经通过 `pricing-config.ts` 支持场景配置
- 场景名称已经在配置中定义，可以直接使用
- 避免硬编码路径映射

**场景名称映射示例**：
- `/api/wavespeed/image-to-image` → `/api/ai/image-to-image/generate`
- `/api/wavespeed/image-upscaler` → `/api/ai/image-upscaler/generate`
- `/api/wavespeed/flux-2-klein-image-to-image` → `/api/ai/flux-2-klein-image-to-image/generate`

### 决策 2：统一状态查询接口

**决策**：所有状态查询都使用 `/api/ai/status?taskId=xxx&scenario=xxx` 格式。

**理由**：
- `/api/ai/status` 已经实现了统一的状态查询逻辑
- 支持通过 `provider` 和 `scenario` 参数动态查询
- 减少了重复的状态查询代码

**迁移示例**：
- `/api/wavespeed/image-to-image/status` → `/api/ai/status?taskId=xxx&scenario=image-to-image`
- `/api/wavespeed/get-result` → `/api/ai/status?taskId=xxx&scenario=xxx`

### 决策 3：前端调用更新策略

**决策**：直接更新所有前端组件中的 API 调用路径，不保留向后兼容层。

**理由**：
- 项目处于开发阶段，可以接受破坏性变更
- 保留兼容层会增加代码复杂度
- 统一使用新路由可以避免混淆

**替代方案考虑**：
- 添加重定向层：在旧路由中添加重定向到新路由
- **否决原因**：增加不必要的代码，且可能隐藏问题

### 决策 4：工具函数处理

**决策**：保留 `common-handler.ts` 中的 `handleWavespeedAPIRequest` 函数，但考虑重命名。

**理由**：
- 该函数被 `/api/ai/[scene]/generate` 使用，是核心逻辑
- 重命名可以更好地反映其通用性（如 `handleAIGenerationRequest`）
- 但重命名不是本次重构的必需项，可以后续优化

## 风险 / 权衡

### 风险 1：场景配置缺失

**风险**：某些场景在 `pricing-config.ts` 中可能没有正确配置，导致迁移后无法工作。

**缓解措施**：
- 在任务 1.1 中全面审查所有场景配置
- 在迁移前验证每个场景都能通过新路由正常工作
- 如果发现配置缺失，先补充配置再迁移

### 风险 2：前端调用遗漏

**风险**：可能遗漏某些前端组件中的 API 调用，导致功能失效。

**缓解措施**：
- 使用 `grep` 全面搜索 `/api/wavespeed` 的使用
- 在任务 2 中列出所有需要更新的文件
- 在测试阶段验证所有组件功能正常

### 风险 3：状态查询参数不匹配

**风险**：旧的状态查询接口可能使用不同的参数格式，迁移后可能不兼容。

**缓解措施**：
- 审查 `/api/ai/status` 的实现，确保支持所有需要的参数
- 如果需要，扩展 `/api/ai/status` 以支持更多参数格式
- 在迁移时确保参数正确传递

### 风险 4：错误处理逻辑差异

**风险**：旧路由和新路由的错误处理逻辑可能不完全一致。

**缓解措施**：
- 对比旧路由和新路由的错误处理逻辑
- 确保新路由的错误处理覆盖所有旧路由的场景
- 在测试阶段重点验证错误处理

## 迁移计划

### 阶段 1：准备（任务 1）
- 审查配置和路由
- 确认所有场景都支持
- 列出迁移清单

### 阶段 2：前端迁移（任务 2）
- 按组件逐一更新 API 调用
- 更新状态查询调用
- 确保参数正确传递

### 阶段 3：后端清理（任务 3）
- 确认迁移完成
- 删除旧路由文件
- 清理未使用的工具函数

### 阶段 4：测试（任务 4）
- 功能测试
- 错误处理测试
- 积分系统测试

### 阶段 5：文档（任务 5）
- 更新文档
- 记录变更

## 待决问题

- [ ] 是否需要保留 `utils.ts` 中的某些工具函数？
- [ ] `handleWavespeedAPIRequest` 是否需要重命名？如果需要，新名称是什么？
- [ ] 是否有其他系统或服务依赖 `/api/wavespeed` 路径？（需要检查外部集成）
