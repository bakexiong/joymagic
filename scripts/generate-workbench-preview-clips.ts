import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

type SampleRecord = {
  prompt?: string;
  params?: Record<string, unknown>;
  previewClipUrl?: string;
  previewUrl?: string;
  generatedUrl?: string;
  generatedUrls?: string[];
};

type SampleMap = Record<string, SampleRecord[]>;

type OSSConfig = {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint?: string;
  publicDomain: string;
};

type ClipJob = {
  modelUrl: string;
  index: number;
  sourceUrl: string;
  durationMs: number;
  fps: number;
  videoBitrate: number;
  sourceWidth: number;
  sourceHeight: number;
  outputKey: string;
  outputUrl: string;
  outputCheckUrl: string;
};

type VideoMetadata = {
  durationMs: number;
  fps: number;
  bitrate: number;
  width: number;
  height: number;
};

const AGGREGATE_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples.json",
);
const SHARD_DIR = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples",
);
const DEFAULT_DURATION_MS = 3000;
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

function parseFrameRate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value.trim();
  if (!normalized) {
    return 0;
  }

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
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_FPS;
  }

  return Math.max(12, Math.min(MAX_FPS, Math.round(value)));
}

function normalizeBitrate(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_VIDEO_BITRATE;
  }

  return Math.max(
    MIN_VIDEO_BITRATE,
    Math.min(MAX_VIDEO_BITRATE, Math.round(value)),
  );
}

function normalizeDimension(value: unknown) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.round(parsed);
}

function resolveScaledSize(options: {
  sourceWidth: number;
  sourceHeight: number;
  targetHeight: number;
}) {
  const { sourceWidth, sourceHeight, targetHeight } = options;
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetHeight <= 0) {
    return null;
  }

  if (sourceHeight <= targetHeight) {
    return {
      width: sourceWidth,
      height: sourceHeight,
    };
  }

  const scale = targetHeight / sourceHeight;
  const scaledWidth = Math.max(2, Math.round((sourceWidth * scale) / 2) * 2);
  const scaledHeight = Math.max(2, Math.round(targetHeight / 2) * 2);

  return {
    width: scaledWidth,
    height: scaledHeight,
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
      headers: {
        Date: date,
        Authorization: authorization,
      },
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

function outputKeyForSource(sourceUrl: string, options: {
  durationMs: number;
  fps: number;
  videoBitrate: number;
}) {
  const { durationMs, fps, videoBitrate } = options;
  const hash = createHash("md5")
    .update(`${sourceUrl}|${durationMs}|${fps}|${videoBitrate}`)
    .digest("hex");
  return `workbench-template-samples/previews/${hash}.mp4`;
}

function pickVideoSource(record: SampleRecord) {
  const preview = typeof record.previewUrl === "string" ? record.previewUrl : "";
  const generated =
    typeof record.generatedUrl === "string" ? record.generatedUrl : "";
  const firstGenerated = Array.isArray(record.generatedUrls)
    ? record.generatedUrls.find((item) => typeof item === "string" && item)
    : undefined;

  const candidate = preview || generated || firstGenerated || "";
  return candidate.endsWith(".mp4") ? candidate : "";
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
  } =
    options;
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

  try {
    const parsed = JSON.parse(rawText) as {
      TaskId?: string;
      RequestId?: string;
    };
    return {
      taskId: parsed.TaskId || "",
      requestId: parsed.RequestId || "",
      rawText,
    };
  } catch {
    const taskIdMatch = rawText.match(/"TaskId"\s*:\s*"([^"]+)"/i);
    return {
      taskId: taskIdMatch?.[1] || "",
      requestId: "",
      rawText,
    };
  }
}

async function objectExists(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForOutput(url: string, timeoutMs: number, intervalMs: number) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await objectExists(url)) {
      return true;
    }
    await sleep(intervalMs);
  }
  return false;
}

async function loadSampleMap() {
  return JSON.parse(await fs.readFile(AGGREGATE_PATH, "utf8")) as SampleMap;
}

async function persistSampleMap(sampleMap: SampleMap) {
  await fs.writeFile(
    AGGREGATE_PATH,
    `${JSON.stringify(sampleMap, null, 2)}\n`,
    "utf8",
  );

  await fs.mkdir(SHARD_DIR, { recursive: true });
  await Promise.all(
    Object.entries(sampleMap).map(async ([modelUrl, items]) => {
      const fileName =
        modelUrl
          .replace(/^\/+/, "")
          .replace(/\/+/g, "__")
          .replace(/[^a-zA-Z0-9_-]/g, "_") + ".json";
      const shardPath = path.join(SHARD_DIR, fileName);
      await fs.writeFile(
        shardPath,
        `${JSON.stringify(items, null, 2)}\n`,
        "utf8",
      );
    }),
  );
}

async function main() {
  const config = await loadOSSConfig();
  const sampleMap = await loadSampleMap();
  const configuredDurationMs = Number(
    getArgValue("duration-ms") || DEFAULT_DURATION_MS,
  );
  const fps = Number(getArgValue("fps") || DEFAULT_FPS);
  const videoBitrate = Number(
    getArgValue("video-bitrate") || DEFAULT_VIDEO_BITRATE,
  );
  const pollIntervalMs = Number(
    getArgValue("poll-interval-ms") || DEFAULT_POLL_INTERVAL_MS,
  );
  const pollTimeoutMs = Number(
    getArgValue("poll-timeout-ms") || DEFAULT_POLL_TIMEOUT_MS,
  );
  const maxDurationMs = Number(getArgValue("max-duration-ms") || "0");
  const targetSizeKb = Number(getArgValue("target-size-kb") || "0");
  const targetHeight = Number(getArgValue("target-height") || "360");
  const limit = Number(getArgValue("limit") || "0");
  const dryRun = hasFlag("dry-run");
  const force = hasFlag("force");
  const matchSourceDuration = hasFlag("match-source-duration");

  const jobs: ClipJob[] = [];
  const metadataCache = new Map<string, VideoMetadata>();
  const shouldStopCollecting = () => limit > 0 && jobs.length >= limit;

  for (const [modelUrl, records] of Object.entries(sampleMap)) {
    for (const [index, record] of records.entries()) {
      if (shouldStopCollecting()) break;
      const sourceUrl = pickVideoSource(record);
      if (!sourceUrl) continue;
      if (!force && record.previewClipUrl) continue;
      const sourceKey = sourceKeyFromUrl(sourceUrl, config);
      if (!sourceKey) continue;

      let durationMs = configuredDurationMs;
      let jobFps = fps;
      let jobVideoBitrate = videoBitrate;
      let sourceWidth = 0;
      let sourceHeight = 0;
      if (matchSourceDuration) {
        const cachedMetadata = metadataCache.get(sourceKey);
        if (cachedMetadata) {
          durationMs = cachedMetadata.durationMs;
          jobFps = cachedMetadata.fps;
          jobVideoBitrate = cachedMetadata.bitrate;
          sourceWidth = cachedMetadata.width;
          sourceHeight = cachedMetadata.height;
        } else {
          const metadata = await getVideoMetadata(config, sourceKey);
          durationMs = metadata.durationMs;
          jobFps = metadata.fps;
          jobVideoBitrate = metadata.bitrate;
          sourceWidth = metadata.width;
          sourceHeight = metadata.height;
          metadataCache.set(sourceKey, metadata);
        }
      }

      if (maxDurationMs > 0) {
        durationMs = Math.min(durationMs, maxDurationMs);
      }

      if (targetSizeKb > 0) {
        const sizeBudgetBitrate = bitrateForTargetSize(durationMs, targetSizeKb);
        if (sizeBudgetBitrate > 0) {
          jobVideoBitrate = normalizeBitrate(
            Math.min(jobVideoBitrate, sizeBudgetBitrate),
          );
        }
      }

      const outputKey = outputKeyForSource(sourceUrl, {
        durationMs,
        fps: jobFps,
        videoBitrate: jobVideoBitrate,
      });
      jobs.push({
        modelUrl,
        index,
        sourceUrl,
        durationMs,
        fps: jobFps,
        videoBitrate: jobVideoBitrate,
        sourceWidth,
        sourceHeight,
        outputKey,
        outputUrl: publicUrlFor(config, outputKey),
        outputCheckUrl: endpointUrlFor(config, outputKey),
      });
    }
    if (shouldStopCollecting()) break;
  }

  const selectedJobs = jobs;

  console.log(
    JSON.stringify(
      {
        dryRun,
        force,
        totalCandidates: jobs.length,
        selectedJobs: selectedJobs.length,
        durationMs: configuredDurationMs,
        matchSourceDuration,
        maxDurationMs,
        targetSizeKb,
        targetHeight,
        fps,
        videoBitrate,
      },
      null,
      2,
    ),
  );

  if (dryRun || selectedJobs.length === 0) {
    return;
  }

  const results = new Map<string, string>();
  const failures: Array<{ sourceUrl: string; reason: string }> = [];

  for (const job of selectedJobs) {
    try {
      const exists = await objectExists(job.outputUrl);
      const existsOnOrigin = exists || (await objectExists(job.outputCheckUrl));
      if (!existsOnOrigin) {
        const sourceKey = sourceKeyFromUrl(job.sourceUrl, config);
        if (!sourceKey) {
          throw new Error("Cannot resolve OSS object key from source URL");
        }

        const submitted = await submitClipTask({
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
        console.log(
          `[submit] ${job.sourceUrl} -> ${job.outputUrl} taskId=${submitted.taskId || "n/a"}`,
        );
      } else {
        console.log(`[reuse] ${job.outputUrl}`);
      }

      const ready = await waitForOutput(
        job.outputCheckUrl,
        pollTimeoutMs,
        pollIntervalMs,
      );

      if (!ready) {
        throw new Error("Timed out waiting for preview clip output");
      }

      results.set(`${job.modelUrl}#${job.index}`, job.outputUrl);
      console.log(`[ready] ${job.outputUrl}`);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : String(error || "Unknown error");
      failures.push({ sourceUrl: job.sourceUrl, reason });
      console.error(`[failed] ${job.sourceUrl}: ${reason}`);
    }
  }

  if (results.size > 0) {
    for (const [modelUrl, records] of Object.entries(sampleMap)) {
      records.forEach((record, index) => {
        const key = `${modelUrl}#${index}`;
        const previewClipUrl = results.get(key);
        if (previewClipUrl) {
          record.previewClipUrl = previewClipUrl;
        }
      });
    }

    await persistSampleMap(sampleMap);
  }

  console.log(
    JSON.stringify(
      {
        completed: results.size,
        failed: failures.length,
      },
      null,
      2,
    ),
  );

  if (failures.length > 0) {
    const failuresPath = path.resolve(
      process.cwd(),
      "tmp/workbench-preview-clip-failures.json",
    );
    await fs.mkdir(path.dirname(failuresPath), { recursive: true });
    await fs.writeFile(
      failuresPath,
      `${JSON.stringify(failures, null, 2)}\n`,
      "utf8",
    );
    console.log(`Failures written to ${failuresPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
