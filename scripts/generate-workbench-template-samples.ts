import fs from "node:fs/promises";
import path from "node:path";
import React from "react";

import { getPlaygroundConfigByUrl, REGISTRY_KEY_BY_URL } from "../src/shared/blocks/desktop-playground/playground-config-registry";
import { buildWorkbenchTemplateCatalog } from "../src/shared/lib/workbench-template-catalog";
import { writeWorkbenchTemplateShards } from "../src/shared/lib/server/workbench-template-shards";
import {
  inferWavespeedAspectRatio,
  mapWavespeedExampleParamsToWorkbench,
} from "../src/shared/lib/wavespeed-example-params";
import wavespeedModelProducts from "../src/shared/lib/wavespeed-model-products.json";
import { buildWavespeedMappingCandidates } from "../src/shared/lib/wavespeed-model-discovery";
import { getWavespeedExampleCandidatesByCurrentUrl } from "../src/shared/lib/wavespeed-model-mapping";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples.json",
);
const WAVESPEED_EXAMPLE_API =
  "https://wavespeed.ai/center/default/api/v1/model_product/example";
const DEFAULT_SIZE = 20;

type WavespeedExampleApiResponse = {
  code?: number;
  message?: string;
  data?: WavespeedExampleRecord[] | null;
};

type WavespeedExampleRecord = {
  model_id?: string;
  payload?: string;
  inputs?: string;
  outputs?: string;
};

type WavespeedOutputs = {
  outputs?: string[];
};

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

function requiresSourceAssets(config: NonNullable<Awaited<ReturnType<typeof getPlaygroundConfigByUrl>>>) {
  return (
    config.scenarioType === "image-to-image" ||
    config.scenarioType === "image-to-video"
  );
}

function hasRequiredSourceAssets(
  config: NonNullable<Awaited<ReturnType<typeof getPlaygroundConfigByUrl>>>,
  params: Record<string, any>,
) {
  if (config.scenarioType === "image-to-image") {
    return hasUploadedAssets(params.referenceImages);
  }

  if (config.scenarioType === "image-to-video") {
    return (
      hasUploadedAssets(params.firstFrameImage) ||
      hasUploadedAssets(params.referenceImages) ||
      hasUploadedAssets(params.referenceImage)
    );
  }

  return true;
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function safeParseJson<T>(value?: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function fetchOfficialExamples(examplePath: string, size: number) {
  const response = await fetch(
    `${WAVESPEED_EXAMPLE_API}/${examplePath}?size=${size}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; z-image.ai template sync)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`请求官方示例失败: HTTP ${response.status}`);
  }

  const json = (await response.json()) as WavespeedExampleApiResponse;
  return Array.isArray(json.data) ? json.data : [];
}

function getDiscoveredCandidateMap() {
  const discovered = buildWavespeedMappingCandidates(
    (wavespeedModelProducts.items || []) as Parameters<
      typeof buildWavespeedMappingCandidates
    >[0],
  );

  return Object.fromEntries(
    discovered.map((item) => [
      item.currentModelUrl,
      item.candidates.map((candidate) => candidate.product.model_uuid),
    ]),
  ) as Record<string, string[]>;
}

const DISCOVERED_CANDIDATE_MAP = getDiscoveredCandidateMap();

function getOfficialExampleCandidates(modelUrl: string) {
  const explicitCandidates = getWavespeedExampleCandidatesByCurrentUrl(modelUrl);
  const discoveredCandidates = DISCOVERED_CANDIDATE_MAP[modelUrl] || [];

  return Array.from(new Set([...explicitCandidates, ...discoveredCandidates]));
}

async function resolveOfficialExamples(modelUrl: string, size: number) {
  const candidates = getOfficialExampleCandidates(modelUrl);

  for (const candidate of candidates) {
    try {
      const examples = await fetchOfficialExamples(candidate, size);
      if (examples.length > 0) {
        return {
          examples,
          examplePath: candidate,
        };
      }
    } catch {
      // Continue to next candidate.
    }
  }

  return null;
}

async function main() {
  const size = Number(getArgValue("size") || String(DEFAULT_SIZE));
  const onlyModel = getArgValue("model");
  const entries = Object.keys(REGISTRY_KEY_BY_URL).filter(
    (modelUrl) => !onlyModel || modelUrl === onlyModel,
  );
  let payload: Record<string, unknown[]> = {};

  if (onlyModel) {
    const existing = await fs
      .readFile(OUTPUT_PATH, "utf8")
      .then((content) => safeParseJson<Record<string, unknown[]>>(content))
      .catch(() => null);

    if (existing) {
      payload = existing;
    }
  }

  for (const modelUrl of entries) {
    const config = await getPlaygroundConfigByUrl(modelUrl);

    if (!config) {
      continue;
    }

    const baseItems = await buildWorkbenchTemplateCatalog({
      modelUrl,
      modelLabel: config.model.name,
      config,
    });
    const resolved = await resolveOfficialExamples(modelUrl, size);

    if (!resolved) {
      payload[modelUrl] = baseItems.map((item) => ({
        prompt: item.prompt,
        params: item.params,
        previewUrl: item.previewUrl,
        thumbnailUrl: item.thumbnailUrl,
      }));
      continue;
    }

    try {
      const officialExamples = resolved.examples;
      const mergedItems = baseItems
        .map((item, index) => {
          const official = officialExamples[index];
          const officialInputs = safeParseJson<Record<string, any>>(
            official?.inputs || official?.payload,
          );
          const officialOutputs = safeParseJson<WavespeedOutputs>(official?.outputs);
          const previewUrl = officialOutputs?.outputs?.[0];
          const mappedParams = mapWavespeedExampleParamsToWorkbench({
            config,
            inputs: officialInputs,
          });
          const prompt = String(
            mappedParams.prompt || officialInputs?.prompt || item.prompt,
          );
          const officialAspectRatio = inferWavespeedAspectRatio(officialInputs);
          const params = {
            ...item.params,
            ...mappedParams,
            ...(officialAspectRatio ? { aspectRatio: officialAspectRatio } : {}),
            prompt,
          };

          if (requiresSourceAssets(config) && !hasRequiredSourceAssets(config, params)) {
            return null;
          }

          return {
            prompt,
            params,
            previewUrl,
            thumbnailUrl: previewUrl,
          };
        })
        .filter(Boolean);

      payload[modelUrl] = mergedItems;
      console.log(
        `[${modelUrl}] synced ${mergedItems.length} usable official examples from ${resolved.examplePath}`,
      );
    } catch (error) {
      payload[modelUrl] = requiresSourceAssets(config)
        ? []
        : baseItems.map((item) => ({
            prompt: item.prompt,
            params: item.params,
            previewUrl: item.previewUrl,
            thumbnailUrl: item.thumbnailUrl,
          }));
      console.warn(
        `[${modelUrl}] fallback to local templates: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeWorkbenchTemplateShards(payload);
  console.log(`模板参数已写入: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
