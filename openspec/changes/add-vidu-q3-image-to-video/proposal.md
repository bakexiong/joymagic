# 变更：添加 Vidu Q3 图像生成视频功能

## 为什么

平台需要扩展视频生成能力，集成 Vidu Q3 模型以提供更多样化的图像到视频生成选项。Vidu Q3 支持独特的参数配置（如 movement_amplitude 运动幅度控制、bgm 背景音乐），可为用户提供差异化的视频生成体验。

## 变更内容

- 新增 Vidu Q3 image-to-video 前端组件，模仿 `image-to-video/veo-3-1` 实现
- 支持以下表单参数：
  - `prompt`*：视频描述文本（必填）
  - `image`*：参考图片 URL（必填，支持拖拽上传）
  - `resolution`：分辨率选择（540p / 720p / 1080p）
  - `duration`：视频时长（1-16秒，滑块+输入框联动）
  - `movement_amplitude`：运动幅度（auto / small / medium / large）
  - `generate_audio`：是否生成音频（复选框）
  - `bgm`：是否添加背景音乐（复选框）
  - `seed`：随机种子（可选，带随机按钮）
- **不包含** Prompt Enhancer 功能
- 新增对应的 API 路由 `/api/ai/image-to-video-vidu-q3/generate`
- 新增页面路由 `/image-to-video/vidu-q3`
- 新增国际化翻译文件，针对 "Vidu Q3 image to video" 关键词进行 SEO 优化
- 完整的 TDK（Title, Description, Keywords）SEO 优化

## 影响

- 受影响规范：`api-routing`（新增 API 路由）、`credit-estimation`（新增场景积分计算）
- 受影响代码：
  - `src/shared/blocks/image-to-video/` - 新增组件目录
  - `src/app/[locale]/(landing)/(ai)/(pollo)/image-to-video/` - 新增页面
  - `src/app/api/ai/` - 新增 API 路由
  - `src/config/locale/messages/` - 新增翻译文件
  - `src/themes/default/blocks/` - 新增 playground 组件
