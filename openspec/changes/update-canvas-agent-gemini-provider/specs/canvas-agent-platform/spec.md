## 修改需求

### 需求：系统必须为 Canvas Agent 按模型选择服务端 provider

系统必须根据 Canvas Agent 当前选择的模型标识，在服务端选择匹配的模型 provider，而不能默认将所有模型都路由到同一种第三方协议。

#### 场景：Gemini 模型走 Gemini SDK

- **当** Canvas Agent 选择的模型标识属于 Gemini 模型
- **那么** 服务端必须使用 Gemini SDK 创建聊天模型
- **并且** 必须使用后端 `gemini_api_key` 或等价服务端安全配置
- **并且** 不得要求前端传入或持有 Gemini 密钥

#### 场景：非 Gemini 模型继续走 OpenRouter

- **当** Canvas Agent 选择的模型标识不属于 Gemini 模型
- **那么** 服务端必须继续使用 OpenRouter provider
- **并且** 不得改变现有非 Gemini 模型的请求协议

#### 场景：Gemini 配置缺失

- **当** 系统需要为 Gemini 模型创建聊天模型，但未配置有效的 `gemini_api_key`
- **那么** 服务端必须返回明确的配置错误
- **并且** 不得静默回退到 OpenRouter 伪装执行
