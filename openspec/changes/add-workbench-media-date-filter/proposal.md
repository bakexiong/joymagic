# 变更：为工作台媒体面板添加日期筛选

## 为什么
当前桌面工作台的 `Creations / Uploads` 头部已经有筛选入口，但日期筛选仍然是静态占位，用户无法按具体日期范围过滤媒体结果，筛选面板也缺少真实的日历交互。

## 变更内容
- 为工作台媒体面板的筛选面板增加可交互的日期范围选择器
- 支持开始日期与结束日期的选择、清空、取消和应用
- 在 `Creations / Uploads` 视图中根据已应用的日期范围过滤展示的媒体项
- 保持其他筛选项未接入真实过滤逻辑时的现状，不扩大本次变更范围

## 影响
- 受影响规范：`workbench-media-filters`
- 受影响代码：
  - `src/shared/blocks/desktop-playground/components/workbench-media-panel.tsx`
  - 可能新增 `src/shared/blocks/desktop-playground/components/` 下的日期筛选相关组件
