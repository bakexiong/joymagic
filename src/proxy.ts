import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createIntlMiddleware from "next-intl/middleware";

import { isUnavailableBetaAccountPath } from "@/config/site";

import { routing } from "@/core/i18n/config";
import {
  isBlockedByCreemReviewMode,
  isCreemReviewMode,
} from "@/shared/lib/creem-review";
import {
  createNsfwAccessCookieValue,
  getNsfwAccessCookieConfig,
  isValidNsfwAccessToken,
  readNsfwAccessTokenFromRequest,
} from "@/shared/lib/nsfw-access";
import {
  AFFILIATE_COOKIE_NAME,
  AFFILIATE_QUERY_KEYS,
} from "@/shared/types/affiliate";

const intlMiddleware = createIntlMiddleware(routing);

function readAffiliateCode(request: NextRequest) {
  const requestUrl = new URL(request.url);

  for (const key of AFFILIATE_QUERY_KEYS) {
    const value =
      requestUrl.searchParams.get(key) || request.nextUrl.searchParams.get(key);
    if (value?.trim()) {
      return value.trim();
    }
  }

  return null;
}

function buildAffiliateCookieValue(opts: {
  affiliateCode: string;
  sessionId: string;
}) {
  return Buffer.from(
    JSON.stringify({
      affiliateCode: opts.affiliateCode,
      sessionId: opts.sessionId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  ).toString("base64url");
}

function readActiveAffiliateCookie(request: NextRequest): {
  affiliateCode: string;
  sessionId: string;
  expiresAt: string;
} | null {
  const current = request.cookies.get(AFFILIATE_COOKIE_NAME)?.value;
  if (!current) {
    return null;
  }

  try {
    const decoded = (() => {
      try {
        return Buffer.from(current, "base64url").toString("utf8");
      } catch {
        return decodeURIComponent(current);
      }
    })();
    const parsed = JSON.parse(decoded);
    if (!parsed?.affiliateCode || !parsed?.sessionId || !parsed?.expiresAt) {
      return null;
    }

    if (new Date(parsed.expiresAt) <= new Date()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Remove trailing slash (except for root path)
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 308);
  }

  // Only allow blog routes without locale prefix (e.g. /blog/...)
  // Disallow /{locale}/blog/... entirely.
  const parts = pathname.split("/").filter(Boolean);
  const firstSegment = parts[0] || "";
  const isLocalePrefixed = routing.locales.includes(firstSegment as any);
  const pathWithoutLocale = isLocalePrefixed
    ? `/${parts.slice(1).join("/")}`
    : pathname;

  if (isUnavailableBetaAccountPath(pathWithoutLocale)) {
    const prefix =
      isLocalePrefixed && firstSegment !== routing.defaultLocale
        ? `/${firstSegment}`
        : "";
    return NextResponse.redirect(new URL(`${prefix}/pricing`, request.url));
  }

  if (isCreemReviewMode() && isBlockedByCreemReviewMode(pathWithoutLocale)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (parts.length >= 2 && routing.locales.includes(parts[0] as any)) {
    if (parts[1] === "blog") {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  // Keep /blog as a non-localized route (no locale rewrite).
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    response.headers.set("x-url", request.url);
    return response;
  }

  // Handle internationalization first
  const intlResponse = intlMiddleware(request);
  const affiliateCode = readAffiliateCode(request);
  const activeAffiliateCookie = readActiveAffiliateCookie(request);
  const nsfwAccessToken = readNsfwAccessTokenFromRequest(request);
  const nsfwAccessCookieValue = isValidNsfwAccessToken(nsfwAccessToken)
    ? await createNsfwAccessCookieValue()
    : null;
  const nsfwAccessCookieConfig = getNsfwAccessCookieConfig();

  const applyNsfwAccessCookie = (response: NextResponse) => {
    if (nsfwAccessCookieValue) {
      response.cookies.set(nsfwAccessCookieConfig.name, nsfwAccessCookieValue, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: nsfwAccessCookieConfig.maxAge,
      });
      response.headers.set("x-nsfw-access-granted", "1");
    }

    return response;
  };

  if (affiliateCode) {
    const chosenAffiliateCode =
      activeAffiliateCookie?.affiliateCode || affiliateCode;
    const sessionId = activeAffiliateCookie?.sessionId || crypto.randomUUID();

    // Within the active 7-day window we keep the first clicked affiliate code.
    if (
      !activeAffiliateCookie ||
      activeAffiliateCookie.affiliateCode === affiliateCode
    ) {
      intlResponse.cookies.set(
        AFFILIATE_COOKIE_NAME,
        buildAffiliateCookieValue({
          affiliateCode: chosenAffiliateCode,
          sessionId,
        }),
        {
          path: "/",
          sameSite: "lax",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60,
        },
      );
      intlResponse.headers.set("x-affiliate-code", chosenAffiliateCode);
      intlResponse.headers.set("x-affiliate-session-id", sessionId);
    }
  }

  applyNsfwAccessCookie(intlResponse);

  // Extract locale from pathname
  const locale = pathname.split("/")[1];
  const isValidLocale = routing.locales.includes(locale as any);

  // Only check authentication for admin routes
  if (
    pathWithoutLocale.startsWith("/admin") ||
    pathWithoutLocale.startsWith("/settings") ||
    pathWithoutLocale.startsWith("/activity")
  ) {
    // Check if session cookie exists
    const sessionCookie = getSessionCookie(request);

    // If no session token found, redirect to sign-in
    if (!sessionCookie) {
      const signInUrl = new URL(
        isValidLocale ? `/${locale}/sign-in` : "/sign-in",
        request.url,
      );
      // Add the current path (including search params) as callback - use relative path for multi-language support
      const callbackPath = pathWithoutLocale + request.nextUrl.search;
      signInUrl.searchParams.set("callbackUrl", callbackPath);
      return applyNsfwAccessCookie(NextResponse.redirect(signInUrl));
    }

    // For admin routes, we need to check RBAC permissions
    // Note: Full permission check happens in the page/API route level
    // This is a lightweight session check to prevent unauthorized access
    // The detailed permission check (admin.access and specific permissions)
    // will be done in the layout or individual pages using requirePermission()
  }

  intlResponse.headers.set("x-pathname", request.nextUrl.pathname);
  intlResponse.headers.set("x-url", request.url);

  // For all other routes (including /, /sign-in, /sign-up, /sign-out), just return the intl response
  return intlResponse;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
