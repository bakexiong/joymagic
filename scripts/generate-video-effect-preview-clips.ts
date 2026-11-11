import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

type VideoEffectExample = {
  inputImageUrl?: string;
  outputVideoUrl?: string;
  outputPreviewClipUrl?: string;
};

type VideoEffectRecord = {
  sampleVideoUrl?: string;
  samplePreviewClipUrl?: string;
  examples?: VideoEffectExample[];
};

type VideoEffectSampleMap = Record<string, VideoEffectRecord>;

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

type ClipJob = {
  key: string;
  sourceUrl: string;
  durationMs: number;
  fps: number;
  videoBitrate: number;
  sourceWidth: number;
  sourceHeight: number;
  outputKey: string;
  outputUrl: string;
  outputCheckUrl: string;
  apply: (previewClipUrl: string) => void;
};

const SAMPLE_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/video-effect-samples.json",
);
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
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
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

function outputKeyForSource(sourceUrl: string, options: {
  durationMs: number;
  fps: number;
  videoBitrate: number;
  targetHeight: number;
}) {
  const { durationMs, fps, videoBitrate, targetHeight } = options;
  const hash = createHash("md5")
    .update(`${sourceUrl}|${durationMs}|${fps}|${videoBitrate}|${targetHeight}`)
    .digest("hex");
  return `video-effects/previews/${hash}.mp4`;
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
  const response = await fetch(
    `${endpoint}/${sourceKey}?x-oss-async-process`,
    {
      method: "POST",
      headers: {
        Date: date,
        Authorization: authorization,
        "Content-Type": contentType,
        "Content-Length": String(Buffer.byteLength(processInstruction)),
      },
      body: processInstruction,
    },
  );

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

async function waitForOutput(url: string, timeoutMs: number, intervalMs: number) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await objectExists(url)) return true;
    await sleep(intervalMs);
  }
  return false;
}

async function loadSampleMap() {
  return JSON.parse(await fs.readFile(SAMPLE_PATH, "utf8")) as VideoEffectSampleMap;
}

async function persistSampleMap(sampleMap: VideoEffectSampleMap) {
  await fs.writeFile(SAMPLE_PATH, `${JSON.stringify(sampleMap, null, 2)}\n`, "utf8");
}

async function main() {
  const config = await loadOSSConfig();
  const sampleMap = await loadSampleMap();
  const maxDurationMs = Number(getArgValue("max-duration-ms") || "5000");
  const targetSizeKb = Number(getArgValue("target-size-kb") || "700");
  const targetHeight = Number(getArgValue("target-height") || "360");
  const pollIntervalMs = Number(
    getArgValue("poll-interval-ms") || DEFAULT_POLL_INTERVAL_MS,
  );
  const pollTimeoutMs = Number(
    getArgValue("poll-timeout-ms") || DEFAULT_POLL_TIMEOUT_MS,
  );
  const limit = Number(getArgValue("limit") || "0");
  const dryRun = hasFlag("dry-run");
  const force = hasFlag("force");

  const metadataCache = new Map<string, VideoMetadata>();
  let discovered = 0;
  let completed = 0;
  const failures: Array<{ key: string; sourceUrl: string; reason: string }> = [];

  const processJob = async (job: ClipJob) => {
    try {
      const exists =
        (await objectExists(job.outputUrl)) ||
        (await objectExists(job.outputCheckUrl));
      if (!exists) {
        const sourceKey = sourceKeyFromUrl(job.sourceUrl, config);
        if (!sourceKey) {
          throw new Error("Cannot resolve OSS object key from source URL");
        }
        await submitClipTask({
          config,
          sourceKey,
          outputKey: job.outputKey,
          durationMs: job.durationMs,
          fps: job.fps,
          videoBitrate: job.videoBitrate,
          targetHeight,
          sourceWidth: job.sourceWidth,
          sourceHeight: job.sourceHeight,
        });
        console.log(`[submit] ${job.key} -> ${job.outputUrl}`);
      } else {
        console.log(`[reuse] ${job.key} -> ${job.outputUrl}`);
      }

      const ready = await waitForOutput(
        job.outputCheckUrl,
        pollTimeoutMs,
        pollIntervalMs,
      );
      if (!ready) {
        throw new Error("Timed out waiting for preview clip output");
      }

      job.apply(job.outputUrl);
      await persistSampleMap(sampleMap);
      completed += 1;
      console.log(
        `[ready] ${job.key} (${completed}${discovered > 0 ? ` / ${discovered}` : ""})`,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : String(error || "Unknown error");
      failures.push({ key: job.key, sourceUrl: job.sourceUrl, reason });
      console.error(`[failed] ${job.key}: ${reason}`);
    }
  };

  const maybeProcessJob = async (options: {
    key: string;
    sourceUrl?: string;
    existingPreviewUrl?: string;
    apply: (previewClipUrl: string) => void;
  }) => {
    const { key, sourceUrl, existingPreviewUrl, apply } = options;
    if (!sourceUrl || !sourceUrl.endsWith(".mp4")) return;
    if (!force && existingPreviewUrl) return;
    if (limit > 0 && discovered >= limit) return;
    const sourceKey = sourceKeyFromUrl(sourceUrl, config);
    if (!sourceKey) return;

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
    const outputKey = outputKeyForSource(sourceUrl, {
      durationMs,
      fps: metadata.fps,
      videoBitrate,
      targetHeight,
    });

    discovered += 1;
    console.log(`[scan] ${key} (${discovered})`);

    if (dryRun) {
      return;
    }

    await processJob({
      key,
      sourceUrl,
      durationMs,
      fps: metadata.fps,
      videoBitrate,
      sourceWidth: metadata.width,
      sourceHeight: metadata.height,
      outputKey,
      outputUrl: publicUrlFor(config, outputKey),
      outputCheckUrl: endpointUrlFor(config, outputKey),
      apply,
    });
  };

  console.log(
    JSON.stringify(
      {
        dryRun,
        force,
        maxDurationMs,
        targetSizeKb,
        targetHeight,
        limit,
      },
      null,
      2,
    ),
  );

  for (const [slug, record] of Object.entries(sampleMap)) {
    await maybeProcessJob({
      key: `${slug}::sample`,
      sourceUrl: record.sampleVideoUrl,
      existingPreviewUrl: record.samplePreviewClipUrl,
      apply: (previewClipUrl) => {
        record.samplePreviewClipUrl = previewClipUrl;
      },
    });

    for (const [index, example] of (record.examples || []).entries()) {
      await maybeProcessJob({
        key: `${slug}::example::${index}`,
        sourceUrl: example.outputVideoUrl,
        existingPreviewUrl: example.outputPreviewClipUrl,
        apply: (previewClipUrl) => {
          example.outputPreviewClipUrl = previewClipUrl;
        },
      });

      if (limit > 0 && discovered >= limit) {
        break;
      }
    }

    if (limit > 0 && discovered >= limit) {
      break;
    }
  }

  await persistSampleMap(sampleMap);
  console.log(
    JSON.stringify(
      { discovered, completed, failed: failures.length, dryRun },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
