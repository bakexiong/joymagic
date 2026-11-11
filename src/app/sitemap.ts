import { readdir } from "node:fs/promises";
import path from "node:path";

import type { MetadataRoute } from "next";

import { envConfigs } from "@/config";
import { defaultLocale, locales } from "@/config/locale";
import { docsSource, pagesSource, postsSource } from "@/core/docs/source";
import { getImageEffectItemsSync } from "@/shared/lib/image-effect-data";
import { getModelLandingSlugs } from "@/shared/lib/model-landing-data";
import { getVideoEffectItemsSync } from "@/shared/lib/video-effect-data";

const APP_LOCALE_DIR = path.join(process.cwd(), "src/app/[locale]");
const BUILD_TIME = new Date();

const EXCLUDED_EXACT_ROUTES = new Set([
  "/",
  "/ai-image-generator",
  "/image-to-image",
  "/no-permission",
  "/forgot-password",
  "/reset-password",
  "/sign-in",
  "/sign-up",
  "/ai-character",
  "/checkout/success",
  "/creator",
  "/video-extend/wan-2-7",
  "/text-to-image/yoga-v1",
]);

const EXCLUDED_ROUTE_PREFIXES = [
  "/activity",
  "/admin",
  "/chat",
  "/create/canvas",
  "/popup",
  "/settings",
];

const TOOL_CATEGORY_ROUTES = [
  "/tools/text-to-image",
  "/tools/image-to-image",
  "/tools/text-to-video",
  "/tools/image-to-video",
  "/tools/image-effect",
  "/tools/video-effect",
  "/tools/image-upscaler",
  "/tools/image-background-remover",
  "/tools/image-eraser",
];

function normalizeRoute(route: string) {
  if (!route) return "/";

  let normalized = route.replace(/\\/g, "/");
  normalized = normalized.replace(/\/+/g, "/");

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized !== "/" && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function localizeRoute(route: string, locale: string) {
  const normalizedRoute = normalizeRoute(route);
  if (locale === defaultLocale) {
    return normalizedRoute;
  }

  if (normalizedRoute === "/") {
    return `/${locale}`;
  }

  return `/${locale}${normalizedRoute}`;
}

function toAbsoluteUrl(route: string) {
  return `${envConfigs.app_url}${normalizeRoute(route)}`;
}

function isExcludedRoute(route: string) {
  const normalizedRoute = normalizeRoute(route);

  if (
    normalizedRoute.endsWith("/privacy-policy") ||
    normalizedRoute.endsWith("/terms-of-service")
  ) {
    return true;
  }

  if (EXCLUDED_EXACT_ROUTES.has(normalizedRoute)) {
    return true;
  }

  return EXCLUDED_ROUTE_PREFIXES.some(
    (prefix) =>
      normalizedRoute === prefix || normalizedRoute.startsWith(`${prefix}/`),
  );
}

async function collectPublicAppRoutes(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      routes.push(...(await collectPublicAppRoutes(fullPath)));
      continue;
    }

    if (!entry.isFile() || entry.name !== "page.tsx") {
      continue;
    }

    const relativePath = path.relative(APP_LOCALE_DIR, fullPath);
    const routeSegments = relativePath
      .replace(/\/page\.tsx$/, "")
      .split(path.sep)
      .filter(Boolean)
      .filter((segment) => !/^\(.*\)$/.test(segment));

    if (routeSegments.some((segment) => segment.includes("["))) {
      continue;
    }

    const route = normalizeRoute(routeSegments.join("/"));
    if (isExcludedRoute(route)) {
      continue;
    }

    routes.push(route);
  }

  return routes;
}

function pushEntry(
  entries: MetadataRoute.Sitemap,
  seen: Set<string>,
  route: string,
  lastModified = BUILD_TIME,
) {
  const url = toAbsoluteUrl(route);
  if (seen.has(url)) {
    return;
  }

  seen.add(url);
  entries.push({
    url,
    lastModified,
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  pushEntry(entries, seen, "/");

  const appRoutes = await collectPublicAppRoutes(APP_LOCALE_DIR);

  for (const locale of locales) {
    const modelLandingSlugs = await getModelLandingSlugs(locale);
    const dynamicToolRoutes = [
      ...TOOL_CATEGORY_ROUTES,
      ...getImageEffectItemsSync().map(
        (item) => `/tools/image-effect/${item.slug}`,
      ),
      ...getVideoEffectItemsSync().map(
        (item) => `/tools/video-effect/${item.slug}`,
      ),
    ];

    pushEntry(entries, seen, localizeRoute("/blog", locale));

    for (const route of appRoutes) {
      pushEntry(entries, seen, localizeRoute(route, locale));
    }

    for (const slug of modelLandingSlugs) {
      pushEntry(entries, seen, localizeRoute(`/model/${slug}`, locale));
    }

    for (const route of dynamicToolRoutes) {
      if (isExcludedRoute(route)) {
        continue;
      }

      pushEntry(entries, seen, localizeRoute(route, locale));
    }

    for (const page of pagesSource.getPages(locale) || []) {
      const route = normalizeRoute(page.url);
      if (isExcludedRoute(route)) {
        continue;
      }

      pushEntry(entries, seen, route);
    }

    for (const page of docsSource.getPages(locale) || []) {
      pushEntry(entries, seen, normalizeRoute(page.url));
    }

    for (const post of postsSource.getPages(locale) || []) {
      pushEntry(entries, seen, normalizeRoute(post.url));
    }
  }

  return entries.sort((a, b) => a.url.localeCompare(b.url));
}
