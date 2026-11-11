# 设计：AI 生成与状态查询管线重构

## 上下文
现有实现的核心问题不是单个 bug，而是边界长期堆叠：路由文件直接处理业务流程、Provider 适配、数据库状态、副作用和响应兼容。`status` 与 `notify` 中存在相似的状态映射和输出抽取，`common-handler` 同时承担通用 Provider 调用、计费、任务创建和同步响应处理。

## 目标
- 路由层只做参数读取和调用服务。
- 所有生成任务都经过统一的 `submitGeneration` 流程。
- 所有状态查询和 webhook 回调都复用统一的 `syncGenerationStatus` / `finalizeGenerationTask` 流程。
- 任务终态副作用可重复调用且幂等。
- 对外响应保持兼容，避免一次性要求前端大改。

## 非目标
- 不引入新的队列系统。
- 不改变积分定价配置来源。
- 不改变前端调用路径。
- 不迁移数据库 schema，除非实现中发现现有字段无法表达必要状态。

## 拟议模块

### `src/server/ai-generation/config`
职责：
- 解析 scene/provider/pricing/status query 配置。
- 解析动态 endpoint、param combinations 和 request params。
- 提供类型化的 `GenerationScenarioContext`。

### `src/server/ai-generation/request`
职责：
- 解析请求体。
- 根据 `requestParams` 做参数验证、默认值和类型转换。
- 执行场景特定 body normalizer，例如 Seedance 2.0 first_frame 归一。
- 执行 prompt moderation / prompt optimizer 的输入输出封装。

### `src/server/ai-generation/billing`
职责：
- 计算所需积分。
- 处理免费生成额度。
- 扣费和失败退款。
- 防止终态重复退款。

### `src/server/ai-generation/provider`
职责：
- 构建外部 Provider 请求。
- 发起外部请求并解析响应。
- 提取 requestId、status、output、outputs、error。
- 统一网络错误和 Provider 错误格式。

### `src/server/ai-generation/tasks`
职责：
- 创建和更新 `ai_task`。
- 解析 task options/result。
- 本地终态短路，避免完成任务重复打 Provider。
- 更新 AI Character 相关快照。

### `src/server/ai-generation/finalize`
职责：
- 成功终态：归一输出、更新 taskResult、写入 workbench creation、触发 R2 镜像。
- 失败终态：更新失败结果、执行一次退款。
- NSFW 终态：标记失败但按现有策略处理退款。
- 所有副作用必须允许重复调用，不应因为已存在记录而报错。

## 兼容策略
- `/api/ai/[scene]/generate` 保持当前请求和响应契约。
- `/api/ai/status` 保持 `taskId/requestId` 查询参数兼容。
- 响应继续同时返回 `output` 和 `outputs`。
- 已完成任务查询优先返回 DB 中的结果，缺失时再查询 Provider。
- R2 镜像通过 `after()` 或等效后台副作用执行；失败只记录日志，不影响接口成功响应。

## 迁移步骤
1. 先抽纯函数和服务，不改路由行为。
2. 将 `/api/ai/[scene]/generate` 切到新 submit service。
3. 将 `/api/ai/status` 切到新 status service。
4. 将 webhook notify 切到同一 finalize service。
5. 清理 `common-handler` 中不再使用的重复逻辑。
6. 最后处理旧 `/api/ai/generate` 的兼容封装。

## 风险与缓解
- 积分重复扣退风险：终态服务必须基于 task 当前状态和 creditId/options 做幂等保护。
- Provider 响应差异风险：先保留现有 responseMapping 能力，并为常见输出结构写测试。
- 前端兼容风险：保留现有响应字段和错误消息关键字。
- 存储耗时风险：生成结果镜像 R2 继续异步执行，禁止阻塞生成和状态接口。
