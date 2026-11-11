# 变更：将 AddToolsDialog 改为卡片网格模式

## 为什么
当前 `AddToolsDialog` 使用两列列表样式，信息密度高但可扫读性较弱；希望改为类似移动端工具卡片的展示方式，让用户通过缩略图更快识别工具，并支持一键固定（Pin）。

## 变更内容
- 将 `AddToolsDialog` 的工具选择 UI 从“列表”改为“卡片网格”
- 每个工具卡片展示：
  - 缩略图（来自 `tool.icon_url`，统一走 CDN 重写）
  - 标题（`title/name`）
  - 右上角 Pin 按钮（固定/取消固定）
- 保留分类（至少 Image / Video）筛选能力

## 影响
- 受影响代码：
  - `src/shared/blocks/create/add-tools-dialog.tsx`
  - 可能复用/对齐：`src/shared/blocks/create/create-layout.tsx`（工具卡片视觉风格）
- 风险：
  - 卡片布局在不同屏幕尺寸下需要处理滚动与对齐
  - 需要确保键盘可达性（tab/focus）与可点击区域不冲突

