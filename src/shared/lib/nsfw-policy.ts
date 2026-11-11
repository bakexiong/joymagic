import { hasServerNsfwAccessGrant } from "@/shared/lib/nsfw-access";
import {
  grantUserNsfwWhitelist,
  isUserNsfwWhitelisted,
  normalizeEmailIdentity,
} from "@/shared/models/user";

export function parseNsfwWhitelistEmails(value?: string) {
  if (!value) {
    return new Set<string>();
  }

  return new Set(
    value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => normalizeEmailIdentity(item)),
  );
}

export function isUserInNsfwWhitelist(
  email?: string | null,
  whitelistValue?: string,
) {
  if (!email) {
    return false;
  }

  const whitelist = parseNsfwWhitelistEmails(whitelistValue);
  return whitelist.has(normalizeEmailIdentity(email));
}

export async function shouldSkipNsfwCheck(
  options: {
    userId?: string | null;
    email?: string | null;
    whitelistValue?: string;
  } = {},
) {
  const { userId, email, whitelistValue } = options;

  if (isUserInNsfwWhitelist(email, whitelistValue)) {
    return true;
  }

  if (userId && (await isUserNsfwWhitelisted(userId))) {
    return true;
  }

  if (userId && (await hasServerNsfwAccessGrant())) {
    await grantUserNsfwWhitelist(userId);
    return true;
  }

  return false;
}

export async function shouldRunOutputNsfwCheck(options: {
  userId?: string | null;
  email?: string | null;
  whitelistValue?: string;
  isPaidUser?: boolean;
}) {
  const { userId, email, whitelistValue, isPaidUser = false } = options;
  if (
    await shouldSkipNsfwCheck({
      userId,
      email,
      whitelistValue,
    })
  ) {
    return false;
  }

  return !isPaidUser;
}
