## 上下文

项目内聊天能力目前分成两套：

- 基于 Vercel AI SDK 的标准聊天
- 基于 Mastra workflow 的 Canvas 智能体聊天

前者以 token/text 流式为主，后者以最终 JSON 结果为主。用户已经明确要求“所有聊天节点都改成流式”，因此需要一套跨入口的一致设计。

## 目标

- 统一所有聊天入口的用户体验节奏
- 让 Canvas workflow 的中间推理过程可以被前端实时消费
- 保持后端作为唯一的模型与 key 调用方
- 降低前端为不同聊天入口维护两套消息协议的成本

## 非目标

- 不把所有异步任务都抽象成聊天流
- 不在本次设计中重构聊天数据库模型
- 不替换现有模型供应商或记忆系统

## 决策

- 决策：Canvas 聊天采用 Mastra `createRun().stream()` 作为权威流来源
  - 原因：该能力天然支持 workflow lifecycle event、自定义 step writer 事件和最终 result 聚合
- 决策：Canvas workflow 在关键 step 内通过 `await writer.write(...)` 主动写出 thinking 事件
  - 原因：仅依赖默认 workflow 事件不足以表达面向用户的 reasoning 文案
- 决策：route 层负责把 Mastra workflow stream 转换成前端可消费的网络流格式
  - 原因：避免前端直接绑定 Mastra 内部事件结构，保留协议演进空间
- 决策：前端抽出统一的 chat stream consumer
  - 原因：标准聊天与 Canvas 聊天都需要处理增量文本、thinking、完成与错误

## 风险 / 权衡

- 风险：流式过程中先扣费、后失败可能导致退款路径更复杂
  - 缓解：保持“最终成功后确认 assistant 落库；失败时走现有退款逻辑”
- 风险：Canvas workflow 中既有默认事件又有自定义事件，前端处理复杂度上升
  - 缓解：route 层先做归一化，只向前端暴露有限事件集合
- 风险：不同聊天入口的历史消息结构不同
  - 缓解：统一“运行时流协议”，不强制统一“历史存储结构”

## 迁移计划

1. 先为 Canvas workflow 添加 step-level streaming 事件
2. 再把 Canvas message route 改为真正流式返回
3. 前端接入 Canvas thinking stream
4. 收敛标准聊天前端消费逻辑
5. 完成联调与回归验证

## 待决问题

- 标准聊天和 Canvas 聊天是否需要完全统一到同一网络事件格式，还是允许 route 层各自输出、前端复用解析抽象
- assistant message 的落库时机是否需要从“完成后一次性写入”升级为“先占位、结束后补全”
