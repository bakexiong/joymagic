# 规范：访客用户积分显示优化

## 新增需求

### 需求：访客用户必须不触发积分估算
**优先级**: 高

访客用户（未登录用户）使用AI生成功能时，系统**必须不**调用积分估算API。

**理由**:
- 访客用户无法使用积分系统
- 减少不必要的服务器负载
- 提升页面响应速度

#### 场景：访客用户访问生成功能页面
**前置条件**:
- 用户未登录
- 访问任何包含AI生成功能的页面（如文本生成图片、图片处理、视频生成等）

**操作**:
1. 用户打开页面
2. 页面加载完成

**预期结果**:
- `useEstimateCredits` Hook返回空值对象：`{ credits: null, isLoading: false, error: null, refetch: () => {} }`
- 浏览器开发者工具网络面板中不显示`/api/ai/estimate-credits`请求
- 页面正常渲染，无错误

#### 场景：访客用户修改生成参数
**前置条件**:
- 用户未登录
- 在生成功能页面上

**操作**:
1. 用户修改提示词、尺寸、时长等参数
2. 等待防抖时间结束

**预期结果**:
- 不触发积分估算API请求
- 页面响应流畅
- 按钮状态不变

---

### 需求：访客用户生成按钮必须始终可点击
**优先级**: 高

访客用户的生成按钮**必须不**因积分估算状态而被禁用。

**理由**:
- 访客用户需要通过点击按钮触发登录流程
- 禁用按钮会阻止用户进入注册/登录流程
- 改善用户体验，降低转化流失

#### 场景：访客用户查看生成按钮状态
**前置条件**:
- 用户未登录
- 在任何生成功能页面上
- 已满足基本输入条件（如输入了提示词、上传了图片等）

**操作**:
1. 用户查看生成按钮

**预期结果**:
- 按钮处于可点击状态（非禁用）
- 按钮显示正常的生成文本（如"Generate Image"）
- 按钮上不显示积分数量
- 按钮上不显示"Estimating..."加载状态

#### 场景：访客用户点击生成按钮
**前置条件**:
- 用户未登录
- 生成按钮可点击

**操作**:
1. 用户点击生成按钮

**预期结果**:
- 显示登录/注册模态框
- 用户可以选择登录或注册
- 不执行实际的生成操作

---

### 需求：访客用户按钮必须不显示积分信息
**优先级**: 中

访客用户的生成按钮上**必须不**显示任何积分相关信息。

**理由**:
- 访客用户无法使用积分
- 显示积分信息会造成混淆
- 简化UI，突出核心操作

#### 场景：访客用户查看按钮文本
**前置条件**:
- 用户未登录
- 在生成功能页面上

**操作**:
1. 用户查看生成按钮文本

**预期结果**:
- 按钮仅显示操作文本（如"Generate Image"、"Remove Background"等）
- 不显示积分数量（如"(10 credits)"）
- 不显示"Estimating..."状态
- 显示正常的图标（如魔法棒图标）

---

### 需求：useEstimateCredits Hook必须支持用户状态检测
**优先级**: 高

`useEstimateCredits` Hook**必须**检测用户登录状态，并根据状态决定是否执行积分估算。Hook内部**必须**导入并使用`useAppContext`获取用户信息，在Hook开始处**必须**添加用户登录检查，未登录时**必须**直接返回空值并跳过所有API调用和状态管理逻辑。

#### 场景：Hook被访客用户调用
**前置条件**:
- 用户未登录（`user === null`）
- 组件调用`useEstimateCredits(apiKey, params)`

**操作**:
1. Hook执行

**预期结果**:
- 立即返回：`{ credits: null, isLoading: false, error: null, refetch: () => {} }`
- 不设置任何定时器
- 不创建AbortController
- 不调用fetch API
- 不访问缓存

#### 场景：Hook被已登录用户调用
**前置条件**:
- 用户已登录（`user !== null`）
- 组件调用`useEstimateCredits(apiKey, params)`

**操作**:
1. Hook执行

**预期结果**:
- 执行原有的完整逻辑
- 检查缓存
- 设置防抖定时器
- 调用`/api/ai/estimate-credits` API
- 返回实际的积分估算结果
- 功能与修改前完全一致

---

### 需求：生成按钮禁用逻辑必须仅对已登录用户检查积分估算状态
**优先级**: 高

所有使用`useEstimateCredits`的组件，其生成按钮的`disabled`属性**必须**仅对已登录用户应用积分估算相关的禁用条件。按钮`disabled`属性**必须**从`isGenerating || !prompt.trim() || isCheckingGeo || isRestricted || isEstimating || requiredCredits === null`修改为`isGenerating || !prompt.trim() || isCheckingGeo || isRestricted || (user && (isEstimating || requiredCredits === null))`。访客用户（`!user`）**必须不**受积分估算状态影响，已登录用户（`user`）**必须**等待积分估算完成（`!isEstimating && requiredCredits !== null`）才能点击。

#### 场景：已登录用户积分估算中
**前置条件**:
- 用户已登录
- 积分正在估算中（`isEstimating === true`）

**操作**:
1. 用户查看生成按钮

**预期结果**:
- 按钮显示"Estimating..."状态
- 按钮被禁用（不可点击）
- 用户必须等待积分估算完成

#### 场景：已登录用户积分估算失败
**前置条件**:
- 用户已登录
- 积分估算失败（`requiredCredits === null`且`error !== null`）

**操作**:
1. 用户查看生成按钮

**预期结果**:
- 按钮被禁用（不可点击）
- 显示错误提示信息
- 用户需要等待重试或刷新页面

#### 场景：已登录用户积分估算完成
**前置条件**:
- 用户已登录
- 积分估算完成（`!isEstimating && requiredCredits !== null`）

**操作**:
1. 用户查看生成按钮

**预期结果**:
- 按钮可点击
- 显示正确的积分数量
- 用户可以点击执行生成操作

---

### 需求：按钮文本必须仅对已登录用户显示积分信息
**优先级**: 中

生成按钮的文本内容**必须**根据用户登录状态动态调整。积分估算状态（"Estimating..."）**必须**仅在用户已登录时显示，积分数量**必须**仅在用户已登录且估算成功时显示，访客用户**必须**始终看到简洁的操作文本。

#### 场景：已登录用户查看按钮
**前置条件**:
- 用户已登录
- 积分估算完成（`requiredCredits !== null`）

**操作**:
1. 用户查看生成按钮

**预期结果**:
- 按钮显示："Generate Image (10 credits)"
- 积分数量准确反映所需积分
- 显示正常的图标

#### 场景：已登录用户积分估算中
**前置条件**:
- 用户已登录
- 积分正在估算（`isEstimating === true`）

**操作**:
1. 用户查看生成按钮

**预期结果**:
- 按钮显示："Estimating..."
- 显示加载图标（旋转的Loader2）

#### 场景：访客用户查看按钮
**前置条件**:
- 用户未登录

**操作**:
1. 用户查看生成按钮

**预期结果**:
- 按钮显示："Generate Image"（无积分信息）
- 显示正常的图标（魔法棒等）
- 无加载状态

---

## 非功能性需求

### 需求：性能必须优化
**优先级**: 中

系统**必须**通过减少不必要的API调用来提升整体性能。

#### 场景：高并发访客访问
**前置条件**:
- 大量访客用户同时访问生成功能页面

**预期结果**:
- 服务器不接收来自访客用户的积分估算请求
- 服务器负载降低
- 页面加载速度提升

---

### 需求：必须保持向后兼容
**优先级**: 高

修改**必须不**影响已登录用户的现有功能。

#### 场景：已登录用户使用所有功能
**前置条件**:
- 用户已登录
- 使用各种生成功能

**预期结果**:
- 积分估算功能正常工作
- 积分显示准确
- 积分扣除正常
- 积分不足时显示支付按钮
- 所有现有功能与修改前完全一致

---

## 受影响的组件

### 核心组件
- `src/shared/hooks/use-estimate-credits.ts` - 积分估算Hook

### 文本生成图片组件
- `src/themes/default/blocks/flux-2-klein-text-to-image-playground.tsx`
- `src/themes/default/blocks/nano-banana-text-to-image-playground.tsx`
- `src/themes/default/blocks/nano-banana-pro-text-to-image-playground.tsx`
- `src/themes/default/blocks/gpt-image-1-text-to-image-playground.tsx`
- `src/themes/default/blocks/seedream-v4-5-text-to-image-playground.tsx`
- `src/themes/default/blocks/qwen-image-202512-text-to-image-playground.tsx`
- `src/themes/default/blocks/wavespeed-image-generator.tsx`
- `src/shared/blocks/qwen-image-layered/qwen-image-layered.tsx`
- `src/shared/blocks/nano-banana-text-to-image.tsx`

### 图片处理组件
- `src/themes/default/blocks/image-upscaler.tsx`
- `src/themes/default/blocks/image-eraser.tsx`
- `src/themes/default/blocks/image-background-remover.tsx`
- `src/shared/blocks/image-to-image/image-to-image.tsx`
- `src/shared/blocks/flux-2-klein-image-to-image/flux-2-klein-image-to-image.tsx`
- `src/shared/blocks/faceswrap/single-face-swap.tsx`

### 视频生成组件
- `src/shared/blocks/text-to-video/ltx-2-fast/text-to-video.tsx`
- `src/shared/blocks/text-to-video/veo-3-1/text-to-video.tsx`
- `src/shared/blocks/text-to-video/wan-2-6/text-to-video.tsx`
- `src/shared/blocks/text-to-video/seedance-1-5-pro/text-to-video.tsx`
- `src/shared/blocks/image-to-video/ltx-2-fast/image-to-video.tsx`
- `src/shared/blocks/image-to-video/veo-3-1/image-to-video.tsx`
- `src/shared/blocks/image-to-video/seedance-1-5-pro/image-to-video.tsx`

### 特殊组件
- `src/shared/blocks/longcat-avatar/longcat-avatar.tsx`
- `src/shared/blocks/kling-v2.6-pro/motion-control/motion-control.tsx`

---

## 测试要求

### 单元测试
- `useEstimateCredits` Hook在访客用户场景下的行为
- `useEstimateCredits` Hook在已登录用户场景下的行为

### 集成测试
- 访客用户完整流程：访问页面 → 点击按钮 → 显示登录框
- 已登录用户完整流程：访问页面 → 查看积分 → 生成内容 → 扣除积分

### 端到端测试
- 在所有25个受影响组件中测试访客用户体验
- 在所有25个受影响组件中测试已登录用户体验
- 测试登录状态切换场景

---

## 验收标准

### 访客用户
- ✅ 不触发`/api/ai/estimate-credits`请求
- ✅ 生成按钮可点击
- ✅ 按钮不显示积分信息
- ✅ 点击按钮显示登录框

### 已登录用户
- ✅ 积分估算正常工作
- ✅ 按钮显示正确的积分数量
- ✅ 积分不足时显示支付按钮
- ✅ 所有生成功能正常工作

### 性能
- ✅ 访客用户页面加载速度提升
- ✅ 服务器积分估算API调用量减少

### 代码质量
- ✅ 无TypeScript类型错误
- ✅ 通过ESLint检查
- ✅ 代码可读性良好
- ✅ 无控制台错误或警告
