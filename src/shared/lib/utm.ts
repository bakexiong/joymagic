import { UTM_CONFIG, sanitizeUTMValue, type UTMData } from '@/shared/types/utm';

/**
 * 从 URL 中捕获 UTM 参数
 */
export function captureUTMParams(): UTMData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: UTMData = {};
  let hasUTM = false;

  for (const key of UTM_CONFIG.UTM_KEYS) {
    const value = urlParams.get(key);
    if (value) {
      utmParams[key] = sanitizeUTMValue(value);
      hasUTM = true;
    }
  }

  return hasUTM ? utmParams : null;
}

/**
 * 将 UTM 参数存储到 Cookie
 */
export function saveUTMToCookie(utmData: UTMData): void {
  if (typeof document === 'undefined') {
    return;
  }

  const cookieValue = encodeURIComponent(JSON.stringify(utmData));
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? '; secure' : '';

  document.cookie = `${UTM_CONFIG.COOKIE_NAME}=${cookieValue}; max-age=${UTM_CONFIG.COOKIE_MAX_AGE}; path=/; samesite=lax${secure}`;
}

/**
 * 从 Cookie 中读取 UTM 参数
 */
export function getUTMFromCookie(): UTMData | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === UTM_CONFIG.COOKIE_NAME && value) {
      try {
        const decoded = decodeURIComponent(value);
        const parsed = JSON.parse(decoded);
        return parsed as UTMData;
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * 将 UTM 参数保存到数据库
 */
async function saveUTMToDatabase(utmData: UTMData): Promise<string | null> {
  try {
    // 获取或生成会话 ID
    let sessionId = sessionStorage.getItem('utm_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('utm_session_id', sessionId);
    }

    const response = await fetch('/api/utm/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        utm_content: utmData.utm_content,
        utm_term: utmData.utm_term,
        referrer: document.referrer || undefined,
        landing_page: window.location.href,
        session_id: sessionId,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.session_id;
    }
  } catch (error) {
    console.error('Failed to save UTM to database:', error);
  }
  return null;
}

/**
 * 捕获并保存 UTM 参数
 * 只有当 URL 中有 UTM 参数时才更新 Cookie 和数据库
 */
export function captureAndSaveUTM(): void {
  const utmParams = captureUTMParams();
  if (utmParams) {
    // 保存到 Cookie（用于订单关联）
    saveUTMToCookie(utmParams);

    // 保存到数据库（用于历史追踪）
    saveUTMToDatabase(utmParams).catch(err => {
      console.error('Failed to save UTM to database:', err);
    });
  }
}
