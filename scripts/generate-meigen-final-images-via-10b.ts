import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import dotenv from "dotenv";

import { createOSSProvider } from "../src/extensions/storage/oss";

dotenv.config({ path: ".env.oss" });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.development", override: false });
dotenv.config({ path: ".env", override: false });

const INPUT_PATH = path.resolve(
  process.cwd(),
  "meigen_kept_prompts_merged_prompt_clean.json",
);
const DEFAULT_BASE_URL = "https://10b.ai";
const GENERATE_PATH = "/api/ai/gpt-image-2-image-to-image/generate";
const STATUS_PATH = "/api/ai/status";
const STATUS_SCENARIO = "gpt-image-2-image-to-image";
const POLL_INTERVAL_MS = 3000;
const OUTPUT_PREFIX = "codex/meigen/final-images";
const REQUEST_TIMEOUT_MS = 30000;

type MeigenRecord = {
  id: number;
  prompt: string;
  generatedImageUrl?: string | null;
  generatedImageStatus?: string | null;
  finalImageUrl?: string | null;
  finalImageStatus?: "pending" | "uploaded" | "failed" | null;
  finalRequestId?: string | null;
  finalImageSourceUrl?: string | null;
  finalImageError?: string | null;
};

type SubmitResponse = {
  code?: number | string;
  message?: string;
  data?: {
    requestId?: string;
    taskId?: string;
    output?: string;
    outputs?: string[];
    status?: string;
    error?: string;
    message?: string;
  };
};

const ossConfig = {
  region: process.env.OSS_REGION || "",
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
  bucket: process.env.OSS_BUCKET || "",
  endpoint: process.env.OSS_ENDPOINT || "",
  publicDomain: process.env.OSS_PUBLIC_DOMAIN || "https://ocdn.10b.ai",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function parseIdSet(rawValue?: string) {
  if (!rawValue) {
    return null;
  }

  const ids = rawValue
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);

  return ids.length ? new Set(ids) : null;
}

function buildHeaders(cookieHeader: string) {
  return {
    "Content-Type": "application/json",
    Cookie: cookieHeader,
    "User-Agent": "Mozilla/5.0 (compatible; z-image.ai meigen final batch)",
  };
}

function buildOSSKey(record: MeigenRecord) {
  const hash = createHash("md5")
    .update(`${record.id}\n${record.generatedImageUrl}\n${record.prompt}`)
    .digest("hex");
  return `${OUTPUT_PREFIX}/${String(record.id).padStart(3, "0")}-${hash}.png`;
}

function shouldKeepRecord(record: MeigenRecord) {
  return Boolean(
    record.generatedImageUrl &&
      String(record.generatedImageStatus || "").toLowerCase() !== "pending",
  );
}

async function saveOutput(records: MeigenRecord[]) {
  await fs.writeFile(INPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

async function submitTask(
  baseUrl: string,
  cookieHeader: string,
  record: MeigenRecord,
) {
  const response = await fetch(`${baseUrl}${GENERATE_PATH}`, {
    method: "POST",
    headers: buildHeaders(cookieHeader),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      mediaType: "image",
      images: [record.generatedImageUrl],
      prompt: record.prompt,
      aspect_ratio: "9:16",
      enable_base64_output: false,
      enable_sync_mode: false,
      output_format: "png",
    }),
  });

  const result = (await response.json().catch(() => ({}))) as SubmitResponse;
  if (!response.ok) {
    throw new Error(result.message || `提交任务失败: HTTP ${response.status}`);
  }

  if (String(result.code) !== "0" || !result.data) {
    throw new Error(result.message || "提交任务失败: 返回结构异常");
  }

  const requestId = result.data.requestId || result.data.taskId;
  if (!requestId) {
    throw new Error("提交任务失败: 未返回 requestId");
  }

  return requestId;
}

async function pollResult(
  baseUrl: string,
  cookieHeader: string,
  requestId: string,
  maxPollAttempts: number,
) {
  for (let attempt = 1; attempt <= maxPollAttempts; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(
      `${baseUrl}${STATUS_PATH}?taskId=${encodeURIComponent(requestId)}&scenario=${encodeURIComponent(STATUS_SCENARIO)}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (compatible; z-image.ai meigen final batch)",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    const result = (await response.json().catch(() => ({}))) as SubmitResponse;
    if (!response.ok) {
      throw new Error(result.message || `查询结果失败: HTTP ${response.status}`);
    }

    if (String(result.code) !== "0" || !result.data) {
      throw new Error(result.message || "查询结果失败: 返回结构异常");
    }

    const data = result.data;
    const status = String(data.status || "").toLowerCase();

    if (typeof data.output === "string" && data.output) {
      return data.output;
    }

    if (Array.isArray(data.outputs) && typeof data.outputs[0] === "string") {
      return data.outputs[0];
    }

    if (status === "failed" || status === "error") {
      throw new Error(data.error || data.message || "任务失败");
    }
  }

  throw new Error("任务超时");
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; z-image.ai meigen final download)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const source = JSON.parse(await fs.readFile(INPUT_PATH, "utf8")) as MeigenRecord[];
  const records = source.filter(shouldKeepRecord);
  await saveOutput(records);

  const cookieHeader =
    process.env.TENB_COOKIE ||
    process.env.REQUEST_COOKIE_HEADER ||
    process.env.COOKIE ||
    "";
  if (!cookieHeader) {
    throw new Error(
      "缺少 TENB_COOKIE/REQUEST_COOKIE_HEADER/COOKIE，无法调用 https://10b.ai 的 gpt-image-2 image-to-image 接口。",
    );
  }

  if (
    !ossConfig.region ||
    !ossConfig.accessKeyId ||
    !ossConfig.accessKeySecret ||
    !ossConfig.bucket
  ) {
    throw new Error("缺少 OSS 配置。");
  }

  const baseUrl = (
    getArgValue("base-url") ||
    process.env.TENB_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const start = Number(getArgValue("start") || "1");
  const end = Number(getArgValue("end") || "999999");
  const force = process.argv.includes("--force");
  const maxPollAttempts = Number(getArgValue("max-poll-attempts") || "20");
  const targetIds = parseIdSet(getArgValue("ids"));

  const ossProvider = createOSSProvider(ossConfig);

  for (const record of records) {
    if (targetIds && !targetIds.has(record.id)) {
      continue;
    }

    if (record.id < start || record.id > end) {
      continue;
    }

    if (record.finalImageUrl && record.finalImageStatus === "uploaded" && !force) {
      console.log(`[${record.id}] 跳过，已生成最终图片`);
      continue;
    }

    try {
      console.log(`[${record.id}] 提交最终图生成`);
      record.finalImageStatus = "pending";
      record.finalImageError = null;
      await saveOutput(records);

      const requestId = await submitTask(baseUrl, cookieHeader, record);
      record.finalRequestId = requestId;
      await saveOutput(records);

      const finalSourceUrl = await pollResult(
        baseUrl,
        cookieHeader,
        requestId,
        maxPollAttempts,
      );
      const finalBuffer = await downloadImage(finalSourceUrl);
      const uploadResult = await ossProvider.uploadFile({
        body: finalBuffer,
        key: buildOSSKey(record),
        contentType: "image/png",
        disposition: "inline",
      });

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || "OSS 上传失败");
      }

      record.finalImageSourceUrl = finalSourceUrl;
      record.finalImageUrl = uploadResult.url;
      record.finalImageStatus = "uploaded";
      record.finalImageError = null;
      await saveOutput(records);
      console.log(`[${record.id}] 完成 ${uploadResult.url}`);
    } catch (error) {
      record.finalImageStatus = "failed";
      record.finalImageError =
        error instanceof Error ? error.message : String(error);
      await saveOutput(records);
      console.error(`[${record.id}] 失败 ${record.finalImageError}`);
    }
  }

  const summary = {
    input: INPUT_PATH,
    kept: records.length,
    uploaded: records.filter((item) => item.finalImageStatus === "uploaded").length,
    failed: records.filter((item) => item.finalImageStatus === "failed").length,
    pending: records.filter((item) => !item.finalImageStatus).length,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
