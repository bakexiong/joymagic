# 提案：优化访客用户积分显示体验

## 变更ID
`optimize-guest-credits-ux`

## 为什么
当前系统在未登录（访客）用户使用各种AI生成功能时，会调用`useEstimateCredits` Hook来计算所需积分。这导致以下问题：

1. **不必要的API调用**：访客用户无法使用积分，但系统仍然会发起积分估算API请求，浪费服务器资源
2. **按钮禁用问题**：在积分估算期间（`isEstimating=true`）或估算失败（`requiredCredits=null`）时，生成按钮被禁用，访客用户无法点击按钮触发登录流程
3. **用户体验混乱**：按钮上显示积分信息和加载状态，但访客用户点击后应该直接显示登录框，而不是被阻止操作

这些问题导致访客用户无法顺畅地体验产品功能并转化为注册用户。

## 变更内容
优化访客用户的交互体验：
- 在`useEstimateCredits` Hook中检测用户登录状态，访客用户不触发积分估算API调用
- 修改所有使用该Hook的组件，使访客用户的生成按钮始终保持可点击状态
- 访客用户的按钮上不显示积分相关信息（包括加载状态和积分数量）
- 访客用户点击按钮时直接显示登录框，引导用户注册/登录

## 当前实现分析

### useEstimateCredits Hook
- 位置：`src/shared/hooks/use-estimate-credits.ts`
- 功能：调用`/api/ai/estimate-credits`接口获取所需积分
- 返回值：`{ credits, isLoading, error, refetch }`
- 问题：无论用户是否登录都会执行

### 使用场景
在25个文件中使用，包括：
- 文本生成图片（Flux, Nano Banana, GPT Image等）
- 图片处理（背景移除、橡皮擦、放大等）
- 视频生成（LTX, Veo, Seedance等）

### 典型使用模式
```tsx
const { credits: requiredCredits, isLoading: isEstimating, error: estimateError } =
  useEstimateCredits('flux-2-klein-text-to-image');

<Button
  onClick={generateImage}
  disabled={isGenerating || !prompt.trim() || isCheckingGeo || isRestricted || isEstimating || requiredCredits === null}
>
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
</Button>
```

### 问题点
1. `disabled`条件包含`isEstimating || requiredCredits === null`，导致访客用户按钮也被禁用（应该只对已登录用户禁用）
2. 按钮文本对访客用户也显示积分估算状态和积分数量
3. 访客用户无法点击按钮触发登录流程

## 解决方案

### 方案1：在useEstimateCredits中检测用户登录状态（推荐）
**优点**：
- 集中处理逻辑，所有使用该Hook的地方自动受益
- 减少代码重复
- 访客用户直接返回null，不发起API请求

**缺点**：
- Hook需要访问用户上下文

**实现**：
```tsx
export function useEstimateCredits(
    apiKey: string,
    params?: Record<string, any>,
    options: UseEstimateCreditsOptions = {}
): UseEstimateCreditsResult {
    const { user } = useAppContext(); // 获取用户信息
    const { enabled = true, debounceMs = 300 } = options;

    // 如果用户未登录，直接返回null，不进行估算
    if (!user) {
        return {
            credits: null,
            isLoading: false,
            error: null,
            refetch: () => {},
        };
    }

    // 原有逻辑...
}
```

### 方案2：在每个使用点传递enabled参数
**优点**：
- Hook保持纯粹，不依赖用户上下文

**缺点**：
- 需要修改25个使用点
- 容易遗漏
- 代码重复

### 方案3：创建新的useEstimateCreditsForGuest Hook
**优点**：
- 不影响现有代码

**缺点**：
- 增加维护成本
- 需要在每个地方选择使用哪个Hook

## 推荐方案
采用**方案1**，在`useEstimateCredits` Hook内部检测用户登录状态。

## 实施步骤

### 1. 修改useEstimateCredits Hook
- 导入`useAppContext`
- 在Hook开始处检查用户登录状态
- 未登录时直接返回空值，不执行API调用

### 2. 修改按钮禁用逻辑
在所有使用`useEstimateCredits`的组件中：
- 将`disabled`条件从：`isGenerating || !prompt.trim() || isCheckingGeo || isRestricted || isEstimating || requiredCredits === null`
- 修改为：`isGenerating || !prompt.trim() || isCheckingGeo || isRestricted || (user && (isEstimating || requiredCredits === null))`
- 即：仅对已登录用户应用积分估算相关的禁用条件
- 访客用户按钮保持可点击状态

### 3. 修改按钮显示逻辑
- 仅在用户已登录且积分估算完成时显示积分信息
- 访客用户不显示"Estimating..."状态
- 访客用户不显示积分数量

### 4. 确保登录流程正常
- 访客用户点击生成按钮时，在`generateImage`等函数中检测到未登录
- 调用`setIsShowSignModal(true)`显示登录框
- 这个逻辑已经存在，无需修改

## 影响范围

### 需要修改的文件
1. `src/shared/hooks/use-estimate-credits.ts` - Hook核心逻辑
2. 25个使用`useEstimateCredits`的组件文件 - 按钮禁用和显示逻辑

### 不影响的功能
- 已登录用户的积分估算功能
- 积分扣除逻辑
- 支付流程

## 预期效果

### 访客用户体验
- ✅ 按钮始终可点击
- ✅ 不显示积分加载状态
- ✅ 不显示积分数量
- ✅ 点击后直接显示登录框
- ✅ 不发起不必要的API请求

### 已登录用户体验
- ✅ 保持现有功能不变
- ✅ 正常显示积分估算和数量
- ✅ 积分不足时显示支付按钮

## 风险评估

### 低风险
- Hook逻辑简单，仅添加早期返回
- 不影响已登录用户的现有功能
- 按钮禁用逻辑修改清晰明确

### 测试要点
1. 访客用户点击生成按钮能否正常显示登录框
2. 已登录用户积分估算是否正常工作
3. 已登录用户积分不足时是否显示支付按钮
4. 各种生成功能（图片、视频、图片处理）是否都正常工作

## 替代方案考虑

### 不修改Hook，仅修改UI逻辑
如果不想修改Hook，可以在每个组件中：
```tsx
const isGuest = !user;
const shouldDisableForCredits = !isGuest && (isEstimating || requiredCredits === null);

<Button
  disabled={isGenerating || !prompt.trim() || shouldDisableForCredits}
>
  {!isGuest && isEstimating ? '...' : 'Generate'}
</Button>
```

**不推荐原因**：
- 需要在25个地方重复相同逻辑
- 访客用户仍然会发起API请求（浪费资源）
- 代码可读性差

## 总结
通过在`useEstimateCredits` Hook中检测用户登录状态，并调整按钮的禁用和显示逻辑，可以显著改善访客用户的体验，同时减少不必要的服务器负载。该方案实施简单、风险低、效果明显。
