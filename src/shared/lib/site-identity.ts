import {
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  isUnavailableBetaAccountPath,
} from "@/config/site";

/** 仅规范展示文案，保留真实素材来源和第三方模型服务的地址。 */
export function normalizeSiteText(value: string): string {
  if (/^https?:\/\/(?:ocdn|cdn)\.10b\.ai\//i.test(value)) return value;
  return value
    .replace(/[\w.+-]+@(?:joymagic\.fun|10b\.ai|z-image\.ai)/gi, SUPPORT_EMAIL)
    .replace(
      /https?:\/\/(?:www\.)?(?:joymagic\.fun|10b\.ai|z-image\.ai)/gi,
      SITE_URL,
    )
    .replace(/\bOnline Free\b/gi, "Online")
    .replace(/\bFree AI\b/gi, "AI")
    .replace(/\bFree to start\b/gi, "Public beta")
    .replace(/免费开始|免費開始/g, "公开测试")
    .replace(/一次上传，无限可能。/g, "上传图片，探索编辑效果。")
    .replace(/\bjoymagic\b/gi, SITE_NAME)
    .replace(/\b10b\.ai(?:\.ai)?\b/gi, SITE_NAME);
}

export function normalizeSiteMessages(value: any): any {
  if (typeof value === "string") return normalizeSiteText(value);
  if (Array.isArray(value))
    return value
      .filter(
        (item) =>
          !(
            item &&
            typeof item === "object" &&
            typeof item.url === "string" &&
            isUnavailableBetaAccountPath(item.url)
          ),
      )
      .map(normalizeSiteMessages);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        normalizeSiteMessages(item),
      ]),
    );
  }
  return value;
}
