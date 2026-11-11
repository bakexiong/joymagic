## 1. 设计与依赖

- [x] 1.1 明确 Gemini 模型识别规则与 provider 路由边界
- [x] 1.2 引入服务端 Gemini SDK 依赖
- [x] 1.3 复用现有 `gemini_api_key` 配置并补充缺省校验

## 2. 实现

- [x] 2.1 抽离 Canvas Agent 聊天模型工厂，支持按模型选择 provider
- [x] 2.2 为 Gemini 模型接入 Gemini SDK chat model
- [x] 2.3 保持非 Gemini 模型继续走 OpenRouter
- [x] 2.4 保持 reasoning 等现有参数在支持范围内兼容

## 3. 验证

- [x] 3.1 验证 TypeScript 编译通过
- [x] 3.2 验证 Gemini 模型缺少 `gemini_api_key` 时返回明确错误
- [x] 3.3 验证非 Gemini 模型仍使用 OpenRouter 且不发生回归
