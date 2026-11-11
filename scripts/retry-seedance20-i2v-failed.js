const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const BASE_URL = "https://10b.ai";
const GENERATE_PATH = "/api/ai/image-to-video-seedance-2-0/generate";
const STATUS_PATH = "/api/ai/status";
const STATUS_SCENARIO = "image-to-video-seedance-2-0";
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 360;
const REQUEST_TIMEOUT_MS = 90000;

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "zencreator_video_template_refs.generated.deduped-80.seedance20-i2v.json",
);
const OUTPUT_DIR = path.resolve(
  process.cwd(),
  "tmp/tenb-generated/seedance20-image-to-video-batch",
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function headers(cookieHeader, json = false) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Cookie: cookieHeader,
    "User-Agent": "Mozilla/5.0 (compatible; z-image.ai retry)",
  };
}

function buildRetryPrompt(item) {
  const original = String(item.seedance20NaturalPrompt || item.videoPromptSynonym || "").trim();
  const reason = String(item.seedance20I2VError?.message || "");

  if (reason.includes("NSFW_BLOCKED")) {
    return original
      .replace(/\bkiss(?:es|ing)?\b/gi, "smile")
      .replace(/\bflirty\b/gi, "warm")
      .replace(/\bseductive\b/gi, "confident")
      .replace(/\bnaughty\b/gi, "playful")
      .replace(/\btease\b/gi, "gesture")
      .replace(/\berotic\b/gi, "elegant")
      .replace(/\bsexy\b/gi, "stylish")
      .replace(/\bbed\b/gi, "bedroom")
      .replace(/\bbreasts?\b/gi, "upper body")
      .replace(/\bhips?\b/gi, "movement")
      .replace(/\btwerking?\b/gi, "dancing")
      .replace(/\bintimate\b/gi, "soft")
      .replace(/\s+/g, " ")
      .trim()
      .concat(" Fully clothed, tasteful, non-explicit, gentle everyday motion.");
  }

  if (original) {
    return original;
  }

  return "Realistic vertical lifestyle clip with gentle natural motion, calm expression, subtle breathing and blinking, tasteful fully clothed styling, and clean believable movement.";
}

async function submitTask(cookieHeader, firstFrame, prompt) {
  const response = await fetchWithTimeout(`${BASE_URL}${GENERATE_PATH}`, {
    method: "POST",
    headers: headers(cookieHeader, true),
    body: JSON.stringify({
      mediaType: "video",
      model: "doubao-seedance-2.0",
      prompt,
      resolution: "720p",
      duration: 5,
      image_urls: [firstFrame],
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.code !== 0) {
    const error = new Error(result.message || `submit failed: HTTP ${response.status}`);
    error.code = result.errorCode || result.code || response.status;
    throw error;
  }

  return result?.data?.requestId || result?.data?.taskId;
}

async function pollTask(cookieHeader, taskId) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);
    const response = await fetchWithTimeout(
      `${BASE_URL}${STATUS_PATH}?taskId=${encodeURIComponent(taskId)}&scenario=${encodeURIComponent(STATUS_SCENARIO)}`,
      { headers: headers(cookieHeader) },
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.code !== 0) {
      const error = new Error(result.message || `status failed: HTTP ${response.status}`);
      error.code = result.errorCode || result.code || response.status;
      throw error;
    }

    const data = result.data || {};
    const status = String(data.status || "").toLowerCase();
    if (status === "completed" || status === "success") {
      return data.output || (Array.isArray(data.outputs) ? data.outputs[0] : null);
    }
    if (status === "failed" || status === "error") {
      const error = new Error(data.error || data.message || "task failed");
      error.code = data.errorCode || "TASK_FAILED";
      throw error;
    }
  }

  throw new Error("task timeout");
}

async function downloadVideo(url, filePath) {
  const response = await fetchWithTimeout(url, { headers: headers("") });
  if (!response.ok) {
    throw new Error(`download failed: HTTP ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await fsp.writeFile(filePath, bytes);
}

async function save(records) {
  await fsp.writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

async function main() {
  const cookieHeader = process.env.TENB_COOKIE || "";
  if (!cookieHeader) {
    throw new Error("Missing TENB_COOKIE");
  }

  const records = JSON.parse(await fsp.readFile(OUTPUT_PATH, "utf8"));
  const targets = records
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (item.seedance20I2VStatus !== "failed") {
        return false;
      }
      const message = String(item.seedance20I2VError?.message || "");
      return !message.includes("402");
    });

  console.log(`retry targets: ${targets.length}`);

  for (const { item, index } of targets) {
    const label = `[${index + 1}/${records.length}] ${item.sourceTemplateName}`;
    const prompt = buildRetryPrompt(item);
    item.seedance20RetryPrompt = prompt;
    console.log(`${label} retrying...`);

    try {
      const taskId = await submitTask(cookieHeader, item.generatedImageOssUrl, prompt);
      const remoteUrl = await pollTask(cookieHeader, taskId);
      const filePath = path.join(
        OUTPUT_DIR,
        `${String(index + 1).padStart(3, "0")}-${String(item.templateNameSynonym || item.sourceTemplateName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 80)}.mp4`,
      );
      await downloadVideo(remoteUrl, filePath);
      item.seedance20I2VStatus = "success";
      item.seedance20I2VTaskId = taskId;
      item.seedance20I2VVideoUrl = remoteUrl;
      item.seedance20I2VLocalPath = filePath;
      item.seedance20I2VError = null;
      console.log(`${label} retry success`);
    } catch (error) {
      item.seedance20I2VError = {
        message: error.message,
        code: error.code || null,
      };
      console.log(`${label} retry failed`);
    }

    await save(records);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
