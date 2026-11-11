# 埋点事件接入文档

## 背景

当前项目已经接入 Google Tag / `gtag` 事件上报，主要覆盖购买漏斗的关键节点：

- `login`
- `begin_checkout`
- `purchase`

这套实现的目标是：

- 所有前台购买入口尽量走统一埋点逻辑
- 支付成功后不依赖单一前端页面猜测结果，而是以服务端确认订单状态为准
- `purchase` 只在订单真实成功后上报，并避免重复上报

## 本次做了什么

### 1. 新增统一的 Google Tag 工具

文件：

- [src/shared/lib/google-tag.ts](/Users/admin/project/10bai/z-image.ai/src/shared/lib/google-tag.ts)

提供了这些能力：

- `trackGoogleTagEvent(eventName, params)`：发送 `gtag('event', ...)`
- `setGoogleTagUserData(userData)`：设置增强型转化需要的 `user_data`
- `rememberPendingLogin(method)`：登录前记录一次“登录意图”
- `consumePendingLogin()`：登录成功后消费这次意图并触发 `login`
- `hasTrackedPurchase(orderNo)` / `markPurchaseTracked(orderNo)`：按订单号去重 `purchase`

### 2. 新增统一的 checkout helper

文件：

- [src/shared/lib/payment-checkout.ts](/Users/admin/project/10bai/z-image.ai/src/shared/lib/payment-checkout.ts)

提供了这些能力：

- `requestCheckoutSession(params, tracking)`：统一请求 `/api/payment/checkout`
- 成功拿到 checkout URL 后自动发送 `begin_checkout`
- 统一处理常见错误
- `normalizeCheckoutValue(value)`：把价格字符串或数字转换成可上报的金额

### 3. 把购买入口统一到同一套 begin_checkout 逻辑

已接入的前台入口：

- [src/shared/blocks/payment/pricing-prompt.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/payment/pricing-prompt.tsx)
- [src/themes/default/blocks/pricing.tsx](/Users/admin/project/10bai/z-image.ai/src/themes/default/blocks/pricing.tsx)
- [src/themes/default/blocks/pricing-mobile.tsx](/Users/admin/project/10bai/z-image.ai/src/themes/default/blocks/pricing-mobile.tsx)
- [src/app/[locale]/popup/popup-preview.tsx](/Users/admin/project/10bai/z-image.ai/src/app/[locale]/popup/popup-preview.tsx)
- [src/shared/contexts/app.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/contexts/app.tsx)

这样做的结果是：

- 不管用户从哪个前台购买入口发起支付，都走同一套 `begin_checkout`
- 登录后自动续接 checkout 的场景也会正常上报 `begin_checkout`

### 4. 给登录事件补了稳定触发点

已接入文件：

- [src/shared/blocks/sign/sign-in.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/sign/sign-in.tsx)
- [src/shared/blocks/sign/sign-in-form.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/sign/sign-in-form.tsx)
- [src/shared/blocks/sign/social-providers.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/sign/social-providers.tsx)
- [src/shared/contexts/app.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/contexts/app.tsx)

触发方式：

- 点击登录前先 `rememberPendingLogin(method)`
- session 真正建立后，在 `AppContext` 里消费这次登录意图并发送 `login`

这样比“点击按钮立刻记登录”更稳，因为不会把失败登录也算进去。

### 5. 支付成功回跳改成固定成功页

相关文件：

- [src/app/api/payment/checkout/route.ts](/Users/admin/project/10bai/z-image.ai/src/app/api/payment/checkout/route.ts)
- [src/app/[locale]/(landing)/checkout/success/page.tsx](</Users/admin/project/10bai/z-image.ai/src/app/[locale]/(landing)/checkout/success/page.tsx>)
- [src/shared/blocks/payment/checkout-success.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/payment/checkout-success.tsx)

现在支付成功流程是：

1. 服务端创建订单时，把 provider 的 `successUrl` 统一设为 `/checkout/success?order_no=...`
2. 用户支付完成后，provider 回跳到固定成功页
3. 成功页调用确认接口轮询订单状态
4. 订单变成 `paid` 后发送 `purchase`

### 6. 把订单确认逻辑抽成服务端复用方法

相关文件：

- [src/shared/services/payment.ts](/Users/admin/project/10bai/z-image.ai/src/shared/services/payment.ts)
- [src/app/api/payment/confirm/route.ts](/Users/admin/project/10bai/z-image.ai/src/app/api/payment/confirm/route.ts)
- [src/app/api/payment/callback/route.ts](/Users/admin/project/10bai/z-image.ai/src/app/api/payment/callback/route.ts)

新增了：

- `confirmCheckoutOrder({ orderNo, userId })`

作用：

- 拉取 provider 侧支付状态
- 执行既有的 `handleCheckoutSuccess`
- 返回最新订单

这样 `/api/payment/callback` 和前端成功页都能复用同一套确认逻辑。

## 当前事件说明

### login

触发时机：

- 用户发起登录并最终成功建立 session 后

事件参数：

- `method`

### begin_checkout

触发时机：

- 前端成功拿到 provider checkout URL，准备跳转到收银台时

事件参数：

- `currency`
- `value`
- `payment_provider`
- `coupon`
- `items`

### purchase

触发时机：

- 成功页确认订单状态为 `paid` 后

事件参数：

- `transaction_id`
- `value`
- `currency`
- `coupon`
- `items`

增强型转化相关：

- 上报前会调用 `setGoogleTagUserData({ email })`
- email 取自支付确认后的订单信息

去重方式：

- 用 `orderNo` 存在 localStorage，防止同一笔订单重复上报

## 如何新增一个事件

推荐优先级：

1. 先找“业务真正成功”的位置
2. 再决定是客户端发，还是服务端确认后客户端发
3. 尽量走公共 helper，不要在多个组件里手写重复 `gtag`

### 场景一：普通前端交互事件

例如：

- `trial_start`
- `generate_click`
- `upgrade_modal_open`

写法示例：

```ts
import { trackGoogleTagEvent } from "@/shared/lib/google-tag";

trackGoogleTagEvent("trial_start", {
  plan: "free_trial",
  source: "pricing_modal",
});
```

建议位置：

- 触发动作所在的 client component

注意：

- 只在真正发生该动作时发送
- 参数尽量稳定，字段名不要频繁变

### 场景二：和下单动作强相关的事件

如果事件语义接近“开始付款”：

- 不要手写 `fetch("/api/payment/checkout")`
- 统一走 `requestCheckoutSession(...)`

示例：

```ts
import { requestCheckoutSession } from "@/shared/lib/payment-checkout";

const { checkoutUrl } = await requestCheckoutSession(
  {
    product_id: productId,
    currency: "USD",
    locale: "en",
    payment_provider: "stripe",
    metadata: {},
  },
  {
    productId,
    productName: "Pro Plan",
    currency: "USD",
    value: 9.9,
    paymentProvider: "stripe",
  },
);
```

这样会自动发 `begin_checkout`。

### 场景三：和“支付成功”类似的事件

例如：

- `subscription_start`
- `renewal_success`
- `addon_purchase`

推荐方式：

1. 优先在服务端确认到真实订单成功后再决定是否上报
2. 如果最后仍然由前端发送，确保前端拿到的是服务端确认后的结果
3. 必要时用订单号、事务号做去重

如果事件需要增强型转化用户数据，示例：

```ts
import {
  setGoogleTagUserData,
  trackGoogleTagEvent,
} from "@/shared/lib/google-tag";

setGoogleTagUserData({
  email: userEmail,
});

trackGoogleTagEvent("addon_purchase", {
  transaction_id: orderNo,
  value: 19.9,
  currency: "USD",
});
```

## 推荐接入规范

### 1. 事件名

优先使用 Google 常见命名：

- `login`
- `sign_up`
- `begin_checkout`
- `purchase`
- `generate_lead`

自定义事件也可以，但尽量短且稳定。

### 2. 参数命名

优先使用稳定字段：

- `value`
- `currency`
- `method`
- `plan`
- `source`
- `transaction_id`
- `items`

避免：

- 同一语义今天叫 `price`，明天叫 `amount`
- 同一个字段在不同页面传不同类型

### 3. 去重

以下事件建议做去重：

- `purchase`
- `renewal_success`
- `addon_purchase`

常见去重键：

- `orderNo`
- `transactionId`
- `subscriptionId + billing_period`

### 4. 客户端 vs 服务端

适合客户端直接发：

- 点击
- 弹窗展示
- 页面内流程步骤

适合以服务端结果为准：

- 购买成功
- 续费成功
- 补充包加购成功
- 涉及佣金或归因确认的事件

## 后续建议

还可以继续补：

- `trial_start`
- `sign_up`
- `addon_purchase`
- `renewal_success`

如果后面要做 Google Ads 更强的归因闭环，建议继续补：

- `GCLID` 持久化入库
- 补充包购买时带出历史 `GCLID`
- 后端统一发送更完整的转化事件

## 修改文件清单

- [src/shared/lib/google-tag.ts](/Users/admin/project/10bai/z-image.ai/src/shared/lib/google-tag.ts)
- [src/shared/lib/payment-checkout.ts](/Users/admin/project/10bai/z-image.ai/src/shared/lib/payment-checkout.ts)
- [src/shared/contexts/app.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/contexts/app.tsx)
- [src/shared/blocks/sign/sign-in.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/sign/sign-in.tsx)
- [src/shared/blocks/sign/sign-in-form.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/sign/sign-in-form.tsx)
- [src/shared/blocks/sign/social-providers.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/sign/social-providers.tsx)
- [src/shared/blocks/payment/pricing-prompt.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/payment/pricing-prompt.tsx)
- [src/themes/default/blocks/pricing.tsx](/Users/admin/project/10bai/z-image.ai/src/themes/default/blocks/pricing.tsx)
- [src/themes/default/blocks/pricing-mobile.tsx](/Users/admin/project/10bai/z-image.ai/src/themes/default/blocks/pricing-mobile.tsx)
- [src/app/[locale]/popup/popup-preview.tsx](/Users/admin/project/10bai/z-image.ai/src/app/[locale]/popup/popup-preview.tsx)
- [src/shared/services/payment.ts](/Users/admin/project/10bai/z-image.ai/src/shared/services/payment.ts)
- [src/app/api/payment/checkout/route.ts](/Users/admin/project/10bai/z-image.ai/src/app/api/payment/checkout/route.ts)
- [src/app/api/payment/callback/route.ts](/Users/admin/project/10bai/z-image.ai/src/app/api/payment/callback/route.ts)
- [src/app/api/payment/confirm/route.ts](/Users/admin/project/10bai/z-image.ai/src/app/api/payment/confirm/route.ts)
- [src/shared/blocks/payment/checkout-success.tsx](/Users/admin/project/10bai/z-image.ai/src/shared/blocks/payment/checkout-success.tsx)
- [src/app/[locale]/(landing)/checkout/success/page.tsx](</Users/admin/project/10bai/z-image.ai/src/app/[locale]/(landing)/checkout/success/page.tsx>)
