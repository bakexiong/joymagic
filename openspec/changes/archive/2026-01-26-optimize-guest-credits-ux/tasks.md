# 任务列表：优化访客用户积分显示体验

## 任务概述
本变更旨在优化未登录用户使用AI生成功能时的体验，避免不必要的积分估算API调用，确保按钮可点击，并在点击时显示登录框。

## 任务分解

### 1. 修改useEstimateCredits Hook核心逻辑
**文件**: `src/shared/hooks/use-estimate-credits.ts`

**工作内容**:
- 导入`useAppContext`以获取用户登录状态
- 在Hook函数开始处添加用户登录检查
- 如果用户未登录（`!user`），直接返回空值对象：
  ```tsx
  {
    credits: null,
    isLoading: false,
    error: null,
    refetch: () => {}
  }
  ```
- 确保不发起任何API请求

**验证标准**:
- 访客用户调用Hook时不触发`/api/ai/estimate-credits`请求
- 返回值中`isLoading`始终为`false`
- 已登录用户功能不受影响

**依赖**: 无

---

### 2. 修改文本生成图片组件（第1批）
**文件**:
- `src/themes/default/blocks/flux-2-klein-text-to-image-playground.tsx`
- `src/themes/default/blocks/nano-banana-text-to-image-playground.tsx`
- `src/themes/default/blocks/nano-banana-pro-text-to-image-playground.tsx`
- `src/themes/default/blocks/gpt-image-1-text-to-image-playground.tsx`
- `src/themes/default/blocks/seedream-v4-5-text-to-image-playground.tsx`

**工作内容**:
对每个文件执行以下修改：

1. **修改按钮禁用逻辑**：
   - 找到生成按钮的`disabled`属性
   - 将积分估算相关条件改为仅对已登录用户生效
   - 保留其他业务逻辑条件（如`isGenerating`、`!prompt.trim()`、`isCheckingGeo`、`isRestricted`）

   修改前：
   ```tsx
   disabled={isGenerating || !prompt.trim() || isCheckingGeo || isRestricted || isEstimating || requiredCredits === null}
   ```

   修改后：
   ```tsx
   disabled={isGenerating || !prompt.trim() || isCheckingGeo || isRestricted || (user && (isEstimating || requiredCredits === null))}
   ```

   **关键点**：
   - 访客用户（`!user`）：按钮不受积分估算状态影响，可点击
   - 已登录用户（`user`）：必须等待积分估算完成（`!isEstimating && requiredCredits !== null`）才能点击

2. **修改按钮显示逻辑**：
   - 仅在用户已登录时显示积分估算状态和积分数量
   - 访客用户不显示"Estimating..."状态

   修改前：
   ```tsx
   {isEstimating ? (
     <>
       <Loader2 className="h-4 w-4 animate-spin" />
       {t2('status.estimating', { defaultValue: 'Estimating...' })}
     </>
   ) : (
     <>
       <Wand2 className="h-4 w-4" />
       <span>
         {t('buttons.generate', { defaultValue: 'Generate Image' })}
         {!isGenerating && !isCheckingGeo && !isRestricted && !isEstimating && (
           <span className="ml-1.5 opacity-90">
             ({requiredCredits ?? '...'} {t2('buttons.credits', { defaultValue: 'credits' })})
           </span>
         )}
       </span>
     </>
   )}
   ```

   修改后：
   ```tsx
   {user && isEstimating ? (
     <>
       <Loader2 className="h-4 w-4 animate-spin" />
       {t2('status.estimating', { defaultValue: 'Estimating...' })}
     </>
   ) : (
     <>
       <Wand2 className="h-4 w-4" />
       <span>
         {t('buttons.generate', { defaultValue: 'Generate Image' })}
         {user && !isGenerating && !isCheckingGeo && !isRestricted && !isEstimating && requiredCredits !== null && (
           <span className="ml-1.5 opacity-90">
             ({requiredCredits} {t2('buttons.credits', { defaultValue: 'credits' })})
           </span>
         )}
       </span>
     </>
   )}
   ```

**验证标准**:
- 访客用户看到的按钮文本为"Generate Image"（无积分信息）
- 访客用户按钮始终可点击（不受积分估算状态影响）
- 访客用户点击后显示登录框
- 已登录用户在积分估算期间按钮被禁用
- 已登录用户积分估算完成后按钮可点击，并显示正确的积分数量

**依赖**: 任务1完成

---

### 3. 修改文本生成图片组件（第2批）
**文件**:
- `src/themes/default/blocks/qwen-image-202512-text-to-image-playground.tsx`
- `src/themes/default/blocks/wavespeed-image-generator.tsx`
- `src/shared/blocks/qwen-image-layered/qwen-image-layered.tsx`
- `src/shared/blocks/nano-banana-text-to-image.tsx`

**工作内容**: 与任务2相同（注意保留积分估算相关的禁用条件，但仅对已登录用户生效）

**验证标准**: 与任务2相同

**依赖**: 任务1完成（可与任务2并行）

---

### 4. 修改图片处理组件
**文件**:
- `src/themes/default/blocks/image-upscaler.tsx`
- `src/themes/default/blocks/image-eraser.tsx`
- `src/themes/default/blocks/image-background-remover.tsx`
- `src/shared/blocks/image-to-image/image-to-image.tsx`
- `src/shared/blocks/flux-2-klein-image-to-image/flux-2-klein-image-to-image.tsx`
- `src/shared/blocks/faceswrap/single-face-swap.tsx`

**工作内容**:
与任务2类似，但需要注意：
- 这些组件的禁用条件可能包含`!sourceImageFileRef.current`等图片相关检查
- 保留这些业务逻辑条件
- 将积分估算相关条件改为：`(user && (isEstimating || requiredCredits === null))`

**验证标准**:
- 访客用户上传图片后按钮可点击（不受积分估算状态影响）
- 访客用户点击后显示登录框
- 已登录用户必须等待积分估算完成才能点击
- 已登录用户功能正常

**依赖**: 任务1完成（可与任务2、3并行）

---

### 5. 修改视频生成组件（文本生成视频）
**文件**:
- `src/shared/blocks/text-to-video/ltx-2-fast/text-to-video.tsx`
- `src/shared/blocks/text-to-video/veo-3-1/text-to-video.tsx`
- `src/shared/blocks/text-to-video/wan-2-6/text-to-video.tsx`
- `src/shared/blocks/text-to-video/seedance-1-5-pro/text-to-video.tsx`

**工作内容**: 与任务2相同（注意保留积分估算相关的禁用条件，但仅对已登录用户生效）

**验证标准**: 与任务2相同

**依赖**: 任务1完成（可与任务2、3、4并行）

---

### 6. 修改视频生成组件（图片生成视频）
**文件**:
- `src/shared/blocks/image-to-video/ltx-2-fast/image-to-video.tsx`
- `src/shared/blocks/image-to-video/veo-3-1/image-to-video.tsx`
- `src/shared/blocks/image-to-video/seedance-1-5-pro/image-to-video.tsx`

**工作内容**: 与任务4类似（图片相关组件）

**验证标准**: 与任务4相同

**依赖**: 任务1完成（可与任务2、3、4、5并行）

---

### 7. 修改特殊组件
**文件**:
- `src/shared/blocks/longcat-avatar/longcat-avatar.tsx`
- `src/shared/blocks/kling-v2.6-pro/motion-control/motion-control.tsx`

**工作内容**: 根据具体组件结构调整，原则与任务2相同

**验证标准**: 与任务2相同

**依赖**: 任务1完成（可与其他任务并行）

---

### 8. 端到端测试
**工作内容**:
1. **访客用户测试**:
   - 访问各种生成功能页面
   - 确认按钮可点击且不显示积分信息
   - 点击按钮确认显示登录框
   - 检查浏览器开发者工具，确认没有`/api/ai/estimate-credits`请求

2. **已登录用户测试**:
   - 登录后访问各种生成功能
   - 确认积分估算正常工作
   - 确认在积分估算期间按钮被禁用
   - 确认积分估算完成后按钮可点击并显示正确的积分数量
   - 确认积分不足时显示支付按钮
   - 测试实际生成功能是否正常

3. **边界情况测试**:
   - 在生成过程中登出
   - 在未登录状态下刷新页面
   - 快速切换登录/登出状态

**验证标准**:
- 所有测试场景通过
- 无控制台错误
- 用户体验流畅

**依赖**: 任务2-7全部完成

---

### 9. 代码审查和清理
**工作内容**:
- 检查是否有遗漏的`useEstimateCredits`使用点
- 确认代码风格一致
- 检查是否有未使用的变量或导入
- 更新相关注释（如有必要）

**验证标准**:
- 代码通过lint检查
- 无TypeScript类型错误
- 代码可读性良好

**依赖**: 任务8完成

---

## 任务执行顺序

### 串行任务
1. 任务1（Hook修改）→ 必须首先完成

### 并行任务（任务1完成后）
2. 任务2、3、4、5、6、7可以并行执行

### 串行任务（所有组件修改完成后）
3. 任务8（测试）→ 任务9（审查）

## 预估工作量
- 任务1: 核心Hook修改（简单，约10分钟）
- 任务2-7: 25个组件修改（重复性工作，每个约5分钟，共约2小时）
- 任务8: 端到端测试（约30分钟）
- 任务9: 代码审查（约15分钟）

## 回滚计划
如果发现问题，可以：
1. 回滚任务1的Hook修改，恢复原有逻辑
2. 回滚各组件的按钮逻辑修改
3. 使用git revert恢复到变更前状态

## 注意事项
1. 确保在修改前备份或提交当前代码
2. 每完成一批组件修改后进行局部测试
3. 注意不同组件可能有细微差异，需要根据实际情况调整
4. 保持已登录用户的现有功能完全不变
