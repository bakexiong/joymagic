const CDN_BASE = "https://ocdn.10b.ai";
const LEGACY_CDN_HOST = "cdn-10b.ai.wemiaow.com";
const LEGACY_OSS_HOST = "ocdn.10b.ai";

function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

/**
 * 将旧 OSS 域名/相对路径的资源地址统一改写到新 CDN：
 * - 旧 OSS：`https://ocdn.10b.ai/...` → `https://ocdn.10b.ai/...`
 * - 旧 CDN：`https://cdn-10b.ai.wemiaow.com/...` → `https://ocdn.10b.ai/...`
 * - 相对路径：`/icon/a.png` → `https://ocdn.10b.ai/icon/a.png`
 * - 其它绝对 URL：保持不变
 */
export function toCdnUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  const cdnBase = stripTrailingSlashes(CDN_BASE);
  const raw = String(input).trim();
  if (!raw) return undefined;

  // relative url
  if (raw.startsWith("/")) return `${cdnBase}${raw}`;

  // absolute url
  try {
    const url = new URL(raw);
    if (url.host === LEGACY_OSS_HOST || url.host === LEGACY_CDN_HOST) {
      return `${cdnBase}${url.pathname}${url.search}${url.hash}`;
    }
    return raw;
  } catch {
    // not a valid url, return as-is
    return raw;
  }
}

/**
 * 为 OSS/CDN 图片追加缩放参数，避免列表场景拉取原图。
 * 非 OSS/CDN 地址保持原样，避免误伤第三方资源。
 */
export function withOssImageResize(
  input: string | undefined | null,
  width: number,
  height: number,
) {
  const normalized = toCdnUrl(input);
  if (!normalized) return undefined;

  const ossProcess = `image/resize,m_fill,w_${width},h_${height}`;

  try {
    const url = new URL(normalized);
    const isManagedHost =
      url.host === new URL(CDN_BASE).host ||
      url.host === LEGACY_CDN_HOST ||
      url.host === LEGACY_OSS_HOST;

    if (!isManagedHost) {
      return normalized;
    }

    url.searchParams.delete("w");
    url.searchParams.delete("q");

    const currentProcess = url.searchParams.get("x-oss-process");
    if (!currentProcess) {
      url.searchParams.set("x-oss-process", ossProcess);
      return url.toString();
    }

    const replacedProcess = currentProcess.match(
      /image\/resize,m_fill,w_\d+,h_\d+/,
    )
      ? currentProcess.replace(
          /image\/resize,m_fill,w_\d+,h_\d+/,
          ossProcess,
        )
      : `${currentProcess}/resize,m_fill,w_${width},h_${height}`;

    url.searchParams.set("x-oss-process", replacedProcess);
    return url.toString();
  } catch {
    return normalized.includes("?")
      ? `${normalized}&x-oss-process=${ossProcess}`
      : `${normalized}?x-oss-process=${ossProcess}`;
  }
}

/**
 * 为 OSS/CDN 图片追加“长边等比缩放”参数，用于瀑布流/卡片缩略图场景。
 * 长边受 maxSide 约束，短边按原宽高比自适应，不裁剪也不变形。
 * 仅对自有 CDN/OSS host 生效，第三方 URL 原样返回，避免误伤外链资源。
 *
 * 与 `withOssImageResize` 的区别：后者用 `m_fill` 强制裁剪到指定 w×h，
 * 适合横幅这种固定宽高比；本函数保留原宽高比，适合瀑布流。
 */
export function withOssImageMaxSide(
  input: string | undefined | null,
  maxSide: number,
) {
  const normalized = toCdnUrl(input);
  if (!normalized) return undefined;

  const ossProcess = `image/resize,w_${maxSide},h_${maxSide},m_lfit`;

  try {
    const url = new URL(normalized);
    const isManagedHost =
      url.host === new URL(CDN_BASE).host ||
      url.host === LEGACY_CDN_HOST ||
      url.host === LEGACY_OSS_HOST;

    if (!isManagedHost) {
      return normalized;
    }

    url.searchParams.delete("w");
    url.searchParams.delete("q");

    const currentProcess = url.searchParams.get("x-oss-process");
    if (!currentProcess) {
      url.searchParams.set("x-oss-process", ossProcess);
      return url.toString();
    }

    // 已存在 resize 段就替换；否则在末尾追加（保留 auto-orient 等其他段）
    const replacedProcess = /image\/resize[^/]*/.test(currentProcess)
      ? currentProcess.replace(/image\/resize[^/]*/, ossProcess)
      : `${currentProcess}/resize,w_${maxSide},h_${maxSide},m_lfit`;

    url.searchParams.set("x-oss-process", replacedProcess);
    return url.toString();
  } catch {
    return normalized.includes("?")
      ? `${normalized}&x-oss-process=${ossProcess}`
      : `${normalized}?x-oss-process=${ossProcess}`;
  }
}
