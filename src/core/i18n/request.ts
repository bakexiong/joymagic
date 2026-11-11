import { getRequestConfig } from "next-intl/server";

import {
  defaultLocale,
  localeMessagesPaths,
  localeMessagesRootPath,
} from "@/config/locale";

import { routing } from "./config";

type PlainObject = Record<string, any>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function mergePricingGroups(base: any[], override: any[]) {
  const byName = new Map(
    (Array.isArray(override) ? override : [])
      .filter(isPlainObject)
      .map((g) => [g.name, g]),
  );

  return (Array.isArray(base) ? base : []).map((g) =>
    isPlainObject(g) ? { ...g, ...(byName.get(g.name) ?? {}) } : g,
  );
}

function mergePricingItems(
  base: any[],
  override: any[],
  mergeDeep: (a: any, b: any, keyPath: string[]) => any,
  keyPath: string[],
) {
  const byProductId = new Map(
    (Array.isArray(override) ? override : [])
      .filter(isPlainObject)
      .map((item) => [item.product_id, item]),
  );

  return (Array.isArray(base) ? base : []).map((item) => {
    if (!isPlainObject(item)) return item;
    const local = byProductId.get(item.product_id);
    if (!local) return item;
    return mergeDeep(item, local, keyPath);
  });
}

function mergeFaqItems(base: any[], override: any[]) {
  const baseArr = Array.isArray(base) ? base : [];
  const overrideArr = Array.isArray(override) ? override : [];

  const out = baseArr.map((item, idx) => {
    const local = overrideArr[idx];
    if (local === undefined) return item;
    if (isPlainObject(item) && isPlainObject(local))
      return { ...item, ...local };
    return local;
  });

  return out;
}

function mergeMessagesByPath(base: any, override: any, path: string) {
  const mergeDeep = (a: any, b: any, keyPath: string[]): any => {
    if (b === undefined) return a;
    if (a === undefined) return b;

    if (Array.isArray(a) || Array.isArray(b)) {
      const joined = keyPath.join(".");
      if (path === "pricing") {
        if (joined === "pricing.groups") {
          return mergePricingGroups(a, b);
        }
        if (joined === "pricing.items") {
          return mergePricingItems(a, b, mergeDeep, keyPath);
        }
        if (joined === "faq.items") {
          return mergeFaqItems(a, b);
        }
      }

      return b === undefined ? a : b;
    }

    if (isPlainObject(a) && isPlainObject(b)) {
      const out: PlainObject = { ...a };
      for (const [k, v] of Object.entries(b)) {
        out[k] = mergeDeep(a[k], v, [...keyPath, k]);
      }
      return out;
    }

    return b;
  };

  return mergeDeep(base, override, []);
}

export async function loadMessages(
  path: string,
  locale: string = defaultLocale,
) {
  try {
    // Always start from default locale as the base
    let baseMessages: any = {};
    try {
      const base = await import(
        `@/config/locale/messages/${defaultLocale}/${path}.json`
      );
      baseMessages = base.default ?? {};
    } catch {
      baseMessages = {};
    }

    if (locale === defaultLocale) return baseMessages;

    // Try to load locale-specific messages and deep-merge onto the base
    try {
      const local = await import(
        `@/config/locale/messages/${locale}/${path}.json`
      );
      const localMessages = local.default ?? {};
      return mergeMessagesByPath(baseMessages, localMessages, path);
    } catch {
      return baseMessages;
    }
  } catch (e) {
    return {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  // Map common locale variants to our configured locales before validation.
  // Otherwise values like zh-CN would be reset to the default locale too early.
  if (locale === "zh-CN" || locale === "zh-cn") locale = "zh";
  if (locale === "zh-TW" || locale === "zh-tw") locale = "zh-Hant-TW";
  if (locale === "zh-HK" || locale === "zh-hk") locale = "zh-hk";

  if (!locale || !routing.locales.includes(locale as string)) {
    locale = routing.defaultLocale;
  }

  try {
    // load all local messages
    const allMessages = await Promise.all(
      localeMessagesPaths.map((path) => loadMessages(path, locale)),
    );

    // merge all local messages
    const messages: any = {};

    localeMessagesPaths.forEach((path, index) => {
      const localMessages = allMessages[index];

      const keys = path.split("/");
      let current = messages;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = localMessages;
    });

    return {
      locale,
      messages,
    };
  } catch (e) {
    return {
      locale: defaultLocale,
      messages: await loadMessages(localeMessagesRootPath, defaultLocale),
    };
  }
});
