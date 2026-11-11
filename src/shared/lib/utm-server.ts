import { cookies } from 'next/headers';
import { UTM_CONFIG, validateUTMData, type UTMData } from '@/shared/types/utm';

/**
 * 从服务端 Cookie 中读取 UTM 参数
 */
export async function getUTMFromCookie(): Promise<UTMData | null> {
  try {
    const cookieStore = await cookies();
    const utmCookie = cookieStore.get(UTM_CONFIG.COOKIE_NAME);

    if (!utmCookie?.value) {
      return null;
    }

    const decoded = decodeURIComponent(utmCookie.value);
    const parsed = JSON.parse(decoded);

    return validateUTMData(parsed);
  } catch (error) {
    console.error('Failed to parse UTM cookie:', error);
    return null;
  }
}

/**
 * 将 UTM 数据转换为数据库字段格式
 */
export function utmDataToDbFields(utmData: UTMData | null) {
  if (!utmData) {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
    };
  }

  return {
    utmSource: utmData.utm_source || null,
    utmMedium: utmData.utm_medium || null,
    utmCampaign: utmData.utm_campaign || null,
    utmContent: utmData.utm_content || null,
    utmTerm: utmData.utm_term || null,
  };
}
