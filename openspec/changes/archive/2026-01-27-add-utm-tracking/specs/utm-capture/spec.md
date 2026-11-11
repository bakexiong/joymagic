# 规范：UTM 参数捕获

## 新增需求

### 需求：客户端必须捕获 UTM 参数并存储到 Cookie

系统必须在用户访问时捕获 URL 中的 UTM 参数，并存储到 Cookie 中。

#### 场景：用户通过 UTM 链接访问网站

**前置条件：**
- 用户通过包含 UTM 参数的链接访问网站
- 例如：`https://10b.ai/?utm_source=youtube&utm_medium=kol&utm_campaign=2026_kol1&utm_content=ceci__missxia__video1`

**操作：**
1. 页面加载时，JavaScript 解析 URL 查询参数
2. 提取所有 UTM 参数（utm_source, utm_medium, utm_campaign, utm_content, utm_term）
3. 将 UTM 参数存储到 Cookie

**预期结果：**
- Cookie 名称：`utm_params`
- Cookie 值为 JSON 字符串：
  ```json
  {
    "utm_source": "youtube",
    "utm_medium": "kol",
    "utm_campaign": "2026_kol1",
    "utm_content": "ceci__missxia__video1",
    "utm_term": ""
  }
  ```
- Cookie 有效期：30 天
- Cookie 路径：`/`
- Cookie SameSite：`Lax`
- Cookie Secure：`true`（生产环境）

#### 场景：用户再次通过不同 UTM 链接访问

**前置条件：**
- 用户之前已通过 UTM 链接访问过网站
- Cookie 中已存在 UTM 数据
- 用户通过新的 UTM 链接再次访问

**操作：**
1. 检测到新的 UTM 参数
2. 覆盖 Cookie 中的 UTM 数据为最新值

**预期结果：**
- Cookie 中的 UTM 数据被更新为最新访问的 UTM 参数
- Cookie 有效期重置为 30 天

#### 场景：用户访问时没有 UTM 参数

**前置条件：**
- 用户直接访问网站或通过不含 UTM 参数的链接访问
- 例如：`https://10b.ai/`

**操作：**
1. 检测 URL 中没有 UTM 参数
2. 检查 Cookie 中是否已有 UTM 数据

**预期结果：**
- 如果 Cookie 中已有数据，保持不变
- 如果 Cookie 中没有数据，不创建新 Cookie
- 不覆盖已有的 UTM 数据

### 需求：系统必须验证 UTM 参数

系统必须验证 UTM 参数的格式和长度，防止恶意数据。

#### 场景：UTM 参数包含恶意脚本

**前置条件：**
- 用户访问包含恶意 UTM 参数的链接
- 例如：`?utm_source=<script>alert('xss')</script>`

**操作：**
1. 解析 UTM 参数
2. 对每个参数值进行清理和转义
3. 移除 HTML 标签和特殊字符

**预期结果：**
- 恶意脚本被清理
- 存储的值为安全的纯文本
- 不触发 XSS 攻击

#### 场景：UTM 参数超长

**前置条件：**
- UTM 参数值超过合理长度（例如 > 500 字符）

**操作：**
1. 检测参数长度
2. 截断超长参数到最大允许长度（200 字符）

**预期结果：**
- 参数被截断到允许长度
- 系统正常运行，不崩溃

## 技术实现

### Cookie 结构

```javascript
// Cookie 名称
const COOKIE_NAME = 'utm_params';

// Cookie 值（JSON 字符串）
const cookieValue = JSON.stringify({
  utm_source: 'youtube',
  utm_medium: 'kol',
  utm_campaign: '2026_kol1',
  utm_content: 'ceci__missxia__video1',
  utm_term: ''
});

// Cookie 选项
const cookieOptions = {
  maxAge: 30 * 24 * 60 * 60, // 30 天（秒）
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
};
```

### 参数清理函数

```typescript
function sanitizeUTMValue(value: string): string {
  // 移除 HTML 标签
  value = value.replace(/<[^>]*>/g, '');

  // 移除特殊字符
  value = value.replace(/[<>"']/g, '');

  // 限制长度
  value = value.substring(0, 200);

  return value.trim();
}
```

### UTM 捕获逻辑

```typescript
function captureUTMParams() {
  const urlParams = new URLSearchParams(window.location.search);

  const utmParams: Record<string, string> = {};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  let hasUTM = false;
  for (const key of utmKeys) {
    const value = urlParams.get(key);
    if (value) {
      utmParams[key] = sanitizeUTMValue(value);
      hasUTM = true;
    }
  }

  // 只有当 URL 中有 UTM 参数时才更新 Cookie
  if (hasUTM) {
    document.cookie = `utm_params=${encodeURIComponent(JSON.stringify(utmParams))}; max-age=${30 * 24 * 60 * 60}; path=/; samesite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
  }
}

// 页面加载时执行
if (typeof window !== 'undefined') {
  captureUTMParams();
}
```

## 技术约束

### 浏览器兼容性
- 支持所有现代浏览器（Chrome, Firefox, Safari, Edge）
- Cookie 被禁用时，功能降级（无法追踪）

### 性能要求
- UTM 参数解析和存储应在页面加载后 100ms 内完成
- 不阻塞页面渲染

### 安全要求
- 所有 UTM 参数必须经过 XSS 清理
- 使用 Secure 标志保护 Cookie（生产环境）
- 不在 UTM 参数中存储个人身份信息（PII）

## 依赖关系

- 被 `utm-order-association` 规范依赖（订单创建时读取 Cookie）
