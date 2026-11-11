import { createHash } from "crypto";

import { PERMISSIONS } from "@/core/rbac";
import { getClientIPFromRequest } from "@/shared/lib/geo-server";
import { isIPBlacklisted } from "@/shared/models/ip-blacklist";
import { getSignUser } from "@/shared/models/user";
import { hasPermission } from "@/shared/services/rbac";

type UploadKind = "image" | "video" | "audio";

type UploadRule = {
  maxBytes: number;
  maxFiles: number;
  mimeTypes: string[];
  extensions: string[];
};

type UploadGuardResult = {
  ok: boolean;
  error?: string;
  signUser?: Awaited<ReturnType<typeof getSignUser>>;
  clientIp?: string | null;
};

const MB = 1024 * 1024;

const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  image: {
    maxBytes: 15 * MB,
    maxFiles: 4,
    mimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    extensions: ["jpg", "jpeg", "png", "webp", "gif"],
  },
  video: {
    maxBytes: 100 * MB,
    maxFiles: 1,
    mimeTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"],
    extensions: ["mp4", "mov", "webm", "m4v"],
  },
  audio: {
    maxBytes: 30 * MB,
    maxFiles: 1,
    mimeTypes: [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/mp4",
      "audio/aac",
      "audio/ogg",
      "audio/flac",
    ],
    extensions: ["mp3", "wav", "m4a", "aac", "ogg", "flac"],
  },
};

function getLowerCaseExtension(filename: string) {
  const parts = String(filename || "").split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

function isAllowedFile(file: File, kind: UploadKind) {
  const rule = UPLOAD_RULES[kind];
  const extension = getLowerCaseExtension(file.name);

  if (!rule.mimeTypes.includes(file.type.toLowerCase())) {
    return false;
  }

  if (!extension || !rule.extensions.includes(extension)) {
    return false;
  }

  if (file.size <= 0 || file.size > rule.maxBytes) {
    return false;
  }

  return true;
}

export async function guardUploadRequest(
  req: Request,
  kind: UploadKind,
  files: File[]
): Promise<UploadGuardResult> {
  const signUser = await getSignUser();
  if (!signUser?.id) {
    return {
      ok: false,
      error: "no auth, please sign in",
    };
  }

  const clientIp = getClientIPFromRequest(req.headers);
  if (clientIp && (await isIPBlacklisted(clientIp))) {
    return {
      ok: false,
      error: "forbidden",
      signUser,
      clientIp,
    };
  }

  const rule = UPLOAD_RULES[kind];
  if (!files.length) {
    return {
      ok: false,
      error: "No files provided",
      signUser,
      clientIp,
    };
  }

  if (files.length > rule.maxFiles) {
    return {
      ok: false,
      error: `Too many files. Max ${rule.maxFiles} ${kind} file(s) per request`,
      signUser,
      clientIp,
    };
  }

  for (const file of files) {
    if (!isAllowedFile(file, kind)) {
      return {
        ok: false,
        error: `File ${file.name} is not an allowed ${kind} file`,
        signUser,
        clientIp,
      };
    }
  }

  return {
    ok: true,
    signUser,
    clientIp,
  };
}

export async function guardAdminUploadRequest(req: Request) {
  const signUser = await getSignUser();
  if (!signUser?.id) {
    return {
      ok: false,
      error: "no auth, please sign in",
    };
  }

  const allowed = await hasPermission(signUser.id, PERMISSIONS.USERS_WRITE);
  if (!allowed) {
    return {
      ok: false,
      error: "forbidden",
    };
  }

  const clientIp = getClientIPFromRequest(req.headers);
  if (clientIp && (await isIPBlacklisted(clientIp))) {
    return {
      ok: false,
      error: "forbidden",
      signUser,
      clientIp,
    };
  }

  return {
    ok: true,
    signUser,
    clientIp,
  };
}

export function buildScopedUploadKey(params: {
  userId: string;
  kind: UploadKind;
  filename: string;
  timestamp?: Date;
  suffix: string;
}) {
  const now = params.timestamp || new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const ext = getLowerCaseExtension(params.filename);
  return `uploads/${params.userId}/${params.kind}s/${yyyy}/${mm}/${dd}/${params.suffix}.${ext}`;
}

export function buildAnonymousScopedKey(params: {
  clientIp?: string | null;
  kind: UploadKind;
  filename: string;
  timestamp?: Date;
  suffix: string;
}) {
  const namespace = params.clientIp
    ? createHash("sha256").update(params.clientIp).digest("hex").slice(0, 16)
    : "unknown";
  const now = params.timestamp || new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const ext = getLowerCaseExtension(params.filename);
  return `uploads/anonymous/${namespace}/${params.kind}s/${yyyy}/${mm}/${dd}/${params.suffix}.${ext}`;
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function isSafeRemoteUploadUrl(rawUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname === "::1" ||
    hostname === "[::1]"
  ) {
    return false;
  }

  if (hostname.includes(":")) {
    return false;
  }

  if (isPrivateIpv4(hostname)) {
    return false;
  }

  return true;
}
