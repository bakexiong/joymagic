## 1. 准备阶段

- [x] 1.1 审查所有 `/api/wavespeed` 路由，确认每个场景在 `pricing-config.ts` 中都有配置
- [x] 1.2 验证 `/api/ai/[scene]/generate` 和 `/api/ai/status` 已支持所有需要的场景
- [x] 1.3 列出所有需要迁移的场景和对应的前端组件
- [x] 1.4 确认场景名称映射关系（从旧路径到新路径）

## 2. 前端迁移

- [x] 2.1 更新 `image-to-image` 组件：将 `/api/wavespeed/image-to-image` 改为 `/api/ai/image-to-image/generate`
- [x] 2.2 更新 `image-upscaler` 组件：将 `/api/wavespeed/image-upscaler` 改为 `/api/ai/image-upscaler/generate`
- [x] 2.3 更新 `image-background-remover` 组件：将 `/api/wavespeed/image-background-remover` 改为 `/api/ai/image-background-remover/generate`
- [x] 2.4 更新 `image-eraser` 组件：将 `/api/wavespeed/image-eraser` 改为 `/api/ai/image-eraser/generate`
- [x] 2.5 更新 `flux-2-klein-image-to-image` 组件：将 `/api/wavespeed/flux-2-klein-image-to-image` 改为 `/api/ai/flux-2-klein-image-to-image/generate`
- [x] 2.6 更新所有文本到图像组件（gpt-image-1, seedream, qwen, nano-banana 等）
- [x] 2.7 更新所有视频生成组件（text-to-video, image-to-video 等）
- [x] 2.8 更新 `longcat-avatar` 组件
- [x] 2.9 更新 `kling-v2.6-pro/motion-control` 组件
- [x] 2.10 更新 `qwen-image-layered` 组件
- [x] 2.11 更新 `video-face-swap` 组件
- [x] 2.12 更新 `wavespeed-image-generator` 组件
- [x] 2.13 更新所有状态查询调用：将 `/api/wavespeed/*/status` 改为 `/api/ai/status?taskId=xxx&scenario=xxx`
- [x] 2.14 更新所有 `get-result` 和 `get-video-result` 调用：迁移到 `/api/ai/status`

## 3. 后端清理

- [x] 3.1 确认所有场景都已迁移到新路由
- [x] 3.2 删除 `/src/app/api/wavespeed/` 目录下的所有路由文件
- [x] 3.3 检查并清理 `utils.ts` 中不再使用的工具函数（如果存在）
- [x] 3.4 验证 `common-handler.ts` 中的 `handleWavespeedAPIRequest` 函数是否仍被使用（可能需要重命名）

## 4. 测试与验证

### 4.1 功能测试

- [x] 4.1.1 测试所有图像生成场景（text-to-image, image-to-image, image-upscaler 等）
- [x] 4.1.2 测试所有视频生成场景（text-to-video, image-to-video 等）
- [x] 4.1.3 测试所有状态查询功能
- [x] 4.1.4 测试同步响应场景（直接返回结果）
- [x] 4.1.5 测试异步响应场景（返回任务 ID，需要轮询）
- [x] 4.1.6 测试嵌套场景名称（如 `text-to-video/ltx-2-fast`）

### 4.2 错误处理测试

- [x] 4.2.1 测试未认证用户访问（应返回认证错误）
- [x] 4.2.2 测试参数验证失败（缺少必需参数、类型错误等）
- [x] 4.2.3 测试场景不存在（应返回错误并列出可用场景）
- [x] 4.2.4 测试积分不足（应返回错误，不扣除积分）
- [x] 4.2.5 测试 Provider 配置缺失
- [x] 4.2.6 测试 API Key 配置缺失
- [x] 4.2.7 测试外部 API 调用失败（网络错误、超时）
- [x] 4.2.8 测试外部 API 返回错误状态码（400, 500 等）
- [x] 4.2.9 测试请求体 JSON 解析失败
- [x] 4.2.10 测试状态查询时 taskId 缺失
- [x] 4.2.11 测试状态查询时任务不存在
- [x] 4.2.12 测试状态查询配置缺失
- [x] 4.2.13 测试状态查询超时
- [x] 4.2.14 测试状态响应解析失败

### 4.3 积分系统测试

- [x] 4.3.1 验证积分扣除逻辑（正常扣除）
- [x] 4.3.2 验证积分退还逻辑（任务失败时自动退还）
- [x] 4.3.3 验证免费生成额度使用（如果支持）
- [x] 4.3.4 验证积分不足时的错误处理
- [x] 4.3.5 验证并发请求时的积分扣除（每个请求独立）
- [x] 4.3.6 验证任务失败时的积分退还（不重复退还）

### 4.4 任务管理测试

- [x] 4.4.1 验证任务记录创建（异步任务）
- [x] 4.4.2 验证任务状态更新（pending → processing → completed/failed）
- [x] 4.4.3 验证任务结果保存（outputs, error 等）
- [x] 4.4.4 验证任务元数据保存（场景、参数等）
- [x] 4.4.5 验证多次查询同一任务的状态（不应重复更新）

### 4.5 前端集成测试

- [x] 4.5.1 检查所有前端组件在迁移后功能正常
- [x] 4.5.2 验证前端错误处理（显示友好错误消息）
- [x] 4.5.3 验证前端任务轮询逻辑（正确停止轮询）
- [x] 4.5.4 验证前端网络错误处理
- [x] 4.5.5 验证前端积分不足提示
- [x] 4.5.6 验证前端认证错误提示（引导登录）

### 4.6 边界条件测试

- [x] 4.6.1 测试场景名称大小写敏感性
- [x] 4.6.2 测试参数类型转换（字符串数字 → 数字）
- [x] 4.6.3 测试可选参数和默认值
- [x] 4.6.4 测试并发请求处理
- [x] 4.6.5 测试请求取消场景
- [x] 4.6.6 测试状态未知场景（返回 _debug 信息）
- [x] 4.6.7 测试结果格式多样性（单个 output vs outputs 数组）
- [x] 4.6.8 测试 Provider 和 Scenario 自动推断

### 4.7 性能测试

- [x] 4.7.1 测试 API 响应时间（应在合理范围内）
- [x] 4.7.2 测试状态查询性能（不应阻塞）
- [x] 4.7.3 测试并发请求性能

## 5. 文档更新

- [x] 5.1 更新 API 文档（如果有）
- [x] 5.2 更新开发文档中的 API 路由说明
- [x] 5.3 添加迁移说明到 CHANGELOG（如果有）
