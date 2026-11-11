import {
  createHash,
  timingSafeEqual as nodeTimingSafeEqual,
} from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import { AwsClient } from "aws4fetch";
import postgres from "postgres";

type MediaType = "image" | "video";

type TransferRequest = {
  url?: unknown;
  mediaType?: unknown;
  targetPrefix?: unknown;
  filename?: unknown;
  metadata?: unknown;
  idempotencyKey?: unknown;
};

type TransferSuccess = {
  success: true;
  sourceUrl: string;
  url: string;
  key: string;
  bucket: string;
  mediaType: MediaType;
  contentType: string;
  size: number;
  thumbnailUrl?: string;
};

type TransferFailure = {
  success: false;
  sourceUrl?: string;
  error: {
    code: string;
    message: string;
  };
};

type TransferResult = TransferSuccess | TransferFailure;

type RuntimeConfig = {
  port: number;
  uploadServiceToken: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2Bucket: string;
  r2Endpoint: string;
  r2PublicDomain: string;
  maxImageBytes: number;
  maxVideoBytes: number;
  downloadTimeoutMs: number;
  databaseUrl?: string;
  uploadWorkerEnabled: boolean;
  uploadWorkerIntervalMs: number;
  uploadWorkerBatchSize: number;
};

const DEFAULT_MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const DEFAULT_MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 60_000;
const MAX_BATCH_SIZE = 20;
const MAX_REDIRECTS = 3;
const MAX_JSON_BODY_BYTES = 1024 * 1024;
const DEFAULT_UPLOAD_WORKER_INTERVAL_MS = 60_000;
const DEFAULT_UPLOAD_WORKER_BATCH_SIZE = 5;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function loadConfig(): RuntimeConfig {
  const r2AccountId = process.env.R2_ACCOUNT_ID || "";
  const r2Endpoint =
    process.env.R2_ENDPOINT ||
    (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : "");
  if (!r2Endpoint) {
    throw new Error("R2_ACCOUNT_ID or R2_ENDPOINT is required");
  }

  return {
    port: parsePositiveInt(process.env.PORT, 3000),
    uploadServiceToken: requiredEnv("UPLOAD_SERVICE_TOKEN"),
    r2AccountId,
    r2AccessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    r2SecretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    r2Bucket: requiredEnv("R2_BUCKET"),
    r2Endpoint: stripTrailingSlash(r2Endpoint),
    r2PublicDomain: stripTrailingSlash(requiredEnv("R2_PUBLIC_DOMAIN")),
    maxImageBytes: parsePositiveInt(
      process.env.MAX_IMAGE_BYTES,
      DEFAULT_MAX_IMAGE_BYTES,
    ),
    maxVideoBytes: parsePositiveInt(
      process.env.MAX_VIDEO_BYTES,
      DEFAULT_MAX_VIDEO_BYTES,
    ),
    downloadTimeoutMs: parsePositiveInt(
      process.env.DOWNLOAD_TIMEOUT_MS,
      DEFAULT_DOWNLOAD_TIMEOUT_MS,
    ),
    databaseUrl: process.env.DATABASE_URL,
    uploadWorkerEnabled:
      process.env.R2_UPLOAD_WORKER_ENABLED !== "false" &&
      Boolean(process.env.DATABASE_URL),
    uploadWorkerIntervalMs: parsePositiveInt(
      process.env.R2_UPLOAD_WORKER_INTERVAL_MS,
      DEFAULT_UPLOAD_WORKER_INTERVAL_MS,
    ),
    uploadWorkerBatchSize: parsePositiveInt(
      process.env.R2_UPLOAD_WORKER_BATCH_SIZE,
      DEFAULT_UPLOAD_WORKER_BATCH_SIZE,
    ),
  };
}

function writeJson(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function ok(res: ServerResponse, data: unknown, status = 200) {
  writeJson(res, status, { code: 0, message: "ok", data });
}

function err(res: ServerResponse, code: string, message: string, status = 400) {
  writeJson(res, status, {
    code: -1,
    message,
    error: { code, message },
  });
}

function getMaxBytes(config: RuntimeConfig, mediaType: MediaType) {
  return mediaType === "video" ? config.maxVideoBytes : config.maxImageBytes;
}

function isMediaType(value: unknown): value is MediaType {
  return value === "image" || value === "video";
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0"
  ) {
    return true;
  }

  if (normalized === "::1" || normalized === "[::1]") {
    return true;
  }

  const parts = normalized.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function parseSourceUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("url is required");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("url is invalid");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("only http and https URLs are allowed");
  }

  if (isPrivateHostname(parsed.hostname)) {
    throw new Error("private or local URLs are not allowed");
  }

  parsed.hash = "";
  return parsed;
}

function assertContentType(contentType: string, mediaType: MediaType) {
  const normalized = contentType.toLowerCase();
  if (mediaType === "image" && !normalized.startsWith("image/")) {
    throw new Error(`source content-type ${contentType} is not an image`);
  }
  if (mediaType === "video" && !normalized.startsWith("video/")) {
    throw new Error(`source content-type ${contentType} is not a video`);
  }
}

function extensionFromContentType(contentType: string, mediaType: MediaType) {
  const normalized = contentType.toLowerCase().split(";")[0].trim();
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "video/x-matroska": "mkv",
  };
  return map[normalized] || (mediaType === "video" ? "mp4" : "jpg");
}

function inferMediaTypeFromUrl(url: string): MediaType {
  const normalized = url.toLowerCase().split("?")[0].split("#")[0];
  if (/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(normalized)) {
    return "video";
  }
  return "image";
}

function sanitizeSegment(value: string, fallback: string) {
  const sanitized = value
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .join("-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || fallback;
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildObjectKey(input: {
  sourceUrl: string;
  mediaType: MediaType;
  targetPrefix?: unknown;
  filename?: unknown;
  idempotencyKey?: unknown;
  contentType: string;
}) {
  const prefix =
    typeof input.targetPrefix === "string" && input.targetPrefix.trim()
      ? input.targetPrefix
      : `transfers/${input.mediaType}s`;
  const safePrefix = prefix
    .split("/")
    .map((part) => sanitizeSegment(part, "media"))
    .join("/");

  const extension = extensionFromContentType(
    input.contentType,
    input.mediaType,
  );
  const hashSource =
    typeof input.idempotencyKey === "string" && input.idempotencyKey.trim()
      ? input.idempotencyKey.trim()
      : input.sourceUrl;
  const hash = sha256Hex(hashSource).slice(0, 32);

  const filename =
    typeof input.filename === "string" && input.filename.trim()
      ? sanitizeSegment(input.filename.trim(), `${hash}.${extension}`)
      : `${hash}.${extension}`;
  const normalizedFilename = filename.includes(".")
    ? filename
    : `${filename}.${extension}`;

  return `${safePrefix}/${normalizedFilename}`;
}

function buildStoragePrefix(mediaType: MediaType) {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `generated/${mediaType}s/${yyyy}/${mm}/${dd}`;
}

function buildFilename(
  mediaType: MediaType,
  index: number,
  uniqueSeed?: string | null,
) {
  const safeMediaType = sanitizeSegment(mediaType, "media");
  const uniquePart = uniqueSeed
    ? sha256Hex(uniqueSeed).slice(0, 12)
    : sha256Hex(`${Date.now()}:${index}`).slice(0, 12);
  return `${safeMediaType}-${uniquePart}-${index + 1}`;
}

function isAuthorized(req: IncomingMessage, config: RuntimeConfig) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    return false;
  }

  const left = Buffer.from(token);
  const right = Buffer.from(config.uploadServiceToken);
  return left.length === right.length && nodeTimingSafeEqual(left, right);
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_JSON_BODY_BYTES) {
      throw new Error("request body is too large");
    }
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("request body must be valid JSON");
  }
}

async function fetchWithRedirects(
  sourceUrl: URL,
  config: RuntimeConfig,
  redirectCount = 0,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.downloadTimeoutMs,
  );

  try {
    const response = await fetch(sourceUrl, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; z-image-upload-service/1.0)",
      },
    });

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has("location")
    ) {
      if (redirectCount >= MAX_REDIRECTS) {
        throw new Error("too many redirects");
      }
      const nextUrl = new URL(response.headers.get("location")!, sourceUrl);
      return fetchWithRedirects(
        parseSourceUrl(nextUrl.toString()),
        config,
        redirectCount + 1,
      );
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function putToR2(
  config: RuntimeConfig,
  input: {
    key: string;
    body: ReadableStream<Uint8Array>;
    contentType: string;
    contentLength: number;
  },
) {
  const client = new AwsClient({
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
    region: "auto",
  });
  const keyPath = input.key.split("/").map(encodeURIComponent).join("/");
  const url = `${config.r2Endpoint}/${config.r2Bucket}/${keyPath}`;
  const request = new Request(url, {
    method: "PUT",
    headers: {
      "content-disposition": "inline",
      "content-length": String(input.contentLength),
      "content-type": input.contentType,
    },
    body: input.body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  const response = await client.fetch(request);
  if (!response.ok) {
    throw new Error(
      `R2 upload failed: ${response.status} ${response.statusText}`,
    );
  }
}

async function transferOne(
  config: RuntimeConfig,
  payload: TransferRequest,
): Promise<TransferResult> {
  let sourceUrl: URL;
  try {
    sourceUrl = parseSourceUrl(payload.url);
  } catch (error) {
    return {
      success: false,
      error: {
        code: "invalid_url",
        message: error instanceof Error ? error.message : "invalid url",
      },
    };
  }

  if (!isMediaType(payload.mediaType)) {
    return {
      success: false,
      sourceUrl: sourceUrl.toString(),
      error: {
        code: "invalid_media_type",
        message: 'mediaType must be "image" or "video"',
      },
    };
  }

  try {
    const response = await fetchWithRedirects(sourceUrl, config);
    if (!response.ok) {
      throw new Error(
        `download failed: ${response.status} ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error("download response has no body");
    }

    const contentType =
      response.headers.get("content-type") ||
      (payload.mediaType === "video" ? "video/mp4" : "image/jpeg");
    assertContentType(contentType, payload.mediaType);

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (!contentLength) {
      throw new Error("source content-length is required");
    }

    const maxBytes = getMaxBytes(config, payload.mediaType);
    if (contentLength > maxBytes) {
      throw new Error(`source file is too large: ${contentLength} bytes`);
    }

    const key = buildObjectKey({
      sourceUrl: sourceUrl.toString(),
      mediaType: payload.mediaType,
      targetPrefix: payload.targetPrefix,
      filename: payload.filename,
      idempotencyKey: payload.idempotencyKey,
      contentType,
    });

    await putToR2(config, {
      key,
      body: response.body,
      contentType,
      contentLength,
    });

    return {
      success: true,
      sourceUrl: sourceUrl.toString(),
      url: `${config.r2PublicDomain}/${key}`,
      key,
      bucket: config.r2Bucket,
      mediaType: payload.mediaType,
      contentType,
      size: contentLength,
    };
  } catch (error) {
    return {
      success: false,
      sourceUrl: sourceUrl.toString(),
      error: {
        code: "transfer_failed",
        message: error instanceof Error ? error.message : "transfer failed",
      },
    };
  }
}

type R2UploadTaskRow = {
  id: string;
  ai_task_id: string | null;
  user_id: string | null;
  source_url: string | null;
  source_urls: string;
  workbench_creation_id: string | null;
  workbench_creation_ids: string | null;
  payload: string | null;
  attempts: number;
  max_attempts: number;
};

type R2UploadPayload = {
  sceneId?: string | null;
  providerName?: string | null;
  providerLabel?: string | null;
  prompt?: string | null;
  generationParams?: Record<string, unknown> | null;
  aspectRatio?: string | null;
};

function parseJsonValue<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildAITaskResultWithR2Urls(
  sourceUrl: string,
  r2Url: string,
  existingResult: unknown,
) {
  const existing =
    existingResult &&
    typeof existingResult === "object" &&
    !Array.isArray(existingResult)
      ? (existingResult as Record<string, unknown>)
      : {};
  const existingOutputs = Array.isArray(existing.outputs)
    ? existing.outputs.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const hasMatchedOutput = existingOutputs.some((url) => url === sourceUrl);
  const outputUrls =
    existingOutputs.length > 0
      ? existingOutputs.map((url) => (url === sourceUrl ? r2Url : url))
      : [r2Url];
  const output =
    typeof existing.output === "string" && existing.output !== sourceUrl
      ? existing.output
      : r2Url;
  const originalOutputs = Array.isArray(existing.originalOutputs)
    ? existing.originalOutputs
    : hasMatchedOutput
      ? existingOutputs
      : [sourceUrl];

  return {
    ...existing,
    output,
    outputs: outputUrls,
    originalOutput:
      typeof existing.originalOutput === "string"
        ? existing.originalOutput
        : sourceUrl,
    originalOutputs,
  };
}

function createDb(config: RuntimeConfig) {
  if (!config.databaseUrl) {
    return null;
  }
  return postgres(config.databaseUrl, {
    max: 2,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false,
  });
}

async function claimR2UploadTasks(
  sql: postgres.Sql,
  config: RuntimeConfig,
  workerId: string,
) {
  return sql<R2UploadTaskRow[]>`
    UPDATE r2_upload_task
    SET status = 'processing',
        locked_at = now(),
        locked_by = ${workerId},
        updated_at = now()
    WHERE id IN (
      SELECT id
      FROM r2_upload_task
      WHERE status IN ('pending', 'failed')
        AND next_run_at <= now()
        AND attempts < max_attempts
      ORDER BY next_run_at ASC, created_at ASC
      LIMIT ${config.uploadWorkerBatchSize}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, ai_task_id, user_id, source_url, source_urls, workbench_creation_id, workbench_creation_ids, payload, attempts, max_attempts
  `;
}

async function markUploadTaskSuccess(
  sql: postgres.Sql,
  taskId: string,
  resultUrl: string,
) {
  await sql`
    UPDATE r2_upload_task
    SET status = 'success',
        result_url = ${resultUrl},
        result_urls = ${JSON.stringify([resultUrl])},
        last_error = NULL,
        locked_at = NULL,
        completed_at = now(),
        updated_at = now()
    WHERE id = ${taskId}
  `;
}

async function markUploadTaskFailed(
  sql: postgres.Sql,
  row: R2UploadTaskRow,
  error: unknown,
) {
  const attempts = row.attempts + 1;
  const finalFailed = attempts >= row.max_attempts;
  const message = error instanceof Error ? error.message : String(error);
  const retryDelayMs = Math.min(30 * 60_000, 2 ** attempts * 60_000);

  await sql`
    UPDATE r2_upload_task
    SET status = ${finalFailed ? "failed" : "pending"},
        attempts = ${attempts},
        last_error = ${message},
        locked_at = NULL,
        next_run_at = ${new Date(Date.now() + retryDelayMs)},
        updated_at = now()
    WHERE id = ${row.id}
  `;
}

async function updateAITaskResult(
  sql: postgres.Sql,
  row: R2UploadTaskRow,
  sourceUrl: string,
  r2Url: string,
) {
  if (!row.ai_task_id) {
    console.warn("[r2-upload-worker] skip ai_task update: missing ai_task_id", {
      r2UploadTaskId: row.id,
    });
    return;
  }

  const [task] = await sql<{ task_result: string | null }[]>`
    SELECT task_result
    FROM ai_task
    WHERE id = ${row.ai_task_id}
    LIMIT 1
  `;
  if (!task) {
    console.warn("[r2-upload-worker] skip ai_task update: task not found", {
      r2UploadTaskId: row.id,
      aiTaskId: row.ai_task_id,
    });
    return;
  }

  const existingResult = parseJsonValue<Record<string, unknown>>(
    task?.task_result,
    {},
  );
  const nextResult = buildAITaskResultWithR2Urls(
    sourceUrl,
    r2Url,
    existingResult,
  );

  const [updated] = await sql<{ id: string }[]>`
    UPDATE ai_task
    SET task_result = ${JSON.stringify(nextResult)},
        updated_at = now()
    WHERE id = ${row.ai_task_id}
    RETURNING id
  `;

  console.log("[r2-upload-worker] ai_task updated", {
    r2UploadTaskId: row.id,
    aiTaskId: updated?.id || row.ai_task_id,
    sourceUrl,
    r2Url,
  });
}

async function updateWorkbenchCreationUrl(
  sql: postgres.Sql,
  row: R2UploadTaskRow,
  sourceUrl: string,
  uploaded: TransferSuccess,
) {
  const legacyWorkbenchCreationIds = parseJsonValue<(string | null)[]>(
    row.workbench_creation_ids,
    [],
  );
  const creationId = row.workbench_creation_id || legacyWorkbenchCreationIds[0];

  if (!creationId) {
    console.warn(
      "[r2-upload-worker] skip workbench_creation update: missing id",
      {
        r2UploadTaskId: row.id,
        aiTaskId: row.ai_task_id,
        sourceUrl,
      },
    );
    return;
  }

  const [creation] = await sql<{ id: string; params: string | null }[]>`
    SELECT id, params
    FROM workbench_creation
    WHERE id = ${creationId}
    LIMIT 1
  `;

  if (!creation) {
    console.warn("[r2-upload-worker] workbench_creation not found by id", {
      r2UploadTaskId: row.id,
      aiTaskId: row.ai_task_id,
      workbenchCreationId: creationId,
      sourceUrl,
    });
    return;
  }

  const params = parseJsonValue<Record<string, unknown>>(creation.params, {});

  await sql`
    UPDATE workbench_creation
    SET url = ${uploaded.url},
        mime_type = ${uploaded.contentType},
        file_size = ${uploaded.size || null},
        params = ${JSON.stringify({
          ...params,
          originalUrl:
            typeof params.originalUrl === "string"
              ? params.originalUrl
              : sourceUrl,
          sourceUrl,
          storageProvider: "r2",
          storageKey: uploaded.key,
        })},
        updated_at = now()
    WHERE id = ${creation.id}
  `;

  console.log("[r2-upload-worker] workbench_creation updated", {
    r2UploadTaskId: row.id,
    aiTaskId: row.ai_task_id,
    workbenchCreationId: creation.id,
    sourceUrl,
    r2Url: uploaded.url,
  });
}

async function processR2UploadTask(
  sql: postgres.Sql,
  config: RuntimeConfig,
  row: R2UploadTaskRow,
) {
  const legacySourceUrls = parseJsonValue<string[]>(row.source_urls, []).filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );
  const sourceUrl = row.source_url || legacySourceUrls[0];
  if (!sourceUrl) {
    throw new Error("r2 upload task source_url is empty");
  }
  const payload = parseJsonValue<R2UploadPayload>(row.payload, {});
  const mediaType = inferMediaTypeFromUrl(sourceUrl);
  const result: TransferResult = sourceUrl.startsWith(
    `${config.r2PublicDomain}/`,
  )
    ? {
        success: true,
        sourceUrl,
        url: sourceUrl,
        key: sourceUrl.slice(config.r2PublicDomain.length + 1),
        bucket: config.r2Bucket,
        mediaType,
        contentType: mediaType === "video" ? "video/mp4" : "image/jpeg",
        size: 0,
      }
    : await transferOne(config, {
        url: sourceUrl,
        mediaType,
        targetPrefix: buildStoragePrefix(mediaType),
        filename: buildFilename(mediaType, 0, row.id),
        idempotencyKey: `${row.id}:${sourceUrl}`,
      });

  if (!result.success) {
    throw new Error(result.error.message);
  }

  await updateAITaskResult(sql, row, sourceUrl, result.url);
  await updateWorkbenchCreationUrl(sql, row, sourceUrl, result);
  await markUploadTaskSuccess(sql, row.id, result.url);

  console.log("[r2-upload-worker] task completed", {
    r2UploadTaskId: row.id,
    aiTaskId: row.ai_task_id,
    sourceUrl,
    r2Url: result.url,
  });
}

async function processR2UploadBatch(
  sql: postgres.Sql,
  config: RuntimeConfig,
  workerId: string,
) {
  const rows = await claimR2UploadTasks(sql, config, workerId);
  await Promise.all(
    rows.map(async (row) => {
      try {
        await processR2UploadTask(sql, config, row);
      } catch (error) {
        console.error("[r2-upload-worker] task failed", {
          r2UploadTaskId: row.id,
          aiTaskId: row.ai_task_id,
          error,
        });
        await markUploadTaskFailed(sql, row, error);
      }
    }),
  );
}

function startR2UploadWorker(config: RuntimeConfig) {
  if (!config.uploadWorkerEnabled) {
    console.log("[r2-upload-worker] disabled");
    return;
  }

  const sql = createDb(config);
  if (!sql) {
    console.log("[r2-upload-worker] disabled: DATABASE_URL is not configured");
    return;
  }

  const workerId = `upload-service-${crypto.randomUUID()}`;
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await processR2UploadBatch(sql, config, workerId);
    } catch (error) {
      console.error("[r2-upload-worker] batch failed", { error });
    } finally {
      running = false;
    }
  };

  void tick();
  setInterval(() => {
    void tick();
  }, config.uploadWorkerIntervalMs);

  console.log("[r2-upload-worker] started", {
    workerId,
    intervalMs: config.uploadWorkerIntervalMs,
    batchSize: config.uploadWorkerBatchSize,
  });
}

async function handleTransfer(
  req: IncomingMessage,
  res: ServerResponse,
  config: RuntimeConfig,
) {
  if (!isAuthorized(req, config)) {
    return err(res, "unauthorized", "Unauthorized", 401);
  }

  const payload = (await readJson(req)) as TransferRequest;
  const result = await transferOne(config, payload);
  return result.success
    ? ok(res, result)
    : writeJson(res, 400, {
        code: -1,
        message: result.error.message,
        data: result,
      });
}

async function handleBatchTransfer(
  req: IncomingMessage,
  res: ServerResponse,
  config: RuntimeConfig,
) {
  if (!isAuthorized(req, config)) {
    return err(res, "unauthorized", "Unauthorized", 401);
  }

  const payload = (await readJson(req)) as { items?: unknown };
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) {
    return err(res, "invalid_request", "items is required");
  }
  if (items.length > MAX_BATCH_SIZE) {
    return err(
      res,
      "too_many_items",
      `batch size must be <= ${MAX_BATCH_SIZE}`,
    );
  }

  const results = await Promise.all(
    items.map((item) => transferOne(config, item as TransferRequest)),
  );
  return ok(res, { results });
}

const config = loadConfig();
const server = createServer(async (req, res) => {
  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`,
  );

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return ok(res, { status: "ok" });
    }

    if (req.method === "POST" && url.pathname === "/v1/transfer") {
      return handleTransfer(req, res, config);
    }

    if (req.method === "POST" && url.pathname === "/v1/transfer/batch") {
      return handleBatchTransfer(req, res, config);
    }

    return err(res, "not_found", "Not found", 404);
  } catch (error) {
    console.error("[upload-service] request failed", {
      path: url.pathname,
      error,
    });
    return err(
      res,
      "internal_error",
      error instanceof Error ? error.message : "Internal error",
      500,
    );
  }
});

server.listen(config.port, "0.0.0.0", () => {
  console.log(`[upload-service] listening on 0.0.0.0:${config.port}`);
  startR2UploadWorker(config);
});
