## 1. 方案确认与边界收口

- [x] 1.1 确认 `/[locale]/create/canvas` 为独立编辑器入口，不复用固定分栏 workbench 布局
- [x] 1.2 确认主画布切换为 React Flow / XYFlow，并废弃 LeaferJS 主画布实现
- [x] 1.3 确认首批闭环范围为 `workflow node -> generate -> result node -> continue`
- [x] 1.4 确认桌面端为主形态，移动端只做可用降级
- [x] 1.5 确认不新增前端 key、不新增独立后端生成协议

## 2. 页面壳与入口路由

- [x] 2.1 创建 `src/app/[locale]/(canvas)/create/canvas/page.tsx`
- [x] 2.2 创建 `src/shared/blocks/creator-workbench/canvas/page/canvas-page-shell.tsx`
- [x] 2.3 在页面壳中接入 locale、页面标题与基础 SEO 信息
- [x] 2.4 在页面壳中接入权限/用户状态/基础路由跳转逻辑
- [x] 2.5 在页面壳中装配 workspace provider、运行时层与 overlay root

## 3. 核心类型与状态容器

- [x] 3.1 创建 `src/shared/blocks/creator-workbench/canvas/core/canvas-types.ts`
- [x] 3.2 定义 `CanvasGraph`
- [x] 3.3 定义 `CanvasNodeBase`
- [x] 3.4 定义节点 `kind` 与 `subtype` 枚举或等价类型
- [x] 3.5 定义 `CanvasEdge`
- [x] 3.6 定义 `CanvasViewportState`
- [x] 3.7 定义 `CanvasSelectionState`
- [x] 3.8 定义 `CanvasComposerContext`
- [x] 3.9 创建 `src/shared/blocks/creator-workbench/canvas/core/canvas-graph-store.ts`
- [x] 3.10 实现 graph store 的初始化能力
- [x] 3.11 实现节点增删改能力
- [x] 3.12 实现边增删改能力
- [x] 3.13 实现视口状态更新能力
- [x] 3.14 实现选中态更新能力
- [x] 3.15 创建 `src/shared/blocks/creator-workbench/canvas/core/canvas-workspace-provider.tsx`
- [x] 3.16 创建 `src/shared/blocks/creator-workbench/canvas/core/canvas-selectors.ts`

## 4. React Flow / XYFlow 运行时基座

- [x] 4.1 创建 `src/shared/blocks/creator-workbench/canvas/runtime/react-flow-stage.tsx`
- [x] 4.2 初始化 React Flow / XYFlow 视口实例
- [x] 4.3 接入滚轮缩放
- [x] 4.4 接入空白拖动画布
- [x] 4.5 接入节点拖拽桥接
- [x] 4.6 创建 `src/shared/blocks/creator-workbench/canvas/runtime/canvas-viewport-controller.ts`
- [x] 4.7 将 React Flow 视口变化同步到 graph store
- [x] 4.8 处理画布坐标与 DOM 浮层定位所需的坐标换算
- [x] 4.9 创建 `src/shared/blocks/creator-workbench/canvas/runtime/react-flow-node.tsx`
- [x] 4.10 创建 `src/shared/blocks/creator-workbench/canvas/runtime/react-flow-edge.tsx`
- [x] 4.11 跑通节点首屏渲染
- [x] 4.12 跑通边首屏渲染
- [x] 4.13 对齐 TapNow 鼠标 / 触摸板交互：默认滚轮平移、组合键滚轮缩放、空白区拖动画布
- [x] 4.14 删除旧 LeaferJS stage / node layer / edge layer
- [x] 4.15 移除 LeaferJS 依赖并新增 `@xyflow/react`
- [x] 4.16 实现 React Flow Handle 点击、拖拽连接、无效落点 command menu

## 5. 节点渲染基座

- [x] 5.1 创建 `src/shared/blocks/creator-workbench/canvas/nodes/render-node.tsx`
- [x] 5.2 实现节点 `kind/subtype -> component` 的分派映射
- [x] 5.3 实现节点公共外壳：标题、选中态、描边、高亮
- [x] 5.4 实现节点公共拖拽交互桥接
- [x] 5.5 实现节点公共 handle 占位与连接入口

## 6. 首批最小节点集

- [x] 6.1 创建 `src/shared/blocks/creator-workbench/canvas/nodes/workflow-node.tsx`
- [x] 6.2 为 workflow node 接入 prompt 摘要、scene/model 摘要和状态展示
- [x] 6.3 创建 `src/shared/blocks/creator-workbench/canvas/nodes/result-node.tsx`
- [x] 6.4 为 result node 接入图片/视频缩略展示
- [x] 6.5 创建 `src/shared/blocks/creator-workbench/canvas/nodes/command-node.tsx`
- [x] 6.6 为 command node 接入来源节点上下文展示
- [x] 6.7 创建 `src/shared/blocks/creator-workbench/canvas/nodes/image-node.tsx`
- [x] 6.8 创建 `src/shared/blocks/creator-workbench/canvas/nodes/video-node.tsx`
- [x] 6.9 创建 `src/shared/blocks/creator-workbench/canvas/nodes/template-node.tsx`

## 7. Edge 语义与连线系统

- [x] 7.1 在类型层定义 `reference` / `derivation` / `result` / `control` / `command`
- [x] 7.2 在 edge layer 中实现默认曲线绘制
- [x] 7.3 为不同语义 edge 预留样式差异
- [x] 7.4 实现 edge 高亮与选中链路高亮
- [ ] 7.5 实现 edge 删除与断开
- [ ] 7.6 实现连线变化后的上下文重算
- [x] 7.7 实现 `result edge` 的自动创建
- [ ] 7.8 实现 `reference edge` 删除后的引用清理

## 8. Command System

- [x] 8.1 创建 `src/shared/blocks/creator-workbench/canvas/commands/canvas-command-registry.ts`
- [x] 8.2 定义首批命令注册表：`text-to-image`
- [x] 8.3 定义首批命令注册表：`image-to-image`
- [x] 8.4 定义首批命令注册表：`image-to-video`
- [x] 8.5 定义首批命令注册表：`text-to-video`
- [x] 8.6 定义首批命令注册表：`upload-reference`
- [x] 8.7 定义首批命令注册表：`apply-template`
- [x] 8.8 创建 `src/shared/blocks/creator-workbench/canvas/commands/canvas-command-menu.tsx`
- [x] 8.9 实现从节点 handle 拖出进入命令流
- [x] 8.10 实现空白区域落点处打开 command menu
- [x] 8.11 实现命令选择后自动创建目标节点
- [x] 8.12 实现命令选择后自动创建默认语义 edge
- [x] 8.13 实现取消命令流程后的临时状态清理

## 9. 悬浮 Composer

- [x] 9.1 创建 `src/shared/blocks/creator-workbench/canvas/composer/canvas-composer.tsx`
- [x] 9.2 创建 `src/shared/blocks/creator-workbench/canvas/composer/canvas-context-chip.tsx`
- [x] 9.3 创建 `src/shared/blocks/creator-workbench/canvas/composer/canvas-reference-picker.tsx`
- [x] 9.4 实现 composer 锚定选中节点的定位
- [x] 9.5 实现 composer 在视口缩放/平移后的重定位
- [x] 9.6 实现 prompt 主输入区
- [x] 9.7 实现当前节点类型对应的场景标签展示，不提供独立 scene 切换入口
- [x] 9.8 实现 model 切换入口
- [x] 9.9 实现高频参数区：比例
- [x] 9.10 实现高频参数区：数量或模式
- [x] 9.11 实现上下文 chip 展示
- [ ] 9.12 实现 `@` 引用上下文接入
- [x] 9.13 实现参考图/参考视频选择入口
- [ ] 9.14 实现更多设置展开层
- [x] 9.15 实现生成按钮与禁用态
- [x] 9.16 实现生成中状态与 loading 反馈
- [x] 9.17 实现积分展示位

## 10. 生成适配层

- [x] 10.1 创建 `src/shared/blocks/creator-workbench/canvas/adapters/canvas-generation-adapter.ts`
- [x] 10.2 从 workflow node 读取核心生成数据
- [x] 10.3 从上游 `reference edge` 聚合图片引用
- [x] 10.4 从上游 `reference edge` 聚合视频引用
- [x] 10.5 从上游 `control edge` 聚合模板/工具控制数据
- [x] 10.6 把聚合后的上下文转换为现有 `playground-config-registry` 可消费参数
- [x] 10.7 接入现有访问校验逻辑
- [x] 10.8 接入现有积分估算逻辑
- [x] 10.9 接入现有图片生成提交流程
- [x] 10.10 接入现有视频生成提交流程
- [x] 10.11 处理生成成功后的 result node 插入
- [x] 10.12 处理生成成功后的 `result edge` 创建
- [x] 10.13 处理生成失败后的 workflow node 状态回写

## 11. 模板与历史适配层

- [x] 11.1 创建 `src/shared/blocks/creator-workbench/canvas/adapters/canvas-template-adapter.ts`
- [x] 11.2 实现模板数据到 workflow node 的回填映射
- [x] 11.3 实现模板数据到 `control edge` 的映射
- [x] 11.4 创建 `src/shared/blocks/creator-workbench/canvas/adapters/canvas-history-adapter.ts`
- [x] 11.5 实现历史图片结果转为输入节点
- [x] 11.6 实现历史视频结果转为输入节点
- [x] 11.7 实现历史结果回流为 `reference edge`
- [x] 11.8 实现模板和历史进入画布后的默认落点策略

## 12. Agent 适配层

- [x] 12.1 创建 `src/shared/blocks/creator-workbench/canvas/adapters/canvas-agent-adapter.ts`
- [x] 12.2 定义 `readCanvasGraph`
- [x] 12.3 定义 `readCanvasNodes`
- [x] 12.4 定义 `createNode`
- [x] 12.5 定义 `updateNode`
- [x] 12.6 定义 `createEdge`
- [x] 12.7 定义 `layoutNodes`
- [x] 12.8 定义 `groupNodes`
- [x] 12.9 定义 `focusNode`
- [x] 12.10 保证 Agent 接口只面向图模型，不直连具体 React 组件
- [x] 12.11 预留聊天输入区与 Agent 上下文对接点
- [x] 12.12 在画布底部接入 Agent 聊天浮层
- [x] 12.13 将聊天消息编排为工作流节点创建、引用连线与生成执行

## 13. UI 外框层

- [x] 13.1 创建 `src/shared/blocks/creator-workbench/canvas/ui/canvas-top-bar.tsx`
- [x] 13.2 实现左上品牌与画布标题区
- [x] 13.3 实现右上积分 / 社区 / 分享胶囊按钮
- [x] 13.4 创建 `src/shared/blocks/creator-workbench/canvas/ui/canvas-tool-rail.tsx`
- [x] 13.5 实现左侧悬浮工具轨道主按钮
- [x] 13.6 实现左侧轨道功能组和分隔线
- [x] 13.7 实现底部头像或工作空间入口位
- [x] 13.8 创建 `src/shared/blocks/creator-workbench/canvas/ui/canvas-bottom-controls.tsx`
- [x] 13.9 实现底部导航控件
- [x] 13.10 实现底部缩放滑条
- [x] 13.11 实现帮助/提示入口

## 14. 视觉系统落地

- [x] 14.1 实现黑色点阵无限画布背景
- [x] 14.2 落地 `canvas-*` 设计 token
- [x] 14.3 落地顶部胶囊按钮视觉
- [x] 14.4 落地左侧工具轨道视觉
- [x] 14.5 落地默认节点卡片视觉
- [x] 14.6 落地结果节点缩略图视觉
- [x] 14.7 落地曲线连线视觉
- [x] 14.8 落地选中态和链路高亮
- [x] 14.9 落地 composer 深色大卡片视觉
- [x] 14.10 落地 command menu 深色悬浮卡片视觉
- [x] 14.11 对齐 `https://app.tapnow.ai/canvas/912f9a31-e6c6-456d-aba9-5c284b464c7d` 的整体布局、节点体型和连线气质

## 15. 最小闭环验收

- [x] 15.1 验收独立页面壳已替代旧 workbench 分栏
- [x] 15.2 验收主画布确实基于 React Flow / XYFlow
- [x] 15.3 验收节点可拖拽、画布可平移、可缩放
- [x] 15.4 验收 workflow node 可通过 composer 发起生成
- [x] 15.5 验收生成成功后自动插入 result node
- [x] 15.6 验收 result node 可通过 command system 继续创作
- [x] 15.7 验收 `reference edge` / `result edge` / `command edge` 行为正确
- [x] 15.8 验收模板或历史至少有一种回流路径打通

## 16. 兼容性与安全检查

- [x] 16.1 验收图片生成与视频生成继续走现有接口
- [ ] 16.2 验收上传继续走现有上传能力
- [x] 16.3 验收前端未新增敏感 key
- [ ] 16.4 验收移动端降级后仍可完成基础生成
- [x] 16.5 验收异常状态下节点和 composer 不会卡死

## 17. 规范与交付收口

- [x] 17.1 对照 spec 自检节点契约、edge 语义和模块边界
- [x] 17.2 对照 design 自检 UI 规范与 TapNow 参考页一致性
- [x] 17.3 更新任务状态，确保已完成项全部勾选
- [ ] 17.4 运行 OpenSpec 校验命令（本地缺少 `openspec-cn`，无法执行）
- [x] 17.5 若本地无 `openspec-cn`，记录为环境限制并做人工结构自检

## 18. TapNow 技术栈迁移

- [x] 18.1 重新确认 TapNow 主画布技术栈为 React Flow / XYFlow，而非 LeaferJS
- [x] 18.2 将 OpenSpec 技术约束从 LeaferJS 改为 React Flow / XYFlow
- [x] 18.3 安装 `@xyflow/react`
- [x] 18.4 移除 `leafer-ui` 和 `@leafer-in/viewport`
- [x] 18.5 删除旧 Leafer stage / node layer / edge layer
- [x] 18.6 新增 React Flow stage
- [x] 18.7 新增 TapNow 风格 React Flow node
- [x] 18.8 新增 TapNow 风格 React Flow custom edge
- [x] 18.9 接入 React Flow handle 点击与拖拽连接流程
- [x] 18.10 接入无效连接落点 command menu
- [x] 18.11 落地 TapNow 风格 React Flow 全局样式、节点样式、handle 动效和边样式
- [x] 18.12 通过 TypeScript 校验
- [x] 18.13 通过 Next 构建校验
