/**
 * UTM 参数接口
 */
export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

/**
 * UTM 参数验证配置
 */
export const UTM_CONFIG = {
  MAX_LENGTH: 200,
  COOKIE_NAME: 'utm_params',
  COOKIE_MAX_AGE: 30 * 24 * 60 * 60, // 30 天（秒）
  UTM_KEYS: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const,
} as const;

/**
 * 清理 UTM 参数值，防止 XSS 攻击
 */
export function sanitizeUTMValue(value: string): string {
  if (!value) return '';

  // 移除 HTML 标签
  let sanitized = value.replace(/<[^>]*>/g, '');

  // 移除特殊字符
  sanitized = sanitized.replace(/[<>"']/g, '');

  // 限制长度
  sanitized = sanitized.substring(0, UTM_CONFIG.MAX_LENGTH);

  return sanitized.trim();
}

/**
 * 验证 UTM 数据对象
 */
export function validateUTMData(data: unknown): UTMData | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const utmData: UTMData = {};
  const obj = data as Record<string, unknown>;

  for (const key of UTM_CONFIG.UTM_KEYS) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 0) {
      utmData[key] = sanitizeUTMValue(value);
    }
  }

  // 如果没有任何有效的 UTM 参数，返回 null
  if (Object.keys(utmData).length === 0) {
    return null;
  }

  return utmData;
}
