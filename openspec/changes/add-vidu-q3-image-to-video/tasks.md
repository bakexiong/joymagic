# 任务清单：Vidu Q3 图像生成视频

## 1. 前端组件实现

- [x] 1.1 创建 `src/shared/blocks/image-to-video/vidu-q3/image-to-video.tsx` 组件
  - 模仿 `image-to-video/veo-3-1/image-to-video.tsx` 结构
  - 实现表单字段：prompt、image、resolution、duration、movement_amplitude、generate_audio、bgm、seed
  - 实现图片上传/拖拽功能
  - 实现 duration 滑块（1-16秒）+ 输入框联动
  - 实现 seed 随机按钮
  - 集成 `useEstimateCredits` Hook
  - 集成 `useUserAccessCheck` Hook
  - 实现视频预览和下载功能
  - **不包含** Prompt Enhancer 功能

- [x] 1.2 创建 `src/themes/default/blocks/image-to-video-vidu-q3-playground.tsx` playground 组件

- [x] 1.3 在 `src/themes/default/blocks/index.tsx` 中注册新组件
  - 注：playground 组件直接从文件导入，无需在 index.tsx 中导出

## 2. 页面路由

- [x] 2.1 创建 `src/app/[locale]/(landing)/(ai)/(pollo)/image-to-video/vidu-q3/page.tsx` 页面
  - 模仿 `image-to-video/veo-3-1/page.tsx` 结构
  - 包含 Hero、Features、Use Cases、FAQ、CTA 等区块
  - 实现完整的 SEO 优化（TDK、JSON-LD）

## 3. API 实现

- [x] 3.1 在 `src/proxy.ts` 中添加 `image-to-video-vidu-q3` 场景配置
  - 注：API 路由使用动态路由 `/api/ai/[scene]/generate`，场景配置通过 pricing-config 和 credit-config 管理，无需在 proxy.ts 中配置

- [x] 3.2 验证 `/api/ai/[scene]/generate` 动态路由支持新场景
  - 注：动态路由已支持，场景配置需要在数据库的 pricing-config 和 credit-config 中添加

- [x] 3.3 验证 `/api/ai/status` 状态查询支持新场景
  - 注：状态查询使用 scenario 参数，已支持新场景

## 4. 国际化与 SEO

- [x] 4.1 创建 `src/config/locale/messages/en/landing/vidu-q3.json` 英文翻译
  - 核心关键词：Vidu Q3 image to video
  - SEO 优化的 TDK
  - 所有页面文案

- [x] 4.2 创建中文翻译文件（如需要）
  - 注：根据项目需求，目前仅创建英文翻译文件

## 5. 验证

- [ ] 5.1 本地启动开发服务器验证页面渲染
- [ ] 5.2 验证表单参数正确提交
- [ ] 5.3 验证积分估算功能
- [ ] 5.4 验证视频生成和轮询状态
- [ ] 5.5 验证视频预览和下载功能
- [ ] 5.6 验证 SEO 元数据正确输出
