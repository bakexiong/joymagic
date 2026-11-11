import {
  PERMISSIONS,
  PermissionDeniedError,
  requirePermission,
} from "@/core/rbac";
import { getSignUser } from "@/shared/models/user";

export async function requireAffiliateAdminRead() {
  await requirePermission({ code: PERMISSIONS.AFFILIATE_READ });
  const user = await getSignUser();
  if (!user) {
    throw new PermissionDeniedError("User not authenticated");
  }
  return user;
}

export async function requireAffiliateAdminWrite() {
  await requirePermission({ code: PERMISSIONS.AFFILIATE_WRITE });
  const user = await getSignUser();
  if (!user) {
    throw new PermissionDeniedError("User not authenticated");
  }
  return user;
}

export function parseIntValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseNullableIntValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
