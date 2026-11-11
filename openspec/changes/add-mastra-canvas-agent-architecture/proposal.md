# 变更：使用 Mastra 重构 Create Canvas 智能体架构

## 为什么

当前 `/[locale]/create/canvas` 已经有了画布、节点、生成适配层和本地 Agent 预留接口，但智能体能力仍主要停留在前端页面内编排：

- 聊天意图解析、节点创建和生成触发耦合在单页组件中
- 没有稳定的服务端 Agent 运行时，无法承载多轮上下文、版本化 prompt、子智能体分工和可观测性
- 无法让运营、提示词工程或产品团队在不改代码的前提下迭代智能体行为
- 后续如果继续堆叠“营销视频 / 电商主图 / 品牌设计”等专用智能体，前端逻辑会快速膨胀

Mastra 的官方能力边界正好对应这类场景：

- `Agent` 适合开放式聊天与工具决策
- `Workflow` 适合确定步骤的执行链路
- `Memory` 适合围绕项目维持多轮上下文
- `Editor` 适合把 prompt、工具描述和版本管理从代码中解耦出来

因此需要把 Create Canvas 的智能体升级为一套正式的 Mastra 架构，而不是继续维持前端本地编排。

## 变更内容

- 新增独立能力 `canvas-agent-platform`，定义 Create Canvas 智能体的服务端架构
- 采用 `Mastra + code-defined agents + Editor overrides` 的双层模式
- 引入 `Supervisor Agent + 专用子 Agent + Workflow` 的分层编排
- 将现有画布图、生成链路、上传、模板、历史和项目持久化封装为 Mastra tools
- 将多轮聊天上下文、项目上下文和用户偏好接入 Mastra memory，而不是仅保留前端短态
- 为 `/{locale}/create/canvas/[projectId]` 定义正式的 Agent 会话、线程标识、资源标识和服务端 API
- 定义“聊天消息 -> 结构化操作计划 -> 画布更新 -> 生成执行 -> 结果回流”的标准链路
- 为智能体聊天消息增加独立计费能力，并与图片 / 视频生成计费分账
- 定义智能体版本管理、灰度发布和编辑器接管边界，使非开发角色可以调优 prompt 与工具描述

## 非目标

- 不替换现有图片 / 视频生成 API、本地上传接口或积分系统
- 不要求所有节点编辑都实时走服务端；低延迟的纯 UI 操作仍可本地完成
- 不在本次提案中落地多人协作、实时共享、评论或权限流转
- 不要求首版接入完整自动评测闭环，只预留后续接入 Editor / Experiments 的空间
- 不在前端暴露任何 Mastra provider key、模型 key 或第三方集成密钥

## 影响

- 受影响规范：
  - `workflow-canvas-creator`
  - 新增 `canvas-agent-platform`
- 受影响代码：
  - 可能新增 `src/mastra/index.ts`
  - 可能新增 `src/mastra/agents/*`
  - 可能新增 `src/mastra/workflows/*`
  - 可能新增 `src/mastra/tools/*`
  - 可能新增 `src/mastra/prompts/*`
  - 可能新增 `src/app/api/agent/canvas/*`
  - `src/shared/blocks/creator-workbench/canvas/adapters/canvas-agent-adapter.ts`
  - `src/shared/blocks/creator-workbench/canvas/page/canvas-page-shell.tsx`
  - `src/shared/models/workbench-canvas-project.ts`
  - 与现有生成、上传、模板、历史读取相关的服务层
