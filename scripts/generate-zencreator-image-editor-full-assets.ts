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
  "docs/zencreator-image-editor.full-inference.json",
);
const OUTPUT_PREFIX = "zencreator/image-editor-full";
const DEFAULT_BASE_URL = "https://10b.ai";
const TEXT_TO_IMAGE_PATH = "/api/ai/gpt-image-2-text-to-image/generate";
const IMAGE_TO_IMAGE_PATH = "/api/ai/gpt-image-2-image-to-image/generate";
const STATUS_PATH = "/api/ai/status";
const TEXT_TO_IMAGE_SCENARIO = "gpt-image-2-text-to-image";
const IMAGE_TO_IMAGE_SCENARIO = "gpt-image-2-image-to-image";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;

type TemplateRecord = {
  index: number;
  template_id: string;
  original_template_name: string;
  template_name_synonym: string;
  ref_generation_prompt: string;
  supplemental_ref_prompts?: string[];
  final_generation_prompt: string;
  primary_ref_image_url: string;
  ref_image_urls: string[];
  final_image_url: string;
  generation_status: "pending" | "ref_done" | "done" | "failed";
  error?: string;
};

type TemplateFile = {
  generated_at?: string;
  total_templates: number;
  templates: TemplateRecord[];
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

function buildOSSKey(
  template: TemplateRecord,
  kind: "ref" | "final",
  versionSeed: string,
) {
  const slug = sanitizeSlug(
    template.template_name_synonym || template.original_template_name,
  );
  const hash = createHash("md5")
    .update(
      `${template.template_id}\n${kind}\n${versionSeed}\n${template.ref_generation_prompt}\n${template.final_generation_prompt}`,
    )
    .digest("hex");
  return `${OUTPUT_PREFIX}/${slug}-${kind}-${hash}.png`;
}

async function saveOutput(file: TemplateFile) {
  await fs.writeFile(FILE_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf8");
}

async function submitTask(
  baseUrl: string,
  cookieHeader: string,
  endpoint: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: buildHeaders(cookieHeader),
    body: JSON.stringify(payload),
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
  scenario: string,
) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(
      `${baseUrl}${STATUS_PATH}?taskId=${encodeURIComponent(requestId)}&scenario=${encodeURIComponent(scenario)}`,
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

    if (data.status === "failed" || data.status === "error") {
      throw new Error(data.error || "任务失败");
    }
  }

  throw new Error("任务超时");
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; z-image.ai image download)",
    },
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
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
    throw new Error("缺少 OSS 配置。");
  }

  const baseUrl = (
    getArgValue("base-url") ||
    process.env.TENB_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const start = Number(getArgValue("start") || "1");
  const end = Number(getArgValue("end") || "999");
  const force = process.argv.includes("--force");
  const versionSeed =
    getArgValue("version-seed") ||
    `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 10)}`;

  const data = JSON.parse(await fs.readFile(FILE_PATH, "utf8")) as TemplateFile;
  data.generated_at = new Date().toISOString();
  const ossProvider = createOSSProvider(ossConfig);

  for (const template of data.templates) {
    if (template.index < start || template.index > end) {
      continue;
    }

    if (
      template.final_image_url &&
      template.primary_ref_image_url &&
      !force
    ) {
      console.log(`[${template.index}/${data.total_templates}] 跳过 ${template.original_template_name}`);
      continue;
    }

    console.log(`[${template.index}/${data.total_templates}] 生成 ref ${template.original_template_name}`);

    try {
      const generatedRefUrls: string[] = [];

      const refRequestId = await submitTask(
        baseUrl,
        cookieHeader,
        TEXT_TO_IMAGE_PATH,
        {
          mediaType: "image",
          prompt: template.ref_generation_prompt,
          enable_base64_output: false,
          enable_sync_mode: false,
          output_format: "png",
          aspect_ratio: "9:16",
        },
      );
      const refSourceUrl = await pollResult(
        baseUrl,
        cookieHeader,
        refRequestId,
        TEXT_TO_IMAGE_SCENARIO,
      );
      const refBuffer = await downloadImage(refSourceUrl);
      const refUpload = await ossProvider.uploadFile({
        body: refBuffer,
        key: buildOSSKey(template, "ref", versionSeed),
        contentType: "image/png",
        disposition: "inline",
      });

      if (!refUpload.success || !refUpload.url) {
        throw new Error(refUpload.error || "ref 上传失败");
      }

      generatedRefUrls.push(refUpload.url);
      template.primary_ref_image_url = refUpload.url;

      for (const [supplementIndex, extraPrompt] of (
        template.supplemental_ref_prompts || []
      ).entries()) {
        console.log(
          `[${template.index}/${data.total_templates}] 生成 supplemental ref ${supplementIndex + 1} ${template.original_template_name}`,
        );

        const extraRequestId = await submitTask(
          baseUrl,
          cookieHeader,
          TEXT_TO_IMAGE_PATH,
          {
            mediaType: "image",
            prompt: extraPrompt,
            enable_base64_output: false,
            enable_sync_mode: false,
            output_format: "png",
            aspect_ratio: "1:1",
          },
        );
        const extraSourceUrl = await pollResult(
          baseUrl,
          cookieHeader,
          extraRequestId,
          TEXT_TO_IMAGE_SCENARIO,
        );
        const extraBuffer = await downloadImage(extraSourceUrl);
        const extraUpload = await ossProvider.uploadFile({
          body: extraBuffer,
          key: buildOSSKey(
            {
              ...template,
              template_id: `${template.template_id}-supplement-${supplementIndex + 1}`,
            },
            "ref",
            versionSeed,
          ),
          contentType: "image/png",
          disposition: "inline",
        });

        if (!extraUpload.success || !extraUpload.url) {
          throw new Error(extraUpload.error || "supplemental ref 上传失败");
        }

        generatedRefUrls.push(extraUpload.url);
      }

      template.ref_image_urls = generatedRefUrls;
      template.generation_status = "ref_done";
      delete template.error;
      await saveOutput(data);

      console.log(`[${template.index}/${data.total_templates}] 生成 final ${template.original_template_name}`);

      const finalRequestId = await submitTask(
        baseUrl,
        cookieHeader,
        IMAGE_TO_IMAGE_PATH,
        {
          mediaType: "image",
          images: generatedRefUrls,
          prompt: template.final_generation_prompt,
          aspect_ratio: "9:16",
          enable_base64_output: false,
          enable_sync_mode: false,
          output_format: "png",
        },
      );
      const finalSourceUrl = await pollResult(
        baseUrl,
        cookieHeader,
        finalRequestId,
        IMAGE_TO_IMAGE_SCENARIO,
      );
      const finalBuffer = await downloadImage(finalSourceUrl);
      const finalUpload = await ossProvider.uploadFile({
        body: finalBuffer,
        key: buildOSSKey(template, "final", versionSeed),
        contentType: "image/png",
        disposition: "inline",
      });

      if (!finalUpload.success || !finalUpload.url) {
        throw new Error(finalUpload.error || "final 上传失败");
      }

      template.final_image_url = finalUpload.url;
      template.generation_status = "done";
      await saveOutput(data);
      console.log(`[${template.index}/${data.total_templates}] 完成 ${finalUpload.url}`);
    } catch (error) {
      template.generation_status = "failed";
      template.error = error instanceof Error ? error.message : String(error);
      await saveOutput(data);
      console.error(
        `[${template.index}/${data.total_templates}] 失败 ${template.original_template_name}: ${template.error}`,
      );
    }
  }

  console.log(JSON.stringify({ output: FILE_PATH, total: data.total_templates }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
