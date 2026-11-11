import type { ResponseMapping } from "@/config/pricing-config";

export const DEFAULT_SUCCESS_STATUSES = ["completed", "success"];
export const DEFAULT_FAILURE_STATUSES = ["failed", "error"];

export function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined;

  const normalizedPath = String(path)
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(".");
  const parts: (string | number)[] = [];
  let currentPart = "";

  for (let i = 0; i < normalizedPath.length; i++) {
    const char = normalizedPath[i];
    if (char === ".") {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = "";
      }
    } else if (char === "[") {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = "";
      }
    } else if (char === "]") {
      if (currentPart) {
        const partValue = currentPart.trim();
        const index = parseInt(partValue, 10);
        parts.push(Number.isNaN(index) ? partValue : index);
        currentPart = "";
      }
    } else {
      currentPart += char;
    }
  }

  if (currentPart) {
    parts.push(currentPart.trim());
  }

  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

export function matchesMappedStatus(
  status: string | undefined,
  mappedStatuses: string[] | undefined,
  fallbackStatuses: string[],
): boolean {
  if (!status) {
    return false;
  }

  const normalizedStatus = status.toLowerCase();
  const statusList = (
    mappedStatuses && mappedStatuses.length > 0
      ? mappedStatuses
      : fallbackStatuses
  ).map((item) => item.toLowerCase());

  return statusList.includes(normalizedStatus);
}

export function isSuccessStatus(
  status: string | undefined,
  responseMapping?: ResponseMapping | any,
): boolean {
  return matchesMappedStatus(
    status,
    responseMapping?.successStatus,
    DEFAULT_SUCCESS_STATUSES,
  );
}

export function isFailureStatus(
  status: string | undefined,
  responseMapping?: ResponseMapping | any,
): boolean {
  return matchesMappedStatus(
    status,
    responseMapping?.failureStatus,
    DEFAULT_FAILURE_STATUSES,
  );
}

export function normalizeStatusForClient(
  status: string | undefined,
  responseMapping?: ResponseMapping | any,
): string {
  if (!status) {
    return "unknown";
  }

  if (isSuccessStatus(status, responseMapping)) {
    return "completed";
  }

  if (isFailureStatus(status, responseMapping)) {
    return "failed";
  }

  return "processing";
}

export function parseTaskResult(taskResult?: string | null) {
  if (!taskResult) {
    return null;
  }

  try {
    return JSON.parse(taskResult);
  } catch {
    return null;
  }
}

export function parseTaskOptions(taskOptions?: string | null) {
  if (!taskOptions) {
    return null;
  }

  try {
    return JSON.parse(taskOptions);
  } catch {
    return null;
  }
}

export function extractRequestId(
  payload: any,
  responseMapping?: ResponseMapping | any,
): string | undefined {
  if (responseMapping?.requestIdPath) {
    const extracted = getNestedValue(payload, responseMapping.requestIdPath);
    if (extracted !== null && extracted !== undefined) {
      return String(extracted).trim();
    }
  }

  const fallbackId =
    payload?.data?.id ||
    payload?.data?.task_id ||
    payload?.data?.request_id ||
    payload?.id ||
    payload?.task_id ||
    payload?.taskId ||
    payload?.request_id ||
    payload?.requestId;

  if (fallbackId !== null && fallbackId !== undefined) {
    return String(fallbackId).trim();
  }

  return undefined;
}

export function extractStatus(
  payload: any,
  responseMapping?: ResponseMapping | any,
) {
  if (responseMapping?.statusPath) {
    return getNestedValue(payload, responseMapping.statusPath);
  }

  return (
    payload?.data?.data?.status ||
    payload?.data?.status ||
    payload?.status ||
    payload?.state
  );
}

export function extractOutputs(
  payload: any,
  responseMapping?: ResponseMapping | any,
): { output?: string; outputs?: string[] } {
  let extractedOutput: any;

  if (responseMapping?.outputPath) {
    extractedOutput = getNestedValue(payload, responseMapping.outputPath);
  } else {
    extractedOutput =
      payload?.data?.outputs ||
      payload?.outputs ||
      payload?.data?.output ||
      payload?.output ||
      payload?.data?.image_url ||
      payload?.image_url ||
      payload?.data?.url ||
      payload?.url;
  }

  if (Array.isArray(extractedOutput)) {
    const outputs = extractedOutput.filter(
      (item: unknown) => typeof item === "string",
    );
    return {
      outputs,
      output: outputs[0],
    };
  }

  if (typeof extractedOutput === "string") {
    return {
      output: extractedOutput,
      outputs: [extractedOutput],
    };
  }

  return {};
}

export function extractError(
  payload: any,
  responseMapping?: ResponseMapping | any,
) {
  if (responseMapping?.errorPath) {
    return getNestedValue(payload, responseMapping.errorPath);
  }

  return payload?.error || payload?.message || payload?.data?.error;
}

export function normalizeOutputUrls(outputs?: string[], output?: string) {
  if (outputs && outputs.length > 0) {
    return outputs;
  }

  return output ? [output] : [];
}
