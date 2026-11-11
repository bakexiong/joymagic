## 上下文

当前画布图片节点已经有成熟的“先选参数，再显示积分，再确认生成”的交互模式，而视频节点的 `quality` 只是占位 UI。视频增强场景还需要把总时长一并传入，以便后台使用 `step-based` 或其他基于时长的计费方式。

## 目标

- 视频节点点击高清增强后弹出确认层，而不是直接触发任务
- 弹窗内可以切换目标分辨率
- 积分估算使用统一 `/api/ai/estimate-credits`
- 生成请求仍然走 `/api/ai/[scene]/generate`
- 请求体包含 `video`、`target_resolution`、`duration`
- 任务完成后在画布中生成新的增强结果视频节点

## 非目标

- 不在前端写死任何 provider key 或 provider 端点
- 不在前端直接调用 WaveSpeed 官方 API
- 不扩展后台 scene 配置逻辑

## 方案

1. 新增 `canvas-video-upscaler` 前端 scene 常量与请求体类型。
2. 在 `canvas-page-shell.tsx` 中新增 `handleVideoUpscale(...)`：
   - 调用 `/api/ai/canvas-video-upscaler/generate`
   - 请求体传 `video`、`target_resolution`、`duration`
   - 利用现有 `createPendingResultNode`、`pollCanvasTaskResult`、`resolvePendingResultNode`
3. 在 `react-flow-stage.tsx` 和 `react-flow-node.tsx` 中新增 `onVideoUpscale` 透传。
4. 在视频节点中新增 `VideoUpscaleOverlay`：
   - 使用现有 `tapnow-upscale-panel` 视觉体系
   - 用 `useEstimateCredits("canvas-video-upscaler", { target_resolution, duration })` 估算积分
   - 点击生成后调用 `onVideoUpscale`

## 风险与缓解

- 风险：视频元数据尚未就绪时无法提供正确总时长
  - 缓解：提交前优先使用已加载的 `videoDuration`，缺失时通过离屏 video 再解析一次
- 风险：后台 scene 映射尚未配置时任务会失败
  - 缓解：前端只做参数对接，不写死 provider 细节，错误直接透出后台返回信息
