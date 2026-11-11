# 变更：新增 Mango Photo Effects 特效目录

## 为什么

当前 `/tools/image-effect` 使用的是站内既有特效数据，但缺少来自 Mango Animate `photo-effects` 页的热门照片特效样式，导致当前页面的样式覆盖度不足，也无法与参考站的特效心智保持一致。

此外，这批新增样式需要有可展示的示例图，否则即使接入目录，也无法在模板库和工作区中提供可用的预览与切换体验。

## 变更内容

- 新增一批来源于 `https://mangoanimate.com/zh-tw/ai/photo-effects` 的照片特效样式到当前 `image-effect` 页面数据源
- 为新增特效补充模板库所需的标题、slug、描述、排序和预览元数据
- 使用 `gpt-image-2` 为新增特效生成对应的示例图片资产，并接入现有图片特效数据结构
- 让 `/tools/image-effect` 页面能够展示并使用这批新增的 Mango 风格照片特效

## 影响

- 受影响规范：`tools-effect-library`
- 受影响代码：
  - `src/shared/lib/image-effect-samples.json`
  - `src/shared/lib/image-effect-data.ts`
  - `src/shared/blocks/create/tools-detail-page.tsx`
  - 相关示例图素材与生成脚本（新增）
