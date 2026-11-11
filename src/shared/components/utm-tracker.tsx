'use client';

import { useEffect } from 'react';
import { captureAndSaveUTM } from '@/shared/lib/utm';

/**
 * UTM 追踪组件
 * 在页面加载时自动捕获 URL 中的 UTM 参数并存储到 Cookie
 */
export function UTMTracker() {
  useEffect(() => {
    captureAndSaveUTM();
  }, []);

  return null;
}
