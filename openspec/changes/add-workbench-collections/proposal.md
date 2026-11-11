# 变更：为工作台增加 Collection 管理能力

## 为什么

当前工作台中的 `Collections` 标签页仍是占位状态，用户无法创建、删除或重命名合集，也无法开始整理工作台资产。这让现有 UI 缺少真实能力，且后续“把上传或生成内容收纳到合集”也没有稳定入口。

## 变更内容

- 新增工作台 `Collection` 数据表与模型层
- 提供 `Collection` 列表、新建、重命名、删除接口
- 将工作台 `Collections` 标签页接入真实数据与交互
- 保持所有读写都经由服务端完成，不在前端暴露任何敏感 key

## 影响

- 受影响规范：`workbench-collections`
- 受影响代码：
  - `src/config/db/schema.ts`
  - `src/shared/models/workbench-collection.ts`
  - `src/app/api/workbench/collections/`
  - `src/shared/blocks/desktop-playground/components/workbench-media-panel.tsx`
  - `src/shared/blocks/desktop-playground/components/workbench-collections-grid.tsx`
