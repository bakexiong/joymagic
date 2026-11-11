# 变更：为画布视频节点增加高清增强能力

## 为什么

`/create/canvas` 里的视频节点目前只有裁切、清除、下载等操作，缺少直接对视频结果做高清增强的入口。产品需要对接 WaveSpeed 的 ByteDance Video Upscaler，但仍然保持现有统一的 `/api/ai/[scene]/generate` 调用方式，并复用积分估算与异步任务结果回流机制。

## 变更内容

- 在画布视频节点工具栏中新增“高清增强”确认弹窗
- 弹窗支持选择 `target_resolution`
- 生成按钮旁显示积分估算，样式参考图片节点增强按钮
- 前端通过统一场景 `canvas-video-upscaler` 调用 `/api/ai/[scene]/generate`
- 请求中携带视频地址、目标分辨率和总时长
- 任务提交后创建视频结果占位节点，并在任务完成后回填增强结果

## 影响

- 受影响规范：`canvas-video-upscaler`
- 受影响代码：
  - `src/shared/blocks/creator-workbench/canvas/runtime/react-flow-node.tsx`
  - `src/shared/blocks/creator-workbench/canvas/runtime/react-flow-stage.tsx`
  - `src/shared/blocks/creator-workbench/canvas/page/canvas-page-shell.tsx`
  - `src/shared/lib/*`
  - `src/config/style/global.css`
