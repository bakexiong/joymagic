"use client";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __GOOGLE_ADS_CONFIG__?: {
      id?: string;
      labels?: Partial<Record<GoogleAdsConversionAction, string>>;
    };
  }
}

const LOGIN_INTENT_STORAGE_KEY = "analytics_pending_login";
const TRACKED_PURCHASES_STORAGE_KEY = "analytics_tracked_purchases";

type GoogleTagParams = Record<string, unknown>;
type GoogleAdsConversionAction = "login" | "begin_checkout" | "purchase";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJsonArray(key: string): string[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, values: string[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(values.slice(-50)));
}

export function trackGoogleTagEvent(
  eventName: string,
  params: GoogleTagParams = {},
) {
  if (!isBrowser() || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, params);
}

export function setGoogleTagUserData(userData: GoogleTagParams) {
  if (!isBrowser() || typeof window.gtag !== "function") {
    return;
  }

  const normalizedEntries = Object.entries(userData).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );

  if (!normalizedEntries.length) {
    return;
  }

  window.gtag("set", "user_data", Object.fromEntries(normalizedEntries));
}

function getGoogleAdsSendTo(action: GoogleAdsConversionAction) {
  if (!isBrowser()) {
    return null;
  }

  const adsConfig = window.__GOOGLE_ADS_CONFIG__;
  const adsId = adsConfig?.id;
  const label = adsConfig?.labels?.[action];

  if (!adsId || !label) {
    return null;
  }

  return `${adsId}/${label}`;
}

export function trackGoogleAdsConversion(
  action: GoogleAdsConversionAction,
  params: GoogleTagParams = {},
) {
  if (!isBrowser() || typeof window.gtag !== "function") {
    return false;
  }

  const sendTo = getGoogleAdsSendTo(action);
  if (!sendTo) {
    return false;
  }

  window.gtag("event", "conversion", {
    ...params,
    send_to: sendTo,
  });

  return true;
}

export function rememberPendingLogin(method: string) {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(
    LOGIN_INTENT_STORAGE_KEY,
    JSON.stringify({
      method,
      ts: Date.now(),
    }),
  );
}

export function consumePendingLogin(): {
  method?: string;
} | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(LOGIN_INTENT_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    window.sessionStorage.removeItem(LOGIN_INTENT_STORAGE_KEY);
    const parsed = JSON.parse(rawValue) as { method?: string; ts?: number };

    if (!parsed.ts || Date.now() - parsed.ts > 10 * 60 * 1000) {
      return null;
    }

    return {
      method: parsed.method,
    };
  } catch {
    window.sessionStorage.removeItem(LOGIN_INTENT_STORAGE_KEY);
    return null;
  }
}

export function hasTrackedPurchase(orderNo: string) {
  if (!orderNo) {
    return false;
  }

  return readJsonArray(TRACKED_PURCHASES_STORAGE_KEY).includes(orderNo);
}

export function markPurchaseTracked(orderNo: string) {
  if (!orderNo) {
    return;
  }

  const trackedPurchases = readJsonArray(TRACKED_PURCHASES_STORAGE_KEY);
  if (trackedPurchases.includes(orderNo)) {
    return;
  }

  trackedPurchases.push(orderNo);
  writeJsonArray(TRACKED_PURCHASES_STORAGE_KEY, trackedPurchases);
}
