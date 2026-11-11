## 新增需求

### 需求：Ethnicity 必须作为真人素材的基础维度
系统应将 `Ethnicity` 作为 AI Girlfriend 真人素材矩阵的基础维度，以保证后续发型、发色、肤色、眼睛等属性在真实预览中保持同一角色身份与骨相一致。

#### 场景：基于 Ethnicity 命中真人素材
- **当** 用户在 `/ai-girl` 页面选择某个 `Ethnicity`
- **那么** 系统应优先命中该 `Ethnicity` 对应的真人素材集合

### 需求：所有真人素材都必须挂在 Ethnicity 维度下
系统应将所有可视化真人素材维度统一挂在 `Ethnicity` 之下，而不能继续使用脱离 `Ethnicity` 的通用素材。

#### 场景：任意 section 切换时保持人种一致
- **当** 用户已经选择某个 `Ethnicity`
- **并且** 切换 `Hair / Hair Color / Skin / Eyes / Lips / Body / Vibe / Age / Makeup / Accessories`
- **那么** 页面应优先显示该 `Ethnicity` 对应的人种一致的真人素材
- **并且** 不应回退到其他 `Ethnicity` 的真人图

### 需求：Hair Color 必须基于 Hair Style 与 Ethnicity 组合生成
系统应以 `Ethnicity + Hair Style` 对应的真人图为输入底图，生成 `Hair Color` 组合素材，而不能仅基于单一全局 base 图生成。

#### 场景：编发粉色应保持编发结构
- **当** 用户选择 `Ethnicity=A`、`Hair Style=Braided`、`Hair Color=Pink`
- **那么** 预览应显示 `A + Braided + Pink` 对应的真人组合图
- **并且** 结果不应退化为其他发型结构，例如波浪发或长直发

### 需求：页面应优先读取最高维度的组合素材
系统应按素材维度优先级读取真人图，以避免低维素材覆盖高维素材。

#### 场景：存在 Hair Style × Hair Color 真人图时
- **当** 用户切换到 `Hair Color`
- **并且** 当前 `Ethnicity + Hair Style + Hair Color` 的真人图已存在
- **那么** 页面应直接显示该组合真人图
- **而不是** 回退到单独 `Hair Style` 图或前端临时染色效果
