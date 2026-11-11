## 1. 规格与数据建模

- [x] 1.1 定义 kiss 类 effect 的收口范围与 style 映射结构
- [x] 1.2 定义 `AI Kissing` 作为唯一 kiss 工具入口的数据与路由策略

## 2. 工作台与路由实现

- [x] 2.1 调整 `video-effect` 数据层，使 `AI Kissing` 支持内嵌 style 列表
- [x] 2.2 在 `AI Kissing` 工作台内新增 kiss style 选择 UI
- [x] 2.3 让 style 切换驱动示例图、上传提示、预览区与生成场景切换
- [x] 2.4 移除 kiss 类独立工具路由与导航入口，仅保留 `/tools/video-effect/ai-kissing`

## 3. 文案与验证

- [ ] 3.1 更新相关多语言文案与 header 工具入口文案
- [x] 3.2 自查 kiss style 切换、旧路由兼容与生成参数是否正确
