# 变更：新增 Dodo Payments 支付适配

## 为什么

当前项目支付抽象层仅支持 `Stripe / Creem / PayPal`，无法直接使用 Dodo Payments 的 checkout session、customer portal 和 webhook 能力。为了切换现有支付链路到 Dodo，需要补齐 provider、后台配置和订单/订阅映射。

## 变更内容

- 新增 `Dodo Payments` 支付 provider，并接入 checkout、session 查询、webhook 校验与 customer portal
- 扩展支付配置中心，支持 Dodo API Key、Webhook Key、环境和产品映射配置
- 更新订单创建流程，使 Dodo 可复用现有 `payment_product_id` / 配置映射、折扣码和订阅取消链路
- 更新前后台 provider 展示与筛选，允许选择 Dodo 作为默认支付方式

## 影响

- 受影响规范：`payment-provider`
- 受影响代码：`src/extensions/payment/*`，`src/shared/services/payment.ts`，`src/shared/services/settings.ts`，`src/app/api/payment/*`，支付入口与 admin 支付页面
