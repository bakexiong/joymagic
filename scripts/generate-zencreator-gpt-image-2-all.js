const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const BASE_URL = "https://10b.ai";
const GENERATE_PATH = "/api/ai/gpt-image-2-text-to-image/generate";
const STATUS_PATH = "/api/ai/status";
const STATUS_SCENARIO = "gpt-image-2-text-to-image";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;

const INPUT_PATH = path.resolve(
  process.cwd(),
  "zencreator_video_template_refs.json",
);
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "zencreator_video_template_refs.generated.json",
);
const OUTPUT_DIR = path.resolve(
  process.cwd(),
  "tmp/tenb-generated/zencreator-gpt-image-2",
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    "User-Agent": "Mozilla/5.0 (compatible; z-image.ai gpt-image-2 batch)",
  };
}

function sanitizePromptText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\b(sexy|seductive|provocative|naughty|teasing)\b/gi, "alluring")
    .trim();
}

function buildPrimaryPrompt(item) {
  const title = item.templateNameSynonym || item.sourceTemplateName || "Template";
  const baseRefPrompt = sanitizePromptText(item.refPrompt || "");

  return [
    baseRefPrompt,
    `Template title: ${title}.`,
    "Style direction: confident flirtatious adult charisma, subtly sexy but tasteful, non-explicit, elegant fitted fashion or refined lounge styling.",
    "Keep the same scene category, framing intent, camera feel, and overall scenario as the template.",
    "Do not copy the source person's identity, exact outfit, or exact background details.",
    "Favor polished attractiveness, soft glam beauty styling, tasteful pose, believable anatomy, clean hands, coherent vertical composition, and platform-safe results.",
  ].join(" ");
}

function buildSafeRetryPrompt(item) {
  const title = item.templateNameSynonym || item.sourceTemplateName || "Template";
  const baseRefPrompt = sanitizePromptText(item.refPrompt || "");

  return [
    baseRefPrompt,
    `Template title: ${title}.`,
    "Style direction: stylish adult portrait, charming and attractive, tasteful fashion-forward mood, non-explicit, fully platform-safe.",
    "Keep the same scene category, framing intent, and overall scenario as the template.",
    "Use elegant wardrobe, flattering pose, soft glam styling, realistic anatomy, clean hands, coherent vertical composition.",
  ].join(" ");
}

async function saveOutput(records) {
  await fsp.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(records, null, 2)}\n`,
    "utf8",
  );
}

async function submitTask(cookieHeader, prompt) {
  const response = await fetch(`${BASE_URL}${GENERATE_PATH}`, {
    method: "POST",
    headers: buildHeaders(cookieHeader),
    body: JSON.stringify({
      mediaType: "image",
      prompt,
      enable_base64_output: false,
      enable_sync_mode: false,
      output_format: "png",
      aspect_ratio: "9:16",
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
}

async function pollTask(cookieHeader, taskId) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(
      `${BASE_URL}${STATUS_PATH}?taskId=${encodeURIComponent(taskId)}&scenario=${encodeURIComponent(STATUS_SCENARIO)}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (compatible; z-image.ai gpt-image-2 batch)",
        },
      },
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

async function downloadImage(url, destinationPath) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; z-image.ai gpt-image-2 batch)",
    },
  });

  if (!response.ok) {
    throw new Error(`download failed: HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await fsp.writeFile(destinationPath, bytes);
}

async function generateWithRetry(cookieHeader, item) {
  const attempts = [
    {
      label: "primary",
      prompt: buildPrimaryPrompt(item),
    },
    {
      label: "safe-retry",
      prompt: buildSafeRetryPrompt(item),
    },
  ];

  const errors = [];

  for (const attempt of attempts) {
    try {
      const taskId = await submitTask(cookieHeader, attempt.prompt);
      const remoteUrl = await pollTask(cookieHeader, taskId);
      return {
        status: "success",
        finalPrompt: attempt.prompt,
        attemptLabel: attempt.label,
        taskId,
        remoteUrl,
      };
    } catch (error) {
      errors.push({
        attempt: attempt.label,
        message: error.message,
        code: error.code || null,
      });

      if (
        attempt.label === "primary" &&
        String(error.code || "").toUpperCase() === "NSFW_BLOCKED"
      ) {
        continue;
      }

      if (attempt.label === "safe-retry") {
        break;
      }

      if (String(error.code || "").toUpperCase() !== "NSFW_BLOCKED") {
        break;
      }
    }
  }

  return {
    status: "failed",
    errors,
  };
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
        generationIndex: index + 1,
        generationStatus: "pending",
        generatedImageUrl: null,
        generatedImageLocalPath: null,
        generationTaskId: null,
        generationAttemptLabel: null,
        generationPrompt: null,
        generationError: null,
      }));

  await saveOutput(records);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let index = 0; index < records.length; index += 1) {
    const item = records[index];
    const label = `[${index + 1}/${records.length}] ${item.sourceTemplateName}`;

    if (item.generationStatus === "success" && item.generatedImageLocalPath) {
      skipped += 1;
      console.log(`${label} skip existing success`);
      continue;
    }

    console.log(`${label} generating...`);
    const result = await generateWithRetry(cookieHeader, item);

    if (result.status === "success") {
      const slug = slugify(item.templateNameSynonym || item.sourceTemplateName);
      const outPath = path.join(
        OUTPUT_DIR,
        `${String(index + 1).padStart(3, "0")}-${slug}.png`,
      );

      await downloadImage(result.remoteUrl, outPath);

      item.generationStatus = "success";
      item.generatedImageUrl = result.remoteUrl;
      item.generatedImageLocalPath = outPath;
      item.generationTaskId = result.taskId;
      item.generationAttemptLabel = result.attemptLabel;
      item.generationPrompt = result.finalPrompt;
      item.generationError = null;
      success += 1;
      console.log(`${label} success via ${result.attemptLabel}`);
    } else {
      item.generationStatus = "failed";
      item.generatedImageUrl = null;
      item.generatedImageLocalPath = null;
      item.generationTaskId = null;
      item.generationAttemptLabel = null;
      item.generationPrompt = null;
      item.generationError = result.errors;
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
