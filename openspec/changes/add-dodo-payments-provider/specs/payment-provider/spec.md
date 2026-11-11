## 新增需求

### 需求：系统必须支持 Dodo Payments 作为支付提供商

系统必须在现有统一支付抽象层中支持 `Dodo Payments`，并复用现有订单、订阅、积分和 webhook 处理链路。

#### 场景：创建 Dodo Checkout Session

- **当** 用户选择 `dodo` 作为支付提供商并发起下单
- **那么** 系统必须使用服务端 API Key 创建 Dodo checkout session
- **并且** 系统必须返回可跳转的 `checkout_url`
- **并且** 系统不得在前端暴露任何 Dodo 密钥

#### 场景：订阅支付回填现有订阅模型

- **当** Dodo 返回订阅型支付成功或订阅更新事件
- **那么** 系统必须将 `subscription_id / 周期起止 / 状态 / customer_id` 映射到现有订阅模型
- **并且** 系统必须保持现有订单、续费和取消订阅流程可用

#### 场景：校验 Dodo Webhook

- **当** Dodo 向系统发送 webhook
- **那么** 系统必须使用服务端 webhook key 校验签名
- **并且** 仅在校验成功后处理订单或订阅事件

#### 场景：用户进入 Dodo Customer Portal

- **当** 已订阅用户从站内进入账单管理入口
- **那么** 系统必须为该用户创建 Dodo customer portal session
- **并且** 系统必须重定向到 Dodo 返回的 portal 链接
