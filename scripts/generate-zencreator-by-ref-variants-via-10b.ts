import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import dotenv from "dotenv";

import { createOSSProvider } from "../src/extensions/storage/oss";

dotenv.config({ path: ".env.oss" });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.development", override: false });
dotenv.config({ path: ".env", override: false });

const PAGE_URL = "https://app.zencreator.pro/tools/generator-by-ref";
const API_BASE =
  "https://api.zencreator.pro/api/v1/tools/templates?tool_name=by_ref&page_size=12&public=true&sort_by=new_first_popularity&website_only=false";
const RAW_OUTPUT_PATH = path.resolve(
  process.cwd(),
  "docs/zencreator-generator-by-ref.templates.simple.json",
);
const VARIANT_OUTPUT_PATH = path.resolve(
  process.cwd(),
  "docs/zencreator-generator-by-ref.templates.variants.json",
);
const FALLBACK_TEMPLATE_PATH = path.resolve(
  process.cwd(),
  "docs/zencreator-tools-templates.flat.json",
);

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const GENERATE_PATH = "/api/ai/gpt-image-2-image-to-image/generate";
const STATUS_PATH = "/api/ai/status";
const STATUS_SCENARIO = "gpt-image-2-image-to-image";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;
const OUTPUT_PREFIX = "zencreator/generator-by-ref";
const MAX_FETCH_RETRIES = 3;

const namePhraseMap = [
  ["general", "core"],
  ["blue", "azure"],
  ["black", "midnight"],
  ["sparkling", "glittering"],
  ["rainbow", "prismatic"],
  ["dress", "gown"],
  ["bodycon", "curve-fit"],
  ["wearing", "styled in"],
  ["keep pose off", "free pose remix"],
  ["girl", "muse"],
  ["woman", "editorial muse"],
  ["blonde", "golden-haired"],
  ["portrait", "editorial portrait"],
];

const actionVariants = [
  "turning the torso sideways with one shoulder closer to camera",
  "walking mid-step with visible motion in the body posture",
  "leaning against a surface with one arm raised",
  "sitting with legs repositioned and a relaxed asymmetrical posture",
  "looking back over the shoulder with a twisted upper body pose",
  "raising both hands into the frame with a more expressive gesture",
  "bending slightly forward toward the lens for a more dynamic angle",
  "stretching one arm outward while shifting the body weight to one side",
];

const expressionVariants = [
  "a wide playful smile",
  "a calm serious editorial expression",
  "a soft flirtatious half-smile",
  "an intense confident stare",
  "a surprised bright expression",
  "a relaxed dreamy gaze",
  "a mischievous grin",
  "a bold self-assured expression",
];

const faceIdentityVariants = [
  "heart-shaped face, almond eyes, narrow nose bridge, medium lips",
  "oval face, wide-set eyes, shorter nose, fuller lips",
  "long face, hooded eyes, defined cheekbones, thinner lips",
  "round face, larger eyes, softer jawline, plush lips",
  "square jawline, deep-set eyes, straight nose, balanced lips",
  "diamond face shape, cat-eye gaze, refined nose tip, defined cupid bow",
  "broader cheekbones, smaller eyes, stronger nose profile, natural lips",
  "soft youthful face, rounded eyes, petite nose, glossy full lips",
];

const hairVariants = [
  "sleek straight long hair",
  "messy textured bun",
  "short blunt bob",
  "high ponytail",
  "loose voluminous waves",
  "shoulder-length layered cut",
  "wet-look slicked-back styling",
  "side-parted polished curls",
];

const cameraVariants = [
  "a low-angle perspective",
  "a close three-quarter portrait crop",
  "a wider full-body framing",
  "a candid over-the-shoulder framing",
  "a slightly top-down editorial angle",
  "a centered eye-level fashion shot",
  "a tighter mid-shot with stronger facial emphasis",
  "a diagonal composition with visible body movement",
];

type TemplateApiItem = {
  id: string;
  name?: string | null;
  input?: {
    positive_prompt?: string | null;
    ref_asset?: string | null;
    face_asset?: string | null;
    keep_pose?: boolean | null;
    swap_background?: boolean | null;
  } | null;
};

type SimpleTemplateRecord = {
  TemplateName: string;
  prompt: string;
};

type VariantTemplateRecord = SimpleTemplateRecord & {
  templateId: string;
  OriginalTemplateName?: string;
  originalRefImageUrl?: string;
  originalFaceImageUrl?: string;
  generatedRefPrompt?: string;
  generatedFacePrompt?: string;
  finalPrompt?: string;
  generatedRefRequestId?: string;
  generatedFaceRequestId?: string;
  finalRequestId?: string;
  generatedRefImageUrl?: string;
  generatedFaceImageUrl?: string;
  resultImageUrl?: string;
  status?: "success" | "failed";
  error?: string;
};

type SourceTemplateRecord = {
  id: string;
  name: string;
  originalName?: string;
  prompt: string;
  originalRefImageUrl?: string;
  originalFaceImageUrl?: string;
};

type TemplateFile<T> = {
  source: string;
  api: string;
  collected_at?: string;
  generated_at?: string;
  generated_by?: string;
  total_templates: number;
  templates: T[];
};

type SubmitResponse = {
  code?: number;
  message?: string;
  data?: {
    requestId?: string;
    taskId?: string;
    status?: string;
    output?: string;
    outputs?: string[];
    error?: string;
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

async function withRetries<T>(
  label: string,
  runner: () => Promise<T>,
  retries = MAX_FETCH_RETRIES,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await runner();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(1200 * attempt);
      }
    }
  }

  throw lastError instanceof Error
    ? new Error(`${label}: ${lastError.message}`)
    : new Error(`${label}: unknown error`);
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function titleCase(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function replaceAllCaseInsensitive(input: string, from: string, to: string) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return input.replace(new RegExp(escaped, "gi"), (match) => {
    if (match === match.toUpperCase()) {
      return to.toUpperCase();
    }
    if (match[0] === match[0].toUpperCase()) {
      return to.charAt(0).toUpperCase() + to.slice(1);
    }
    return to;
  });
}

function rewriteTemplateName(name: string) {
  let output = name;
  for (const [from, to] of namePhraseMap) {
    output = replaceAllCaseInsensitive(output, from, to);
  }

  output = output.replace(/\s+/g, " ").trim();
  output = titleCase(output);

  if (!output) {
    return "Untitled Reference Variant";
  }

  if (/ reimagined$/i.test(output)) {
    return output;
  }

  if (output.toLowerCase() === name.toLowerCase()) {
    return `${output} Reimagined`;
  }

  return output;
}

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizeSourcePrompt(prompt: string) {
  const normalized = prompt.trim();
  if (!normalized) {
    return "";
  }

  return normalized
    .replace(/\bmake the tits larger\b/gi, "enhance the glamour styling and flattering silhouette")
    .replace(/\bboobs?\b/gi, "figure")
    .replace(/\btits?\b/gi, "figure")
    .replace(/\bbreasts?\b/gi, "silhouette")
    .trim();
}

function stripVariantSuffixes(value: string) {
  return value
    .replace(/\bReimagined\b/gi, " ")
    .replace(/\bEditorial Editorial\b/gi, "Editorial")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTemplateConceptAnchor(
  originalTemplateName: string,
  displayTemplateName: string,
) {
  const original = stripVariantSuffixes(originalTemplateName);
  const display = stripVariantSuffixes(displayTemplateName);

  if (original && display && original.toLowerCase() !== display.toLowerCase()) {
    return `Anchor the visual concept around "${original}" and keep it feeling like a fresh "${display}" variation.`;
  }

  if (original) {
    return `Anchor the visual concept around "${original}".`;
  }

  if (display) {
    return `Anchor the visual concept around "${display}".`;
  }

  return "";
}

function buildTemplateSpecificRules(
  originalTemplateName: string,
  displayTemplateName: string,
  stage: "ref" | "face" | "final",
) {
  const merged = `${originalTemplateName} ${displayTemplateName}`.toLowerCase();

  if (merged.includes("two-tone hair")) {
    return [
      "Make the hairstyle itself the unmistakable hero of the image.",
      "Show a true two-tone hairstyle with two clearly different hair colors physically present in the hair, not just colored lighting on normal hair.",
      "Use a clean, visible split, block-dye, or strongly separated two-color placement that reads instantly as two-tone hair.",
      "Do not rely on pink-and-blue lighting alone to fake the effect.",
      "Frame the image so the hair color separation is obvious at first glance.",
    ].join(" ");
  }

  if (merged.includes("green jacket") && merged.includes("leather pants")) {
    if (stage === "ref" || stage === "face") {
      return [
        "The subject must be clearly and unmistakably female.",
        "Keep the fashion concept centered on a woman wearing a green jacket and leather pants.",
        "Avoid androgynous or masculine presentation.",
        "Use styling, body language, and facial presentation that read immediately as a female fashion editorial subject.",
      ].join(" ");
    }

    return "";
  }

  return "";
}

function buildOSSKey(
  templateId: string,
  templateName: string,
  kind: string,
  versionSeed?: string,
) {
  const slug = sanitizeSlug(templateName || "template");
  const hash = createHash("md5")
    .update(`${templateId}\n${templateName}\n${kind}\n${versionSeed || "stable"}`)
    .digest("hex");
  return `${OUTPUT_PREFIX}/${slug}-${kind}-${hash}.png`;
}

function buildHeaders(cookieHeader: string) {
  return {
    "Content-Type": "application/json",
    Cookie: cookieHeader,
    "User-Agent": "Mozilla/5.0 (compatible; 10b.ai zencreator by-ref batch)",
  };
}

async function fetchPage(page: number) {
  return withRetries(`抓取模板失败: 第 ${page} 页`, async () => {
    const response = await fetch(`${API_BASE}&page=${page}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as {
      data?: TemplateApiItem[];
      total_pages?: number;
    };
  });
}

async function fetchAllTemplates() {
  const firstPage = await fetchPage(1);
  const totalPages = firstPage.total_pages || 1;
  const allRows = [...(firstPage.data || [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const json = await fetchPage(page);
    allRows.push(...(json.data || []));
  }

  return allRows;
}

async function saveJson<T>(outputPath: string, data: TemplateFile<T>) {
  await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function loadFallbackRefMap() {
  const raw = await fs.readFile(FALLBACK_TEMPLATE_PATH, "utf8").catch(() => "");
  if (!raw) {
    return new Map<string, { ref?: string; face?: string }>();
  }

  const rows = JSON.parse(raw) as Array<{
    tool_name?: string;
    template_id?: string;
    ref_assets?: Array<{ field?: string; url?: string }>;
  }>;

  const map = new Map<string, { ref?: string; face?: string }>();

  for (const item of rows) {
    if (item.tool_name !== "by_ref" || !item.template_id) {
      continue;
    }

    const ref = item.ref_assets?.find((asset) => asset.field === "ref_asset")?.url;
    const face = item.ref_assets?.find((asset) => asset.field === "face_asset")?.url;
    map.set(item.template_id, { ref, face });
  }

  return map;
}

function buildRefVariantPrompt(
  originalTemplateName: string,
  templateName: string,
  prompt: string,
  index: number,
) {
  const safePrompt = sanitizeSourcePrompt(prompt);
  const basePrompt = safePrompt
    ? `参考原模板意图：${safePrompt}`
    : "保持原图的服装、氛围、构图和风格方向。";
  const conceptAnchor = buildTemplateConceptAnchor(
    originalTemplateName,
    templateName,
  );
  const conceptRules = buildTemplateSpecificRules(
    originalTemplateName,
    templateName,
    "ref",
  );
  const action = actionVariants[index % actionVariants.length];
  const expression = expressionVariants[index % expressionVariants.length];
  const camera = cameraVariants[index % cameraVariants.length];

  return [
    `Create a fresh reference image for the template "${templateName}".`,
    conceptAnchor,
    conceptRules,
    "The image must clearly read as the named concept at first glance.",
    "Prioritize template-name semantics over generic beauty-photo output.",
    "Keep a very similar visual style, outfit category, lighting mood, and overall composition language.",
    "Make it feel like a clearly different image from the same style family, not a near-duplicate.",
    `Change the pose substantially by showing the subject ${action}.`,
    `Use ${camera} and give the subject ${expression}.`,
    "If the template name implies a specific prop, mood, styling hook, hairstyle cue, wardrobe cue, or scene motif, show it clearly and unambiguously in the image.",
    "Avoid drifting into a generic portrait that could fit many different template names.",
    "Keep the clothing category and general aesthetic direction, but noticeably change body posture, framing, and gesture.",
    "Keep it photorealistic, clean, polished, and suitable as a reference image.",
    basePrompt,
  ].join(" ");
}

function buildFaceVariantPrompt(
  originalTemplateName: string,
  templateName: string,
  index: number,
) {
  const faceIdentity = faceIdentityVariants[index % faceIdentityVariants.length];
  const expression = expressionVariants[(index + 3) % expressionVariants.length];
  const hair = hairVariants[index % hairVariants.length];
  const conceptAnchor = buildTemplateConceptAnchor(
    originalTemplateName,
    templateName,
  );
  const conceptRules = buildTemplateSpecificRules(
    originalTemplateName,
    templateName,
    "face",
  );

  return [
    `Create a new face reference portrait for the template "${templateName}".`,
    "Keep the face image photorealistic and studio-clean.",
    conceptAnchor,
    conceptRules,
    "The face portrait should still feel compatible with the template-name concept and the target style family.",
    "Do not keep the same identity. Make the person clearly different from the original face reference.",
    `Use a distinctly different facial identity with ${faceIdentity}.`,
    `Give the person ${hair} and ${expression}.`,
    "If the template-name concept suggests a recognizable hairstyle, glamour level, or attitude, preserve that compatibility here.",
    "Preserve only the overall beauty level and polish, while changing identity, expression, and facial structure significantly.",
    "Focus on a clean face crop that works well as a face-reference input.",
  ].join(" ");
}

function buildFinalPrompt(
  originalTemplateName: string,
  templateName: string,
  prompt: string,
  index: number,
) {
  const safePrompt = sanitizeSourcePrompt(prompt);
  const expression = expressionVariants[(index + 5) % expressionVariants.length];
  const conceptAnchor = buildTemplateConceptAnchor(
    originalTemplateName,
    templateName,
  );
  const conceptRules = buildTemplateSpecificRules(
    originalTemplateName,
    templateName,
    "final",
  );

  if (safePrompt) {
    return [
      `The final image must clearly and unmistakably fit the template name "${templateName}".`,
      conceptAnchor,
      conceptRules,
      "Prioritize template-name semantics first, then pose adherence, then face replacement.",
      "The final image should look like a viewer could correctly guess the template name from the picture.",
      safePrompt,
      "Use the first reference image as the strict pose and composition reference.",
      "Closely follow the first reference image for pose, body positioning, gesture, framing, camera angle, crop, and scene layout.",
      "Do not invent a new pose. Do not significantly change the body posture, limb placement, or camera framing from the first reference image.",
      "Use the second reference image only for face identity guidance.",
      `Keep the expression and mood polished and natural, with ${expression}.`,
      "If the current pose reference does not support the template-name concept well, the concept should be solved in the regenerated reference image rather than by breaking pose adherence in the final image.",
      "Do not output a generic image that loses the recognizable template-name hook.",
      "The final image should preserve the first reference image's pose structure while replacing the identity with the second reference image's face.",
      "Generate one polished photorealistic final result with natural detail.",
    ].join(" ");
  }

  return [
    `The final image must clearly and unmistakably fit the template name "${templateName}".`,
    conceptAnchor,
    conceptRules,
    "Prioritize template-name semantics first, then pose adherence, then face replacement.",
    "The final image should look like a viewer could correctly guess the template name from the picture.",
    "Use the first reference image as the strict pose and composition reference.",
    "Closely follow the first reference image for pose, body positioning, gesture, framing, camera angle, and overall scene structure.",
    "Do not create a new pose or alter the core posture from the first reference image.",
    "Use the second reference image only for face identity guidance.",
    `Keep the expression polished and natural with ${expression}.`,
    "If the concept and the pose do not align well, the reference image should be regenerated rather than changing the final pose.",
    "Do not output a generic image that loses the recognizable template-name hook.",
    "Keep the same style family while preserving the first reference image's pose and replacing the identity with the second reference image's face.",
    "Generate one polished photorealistic final result with natural detail and a similar editorial style.",
  ].join(" ");
}

async function submitImageTask(
  baseUrl: string,
  cookieHeader: string,
  images: string[],
  prompt: string,
  aspectRatio: string,
) {
  return withRetries("提交生成失败", async () => {
    const response = await fetch(`${baseUrl}${GENERATE_PATH}`, {
      method: "POST",
      headers: buildHeaders(cookieHeader),
      body: JSON.stringify({
        mediaType: "image",
        images,
        prompt,
        aspect_ratio: aspectRatio,
        enable_base64_output: false,
        enable_sync_mode: false,
        output_format: "png",
      }),
    });

    const result = (await response.json().catch(() => ({}))) as SubmitResponse;

    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }

    if (result.code !== 0 || !result.data) {
      throw new Error(result.message || "返回结构异常");
    }

    const requestId = result.data.requestId || result.data.taskId;
    if (!requestId) {
      throw new Error("生成接口未返回 requestId");
    }

    return requestId;
  });
}

async function pollTask(baseUrl: string, cookieHeader: string, requestId: string) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(
      `${baseUrl}${STATUS_PATH}?taskId=${encodeURIComponent(requestId)}&scenario=${encodeURIComponent(STATUS_SCENARIO)}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (compatible; 10b.ai zencreator by-ref batch)",
        },
      },
    );

    const result = (await response.json().catch(() => ({}))) as SubmitResponse;
    if (!response.ok) {
      throw new Error(result.message || `状态查询失败: HTTP ${response.status}`);
    }

    if (result.code !== 0 || !result.data) {
      throw new Error(result.message || "状态查询失败");
    }

    const status = String(result.data.status || "").toLowerCase();
    const directUrl = result.data.output || result.data.outputs?.[0];

    if (
      (status === "completed" || status === "success") &&
      typeof directUrl === "string" &&
      directUrl
    ) {
      return directUrl;
    }

    if (status === "failed" || status === "error") {
      throw new Error(result.data.error || "任务失败");
    }
  }

  throw new Error("任务超时");
}

async function downloadImage(url: string) {
  const response = await withRetries(`下载图片失败: ${url}`, async () => {
    const result = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; 10b.ai zencreator by-ref batch)",
      },
    });

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}`);
    }

    return result;
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadGeneratedImage(
  templateId: string,
  templateName: string,
  kind: "ref" | "face" | "result",
  sourceUrl: string,
  versionSeed?: string,
) {
  const imageBuffer = await downloadImage(sourceUrl);
  const key = buildOSSKey(templateId, templateName, kind, versionSeed);
  const ossProvider = createOSSProvider(ossConfig);
  const upload = await ossProvider.uploadFile({
    body: imageBuffer,
    key,
    contentType: "image/png",
    disposition: "inline",
  });

  if (!upload.success || !upload.url) {
    throw new Error(upload.error || `上传 ${kind} 图片失败`);
  }

  return upload.url;
}

async function main() {
  const templateIdFilter = getArgValue("template-id") || "";
  const allRows = templateIdFilter ? [] : await fetchAllTemplates();
  const simpleTemplates: SimpleTemplateRecord[] = allRows.map((item) => ({
    TemplateName: item.name?.trim() || "",
    prompt: item.input?.positive_prompt?.trim() || "",
  }));

  if (!templateIdFilter) {
    await saveJson(RAW_OUTPUT_PATH, {
      source: PAGE_URL,
      api: API_BASE,
      collected_at: new Date().toISOString(),
      total_templates: simpleTemplates.length,
      templates: simpleTemplates,
    });
  }

  const cookieHeader =
    process.env.TENB_COOKIE ||
    process.env.REQUEST_COOKIE_HEADER ||
    process.env.COOKIE ||
    "";

  if (!cookieHeader) {
    throw new Error(
      `原始 JSON 已生成在 ${RAW_OUTPUT_PATH}，但缺少 TENB_COOKIE/REQUEST_COOKIE_HEADER/COOKIE，无法继续调用 10b.ai。`,
    );
  }

  if (
    !ossConfig.region ||
    !ossConfig.accessKeyId ||
    !ossConfig.accessKeySecret ||
    !ossConfig.bucket
  ) {
    throw new Error(
      `原始 JSON 已生成在 ${RAW_OUTPUT_PATH}，但缺少 OSS 配置，无法继续上传生成结果。`,
    );
  }

  const baseUrl = (
    getArgValue("base-url") ||
    process.env.TENB_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const start = Number(getArgValue("start") || "1");
  const end = Number(getArgValue("end") || String(allRows.length || 1));
  const force = process.argv.includes("--force");
  const finalOnly = process.argv.includes("--final-only");

  const fallbackRefMap = await loadFallbackRefMap();
  const existing = await fs
    .readFile(VARIANT_OUTPUT_PATH, "utf8")
    .then((content) => JSON.parse(content) as TemplateFile<VariantTemplateRecord>)
    .catch(() => null);

  const output: TemplateFile<VariantTemplateRecord> = existing || {
    source: PAGE_URL,
    api: API_BASE,
    generated_at: new Date().toISOString(),
    generated_by: "10b.ai gpt-image-2-image-to-image + oss upload",
    total_templates: allRows.length,
    templates: allRows.map((item) => {
      const originalName = item.name?.trim() || "";
      const prompt = item.input?.positive_prompt?.trim() || "";
      const fallback = fallbackRefMap.get(item.id) || {};

      return {
        templateId: item.id,
        OriginalTemplateName: originalName,
        TemplateName: rewriteTemplateName(originalName),
        prompt,
        originalRefImageUrl: fallback.ref,
        originalFaceImageUrl: fallback.face,
      };
    }),
  };

  await saveJson(VARIANT_OUTPUT_PATH, output);

  const sourceTemplates: SourceTemplateRecord[] = templateIdFilter
    ? output.templates
        .filter((item) => item.templateId === templateIdFilter)
        .map((item) => ({
          id: item.templateId,
          name: item.TemplateName,
          originalName:
            item.OriginalTemplateName || stripVariantSuffixes(item.TemplateName),
          prompt: item.prompt,
          originalRefImageUrl: item.originalRefImageUrl,
          originalFaceImageUrl: item.originalFaceImageUrl,
        }))
    : allRows.map((item, index) => {
        const current = output.templates[index];
        const originalName = item.name?.trim() || "";
        const fallback = fallbackRefMap.get(item.id) || {};

        return {
          id: item.id,
          name: rewriteTemplateName(originalName),
          originalName,
          prompt: item.input?.positive_prompt?.trim() || "",
          originalRefImageUrl: current?.originalRefImageUrl || fallback.ref,
          originalFaceImageUrl: current?.originalFaceImageUrl || fallback.face,
        };
      });

  if (templateIdFilter && sourceTemplates.length === 0) {
    throw new Error(`未在现有结果文件中找到 templateId=${templateIdFilter}`);
  }

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let index = 0; index < sourceTemplates.length; index += 1) {
    const displayIndex = index + 1;
    if (!templateIdFilter && (displayIndex < start || displayIndex > end)) {
      continue;
    }

    const source = sourceTemplates[index];
    const currentIndex = output.templates.findIndex(
      (item) => item.templateId === source.id,
    );
    if (currentIndex < 0) {
      continue;
    }

    const current = output.templates[currentIndex];
    const fallback = fallbackRefMap.get(source.id) || {};

    current.templateId = source.id;
    current.OriginalTemplateName =
      source.originalName ||
      current.OriginalTemplateName ||
      stripVariantSuffixes(source.name);
    current.TemplateName = rewriteTemplateName(source.name);
    current.prompt = source.prompt;
    current.originalRefImageUrl =
      current.originalRefImageUrl || source.originalRefImageUrl || fallback.ref;
    current.originalFaceImageUrl =
      current.originalFaceImageUrl || source.originalFaceImageUrl || fallback.face;
    current.generatedRefPrompt = buildRefVariantPrompt(
      current.OriginalTemplateName || current.TemplateName,
      current.TemplateName,
      current.prompt,
      currentIndex,
    );
    current.generatedFacePrompt = buildFaceVariantPrompt(
      current.OriginalTemplateName || current.TemplateName,
      current.TemplateName,
      currentIndex,
    );
    current.finalPrompt = buildFinalPrompt(
      current.OriginalTemplateName || current.TemplateName,
      current.TemplateName,
      current.prompt,
      currentIndex,
    );

    if (!current.originalRefImageUrl || !current.originalFaceImageUrl) {
      current.status = "failed";
      current.error = "缺少原始 ref 或 face 图片地址";
      failedCount += 1;
      await saveJson(VARIANT_OUTPUT_PATH, output);
      console.error(`[${displayIndex}/${sourceTemplates.length}] 失败: ${current.TemplateName} - ${current.error}`);
      continue;
    }

    if (
      current.generatedRefImageUrl &&
      current.generatedFaceImageUrl &&
      current.resultImageUrl &&
      !force &&
      !finalOnly
    ) {
      skippedCount += 1;
      console.log(`[${displayIndex}/${sourceTemplates.length}] 跳过: ${current.TemplateName}`);
      continue;
    }

    console.log(`[${displayIndex}/${sourceTemplates.length}] 处理中: ${current.TemplateName}`);

    try {
      if (!finalOnly && (!current.generatedRefImageUrl || force)) {
        const requestId = await submitImageTask(
          baseUrl,
          cookieHeader,
          [current.originalRefImageUrl],
          current.generatedRefPrompt,
          "9:16",
        );
        current.generatedRefRequestId = requestId;
        await saveJson(VARIANT_OUTPUT_PATH, output);

        const sourceUrl = await pollTask(baseUrl, cookieHeader, requestId);
        current.generatedRefImageUrl = await uploadGeneratedImage(
          current.templateId,
          current.TemplateName,
          "ref",
          sourceUrl,
          requestId,
        );
        await saveJson(VARIANT_OUTPUT_PATH, output);
      }

      if (!finalOnly && (!current.generatedFaceImageUrl || force)) {
        const requestId = await submitImageTask(
          baseUrl,
          cookieHeader,
          [current.originalFaceImageUrl],
          current.generatedFacePrompt,
          "1:1",
        );
        current.generatedFaceRequestId = requestId;
        await saveJson(VARIANT_OUTPUT_PATH, output);

        const sourceUrl = await pollTask(baseUrl, cookieHeader, requestId);
        current.generatedFaceImageUrl = await uploadGeneratedImage(
          current.templateId,
          current.TemplateName,
          "face",
          sourceUrl,
          requestId,
        );
        await saveJson(VARIANT_OUTPUT_PATH, output);
      }

      if (
        finalOnly &&
        (!current.generatedRefImageUrl || !current.generatedFaceImageUrl)
      ) {
        throw new Error("final-only 模式要求已有 generated ref 和 generated face");
      }

      if (!current.resultImageUrl || force || finalOnly) {
        const requestId = await submitImageTask(
          baseUrl,
          cookieHeader,
          [current.generatedRefImageUrl, current.generatedFaceImageUrl].filter(Boolean) as string[],
          current.finalPrompt,
          "9:16",
        );
        current.finalRequestId = requestId;
        await saveJson(VARIANT_OUTPUT_PATH, output);

        const sourceUrl = await pollTask(baseUrl, cookieHeader, requestId);
        current.resultImageUrl = await uploadGeneratedImage(
          current.templateId,
          current.TemplateName,
          "result",
          sourceUrl,
          requestId,
        );
      }

      current.status = "success";
      delete current.error;
      successCount += 1;
      await saveJson(VARIANT_OUTPUT_PATH, output);
      console.log(`[${displayIndex}/${sourceTemplates.length}] 完成: ${current.resultImageUrl}`);
    } catch (error) {
      current.status = "failed";
      current.error = error instanceof Error ? error.message : String(error);
      failedCount += 1;
      await saveJson(VARIANT_OUTPUT_PATH, output);
      console.error(`[${displayIndex}/${sourceTemplates.length}] 失败: ${current.TemplateName} - ${current.error}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        rawOutput: RAW_OUTPUT_PATH,
        variantOutput: VARIANT_OUTPUT_PATH,
        total: output.templates.length,
        successCount,
        skippedCount,
        failedCount,
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
