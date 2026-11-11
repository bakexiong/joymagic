# 变更：收口 Video Effect 中的 Kiss 类特效为 AI Kissing Hub

## 为什么
当前 `video-effect` 中的 kiss 类特效以多个平铺条目分散存在，用户需要在总列表中分别寻找 `AI Kissing`、`French Kiss`、`Kissing Pro`、`Rain Kiss`、`Blow Kiss` 等入口，信息架构分散，也不利于在单一工作流内切换 kiss 风格。

## 变更内容
- 将现有 kiss 类 video effect 收口到单一的 `AI Kissing` 主入口
- 在 `AI Kissing` 工作台内新增 kiss style 选择区，用于切换不同亲吻风格
- 保留既有 kiss effect 的模型/示例/生成能力，但以 `AI Kissing` 的风格选项形式暴露
- 移除既有 kiss effect 的独立工具路由，只保留 `/tools/video-effect/ai-kissing`
- Header 与其他工具入口中，kiss 类能力只保留 `AI Kissing`

## 影响
- 受影响规范：`video-effect-kiss-hub`
- 受影响代码：
  - `src/shared/lib/video-effect-data.ts`
  - `src/shared/blocks/create/video-effects-tool-form.tsx`
  - `src/shared/blocks/create/tools-detail-page.tsx`
  - `src/app/[locale]/(landing)/tools/[...tool]/page.tsx`
  - `src/config/locale/messages/*/landing/video-effects.json`

## 当前假设
- 当前纳入 `AI Kissing` Hub 的 kiss 类 effect 范围为：`ai-kissing`、`blow-kiss`、`french-kiss`、`kissing-pro`、`rain-kiss`
- `AI Kissing` 作为主入口时，默认 style 使用 `ai-kissing`
- kiss style 切换仅存在于 `AI Kissing` 工作台内部，不再暴露独立 kiss effect 工具入口
