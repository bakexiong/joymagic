## 上下文
当前 `video-effect` 将 kiss 类特效作为多个独立 effect 平铺在统一列表中，用户在浏览、比较和切换风格时成本较高。需求希望将这些 effect 视为同一父类能力 `AI Kissing` 下的多个 style，并在工作台内完成切换。

## 目标 / 非目标
- 目标：
  - 将 kiss 类 effect 统一折叠到 `AI Kissing` Hub
  - 在工作台内提供 style 选择能力
  - 保持原有底层生成模型与样例资产可复用
  - 让 `AI Kissing` 成为 kiss 类能力的唯一对外入口
- 非目标：
  - 不改造非 kiss 类 video effect 的信息架构
  - 不引入新的后端生成协议

## 决策
- 决策：数据层保留原有 kiss effect 的原子信息，但在前端构造一个 `AI Kissing` Hub 视图模型
- 决策：Hub 页面中的 style 切换仅切换当前实际生效的 effect slug，不新建独立后端接口
- 决策：移除 kiss 类独立工具入口，导航与 header 中只暴露 `AI Kissing`
- 决策：工作台内部的 style 切换不改变主路由，始终维持在 `/tools/video-effect/ai-kissing`

## 风险 / 权衡
- 风险：既有依赖 effect slug 的展示逻辑可能默认把每个 kiss effect 当独立卡片
  - 缓解：在数据层显式区分 `hub` 与 `style`，减少页面分支硬编码
- 风险：移除旧 kiss 独立入口后，既有内部链接或缓存导航可能失效
  - 缓解：同步清理 header、工具列表与相关入口配置，只保留 `AI Kissing`

## 迁移计划
1. 先定义 kiss hub 数据结构与 style 映射
2. 再改工作台 UI，使 `AI Kissing` 支持 style 切换
3. 最后清理旧 kiss 独立入口并更新多语言文案

## 待决问题
- 暂无
