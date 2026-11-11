# 变更：Canvas Agent 为 Gemini 模型接入 Gemini SDK

## 为什么

当前 Canvas Agent 的聊天模型统一通过 OpenRouter provider 创建，即使模型标识本身是 `google/gemini-*`，也仍然走 OpenRouter 协议。这带来几个问题：

- Gemini 模型无法直接使用项目已有的 `gemini_api_key` 配置
- Gemini 专属能力和参数需要被适配到 OpenRouter 语义，增加了协议耦合
- 模型接入层缺少明确的 provider 路由规则，不利于后续扩展更多直连 provider

因此需要为 Canvas Agent 增加显式的 provider 路由：当所选模型属于 Gemini 时，改为服务端直连 Gemini SDK；非 Gemini 模型继续沿用 OpenRouter。

## 变更内容

- 为 Canvas Agent 新增模型 provider 路由层
- 当模型标识属于 Gemini 时，服务端必须使用 Gemini SDK 创建聊天模型
- 非 Gemini 模型继续使用 OpenRouter provider，保持现有行为不变
- 复用现有后端 `gemini_api_key` 配置，不在前端暴露任何 Gemini 密钥
- 为 Gemini 与 OpenRouter 分别定义缺省配置校验与错误提示

## 非目标

- 不改造现有 `/api/ai/[scene]/generate` 图像/视频生成协议
- 不要求一次性把全站所有 Gemini 调用都迁移到统一 SDK
- 不改变前端 Canvas Agent 的消息协议和 UI 结构
- 不在本次变更中引入新的前端配置项或暴露 provider 选择开关

## 影响

- 受影响规范：
  - `canvas-agent-platform`
- 受影响代码：
  - `src/mastra/openrouter/canvas-openrouter.ts`
  - 可能新增 `src/mastra/providers/*`
  - 可能更新 `package.json`
  - 与 Canvas Agent 模型初始化相关的 `src/mastra/agents/*`
