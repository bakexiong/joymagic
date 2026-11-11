# 变更：新增 Create Canvas 工作流画布

## 为什么

当前项目已经具备图片/视频生成能力和统一 workbench 基座，但 `/[locale]/create/canvas` 这个新入口的目标并不是再做一层“表单工作台外壳”，而是提供一个真正的创作画布：用户在无限画布中组织节点、引用上一步结果、围绕选中节点直接生成下一步内容，整体体验参考 TapNow / Fresh Ideas 的创作方式。

现有实现思路主要偏向传统工作台集成，无法满足以下明确要求：

- 画布必须是真正的 canvas，而不是中间放节点、右侧挂旧表单
- 交互必须围绕节点和连线展开，而不是围绕固定侧栏展开
- 样式必须接近参考图的黑色无限画布、轻量节点、悬浮 prompt composer 语言
- 底层仍需复用现有图片/视频生成接口，不能重新定义一套后端协议

因此需要为 Create Canvas 建立独立的 OpenSpec 提案，重新定义这个能力的产品边界、视觉语言和技术约束。

## 变更内容

- 新增独立能力 `workflow-canvas-creator`，覆盖 `/[locale]/create/canvas` 的信息架构、交互模型和样式规范
- 明确该页面必须使用 React Flow / XYFlow 构建真实工作流画布、节点图、连接线与视口能力
- 将图片生成、视频生成、模板引用、结果回流统一抽象为“工作流节点”
- 明确采用“React 页面壳 + React Flow 画布层 + DOM 浮层 + 生成适配层 + Agent 适配层”的五层结构
- 为画布定义标准 `CanvasGraph` 数据模型，覆盖节点、边、布局、选中态、上下文引用与命令节点
- 定义 edge 的语义职责，不再把连线视为纯视觉元素，而是表达输入类型、引用方式与参数推导来源
- 定义 command node / command menu 机制，使“从节点继续创作”成为一等交互
- 定义贴近选中节点的 composer 模块，作为 prompt、模型、高频参数和执行入口的唯一主编辑界面
- 定义 Agent 接口层，使后续聊天、灵感检索、自动布局、节点创建与节点更新可统一接入
- 定义 TapNow 风格的桌面端视觉体系：深色点阵背景、轻量节点卡片、细连接线、悬浮 composer、左侧工具轨道、底部缩放控件
- 明确页面样式提取来源为用户指定的 TapNow 参考页 `https://app.tapnow.ai/canvas/a40d6f74-459a-43f6-8613-7c34b4ee73da`，并将可观察到的布局、控件层级、节点比例、toolbar 与 composer 形态固化为 UI 规范
- 规定该页面只复用现有图片/视频生成接口、上传能力、积分校验与模型配置，不新增前端直连 key 或独立生成协议
- 为后续实施拆分任务，包括画布引擎层、节点模型层、edge 语义层、command 系统、悬浮面板层、生成链路适配层、Agent 适配层与视觉收敛层

## 非目标

- 不替换现有 `/text-to-image/*`、`/image-to-image/*`、`/text-to-video/*`、`/image-to-video/*` 的传统 workbench 页面
- 不重写现有后端生成 API、积分系统或上传接口
- 不在前端新增任何密钥或绕过现有服务端调用链路
- 不要求本次提案解决多人协作、实时协同、评论系统或社区分享能力
- 不要求移动端复刻完整桌面画布交互；移动端可采用降级策略

## 影响

- 受影响规范：`workflow-canvas-creator`
- 受影响代码：
  - `src/app/[locale]/(landing)/create/canvas/page.tsx`
  - `src/shared/blocks/creator-workbench/canvas-creator-workbench.tsx`
  - 可能新增 `src/shared/blocks/creator-workbench/canvas/*`
  - 可能新增 `src/shared/blocks/creator-workbench/canvas/core/*`
  - 可能新增 `src/shared/blocks/creator-workbench/canvas/nodes/*`
  - 可能新增 `src/shared/blocks/creator-workbench/canvas/composer/*`
  - 可能新增 `src/shared/blocks/creator-workbench/canvas/agent/*`
  - `src/shared/blocks/desktop-playground/playground-config-registry.ts`
  - `src/shared/blocks/common/image-uploader.tsx`
  - `src/shared/lib/workbench-template-catalog.ts`
  - 与现有生成链路相关的 `desktop-playground` 表单逻辑适配层
