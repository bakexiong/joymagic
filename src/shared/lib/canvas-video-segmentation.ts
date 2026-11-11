export const CANVAS_VIDEO_SEGMENTATION_SCENE = "canvas-video-segmentation";

export type CanvasVideoSegmentationBoxPrompt = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type CanvasVideoSegmentationApiBoxPrompt = {
  frame_index: number;
  object_id: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
};

export type CanvasVideoSegmentationPointPrompt = {
  x: number;
  y: number;
  label?: 0 | 1;
};

export type CanvasVideoSegmentationRequestBody = {
  video: string;
  duration: number;
  prompt: string;
  point_prompts?: CanvasVideoSegmentationPointPrompt[];
  box_prompts?: CanvasVideoSegmentationApiBoxPrompt[];
  apply_mask?: boolean;
};

export type CanvasSegmentationRle = {
  counts: string | number[];
  size: [number, number];
};

export type CanvasVideoSegmentationInvocation = {
  frameTime: number;
  duration: number;
  videoUrl: string;
  prompt?: string;
  boxPrompt: CanvasVideoSegmentationBoxPrompt;
};

export type CanvasVideoSegmentationResult = {
  mask: CanvasSegmentationRle | null;
};

function normalizeRleSize(value: unknown): [number, number] | null {
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  ) {
    return [Number(value[0]), Number(value[1])];
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const tupleRecord = value as unknown as { 0?: unknown; 1?: unknown };
    const height = record.height ?? record.h ?? record.rows ?? tupleRecord[0];
    const width = record.width ?? record.w ?? record.cols ?? tupleRecord[1];
    if (Number.isFinite(height) && Number.isFinite(width)) {
      return [Number(height), Number(width)];
    }
  }

  return null;
}

function normalizeRleCandidate(value: unknown): CanvasSegmentationRle | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return normalizeRleCandidate(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeRleCandidate(item);
      if (normalized) return normalized;
    }
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directSize = normalizeRleSize(record.size);
  const directCounts = record.counts;

  if (
    directSize &&
    (typeof directCounts === "string" ||
      (Array.isArray(directCounts) &&
        directCounts.every((item) => Number.isFinite(item))))
  ) {
    return {
      counts:
        typeof directCounts === "string"
          ? directCounts
          : directCounts.map((item) => Number(item)),
      size: directSize,
    };
  }

  const nestedCandidates = [
    record.rle,
    record.mask,
    record.segmentation,
    record.output,
    record.outputs,
    record.data,
  ];

  for (const candidate of nestedCandidates) {
    const normalized = normalizeRleCandidate(candidate);
    if (normalized) return normalized;
  }

  return null;
}

export function extractCanvasVideoSegmentationMask(
  payload: unknown,
): CanvasSegmentationRle | null {
  if (!payload || typeof payload !== "object") {
    return normalizeRleCandidate(payload);
  }

  const record = payload as Record<string, unknown>;
  return (
    normalizeRleCandidate(record.outputs) ||
    normalizeRleCandidate(record.output) ||
    normalizeRleCandidate(record.data) ||
    normalizeRleCandidate(payload)
  );
}
