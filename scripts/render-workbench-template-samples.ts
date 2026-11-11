import fs from "node:fs/promises";
import path from "node:path";
import React from "react";

import { envConfigs } from "../src/config";
import { getPlaygroundConfigByUrl } from "../src/shared/blocks/desktop-playground/playground-config-registry";
import type { PlaygroundConfig } from "../src/shared/blocks/desktop-playground";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const SAMPLES_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples.json",
);

type SampleRecord = {
  prompt?: string;
  params?: Record<string, any>;
  previewUrl?: string;
  thumbnailUrl?: string;
  generatedUrl?: string;
  generatedUrls?: string[];
  generatedAt?: string;
  generationError?: string;
  generationSkippedReason?: string;
  generationRequestId?: string;
};

type SampleMap = Record<string, SampleRecord[]>;

type GenerateResult =
  | {
      url: string;
      urls?: string[];
      requestId?: string;
    }
  | {
      error: string;
    };

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function shouldSkipByGeneratedAtPrefix(
  generatedAt: string | undefined,
  prefix: string | undefined,
) {
  if (!generatedAt || !prefix) {
    return false;
  }

  return generatedAt.startsWith(prefix);
}

async function readCookieValue() {
  const direct = getArgValue("cookie") || process.env.GENERATION_COOKIE;
  if (direct) {
    return direct.trim();
  }

  const cookieFile = getArgValue("cookie-file");
  if (!cookieFile) {
    return "";
  }

  return fs.readFile(path.resolve(process.cwd(), cookieFile), "utf8");
}

function createTranslator() {
  return (key: string, params?: Record<string, any>) => {
    if (typeof params?.defaultValue === "string") {
      return params.defaultValue;
    }

    return key;
  };
}

function createCallbacks(errorRef: { current: string }) {
  return {
    checkAccess: () => ({ passed: true }),
    showPricingModal: () => {
      errorRef.current = "Insufficient credits";
    },
    showSignModal: () => {
      errorRef.current = "Authentication required";
    },
    fetchUserInfo: async () => {},
    onStatusUpdate: () => {},
    onError: (error: string) => {
      errorRef.current = error;
    },
  } satisfies Parameters<PlaygroundConfig["onGenerate"]>[1]["callbacks"];
}

function createFetchProxy(baseUrl: string, cookie: string) {
  const originalFetch = globalThis.fetch;
  const baseOrigin = new URL(baseUrl).origin;

  const proxiedFetch: typeof globalThis.fetch = async (input, init) => {
    let targetUrl = "";
    let nextInput: RequestInfo | URL = input;
    let nextInit = init ? { ...init } : undefined;

    if (typeof input === "string" || input instanceof URL) {
      targetUrl = new URL(String(input), baseUrl).toString();
      nextInput = targetUrl;
    } else if (input instanceof Request) {
      targetUrl = new URL(input.url, baseUrl).toString();
      nextInput = targetUrl;
      nextInit = {
        method: input.method,
        headers: input.headers,
        body:
          input.method === "GET" || input.method === "HEAD"
            ? undefined
            : await input.clone().text(),
        ...nextInit,
      };
    }

    if (cookie && targetUrl && new URL(targetUrl).origin === baseOrigin) {
      const headers = new Headers(nextInit?.headers || {});
      headers.set("cookie", cookie);
      nextInit = {
        ...nextInit,
        headers,
      };
    }

    return originalFetch(nextInput, nextInit);
  };

  return {
    install() {
      globalThis.fetch = proxiedFetch;
    },
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

function ensureUploadDuration(items: unknown, duration: number) {
  if (!Array.isArray(items)) {
    return items;
  }

  return items.map((item) => {
    if (!item || typeof item !== "object") {
      return item;
    }

    if (
      typeof (item as { duration?: unknown }).duration === "number" &&
      Number.isFinite((item as { duration: number }).duration)
    ) {
      return item;
    }

    return {
      ...(item as Record<string, unknown>),
      duration,
    };
  });
}

function normalizeSampleParamsForGeneration(
  modelUrl: string,
  params: Record<string, any>,
) {
  const nextParams = { ...params };

  if (modelUrl === "/motion-control/kling-2-6-pro") {
    nextParams.referenceVideo = ensureUploadDuration(nextParams.referenceVideo, 5);
  }

  if (modelUrl === "/longcat-avatar") {
    nextParams.audioTrack = ensureUploadDuration(nextParams.audioTrack, 5);
  }

  return nextParams;
}

async function generateForSample(options: {
  modelUrl: string;
  config: PlaygroundConfig;
  params: Record<string, any>;
  baseUrl: string;
  cookie: string;
}) {
  const { modelUrl, config, params, baseUrl, cookie } = options;
  const errorRef = { current: "" };
  const fetchProxy = createFetchProxy(baseUrl, cookie);
  const callbacks = createCallbacks(errorRef);
  const t = createTranslator();
  const normalizedParams = normalizeSampleParamsForGeneration(modelUrl, params);

  fetchProxy.install();

  try {
    const result = await config.onGenerate(normalizedParams, {
      callbacks,
      t,
      requiredCredits: null,
      remainingCredits: Number.MAX_SAFE_INTEGER,
    });

    const urls = [
      ...(Array.isArray(result.imageUrls) ? result.imageUrls : []),
      ...(result.imageUrl ? [result.imageUrl] : []),
      ...(result.videoUrl ? [result.videoUrl] : []),
    ].filter(Boolean);

    const uniqueUrls = Array.from(new Set(urls));

    if (uniqueUrls.length === 0) {
      return {
        error: errorRef.current || "No generated url returned",
      } satisfies GenerateResult;
    }

    return {
      url: uniqueUrls[0],
      urls: uniqueUrls,
    } satisfies GenerateResult;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : errorRef.current || String(error),
    } satisfies GenerateResult;
  } finally {
    fetchProxy.restore();
  }
}

async function persistSamples(sampleMap: SampleMap) {
  await fs.writeFile(SAMPLES_PATH, `${JSON.stringify(sampleMap, null, 2)}\n`, "utf8");
}

function hasUploadedAssets(value: unknown) {
  return (
    Array.isArray(value) &&
    value.some(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as { url?: unknown }).url === "string" &&
        Boolean((item as { url: string }).url),
    )
  );
}

function getSkipReason(
  config: PlaygroundConfig,
  params: Record<string, any>,
): string | undefined {
  if (config.scenarioType === "image-to-image") {
    if (!hasUploadedAssets(params.referenceImages)) {
      return "缺少参考图片，跳过当前样例";
    }
  }

  if (config.scenarioType === "image-to-video") {
    const hasFirstFrame = hasUploadedAssets(params.firstFrameImage);
    const hasReferenceImages = hasUploadedAssets(params.referenceImages);
    const hasReferenceImage = hasUploadedAssets(params.referenceImage);

    if (!hasFirstFrame && !hasReferenceImages && !hasReferenceImage) {
      return "缺少首帧或参考图片，跳过当前样例";
    }
  }

  return undefined;
}

async function main() {
  const onlyModel = getArgValue("model");
  const onlyIndex = getArgValue("index");
  const baseUrl = (getArgValue("base-url") || envConfigs.app_url).replace(
    /\/+$/,
    "",
  );
  const delayMs = Number(getArgValue("delay-ms") || "0");
  const limit = Number(getArgValue("limit") || "0");
  const force = hasFlag("force");
  const dryRun = hasFlag("dry-run");
  const skipGeneratedAtPrefix = getArgValue("skip-generated-at-prefix");
  const cookie = (await readCookieValue()).trim();

  if (!baseUrl) {
    throw new Error("缺少 baseUrl，请通过 --base-url 或 NEXT_PUBLIC_APP_URL 提供");
  }

  if (!cookie && !dryRun) {
    throw new Error(
      "缺少登录 Cookie，请通过 --cookie、--cookie-file 或 GENERATION_COOKIE 提供",
    );
  }

  const sampleMap = JSON.parse(await fs.readFile(SAMPLES_PATH, "utf8")) as SampleMap;
  const modelUrls = Object.keys(sampleMap).filter(
    (modelUrl) => !onlyModel || modelUrl === onlyModel,
  );

  let processed = 0;

  for (const modelUrl of modelUrls) {
    const config = await getPlaygroundConfigByUrl(modelUrl);

    if (!config) {
      console.warn(`[${modelUrl}] 未找到 playground config，跳过`);
      continue;
    }

    const records = sampleMap[modelUrl] || [];

    for (let index = 0; index < records.length; index += 1) {
      if (onlyIndex !== undefined && index !== Number(onlyIndex)) {
        continue;
      }

      if (limit > 0 && processed >= limit) {
        await persistSamples(sampleMap);
        console.log(`已达到 limit=${limit}，停止执行`);
        return;
      }

      const record = records[index];

      if (!record?.params) {
        console.warn(`[${modelUrl}#${index}] 缺少 params，跳过`);
        continue;
      }

      if (
        force &&
        shouldSkipByGeneratedAtPrefix(
          record.generatedAt,
          skipGeneratedAtPrefix,
        )
      ) {
        console.log(
          `[${modelUrl}#${index}] generatedAt 命中 ${skipGeneratedAtPrefix}，跳过`,
        );
        continue;
      }

      if (!force && record.generatedUrl) {
        console.log(`[${modelUrl}#${index}] 已存在 generatedUrl，跳过`);
        continue;
      }

      if (dryRun) {
        console.log(
          `[dry-run] ${modelUrl}#${index} -> ${JSON.stringify(record.params)}`,
        );
        processed += 1;
        continue;
      }

      const skipReason = getSkipReason(config, record.params);
      if (skipReason) {
        record.generationSkippedReason = skipReason;
        delete record.generationError;
        await persistSamples(sampleMap);
        processed += 1;
        console.log(`[${modelUrl}#${index}] ${skipReason}`);
        continue;
      }

      console.log(`[${modelUrl}#${index}] 开始生成`);

      const result = await generateForSample({
        modelUrl,
        config,
        params: record.params,
        baseUrl,
        cookie,
      });

      if ("error" in result) {
        record.generationError = result.error;
        delete record.generationSkippedReason;
        console.warn(`[${modelUrl}#${index}] 生成失败: ${result.error}`);
      } else {
        record.generatedUrl = result.url;
        record.generatedUrls = result.urls;
        record.generatedAt = new Date().toISOString();
        delete record.generationError;
        delete record.generationSkippedReason;
        console.log(`[${modelUrl}#${index}] 生成成功: ${result.url}`);
      }

      await persistSamples(sampleMap);
      processed += 1;

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  await persistSamples(sampleMap);
  console.log(`生成完成，共处理 ${processed} 条样例`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
