# 变更：统一 Canvas Agent 在已有节点时的归属判定与生成触发流程

## 为什么

当前 Canvas Agent 在画布里已经存在历史节点时，用户继续输入新的自然语言需求，系统在“沿用原节点继续创作”与“另起一组新节点”之间缺少稳定协议；同时 `auto` 与 `ask` 在节点创建后何时真正触发 `/generate` 的时机也还不统一。这样会导致三类问题：

- 用户本意是“沿着已有节点继续编辑或继续生成”，但系统误判成“再新建一组节点”
- 用户只是想“另起一个新方向”，但系统可能错误复用当前选择或上下文
- 节点虽然已经创建，但 `auto` 与 `ask` 在是否立即生成、是否先弹场景卡确认上表现不一致，导致体验不可预测

随着画布里节点越来越多，这种歧义会直接影响创作效率和结果可控性，因此需要同时收敛：

- 已有节点时的“原节点新增 / 新建分组”判定流程
- `auto` 与 `ask` 两种模式下的生成触发时机

## 变更内容

- 为 Canvas Agent 增加统一的“节点归属判定”能力
- 当项目中已经存在可继续创作的已生成节点，且用户本轮请求未明确说明是继续沿用原节点还是另起新组时，系统必须先发起澄清
- 如果用户当前显式选中了节点，Agent 必须优先把该选择作为“沿用原节点”的候选上下文，而不是直接忽略
- 当用户选择“在原节点上新增”时，后续 workflow 必须在原节点上下文中新增一个节点，而不是覆盖原节点
- 当用户选择“新建节点”时，后续 workflow 必须创建新的节点组，并在组内新增文本节点和对应 workflow 节点
- 统一 `auto` 与 `ask` 的短提示词处理：提示词过短时只返回建议卡片，不建节点、不触发生成
- 明确 `auto` 与 `ask` 的生成触发差异：
  - `auto`：节点创建完成后立即调用 `/generate`
  - `ask`：节点创建完成后先弹对应场景卡，用户确认后再调用 `/generate`

## 影响

- 受影响规范：
  - `canvas-agent-platform`
- 受影响代码：
  - `src/mastra/agents/canvas-supervisor-agent.ts`
  - `src/mastra/workflows/canvas-chat-request-workflow.ts`
  - `src/shared/services/canvas-agent/canvas-agent-message-handler.ts`
  - `src/shared/services/canvas-agent/canvas-agent-read-context.ts`
  - `src/shared/lib/canvas-agent-message-cards.ts`
  - `src/shared/blocks/creator-workbench/canvas/agent/canvas-agent-json-cards.tsx`
  - `src/shared/blocks/creator-workbench/canvas/page/canvas-page-shell.tsx`
