# 变更：为工具表单增加可选 Style 选择项

## 为什么
当前 `/tools` 下的通用表单虽然已经具备 `select` 字段渲染能力，也预留了 `style` 的字段国际化键，但实际的 text-to-image、image-to-image 等非 effect 工具还没有把 `style` 作为一个可选表单项接入。用户希望这类表单能像 effect 区域的 `Choose Style` 一样，直接在表单里切换风格。

## 变更内容
- 为 `/tools` 下的通用表单正式接入可选 `style` 字段
- 让支持风格切换的工具可以通过配置声明 `style` 选项，而不是写死在页面里
- 让模板库中的 `style` 数据可以反向驱动表单默认值与预填
- 当用户选择某个 style 后，将该 style 绑定的 `ref` 图同步回填到上传附件区域
- 当用户选择某个 style 后，将该 style 绑定的 `prompt` 同步回填到提示词输入区域
- 明确无 style 数据时的退化行为：不展示该字段，不影响现有生成流程

## 影响
- 受影响规范：`tool-form-style-selector`
- 受影响代码：
  - `src/shared/blocks/desktop-playground/components/prompt-to-media-form.tsx`
  - `src/shared/blocks/desktop-playground/components/reference-image-form.tsx`
  - `src/shared/blocks/desktop-playground/configs/text-to-image-configs.tsx`
  - `src/shared/blocks/desktop-playground/configs/image-to-image-configs.tsx`
  - `src/shared/lib/workbench-template-samples*.json`
