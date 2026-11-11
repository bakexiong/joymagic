import "@/config/style/global.css";
import Script from "next/script";

import NextTopLoader from "nextjs-toploader";

import { envConfigs } from "@/config";
import { defaultLocale, locales } from "@/config/locale";
import { getPathname } from "@/shared/lib/browser";
import { getSiteLogoUrl } from "@/shared/lib/site-logo";
import { getAdsService } from "@/shared/services/ads";
import { getAffiliateService } from "@/shared/services/affiliate";
import { getAnalyticsService } from "@/shared/services/analytics";
import { getCustomerService } from "@/shared/services/customer_service";
import { getAllConfigs } from "@/shared/models/config";

function normalizePathname(pathname: string) {
  let normalized = pathname || "/";
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized !== "/" && normalized.endsWith("/"))
    normalized = normalized.slice(0, -1);
  return normalized;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === "production";
  const isDebug = process.env.NEXT_PUBLIC_DEBUG === "true";
  const siteIconUrl = getSiteLogoUrl(180, 180);

  // app url
  const appUrl = envConfigs.app_url || "";

  const requestPathname = await getPathname();
  const pathnameSegments = requestPathname.split("/").filter(Boolean);
  const locale =
    pathnameSegments[0] && locales.includes(pathnameSegments[0])
      ? pathnameSegments[0]
      : defaultLocale;
  const pathnameWithoutLocale = locales.reduce((path, loc) => {
    if (path === `/${loc}`) return "/";
    if (path.startsWith(`/${loc}/`)) return path.slice(loc.length + 1) || "/";
    return path;
  }, requestPathname);
  const normalizedPathnameWithoutLocale = normalizePathname(
    pathnameWithoutLocale,
  );
  const isBlogRoute =
    normalizedPathnameWithoutLocale === "/blog" ||
    normalizedPathnameWithoutLocale.startsWith("/blog/");
  const isQwenImageLayeredRoute =
    normalizedPathnameWithoutLocale === "/qwen-image-layered";
  const allConfigs = await getAllConfigs();
  const googleAdsId =
    allConfigs.google_ads_id ||
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
    "AW-18242554191";
  const googleAdsConfig = {
    id: googleAdsId || undefined,
    labels: {
      login: allConfigs.google_ads_login_conversion_label || undefined,
      begin_checkout:
        allConfigs.google_ads_begin_checkout_conversion_label || undefined,
      purchase: allConfigs.google_ads_purchase_conversion_label || undefined,
    },
  };

  // ads components
  let adsMetaTags = null;
  let adsHeadScripts = null;
  let adsBodyScripts = null;

  // analytics components
  let analyticsMetaTags = null;
  let analyticsHeadScripts = null;
  let analyticsBodyScripts = null;

  // customer service components
  let customerServiceMetaTags = null;
  let customerServiceHeadScripts = null;
  let customerServiceBodyScripts = null;

  if (isProduction || isDebug) {
    // get ads components
    const adsService = await getAdsService();
    adsMetaTags = adsService.getMetaTags();
    adsHeadScripts = adsService.getHeadScripts();
    adsBodyScripts = adsService.getBodyScripts();

    // get analytics components
    const analyticsService = await getAnalyticsService();
    analyticsMetaTags = analyticsService.getMetaTags();
    analyticsHeadScripts = analyticsService.getHeadScripts();
    analyticsBodyScripts = analyticsService.getBodyScripts();

    // get customer service components
    const customerService = await getCustomerService();
    customerServiceMetaTags = customerService.getMetaTags();
    customerServiceHeadScripts = customerService.getHeadScripts();
    customerServiceBodyScripts = customerService.getBodyScripts();
  }

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      style={{
        ["--font-geist-sans" as string]:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        ["--font-geist-mono" as string]:
          'ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        ["--font-sans" as string]:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        ["--font-serif" as string]:
          'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
        ["--font-mono" as string]:
          'ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      }}
    >
      <head>
        <link rel="icon" href={siteIconUrl} type="image/png" />
        <link rel="apple-touch-icon" href={siteIconUrl} />
        {/* iOS Safari 需要 viewport-fit=cover 才能正确计算 env(safe-area-inset-*) */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />

        {/* preconnect to CDN for faster resource loading */}
        <link
          rel="preconnect"
          href="https://cdn.10b.ai"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for analytics - 使用 dns-prefetch 而不是 preconnect */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://app.pageview.app" />

        {/* Preload LCP image for mobile homepage */}
        <link
          rel="preload"
          href="https://cdn.10b.ai/z-image-bg.webp"
          as="image"
          fetchPriority="high"
        />

        {/* Pageview analytics - deferred for performance */}
        <Script
          src="https://app.pageview.app/js/script.js"
          data-domain="10b.ai"
          strategy="lazyOnload"
        />

        {/* inject locales */}
        {!isBlogRoute && !isQwenImageLayeredRoute && locales ? (
          <>
            <link
              rel="alternate"
              hrefLang="x-default"
              href={`${appUrl}${normalizedPathnameWithoutLocale}`}
            />
            {locales.map((loc) => (
              <link
                key={loc}
                rel="alternate"
                hrefLang={loc}
                href={`${appUrl}${
                  loc !== envConfigs.locale &&
                  normalizedPathnameWithoutLocale === "/"
                    ? `/${loc}`
                    : `${loc === envConfigs.locale ? "" : `/${loc}`}${normalizedPathnameWithoutLocale}`
                }`}
              />
            ))}
          </>
        ) : null}

        {/* inject ads meta tags */}
        {adsMetaTags}
        {/* inject ads head scripts */}
        {adsHeadScripts}

        {/* inject analytics meta tags */}
        {analyticsMetaTags}
        {/* inject analytics head scripts */}
        {analyticsHeadScripts}

        {/* inject customer service meta tags */}
        {customerServiceMetaTags}
        {/* inject customer service head scripts */}
        {customerServiceHeadScripts}

        {/* google ads - optimized loading */}
        {googleAdsId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-ads-gtag"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
window.__GOOGLE_ADS_CONFIG__ = ${JSON.stringify(googleAdsConfig)};
gtag('config', '${googleAdsId}');`,
              }}
            />
          </>
        ) : null}
      </head>
      <body
        suppressHydrationWarning
        className="overflow-x-hidden"
        style={{ minHeight: "100vh" }}
      >
        <NextTopLoader
          color="#6466F1"
          initialPosition={0.08}
          crawlSpeed={200}
          height={2}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #6466F1,0 0 5px #6466F1"
        />

        {children}

        {/* inject ads body scripts */}
        {adsBodyScripts}

        {/* inject analytics body scripts */}
        {analyticsBodyScripts}

        {/* inject customer service body scripts */}
        {customerServiceBodyScripts}
      </body>
    </html>
  );
}
