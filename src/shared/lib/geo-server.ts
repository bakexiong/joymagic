import { geolocation } from '@vercel/functions';

/**
 * 仅使用 Vercel geolocation/头部获取国家码
 * Ref: https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions
 */

function getHeader(headers: Headers | Record<string, string | null>, name: string): string | null {
    if (headers instanceof Headers) return headers.get(name);
    return (headers as Record<string, string | null>)[name] || null;
}


function getCountryFromVercel(headers: Headers | Record<string, string | null>): string | null {
    try {
        const geo = geolocation({ headers } as any);
        if (geo?.country && geo.country.length === 2) {
            console.log("getCountryFromVercel：" + JSON.stringify(geo));
            return geo.country;
        }

    } catch {
        // ignore
    }

    const country = getHeader(headers, 'x-vercel-ip-country');
    return country && country.length === 2 ? country : null;
}

export async function getCountryCodeFromRequest(
    headers: Headers | Record<string, string | null>
): Promise<string | null> {
    // Priority: Vercel geo → Cloudflare header → none
    const fromVercel = getCountryFromVercel(headers);
    if (fromVercel) return fromVercel;

    const cfCountry = getHeader(headers, 'cf-ipcountry');
    if (cfCountry && cfCountry.length === 2) {
        console.log("getCountryFromCloudflare：" + cfCountry);
        return cfCountry;
    }

    console.log('getCountryCodeFromRequest: country not detected');
    return null;
}

/**
 * 从请求头中获取客户端 IP 地址
 * 优先级: CF-Connecting-IP (Cloudflare) → X-Forwarded-For → X-Real-IP → X-Vercel-Forwarded-For
 */
export function getClientIPFromRequest(
    headers: Headers | Record<string, string | null>
): string | null {
    // Cloudflare
    const cfIP = getHeader(headers, 'cf-connecting-ip');
    if (cfIP) {
        // X-Forwarded-For 可能包含多个 IP，取第一个
        const firstIP = cfIP.split(',')[0]?.trim();
        if (firstIP) return firstIP;
    }

    // Vercel
    const vercelIP = getHeader(headers, 'x-vercel-forwarded-for');
    if (vercelIP) {
        const firstIP = vercelIP.split(',')[0]?.trim();
        if (firstIP) return firstIP;
    }

    // X-Forwarded-For (通用代理头)
    const xForwardedFor = getHeader(headers, 'x-forwarded-for');
    if (xForwardedFor) {
        const firstIP = xForwardedFor.split(',')[0]?.trim();
        if (firstIP) return firstIP;
    }

    // X-Real-IP (Nginx 等)
    const xRealIP = getHeader(headers, 'x-real-ip');
    if (xRealIP) {
        const firstIP = xRealIP.split(',')[0]?.trim();
        if (firstIP) return firstIP;
    }

    return null;
}

