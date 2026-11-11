# pixverse-pricing 规范

## 目的
待定 - 由归档变更 add-pixverse-pricing 创建。归档后请更新目的。
## 需求
### 需求：系统必须支持通用参数组合定价计算器

系统必须实现 `param-combination-pricing` 计算器类型，能够处理任意参数组合的定价配置和积分计算。

#### 场景：配置场景参数定义

**前置条件**：
- 管理员已登录 admin 系统
- 具有 pricing 配置权限

**操作步骤**：
1. 管理员在 credit-config 中定义场景（如 `pixverse-video`）
2. 设置场景类型为 `dynamic`
3. 设置计算器类型为 `param-combination-pricing`
4. 定义参数列表，每个参数包含：
   - `type`：参数类型（string、number、boolean）
   - `validValues`：有效值列表（数组）
   - `default`：默认值
   - `displayName`：显示名称（用于 UI）
5. 可选：定义 `uiLayout` 配置 UI 展示方式
6. 可选：定义 `unsupportedCombinations` 列出不支持的组合

**预期结果**：
- 场景配置正确加载
- 参数定义符合规范
- 可以在 admin pricing 页面中看到该场景

**示例配置**：
```typescript
'pixverse-video': {
  type: 'dynamic',
  calculator: 'param-combination-pricing',
  params: {
    resolution: {
      type: 'string',
      validValues: ['360p', '540p', '720p', '1080p'],
      default: '720p',
      displayName: '分辨率'
    },
    duration: {
      type: 'number',
      validValues: [5, 8, 10],
      default: 5,
      displayName: '时长'
    },
    generate_audio: {
      type: 'boolean',
      default: false,
      displayName: '音频'
    }
  },
  uiLayout: {
    type: 'matrix',
    rows: 'resolution',
    columns: 'duration',
    cells: 'generate_audio'
  },
  unsupportedCombinations: [
    'duration=10&resolution=1080p'
  ]
}
```

#### 场景：配置参数组合价格

**前置条件**：
- 场景已配置
- 管理员在 admin pricing 页面

**操作步骤**：
1. 管理员选择使用 `param-combination-pricing` 计算器的场景
2. 系统根据参数定义自动生成所有可能的组合
3. 系统根据 `uiLayout` 配置选择合适的展示方式：
   - `matrix`：矩阵表格（适合 2-3 个参数）
   - `list`：列表视图（适合 4+ 个参数）
4. 管理员为每个组合设置成本价格
5. 系统自动标记不支持的组合（根据 `unsupportedCombinations`）
6. 系统保存配置到数据库

**预期结果**：
- 所有参数组合的价格正确保存
- 参数组合 key 格式为：`param1=value1&param2=value2&...`（按字母顺序）
- 价格配置可以正确读取
- 不支持的组合在 UI 中显示为禁用状态

**参数组合 key 生成规则**：
1. 按参数名称字母顺序排序
2. 格式：`paramName=value&paramName=value`
3. 布尔值转换为 `true` 或 `false` 字符串
4. 数字保持数字格式

**示例**：
- 输入：`{ resolution: '720p', duration: 5, generate_audio: false }`
- 输出：`duration=5&generate_audio=false&resolution=720p`

### 需求：系统必须实现通用参数组合积分计算逻辑

系统必须根据用户选择的参数组合，正确查找对应的价格配置并计算需要消耗的积分。该逻辑必须适用于所有使用 `param-combination-pricing` 计算器的场景。

#### 场景：计算参数组合的积分

**前置条件**：
- 场景已配置
- 价格配置已设置

**输入**：
- scene: 使用 `param-combination-pricing` 计算器的场景名称
- params: 参数对象（如 `{ resolution: '720p', duration: 5, generate_audio: false }`）

**操作步骤**：
1. 系统识别场景的计算器类型为 `param-combination-pricing`
2. 系统根据参数对象生成参数组合 key
3. 系统查找对应的价格配置（从 `paramCombinations` 中）
4. 系统根据利润率计算售价
5. 系统根据积分单价计算积分

**预期结果**：
- 积分计算正确
- 使用正确的参数组合价格

**示例（PixVerse 场景）**：
- 输入：`{ scene: 'pixverse-video', resolution: '720p', duration: 5, generate_audio: false }`
- 参数组合 key：`duration=5&generate_audio=false&resolution=720p`
- 成本价格：$0.45
- 利润率：30%
- 售价：$0.45 / (1 - 0.3) = $0.643
- 积分单价：$0.01
- 积分：Math.ceil(0.643 / 0.01) = 65

#### 场景：处理不支持的参数组合

**前置条件**：
- 场景已配置
- 场景定义了 `unsupportedCombinations`

**输入**：
- scene: 场景名称
- params: 不支持的参数组合

**操作步骤**：
1. 系统识别场景的计算器类型为 `param-combination-pricing`
2. 系统生成参数组合 key
3. 系统检查该 key 是否在 `unsupportedCombinations` 列表中
4. 系统发现该组合不支持

**预期结果**：
- 系统返回错误，说明该参数组合不支持
- 前端应在用户选择参数时阻止不支持的组合

**示例（PixVerse 场景）**：
- 输入：`{ scene: 'pixverse-video', resolution: '1080p', duration: 10, generate_audio: false }`
- 参数组合 key：`duration=10&generate_audio=false&resolution=1080p`
- 检查：该 key 匹配 `unsupportedCombinations` 中的 `duration=10&resolution=1080p`（部分匹配）
- 结果：返回错误 "Parameter combination not supported: 1080p resolution with 10 seconds duration"

### 需求：Admin UI 必须支持通用参数组合价格配置

Admin pricing 页面必须根据场景的参数定义和 UI 布局配置，动态生成合适的价格配置界面。

#### 场景：展示矩阵表格布局

**前置条件**：
- 管理员已登录
- 在 admin pricing 页面
- 选择了使用 `param-combination-pricing` 计算器的场景
- 场景配置了 `uiLayout.type = 'matrix'`

**操作步骤**：
1. 系统检测场景的计算器类型为 `param-combination-pricing`
2. 系统读取 `uiLayout` 配置
3. 系统根据配置渲染矩阵表格：
   - 行：`uiLayout.rows` 指定的参数
   - 列：`uiLayout.columns` 指定的参数
   - 单元格：`uiLayout.cells` 指定的参数（如果是布尔值，显示两行）
4. 系统标记不支持的组合为禁用状态

**预期结果**：
- 表格正确渲染
- 所有价格正确显示
- 不支持的组合显示为禁用（灰色或 "—"）

**示例（PixVerse 场景）**：
```
配置：
- rows: 'resolution'
- columns: 'duration'
- cells: 'generate_audio'

渲染结果：
           | 5秒                    | 8秒                    | 10秒                   |
-----------|------------------------|------------------------|------------------------|
360p       | 无音频: $0.35          | 无音频: $0.70          | 无音频: $0.77          |
           | 有音频: $0.80          | 有音频: $1.15          | 有音频: $1.22          |
-----------|------------------------|------------------------|------------------------|
540p       | 无音频: $0.35          | 无音频: $0.70          | 无音频: $0.77          |
           | 有音频: $0.80          | 有音频: $1.15          | 有音频: $1.22          |
-----------|------------------------|------------------------|------------------------|
720p       | 无音频: $0.45          | 无音频: $0.90          | 无音频: $0.99          |
           | 有音频: $0.80          | 有音频: $1.35          | 有音频: $1.44          |
-----------|------------------------|------------------------|------------------------|
1080p      | 无音频: $0.75          | 无音频: $1.50          | —                      |
           | 有音频: $1.50          | 有音频: $1.95          | —                      |
```

#### 场景：展示列表布局

**前置条件**：
- 管理员已登录
- 在 admin pricing 页面
- 选择了使用 `param-combination-pricing` 计算器的场景
- 场景配置了 `uiLayout.type = 'list'` 或参数数量 >= 4

**操作步骤**：
1. 系统检测场景的计算器类型为 `param-combination-pricing`
2. 系统读取 `uiLayout` 配置或根据参数数量自动选择列表布局
3. 系统渲染列表视图：
   - 每行显示一个参数组合
   - 显示所有参数的值
   - 显示成本价格输入框
   - 显示计算后的售价和积分
4. 提供搜索和过滤功能

**预期结果**：
- 列表正确渲染
- 所有组合都可见
- 支持搜索和过滤
- 不支持的组合显示为禁用

**示例**：
```
| 参数组合                                          | 成本价格 | 利润率 | 售价  | 积分 |
|--------------------------------------------------|---------|--------|-------|------|
| resolution=360p, duration=5, generate_audio=false | $0.35   | 30%    | $0.50 | 50   |
| resolution=360p, duration=5, generate_audio=true  | $0.80   | 30%    | $1.14 | 114  |
| resolution=360p, duration=8, generate_audio=false | $0.70   | 30%    | $1.00 | 100  |
| ...                                              | ...     | ...    | ...   | ...  |
```

#### 场景：编辑单个价格

**前置条件**：
- 价格配置界面已展示（矩阵或列表）

**操作步骤**：
1. 管理员点击某个价格输入框
2. 管理员输入新的成本价格
3. 系统自动计算售价和积分
4. 管理员点击保存按钮
5. 系统保存配置到数据库

**预期结果**：
- 价格正确更新
- 对应的参数组合配置正确保存
- 积分计算使用新价格

#### 场景：批量设置利润率

**前置条件**：
- 价格配置表格已展示

**操作步骤**：
1. 管理员在全局设置中修改默认利润率
2. 系统重新计算所有组合的售价和积分
3. 管理员点击保存
4. 系统保存所有更新

**预期结果**：
- 所有价格的利润率统一更新
- 积分重新计算

