import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

type OSSConfig = {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint?: string;
  publicDomain: string;
};

type VideoMetadata = {
  durationMs: number;
  fps: number;
  bitrate: number;
  width: number;
  height: number;
};

type SlideClipTarget = {
  id: string;
  sourceUrl: string;
};

const TARGETS: SlideClipTarget[] = [
  {
    id: "seedance-2-0-launch",
    sourceUrl: "https://ocdn.10b.ai/banner/image_1775232342615_987423.mp4",
  },
  {
    id: "gpt-image-1",
    sourceUrl: "https://ocdn.10b.ai/icon/gpt-image-1.mp4",
  },
  {
    id: "gpt-image-2",
    sourceUrl:
      "https://ocdn.10b.ai/icon/9998223208966580-5f402cd7-725c-4949-85ae-954e52699e78-video_task_01KPRFV7KQAXVJM506T945WZRY.mp4",
  },
  {
    id: "nanobanana-2",
    sourceUrl: "http://ocdn.10b.ai/icon/nano-banana-2.mp4",
  },
  {
    id: "midjourney",
    sourceUrl: "https://ocdn.10b.ai/icon/midjounery1.mp4",
  },
  {
    id: "seedream-5-0-lite",
    sourceUrl: "https://ocdn.10b.ai/icon/seedream-5-0-lite.mp4",
  },
  {
    id: "soul",
    sourceUrl: "https://ocdn.10b.ai/icon/soul1.mp4",
  },
  {
    id: "qwen-image-202512",
    sourceUrl: "https://ocdn.10b.ai/icon/qwen-image-202512.mp4",
  },
];

const DEFAULT_FPS = 24;
const MAX_FPS = 30;
const DEFAULT_VIDEO_BITRATE = 800000;
const MIN_VIDEO_BITRATE = 500000;
const MAX_VIDEO_BITRATE = 2000000;
const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_POLL_TIMEOUT_MS = 8 * 60 * 1000;

function parseDotEnv(content: string) {
  const result: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line
      .slice(eqIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    result[key] = value;
  }

  return result;
}

async function loadOSSConfig(): Promise<OSSConfig> {
  const envFilePath = path.resolve(process.cwd(), ".env.oss");
  let fileEnv: Record<string, string> = {};

  try {
    fileEnv = parseDotEnv(await fs.readFile(envFilePath, "utf8"));
  } catch {
    fileEnv = {};
  }

  const read = (key: string) => process.env[key] || fileEnv[key] || "";

  const config: OSSConfig = {
    region: read("OSS_REGION"),
    accessKeyId: read("OSS_ACCESS_KEY_ID"),
    accessKeySecret: read("OSS_ACCESS_KEY_SECRET"),
    bucket: read("OSS_BUCKET"),
    endpoint: read("OSS_ENDPOINT") || undefined,
    publicDomain: read("OSS_PUBLIC_DOMAIN") || "https://ocdn.10b.ai",
  };

  if (
    !config.region ||
    !config.accessKeyId ||
    !config.accessKeySecret ||
    !config.bucket
  ) {
    throw new Error(
      "Missing OSS config. Please set OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET and OSS_BUCKET.",
    );
  }

  return config;
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toBase64(value: string) {
  return Buffer.from(value).toString("base64");
}

async function signOSSRequest(options: {
  accessKeyId: string;
  accessKeySecret: string;
  method: string;
  contentType: string;
  date: string;
  canonicalizedResource: string;
}) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(options.accessKeySecret);
  const messageData = encoder.encode(
    `${options.method}\n\n${options.contentType}\n${options.date}\n${options.canonicalizedResource}`,
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureBase64 = Buffer.from(signature).toString("base64");

  return `OSS ${options.accessKeyId}:${signatureBase64}`;
}

function endpointFor(config: OSSConfig) {
  return (
    config.endpoint || `https://${config.bucket}.${config.region}.aliyuncs.com`
  ).replace(/\/$/, "");
}

function publicUrlFor(config: OSSConfig, key: string) {
  return `${config.publicDomain.replace(/\/$/, "")}/${key}`;
}

function endpointUrlFor(config: OSSConfig, key: string) {
  return `${endpointFor(config)}/${key}`;
}

function sourceKeyFromUrl(url: string, config: OSSConfig) {
  try {
    const parsed = new URL(url);
    const endpointHost = new URL(endpointFor(config)).hostname;
    const publicHost = new URL(config.publicDomain).hostname;
    const bucketHost = `${config.bucket}.${config.region}.aliyuncs.com`;

    if (![endpointHost, publicHost, bucketHost].includes(parsed.hostname)) {
      return null;
    }

    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

function parseFrameRate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value !== "string") return 0;
  const normalized = value.trim();
  if (!normalized) return 0;

  if (normalized.includes("/")) {
    const [numerator, denominator] = normalized.split("/");
    const num = Number(numerator);
    const den = Number(denominator);
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
      return num / den;
    }
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeFps(value: number) {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_FPS;
  return Math.max(12, Math.min(MAX_FPS, Math.round(value)));
}

function normalizeBitrate(value: number) {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_VIDEO_BITRATE;
  return Math.max(
    MIN_VIDEO_BITRATE,
    Math.min(MAX_VIDEO_BITRATE, Math.round(value)),
  );
}

function normalizeDimension(value: unknown) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed);
}

function resolveScaledSize(options: {
  sourceWidth: number;
  sourceHeight: number;
  targetHeight: number;
}) {
  const { sourceWidth, sourceHeight, targetHeight } = options;
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetHeight <= 0) return null;
  if (sourceHeight <= targetHeight) {
    return { width: sourceWidth, height: sourceHeight };
  }
  const scale = targetHeight / sourceHeight;
  return {
    width: Math.max(2, Math.round((sourceWidth * scale) / 2) * 2),
    height: Math.max(2, Math.round(targetHeight / 2) * 2),
  };
}

function bitrateForTargetSize(durationMs: number, targetSizeKb: number) {
  if (
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    !Number.isFinite(targetSizeKb) ||
    targetSizeKb <= 0
  ) {
    return 0;
  }

  const durationSeconds = durationMs / 1000;
  const totalBitsBudget = targetSizeKb * 1024 * 8;
  return Math.max(1, Math.floor((totalBitsBudget * 0.95) / durationSeconds));
}

async function getVideoMetadata(config: OSSConfig, sourceKey: string) {
  const endpoint = endpointFor(config);
  const date = new Date().toUTCString();
  const contentType = "";
  const canonicalizedResource = `/${config.bucket}/${sourceKey}?x-oss-process=video/info`;
  const authorization = await signOSSRequest({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    method: "GET",
    contentType,
    date,
    canonicalizedResource,
  });

  const response = await fetch(
    `${endpoint}/${sourceKey}?x-oss-process=video/info`,
    {
      method: "GET",
      headers: { Date: date, Authorization: authorization },
    },
  );

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(
      `OSS video info failed for ${sourceKey}: ${response.status} ${response.statusText} ${rawText}`,
    );
  }

  const parsed = JSON.parse(rawText) as {
    Duration?: number | string;
    VideoWidth?: number | string;
    VideoHeight?: number | string;
    Bitrate?: number | string;
    VideoStreams?: Array<{
      AverageFrameRate?: string | number;
      FrameRate?: string | number;
      Bitrate?: number | string;
      Width?: number | string;
      Height?: number | string;
    }>;
  };

  const durationSeconds = Number(parsed.Duration || 0);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error(`Invalid video duration for ${sourceKey}: ${rawText}`);
  }

  const primaryVideoStream = Array.isArray(parsed.VideoStreams)
    ? parsed.VideoStreams[0]
    : undefined;
  const rawFps =
    parseFrameRate(primaryVideoStream?.AverageFrameRate) ||
    parseFrameRate(primaryVideoStream?.FrameRate);
  const rawBitrate =
    Number(primaryVideoStream?.Bitrate || 0) || Number(parsed.Bitrate || 0);
  const width =
    normalizeDimension(primaryVideoStream?.Width) ||
    normalizeDimension(parsed.VideoWidth);
  const height =
    normalizeDimension(primaryVideoStream?.Height) ||
    normalizeDimension(parsed.VideoHeight);

  return {
    durationMs: Math.max(1, Math.round(durationSeconds * 1000)),
    fps: normalizeFps(rawFps),
    bitrate: normalizeBitrate(rawBitrate > 0 ? rawBitrate * 0.45 : 0),
    width,
    height,
  } satisfies VideoMetadata;
}

function outputKeyForSource(
  sourceUrl: string,
  options: {
    durationMs: number;
    fps: number;
    videoBitrate: number;
    targetHeight: number;
  },
) {
  const { durationMs, fps, videoBitrate, targetHeight } = options;
  const hash = createHash("md5")
    .update(`${sourceUrl}|${durationMs}|${fps}|${videoBitrate}|${targetHeight}`)
    .digest("hex");
  return `homepage/previews/${hash}.mp4`;
}

async function submitClipTask(options: {
  config: OSSConfig;
  sourceKey: string;
  outputKey: string;
  durationMs: number;
  fps: number;
  videoBitrate: number;
  targetHeight: number;
  sourceWidth: number;
  sourceHeight: number;
}) {
  const {
    config,
    sourceKey,
    outputKey,
    durationMs,
    fps,
    videoBitrate,
    targetHeight,
    sourceWidth,
    sourceHeight,
  } = options;

  const endpoint = endpointFor(config);
  const date = new Date().toUTCString();
  const contentType = "application/x-www-form-urlencoded";
  const canonicalizedResource = `/${config.bucket}/${sourceKey}?x-oss-async-process`;
  const authorization = await signOSSRequest({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    method: "POST",
    contentType,
    date,
    canonicalizedResource,
  });

  const scaledSize = resolveScaledSize({
    sourceWidth,
    sourceHeight,
    targetHeight,
  });
  const style = [
    "video/convert",
    "ss_0",
    `t_${durationMs}`,
    "f_mp4",
    "vcodec_h264",
    ...(scaledSize ? [`s_${scaledSize.width}x${scaledSize.height}`] : []),
    `fps_${fps}`,
    `vb_${videoBitrate}`,
    "pixfmt_yuv420p",
    "an_1",
  ].join(",");

  const processInstruction = `x-oss-async-process=${style}|sys/saveas,o_${toBase64(outputKey)},b_${toBase64(config.bucket)}`;
  const response = await fetch(`${endpoint}/${sourceKey}?x-oss-async-process`, {
    method: "POST",
    headers: {
      Date: date,
      Authorization: authorization,
      "Content-Type": contentType,
      "Content-Length": String(Buffer.byteLength(processInstruction)),
    },
    body: processInstruction,
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(
      `OSS async process failed for ${sourceKey}: ${response.status} ${response.statusText} ${rawText}`,
    );
  }
}

async function objectExists(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForOutput(
  url: string,
  timeoutMs: number,
  intervalMs: number,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await objectExists(url)) return true;
    await sleep(intervalMs);
  }
  return false;
}

async function main() {
  const config = await loadOSSConfig();
  const maxDurationMs = Number(getArgValue("max-duration-ms") || "5000");
  const targetSizeKb = Number(getArgValue("target-size-kb") || "700");
  const targetHeight = Number(getArgValue("target-height") || "360");
  const pollIntervalMs = Number(
    getArgValue("poll-interval-ms") || DEFAULT_POLL_INTERVAL_MS,
  );
  const pollTimeoutMs = Number(
    getArgValue("poll-timeout-ms") || DEFAULT_POLL_TIMEOUT_MS,
  );
  const dryRun = hasFlag("dry-run");
  const force = hasFlag("force");

  const metadataCache = new Map<string, VideoMetadata>();
  const results: Array<{
    id: string;
    sourceUrl: string;
    previewUrl: string;
  }> = [];

  console.log(
    JSON.stringify(
      {
        dryRun,
        force,
        targets: TARGETS.length,
        maxDurationMs,
        targetSizeKb,
        targetHeight,
      },
      null,
      2,
    ),
  );

  for (const target of TARGETS) {
    const sourceKey = sourceKeyFromUrl(target.sourceUrl, config);
    if (!sourceKey) {
      throw new Error(`Cannot resolve OSS object key from ${target.sourceUrl}`);
    }

    let metadata = metadataCache.get(sourceKey);
    if (!metadata) {
      metadata = await getVideoMetadata(config, sourceKey);
      metadataCache.set(sourceKey, metadata);
    }

    const durationMs =
      maxDurationMs > 0
        ? Math.min(metadata.durationMs, maxDurationMs)
        : metadata.durationMs;
    const sizeBudgetBitrate = bitrateForTargetSize(durationMs, targetSizeKb);
    const videoBitrate =
      sizeBudgetBitrate > 0
        ? normalizeBitrate(Math.min(metadata.bitrate, sizeBudgetBitrate))
        : metadata.bitrate;
    const outputKey = outputKeyForSource(target.sourceUrl, {
      durationMs,
      fps: metadata.fps,
      videoBitrate,
      targetHeight,
    });
    const outputUrl = publicUrlFor(config, outputKey);
    const outputCheckUrl = endpointUrlFor(config, outputKey);

    console.log(`[scan] ${target.id}`);

    if (!dryRun) {
      const exists =
        (await objectExists(outputUrl)) || (await objectExists(outputCheckUrl));
      if (!exists || force) {
        await submitClipTask({
          config,
          sourceKey,
          outputKey,
          durationMs,
          fps: metadata.fps,
          videoBitrate,
          targetHeight,
          sourceWidth: metadata.width,
          sourceHeight: metadata.height,
        });
        console.log(`[submit] ${target.id} -> ${outputUrl}`);
      } else {
        console.log(`[reuse] ${target.id} -> ${outputUrl}`);
      }

      const ready = await waitForOutput(
        outputCheckUrl,
        pollTimeoutMs,
        pollIntervalMs,
      );
      if (!ready) {
        throw new Error(`Timed out waiting for ${target.id}`);
      }
      console.log(`[ready] ${target.id}`);
    }

    results.push({
      id: target.id,
      sourceUrl: target.sourceUrl,
      previewUrl: outputUrl,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
