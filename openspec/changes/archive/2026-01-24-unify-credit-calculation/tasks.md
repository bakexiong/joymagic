## 1. 准备阶段

- [x] 1.1 审查 `/api/ai/estimate-credits` 接口，确认支持所有场景和参数
- [x] 1.2 列出所有需要迁移的前端组件及其积分计算方式
- [x] 1.3 确认每个组件对应的场景名称（apiKey）
- [x] 1.4 确认动态积分场景需要传递的参数

## 2. 创建通用积分计算 Hook

- [x] 2.1 创建 `useEstimateCredits` Hook，封装 `/api/ai/estimate-credits` 调用
- [x] 2.2 实现防抖/节流逻辑，避免频繁调用
- [x] 2.3 实现缓存机制，相同参数不重复调用
- [x] 2.4 实现错误处理和加载状态管理
- [x] 2.5 添加 TypeScript 类型定义

## 3. 迁移固定积分组件

- [x] 3.1 迁移 `image-to-image` 组件（REQUIRED_CREDITS = 6）
- [x] 3.2 迁移 `image-upscaler` 组件
- [x] 3.3 迁移 `image-background-remover` 组件
- [x] 3.4 迁移 `image-eraser` 组件（REQUIRED_CREDITS = 10）
- [x] 3.5 迁移 `flux-2-klein-text-to-image` 组件（REQUIRED_CREDITS = 2）
- [x] 3.6 迁移 `gpt-image-1-text-to-image` 组件（动态：size, quality）
- [x] 3.7 迁移 `seedream-v4-5-text-to-image` 组件（REQUIRED_CREDITS = 16）
- [x] 3.8 迁移 `qwen-202512-text-to-image` 组件（REQUIRED_CREDITS = 10）
- [x] 3.9 迁移 `nano-banana-text-to-image` 组件（REQUIRED_CREDITS = 15）
- [x] 3.10 迁移 `nano-banana-pro-text-to-image` 组件（REQUIRED_CREDITS = 56）
- [x] 3.11 迁移 `nano-banana-text-to-image` shared 组件（REQUIRED_CREDITS = 2）
- [x] 3.12 迁移 `wavespeed-image-generator` 组件（REQUIRED_IMAGE_CREDITS = 2）

## 4. 迁移动态积分组件

- [x] 4.1 迁移 `longcat-avatar` 组件（基于 duration, resolution）
- [x] 4.2 迁移 `text-to-video/ltx-2-fast` 组件（基于 duration, generateAudio）
- [x] 4.3 迁移 `image-to-video/ltx-2-fast` 组件（基于 duration, generateAudio）
- [x] 4.4 迁移 `text-to-video/seedance-1-5-pro` 组件（基于 resolution, duration, generateAudio）
- [x] 4.5 迁移 `image-to-video/seedance-1-5-pro` 组件（基于 resolution, duration, generateAudio）
- [x] 4.6 迁移 `text-to-video/veo-3-1` 组件（基于 duration, generateAudio）
- [x] 4.7 迁移 `image-to-video/veo-3-1` 组件（基于 duration, generateAudio）
- [x] 4.8 迁移 `text-to-video/wan-2-6` 组件（基于 size, duration）
- [x] 4.9 迁移 `video-face-swap` 组件（基于 duration）
- [x] 4.10 迁移 `kling-v2.6-pro/motion-control` 组件（基于 duration）
- [x] 4.11 迁移 `flux-2-klein-image-to-image` 组件
- [x] 4.12 迁移 `qwen-image-layered` 组件（基于 numLayers）

## 5. 清理工作

- [x] 5.1 删除所有硬编码的 `REQUIRED_CREDITS` 常量
- [x] 5.2 删除所有本地积分计算函数（`getRequiredCredits`, `calculateRequiredCredits` 等）
- [x] 5.3 清理未使用的导入和代码
- [x] 5.4 验证所有组件不再包含硬编码积分逻辑

## 6. 测试与验证

- [x] 6.1 测试所有固定积分组件的积分显示
- [x] 6.2 测试所有动态积分组件的实时积分更新
- [x] 6.3 验证积分计算与后端一致
- [x] 6.4 测试 API 调用失败时的错误处理
- [x] 6.5 测试网络错误时的处理
- [x] 6.6 测试防抖/节流机制是否正常工作
- [x] 6.7 测试缓存机制是否正常工作
- [x] 6.8 验证性能（避免频繁 API 调用）
