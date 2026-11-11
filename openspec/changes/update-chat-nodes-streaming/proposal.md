# 变更：统一所有聊天节点为流式返回

## 为什么

当前项目内至少存在两类用户可见的聊天入口：

- 标准聊天 `/api/chat`
- Create Canvas 智能体聊天 `/api/agent/canvas/message`

它们的返回方式并不一致：

- 标准聊天已经支持文本流式输出
- Canvas 聊天仍以“一次性返回最终结果”为主，导致前端只能显示本地占位态，无法及时呈现 `thinking / reasoning / step progress`

这种不一致会带来几个直接问题：

- 用户在不同聊天入口获得的反馈节奏不同，体验割裂
- Canvas 智能体的意图规划、提示词优化、场景路由等中间信息无法实时展示
- 前端需要为不同聊天入口维护不同的数据消费逻辑，后续扩展成本更高
- 后续如果新增更多聊天节点，会继续复制“同步返回”和“流式返回”两套模式

因此需要把项目中的聊天节点统一收敛到流式协议下，并明确中间事件、最终结果和持久化时机。

## 变更内容

- 将所有用户可见聊天节点统一为流式返回模式
- 为 Canvas 聊天工作流增加正式的流式中间事件，至少覆盖：
  - 意图规划 reasoning
  - 提示词优化 reasoning
  - 场景路由 reasoning
  - 关键步骤状态变化
- 统一前端聊天消费层，确保不同聊天入口都能显示：
  - streaming 文本
  - thinking / reasoning
  - 最终完成结果
  - 失败与中断状态
- 明确聊天消息的持久化时机，避免流式过程中产生重复消息或脏状态
- 保持所有 key 仍只在后端使用，不向前端暴露任何 provider key

## 非目标

- 不改动图片/视频生成节点本身的执行逻辑
- 不在本次提案中引入新的聊天产品入口
- 不重写现有数据库表结构，除非流式持久化确有必要
- 不要求一次性把所有非聊天长任务都改成流式

## 影响

- 受影响规范：
  - 新增 `chat-streaming`
  - 可能修改 `canvas-agent-platform`
- 受影响代码：
  - `src/app/api/chat/route.ts`
  - `src/app/api/agent/canvas/message/route.ts`
  - `src/mastra/workflows/canvas-chat-request-workflow.ts`
  - `src/mastra/index.ts`
  - `src/shared/blocks/chat/*`
  - `src/shared/blocks/creator-workbench/canvas/agent/canvas-agent-dock.tsx`
  - `src/shared/blocks/creator-workbench/canvas/page/canvas-page-shell.tsx`
