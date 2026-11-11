## 新增需求

### 需求：Kiss 类 video effect 必须收口为 AI Kissing 主入口
系统必须将 kiss 类 video effect 以 `AI Kissing` 作为统一主入口暴露，而不是继续在 video effect 列表中以多个独立主条目平铺展示。

#### 场景：用户浏览 video effect 列表
- **当** 用户访问 `video-effect` 列表或 `AI Kissing` 主工作台
- **那么** kiss 类能力应以 `AI Kissing` 为统一入口被展示
- **而且** 当前收口范围至少包括 `ai-kissing`、`blow-kiss`、`french-kiss`、`kissing-pro`、`rain-kiss`

### 需求：Kiss 类工具路由必须只保留 AI Kissing
系统必须移除 kiss 类独立工具路由，只保留 `/tools/video-effect/ai-kissing` 作为唯一 kiss 类视频特效路由。

#### 场景：用户查看 kiss 类工具入口
- **当** 用户查看 header、工具列表或其他视频特效入口
- **那么** kiss 类工具只应显示 `AI Kissing`
- **而且** 不应再显示 `French Kiss`、`Kissing Pro`、`Rain Kiss`、`Blow Kiss` 等独立工具入口

### 需求：AI Kissing 工作台必须支持 kiss style 切换
系统必须在 `AI Kissing` 工作台内部提供可视化 style 选择区，让用户在不离开主入口的前提下切换不同 kiss 风格。

#### 场景：用户切换 kiss style
- **当** 用户进入 `AI Kissing` 工作台并切换某个 kiss style
- **那么** 当前生效的底层 effect slug 必须切换到对应 style
- **而且** 示例图、上传提示、预览区与生成请求必须同步切换到该 style 对应的数据
- **而且** style 切换不应改变当前主路由，页面路由必须始终保持 `/tools/video-effect/ai-kissing`

### 需求：AI Kissing 默认 style 必须稳定
系统必须为 `AI Kissing` 主入口定义稳定的默认 style，以保证直接访问主入口时页面可预测。

#### 场景：用户直接访问 AI Kissing
- **当** 用户访问 `/tools/video-effect/ai-kissing`
- **那么** 页面必须进入 `AI Kissing` 工作台
- **而且** 默认 style 必须为 `ai-kissing`
