import fs from "node:fs/promises";
import path from "node:path";
import { getWavespeedProviderRuntimeConfig } from "../src/shared/lib/wavespeed-provider-config";

const REQUESTS_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/ai-girlfriend-prompt-requests.json",
);
const RESULTS_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/ai-girlfriend-generation-results.json",
);
const ASSETS_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/ai-girlfriend-assets.json",
);
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 120;
const FETCH_RETRY_ATTEMPTS = 4;
const FETCH_RETRY_DELAY_MS = 1500;

type RequestPayload = {
  promptId: string;
  baseProfileId: string;
  sectionId: string;
  variantId: string;
  body: {
    prompt: string;
    mediaType: "image";
    aspect_ratio: string;
    enable_base64_output: false;
    enable_sync_mode: false;
    seed: -1;
    resolution: string;
  };
};

type RequestFile = {
  generatedAt: string;
  baseProfiles?: Array<{
    id: string;
    title: string;
    prompt: string;
    body: {
      prompt: string;
      aspect_ratio: string;
      resolution: string;
      output_format: string;
      enable_web_search: false;
      enable_image_search: false;
      enable_sync_mode: false;
      enable_base64_output: false;
    };
  }>;
  api: {
    provider: string;
    textToImage: {
      model: string;
      endpoint: string;
      body: {
        prompt: string;
        resolution: string;
        output_format: string;
        enable_web_search: false;
        enable_image_search: false;
        enable_sync_mode: false;
        enable_base64_output: false;
      };
      note: string;
    };
    edit: {
      model: string;
      endpoint: string;
      note: string;
    };
  };
  baseProfileId: string;
  basePrompt: string;
  requests: RequestPayload[];
};

type SubmitResponse = {
  code?: number;
  message?: string;
  data?: {
    outputs?: string[];
    urls?: {
      get?: string;
    };
    status?: string;
    error?: string;
  };
};

type ResultRecord = {
  promptId: string;
  baseProfileId: string;
  sectionId: string;
  variantId: string;
  prompt: string;
  inputImageUrl: string;
  outputImageUrl?: string;
  status: "pending" | "completed" | "failed" | "skipped";
  error?: string;
  updatedAt: string;
};

type ResultsFile = {
  generatedAt: string;
  baseProfileId: string;
  baseImageUrl?: string;
  baseImageUrls?: Record<string, string>;
  filters: {
    section?: string;
    limit?: number;
  };
  summary: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  records: ResultRecord[];
};

type AssetIndexFile = {
  baseProfiles?: Array<{
    id: string;
    imageUrl?: string;
  }>;
  sections: Array<{
    id: string;
    items: Array<{
      baseProfileId?: string;
      variantId: string;
      imageUrl?: string;
      status: "ready" | "pending" | "failed";
    }>;
  }>;
};

function getLatestRecordOutputImageUrl(
  records: ResultRecord[],
  sectionId: string,
  variantId: string,
  baseProfileId: string,
) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (
      record.sectionId === sectionId &&
      record.variantId === variantId &&
      record.baseProfileId === baseProfileId &&
      record.outputImageUrl
    ) {
      return record.outputImageUrl;
    }
  }

  return undefined;
}

function repairBaseImageUrls(
  previous: ResultsFile | undefined,
  fallbackBaseImageUrls: Record<string, string>,
) {
  const repaired = { ...fallbackBaseImageUrls };

  for (const record of previous?.records ?? []) {
    if (
      record.sectionId === "ethnicity" &&
      record.variantId === record.baseProfileId &&
      record.baseProfileId &&
      record.inputImageUrl
    ) {
      repaired[record.baseProfileId] = record.inputImageUrl;
    }
  }

  return repaired;
}

function resolveEthnicityAnchorImageUrl(
  assets: AssetIndexFile | undefined,
  records: ResultRecord[],
  baseImageUrls: Record<string, string>,
  baseProfileId: string,
) {
  const recordImageUrl = getLatestRecordOutputImageUrl(
    records,
    "ethnicity",
    baseProfileId,
    baseProfileId,
  );
  if (recordImageUrl) {
    return recordImageUrl;
  }

  const ethnicitySection = assets?.sections.find(
    (section) => section.id === "ethnicity",
  );
  const ethnicityAsset = ethnicitySection?.items.find(
    (item) =>
      item.baseProfileId === baseProfileId &&
      item.variantId === baseProfileId &&
      item.imageUrl,
  );

  return ethnicityAsset?.imageUrl || baseImageUrls[baseProfileId] || "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  label: string,
  attempts = FETCH_RETRY_ATTEMPTS,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      console.warn(
        `${label} 第 ${attempt} 次网络请求失败，${FETCH_RETRY_DELAY_MS}ms 后重试...`,
      );
      await sleep(FETCH_RETRY_DELAY_MS * attempt);
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label} 网络请求失败: ${message}`);
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function pollResult(apiKey: string, resultUrl: string) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetchWithRetry(
      resultUrl,
      {
        headers: getHeaders(apiKey),
      },
      "查询结果",
    );

    if (!response.ok) {
      throw new Error(`查询结果失败: HTTP ${response.status}`);
    }

    const result = (await response.json()) as SubmitResponse;
    const data = result.data;

    if (result.code !== 200 || !data) {
      throw new Error(result.message || "查询结果失败: 返回结构异常");
    }

    if (data.outputs?.[0]) {
      return data.outputs[0];
    }

    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || `任务失败: ${data.status}`);
    }

    if (data.status === "completed") {
      throw new Error("任务已完成，但未返回输出图片");
    }
  }

  throw new Error("任务超时，未在规定时间内完成");
}

async function submitEditTask(
  apiKey: string,
  endpoint: string,
  imageUrl: string,
  request: RequestPayload,
) {
  const payload = {
    ...request.body,
    images: [imageUrl],
  };

  const response = await fetchWithRetry(
    endpoint,
    {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload),
    },
    `提交任务 ${request.sectionId}/${request.variantId}`,
  );

  if (!response.ok) {
    throw new Error(`提交任务失败: HTTP ${response.status}`);
  }

  const result = (await response.json()) as SubmitResponse;

  if (result.code !== 200 || !result.data) {
    throw new Error(result.message || "提交任务失败: 返回结构异常");
  }

  if (result.data.outputs?.[0]) {
    return result.data.outputs[0];
  }

  if (!result.data.urls?.get) {
    throw new Error("提交任务失败: 未返回结果查询地址");
  }

  return pollResult(apiKey, result.data.urls.get);
}

async function submitTextToImageTask(
  apiKey: string,
  endpoint: string,
  body: RequestFile["api"]["textToImage"]["body"],
) {
  const response = await fetchWithRetry(
    endpoint,
    {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify(body),
    },
    "提交 base 图任务",
  );

  if (!response.ok) {
    throw new Error(`提交 base 图任务失败: HTTP ${response.status}`);
  }

  const result = (await response.json()) as SubmitResponse;

  if (result.code !== 200 || !result.data) {
    throw new Error(result.message || "提交 base 图任务失败: 返回结构异常");
  }

  if (result.data.outputs?.[0]) {
    return result.data.outputs[0];
  }

  if (!result.data.urls?.get) {
    throw new Error("提交 base 图任务失败: 未返回结果查询地址");
  }

  return pollResult(apiKey, result.data.urls.get);
}

async function loadResults() {
  try {
    const raw = await fs.readFile(RESULTS_PATH, "utf8");
    return JSON.parse(raw) as ResultsFile;
  } catch {
    return undefined;
  }
}

async function loadAssets() {
  try {
    const raw = await fs.readFile(ASSETS_PATH, "utf8");
    return JSON.parse(raw) as AssetIndexFile;
  } catch {
    return undefined;
  }
}

function resolveInputImageUrl(
  assets: AssetIndexFile | undefined,
  records: ResultRecord[],
  baseImageUrls: Record<string, string>,
  request: RequestPayload,
) {
  const defaultBaseImageUrl =
    resolveEthnicityAnchorImageUrl(
      assets,
      records,
      baseImageUrls,
      request.baseProfileId,
    ) ||
    baseImageUrls[request.baseProfileId] ||
    "";

  if (request.sectionId === "ethnicity") {
    return baseImageUrls[request.baseProfileId] || defaultBaseImageUrl;
  }

  if (request.sectionId !== "hairColor" || !request.variantId.includes("__")) {
    return defaultBaseImageUrl;
  }

  const hairVariantId = request.variantId.split("__")[0];
  const latestHairRecordImageUrl = getLatestRecordOutputImageUrl(
    records,
    "hair",
    hairVariantId,
    request.baseProfileId,
  );
  if (latestHairRecordImageUrl) {
    return latestHairRecordImageUrl;
  }

  const hairSection = assets?.sections.find((section) => section.id === "hair");
  const hairItem = hairSection?.items.find(
    (item) =>
      item.variantId === hairVariantId &&
      item.baseProfileId === request.baseProfileId &&
      item.imageUrl,
  );

  const fallbackHairItem = hairSection?.items.find(
    (item) => item.variantId === hairVariantId && item.imageUrl,
  );

  return (
    hairItem?.imageUrl || fallbackHairItem?.imageUrl || defaultBaseImageUrl
  );
}

async function saveResults(results: ResultsFile) {
  await fs.writeFile(
    RESULTS_PATH,
    `${JSON.stringify(results, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const raw = await fs.readFile(REQUESTS_PATH, "utf8");
  const requestFile = JSON.parse(raw) as RequestFile;
  const previous = await loadResults();
  const assets = await loadAssets();
  const selectedBaseProfileId = getArgValue("base-profile-id");

  if (hasFlag("print-base-prompt")) {
    const selectedBaseProfile =
      requestFile.baseProfiles?.find(
        (profile) => profile.id === selectedBaseProfileId,
      ) ??
      requestFile.baseProfiles?.find(
        (profile) => profile.id === requestFile.baseProfileId,
      );
    console.log(selectedBaseProfile?.prompt ?? requestFile.basePrompt);
    return;
  }

  const { apiKey } = await getWavespeedProviderRuntimeConfig();

  const sectionFilter = getArgValue("section");
  const limitArg = getArgValue("limit");
  const limit = limitArg ? Number(limitArg) : undefined;
  const variantPrefix = getArgValue("variant-prefix");
  const force = hasFlag("force");
  const dryRun = hasFlag("dry-run");
  const retryFailed = hasFlag("retry-failed");
  const providedBaseImageUrl = getArgValue("base-image-url");

  let baseImageUrl = providedBaseImageUrl;

  const existingMap = new Map(
    previous?.records.map((record) => [record.promptId, record]),
  );
  const failedPromptIds = new Set(
    previous?.records
      .filter((record) => record.status === "failed")
      .map((record) => record.promptId) ?? [],
  );

  if (!baseImageUrl && dryRun) {
    baseImageUrl = "__DRY_RUN_BASE_IMAGE__";
  }

  if (!baseImageUrl && retryFailed && previous?.baseImageUrl) {
    baseImageUrl = previous.baseImageUrl;
  }

  const filtered = requestFile.requests.filter((item) => {
    if (selectedBaseProfileId && item.baseProfileId !== selectedBaseProfileId) {
      return false;
    }

    if (sectionFilter && item.sectionId !== sectionFilter) {
      return false;
    }

    if (variantPrefix && !item.variantId.startsWith(variantPrefix)) {
      return false;
    }

    if (retryFailed && !failedPromptIds.has(item.promptId)) {
      return false;
    }

    return true;
  });

  const targets =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? filtered.slice(0, limit)
      : filtered;

  const targetBaseProfileIds = [
    ...new Set(targets.map((item) => item.baseProfileId)),
  ];

  const baseImageUrls = {
    ...(previous?.baseImageUrls ?? {}),
  } as Record<string, string>;

  const repairedBaseImageUrls = repairBaseImageUrls(previous, baseImageUrls);
  Object.assign(baseImageUrls, repairedBaseImageUrls);

  if (
    previous?.baseImageUrl &&
    previous?.baseProfileId &&
    !baseImageUrls[previous.baseProfileId]
  ) {
    baseImageUrls[previous.baseProfileId] = previous.baseImageUrl;
  }

  if (baseImageUrl) {
    if (selectedBaseProfileId) {
      baseImageUrls[selectedBaseProfileId] = baseImageUrl;
    } else {
      targetBaseProfileIds.forEach((baseProfileId) => {
        baseImageUrls[baseProfileId] = baseImageUrl as string;
      });
    }
  }

  if (dryRun) {
    targetBaseProfileIds.forEach((baseProfileId) => {
      if (!baseImageUrls[baseProfileId]) {
        baseImageUrls[baseProfileId] = "__DRY_RUN_BASE_IMAGE__";
      }
    });
  }

  for (const baseProfileId of targetBaseProfileIds) {
    if (baseImageUrls[baseProfileId]) {
      continue;
    }

    const selectedBaseProfile =
      requestFile.baseProfiles?.find(
        (profile) => profile.id === baseProfileId,
      ) ??
      requestFile.baseProfiles?.find(
        (profile) => profile.id === requestFile.baseProfileId,
      );

    console.log(
      `未传入 ${baseProfileId} 的 base 图，开始通过 text-to-image 生成...`,
    );
    baseImageUrls[baseProfileId] = await submitTextToImageTask(
      apiKey,
      requestFile.api.textToImage.endpoint,
      selectedBaseProfile?.body ?? requestFile.api.textToImage.body,
    );
    console.log(
      `${baseProfileId} base 图生成完成: ${baseImageUrls[baseProfileId]}`,
    );
  }

  const resultRecordMap = new Map(existingMap);
  const results: ResultsFile = {
    generatedAt: new Date().toISOString(),
    baseProfileId: selectedBaseProfileId || requestFile.baseProfileId,
    baseImageUrl:
      baseImageUrls[selectedBaseProfileId || requestFile.baseProfileId] ||
      baseImageUrl,
    baseImageUrls,
    filters: {
      section: sectionFilter,
      limit,
    },
    summary: {
      total: requestFile.requests.length,
      completed: 0,
      failed: 0,
      skipped: 0,
    },
    records: previous?.records ?? [],
  };

  console.log(
    `baseProfile: ${selectedBaseProfileId || requestFile.baseProfileId}`,
  );
  console.log(
    `baseImageUrl: ${
      baseImageUrls[selectedBaseProfileId || requestFile.baseProfileId] ||
      "multi-base"
    }`,
  );
  console.log(`targetCount: ${targets.length}`);
  console.log(`sectionFilter: ${sectionFilter || "all"}`);
  console.log(`variantPrefix: ${variantPrefix || "none"}`);
  console.log(`limit: ${typeof limit === "number" ? limit : "none"}`);
  console.log(`retryFailed: ${retryFailed ? "yes" : "no"}`);
  console.log(`mode: ${dryRun ? "dry-run" : "execute"}`);

  for (const request of targets) {
    const existing = existingMap.get(request.promptId);
    const label = `[${request.sectionId}/${request.variantId}]`;

    if (existing?.outputImageUrl && !force) {
      resultRecordMap.set(request.promptId, {
        ...existing,
        status: existing.status === "completed" ? "completed" : "skipped",
        updatedAt: new Date().toISOString(),
      });
      console.log(`${label} 跳过: 已有结果，如需覆盖请加 --force`);
      continue;
    }

    if (dryRun) {
      resultRecordMap.set(request.promptId, {
        promptId: request.promptId,
        baseProfileId: request.baseProfileId,
        sectionId: request.sectionId,
        variantId: request.variantId,
        prompt: request.body.prompt,
        inputImageUrl: resolveInputImageUrl(
          assets,
          [...resultRecordMap.values()],
          baseImageUrls,
          request,
        ),
        status: "skipped",
        updatedAt: new Date().toISOString(),
      });
      console.log(`${label} dry-run`);
      continue;
    }

    console.log(`[${request.baseProfileId}] ${label} 提交中...`);

    try {
      const records = [...resultRecordMap.values()];
      const inputImageUrl = resolveInputImageUrl(
        assets,
        records,
        baseImageUrls,
        request,
      );
      const outputImageUrl = await submitEditTask(
        apiKey,
        requestFile.api.edit.endpoint,
        inputImageUrl,
        request,
      );

      resultRecordMap.set(request.promptId, {
        promptId: request.promptId,
        baseProfileId: request.baseProfileId,
        sectionId: request.sectionId,
        variantId: request.variantId,
        prompt: request.body.prompt,
        inputImageUrl,
        outputImageUrl,
        status: "completed",
        updatedAt: new Date().toISOString(),
      });
      results.records = [...resultRecordMap.values()];
      results.summary.completed = results.records.filter(
        (record) => record.status === "completed",
      ).length;
      results.summary.failed = results.records.filter(
        (record) => record.status === "failed",
      ).length;
      results.summary.skipped = results.records.filter(
        (record) => record.status === "skipped",
      ).length;
      await saveResults(results);
      console.log(`${label} 完成: ${outputImageUrl}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      resultRecordMap.set(request.promptId, {
        promptId: request.promptId,
        baseProfileId: request.baseProfileId,
        sectionId: request.sectionId,
        variantId: request.variantId,
        prompt: request.body.prompt,
        inputImageUrl: resolveInputImageUrl(
          assets,
          [...resultRecordMap.values()],
          baseImageUrls,
          request,
        ),
        status: "failed",
        error: message,
        updatedAt: new Date().toISOString(),
      });
      results.records = [...resultRecordMap.values()];
      results.summary.completed = results.records.filter(
        (record) => record.status === "completed",
      ).length;
      results.summary.failed = results.records.filter(
        (record) => record.status === "failed",
      ).length;
      results.summary.skipped = results.records.filter(
        (record) => record.status === "skipped",
      ).length;
      await saveResults(results);
      console.error(`${label} 失败: ${message}`);
    }
  }

  results.records = [...resultRecordMap.values()];
  results.summary.completed = results.records.filter(
    (record) => record.status === "completed",
  ).length;
  results.summary.failed = results.records.filter(
    (record) => record.status === "failed",
  ).length;
  results.summary.skipped = results.records.filter(
    (record) => record.status === "skipped",
  ).length;
  await saveResults(results);
  console.log(
    `处理完成: total=${results.summary.total}, completed=${results.summary.completed}, failed=${results.summary.failed}, skipped=${results.summary.skipped}`,
  );
  console.log(`结果文件: ${path.relative(process.cwd(), RESULTS_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
