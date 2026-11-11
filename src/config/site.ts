// 本模块仅包含可公开的站点信息，不放置服务密钥。
export const SITE_NAME = "Barko Bear";
export const SITE_COMPANY = "Barko Bear LLC";
export const SITE_URL = "https://barkobear.com";
export const SUPPORT_EMAIL = "support@barkobear.com";
export const PAYMENTS_AVAILABLE = false;
export const BETA_PURCHASE_EVENT = "barkobear:purchase-unavailable";

// 测试期间不展示共享数据库中原站的商业账单入口。
export function isUnavailableBetaAccountPath(pathname: string): boolean {
  if (PAYMENTS_AVAILABLE) return false;
  const path = pathname.split(/[?#]/)[0];
  return [
    "/settings/billing",
    "/settings/payments",
    "/settings/invoices",
    "/settings/affiliate",
  ].some((root) => path === root || path.startsWith(`${root}/`));
}
