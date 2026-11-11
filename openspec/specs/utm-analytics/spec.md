# utm-analytics 规范

## 目的
待定 - 由归档变更 add-utm-tracking 创建。归档后请更新目的。
## 需求
### 需求：系统必须将 UTM 数据传递给 Google Analytics

系统必须将 UTM 数据作为自定义维度传递给 Google Analytics 4。

#### 场景：页面浏览时发送 UTM 数据

**前置条件：**
- Google Analytics 已配置
- 用户访问页面
- 客户端存储了 UTM 数据

**操作：**
1. 页面加载时，从 localStorage 读取 UTM 数据
2. 将 UTM 数据作为自定义维度发送给 GA4
3. 使用 gtag 或 GA4 SDK 发送事件

**预期结果：**
- GA4 接收到包含 UTM 数据的页面浏览事件
- 自定义维度包括：
  - `first_utm_source`
  - `first_utm_medium`
  - `first_utm_campaign`
  - `first_utm_content`
  - `first_utm_term`

#### 场景：用户注册时发送 UTM 数据

**前置条件：**
- 用户完成注册
- 客户端存储了 UTM 数据

**操作：**
1. 注册成功后，触发 GA4 转化事件
2. 将 UTM 数据作为事件参数发送
3. 事件名称：`sign_up`

**预期结果：**
- GA4 接收到 `sign_up` 事件
- 事件参数包含完整的 UTM 数据
- 可在 GA4 中按 UTM 维度分析注册转化

#### 场景：用户购买时发送 UTM 数据

**前置条件：**
- 用户完成购买
- 用户账户关联了 UTM 数据

**操作：**
1. 购买成功后，从数据库读取用户的首次访问 UTM 数据
2. 触发 GA4 购买事件
3. 将 UTM 数据作为事件参数发送
4. 事件名称：`purchase`

**预期结果：**
- GA4 接收到 `purchase` 事件
- 事件参数包含用户的首次访问 UTM 数据
- 可在 GA4 中按 UTM 维度分析购买转化和 ROI

### 需求：系统必须将 UTM 数据传递给 Plausible Analytics

系统必须将 UTM 数据作为自定义属性传递给 Plausible。

#### 场景：发送页面浏览事件到 Plausible

**前置条件：**
- Plausible Analytics 已配置
- 用户访问页面
- 客户端存储了 UTM 数据

**操作：**
1. 页面加载时，从 localStorage 读取 UTM 数据
2. 使用 Plausible 的自定义事件 API 发送数据
3. 将 UTM 参数作为事件属性（props）

**预期结果：**
- Plausible 接收到页面浏览事件
- 事件属性包含 UTM 数据
- 可在 Plausible 中按 UTM 维度筛选和分析

#### 场景：发送自定义转化事件到 Plausible

**前置条件：**
- 用户完成关键操作（注册、购买等）
- 用户账户关联了 UTM 数据

**操作：**
1. 触发自定义事件（例如：`Signup`, `Purchase`）
2. 从数据库读取用户的 UTM 数据
3. 将 UTM 数据作为事件属性发送

**预期结果：**
- Plausible 接收到自定义事件
- 事件属性包含 UTM 数据
- 可在 Plausible 中创建转化漏斗并按 UTM 分析

### 需求：系统必须将 UTM 数据传递给 OpenPanel

系统必须将 UTM 数据集成到 OpenPanel 分析中。

#### 场景：识别用户时发送 UTM 数据

**前置条件：**
- OpenPanel 已配置
- 用户登录或注册
- 用户账户关联了 UTM 数据

**操作：**
1. 用户登录/注册后，调用 OpenPanel 的 identify API
2. 将用户的 UTM 数据作为用户属性发送
3. 关联到用户 profile

**预期结果：**
- OpenPanel 用户 profile 包含 UTM 数据
- 可在 OpenPanel 中按 UTM 维度分析用户行为
- 支持用户级别的归因分析

#### 场景：追踪事件时包含 UTM 数据

**前置条件：**
- 用户触发关键事件
- 用户账户关联了 UTM 数据

**操作：**
1. 触发 OpenPanel 事件
2. 将 UTM 数据作为事件属性发送

**预期结果：**
- 事件包含 UTM 上下文
- 可在 OpenPanel 中创建基于 UTM 的分析报告

### 需求：系统必须将 UTM 数据传递给 Microsoft Clarity

系统必须将 UTM 数据作为自定义标签传递给 Clarity。

#### 场景：设置 Clarity 自定义标签

**前置条件：**
- Microsoft Clarity 已配置
- 用户访问页面
- 客户端存储了 UTM 数据

**操作：**
1. 页面加载时，从 localStorage 读取 UTM 数据
2. 使用 Clarity API 设置自定义标签
3. 标签包含主要 UTM 参数（source, medium, campaign）

**预期结果：**
- Clarity 会话包含 UTM 标签
- 可在 Clarity 中按 UTM 筛选会话录像
- 可分析不同 UTM 来源的用户行为模式

### 需求：系统必须支持服务端事件追踪

系统必须支持在服务端发送包含 UTM 数据的事件到分析工具。

#### 场景：服务端发送注册事件

**前置条件：**
- 用户完成注册
- 注册请求包含 UTM 数据
- 配置了服务端分析集成

**操作：**
1. 用户注册成功后，在服务端触发事件
2. 从数据库读取用户的 UTM 数据
3. 通过服务端 API 发送事件到分析工具（GA4 Measurement Protocol, Plausible Events API 等）

**预期结果：**
- 分析工具接收到服务端事件
- 事件包含完整的 UTM 数据
- 即使客户端禁用 JavaScript 或广告拦截器，事件仍能被追踪

#### 场景：服务端发送购买事件

**前置条件：**
- 用户完成购买
- 支付成功回调在服务端处理

**操作：**
1. 支付成功后，在服务端触发购买事件
2. 从数据库读取用户的首次访问 UTM 数据
3. 发送包含 UTM 数据和交易信息的事件

**预期结果：**
- 分析工具接收到准确的购买事件
- 可进行精确的 ROI 归因分析
- 避免客户端追踪的不准确性

