## 上下文

Canvas Agent 当前通过 `createCanvasAgentOpenRouterChatModel()` 创建聊天模型，默认模型值也是 `google/gemini-2.5-flash-lite`。这意味着“模型品牌”和“接入协议”目前是错位的：名称是 Gemini，协议却是 OpenRouter。

仓库中已经存在：

- 后端 `gemini_api_key` 配置项
- 面向旧 AI 扩展体系的 Gemini provider
- Canvas Agent 的统一模型工厂入口

因此最小改动路径不是重写 Agent，而是在模型工厂层增加 provider 路由。

## 目标 / 非目标

- 目标：
  - Gemini 模型走 Gemini SDK
  - 非 Gemini 模型继续走 OpenRouter
  - 保持 Agent 调用方接口尽量不变
- 非目标：
  - 不统一全站所有 AI provider 抽象
  - 不重写 Mastra Agent 业务逻辑

## 决策

- 决策：在 `src/mastra` 内新增独立的聊天模型工厂层，而不是继续把所有逻辑塞进 `canvas-openrouter.ts`
- 原因：
  - 命名更准确，避免“Gemini 却在 openrouter 文件里创建”的混乱
  - 后续接入更多直连 provider 时更容易扩展

## 风险 / 权衡

- 风险：Gemini SDK 与 OpenRouter 支持的推理参数不完全一致
  - 缓解：对 Gemini 路径只传递 Gemini 支持的配置，其余参数忽略或降级
- 风险：当前默认模型值可能仍是 `google/gemini-*`
  - 缓解：保留默认值，但把 provider 改为 Gemini SDK 直连

## 迁移计划

1. 引入 Gemini SDK 依赖
2. 抽离统一聊天模型工厂
3. 将现有 Agent 创建点迁移到新工厂
4. 运行类型检查并验证配置错误路径
