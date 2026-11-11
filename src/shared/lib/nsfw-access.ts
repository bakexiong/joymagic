import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const DEFAULT_NSFW_ACCESS_QUERY_KEY = "px";
const DEFAULT_NSFW_ACCESS_COOKIE_NAME = "nxp";
const DEFAULT_NSFW_ACCESS_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

type NsfwAccessPayload = {
  v: 1;
  exp: number;
};

function getNsfwAccessQueryKey() {
  return (
    process.env.NSFW_ACCESS_QUERY_KEY?.trim() || DEFAULT_NSFW_ACCESS_QUERY_KEY
  );
}

function getNsfwAccessCookieName() {
  return (
    process.env.NSFW_ACCESS_COOKIE_NAME?.trim() || DEFAULT_NSFW_ACCESS_COOKIE_NAME
  );
}

function getNsfwAccessCookieMaxAge() {
  const parsed = Number(process.env.NSFW_ACCESS_COOKIE_MAX_AGE || "");
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_NSFW_ACCESS_COOKIE_MAX_AGE;
}

function getNsfwAccessToken() {
  return process.env.NSFW_ACCESS_TOKEN?.trim() || "";
}

function getNsfwAccessSigningSecret() {
  return (
    process.env.NSFW_ACCESS_SIGNING_SECRET?.trim() || getNsfwAccessToken()
  );
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

async function signPayload(payload: string) {
  const secret = getNsfwAccessSigningSecret();
  if (!secret) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return Buffer.from(signatureBuffer).toString("base64url");
}

export function getNsfwAccessCookieConfig() {
  return {
    name: getNsfwAccessCookieName(),
    maxAge: getNsfwAccessCookieMaxAge(),
  };
}

export function readNsfwAccessTokenFromRequest(request: NextRequest) {
  const queryKey = getNsfwAccessQueryKey();
  return (
    request.nextUrl.searchParams.get(queryKey)?.trim() ||
    new URL(request.url).searchParams.get(queryKey)?.trim() ||
    null
  );
}

export function isValidNsfwAccessToken(token?: string | null) {
  const expectedToken = getNsfwAccessToken();
  return Boolean(token && expectedToken && token === expectedToken);
}

export async function createNsfwAccessCookieValue() {
  const maxAge = getNsfwAccessCookieMaxAge();
  const payload: NsfwAccessPayload = {
    v: 1,
    exp: Date.now() + maxAge * 1000,
  };
  const serializedPayload = JSON.stringify(payload);
  const signature = await signPayload(serializedPayload);

  if (!signature) {
    return null;
  }

  return `${encodeBase64Url(serializedPayload)}.${signature}`;
}

export async function hasValidNsfwAccessCookieValue(value?: string | null) {
  if (!value) {
    return false;
  }

  const [encodedPayload, receivedSignature] = value.split(".");
  if (!encodedPayload || !receivedSignature) {
    return false;
  }

  try {
    const serializedPayload = decodeBase64Url(encodedPayload);
    const expectedSignature = await signPayload(serializedPayload);

    if (!expectedSignature || expectedSignature !== receivedSignature) {
      return false;
    }

    const payload = JSON.parse(serializedPayload) as NsfwAccessPayload;
    return payload.v === 1 && Number(payload.exp) > Date.now();
  } catch {
    return false;
  }
}

export async function hasServerNsfwAccessGrant() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(getNsfwAccessCookieName())?.value;
  return hasValidNsfwAccessCookieValue(cookieValue);
}
