const BRAND_DOMAIN = '10b.ai';

function normalizeHref(href?: string) {
  if (!href) return null;
  if (href.startsWith('//')) {
    return `https:${href}`;
  }
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  return null;
}

export function getHostname(href?: string): string | null {
  const normalized = normalizeHref(href);
  if (!normalized) return null;

  try {
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Returns true if the href is an absolute URL that does not belong to the
 * 10b.ai domain (or its subdomains).
 */
export function isNonBrandExternal(href?: string) {
  const hostname = getHostname(href);
  if (!hostname) return false;

  return !hostname.endsWith(BRAND_DOMAIN);
}

export function mergeRelValues(
  existingRel?: string,
  additions?: string | string[]
) {
  const relParts = new Set(
    (existingRel || '')
      .split(/\s+/)
      .concat(additions ? (Array.isArray(additions) ? additions : additions.split(/\s+/)) : [])
      .filter(Boolean)
  );

  return relParts.size ? Array.from(relParts).join(' ') : undefined;
}
