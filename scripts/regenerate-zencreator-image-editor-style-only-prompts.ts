import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import dotenv from "dotenv";

import { createOSSProvider } from "../src/extensions/storage/oss";

dotenv.config({ path: ".env.oss" });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.development", override: false });
dotenv.config({ path: ".env", override: false });

const FILE_PATH = path.resolve(
  process.cwd(),
  "docs/zencreator-image-editor.style-only-prompts.json",
);
const OUTPUT_PREFIX = "zencreator/image-editor-style-only";
const DEFAULT_BASE_URL = "https://10b.ai";
const GENERATE_PATH = "/api/ai/gpt-image-2-text-to-image/generate";
const STATUS_PATH = "/api/ai/status";
const STATUS_SCENARIO = "gpt-image-2-text-to-image";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;

type TemplateRecord = {
  index: number;
  original_template_name: string;
  template_name_synonym: string;
  final_generated_image_url: string;
  primary_ref_image_url: string;
  ref_image_urls: string[];
  inferred_style_only_prompt: string;
};

type TemplateFile = {
  source_file: string;
  generated_at: string;
  policy_note: string;
  templates: TemplateRecord[];
};

type TemplateOverride = {
  synonym: string;
  prompt: string;
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
  };
};

const templateOverrides: Record<number, TemplateOverride> = {
  1: {
    synonym: "Cheeky Pout Pose",
    prompt:
      "A playful editorial portrait of a young beautiful woman giving a cheeky pout, wearing fresh street-fashion styling in a neon-lit arcade, lively energy, glossy color, photorealistic fashion photography.",
  },
  2: {
    synonym: "Smoldering Lip Gesture",
    prompt:
      "A moody close portrait of a young beautiful woman with a soft finger-near-lips gesture, deep eye contact, cinematic shadows, elegant styling, intimate editorial atmosphere, photorealistic beauty photography.",
  },
  3: {
    synonym: "Prestige Superyacht - 3:4",
    prompt:
      "A luxury yacht editorial of a young beautiful woman in refined resort fashion on a sunlit deck, sea breeze, polished summer glamour, bright ocean reflections, photorealistic lifestyle photography, vertical composition.",
  },
  4: {
    synonym: "Chic Mirror Snapshot",
    prompt:
      "A stylish mirror selfie of a young beautiful woman in a sleek fashion look inside a modern boutique hotel, clean reflections, confident attitude, cool indoor light, photorealistic smartphone-photo aesthetic.",
  },
  5: {
    synonym: "Paris Gilded Evening Gown",
    prompt:
      "A romantic Paris night portrait of a young beautiful woman wearing a glowing golden couture gown, sparkling city lights, elegant drama, cinematic glamour, luxurious photorealistic fashion photography.",
  },
  6: {
    synonym: "Wardrobe Switch + Seated Lounge Pose",
    prompt:
      "A curated living-room portrait of a young beautiful woman seated in a designer lounge, wearing a fresh contemporary outfit, relaxed charm, upscale interior mood, photorealistic editorial lifestyle photography.",
  },
  7: {
    synonym: "Backdrop Match Muse Swap - 3:4",
    prompt:
      "A glamorous portrait of a young beautiful woman set against a striking luxury backdrop, strong environmental presence, polished styling, elegant posture, photorealistic editorial image with a clear sense of scene continuity.",
  },
  8: {
    synonym: "Scene Clean-Up Muse - 3:4",
    prompt:
      "A photorealistic city portrait of a young beautiful woman in a spacious urban setting with crisp architectural depth, stylish outfit, natural daylight, clean composition, polished editorial realism.",
  },
  9: {
    synonym: "Phone-Shot Portrait",
    prompt:
      "A close selfie-style portrait of a young beautiful woman with personality, softly tousled hair, fashionable casual look, warm room glow, authentic phone-camera intimacy, photorealistic modern beauty shot.",
  },
  10: {
    synonym: "Crimson-Wrapped Pose Remix",
    prompt:
      "A dramatic studio portrait of a young beautiful woman wrapped in flowing crimson fabric, bold elegance, sculptural pose, rich contrast, luxurious mood, photorealistic fashion editorial.",
  },
  11: {
    synonym: "Night Backdrop Muse Swap - 3:4",
    prompt:
      "A glamorous night portrait of a young beautiful woman framed by a vivid urban backdrop, polished styling, luminous atmosphere, editorial confidence, photorealistic scene-rich fashion photography.",
  },
  12: {
    synonym: "Tight Framing Portrait Study",
    prompt:
      "A close-up beauty portrait of a young beautiful woman with expressive eyes, luminous skin, subtle makeup, shallow depth of field, refined elegance, photorealistic high-end portrait photography.",
  },
  13: {
    synonym: "Estate Mystique",
    prompt:
      "A mysterious manor-inspired portrait of a young beautiful woman in elegant dark styling, old-world atmosphere, candlelit mood, quiet drama, cinematic photorealistic editorial photography.",
  },
  14: {
    synonym: "Physique Glow-Up - 3:4",
    prompt:
      "A toned fitness portrait of a young beautiful woman in stylish activewear, healthy athletic shape, clean daylight, confident body language, photorealistic transformation-inspired editorial image, vertical framing.",
  },
  15: {
    synonym: "Elegant Muse Beside A Vintage Automobile",
    prompt:
      "A refined retro fashion portrait of a young beautiful woman beside a classic car, polished twilight glow, cinematic elegance, premium styling, photorealistic automotive editorial photography.",
  },
  16: {
    synonym: "Pose Remix",
    prompt:
      "A full-body fashion portrait of a young beautiful woman in a fresh expressive pose, clean modern setting, graceful movement, stylish wardrobe, photorealistic editorial image with strong body language.",
  },
  17: {
    synonym: "Lilac Couture With White Accents",
    prompt:
      "A pastel couture portrait of a young beautiful woman in lilac high-fashion styling with crisp white accents, airy elegance, runway polish, refined photorealistic editorial photography.",
  },
  18: {
    synonym: "Spa-To-Speed",
    prompt:
      "A cinematic transformation portrait of a young beautiful woman blending calm spa luxury with racing energy, sleek styling, motion-ready attitude, dramatic contrast, photorealistic concept editorial.",
  },
  19: {
    synonym: "Shades Elegance Portrait",
    prompt:
      "A chic portrait of a young beautiful woman wearing statement sunglasses, understated luxury, graceful confidence, soft premium light, photorealistic accessories-focused editorial photography.",
  },
  20: {
    synonym: "Homestyle Snapshot",
    prompt:
      "An authentic at-home portrait of a young beautiful woman in a cozy lived-in space, casual natural styling, warm realism, candid charm, photorealistic domestic snapshot aesthetic.",
  },
  21: {
    synonym: "Campaign Photoshoot",
    prompt:
      "A polished commercial photoshoot portrait of a young beautiful woman, premium styling, ad-ready lighting, confident expression, modern luxury mood, photorealistic campaign photography.",
  },
  22: {
    synonym: "Home Comfort With A Martini",
    prompt:
      "A relaxed evening portrait of a young beautiful woman holding a martini in a stylish home interior, soft ambient light, quiet luxury, photorealistic lifestyle editorial mood.",
  },
  23: {
    synonym: "Beauty Detail - 9:16",
    prompt:
      "A vertical beauty portrait of a young beautiful woman showcasing refined makeup, glowing skin, elegant expression, studio polish, photorealistic cosmetic campaign photography, 9:16 framing.",
  },
  24: {
    synonym: "Coral Swimwear On Deck",
    prompt:
      "A bright summer boat portrait of a young beautiful woman in coral swimwear, sparkling water, sunlit resort glamour, breezy confidence, photorealistic marine lifestyle editorial, vertical composition.",
  },
};

const faceShapes = [
  "soft oval face",
  "heart-shaped face",
  "delicate round face",
  "refined diamond face",
  "gentle long face",
  "subtle square jawline",
];

const eyeStyles = [
  "almond eyes",
  "bright wide-set eyes",
  "soft hooded eyes",
  "cat-eye gaze",
  "gentle rounded eyes",
  "deep expressive eyes",
];

const hairLooks = [
  "sleek straight long hair",
  "soft shoulder-length waves",
  "a polished high ponytail",
  "a short glossy bob",
  "a loose textured bun",
  "voluminous side-parted curls",
];

const identityHints = [
  "East Asian beauty",
  "Mediterranean beauty",
  "Latina beauty",
  "Middle Eastern beauty",
  "mixed-race beauty",
  "European beauty",
];

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

function buildHeaders(cookieHeader: string) {
  return {
    "Content-Type": "application/json",
    Cookie: cookieHeader,
    "User-Agent": "Mozilla/5.0 (compatible; z-image.ai 10b gpt-image-2 batch)",
  };
}

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildOSSKey(template: TemplateRecord) {
  const slug = sanitizeSlug(template.template_name_synonym || template.original_template_name);
  const hash = createHash("md5")
    .update(
      `${template.index}\n${template.original_template_name}\n${template.inferred_style_only_prompt}`,
    )
    .digest("hex");
  return `${OUTPUT_PREFIX}/${slug}-ref-${hash}.png`;
}

function buildGenerationPrompt(template: TemplateRecord) {
  const i = template.index - 1;

  return [
    template.inferred_style_only_prompt,
    `The subject must be a young adult beautiful woman with ${faceShapes[i % faceShapes.length]}, ${eyeStyles[i % eyeStyles.length]}, ${hairLooks[i % hairLooks.length]}, and a distinct ${identityHints[i % identityHints.length]} identity.`,
    "Create a fresh reference image that feels new and original, with a different face, hairstyle, styling details, and scene arrangement from any earlier example.",
    "Keep the image photorealistic, elegant, polished, and suitable as a reference image.",
    "No text, no watermark, no collage.",
  ].join(" ");
}

async function saveOutput(file: TemplateFile) {
  await fs.writeFile(FILE_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf8");
}

async function submitTask(baseUrl: string, cookieHeader: string, prompt: string) {
  const response = await fetch(`${baseUrl}${GENERATE_PATH}`, {
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

  const result = (await response.json().catch(() => ({}))) as SubmitResponse;
  if (!response.ok) {
    throw new Error(`提交任务失败: HTTP ${response.status}`);
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
) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(
      `${baseUrl}${STATUS_PATH}?taskId=${encodeURIComponent(requestId)}&scenario=${encodeURIComponent(STATUS_SCENARIO)}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (compatible; z-image.ai 10b gpt-image-2 batch)",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`查询结果失败: HTTP ${response.status}`);
    }

    const result = (await response.json().catch(() => ({}))) as SubmitResponse;
    const data = result.data;

    if (String(result.code) !== "0" || !data) {
      throw new Error(result.message || "查询结果失败: 返回结构异常");
    }

    if (typeof data.output === "string" && data.output) {
      return data.output;
    }

    if (data.outputs?.[0]) {
      return data.outputs[0];
    }

    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || `任务失败: ${data.status}`);
    }
  }

  throw new Error("任务超时，未在规定时间内完成");
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; z-image.ai style-only batch)",
    },
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const cookieHeader =
    process.env.TENB_COOKIE ||
    process.env.REQUEST_COOKIE_HEADER ||
    process.env.COOKIE ||
    "";
  if (!cookieHeader) {
    throw new Error(
      "缺少 TENB_COOKIE/REQUEST_COOKIE_HEADER/COOKIE，无法调用 https://10b.ai 的 gpt-image-2 接口。",
    );
  }

  if (
    !ossConfig.region ||
    !ossConfig.accessKeyId ||
    !ossConfig.accessKeySecret ||
    !ossConfig.bucket
  ) {
    throw new Error(
      "缺少 OSS 配置。请设置 OSS_REGION、OSS_ACCESS_KEY_ID、OSS_ACCESS_KEY_SECRET、OSS_BUCKET。",
    );
  }

  const raw = await fs.readFile(FILE_PATH, "utf8");
  const data = JSON.parse(raw) as TemplateFile;
  const baseUrl = (
    getArgValue("base-url") ||
    process.env.TENB_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const start = Number(getArgValue("start") || "1");
  const end = Number(getArgValue("end") || String(data.templates.length));
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");
  const ossProvider = createOSSProvider(ossConfig);

  data.generated_at = new Date().toISOString();
  data.policy_note =
    "以下 prompt 只保留 Template Name 所要求的风格与题材方向，ref 图主体统一为年轻成年美女；prompt 采用更自然的生成式写法，不额外加入过强控制语句。";

  for (const template of data.templates) {
    const override = templateOverrides[template.index];
    if (!override) {
      throw new Error(`缺少模板配置: #${template.index} ${template.original_template_name}`);
    }

    template.template_name_synonym = override.synonym;
    template.inferred_style_only_prompt = override.prompt;
  }

  await saveOutput(data);

  for (const template of data.templates) {
    if (template.index < start || template.index > end) {
      continue;
    }

    const alreadyGenerated =
      template.primary_ref_image_url.includes(OUTPUT_PREFIX) &&
      template.ref_image_urls.some((url) => url.includes(OUTPUT_PREFIX));

    if (alreadyGenerated && !force) {
      console.log(`[${template.index}/${data.templates.length}] 跳过 ${template.original_template_name}`);
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] ${template.index} ${template.template_name_synonym}`);
      continue;
    }

    console.log(`[${template.index}/${data.templates.length}] 生成 ${template.template_name_synonym}`);

    const generationPrompt = buildGenerationPrompt(template);
    const requestId = await submitTask(baseUrl, cookieHeader, generationPrompt);
    const sourceImageUrl = await pollResult(baseUrl, cookieHeader, requestId);
    const imageBuffer = await downloadImage(sourceImageUrl);
    const key = buildOSSKey(template);
    const upload = await ossProvider.uploadFile({
      body: imageBuffer,
      key,
      contentType: "image/png",
      disposition: "inline",
    });

    if (!upload.success || !upload.url) {
      throw new Error(upload.error || `上传失败: ${template.original_template_name}`);
    }

    template.primary_ref_image_url = upload.url;
    template.ref_image_urls = [upload.url];
    await saveOutput(data);
    console.log(`[${template.index}/${data.templates.length}] 完成 ${upload.url}`);
  }

  console.log(JSON.stringify({ output: FILE_PATH, total: data.templates.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
