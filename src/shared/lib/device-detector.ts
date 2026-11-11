import { DeviceType } from '@/shared/models/ai_task';

/**
 * 从 User-Agent 检测设备类型
 * @param userAgent - HTTP User-Agent 字符串
 * @returns 'mobile' | 'pc'
 */
export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) {
    return 'pc'; // 默认为 PC
  }

  const ua = userAgent.toLowerCase();

  // 检测移动设备特征
  const mobileKeywords = [
    'mobile',
    'android',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'webos',
    'opera mini',
    'iemobile',
  ];

  const isMobile = mobileKeywords.some(keyword => ua.includes(keyword));

  return isMobile ? 'mobile' : 'pc';
}
