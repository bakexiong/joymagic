## 1. 协议与范围

- [ ] 1.1 盘点当前所有用户可见聊天入口，并确认本次纳入范围
- [ ] 1.2 定义统一的聊天流式事件模型（文本、thinking、步骤、完成、错误）
- [ ] 1.3 明确标准聊天与 Canvas 聊天在协议层的共性与差异

## 2. Canvas 工作流流式化

- [ ] 2.1 为 Canvas 聊天工作流步骤补充 `writer.write(...)` 中间事件
- [ ] 2.2 让 Canvas 消息接口改为消费 workflow stream，而不是只等待最终结果
- [ ] 2.3 将 `reasoning` 及时映射到前端 thinking 展示区
- [ ] 2.4 保证流结束后仍能正确落库 assistant message、计费和生成状态

## 3. 标准聊天统一

- [ ] 3.1 审查 `/api/chat` 当前流式实现与前端消费方式
- [ ] 3.2 将标准聊天的 reasoning / sources / text 展示逻辑与统一协议对齐
- [ ] 3.3 抽取可复用的前端流消费逻辑，避免不同聊天入口重复解析

## 4. 前端适配

- [ ] 4.1 更新通用聊天 UI，支持统一 thinking 区块
- [ ] 4.2 更新 Canvas 聊天 Dock，显示实时 thinking 与步骤状态
- [ ] 4.3 处理流式失败、中断、重试和消息去重

## 5. 验证

- [ ] 5.1 验证标准聊天的流式回复、reasoning 和持久化
- [ ] 5.2 验证 Canvas 聊天的 thinking 流、最终落图和生成提交流程
- [ ] 5.3 运行 `openspec-cn validate update-chat-nodes-streaming --strict --no-interactive`
