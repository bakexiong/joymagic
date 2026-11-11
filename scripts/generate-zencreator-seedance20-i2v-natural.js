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
const MAX_SUBMIT_RETRIES = 3;
const MAX_DOWNLOAD_RETRIES = 3;

const INPUT_PATH = path.resolve(
  process.cwd(),
  "zencreator_video_template_refs.generated.deduped-80.video-prompts.json",
);
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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildHeaders(cookieHeader) {
  return {
    "Content-Type": "application/json",
    Cookie: cookieHeader,
    "User-Agent": "Mozilla/5.0 (compatible; z-image.ai seedance20 batch)",
  };
}

function toNaturalPrompt(item) {
  const text = String(item.videoPromptSynonym || item.sourcePrompt || "").trim();
  if (!text) {
    return "Realistic vertical lifestyle video with gentle natural motion, subtle breathing and blinking, clean lighting, and calm believable movement.";
  }

  return text
    .replace(/Use\s+@Image1[^.]*\.\s*/gi, "")
    .replace(/Static start[^.]*\.\s*/gi, "")
    .replace(/0%\s*motion at frame 0[^.]*\.\s*/gi, "")
    .replace(/consistent identity[^.]*\.\s*/gi, "")
    .replace(/high consistency[^.]*\.\s*/gi, "")
    .replace(/Preserve the same[^.]*\.\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function saveOutput(records) {
  await fsp.writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

async function submitTask(cookieHeader, firstFrame, prompt) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_SUBMIT_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}${GENERATE_PATH}`, {
        method: "POST",
        headers: buildHeaders(cookieHeader),
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
        const error = new Error(
          result.message || `submit failed: HTTP ${response.status}`,
        );
        error.code = result.errorCode || result.code || response.status;
        error.payload = result;
        throw error;
      }

      return result?.data?.requestId || result?.data?.taskId;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_SUBMIT_RETRIES) {
        await sleep(2000 * attempt);
      }
    }
  }

  throw lastError || new Error("submit failed");
}

async function pollTask(cookieHeader, taskId) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetchWithTimeout(
      `${BASE_URL}${STATUS_PATH}?taskId=${encodeURIComponent(taskId)}&scenario=${encodeURIComponent(STATUS_SCENARIO)}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (compatible; z-image.ai seedance20 batch)",
        },
      },
      REQUEST_TIMEOUT_MS,
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.code !== 0) {
      const error = new Error(
        result.message || `status failed: HTTP ${response.status}`,
      );
      error.code = result.errorCode || result.code || response.status;
      error.payload = result;
      throw error;
    }

    const data = result.data || {};
    const status = String(data.status || "").toLowerCase();
    if (status === "completed" || status === "success") {
      if (typeof data.output === "string" && data.output) {
        return data.output;
      }
      if (Array.isArray(data.outputs) && typeof data.outputs[0] === "string") {
        return data.outputs[0];
      }
      throw new Error("task completed but no output returned");
    }

    if (status === "failed" || status === "error") {
      const error = new Error(data.error || data.message || "task failed");
      error.code = data.errorCode || "TASK_FAILED";
      error.payload = result;
      throw error;
    }
  }

  throw new Error("task timeout");
}

async function downloadVideo(url, destinationPath) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_DOWNLOAD_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; z-image.ai seedance20 batch)",
          },
        },
        REQUEST_TIMEOUT_MS,
      );

      if (!response.ok) {
        throw new Error(`download failed: HTTP ${response.status}`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      await fsp.writeFile(destinationPath, bytes);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_DOWNLOAD_RETRIES) {
        await sleep(2000 * attempt);
      }
    }
  }

  throw lastError || new Error("download failed");
}

async function main() {
  const cookieHeader =
    process.env.TENB_COOKIE ||
    process.env.REQUEST_COOKIE_HEADER ||
    process.env.COOKIE ||
    "";

  if (!cookieHeader) {
    throw new Error("Missing TENB_COOKIE / REQUEST_COOKIE_HEADER / COOKIE");
  }

  await fsp.mkdir(OUTPUT_DIR, { recursive: true });

  const source = JSON.parse(await fsp.readFile(INPUT_PATH, "utf8"));
  const existing = fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(await fsp.readFile(OUTPUT_PATH, "utf8"))
    : null;

  const records = Array.isArray(existing)
    ? existing
    : source.map((item, index) => ({
        ...item,
        seedance20NaturalPrompt: toNaturalPrompt(item),
        seedance20I2VStatus: "pending",
        seedance20I2VTaskId: null,
        seedance20I2VVideoUrl: null,
        seedance20I2VLocalPath: null,
        seedance20I2VError: null,
      }));

  await saveOutput(records);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let index = 0; index < records.length; index += 1) {
    const item = records[index];
    const label = `[${index + 1}/${records.length}] ${item.sourceTemplateName}`;

    if (item.seedance20I2VStatus === "success" && item.seedance20I2VLocalPath) {
      skipped += 1;
      console.log(`${label} skip existing success`);
      continue;
    }

    if (!item.generatedImageOssUrl) {
      item.seedance20I2VStatus = "failed";
      item.seedance20I2VError = "missing generatedImageOssUrl";
      failed += 1;
      await saveOutput(records);
      console.log(`${label} failed: missing generatedImageOssUrl`);
      continue;
    }

    item.seedance20NaturalPrompt = toNaturalPrompt(item);
    console.log(`${label} generating...`);

    try {
      const taskId = await submitTask(
        cookieHeader,
        item.generatedImageOssUrl,
        item.seedance20NaturalPrompt,
      );
      const remoteUrl = await pollTask(cookieHeader, taskId);

      const slug = slugify(item.templateNameSynonym || item.sourceTemplateName);
      const outPath = path.join(
        OUTPUT_DIR,
        `${String(index + 1).padStart(3, "0")}-${slug}.mp4`,
      );

      await downloadVideo(remoteUrl, outPath);

      item.seedance20I2VStatus = "success";
      item.seedance20I2VTaskId = taskId;
      item.seedance20I2VVideoUrl = remoteUrl;
      item.seedance20I2VLocalPath = outPath;
      item.seedance20I2VError = null;
      success += 1;
      console.log(`${label} success`);
    } catch (error) {
      item.seedance20I2VStatus = "failed";
      item.seedance20I2VTaskId = null;
      item.seedance20I2VVideoUrl = null;
      item.seedance20I2VLocalPath = null;
      item.seedance20I2VError = {
        message: error.message,
        code: error.code || null,
      };
      failed += 1;
      console.log(`${label} failed`);
    }

    await saveOutput(records);
  }

  console.log(
    JSON.stringify(
      {
        total: records.length,
        success,
        failed,
        skipped,
        outputPath: OUTPUT_PATH,
        outputDir: OUTPUT_DIR,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
