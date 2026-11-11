import { AITaskStatus } from "@/extensions/ai";
import { updateAITaskById } from "@/shared/models/ai_task";

type UpdateAITaskMediaUrlsInput = {
  taskDbId: string;
  sourceUrls: string[];
  r2Urls: string[];
  existingResult?: unknown;
};

function parseExistingResult(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function buildAITaskResultWithR2Urls(
  sourceUrls: string[],
  r2Urls: string[],
  existingResult?: unknown,
) {
  const existing = parseExistingResult(existingResult);
  const replacementBySourceUrl = new Map(
    sourceUrls.map((url, index) => [url, r2Urls[index] || url]),
  );
  const existingOutputs = Array.isArray(existing.outputs)
    ? existing.outputs.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const outputUrls =
    existingOutputs.length > 0
      ? existingOutputs.map((url) => replacementBySourceUrl.get(url) || url)
      : sourceUrls.map((url, index) => r2Urls[index] || url);
  const existingOutput =
    typeof existing.output === "string" ? existing.output : null;
  const output =
    existingOutput && replacementBySourceUrl.has(existingOutput)
      ? replacementBySourceUrl.get(existingOutput)!
      : outputUrls[0] || null;
  const originalOutput =
    typeof existing.originalOutput === "string"
      ? existing.originalOutput
      : sourceUrls[0] || null;
  const originalOutputs = Array.isArray(existing.originalOutputs)
    ? existing.originalOutputs
    : sourceUrls;

  return {
    ...existing,
    output,
    outputs: outputUrls,
    originalOutput,
    originalOutputs,
  };
}

export async function updateAITaskMediaUrls({
  taskDbId,
  sourceUrls,
  r2Urls,
  existingResult,
}: UpdateAITaskMediaUrlsInput) {
  if (!taskDbId || r2Urls.length === 0) {
    return null;
  }

  const nextResult = buildAITaskResultWithR2Urls(
    sourceUrls,
    r2Urls,
    existingResult,
  );

  return updateAITaskById(taskDbId, {
    status: AITaskStatus.SUCCESS,
    taskResult: JSON.stringify(nextResult),
  });
}
