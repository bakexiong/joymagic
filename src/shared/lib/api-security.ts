/**
 * OpenAPI 接口安全中间件
 * - 参数签名验证：使用 HMAC-SHA256 对请求参数签名，确保请求来自授权方
 * - API Key 验证：校验请求头中的 API Key 是否与 OPENAPI_API_KEY 环境变量匹配
 *
 * 签名算法：
 * 1. 将请求 body 的所有字段按 key 字母序排列，拼接为 key=value&key=value 格式
 * 2. 在末尾追加 &timestamp=xxx&nonce=xxx
 * 3. 使用 HMAC-SHA256(OPENAPI_SECRET, 拼接字符串) 生成签名
 * 4. 请求头携带 X-Timestamp、X-Nonce、X-Signature
 *
 * 服务端校验：
 * - timestamp 与服务器时间差不超过 5 分钟（防重放）
 * - nonce 在窗口期内不重复（防重放）
 * - 签名一致
 * - API Key 与 OPENAPI_API_KEY 环境变量匹配（如果配置）
 */

import { createHmac } from 'crypto';

// nonce 去重存储：{ nonce: expireAt }
const nonceStore = new Map<string, number>();

const SIGNATURE_EXPIRE = 5 * 60 * 1000; // 签名有效期 5 分钟

// 定期清理过期 nonce
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expireAt] of nonceStore) {
    if (now > expireAt) {
      nonceStore.delete(nonce);
    }
  }
}, 60 * 1000);

/**
 * 将参数对象按 key 字母序拼接为签名字符串
 */
function buildSignString(
  params: Record<string, any>,
  timestamp: string,
  nonce: string
): string {
  const sorted = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  return `${sorted}&timestamp=${timestamp}&nonce=${nonce}`;
}

/**
 * 验证请求签名
 * 请求头需携带：X-Timestamp、X-Nonce、X-Signature
 * body 参数参与签名
 */
export function verifySignature(
  req: Request,
  body: Record<string, any>
): { valid: boolean; error?: string } {
  const secret = process.env.OPENAPI_SECRET;
  if (!secret) {
    // 未配置 secret 时跳过签名验证
    return { valid: true };
  }

  const timestamp = req.headers.get('X-Timestamp');
  const nonce = req.headers.get('X-Nonce');
  const signature = req.headers.get('X-Signature');

  if (!timestamp || !nonce || !signature) {
    return { valid: false, error: 'Missing signature headers (X-Timestamp, X-Nonce, X-Signature)' };
  }

  // 校验 timestamp：与服务器时间差不超过 5 分钟
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > SIGNATURE_EXPIRE) {
    return { valid: false, error: 'Timestamp expired or invalid' };
  }

  // 校验 nonce：防重放
  if (nonceStore.has(nonce)) {
    return { valid: false, error: 'Duplicate nonce' };
  }
  nonceStore.set(nonce, Date.now() + SIGNATURE_EXPIRE);

  // 计算签名
  const signString = buildSignString(body, timestamp, nonce);
  const expectedSignature = createHmac('sha256', secret)
    .update(signString)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
}

/**
 * 验证 OpenAPI API Key
 * 优先从 X-OpenAPI-Key 请求头读取，如果没有则从 Authorization 请求头读取
 * 与 OPENAPI_API_KEY 环境变量进行比对
 */
export function verifyOpenApiKey(req: Request): { valid: boolean; error?: string } {
  const expectedKey = process.env.OPENAPI_API_KEY;
  if (!expectedKey) {
    // 未配置 OPENAPI_API_KEY 时跳过验证
    return { valid: true };
  }

  // 优先从 X-OpenAPI-Key 请求头读取
  let providedKey = req.headers.get('X-OpenAPI-Key');
  
  // 如果没有 X-OpenAPI-Key，则从 Authorization 请求头读取
  if (!providedKey) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return { valid: false, error: 'Missing Authorization or X-OpenAPI-Key header' };
    }

    if (authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.slice(7).trim();
    } else {
      providedKey = authHeader.trim();
    }
  }

  if (providedKey !== expectedKey) {
    return { valid: false, error: 'Invalid OpenAPI API Key' };
  }

  return { valid: true };
}

/**
 * 签名验证失败响应
 */
export function forbiddenResponse(message?: string) {
  return new Response(
    JSON.stringify({
      code: -1,
      message: message || 'Forbidden',
      success: false,
    }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}
