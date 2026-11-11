# 变更：重构 AI 生成与状态查询管线

## 为什么
当前 `/api/ai/[scene]/generate`、`/api/ai/status`、`common-handler` 和 webhook notify 路由中混合了认证、参数归一、计费、外部请求、状态映射、退款、任务持久化、NSFW 检查、生成结果入库和存储镜像等逻辑。重复实现多、单文件过大，继续追加场景或修复结果存储时很容易引入回归。

本次重构目标是把路由层变薄，将生成提交、状态同步、任务终态处理和结果持久化拆成可测试的服务模块，同时保持现有前端接口和响应结构兼容。

## 变更内容
- 拆分统一生成服务：负责场景解析、参数验证、计费、任务创建、外部 Provider 请求和同步/异步响应归一。
- 拆分统一状态服务：负责本地终态短路、Provider 状态查询、状态映射、输出抽取和任务状态更新。
- 抽出任务终态处理：统一成功、失败、退款、NSFW 拦截、AI Character 同步、workbench creation 和 R2 镜像等副作用。
- 合并重复工具函数：状态映射、嵌套路径读取、输出数组归一、task options 解析、Provider/Scene 推断等只保留一套实现。
- 保持公开 API 兼容：前端仍使用 `/api/ai/[scene]/generate` 和 `/api/ai/status`，旧 `/api/ai/generate` 暂时保留兼容但不再承载新逻辑。
- 增加聚焦测试：覆盖生成提交、状态轮询、同步结果、失败退款、重复终态、R2 异步镜像不影响响应等核心路径。

## 影响
- 受影响规范：`api-routing`
- 受影响代码：
  - `src/app/api/ai/[scene]/generate/route.ts`
  - `src/app/api/ai/status/route.ts`
  - `src/app/api/common-handler.ts`
  - `src/app/api/ai/notify/[provider]/route.ts`
  - `src/shared/lib/generated-output-r2.ts`
  - 新增 `src/server/ai-generation/*` 或同等后端服务目录
- 非目标：
  - 不改变前端生成接口路径和主体响应格式
  - 不改 `/content` 下 MDX
  - 不把任何 API key 下放到前端
  - 不重写 pricing-config 数据结构，除非发现必须补充类型边界
