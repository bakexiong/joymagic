"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { createPortal } from "react-dom";
import {
  type MouseEvent as ReactMouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type ReactNode,
  type SyntheticEvent as ReactSyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocale } from "next-intl";
import {
  AudioLines,
  Bold,
  BoxSelect,
  Box,
  Boxes,
  Copy,
  Check,
  ArrowUp,
  Crop,
  Download,
  Eraser,
  Expand,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Lightbulb,
  Loader2,
  Menu,
  Minus,
  MoreHorizontal,
  Pilcrow,
  Paintbrush,
  Plus,
  Redo2,
  Scan,
  Scissors,
  Sparkles,
  Square,
  Undo2,
  Upload,
  Video,
  Wand2,
  X,
} from "lucide-react";

import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import type {
  CanvasSegmentationRle,
  CanvasVideoSegmentationInvocation,
  CanvasVideoSegmentationResult,
} from "@/shared/lib/canvas-video-segmentation";
import type {
  CanvasVideoUpscaleInvocation,
  CanvasVideoUpscaleTargetResolution,
} from "@/shared/lib/canvas-video-upscaler";
import { getMediaWsrvThumbnail } from "@/shared/lib/wsrv";
import { getCanvasCopy } from "../canvas-copy";
import type { CanvasImageToolRequest, CanvasNode } from "../core/canvas-types";
import { ImageRelightOverlay } from "./image-relight-overlay";
import { getCanvasNodePresentation } from "../nodes/render-node";

export type TapnowNodeData = {
  canvasNode: CanvasNode;
  selectedNodeId: string | null;
  onHandlePointerDown?: (
    nodeId: string,
    side: "left" | "right",
    point?: { x: number; y: number },
  ) => void;
  onNodeCommand: (
    nodeId: string,
    side: "left" | "right",
    position: { x: number; y: number },
  ) => void;
  onNodeTitleChange: (nodeId: string, title: string) => void;
  onTextChange: (nodeId: string, content: string) => void;
  onTextBackgroundChange: (nodeId: string, backgroundColor?: string) => void;
  onImageUpload: (nodeId: string, file: File) => Promise<void>;
  onImageCrop: (nodeId: string, file: File) => Promise<void>;
  onVideoTrim: (
    nodeId: string,
    file: File,
    meta: { trimStart: number; trimEnd: number; duration: number },
  ) => Promise<void>;
  onVideoSegmentation: (
    nodeId: string,
    request: CanvasVideoSegmentationInvocation,
  ) => Promise<CanvasVideoSegmentationResult>;
  onVideoUpscale: (
    nodeId: string,
    request: CanvasVideoUpscaleInvocation,
  ) => Promise<void>;
  onImageToolAction: (request: CanvasImageToolRequest) => Promise<void>;
  isReferenceSelectionActive?: boolean;
  isReferenceSelectionEligible?: boolean;
  isReferenceSelectionPicked?: boolean;
  isReferenceSelectionAnchor?: boolean;
  isConnectionModeActive?: boolean;
  isConnectionAnchor?: boolean;
  isConnectionCandidate?: boolean;
  isConnectionTargetActive?: boolean;
  connectionTargetSide?: "left" | "right" | null;
  hasReferenceInput?: boolean;
} & Record<string, unknown>;

const TEXT_BACKGROUND_COLORS = [
  { label: "无背景", value: undefined, swatch: "transparent" },
  { label: "酒红", value: "#4a2526", swatch: "#4a2526" },
  { label: "棕橙", value: "#7a4214", swatch: "#7a4214" },
  { label: "橄榄", value: "#716827", swatch: "#716827" },
  { label: "绿", value: "#2d6d42", swatch: "#2d6d42" },
  { label: "青", value: "#2c7180", swatch: "#2c7180" },
  { label: "蓝", value: "#2d5b93", swatch: "#2d5b93" },
  { label: "紫", value: "#7c3b94", swatch: "#7c3b94" },
];

function getHandleMenuPosition(node: CanvasNode, side: "left" | "right") {
  return {
    x: node.position.x + (side === "right" ? node.size.width + 88 : -88),
    y: node.position.y + node.size.height / 2,
  };
}

function formatVideoTime(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const minutes = Math.floor(safeValue / 60);
  const seconds = Math.floor(safeValue % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function resolveVideoDuration(videoUrl: string, fallbackDuration = 0) {
  if (Number.isFinite(fallbackDuration) && fallbackDuration > 0) {
    return fallbackDuration;
  }

  const video = document.createElement("video");
  video.preload = "metadata";
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;

  try {
    return await new Promise<number>((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("error", handleError);
      };

      const handleLoadedMetadata = () => {
        cleanup();
        resolve(
          Number.isFinite(video.duration) && video.duration > 0
            ? video.duration
            : 0,
        );
      };

      const handleError = () => {
        cleanup();
        reject(new Error("无法读取视频总时长"));
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("error", handleError);
      video.src = videoUrl;
      video.load();
    });
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}

function getForcedDownloadUrl(resourceUrl: string, filename: string) {
  try {
    const url = new URL(resourceUrl, window.location.origin);
    const disposition = `attachment; filename="${filename}"`;
    url.searchParams.set("response-content-disposition", disposition);
    return url.toString();
  } catch {
    return resourceUrl;
  }
}

function sanitizeDownloadFilename(name: string, fallbackExtension: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return `download.${fallbackExtension}`;
  }

  return /\.[a-z0-9]+$/i.test(trimmed)
    ? trimmed
    : `${trimmed}.${fallbackExtension}`;
}

function getSupportedVideoRecorderMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find(
    (candidate) =>
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(candidate),
  );
}

type SmartClipSegment = {
  start: number;
  end: number;
};

const SMART_CLIP_MIN_SEGMENT_DURATION = 0.5;
const SMART_CLIP_MAX_SEGMENTS = 12;
const SMART_CLIP_MAX_FILE_BYTES = 300 * 1024 * 1024;
const SMART_CLIP_FRAME_WIDTH = 40;
const SMART_CLIP_FRAME_HEIGHT = 24;

async function trimVideoClipToFile(params: {
  videoUrl: string;
  trimStart: number;
  trimEnd: number;
}) {
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.src = params.videoUrl;
  video.style.position = "absolute";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.left = "-9999px";
  video.setAttribute("aria-hidden", "true");
  document.body.appendChild(video);

  const cleanup = () => {
    try {
      video.pause();
    } catch {
      // ignore cleanup errors
    }
    video.removeAttribute("src");
    video.load();
    video.remove();
  };

  const waitForEvent = <T extends keyof HTMLMediaElementEventMap>(
    eventName: T,
    timeoutMs: number,
  ) =>
    new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        video.removeEventListener(eventName, handleResolve);
        video.removeEventListener("error", handleReject);
        reject(new Error(`Video ${eventName} timeout`));
      }, timeoutMs);

      const handleResolve = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener("error", handleReject);
        resolve();
      };

      const handleReject = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener(eventName, handleResolve);
        reject(new Error("Video operation failed"));
      };

      video.addEventListener(eventName, handleResolve, { once: true });
      video.addEventListener("error", handleReject, { once: true });
    });

  try {
    if (!(Number.isFinite(video.duration) && video.duration > 0)) {
      await waitForEvent("loadedmetadata", 15000);
    }

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const safeStart = Math.max(0, Math.min(params.trimStart, duration));
    const safeEnd = Math.max(
      safeStart + 0.1,
      Math.min(params.trimEnd, duration),
    );

    const captureVideo = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const captureStream =
      typeof captureVideo.captureStream === "function"
        ? () => captureVideo.captureStream!()
        : typeof captureVideo.mozCaptureStream === "function"
          ? () => captureVideo.mozCaptureStream!()
          : null;

    if (!captureStream) {
      throw new Error("当前浏览器不支持视频裁切导出");
    }

    video.currentTime = safeStart;
    await waitForEvent("seeked", 10000);

    const stream = captureStream();
    const recorderMimeType = getSupportedVideoRecorderMimeType();
    const recorder = new MediaRecorder(
      stream,
      recorderMimeType ? { mimeType: recorderMimeType } : undefined,
    );
    const chunks: BlobPart[] = [];

    const blob = await new Promise<Blob>((resolve, reject) => {
      let settled = false;
      let stopTimer = 0;
      let hardTimeout = 0;

      const finalize = (error?: Error) => {
        if (settled) return;
        settled = true;
        if (stopTimer) window.clearTimeout(stopTimer);
        if (hardTimeout) window.clearTimeout(hardTimeout);
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

        if (error) {
          reject(error);
          return;
        }

        const result = new Blob(chunks, {
          type: recorder.mimeType || "video/webm",
        });
        if (!result.size) {
          reject(new Error("未生成可用的视频片段"));
          return;
        }
        resolve(result);
      };

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunks.push(event.data);
        }
      };
      recorder.onerror = () => finalize(new Error("视频裁切录制失败"));
      recorder.onstop = () => finalize();

      video.ontimeupdate = () => {
        if (!settled && video.currentTime >= safeEnd - 0.02) {
          try {
            video.pause();
          } catch {
            // ignore
          }
          if (recorder.state === "recording") {
            recorder.stop();
          } else {
            finalize();
          }
        }
      };

      hardTimeout = window.setTimeout(
        () => {
          if (recorder.state === "recording") {
            recorder.stop();
            return;
          }
          finalize(new Error("视频裁切超时"));
        },
        Math.max(12000, (safeEnd - safeStart) * 1000 + 8000),
      );

      recorder.start(250);
      void video.play().catch(() => {
        finalize(new Error("视频预览播放失败"));
      });

      stopTimer = window.setTimeout(
        () => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        },
        Math.max(500, (safeEnd - safeStart) * 1000 + 400),
      );
    });

    return new File([blob], `trimmed-${Date.now()}.webm`, {
      type: blob.type || "video/webm",
    });
  } finally {
    cleanup();
  }
}

async function createReadyVideoSnapshot(params: {
  videoUrl: string;
  currentTime: number;
}) {
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.src = params.videoUrl;
  video.style.position = "absolute";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.left = "-9999px";
  video.setAttribute("aria-hidden", "true");
  document.body.appendChild(video);

  const cleanup = () => {
    try {
      video.pause();
    } catch {
      // ignore
    }
    video.removeAttribute("src");
    video.load();
    video.remove();
  };

  const waitForEvent = <T extends keyof HTMLMediaElementEventMap>(
    eventName: T,
    timeoutMs: number,
  ) =>
    new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        video.removeEventListener(eventName, handleResolve);
        video.removeEventListener("error", handleReject);
        reject(new Error("视频加载超时，请稍后重试"));
      }, timeoutMs);

      const handleResolve = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener("error", handleReject);
        resolve();
      };

      const handleReject = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener(eventName, handleResolve);
        reject(new Error("视频尚未就绪，请稍后重试"));
      };

      video.addEventListener(eventName, handleResolve, { once: true });
      video.addEventListener("error", handleReject, { once: true });
    });

  try {
    await waitForEvent("loadedmetadata", 15000);

    const safeDuration = Number.isFinite(video.duration) ? video.duration : 0;
    const targetTime = Math.max(
      0,
      Math.min(params.currentTime || 0, Math.max(safeDuration - 0.05, 0)),
    );

    if (video.readyState < 2) {
      await waitForEvent("loadeddata", 15000);
    }

    video.currentTime = targetTime;
    await waitForEvent("seeked", 10000);

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      throw new Error("视频尚未就绪，请稍后重试");
    }

    const frameDataUrl = captureVideoFrameDataUrl(video);
    return {
      frameDataUrl,
      width: video.videoWidth,
      height: video.videoHeight,
      duration: safeDuration,
      currentTime: targetTime,
    };
  } finally {
    cleanup();
  }
}

function calculateFrameDifference(
  previous: Uint8ClampedArray,
  current: Uint8ClampedArray,
) {
  const length = Math.min(previous.length, current.length);
  if (!length) return 0;

  let totalDifference = 0;
  for (let index = 0; index < length; index += 4) {
    totalDifference += Math.abs(previous[index] - current[index]);
    totalDifference += Math.abs(previous[index + 1] - current[index + 1]);
    totalDifference += Math.abs(previous[index + 2] - current[index + 2]);
  }

  return totalDifference / Math.max(1, (length / 4) * 3);
}

function buildSmartClipSegments(duration: number, cutPoints: number[]) {
  if (!cutPoints.length || duration <= SMART_CLIP_MIN_SEGMENT_DURATION) {
    return [] as SmartClipSegment[];
  }

  const segments: SmartClipSegment[] = [];
  let segmentStart = 0;

  cutPoints.forEach((cutPoint) => {
    const safeCutPoint = Math.max(
      segmentStart + SMART_CLIP_MIN_SEGMENT_DURATION,
      Math.min(cutPoint, duration),
    );
    if (safeCutPoint - segmentStart >= SMART_CLIP_MIN_SEGMENT_DURATION) {
      segments.push({
        start: Number(segmentStart.toFixed(2)),
        end: Number(safeCutPoint.toFixed(2)),
      });
      segmentStart = safeCutPoint;
    }
  });

  if (duration - segmentStart >= SMART_CLIP_MIN_SEGMENT_DURATION) {
    segments.push({
      start: Number(segmentStart.toFixed(2)),
      end: Number(duration.toFixed(2)),
    });
  }

  return segments.slice(0, SMART_CLIP_MAX_SEGMENTS);
}

async function analyzeSmartClipSegments(params: {
  videoUrl: string;
  duration: number;
  onProgress?: (current: number, total: number) => void;
}) {
  const response = await fetch(params.videoUrl);
  if (!response.ok) {
    throw new Error("智能剪辑分析失败，无法读取视频");
  }

  const sourceBlob = await response.blob();
  if (sourceBlob.size > SMART_CLIP_MAX_FILE_BYTES) {
    throw new Error(
      `视频文件过大（${(sourceBlob.size / 1024 / 1024).toFixed(1)} MB），当前智能剪辑上限 300 MB`,
    );
  }

  const objectUrl = URL.createObjectURL(sourceBlob);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.src = objectUrl;
  video.style.position = "absolute";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.left = "-9999px";
  video.setAttribute("aria-hidden", "true");
  document.body.appendChild(video);

  const cleanup = () => {
    try {
      video.pause();
    } catch {
      // ignore cleanup errors
    }
    video.removeAttribute("src");
    video.load();
    video.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const waitForVideoEvent = <T extends keyof HTMLMediaElementEventMap>(
    eventName: T,
    timeoutMs: number,
  ) =>
    new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        video.removeEventListener(eventName, handleResolve);
        video.removeEventListener("error", handleReject);
        reject(new Error("智能剪辑分析超时"));
      }, timeoutMs);

      const handleResolve = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener("error", handleReject);
        resolve();
      };

      const handleReject = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener(eventName, handleResolve);
        reject(new Error("智能剪辑分析失败"));
      };

      video.addEventListener(eventName, handleResolve, { once: true });
      video.addEventListener("error", handleReject, { once: true });
    });

  try {
    await waitForVideoEvent("loadedmetadata", 15000);

    const safeDuration = Math.max(
      0,
      Math.min(
        Number.isFinite(video.duration) ? video.duration : params.duration,
        params.duration || video.duration || 0,
      ),
    );
    if (safeDuration <= 1) {
      return [] as SmartClipSegment[];
    }

    const sampleStep =
      safeDuration <= 8
        ? 0.25
        : safeDuration <= 20
          ? 0.4
          : safeDuration <= 45
            ? 0.6
            : 0.85;
    const sampleTimes: number[] = [];
    for (let time = 0; time < safeDuration; time += sampleStep) {
      sampleTimes.push(Number(time.toFixed(3)));
    }
    if (sampleTimes[sampleTimes.length - 1] !== safeDuration) {
      sampleTimes.push(Number(safeDuration.toFixed(3)));
    }

    const canvas = document.createElement("canvas");
    canvas.width = SMART_CLIP_FRAME_WIDTH;
    canvas.height = SMART_CLIP_FRAME_HEIGHT;
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!context) {
      throw new Error("当前浏览器不支持智能剪辑分析");
    }

    let previousFrame: Uint8ClampedArray | null = null;
    const frameDiffs: Array<{ time: number; diff: number }> = [];

    for (let index = 0; index < sampleTimes.length; index += 1) {
      const sampleTime = sampleTimes[index];
      video.currentTime = sampleTime;
      await waitForVideoEvent("seeked", 10000);
      context.drawImage(
        video,
        0,
        0,
        SMART_CLIP_FRAME_WIDTH,
        SMART_CLIP_FRAME_HEIGHT,
      );
      const frameData = context.getImageData(
        0,
        0,
        SMART_CLIP_FRAME_WIDTH,
        SMART_CLIP_FRAME_HEIGHT,
      ).data;
      const nextFrame = new Uint8ClampedArray(frameData);
      if (previousFrame) {
        frameDiffs.push({
          time: sampleTime,
          diff: calculateFrameDifference(previousFrame, nextFrame),
        });
      }
      previousFrame = nextFrame;
      params.onProgress?.(index + 1, sampleTimes.length);
    }

    if (!frameDiffs.length) {
      return [] as SmartClipSegment[];
    }

    const diffValues = frameDiffs.map((item) => item.diff);
    const mean =
      diffValues.reduce((total, value) => total + value, 0) / diffValues.length;
    const variance =
      diffValues.reduce(
        (total, value) => total + (value - mean) * (value - mean),
        0,
      ) / diffValues.length;
    const standardDeviation = Math.sqrt(Math.max(variance, 0));
    const sortedDiffs = [...diffValues].sort((left, right) => left - right);
    const quantileIndex = Math.min(
      sortedDiffs.length - 1,
      Math.floor(sortedDiffs.length * 0.88),
    );
    const quantileValue = sortedDiffs[Math.max(0, quantileIndex)] || 0;
    const threshold = Math.max(
      mean + standardDeviation * 1.2,
      quantileValue,
      22,
    );

    const cutPoints: number[] = [];
    let lastCutPoint = 0;

    frameDiffs.forEach((item, index) => {
      const previousDiff = frameDiffs[index - 1]?.diff ?? 0;
      const nextDiff = frameDiffs[index + 1]?.diff ?? 0;
      const isPeak = item.diff >= previousDiff && item.diff >= nextDiff;
      const isFarEnough =
        item.time - lastCutPoint >= SMART_CLIP_MIN_SEGMENT_DURATION;
      const leavesTail =
        safeDuration - item.time >= SMART_CLIP_MIN_SEGMENT_DURATION;

      if (!isPeak || !isFarEnough || !leavesTail || item.diff < threshold) {
        return;
      }

      cutPoints.push(Number(item.time.toFixed(2)));
      lastCutPoint = item.time;
    });

    return buildSmartClipSegments(safeDuration, cutPoints);
  } finally {
    cleanup();
  }
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 12 12" className="size-3.5 fill-current" aria-hidden>
      <path d="M3 2.2L9.2 6 3 9.8V2.2Z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 12 12" className="size-3.5 fill-current" aria-hidden>
      <path d="M2.5 2h2.2v8H2.5zM7.3 2h2.2v8H7.3z" />
    </svg>
  );
}

function HoverPlayableVideo({
  src,
  className,
  roundedClassName = "rounded-[18px]",
  muted = true,
  hoverEnabled = true,
  onLoadedMetadata,
  onTimeUpdate,
  onPlay,
  onPause,
  videoRef,
}: {
  src: string;
  className: string;
  roundedClassName?: string;
  muted?: boolean;
  hoverEnabled?: boolean;
  onLoadedMetadata?: (event: ReactSyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate?: (event: ReactSyntheticEvent<HTMLVideoElement>) => void;
  onPlay?: () => void;
  onPause?: () => void;
  videoRef?: RefObject<HTMLVideoElement | null>;
}) {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const resolvedVideoRef = videoRef ?? internalVideoRef;

  const handleMouseEnter = () => {
    if (!hoverEnabled) return;
    const element = resolvedVideoRef.current;
    if (!element) return;
    void element.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    if (!hoverEnabled) return;
    const element = resolvedVideoRef.current;
    if (!element) return;
    element.pause();
    element.currentTime = 0;
  };

  return (
    <video
      ref={resolvedVideoRef}
      src={src}
      className={`${className} ${roundedClassName}`}
      muted={muted}
      loop
      playsInline
      preload="metadata"
      crossOrigin="anonymous"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onLoadedMetadata={onLoadedMetadata}
      onTimeUpdate={onTimeUpdate}
      onPlay={onPlay}
      onPause={onPause}
    />
  );
}

type NormalizedSelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function isValidSelectionRect(value: NormalizedSelectionRect | null) {
  return Boolean(
    value &&
    value.width > 0.01 &&
    value.height > 0.01 &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y),
  );
}

function getMediaCoverLayout(params: {
  mediaWidth: number;
  mediaHeight: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const safeMediaWidth = Math.max(params.mediaWidth, 1);
  const safeMediaHeight = Math.max(params.mediaHeight, 1);
  const safeContainerWidth = Math.max(params.containerWidth, 1);
  const safeContainerHeight = Math.max(params.containerHeight, 1);
  const scale = Math.max(
    safeContainerWidth / safeMediaWidth,
    safeContainerHeight / safeMediaHeight,
  );

  return {
    scale,
    width: safeMediaWidth * scale,
    height: safeMediaHeight * scale,
    offsetX: (safeContainerWidth - safeMediaWidth * scale) / 2,
    offsetY: (safeContainerHeight - safeMediaHeight * scale) / 2,
  };
}

function selectionToVideoBoxPrompt(
  selection: NormalizedSelectionRect,
  videoWidth: number,
  videoHeight: number,
) {
  const safeVideoWidth = Math.max(videoWidth || 0, 1);
  const safeVideoHeight = Math.max(videoHeight || 0, 1);
  const x1 = Math.max(
    0,
    Math.min(safeVideoWidth, selection.x * safeVideoWidth),
  );
  const y1 = Math.max(
    0,
    Math.min(safeVideoHeight, selection.y * safeVideoHeight),
  );
  const x2 = Math.max(
    0,
    Math.min(safeVideoWidth, (selection.x + selection.width) * safeVideoWidth),
  );
  const y2 = Math.max(
    0,
    Math.min(
      safeVideoHeight,
      (selection.y + selection.height) * safeVideoHeight,
    ),
  );

  return {
    x1: Math.round(Math.min(x1, x2)),
    y1: Math.round(Math.min(y1, y2)),
    x2: Math.round(Math.max(x1, x2)),
    y2: Math.round(Math.max(y1, y2)),
  };
}

function captureVideoFrameDataUrl(videoElement: HTMLVideoElement) {
  const width = Math.max(videoElement.videoWidth || 0, 1);
  const height = Math.max(videoElement.videoHeight || 0, 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法创建视频帧画布");
  }
  context.drawImage(videoElement, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法加载分割预览图像"));
    image.src = src;
  });
}

function decodeCompressedRleCounts(encoded: string) {
  const counts: number[] = [];
  let index = 0;
  let cursor = 0;

  while (cursor < encoded.length) {
    let value = 0;
    let shift = 0;
    let current = 0;

    do {
      current = encoded.charCodeAt(cursor) - 48;
      value |= (current & 0x1f) << (5 * shift);
      cursor += 1;
      shift += 1;
    } while (current & 0x20);

    if (current & 0x10) {
      value |= -1 << (5 * shift);
    }

    if (index > 1) {
      value += counts[index - 2];
    }

    counts.push(value);
    index += 1;
  }

  return counts;
}

function expandRleCounts(counts: string | number[]) {
  return typeof counts === "string"
    ? decodeCompressedRleCounts(counts)
    : counts;
}

function drawSegmentationMaskToCanvas(params: {
  canvas: HTMLCanvasElement;
  mask: CanvasSegmentationRle;
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const context = params.canvas.getContext("2d");
  if (!context) return;

  const targetWidth = Math.max(Math.round(params.containerWidth), 1);
  const targetHeight = Math.max(Math.round(params.containerHeight), 1);
  params.canvas.width = targetWidth;
  params.canvas.height = targetHeight;
  context.clearRect(0, 0, targetWidth, targetHeight);

  const [maskHeight, maskWidth] = params.mask.size;
  if (!maskHeight || !maskWidth) return;

  const expandedCounts = expandRleCounts(params.mask.counts);
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;
  const maskContext = maskCanvas.getContext("2d");
  if (!maskContext) return;

  const imageData = maskContext.createImageData(maskWidth, maskHeight);
  let pixelIndex = 0;
  let fill = 0;

  for (const runLength of expandedCounts) {
    const safeRunLength = Math.max(0, Math.floor(runLength));
    for (
      let step = 0;
      step < safeRunLength && pixelIndex < maskWidth * maskHeight;
      step += 1
    ) {
      if (fill === 1) {
        const row = pixelIndex % maskHeight;
        const column = Math.floor(pixelIndex / maskHeight);
        const rgbaIndex = (row * maskWidth + column) * 4;
        imageData.data[rgbaIndex] = 255;
        imageData.data[rgbaIndex + 1] = 255;
        imageData.data[rgbaIndex + 2] = 255;
        imageData.data[rgbaIndex + 3] = 255;
      }
      pixelIndex += 1;
    }
    fill = fill === 0 ? 1 : 0;
  }

  maskContext.putImageData(imageData, 0, 0);

  const layout = getMediaCoverLayout({
    mediaWidth: params.videoWidth,
    mediaHeight: params.videoHeight,
    containerWidth: targetWidth,
    containerHeight: targetHeight,
  });

  context.save();
  context.globalAlpha = 0.34;
  context.drawImage(
    maskCanvas,
    layout.offsetX,
    layout.offsetY,
    layout.width,
    layout.height,
  );
  context.restore();
}

async function buildVideoCleanCardPreview(params: {
  frameDataUrl: string;
  mask: CanvasSegmentationRle;
  boxPrompt: { x1: number; y1: number; x2: number; y2: number };
}) {
  const image = await loadImageElement(params.frameDataUrl);
  const [maskHeight, maskWidth] = params.mask.size;
  if (!maskHeight || !maskWidth) {
    throw new Error("蒙层尺寸无效");
  }

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;
  const maskContext = maskCanvas.getContext("2d");
  if (!maskContext) {
    throw new Error("无法创建蒙层画布");
  }

  const imageData = maskContext.createImageData(maskWidth, maskHeight);
  const expandedCounts = expandRleCounts(params.mask.counts);
  let pixelIndex = 0;
  let fill = 0;

  for (const runLength of expandedCounts) {
    const safeRunLength = Math.max(0, Math.floor(runLength));
    for (
      let step = 0;
      step < safeRunLength && pixelIndex < maskWidth * maskHeight;
      step += 1
    ) {
      if (fill === 1) {
        const row = pixelIndex % maskHeight;
        const column = Math.floor(pixelIndex / maskHeight);
        const rgbaIndex = (row * maskWidth + column) * 4;
        imageData.data[rgbaIndex] = 255;
        imageData.data[rgbaIndex + 1] = 255;
        imageData.data[rgbaIndex + 2] = 255;
        imageData.data[rgbaIndex + 3] = 255;
      }
      pixelIndex += 1;
    }
    fill = fill === 0 ? 1 : 0;
  }

  maskContext.putImageData(imageData, 0, 0);

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  const sourceContext = sourceCanvas.getContext("2d");
  if (!sourceContext) {
    throw new Error("无法创建源图画布");
  }

  sourceContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
  sourceContext.globalCompositeOperation = "destination-in";
  sourceContext.drawImage(
    maskCanvas,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );
  sourceContext.globalCompositeOperation = "source-over";

  const padX = Math.max(
    8,
    Math.round((params.boxPrompt.x2 - params.boxPrompt.x1) * 0.14),
  );
  const padY = Math.max(
    8,
    Math.round((params.boxPrompt.y2 - params.boxPrompt.y1) * 0.14),
  );
  const cropX = Math.max(0, params.boxPrompt.x1 - padX);
  const cropY = Math.max(0, params.boxPrompt.y1 - padY);
  const cropWidth = Math.min(
    image.naturalWidth - cropX,
    Math.max(1, params.boxPrompt.x2 - params.boxPrompt.x1 + padX * 2),
  );
  const cropHeight = Math.min(
    image.naturalHeight - cropY,
    Math.max(1, params.boxPrompt.y2 - params.boxPrompt.y1 + padY * 2),
  );

  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = cropWidth;
  previewCanvas.height = cropHeight;
  const previewContext = previewCanvas.getContext("2d");
  if (!previewContext) {
    throw new Error("无法创建预览画布");
  }

  previewContext.fillStyle = "#19191b";
  previewContext.fillRect(0, 0, cropWidth, cropHeight);
  previewContext.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return previewCanvas.toDataURL("image/png");
}

function NodePreview({
  node,
  thumbnailUrl,
}: {
  node: CanvasNode;
  thumbnailUrl?: string;
}) {
  const isVideoThumbnail =
    (node.kind === "result" && node.data.mediaKind === "video") ||
    (node.kind === "input" && node.data.mediaKind === "video") ||
    (node.kind === "workflow" &&
      (node.subtype === "text-to-video" || node.subtype === "image-to-video"));

  if (
    (node.kind === "workflow" ||
      node.kind === "result" ||
      node.kind === "input") &&
    node.data.status === "generating"
  ) {
    return (
      <div className="tapnow-node-loading" aria-hidden>
        <div className="tapnow-node-loading-sheen" />
        <div className="tapnow-node-loading-split" />
      </div>
    );
  }

  if (thumbnailUrl) {
    if (isVideoThumbnail) {
      return (
        <HoverPlayableVideo
          src={thumbnailUrl}
          className="h-full w-full rounded-[18px] object-cover"
        />
      );
    }

    return (
      <img
        src={getMediaWsrvThumbnail(thumbnailUrl, "image", {
          width: 600,
        })}
        alt=""
        className="h-full w-full rounded-[18px] object-cover"
      />
    );
  }

  if (node.kind === "input" && node.data.mediaKind === "audio") {
    return <AudioLines className="size-8 text-white/42" />;
  }

  if (
    node.kind === "workflow" &&
    (node.subtype === "text-to-video" || node.subtype === "image-to-video")
  ) {
    return <Video className="size-8 text-white/32" />;
  }

  if (
    (node.kind === "result" && node.data.mediaKind === "video") ||
    (node.kind === "input" && node.data.mediaKind === "video")
  ) {
    return <Video className="size-8 text-white/32" />;
  }

  return <ImageIcon className="size-8 text-white/32" />;
}

function TapnowHandle({
  side,
  node,
  forceVisible,
  forceHidden,
  onHandlePointerDown,
  onNodeCommand,
}: {
  side: "left" | "right";
  node: CanvasNode;
  forceVisible: boolean;
  forceHidden?: boolean;
  onHandlePointerDown?: TapnowNodeData["onHandlePointerDown"];
  onNodeCommand: TapnowNodeData["onNodeCommand"];
}) {
  const type = side === "left" ? "target" : "source";
  return (
    <Handle
      id={side}
      type={type}
      position={side === "left" ? Position.Left : Position.Right}
      aria-label={side === "right" ? "继续生成" : "引用到此节点"}
      className={[
        "tapnow-handle nodrag nopan node-handle-plus",
        side === "right"
          ? "tapnow-handle-right node-handle-plus-right"
          : "tapnow-handle-left node-handle-plus-left",
        forceVisible ? "node-handle-plus-visible" : "",
        forceHidden ? "node-handle-plus-force-hidden" : "",
      ].join(" ")}
      onPointerDown={(event) => {
        onHandlePointerDown?.(node.id, side, {
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
      }}
      isConnectable
    >
      <Plus className="size-5" strokeWidth={2.4} />
    </Handle>
  );
}

function updateTextareaSelection(
  textarea: HTMLTextAreaElement | null,
  start: number,
  end: number,
) {
  if (!textarea) return;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start, end);
  });
}

function getSelectedLineRange(
  value: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const lineStart =
    value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const nextLineBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  return { lineStart, lineEnd };
}

function transformSelectedText({
  textareaRef,
  value,
  onChange,
  transform,
  requireSelection,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (nextValue: string) => void;
  transform: (selected: string) => string;
  requireSelection?: boolean;
}) {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const { selectionStart, selectionEnd } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  if (!selected && requireSelection) {
    textarea.focus();
    return;
  }
  const replacement = transform(selected);
  const nextValue =
    value.slice(0, selectionStart) + replacement + value.slice(selectionEnd);

  onChange(nextValue);
  updateTextareaSelection(
    textarea,
    selectionStart,
    selectionStart + replacement.length,
  );
}

function transformSelectedLines({
  textareaRef,
  value,
  onChange,
  transformLine,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (nextValue: string) => void;
  transformLine: (line: string, index: number) => string;
}) {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const { lineStart, lineEnd } = getSelectedLineRange(
    value,
    textarea.selectionStart,
    textarea.selectionEnd,
  );
  const selectedBlock = value.slice(lineStart, lineEnd);
  const replacement = selectedBlock
    .split("\n")
    .map((line, index) => transformLine(line, index))
    .join("\n");
  const nextValue =
    value.slice(0, lineStart) + replacement + value.slice(lineEnd);

  onChange(nextValue);
  updateTextareaSelection(textarea, lineStart, lineStart + replacement.length);
}

function insertTextAtSelection({
  textareaRef,
  value,
  onChange,
  text,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (nextValue: string) => void;
  text: string;
}) {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const { selectionStart, selectionEnd } = textarea;
  const nextValue =
    value.slice(0, selectionStart) + text + value.slice(selectionEnd);
  onChange(nextValue);
  updateTextareaSelection(
    textarea,
    selectionStart + text.length,
    selectionStart + text.length,
  );
}

function TextFormatToolbar({
  editorRef,
  value,
  backgroundColor,
  onChange,
  onBackgroundChange,
  onToggleExpand,
}: {
  editorRef: RefObject<HTMLDivElement | null>;
  value: string;
  backgroundColor?: string;
  onChange: (nextValue: string) => void;
  onBackgroundChange: (backgroundColor?: string) => void;
  onToggleExpand: () => void;
}) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const syncEditorContent = () => {
    const nextValue = editorRef.current?.innerHTML || "";
    onChange(nextValue);
  };
  const runEditorCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncEditorContent();
  };
  const bindToolbarAction = (action: () => void) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      action();
    },
  });

  const applyHeading = (level: 1 | 2 | 3) => {
    runEditorCommand("formatBlock", `h${level}`);
  };

  const applyParagraph = () => {
    runEditorCommand("formatBlock", "p");
  };

  return (
    <div
      className="nodrag nopan tapnow-text-toolbar"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="tapnow-text-toolbar-swatch"
        aria-label="节点背景颜色"
        style={{ background: backgroundColor || "#f6f6f6" }}
        {...bindToolbarAction(() => {
          setIsPaletteOpen((open) => !open);
          editorRef.current?.focus();
        })}
      />
      {isPaletteOpen ? (
        <div
          className="tapnow-text-palette"
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {TEXT_BACKGROUND_COLORS.map((color) => {
            const active = color.value === backgroundColor;
            return (
              <button
                key={color.label}
                type="button"
                aria-label={color.label}
                className={[
                  "tapnow-text-palette-swatch",
                  active ? "tapnow-text-palette-swatch-active" : "",
                  color.value ? "" : "tapnow-text-palette-swatch-none",
                ].join(" ")}
                style={{ background: color.swatch }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onBackgroundChange(color.value);
                  setIsPaletteOpen(false);
                }}
              />
            );
          })}
        </div>
      ) : null}
      <span className="tapnow-text-toolbar-divider" />
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Heading 1"
        {...bindToolbarAction(() => applyHeading(1))}
      >
        <Heading1 className="size-4" />
      </button>
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Heading 2"
        {...bindToolbarAction(() => applyHeading(2))}
      >
        <Heading2 className="size-4" />
      </button>
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Heading 3"
        {...bindToolbarAction(() => applyHeading(3))}
      >
        <Heading3 className="size-4" />
      </button>
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Paragraph"
        {...bindToolbarAction(applyParagraph)}
      >
        <Pilcrow className="size-4" />
      </button>
      <span className="tapnow-text-toolbar-divider" />
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Bold"
        {...bindToolbarAction(() => runEditorCommand("bold"))}
      >
        <Bold className="size-4" />
      </button>
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Italic"
        {...bindToolbarAction(() => runEditorCommand("italic"))}
      >
        <Italic className="size-4" />
      </button>
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Bulleted list"
        {...bindToolbarAction(() => runEditorCommand("insertUnorderedList"))}
      >
        <List className="size-4" />
      </button>
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Numbered list"
        {...bindToolbarAction(() => runEditorCommand("insertOrderedList"))}
      >
        <ListOrdered className="size-4" />
      </button>
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Divider"
        {...bindToolbarAction(() => runEditorCommand("insertHTML", "<hr>"))}
      >
        <Minus className="size-4" />
      </button>
      <span className="tapnow-text-toolbar-divider" />
      <button
        type="button"
        className="tapnow-text-toolbar-button tapnow-text-toolbar-copy"
        aria-label="Copy text"
        {...bindToolbarAction(() => {
          const selected = window.getSelection()?.toString() || "";
          const plainText = editorRef.current?.innerText || "";
          void navigator.clipboard?.writeText(selected || plainText);
          setIsCopied(true);
          window.setTimeout(() => setIsCopied(false), 1100);
        })}
      >
        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span className="tapnow-text-toolbar-copy-tip">
          {isCopied ? "已复制" : "复制"}
        </span>
      </button>
      <button
        type="button"
        className="tapnow-text-toolbar-button"
        aria-label="Expand"
        {...bindToolbarAction(onToggleExpand)}
      >
        <Expand className="size-4" />
      </button>
    </div>
  );
}

function FullscreenTextEditor({
  value,
  backgroundColor,
  onChange,
  onClose,
}: {
  value: string;
  backgroundColor?: string;
  onChange: (nextValue: string) => void;
  onClose: () => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    requestAnimationFrame(() => editorRef.current?.focus());
  }, [value]);

  const syncContent = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  const runEditorCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncContent();
  };

  const bindAction = (action: () => void) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      action();
    },
  });

  const closeEditor = () => {
    syncContent();
    onClose();
  };

  return createPortal(
    <div
      className="tapnow-text-fullscreen-backdrop"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="tapnow-text-fullscreen-panel"
        style={{
          background: backgroundColor || "#242424",
        }}
      >
        <button
          type="button"
          className="tapnow-text-fullscreen-copy"
          aria-label="复制全部"
          {...bindAction(() => {
            void navigator.clipboard?.writeText(
              editorRef.current?.innerText || "",
            );
          })}
        >
          <Copy className="size-4" />
          <span className="tapnow-text-fullscreen-copy-tooltip">复制全部</span>
        </button>

        <div className="tapnow-text-fullscreen-toolbar">
          <button
            type="button"
            className="tapnow-text-fullscreen-tool"
            {...bindAction(() => runEditorCommand("formatBlock", "h1"))}
          >
            H1
          </button>
          <button
            type="button"
            className="tapnow-text-fullscreen-tool"
            {...bindAction(() => runEditorCommand("formatBlock", "h2"))}
          >
            H2
          </button>
          <button
            type="button"
            className="tapnow-text-fullscreen-tool"
            {...bindAction(() => runEditorCommand("formatBlock", "h3"))}
          >
            H3
          </button>
          <button
            type="button"
            className="tapnow-text-fullscreen-tool tapnow-text-fullscreen-tool-active"
            {...bindAction(() => runEditorCommand("formatBlock", "p"))}
          >
            <Pilcrow className="size-4" />
          </button>
          <span className="tapnow-text-fullscreen-divider" />
          <button
            type="button"
            className="tapnow-text-fullscreen-tool"
            {...bindAction(() => runEditorCommand("bold"))}
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            className="tapnow-text-fullscreen-tool"
            {...bindAction(() => runEditorCommand("italic"))}
          >
            <Italic className="size-4" />
          </button>
          <span className="tapnow-text-fullscreen-divider" />
          <button
            type="button"
            className="tapnow-text-fullscreen-tool"
            {...bindAction(() => runEditorCommand("insertUnorderedList"))}
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            className="tapnow-text-fullscreen-tool"
            {...bindAction(() => runEditorCommand("insertOrderedList"))}
          >
            <ListOrdered className="size-4" />
          </button>
          <span className="tapnow-text-fullscreen-divider" />
          <button
            type="button"
            className="tapnow-text-fullscreen-tool"
            {...bindAction(() => runEditorCommand("insertHTML", "<hr>"))}
          >
            <Minus className="size-4" />
          </button>
        </div>

        <button
          type="button"
          className="tapnow-text-fullscreen-close"
          aria-label="关闭全屏编辑"
          {...bindAction(closeEditor)}
        >
          <X className="size-5" />
        </button>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="开启你的创作..."
          className="tapnow-text-fullscreen-editor"
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            syncContent();
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") closeEditor();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}

function ImageResourceToolbar({
  onCrop,
  onRelight,
  onMultipleAngles,
  onErase,
  onMore,
  onReplace,
  onDownload,
  onFullscreenPreview,
  onExpand,
}: {
  onCrop: () => void;
  onRelight: () => void;
  onMultipleAngles: () => void;
  onErase: () => void;
  onMore: () => void;
  onReplace?: () => void;
  onDownload: () => void;
  onFullscreenPreview: () => void;
  onExpand: () => void;
}) {
  const stopButtonEvent = (
    event:
      | ReactPointerEvent<HTMLButtonElement>
      | ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const bindButton = (action?: () => void) => ({
    onPointerDown: stopButtonEvent,
    onMouseDown: stopButtonEvent,
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
      stopButtonEvent(event);
      action?.();
    },
  });

  return (
    <div
      className="nodrag nopan tapnow-image-resource-toolbar"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="裁剪"
        data-tooltip="裁剪"
        {...bindButton(onCrop)}
      >
        <Crop className="size-4" />
      </button>
      <button
        type="button"
        aria-label="打光"
        data-tooltip="打光"
        {...bindButton(onRelight)}
      >
        <Lightbulb className="size-4" />
      </button>
      <button
        type="button"
        aria-label="多角度"
        data-tooltip="多角度"
        {...bindButton(onMultipleAngles)}
      >
        <Box className="size-4" />
      </button>
      <button
        type="button"
        aria-label="擦除"
        data-tooltip="擦除"
        {...bindButton(onErase)}
      >
        <Eraser className="size-4" />
      </button>
      <button
        type="button"
        aria-label="扩图"
        data-tooltip="扩图"
        {...bindButton(onExpand)}
      >
        <Scan className="size-4" />
      </button>
      <button
        type="button"
        aria-label="更多"
        data-tooltip="更多"
        className="tapnow-image-resource-more"
        {...bindButton(onMore)}
      >
        <MoreHorizontal className="size-4" />
      </button>
      <span className="tapnow-image-resource-divider" />
      <button
        type="button"
        aria-label="下载"
        data-tooltip="下载"
        {...bindButton(onDownload)}
      >
        <Download className="size-4" />
      </button>
      <button
        type="button"
        aria-label="全屏预览"
        data-tooltip="全屏预览"
        {...bindButton(onFullscreenPreview)}
      >
        <Expand className="size-4" />
      </button>
    </div>
  );
}

type VideoToolbarMode = "trim" | "quality" | "clean";

function VideoResourceToolbar({
  activeMode,
  onModeChange,
  onDownload,
  onFullscreenPreview,
}: {
  activeMode: VideoToolbarMode | null;
  onModeChange: (mode: VideoToolbarMode) => void;
  onDownload: () => void;
  onFullscreenPreview: () => void;
}) {
  const stopButtonEvent = (
    event:
      | ReactPointerEvent<HTMLButtonElement>
      | ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const bindButton = (action?: () => void) => ({
    onPointerDown: stopButtonEvent,
    onMouseDown: stopButtonEvent,
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
      stopButtonEvent(event);
      action?.();
    },
  });

  const renderModeButton = (
    mode: VideoToolbarMode,
    content: ReactNode,
    tooltip: string,
  ) => (
    <button
      type="button"
      aria-label={tooltip}
      data-tooltip={tooltip}
      className={
        activeMode === mode ? "tapnow-video-toolbar-button-active" : ""
      }
      {...bindButton(() => onModeChange(mode))}
    >
      {content}
    </button>
  );

  return (
    <div
      className="nodrag nopan tapnow-video-resource-toolbar"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {renderModeButton("trim", <Scissors className="size-4" />, "裁切")}
      {renderModeButton(
        "quality",
        <span className="tapnow-video-toolbar-hd">HD</span>,
        "高清增强",
      )}
      {renderModeButton("clean", <Eraser className="size-4" />, "清除")}
      <span className="tapnow-image-resource-divider" />
      <button
        type="button"
        aria-label="下载"
        data-tooltip="下载"
        {...bindButton(onDownload)}
      >
        <Download className="size-4" />
      </button>
      <button
        type="button"
        aria-label="全屏预览"
        data-tooltip="全屏预览"
        {...bindButton(onFullscreenPreview)}
      >
        <Expand className="size-4" />
      </button>
    </div>
  );
}

function VideoPanelShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="nodrag nopan tapnow-video-panel"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="tapnow-video-panel-head">
        <div className="tapnow-video-panel-title">{title}</div>
        <div className="tapnow-video-panel-description">{description}</div>
      </div>
      <div className="tapnow-video-panel-body">{children}</div>
      {footer ? (
        <div className="tapnow-video-panel-footer">{footer}</div>
      ) : null}
    </div>
  );
}

function VideoToolbarPanel({
  mode,
  cleanSelection,
  isCleanSelecting,
  isCleanPending,
  cleanStatus,
  hasCleanMask,
  cleanPreviewUrl,
  onCleanSelect,
  onCleanClear,
  onCleanGenerate,
}: {
  mode: VideoToolbarMode;
  cleanSelection: NormalizedSelectionRect | null;
  isCleanSelecting: boolean;
  isCleanPending: boolean;
  cleanStatus: string;
  hasCleanMask: boolean;
  cleanPreviewUrl: string | null;
  onCleanSelect: () => void;
  onCleanClear: () => void;
  onCleanGenerate: () => void;
}) {
  const hasCleanSelection = isValidSelectionRect(cleanSelection);

  if (mode === "clean") {
    const regionStyle = cleanSelection
      ? {
          left: `${cleanSelection.x * 100}%`,
          top: `${cleanSelection.y * 100}%`,
          width: `${cleanSelection.width * 100}%`,
          height: `${cleanSelection.height * 100}%`,
        }
      : undefined;

    return (
      <VideoPanelShell
        title="清除"
        description="框选当前帧中的目标区域，调用分割场景返回 RLE 蒙层。"
      >
        <div className="tapnow-video-clean-toolbar">
          <div className="tapnow-video-clean-header">
            <span className="tapnow-video-clean-heading">移除对象</span>
            <button
              type="button"
              className="tapnow-video-clean-trigger"
              onClick={onCleanSelect}
            >
              <BoxSelect className="size-4" />
              <span>
                {isCleanSelecting
                  ? "拖动框选"
                  : hasCleanSelection
                    ? "重新框选"
                    : "添加选区"}
              </span>
            </button>
          </div>

          <div className="tapnow-video-clean-card-wrap">
            <div
              className={[
                "tapnow-video-clean-card",
                hasCleanSelection ? "is-filled" : "is-highlighted",
              ].join(" ")}
            >
              {hasCleanSelection ? (
                <>
                  <div className="tapnow-video-clean-card-preview">
                    {cleanPreviewUrl ? (
                      <img
                        src={cleanPreviewUrl}
                        alt="分割目标预览"
                        className="tapnow-video-clean-card-preview-image"
                      />
                    ) : (
                      <div className="tapnow-video-clean-card-region">
                        <div
                          className={[
                            "tapnow-video-clean-card-region-box",
                            hasCleanMask ? "is-masked" : "",
                          ].join(" ")}
                          style={regionStyle}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="tapnow-video-clean-card-clear"
                    onClick={onCleanClear}
                    aria-label="清除选区"
                  >
                    <X className="size-3" />
                  </button>
                </>
              ) : (
                <div className="tapnow-video-clean-card-empty">
                  <div className="tapnow-video-clean-card-icon">
                    <BoxSelect className="size-5" />
                  </div>
                </div>
              )}
              <span className="tapnow-video-clean-card-label">
                {hasCleanSelection ? "目标区域" : "框选目标"}
              </span>
            </div>
          </div>

          <div className="tapnow-video-clean-actions">
            <button
              type="button"
              className="tapnow-video-clean-generate"
              disabled={!hasCleanMask || isCleanPending}
              onClick={onCleanGenerate}
            >
              {isCleanPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>处理中</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>生成</span>
                </>
              )}
            </button>
          </div>

          {cleanStatus ? (
            <div className="tapnow-video-clean-status">{cleanStatus}</div>
          ) : null}
        </div>
      </VideoPanelShell>
    );
  }

  return null;
}

function FullscreenImagePreview({
  imageUrl,
  title,
  onClose,
}: {
  imageUrl: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="tapnow-image-fullscreen-backdrop" onClick={onClose}>
      <div
        className="tapnow-image-fullscreen-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tapnow-image-fullscreen-header">
          <div className="tapnow-image-fullscreen-title">{title}</div>
          <button
            type="button"
            className="tapnow-image-fullscreen-close"
            onClick={onClose}
            aria-label="关闭预览"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="tapnow-image-fullscreen-stage">
          <img
            src={imageUrl}
            alt={title}
            className="tapnow-image-fullscreen-media"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FullscreenVideoPreview({
  videoUrl,
  title,
  onClose,
}: {
  videoUrl: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="tapnow-image-fullscreen-backdrop" onClick={onClose}>
      <div
        className="tapnow-image-fullscreen-panel tapnow-video-fullscreen-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tapnow-image-fullscreen-header">
          <div className="tapnow-image-fullscreen-title">{title}</div>
          <button
            type="button"
            className="tapnow-image-fullscreen-close"
            onClick={onClose}
            aria-label="关闭预览"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="tapnow-image-fullscreen-stage">
          <video
            src={videoUrl}
            className="tapnow-image-fullscreen-media"
            controls
            autoPlay
            loop
            playsInline
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function VideoCleanSelectionOverlay({
  videoUrl,
  title,
  initialTime,
  initialSelection,
  onSubmit,
  onClose,
}: {
  videoUrl: string;
  title: string;
  initialTime: number;
  initialSelection: NormalizedSelectionRect | null;
  onSubmit: (selection: NormalizedSelectionRect, frameTime: number) => void;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const overlayVideoRef = useRef<HTMLVideoElement | null>(null);
  const [selection, setSelection] = useState<NormalizedSelectionRect | null>(
    initialSelection,
  );
  const [stageSize, setStageSize] = useState({ width: 960, height: 540 });
  const [currentTime, setCurrentTime] = useState(Math.max(0, initialTime || 0));
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fitStage = (mediaWidth: number, mediaHeight: number) => {
    const viewportWidth = Math.max(window.innerWidth - 120, 320);
    const viewportHeight = Math.max(window.innerHeight - 220, 240);
    const ratio = Math.min(
      viewportWidth / Math.max(mediaWidth, 1),
      viewportHeight / Math.max(mediaHeight, 1),
      1,
    );

    setStageSize({
      width: Math.max(280, Math.round(mediaWidth * ratio)),
      height: Math.max(180, Math.round(mediaHeight * ratio)),
    });
  };

  useEffect(() => {
    const element = overlayVideoRef.current;
    if (!element) return;

    const handleLoadedMetadata = () => {
      fitStage(element.videoWidth || 960, element.videoHeight || 540);
      const safeDuration = Number.isFinite(element.duration)
        ? element.duration
        : 0;
      const nextTime = Math.max(
        0,
        Math.min(initialTime || 0, Math.max(safeDuration - 0.05, 0)),
      );
      setDuration(safeDuration);
      setCurrentTime(nextTime);
      element.currentTime = nextTime;
    };

    const handleCanPlay = () => {
      element.pause();
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(element.currentTime || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    element.addEventListener("loadedmetadata", handleLoadedMetadata);
    element.addEventListener("canplay", handleCanPlay);
    element.addEventListener("timeupdate", handleTimeUpdate);
    element.addEventListener("play", handlePlay);
    element.addEventListener("pause", handlePause);

    return () => {
      element.removeEventListener("loadedmetadata", handleLoadedMetadata);
      element.removeEventListener("canplay", handleCanPlay);
      element.removeEventListener("timeupdate", handleTimeUpdate);
      element.removeEventListener("play", handlePlay);
      element.removeEventListener("pause", handlePause);
    };
  }, [initialTime, videoUrl]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    overlayVideoRef.current?.pause();

    const stage = stageRef.current;
    if (!stage) return;

    const bounds = stage.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const startX = clampUnit((event.clientX - bounds.left) / bounds.width);
    const startY = clampUnit((event.clientY - bounds.top) / bounds.height);

    const updateSelection = (clientX: number, clientY: number) => {
      const currentX = clampUnit((clientX - bounds.left) / bounds.width);
      const currentY = clampUnit((clientY - bounds.top) / bounds.height);
      const nextSelection = {
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY),
      };
      setSelection(nextSelection);
      return nextSelection;
    };

    updateSelection(event.clientX, event.clientY);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateSelection(moveEvent.clientX, moveEvent.clientY);
    };

    const stopSelection = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopSelection);
      updateSelection(upEvent.clientX, upEvent.clientY);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopSelection);
  };

  const togglePlayback = () => {
    const element = overlayVideoRef.current;
    if (!element) return;
    if (element.paused) {
      void element.play().catch(() => {});
      return;
    }
    element.pause();
  };

  return createPortal(
    <div className="tapnow-video-clean-selector" onClick={onClose}>
      <div
        className="tapnow-video-clean-selector-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tapnow-video-clean-selector-header">
          <div className="tapnow-video-clean-selector-title">{title}</div>
          <button
            type="button"
            className="tapnow-video-clean-selector-close"
            onClick={onClose}
            aria-label="关闭框选"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="tapnow-video-clean-selector-body">
          <div
            ref={stageRef}
            className="tapnow-video-clean-selector-stage"
            style={{ width: stageSize.width, height: stageSize.height }}
            onPointerDown={handlePointerDown}
          >
            <video
              ref={overlayVideoRef}
              src={videoUrl}
              className="tapnow-video-clean-selector-image"
              crossOrigin="anonymous"
              muted
              playsInline
              preload="metadata"
            />
            {selection ? (
              <div
                className="tapnow-video-clean-selector-box"
                style={{
                  left: `${selection.x * 100}%`,
                  top: `${selection.y * 100}%`,
                  width: `${selection.width * 100}%`,
                  height: `${selection.height * 100}%`,
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="tapnow-video-clean-selector-footer">
          <div className="tapnow-video-clean-selector-timeline">
            <button
              type="button"
              className="tapnow-video-clean-selector-play"
              onClick={togglePlayback}
              aria-label={isPlaying ? "暂停视频" : "播放视频"}
            >
              {isPlaying ? <PauseGlyph /> : <PlayGlyph />}
            </button>
            <span>{formatVideoTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={Math.max(duration, 0.1)}
              step={0.01}
              value={Math.min(currentTime, Math.max(duration, 0.1))}
              onChange={(event) => {
                const nextTime = Number(event.target.value);
                setCurrentTime(nextTime);
                const element = overlayVideoRef.current;
                if (element) {
                  element.currentTime = nextTime;
                  element.pause();
                }
                setIsPlaying(false);
              }}
            />
            <span>{formatVideoTime(duration)}</span>
          </div>
          <div className="tapnow-video-clean-selector-actions">
            <button
              type="button"
              className="tapnow-video-clean-selector-ghost"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="button"
              className="tapnow-video-clean-selector-confirm"
              disabled={!isValidSelectionRect(selection)}
              onClick={() => {
                if (!selection || !isValidSelectionRect(selection)) return;
                onSubmit(selection, overlayVideoRef.current?.currentTime || 0);
              }}
            >
              确认选区
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function VideoTrimEditor({
  videoUrl,
  title,
  duration,
  initialCurrentTime,
  onSubmit,
  onSmartClip,
  onClose,
}: {
  videoUrl: string;
  title: string;
  duration: number;
  initialCurrentTime: number;
  onSubmit: (meta: {
    trimStart: number;
    trimEnd: number;
    duration: number;
    isPrecise: boolean;
    isSmartClip: boolean;
  }) => Promise<void> | void;
  onSmartClip: (
    segments: SmartClipSegment[],
    onProgress?: (current: number, total: number) => void,
  ) => Promise<void> | void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const safeDuration = Math.max(duration || 5, 0.1);
  const minClipLength = Math.min(0.2, safeDuration);
  const [trimStart, setTrimStart] = useState(
    Math.max(
      0,
      Math.min(initialCurrentTime || 0, Math.max(safeDuration - 0.5, 0)),
    ),
  );
  const [trimEnd, setTrimEnd] = useState(safeDuration);
  const [playhead, setPlayhead] = useState(
    Math.max(0, Math.min(initialCurrentTime || 0, safeDuration)),
  );
  const [isPrecise, setIsPrecise] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smartClipProgress, setSmartClipProgress] = useState<{
    phase: "analyzing" | "exporting";
    current: number;
    total: number;
  } | null>(null);
  const [smartClipNotice, setSmartClipNotice] = useState("");
  const isBusy = isSubmitting || smartClipProgress !== null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) onClose();
      if (event.key === "ArrowLeft") {
        setPlayhead((current) => Math.max(trimStart, current - 0.1));
      }
      if (event.key === "ArrowRight") {
        setPlayhead((current) => Math.min(trimEnd, current + 0.1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, onClose, trimEnd, trimStart]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = playhead;
    }
  }, [playhead]);

  useEffect(() => {
    if (trimStart > trimEnd - minClipLength) {
      setTrimStart(Math.max(0, trimEnd - minClipLength));
    }
    if (trimEnd < trimStart + minClipLength) {
      setTrimEnd(Math.min(safeDuration, trimStart + minClipLength));
    }
    if (playhead < trimStart) {
      setPlayhead(trimStart);
    }
    if (playhead > trimEnd) {
      setPlayhead(trimEnd);
    }
  }, [minClipLength, playhead, safeDuration, trimEnd, trimStart]);

  const clampTime = (value: number) =>
    Math.max(0, Math.min(safeDuration, value));

  const getTimeFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * safeDuration;
  };

  const startHandleDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    side: "left" | "right",
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextTime = clampTime(getTimeFromClientX(moveEvent.clientX));
      if (side === "left") {
        const nextStart = Math.min(nextTime, trimEnd - minClipLength);
        setTrimStart(nextStart);
        setPlayhead((current) => Math.max(nextStart, current));
        return;
      }

      const nextEnd = Math.max(nextTime, trimStart + minClipLength);
      setTrimEnd(nextEnd);
      setPlayhead((current) => Math.min(nextEnd, current));
    };

    const stopDrag = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDrag);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
  };

  const startSelectionDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startClientX = event.clientX;
    const startRange = trimEnd - trimStart;
    const startTrimStart = trimStart;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      const deltaRatio = (moveEvent.clientX - startClientX) / rect.width;
      const deltaTime = deltaRatio * safeDuration;
      const nextStart = Math.max(
        0,
        Math.min(safeDuration - startRange, startTrimStart + deltaTime),
      );
      const nextEnd = nextStart + startRange;
      const playheadOffset = playhead - trimStart;
      setTrimStart(nextStart);
      setTrimEnd(nextEnd);
      setPlayhead(
        Math.max(nextStart, Math.min(nextEnd, nextStart + playheadOffset)),
      );
    };

    const stopDrag = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDrag);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
  };

  const thumbnails = Array.from({ length: 8 }, (_, index) => ({
    id: index,
    time: Number(((safeDuration / 7) * index).toFixed(2)),
  }));

  const handleSubmit = async () => {
    if (isBusy) return;
    setSmartClipNotice("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        trimStart,
        trimEnd,
        duration: safeDuration,
        isPrecise,
        isSmartClip: false,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSmartClip = async () => {
    if (isBusy) return;
    setSmartClipNotice("");
    setSmartClipProgress({
      phase: "analyzing",
      current: 0,
      total: 1,
    });

    try {
      const segments = await analyzeSmartClipSegments({
        videoUrl,
        duration: safeDuration,
        onProgress: (current, total) => {
          setSmartClipProgress({
            phase: "analyzing",
            current,
            total,
          });
        },
      });

      if (!segments.length) {
        setSmartClipProgress(null);
        setSmartClipNotice("未检测到明显切换点");
        return;
      }

      setSmartClipProgress({
        phase: "exporting",
        current: 0,
        total: segments.length,
      });
      await onSmartClip(segments, (current, total) => {
        setSmartClipProgress({
          phase: "exporting",
          current,
          total,
        });
      });
      setSmartClipProgress(null);
      setSmartClipNotice(`已生成 ${segments.length} 个片段`);
      onClose();
    } catch (error) {
      setSmartClipProgress(null);
      setSmartClipNotice(
        error instanceof Error ? error.message : "智能剪辑失败，请重试",
      );
    }
  };

  const selectionLeft = `${(trimStart / safeDuration) * 100}%`;
  const selectionWidth = `${((trimEnd - trimStart) / safeDuration) * 100}%`;
  const playheadLeft = `${(playhead / safeDuration) * 100}%`;
  const smartClipPercent =
    smartClipProgress && smartClipProgress.total > 0
      ? Math.min(
          100,
          Math.round(
            (smartClipProgress.current / smartClipProgress.total) * 100,
          ),
        )
      : 0;
  const smartClipStatusText = smartClipProgress
    ? smartClipProgress.phase === "analyzing"
      ? `正在分析 ${smartClipPercent}%`
      : `正在生成 ${smartClipProgress.current}/${smartClipProgress.total}`
    : smartClipNotice;
  const smartClipButtonLabel = smartClipProgress
    ? smartClipProgress.phase === "analyzing"
      ? `分析中 ${smartClipPercent}%`
      : `生成片段 ${smartClipProgress.current}/${smartClipProgress.total}`
    : "智能剪辑";

  return createPortal(
    <div
      className="tapnow-video-trim-editor"
      onClick={onClose}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        className="tapnow-video-trim-header"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="tapnow-video-trim-title">
          <Video className="size-5" />
          {title}
        </span>
      </div>

      <div
        className="tapnow-video-trim-stage"
        onClick={(event) => event.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="tapnow-video-trim-main-video"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>

      <div
        className="tapnow-video-trim-bottom"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="tapnow-video-trim-round tapnow-video-trim-round-ghost"
          onClick={onClose}
          aria-label="退出剪辑"
          disabled={isBusy}
        >
          <X className="size-6" />
        </button>

        <div className="tapnow-video-trim-timeline-shell">
          <div ref={trackRef} className="tapnow-video-trim-thumbnails">
            {thumbnails.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tapnow-video-trim-thumbnail"
                onClick={() => setPlayhead(item.time)}
                disabled={isBusy}
              >
                <video src={videoUrl} muted playsInline />
              </button>
            ))}

            <div
              className="tapnow-video-trim-selection"
              onPointerDown={startSelectionDrag}
              style={{
                left: selectionLeft,
                width: selectionWidth,
              }}
            >
              <button
                type="button"
                className="tapnow-video-trim-handle tapnow-video-trim-handle-left"
                onPointerDown={(event) => startHandleDrag(event, "left")}
              />
              <div className="tapnow-video-trim-duration-pill">
                <strong>{(trimEnd - trimStart).toFixed(2)}s</strong>
                <span>{isPrecise ? "精确模式（禁用吸附）" : "标准模式"}</span>
              </div>
              <button
                type="button"
                className="tapnow-video-trim-handle tapnow-video-trim-handle-right"
                onPointerDown={(event) => startHandleDrag(event, "right")}
              />
            </div>
            <div
              className="tapnow-video-trim-playhead"
              style={{ left: playheadLeft }}
            />
          </div>
        </div>

        <button
          type="button"
          className="tapnow-video-trim-round tapnow-video-trim-round-primary"
          onClick={() => void handleSubmit()}
          aria-label="确认裁剪"
          disabled={isBusy}
        >
          {isSubmitting ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Check className="size-6" />
          )}
        </button>
      </div>

      <div
        className="tapnow-video-trim-footer"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={[
            "tapnow-video-trim-shortcut",
            smartClipStatusText ? "tapnow-video-trim-status" : "",
          ].join(" ")}
        >
          {smartClipStatusText ? (
            <span>{smartClipStatusText}</span>
          ) : (
            <>
              <span>← →</span>
              <span>移动选区</span>
            </>
          )}
        </div>
        <button
          type="button"
          className={[
            "tapnow-video-trim-smart",
            smartClipProgress || smartClipNotice
              ? "tapnow-video-trim-smart-active"
              : "",
          ].join(" ")}
          onClick={() => void handleSmartClip()}
          disabled={isBusy}
        >
          {smartClipProgress ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          <span>{smartClipButtonLabel}</span>
        </button>
        <button
          type="button"
          className="tapnow-video-trim-precision"
          onClick={() => setIsPrecise((value) => !value)}
          disabled={isBusy}
        >
          {isPrecise ? "精确模式" : "标准模式"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

type ImageEditorMode = "redraw" | "erase" | "annotate";

function buildMaskDataUrl(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  outputFormat: "image/png" | "image/jpeg" = "image/png",
) {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = width;
  exportCanvas.height = height;
  const exportContext = exportCanvas.getContext("2d");
  if (!exportContext) return "";
  exportContext.fillStyle = "#000";
  exportContext.fillRect(0, 0, width, height);
  exportContext.drawImage(canvas, 0, 0, width, height);
  return exportCanvas.toDataURL(outputFormat);
}

function ImageToolMoreMenu({
  onClose,
  onAction,
}: {
  onClose: () => void;
  onAction: (
    action:
      | "annotate"
      | "upscale"
      | "cutout"
      | "quick-split-2"
      | "quick-split-3"
      | "quick-split-4",
  ) => void;
}) {
  return (
    <div
      className="tapnow-image-more-menu nodrag nopan"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" onClick={() => onAction("annotate")}>
        <Menu className="size-4" />
        <span>标注</span>
      </button>
      <button type="button" onClick={() => onAction("upscale")}>
        <Sparkles className="size-4" />
        <span>增强</span>
      </button>
      <button type="button" onClick={() => onAction("cutout")}>
        <ImageIcon className="size-4" />
        <span>抠图</span>
      </button>
      <div className="tapnow-image-more-grid-row">
        <span className="tapnow-image-more-grid-label">快速切分</span>
        <button type="button" onClick={() => onAction("quick-split-2")}>
          2×2
        </button>
        <button type="button" onClick={() => onAction("quick-split-3")}>
          3×3
        </button>
        <button type="button" onClick={() => onAction("quick-split-4")}>
          4×4
        </button>
      </div>
    </div>
  );
}

function ImageExpandOverlay({
  pending,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: { prompt: string; aspectRatio: string }) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [requiredCredits, setRequiredCredits] = useState<number | null>(null);
  const [isCreditsLoading, setIsCreditsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRequiredCredits = async () => {
      setIsCreditsLoading(true);

      try {
        const response = await fetch("/api/ai/canvas-expand/estimate-credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aspectRatio,
            resolution: "4k",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.code !== 0) {
          throw new Error(result.message || "Failed to estimate credits");
        }

        if (!cancelled) {
          setRequiredCredits(result.data?.requiredCredits ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to estimate canvas expand credits:", error);
          setRequiredCredits(null);
        }
      } finally {
        if (!cancelled) {
          setIsCreditsLoading(false);
        }
      }
    };

    void loadRequiredCredits();

    return () => {
      cancelled = true;
    };
  }, [aspectRatio]);

  return createPortal(
    <div className="tapnow-image-tool-backdrop" onClick={onClose}>
      <div
        className="tapnow-expand-panel nodrag nopan"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tapnow-upscale-header">
          <div>
            <span className="tapnow-upscale-eyebrow">Outpaint</span>
            <strong>扩图</strong>
            <span>扩展画布边缘，保留主体和原始场景连续性。</span>
          </div>
          <button type="button" aria-label="关闭扩图面板" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <div className="tapnow-upscale-body">
          <div className="tapnow-upscale-section">
            <span className="tapnow-upscale-label">目标比例</span>
            <div className="tapnow-expand-ratio-grid">
              {["1:1", "4:5", "3:4", "4:3", "16:9", "9:16", "21:9"].map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    className={aspectRatio === value ? "is-active" : ""}
                    onClick={() => setAspectRatio(value)}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="tapnow-upscale-section">
            <span className="tapnow-upscale-label">扩图提示词</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="描述你希望如何延展画面边缘，比如补全背景、增加留白或扩展环境。"
              className="tapnow-expand-textarea"
            />
          </div>
        </div>

        <div className="tapnow-upscale-footer">
          <button
            type="button"
            className="tapnow-image-mask-submit"
            disabled={pending}
            onClick={() => void onSubmit({ prompt, aspectRatio })}
          >
            <span className="tapnow-image-mask-submit-meta">
              <span className="tapnow-image-mask-submit-token" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span className="tapnow-image-mask-submit-credits">
                {isCreditsLoading ? "..." : `${requiredCredits ?? 12}`}
              </span>
            </span>
            <span className="tapnow-image-mask-submit-icon">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ImageUpscaleOverlay({
  pending,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    targetResolution: "2k" | "4k" | "8k";
    outputFormat: "jpeg" | "png" | "webp";
  }) => Promise<void>;
}) {
  const [targetResolution, setTargetResolution] = useState<"2k" | "4k" | "8k">(
    "4k",
  );
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "png" | "webp">(
    "jpeg",
  );
  const { credits: requiredCredits, isLoading: isCreditsLoading } =
    useEstimateCredits("image-upscaler", { targetResolution, outputFormat });

  return (
    <div
      className="tapnow-upscale-panel nodrag nopan"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="tapnow-upscale-header">
        <div />
        <button type="button" aria-label="关闭增强面板" onClick={onClose}>
          <X className="size-4" />
        </button>
      </div>

      <div className="tapnow-upscale-body">
        <div className="tapnow-upscale-section">
          <span className="tapnow-upscale-label">目标分辨率</span>
          <div className="tapnow-upscale-option-row">
            {[
              ["2k", "2K"],
              ["4k", "4K"],
              ["8k", "8K"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={targetResolution === value ? "is-active" : ""}
                onClick={() => setTargetResolution(value as "2k" | "4k" | "8k")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="tapnow-upscale-section">
          <span className="tapnow-upscale-label">输出格式</span>
          <div className="tapnow-upscale-option-row">
            {[
              ["jpeg", "JPEG"],
              ["png", "PNG"],
              ["webp", "WebP"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={outputFormat === value ? "is-active" : ""}
                onClick={() =>
                  setOutputFormat(value as "jpeg" | "png" | "webp")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tapnow-upscale-footer">
        <button
          type="button"
          className="tapnow-image-mask-submit"
          disabled={pending}
          onClick={() => void onSubmit({ targetResolution, outputFormat })}
        >
          <span className="tapnow-image-mask-submit-meta">
            <span className="tapnow-image-mask-submit-token" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="tapnow-image-mask-submit-credits">
              {isCreditsLoading ? "..." : `${requiredCredits ?? 4}`}
            </span>
          </span>
          <span className="tapnow-image-mask-submit-icon">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

function VideoUpscaleOverlay({
  videoUrl,
  duration,
  pending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  videoUrl: string;
  duration: number;
  pending: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (payload: {
    targetResolution: CanvasVideoUpscaleTargetResolution;
  }) => Promise<void>;
}) {
  const [targetResolution, setTargetResolution] =
    useState<CanvasVideoUpscaleTargetResolution>("1080p");
  const [resolvedDuration, setResolvedDuration] = useState(
    Number.isFinite(duration) && duration > 0 ? duration : 0,
  );
  const [isResolvingDuration, setIsResolvingDuration] = useState(
    !(Number.isFinite(duration) && duration > 0),
  );

  useEffect(() => {
    if (Number.isFinite(duration) && duration > 0) {
      setResolvedDuration(duration);
      setIsResolvingDuration(false);
      return;
    }

    let cancelled = false;
    setIsResolvingDuration(true);

    void resolveVideoDuration(videoUrl)
      .then((nextDuration) => {
        if (cancelled) return;
        setResolvedDuration(nextDuration);
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedDuration(0);
      })
      .finally(() => {
        if (cancelled) return;
        setIsResolvingDuration(false);
      });

    return () => {
      cancelled = true;
    };
  }, [duration, videoUrl]);

  const hasDuration = Number.isFinite(resolvedDuration) && resolvedDuration > 0;
  const { credits: requiredCredits, isLoading: isCreditsLoading } =
    useEstimateCredits(
      "canvas-video-upscaler",
      hasDuration
        ? {
            target_resolution: targetResolution,
            duration: resolvedDuration,
          }
        : undefined,
      { enabled: hasDuration, disableCache: true },
    );

  return createPortal(
    <div className="tapnow-image-tool-backdrop" onClick={onClose}>
      <div
        className="tapnow-expand-panel nodrag nopan"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tapnow-upscale-header">
          <div>
            <strong>高清增强</strong>
          </div>
          <button type="button" aria-label="关闭高清增强面板" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <div className="tapnow-upscale-body">
          <div className="tapnow-upscale-section">
            <span className="tapnow-upscale-label">目标分辨率</span>
            <div className="tapnow-upscale-option-row">
              {[
                ["1080p", "1080P"],
                ["2k", "2K"],
                ["4k", "4K"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={targetResolution === value ? "is-active" : ""}
                  onClick={() =>
                    setTargetResolution(
                      value as CanvasVideoUpscaleTargetResolution,
                    )
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {errorMessage ? (
            <div className="tapnow-video-upscale-error">{errorMessage}</div>
          ) : null}
        </div>

        <div className="tapnow-upscale-footer">
          <button
            type="button"
            className="tapnow-image-mask-submit"
            disabled={pending || !hasDuration || isResolvingDuration}
            onClick={() => void onSubmit({ targetResolution })}
          >
            <span className="tapnow-image-mask-submit-meta">
              <span className="tapnow-image-mask-submit-token" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span className="tapnow-image-mask-submit-credits">
                {isResolvingDuration
                  ? "..."
                  : hasDuration
                    ? isCreditsLoading
                      ? "..."
                      : `${requiredCredits ?? "--"}`
                    : "..."}
              </span>
            </span>
            <span className="tapnow-image-mask-submit-icon">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ImageMultipleAnglesOverlay({
  pending,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  onClose: () => void;
  onSubmit: (
    payload: NonNullable<CanvasImageToolRequest["multiAngle"]>,
  ) => Promise<void>;
}) {
  const horizontalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const verticalAngles = [-30, 0, 30, 60];
  const defaultHorizontalAngle = 315;
  const defaultVerticalAngle = 30;
  const [horizontalAngle, setHorizontalAngle] = useState(
    defaultHorizontalAngle,
  );
  const [verticalAngle, setVerticalAngle] = useState(defaultVerticalAngle);
  const [distance, setDistance] = useState<0 | 1 | 2>(1);
  const multiAngleSize = "1536*1536";
  const outputFormat = "png";
  const dragStartRef = useRef<{
    x: number;
    y: number;
    horizontal: number;
    vertical: number;
  } | null>(null);
  const isDraggingCube = Boolean(dragStartRef.current);
  const { credits: requiredCredits, isLoading: isCreditsLoading } =
    useEstimateCredits("qwen-image-edit-multiple-angles", {
      distance,
      size: multiAngleSize,
      outputFormat,
    });

  const snapHorizontalAngle = (value: number) => {
    const normalized = ((Math.round(value) % 360) + 360) % 360;
    return horizontalAngles.reduce((closest, candidate) => {
      const closestDistance = Math.min(
        Math.abs(closest - normalized),
        360 - Math.abs(closest - normalized),
      );
      const candidateDistance = Math.min(
        Math.abs(candidate - normalized),
        360 - Math.abs(candidate - normalized),
      );
      return candidateDistance < closestDistance ? candidate : closest;
    });
  };

  const snapVerticalAngle = (value: number) =>
    verticalAngles.reduce((closest, candidate) =>
      Math.abs(candidate - value) < Math.abs(closest - value)
        ? candidate
        : closest,
    );

  const horizontalLabelMap: Record<number, string> = {
    0: "正面",
    45: "前右",
    90: "右侧",
    135: "后右",
    180: "背面",
    225: "后左",
    270: "左侧",
    315: "前左",
  };

  const verticalLabelMap: Record<number, string> = {
    [-30]: "低机位",
    0: "平视",
    30: "抬视角",
    60: "高机位",
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragStartRef.current;
      if (!drag) return;
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      const nextHorizontal = snapHorizontalAngle(
        drag.horizontal - deltaX * 1.2,
      );
      const nextVertical = snapVerticalAngle(drag.vertical - deltaY * 0.4);
      setHorizontalAngle(nextHorizontal);
      setVerticalAngle(nextVertical);
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const cubeScale = 1 + distance * 0.1;
  const cubeRotateX = -verticalAngle * 0.95;
  const cubeRotateY = horizontalAngle * 0.78;
  const horizontalIndex = horizontalAngles.indexOf(horizontalAngle);
  const verticalIndex = verticalAngles.indexOf(verticalAngle);

  return (
    <div
      className="tapnow-multi-angle-panel nodrag nopan"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="tapnow-multi-angle-title">
        <span>拖拽方块调整角度</span>
        <button
          type="button"
          className="tapnow-multi-angle-close"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="tapnow-multi-angle-content">
        <div className="tapnow-multi-angle-preview-box">
          <div
            className="tapnow-multi-angle-cube"
            style={{
              transform: `rotateX(${cubeRotateX}deg) rotateY(${cubeRotateY}deg) scale3d(${cubeScale}, ${cubeScale}, ${cubeScale})`,
              transition: isDraggingCube ? "none" : undefined,
              cursor: isDraggingCube ? "grabbing" : "grab",
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              dragStartRef.current = {
                x: event.clientX,
                y: event.clientY,
                horizontal: horizontalAngle,
                vertical: verticalAngle,
              };
            }}
          >
            <div className="tapnow-multi-angle-cube-face tapnow-multi-angle-cube-front">
              <ImageIcon className="size-5 text-white/58" />
            </div>
            <div className="tapnow-multi-angle-cube-face tapnow-multi-angle-cube-back">
              <span>BK</span>
            </div>
            <div className="tapnow-multi-angle-cube-face tapnow-multi-angle-cube-left">
              <span>L</span>
            </div>
            <div className="tapnow-multi-angle-cube-face tapnow-multi-angle-cube-side">
              <span>R</span>
            </div>
            <div className="tapnow-multi-angle-cube-face tapnow-multi-angle-cube-top">
              <span>T</span>
            </div>
            <div className="tapnow-multi-angle-cube-face tapnow-multi-angle-cube-bottom">
              <span>B</span>
            </div>
          </div>
          <button
            type="button"
            className="tapnow-multi-angle-reset"
            onClick={() => {
              setHorizontalAngle(defaultHorizontalAngle);
              setVerticalAngle(defaultVerticalAngle);
              setDistance(1);
            }}
          >
            重置
          </button>
        </div>

        <div className="tapnow-multi-angle-controls">
          <MultiAngleSlider
            label="旋转"
            value={horizontalIndex}
            min={0}
            max={horizontalAngles.length - 1}
            step={1}
            defaultValue={horizontalAngles.indexOf(defaultHorizontalAngle)}
            displayValue={`${horizontalAngle}° · ${horizontalLabelMap[horizontalAngle]}`}
            onChange={(value) =>
              setHorizontalAngle(
                horizontalAngles[value] ?? defaultHorizontalAngle,
              )
            }
          />

          <MultiAngleSlider
            label="倾斜"
            value={verticalIndex}
            min={0}
            max={verticalAngles.length - 1}
            step={1}
            defaultValue={verticalAngles.indexOf(defaultVerticalAngle)}
            displayValue={`${verticalAngle}° · ${verticalLabelMap[verticalAngle]}`}
            onChange={(value) =>
              setVerticalAngle(verticalAngles[value] ?? defaultVerticalAngle)
            }
          />

          <MultiAngleSlider
            label="缩放"
            value={distance}
            min={0}
            max={2}
            step={1}
            defaultValue={1}
            displayValue={
              distance === 0 ? "近景" : distance === 1 ? "中景" : "远景"
            }
            onChange={(value) => setDistance(value as 0 | 1 | 2)}
          />

          <div className="tapnow-multi-angle-submit">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                void onSubmit({
                  horizontalAngle,
                  verticalAngle,
                  distance,
                  size: multiAngleSize,
                })
              }
            >
              <span className="tapnow-multi-angle-submit-meta">
                <span className="tapnow-multi-angle-submit-token" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span className="tapnow-multi-angle-submit-credits">
                  {isCreditsLoading ? "..." : (requiredCredits ?? "--")}
                </span>
              </span>
              <span className="tapnow-multi-angle-submit-icon">
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-5" strokeWidth={2.2} />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MultiAngleSlider({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  displayValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  displayValue: string;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  const defaultPercent = ((defaultValue - min) / (max - min)) * 100;
  const fillLeft = Math.min(percent, defaultPercent);
  const fillWidth = Math.abs(percent - defaultPercent);

  return (
    <label className="tapnow-multi-angle-slider">
      <span>{label}</span>
      <div className="tapnow-multi-angle-slider-track">
        <div className="tapnow-multi-angle-slider-rail" />
        <div
          className="tapnow-multi-angle-slider-fill"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <div
          className="tapnow-multi-angle-slider-thumb"
          style={{ left: `calc(${percent}% - 7px)` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <strong>{displayValue}</strong>
    </label>
  );
}

function ImageMaskOverlay({
  imageUrl,
  mode,
  pending,
  onClose,
  onSubmit,
}: {
  imageUrl: string;
  mode: ImageEditorMode;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: { prompt: string; maskDataUrl: string }) => Promise<void>;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [brushSize, setBrushSize] = useState(28);
  const [prompt, setPrompt] = useState("");
  const [tool, setTool] = useState<"brush" | "rect" | "erase">("brush");
  const [drawing, setDrawing] = useState(false);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [rectPreview, setRectPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [, setHistoryVersion] = useState(0);
  const isEraseMode = mode === "erase";
  const { credits: requiredCredits, isLoading: isCreditsLoading } =
    useEstimateCredits("image-eraser");

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [canvas.toDataURL("image/png")];
    historyIndexRef.current = 0;
    setHistoryVersion((value) => value + 1);
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL("image/png");
    const nextHistory = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );
    if (nextHistory[nextHistory.length - 1] === snapshot) return;
    nextHistory.push(snapshot);
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setHistoryVersion((value) => value + 1);
  };

  const restoreHistory = (index: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const snapshot = historyRef.current[index];
    if (!canvas || !context || !snapshot) return;
    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      historyIndexRef.current = index;
      setHistoryVersion((value) => value + 1);
    };
    image.src = snapshot;
  };

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    const sync = () => {
      canvas.width = image.clientWidth;
      canvas.height = image.clientHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      historyRef.current = [];
      historyIndexRef.current = -1;
      resetCanvas();
    };
    if (image.complete) sync();
    image.onload = sync;
  }, [imageUrl]);

  useEffect(() => {
    setTool("brush");
  }, [mode]);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const drawDot = (x: number, y: number, clear = false) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.save();
    context.globalCompositeOperation = clear
      ? "destination-out"
      : "source-over";
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const drawSegment = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    clear = false,
  ) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.save();
    context.globalCompositeOperation = clear
      ? "destination-out"
      : "source-over";
    context.strokeStyle = "#ffffff";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.restore();
  };

  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  return createPortal(
    <div className="tapnow-image-tool-backdrop" onClick={onClose}>
      <div
        className="tapnow-image-mask-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tapnow-image-mask-stage">
          <div className="tapnow-image-mask-toolbar">
            <button type="button" onClick={onClose}>
              <X className="size-4" />
            </button>
            <span className="tapnow-image-mask-divider" />
            <div className="tapnow-image-mask-tool-group">
              <button
                type="button"
                className={tool === "brush" ? "is-active" : ""}
                onClick={() => setTool("brush")}
              >
                <Paintbrush className="size-4" />
              </button>
              <button
                type="button"
                className={tool === "rect" ? "is-active" : ""}
                onClick={() => setTool("rect")}
              >
                <Square className="size-4" />
              </button>
              <button
                type="button"
                className={tool === "erase" ? "is-active" : ""}
                onClick={() => setTool("erase")}
              >
                <Eraser className="size-4" />
              </button>
            </div>
            <span className="tapnow-image-mask-divider" />
            <button
              type="button"
              disabled={historyIndexRef.current <= 0}
              onClick={() => restoreHistory(historyIndexRef.current - 1)}
            >
              <Undo2 className="size-4" />
            </button>
            <button
              type="button"
              disabled={
                historyIndexRef.current >= historyRef.current.length - 1
              }
              onClick={() => restoreHistory(historyIndexRef.current + 1)}
            >
              <Redo2 className="size-4" />
            </button>
            <span className="tapnow-image-mask-divider" />
            <div className="tapnow-image-mask-slider-wrap">
              <span className="tapnow-image-mask-brush-preview" aria-hidden>
                <svg
                  viewBox="0 0 24 32"
                  className="tapnow-image-mask-brush-preview-curve"
                  style={{
                    ["--tapnow-brush-stroke-width" as string]: `${Math.max(
                      4,
                      Math.min(14, Math.round(brushSize * 0.18)),
                    )}px`,
                  }}
                >
                  <path d="M14 4C10 6 9 10 12 13C15 16 16 19 12 22C9 24 9 28 13 29" />
                </svg>
              </span>
              <input
                className="tapnow-image-mask-slider"
                type="range"
                min={8}
                max={72}
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="tapnow-image-mask-canvas" ref={wrapperRef}>
            <img ref={imageRef} src={imageUrl} alt="" />
            <canvas
              ref={canvasRef}
              onPointerDown={(event) => {
                const point = getCanvasPoint(event.clientX, event.clientY);
                if (!point) return;
                setDrawing(true);
                lastPointRef.current = point;
                if (tool === "rect") {
                  setRectStart(point);
                  setRectPreview({
                    x: point.x,
                    y: point.y,
                    width: 0,
                    height: 0,
                  });
                  return;
                }
                drawDot(point.x, point.y, tool === "erase");
              }}
              onPointerMove={(event) => {
                if (!drawing) return;
                const point = getCanvasPoint(event.clientX, event.clientY);
                if (!point) return;
                if (tool === "rect") {
                  if (!rectStart) return;
                  setRectPreview({
                    x: Math.min(rectStart.x, point.x),
                    y: Math.min(rectStart.y, point.y),
                    width: Math.abs(point.x - rectStart.x),
                    height: Math.abs(point.y - rectStart.y),
                  });
                  return;
                }
                if (lastPointRef.current) {
                  drawSegment(lastPointRef.current, point, tool === "erase");
                }
                lastPointRef.current = point;
              }}
              onPointerUp={(event) => {
                const point = getCanvasPoint(event.clientX, event.clientY);
                if (tool === "rect" && rectStart && point) {
                  const canvas = canvasRef.current;
                  const context = canvas?.getContext("2d");
                  if (canvas && context) {
                    context.save();
                    context.globalCompositeOperation = "source-over";
                    context.fillStyle = "#ffffff";
                    context.fillRect(
                      Math.min(rectStart.x, point.x),
                      Math.min(rectStart.y, point.y),
                      Math.abs(point.x - rectStart.x),
                      Math.abs(point.y - rectStart.y),
                    );
                    context.restore();
                  }
                }
                setDrawing(false);
                setRectStart(null);
                setRectPreview(null);
                lastPointRef.current = null;
                pushHistory();
              }}
              onPointerLeave={() => {
                if (!drawing) return;
                setDrawing(false);
                setRectStart(null);
                setRectPreview(null);
                lastPointRef.current = null;
                pushHistory();
              }}
            />
            {tool === "rect" && rectPreview ? (
              <div
                className="tapnow-image-mask-rect-preview"
                style={{
                  left: rectPreview.x,
                  top: rectPreview.y,
                  width: rectPreview.width,
                  height: rectPreview.height,
                }}
              />
            ) : null}
          </div>

          <div
            className={[
              "tapnow-image-mask-composer",
              isEraseMode ? "tapnow-image-mask-composer-erase" : "",
            ].join(" ")}
          >
            {isEraseMode ? (
              <div className="tapnow-image-mask-actionbar">
                <div className="tapnow-image-mask-actionbar-copy">
                  绘制蒙版以擦除
                </div>
                <div className="tapnow-image-mask-actionbar-actions">
                  <button
                    type="button"
                    className="tapnow-image-mask-submit"
                    disabled={pending}
                    onClick={() => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const maskDataUrl = buildMaskDataUrl(
                        canvas,
                        canvas.width,
                        canvas.height,
                      );
                      void onSubmit({ prompt: "", maskDataUrl });
                    }}
                  >
                    <span className="tapnow-image-mask-submit-meta">
                      <span
                        className="tapnow-image-mask-submit-token"
                        aria-hidden
                      >
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="tapnow-image-mask-submit-credits">
                        {isCreditsLoading ? "..." : (requiredCredits ?? "--")}
                      </span>
                    </span>
                    <span className="tapnow-image-mask-submit-icon">
                      {pending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ArrowUp className="size-4" />
                      )}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={
                    mode === "annotate"
                      ? "描述标注区域要怎么修改..."
                      : "描述你想改变什么..."
                  }
                />
                <div className="tapnow-image-mask-footer">
                  <span>
                    {mode === "annotate"
                      ? "绘制标注以说明修改区域"
                      : "绘制蒙版以重绘"}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const maskDataUrl = buildMaskDataUrl(
                        canvas,
                        canvas.width,
                        canvas.height,
                      );
                      void onSubmit({ prompt, maskDataUrl });
                    }}
                  >
                    {pending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    <span>生成</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ImageCropOverlay({
  imageUrl,
  pending,
  onClose,
  onSubmit,
}: {
  imageUrl: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => Promise<void>;
}) {
  const locale = useLocale();
  const copy = getCanvasCopy(locale);
  type CropAspectRatio = "free" | "1:1" | "4:3" | "16:9" | "9:16";

  const imageRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<CropAspectRatio>("free");
  const [crop, setCrop] = useState({
    x: 0.14,
    y: 0.12,
    width: 0.72,
    height: 0.76,
  });
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 1,
    height: 1,
  });
  const [imageDisplayRect, setImageDisplayRect] = useState({
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  });
  const draggingRef = useRef<{
    mode: "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    crop: typeof crop;
  } | null>(null);

  const clampCrop = (nextCrop: typeof crop) => {
    const width = Math.max(0.08, Math.min(1, nextCrop.width));
    const height = Math.max(0.08, Math.min(1, nextCrop.height));
    const x = Math.max(0, Math.min(1 - width, nextCrop.x));
    const y = Math.max(0, Math.min(1 - height, nextCrop.y));
    return { x, y, width, height };
  };

  const getNormalizedAspectRatio = (value: CropAspectRatio) => {
    if (value === "free") return null;
    const [rawW, rawH] = value.split(":").map(Number);
    const { width, height } = imageNaturalSize;
    if (!width || !height) return rawW / rawH;
    return (rawW / rawH) * (height / width);
  };

  const applyAspectConstraint = (
    draftCrop: typeof crop,
    mode: "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se",
  ) => {
    if (aspectRatio === "free") return clampCrop(draftCrop);
    const ratio = getNormalizedAspectRatio(aspectRatio);
    if (!ratio) return clampCrop(draftCrop);
    let next = { ...draftCrop };

    if (mode === "move") {
      return clampCrop(next);
    }

    if (["e", "w", "ne", "nw", "se", "sw"].includes(mode)) {
      next.height = next.width / ratio;
      if (["n", "ne", "nw"].includes(mode)) {
        next.y = draftCrop.y + draftCrop.height - next.height;
      }
    } else {
      next.width = next.height * ratio;
      if (["w", "nw", "sw"].includes(mode)) {
        next.x = draftCrop.x + draftCrop.width - next.width;
      }
    }

    return clampCrop(next);
  };

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const syncNaturalSize = () => {
      setImageNaturalSize({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
    };
    if (image.complete) syncNaturalSize();
    image.addEventListener("load", syncNaturalSize);
    return () => image.removeEventListener("load", syncNaturalSize);
  }, [imageUrl]);

  useEffect(() => {
    const syncDisplayRect = () => {
      const stage = stageRef.current;
      const { width: naturalWidth, height: naturalHeight } = imageNaturalSize;
      if (!stage || !naturalWidth || !naturalHeight) return;

      const stageRect = stage.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height) return;

      const imageRatio = naturalWidth / naturalHeight;
      const stageRatio = stageRect.width / stageRect.height;

      let width = stageRect.width;
      let height = stageRect.height;

      if (imageRatio > stageRatio) {
        height = width / imageRatio;
      } else {
        width = height * imageRatio;
      }

      setImageDisplayRect({
        left: (stageRect.width - width) / 2,
        top: (stageRect.height - height) / 2,
        width,
        height,
      });
    };

    syncDisplayRect();

    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncDisplayRect);
      return () => window.removeEventListener("resize", syncDisplayRect);
    }

    const observer = new ResizeObserver(() => syncDisplayRect());
    observer.observe(stage);
    window.addEventListener("resize", syncDisplayRect);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncDisplayRect);
    };
  }, [imageNaturalSize]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const displayedImage = imageRef.current?.getBoundingClientRect();
      if (!displayedImage?.width || !displayedImage?.height) return;
      const deltaX = (event.clientX - drag.startX) / displayedImage.width;
      const deltaY = (event.clientY - drag.startY) / displayedImage.height;
      const source = drag.crop;
      let nextCrop = { ...source };

      switch (drag.mode) {
        case "move":
          nextCrop.x = source.x + deltaX;
          nextCrop.y = source.y + deltaY;
          break;
        case "n":
          nextCrop.y = source.y + deltaY;
          nextCrop.height = source.height - deltaY;
          break;
        case "s":
          nextCrop.height = source.height + deltaY;
          break;
        case "e":
          nextCrop.width = source.width + deltaX;
          break;
        case "w":
          nextCrop.x = source.x + deltaX;
          nextCrop.width = source.width - deltaX;
          break;
        case "nw":
          nextCrop.x = source.x + deltaX;
          nextCrop.width = source.width - deltaX;
          nextCrop.y = source.y + deltaY;
          nextCrop.height = source.height - deltaY;
          break;
        case "ne":
          nextCrop.width = source.width + deltaX;
          nextCrop.y = source.y + deltaY;
          nextCrop.height = source.height - deltaY;
          break;
        case "sw":
          nextCrop.x = source.x + deltaX;
          nextCrop.width = source.width - deltaX;
          nextCrop.height = source.height + deltaY;
          break;
        case "se":
          nextCrop.width = source.width + deltaX;
          nextCrop.height = source.height + deltaY;
          break;
      }

      setCrop(applyAspectConstraint(nextCrop, drag.mode));
    };

    const handlePointerUp = () => {
      draggingRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const updateAspectRatio = (value: CropAspectRatio) => {
    setAspectRatio(value);
    if (value === "free") return;
    const ratio = getNormalizedAspectRatio(value);
    if (!ratio) return;
    setCrop(() => {
      const maxWidth = 0.86;
      const maxHeight = 0.82;
      let width = maxWidth;
      let height = width / ratio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      return {
        x: (1 - width) / 2,
        y: (1 - height) / 2,
        width,
        height,
      };
    });
  };

  return createPortal(
    <div className="tapnow-image-tool-backdrop" onClick={onClose}>
      <div
        className="tapnow-image-crop-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div ref={stageRef} className="tapnow-image-crop-stage">
          <img ref={imageRef} src={imageUrl} alt="" />
          <div
            className="tapnow-image-crop-mask tapnow-image-crop-mask-top"
            style={{
              left: `${imageDisplayRect.left + imageDisplayRect.width * crop.x}px`,
              top: `${imageDisplayRect.top}px`,
              width: `${imageDisplayRect.width * crop.width}px`,
              height: `${imageDisplayRect.height * crop.y}px`,
            }}
          />
          <div
            className="tapnow-image-crop-mask tapnow-image-crop-mask-left"
            style={{
              left: `${imageDisplayRect.left}px`,
              top: `${imageDisplayRect.top + imageDisplayRect.height * crop.y}px`,
              width: `${imageDisplayRect.width * crop.x}px`,
              height: `${imageDisplayRect.height * crop.height}px`,
            }}
          />
          <div
            className="tapnow-image-crop-mask tapnow-image-crop-mask-right"
            style={{
              left: `${imageDisplayRect.left + imageDisplayRect.width * (crop.x + crop.width)}px`,
              top: `${imageDisplayRect.top + imageDisplayRect.height * crop.y}px`,
              width: `${imageDisplayRect.width * (1 - crop.x - crop.width)}px`,
              height: `${imageDisplayRect.height * crop.height}px`,
            }}
          />
          <div
            className="tapnow-image-crop-mask tapnow-image-crop-mask-bottom"
            style={{
              left: `${imageDisplayRect.left + imageDisplayRect.width * crop.x}px`,
              top: `${imageDisplayRect.top + imageDisplayRect.height * (crop.y + crop.height)}px`,
              width: `${imageDisplayRect.width * crop.width}px`,
              height: `${imageDisplayRect.height * (1 - crop.y - crop.height)}px`,
            }}
          />
          <div
            className="tapnow-image-crop-frame"
            style={{
              left: `${imageDisplayRect.left + imageDisplayRect.width * crop.x}px`,
              top: `${imageDisplayRect.top + imageDisplayRect.height * crop.y}px`,
              width: `${imageDisplayRect.width * crop.width}px`,
              height: `${imageDisplayRect.height * crop.height}px`,
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              draggingRef.current = {
                mode: "move",
                startX: event.clientX,
                startY: event.clientY,
                crop,
              };
            }}
          >
            <div className="tapnow-image-crop-grid" aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </div>
            {[
              ["n", "tapnow-image-crop-handle-edge tapnow-image-crop-handle-n"],
              ["s", "tapnow-image-crop-handle-edge tapnow-image-crop-handle-s"],
              ["e", "tapnow-image-crop-handle-edge tapnow-image-crop-handle-e"],
              ["w", "tapnow-image-crop-handle-edge tapnow-image-crop-handle-w"],
              [
                "nw",
                "tapnow-image-crop-handle-corner tapnow-image-crop-handle-nw",
              ],
              [
                "ne",
                "tapnow-image-crop-handle-corner tapnow-image-crop-handle-ne",
              ],
              [
                "sw",
                "tapnow-image-crop-handle-corner tapnow-image-crop-handle-sw",
              ],
              [
                "se",
                "tapnow-image-crop-handle-corner tapnow-image-crop-handle-se",
              ],
            ].map(([mode, className]) => (
              <button
                key={mode}
                type="button"
                className={className}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  draggingRef.current = {
                    mode: mode as
                      | "n"
                      | "s"
                      | "e"
                      | "w"
                      | "nw"
                      | "ne"
                      | "sw"
                      | "se",
                    startX: event.clientX,
                    startY: event.clientY,
                    crop,
                  };
                }}
              />
            ))}
          </div>
        </div>
        <div className="tapnow-image-crop-toolbar">
          <button type="button" onClick={onClose}>
            <X className="size-4" />
          </button>
          <span className="tapnow-image-mask-divider" />
          <div className="tapnow-image-crop-ratios">
            {[
              ["free", "宽高比"],
              ["1:1", "1:1"],
              ["4:3", "4:3"],
              ["16:9", "16:9"],
              ["9:16", "9:16"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={aspectRatio === value ? "is-active" : ""}
                onClick={() => updateAspectRatio(value as CropAspectRatio)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tapnow-image-crop-confirm"
            disabled={pending}
            onClick={() => void onSubmit(crop)}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            <span>{copy.common.confirmCrop}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TapnowCanvasNode(props: NodeProps) {
  const locale = useLocale();
  const copy = getCanvasCopy(locale);
  const data = props.data as TapnowNodeData;
  const reactFlow = useReactFlow();
  const node = data.canvasNode;
  const presentation = getCanvasNodePresentation(node, copy);
  const isText = node.kind === "text";
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const selected =
    props.selected ||
    data.selectedNodeId === node.id ||
    (isText && isTextEditing) ||
    isTitleEditing;
  const isMedia = node.kind === "result" || node.kind === "input";
  const isWorkflow = node.kind === "workflow";
  const isCommand = node.kind === "command";
  const isReferenceMuted =
    Boolean(data.isReferenceSelectionActive) &&
    !data.isReferenceSelectionEligible &&
    !data.isReferenceSelectionAnchor;
  const isConnectionMuted =
    Boolean(data.isConnectionModeActive) &&
    !data.isConnectionCandidate &&
    !data.isConnectionAnchor;
  const textEditorRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const initialTextDraft = node.kind === "text" ? node.data.content : "";
  const [textDraft, setTextDraft] = useState(initialTextDraft);
  const [titleDraft, setTitleDraft] = useState("");
  const [isFullscreenEditorOpen, setIsFullscreenEditorOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeImageOverlay, setActiveImageOverlay] = useState<
    | null
    | "crop"
    | "redraw"
    | "erase"
    | "annotate"
    | "upscale"
    | "expand"
    | "relight"
    | "multiple-angles"
    | "more"
  >(null);
  const [activeVideoOverlay, setActiveVideoOverlay] =
    useState<VideoToolbarMode | null>(null);
  const [isImageToolPending, setIsImageToolPending] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoCleanSelection, setVideoCleanSelection] =
    useState<NormalizedSelectionRect | null>(null);
  const [videoCleanDraftSelection, setVideoCleanDraftSelection] =
    useState<NormalizedSelectionRect | null>(null);
  const [isVideoCleanSelecting, setIsVideoCleanSelecting] = useState(false);
  const [isVideoSegmentationPending, setIsVideoSegmentationPending] =
    useState(false);
  const [isVideoUpscalePending, setIsVideoUpscalePending] = useState(false);
  const [videoUpscaleError, setVideoUpscaleError] = useState("");
  const [videoCleanStatus, setVideoCleanStatus] = useState("");
  const [videoCleanMask, setVideoCleanMask] =
    useState<CanvasSegmentationRle | null>(null);
  const [videoCleanPreviewUrl, setVideoCleanPreviewUrl] = useState<
    string | null
  >(null);
  const [videoCleanFrameTime, setVideoCleanFrameTime] = useState(0);
  const [isVideoCleanSelectorOpen, setIsVideoCleanSelectorOpen] =
    useState(false);
  const textDraftRef = useRef(initialTextDraft);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoPreviewRef = useRef<HTMLDivElement | null>(null);
  const videoMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dispatchOverlayActivity = useCallback(
    (active: boolean) => {
      window.dispatchEvent(
        new CustomEvent("z-image:canvas-overlay-activity", {
          detail: {
            nodeId: node.id,
            active,
          },
        }),
      );
    },
    [node.id],
  );
  const visualSize = isWorkflow
    ? { width: 228, height: 228 }
    : { width: node.size.width, height: node.size.height };

  const fallbackNodeTitle =
    presentation.eyebrow === "Workflow"
      ? presentation.title
      : node.kind === "result" &&
          node.data.mediaKind === "image" &&
          node.data.prompt
        ? node.data.prompt
        : isCommand
          ? "Continue"
          : presentation.eyebrow;
  const nodeTitle = String(node.data.title || "").trim() || fallbackNodeTitle;
  const isUploadableImageInput =
    node.kind === "input" &&
    (node.data.mediaKind === "image" || !node.data.mediaKind);
  const isUploadableVideoInput =
    node.kind === "input" && node.data.mediaKind === "video";
  const isVideoWorkflow =
    node.kind === "workflow" &&
    (node.subtype === "text-to-video" || node.subtype === "image-to-video");
  const imageResourceUrl =
    node.kind === "workflow"
      ? node.data.generatedImageUrl || node.data.uploadedImageUrl
      : node.kind === "input" && node.data.mediaKind === "image"
        ? node.data.url
        : node.kind === "result" && node.data.mediaKind === "image"
          ? node.data.url
          : undefined;
  const videoResourceUrl =
    node.kind === "workflow"
      ? node.data.generatedVideoUrl || node.data.uploadedVideoUrl
      : node.kind === "input" && node.data.mediaKind === "video"
        ? node.data.url
        : node.kind === "result" && node.data.mediaKind === "video"
          ? node.data.url
          : undefined;
  const hasImageResource = Boolean(imageResourceUrl);
  const hasVideoResource = Boolean(videoResourceUrl);
  const isVideoNode = isMedia && Boolean(videoResourceUrl);
  const isTrimmedVideoResult =
    node.kind === "result" &&
    node.data.mediaKind === "video" &&
    node.data.derivationKind === "video-trim";
  const isVideoLikeNode = isVideoWorkflow || isVideoNode;
  const isImageLikeNode =
    (isWorkflow && !isVideoWorkflow) ||
    (node.kind === "input" &&
      (node.data.mediaKind === "image" || !node.data.mediaKind)) ||
    (node.kind === "result" && node.data.mediaKind === "image");
  const isUploadableImageWorkflow =
    node.kind === "workflow" &&
    (node.subtype === "text-to-image" || node.subtype === "image-to-image") &&
    !data.hasReferenceInput &&
    !node.data.uploadedImageUrl &&
    !node.data.generatedImageUrl;
  const isUploadableVideoWorkflow =
    isVideoWorkflow &&
    !data.hasReferenceInput &&
    !node.data.uploadedVideoUrl &&
    !node.data.generatedVideoUrl;
  const canUploadImage =
    (isUploadableImageInput && !hasImageResource) || isUploadableImageWorkflow;
  const canUploadVideo =
    (isUploadableVideoInput && !hasVideoResource) || isUploadableVideoWorkflow;
  const canReplaceImage =
    (node.kind === "workflow" &&
      Boolean(node.data.uploadedImageUrl || node.data.generatedImageUrl)) ||
    (node.kind === "input" && node.data.mediaKind === "image");
  const canReplaceVideo =
    (node.kind === "workflow" &&
      Boolean(node.data.uploadedVideoUrl || node.data.generatedVideoUrl)) ||
    (node.kind === "input" && node.data.mediaKind === "video");
  const showVideoMuteButton = node.kind !== "result";
  const showVideoReplaceButton = canReplaceVideo;
  const showVideoPlaybackControls = node.kind !== "result";
  const isCroppedImageResult =
    node.kind === "result" &&
    node.data.mediaKind === "image" &&
    String(node.data.prompt || "")
      .trim()
      .toLowerCase() === "cropped image";

  const animateViewportToNode = async ({
    maxZoom = 2.2,
    widthPadding = 1.12,
    heightPadding = 1.18,
    minZoom = 0.92,
  }: {
    maxZoom?: number;
    widthPadding?: number;
    heightPadding?: number;
    minZoom?: number;
  } = {}) => {
    if (typeof window === "undefined") return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetScale = Math.min(
      maxZoom,
      Math.max(
        minZoom,
        Math.min(
          viewportWidth / (Math.max(visualSize.width, 1) * widthPadding),
          viewportHeight / (Math.max(visualSize.height, 1) * heightPadding),
        ),
      ),
    );
    const centerX = node.position.x + visualSize.width / 2;
    const centerY = node.position.y + visualSize.height / 2;
    await reactFlow.setViewport(
      {
        x: viewportWidth / 2 - centerX * targetScale,
        y: viewportHeight / 2 - centerY * targetScale,
        zoom: targetScale,
      },
      { duration: 320 },
    );
  };

  useEffect(() => {
    if (node.kind !== "text") return;
    if (isTextEditing) return;
    if (document.activeElement === textEditorRef.current) return;
    textDraftRef.current = node.data.content;
    setTextDraft(node.data.content);
    if (
      textEditorRef.current &&
      textEditorRef.current.innerHTML !== node.data.content
    ) {
      textEditorRef.current.innerHTML = node.data.content;
    }
  }, [isTextEditing, node]);

  useEffect(() => {
    const editor = textEditorRef.current;
    if (!editor || document.activeElement === editor) return;
    if (editor.innerHTML !== textDraft) {
      editor.innerHTML = textDraft;
    }
  }, [textDraft]);

  useEffect(() => {
    if (!isTitleEditing) {
      setTitleDraft(nodeTitle);
    }
  }, [isTitleEditing, nodeTitle]);

  useEffect(() => {
    if (!selected && activeImageOverlay) {
      setActiveImageOverlay(null);
    }
  }, [activeImageOverlay, selected]);

  useEffect(() => {
    if (!selected && activeVideoOverlay) {
      setActiveVideoOverlay(null);
    }
  }, [activeVideoOverlay, selected]);

  useEffect(() => {
    if (activeVideoOverlay !== "clean") {
      setIsVideoCleanSelecting(false);
      setIsVideoCleanSelectorOpen(false);
      setVideoCleanDraftSelection(null);
    }
  }, [activeVideoOverlay]);

  useEffect(() => {
    if (activeVideoOverlay !== "quality") {
      setVideoUpscaleError("");
    }
  }, [activeVideoOverlay]);

  useEffect(() => {
    const hasActiveOverlay = Boolean(
      activeImageOverlay ||
      activeVideoOverlay ||
      isImagePreviewOpen ||
      isVideoPreviewOpen ||
      isVideoCleanSelectorOpen,
    );

    dispatchOverlayActivity(hasActiveOverlay);

    return () => {
      dispatchOverlayActivity(false);
    };
  }, [
    activeImageOverlay,
    activeVideoOverlay,
    dispatchOverlayActivity,
    isImagePreviewOpen,
    isVideoPreviewOpen,
    isVideoCleanSelectorOpen,
  ]);

  useEffect(() => {
    const canvas = videoMaskCanvasRef.current;
    const preview = videoPreviewRef.current;
    const videoElement = videoRef.current;
    if (!canvas) return;

    if (
      activeVideoOverlay !== "clean" ||
      !videoCleanMask ||
      !preview ||
      !videoElement?.videoWidth ||
      !videoElement?.videoHeight
    ) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    drawSegmentationMaskToCanvas({
      canvas,
      mask: videoCleanMask,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight,
      containerWidth: preview.clientWidth,
      containerHeight: preview.clientHeight,
    });
  }, [activeVideoOverlay, videoCleanMask, videoDuration]);

  useEffect(() => {
    if (!isTitleEditing) return;
    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  }, [isTitleEditing]);

  useEffect(() => {
    const editor = textEditorRef.current;
    if (!editor) return;

    const stopNativeEvent = (event: Event) => {
      event.stopPropagation();
    };

    editor.addEventListener("pointerdown", stopNativeEvent);
    editor.addEventListener("pointermove", stopNativeEvent);
    editor.addEventListener("pointerup", stopNativeEvent);
    editor.addEventListener("mousedown", stopNativeEvent);
    editor.addEventListener("mousemove", stopNativeEvent);
    editor.addEventListener("mouseup", stopNativeEvent);
    editor.addEventListener("click", stopNativeEvent);

    return () => {
      editor.removeEventListener("pointerdown", stopNativeEvent);
      editor.removeEventListener("pointermove", stopNativeEvent);
      editor.removeEventListener("pointerup", stopNativeEvent);
      editor.removeEventListener("mousedown", stopNativeEvent);
      editor.removeEventListener("mousemove", stopNativeEvent);
      editor.removeEventListener("mouseup", stopNativeEvent);
      editor.removeEventListener("click", stopNativeEvent);
    };
  }, [isText]);

  const updateTextDraft = (nextValue: string) => {
    textDraftRef.current = nextValue;
    setTextDraft(nextValue);
  };

  const commitTextChange = (nextValue = textDraftRef.current) => {
    updateTextDraft(nextValue);
    data.onTextChange(node.id, nextValue);
  };

  const commitTitleChange = (nextTitle = titleDraft) => {
    const normalizedTitle = nextTitle.trim() || fallbackNodeTitle;
    setTitleDraft(normalizedTitle);
    data.onNodeTitleChange(node.id, normalizedTitle);
    setIsTitleEditing(false);
  };

  const cancelTitleEditing = () => {
    setTitleDraft(nodeTitle);
    setIsTitleEditing(false);
  };

  const stopEditorPointerEvent = (
    event: ReactPointerEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();
    if (!isTextEditing) {
      event.preventDefault();
    }
  };

  const stopTitleEvent = (
    event:
      | ReactPointerEvent<HTMLElement>
      | ReactMouseEvent<HTMLElement>
      | ReactKeyboardEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
  };

  const clearVideoCleanState = () => {
    setVideoCleanSelection(null);
    setVideoCleanDraftSelection(null);
    setVideoCleanMask(null);
    setVideoCleanPreviewUrl(null);
    setVideoCleanFrameTime(0);
    setVideoCleanStatus("");
    setIsVideoCleanSelecting(false);
    setIsVideoCleanSelectorOpen(false);
  };

  const beginVideoCleanSelection = () => {
    setVideoCleanMask(null);
    setVideoCleanPreviewUrl(null);
    setVideoCleanStatus("请在浮层中框选目标区域");
    setVideoCleanDraftSelection(null);
    setIsVideoCleanSelecting(true);
    const element = videoRef.current;
    if (element) {
      element.pause();
      setIsVideoPlaying(false);
    }
    if (!videoResourceUrl) {
      setIsVideoCleanSelecting(false);
      setVideoCleanStatus("视频地址不可用，请稍后重试");
      return;
    }
    setIsVideoCleanSelectorOpen(true);
  };

  const handleVideoCleanGenerateWithSelection = async (
    selectionOverride?: NormalizedSelectionRect | null,
    frameTimeOverride?: number | null,
  ) => {
    const selection = selectionOverride ?? videoCleanSelection;
    if (!selection || !isValidSelectionRect(selection) || !videoResourceUrl) {
      return;
    }

    setIsVideoSegmentationPending(true);
    setVideoCleanStatus("正在分析当前帧...");

    try {
      const frameTime =
        frameTimeOverride ??
        videoCleanFrameTime ??
        videoRef.current?.currentTime ??
        videoCurrentTime ??
        0;

      const snapshot = await createReadyVideoSnapshot({
        videoUrl: videoResourceUrl,
        currentTime: frameTime,
      });

      const boxPrompt = selectionToVideoBoxPrompt(
        selection,
        snapshot.width,
        snapshot.height,
      );

      if (boxPrompt.x2 <= boxPrompt.x1 || boxPrompt.y2 <= boxPrompt.y1) {
        throw new Error("选区无效，请重新框选");
      }

      const result = await data.onVideoSegmentation(node.id, {
        frameTime: snapshot.currentTime,
        duration:
          snapshot.duration || videoDuration || videoRef.current?.duration || 0,
        videoUrl: videoResourceUrl,
        prompt: "selected object",
        boxPrompt,
      });

      if (!result.mask) {
        throw new Error("分割结果为空");
      }

      setVideoCleanMask(result.mask);
      setVideoCleanFrameTime(snapshot.currentTime);
      const previewUrl = await buildVideoCleanCardPreview({
        frameDataUrl: snapshot.frameDataUrl,
        mask: result.mask,
        boxPrompt,
      });
      setVideoCleanPreviewUrl(previewUrl);
      setVideoCleanStatus("已完成目标识别，可继续生成清除结果");
    } catch (error) {
      setVideoCleanMask(null);
      setVideoCleanPreviewUrl(null);
      setVideoCleanStatus(
        error instanceof Error ? error.message : "分割失败，请稍后重试",
      );
    } finally {
      setIsVideoSegmentationPending(false);
    }
  };

  const handleVideoCleanGenerate = async () => {
    await handleVideoCleanGenerateWithSelection();
  };

  const handleVideoUpscaleConfirm = async (payload: {
    targetResolution: CanvasVideoUpscaleTargetResolution;
  }) => {
    if (!videoResourceUrl) return;

    setIsVideoUpscalePending(true);
    setVideoUpscaleError("");

    try {
      const duration = await resolveVideoDuration(
        videoResourceUrl,
        videoDuration || videoRef.current?.duration || 0,
      );

      if (!duration) {
        throw new Error("视频总时长尚未就绪，请稍后重试");
      }

      await data.onVideoUpscale(node.id, {
        videoUrl: videoResourceUrl,
        targetResolution: payload.targetResolution,
        duration,
      });
      setActiveVideoOverlay(null);
    } catch (error) {
      setVideoUpscaleError(
        error instanceof Error ? error.message : "高清增强提交失败",
      );
    } finally {
      setIsVideoUpscalePending(false);
    }
  };

  const handleVideoCleanSelectionConfirmed = async (
    selection: NormalizedSelectionRect,
    frameTime: number,
  ) => {
    setVideoCleanSelection(selection);
    setVideoCleanMask(null);
    setVideoCleanPreviewUrl(null);
    setVideoCleanFrameTime(frameTime);
    setVideoCleanStatus("正在识别目标区域...");
    setIsVideoCleanSelecting(false);
    setIsVideoCleanSelectorOpen(false);
    await handleVideoCleanGenerateWithSelection(selection, frameTime);
  };

  const renderNodeBody = () => {
    if (isVideoNode && videoResourceUrl && !isTrimmedVideoResult) {
      return (
        <div
          ref={videoPreviewRef}
          className="tapnow-node-preview tapnow-video-preview-shell"
        >
          <HoverPlayableVideo
            videoRef={videoRef}
            src={videoResourceUrl}
            className="tapnow-video-preview-media"
            muted={isVideoMuted}
            hoverEnabled={activeVideoOverlay !== "clean"}
            onLoadedMetadata={(event) => {
              setVideoDuration(event.currentTarget.duration || 5);
              event.currentTarget.currentTime = 0;
            }}
            onTimeUpdate={(event) => {
              setVideoCurrentTime(event.currentTarget.currentTime || 0);
            }}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
          />
          {activeVideoOverlay === "clean" ? (
            <canvas
              ref={videoMaskCanvasRef}
              className="tapnow-video-clean-mask-layer"
              aria-hidden
            />
          ) : null}
          <div
            className={[
              "tapnow-video-preview-overlay",
              activeVideoOverlay === "clean"
                ? "tapnow-video-preview-overlay-clean"
                : "",
            ].join(" ")}
          >
            {showVideoMuteButton ? (
              <button
                type="button"
                className="tapnow-video-preview-mute"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const nextMuted = !isVideoMuted;
                  setIsVideoMuted(nextMuted);
                  if (videoRef.current) {
                    videoRef.current.muted = nextMuted;
                  }
                }}
              >
                {isVideoMuted ? "静音" : "有声"}
              </button>
            ) : null}
            {showVideoReplaceButton ? (
              <button
                type="button"
                className="tapnow-video-preview-replace"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  uploadInputRef.current?.click();
                }}
              >
                <Upload className="size-4" />
                <span>替换</span>
              </button>
            ) : null}
            {showVideoPlaybackControls ? (
              <div className="tapnow-video-preview-controls">
                <button
                  type="button"
                  className="tapnow-video-preview-icon"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const element = videoRef.current;
                    if (!element) return;
                    if (element.paused) {
                      void element.play();
                      setIsVideoPlaying(true);
                    } else {
                      element.pause();
                      setIsVideoPlaying(false);
                    }
                  }}
                >
                  {isVideoPlaying ? <PauseGlyph /> : <PlayGlyph />}
                </button>
                <span>{formatVideoTime(videoCurrentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(videoDuration, 0.1)}
                  step={0.01}
                  value={Math.min(
                    videoCurrentTime,
                    Math.max(videoDuration, 0.1),
                  )}
                  onChange={(event) => {
                    const nextTime = Number(event.target.value);
                    setVideoCurrentTime(nextTime);
                    if (videoRef.current) {
                      videoRef.current.currentTime = nextTime;
                    }
                  }}
                />
                <span>{formatVideoTime(videoDuration || 5)}</span>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (isMedia) {
      return (
        <div className="tapnow-node-preview">
          <NodePreview node={node} thumbnailUrl={presentation.thumbnailUrl} />
        </div>
      );
    }

    if (isText) {
      return (
        <div
          className="tapnow-node-card tapnow-node-text-card"
          style={{
            background: node.data.backgroundColor || undefined,
          }}
        >
          <div
            ref={textEditorRef}
            contentEditable={isTextEditing}
            suppressContentEditableWarning
            data-placeholder={copy.common.editPlaceholder}
            onInput={(event) => {
              textDraftRef.current = event.currentTarget.innerHTML;
            }}
            onPointerDownCapture={stopEditorPointerEvent}
            onMouseDownCapture={stopEditorPointerEvent}
            onPointerMoveCapture={(event) => {
              if (isTextEditing) event.stopPropagation();
            }}
            onMouseMoveCapture={(event) => {
              if (isTextEditing) event.stopPropagation();
            }}
            onMouseUpCapture={(event) => {
              if (isTextEditing) event.stopPropagation();
            }}
            onClickCapture={stopEditorPointerEvent}
            onPointerDown={stopEditorPointerEvent}
            onMouseDown={stopEditorPointerEvent}
            onMouseUp={(event) => {
              if (isTextEditing) event.stopPropagation();
            }}
            onClick={stopEditorPointerEvent}
            onPaste={(event) => {
              if (!isTextEditing) return;
              event.preventDefault();
              const text = event.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
              textDraftRef.current = event.currentTarget.innerHTML;
            }}
            onBlur={() => {
              if (
                node.kind === "text" &&
                textDraftRef.current !== node.data.content
              ) {
                data.onTextChange(node.id, textDraftRef.current);
              }
              setIsTextEditing(false);
            }}
            onKeyDown={(event) => {
              if (!isTextEditing) return;
              // 文本编辑时键盘事件不能冒泡给画布快捷键，否则 Enter/Delete 可能影响节点。
              event.stopPropagation();
            }}
            onKeyUp={(event) => {
              if (isTextEditing) event.stopPropagation();
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.currentTarget.focus();
              setIsTextEditing(true);
              event.stopPropagation();
            }}
            className={[
              "nodrag nopan tapnow-text-editor",
              isTextEditing ? "tapnow-text-editor-editing" : "",
            ].join(" ")}
          />
        </div>
      );
    }

    if (isCommand) {
      return (
        <div className="tapnow-node-card tapnow-node-plain-card">
          <div className="tapnow-command-icon">
            <List className="size-5" />
          </div>
          <div className="tapnow-node-main-title">{presentation.title}</div>
        </div>
      );
    }

    if (isWorkflow) {
      return (
        <div className="tapnow-node-preview">
          <NodePreview
            node={node}
            thumbnailUrl={
              node.kind === "workflow"
                ? node.data.generatedVideoUrl ||
                  node.data.generatedImageUrl ||
                  node.data.uploadedVideoUrl ||
                  node.data.uploadedImageUrl
                : undefined
            }
          />
        </div>
      );
    }

    return (
      <div className="tapnow-node-card tapnow-node-plain-card">
        <div className="tapnow-node-main-title">
          {copy.common.editPlaceholder}
        </div>
      </div>
    );
  };

  const uploadImageFile = async (file?: File) => {
    if (
      !file ||
      (!canUploadImage &&
        !canReplaceImage &&
        !canUploadVideo &&
        !canReplaceVideo) ||
      isUploadingImage
    )
      return;
    setIsUploadingImage(true);
    try {
      await data.onImageUpload(node.id, file);
    } finally {
      setIsUploadingImage(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  const downloadImageResource = async () => {
    if (!imageResourceUrl) return;
    const filename = sanitizeDownloadFilename(
      node.kind === "workflow"
        ? node.data.uploadedImageName || "image"
        : "image",
      "png",
    );
    const forcedDownloadUrl = getForcedDownloadUrl(imageResourceUrl, filename);

    try {
      const response = await fetch(imageResourceUrl, {
        mode: "cors",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download image resource failed:", error);
      const anchor = document.createElement("a");
      anchor.href = forcedDownloadUrl;
      anchor.download = filename;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  };

  const downloadVideoResource = async () => {
    if (!videoResourceUrl) return;
    const filename = sanitizeDownloadFilename(
      node.kind === "workflow"
        ? node.data.uploadedVideoName || nodeTitle || "video"
        : nodeTitle || "video",
      "mp4",
    );
    const forcedDownloadUrl = getForcedDownloadUrl(videoResourceUrl, filename);

    try {
      const response = await fetch(videoResourceUrl, {
        mode: "cors",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download video resource failed:", error);
      const anchor = document.createElement("a");
      anchor.href = forcedDownloadUrl;
      anchor.download = filename;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  };

  const expandImageResource = () => {
    if (!imageResourceUrl) return;
    void animateViewportToNode().then(() => {
      window.setTimeout(() => setActiveImageOverlay("expand"), 80);
    });
  };

  const runImageToolAction = async (
    request: Omit<CanvasImageToolRequest, "nodeId">,
  ) => {
    setIsImageToolPending(true);
    try {
      await data.onImageToolAction({
        nodeId: node.id,
        ...request,
      });
      setActiveImageOverlay(null);
    } finally {
      setIsImageToolPending(false);
    }
  };

  const handleCropConfirm = async (cropRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (!imageResourceUrl) return;
    setIsImageToolPending(true);
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      const imageLoad = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Failed to load image"));
      });
      image.src = imageResourceUrl;
      await imageLoad;
      const canvas = document.createElement("canvas");
      const sx = Math.round(image.naturalWidth * cropRect.x);
      const sy = Math.round(image.naturalHeight * cropRect.y);
      const sw = Math.max(1, Math.round(image.naturalWidth * cropRect.width));
      const sh = Math.max(1, Math.round(image.naturalHeight * cropRect.height));
      canvas.width = sw;
      canvas.height = sh;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Failed to crop image");
      context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Failed to create cropped image");
      const file = new File([blob], "cropped-image.png", {
        type: "image/png",
      });
      await data.onImageCrop(node.id, file);
      setActiveImageOverlay(null);
    } finally {
      setIsImageToolPending(false);
    }
  };

  const handleVideoTrimConfirm = async (meta: {
    trimStart: number;
    trimEnd: number;
    duration: number;
    isPrecise: boolean;
    isSmartClip: boolean;
  }) => {
    if (!videoResourceUrl) return;
    setIsImageToolPending(true);
    try {
      const trimmedFile = await trimVideoClipToFile({
        videoUrl: videoResourceUrl,
        trimStart: meta.trimStart,
        trimEnd: meta.trimEnd,
      });
      await data.onVideoTrim(node.id, trimmedFile, {
        trimStart: meta.trimStart,
        trimEnd: meta.trimEnd,
        duration: meta.trimEnd - meta.trimStart,
      });
      setActiveVideoOverlay(null);
    } finally {
      setIsImageToolPending(false);
    }
  };

  const handleVideoSmartClip = async (
    segments: SmartClipSegment[],
    onProgress?: (current: number, total: number) => void,
  ) => {
    if (!videoResourceUrl || !segments.length) return;
    setIsImageToolPending(true);
    try {
      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const trimmedFile = await trimVideoClipToFile({
          videoUrl: videoResourceUrl,
          trimStart: segment.start,
          trimEnd: segment.end,
        });
        await data.onVideoTrim(node.id, trimmedFile, {
          trimStart: segment.start,
          trimEnd: segment.end,
          duration: segment.end - segment.start,
        });
        onProgress?.(index + 1, segments.length);
      }
      setActiveVideoOverlay(null);
    } finally {
      setIsImageToolPending(false);
    }
  };

  return (
    <div
      className={[
        "tapnow-node group relative",
        selected ? "tapnow-node-selected" : "",
        isText ? "tapnow-node-text" : "",
        isMedia ? "tapnow-node-media" : "",
        isWorkflow ? "tapnow-node-workflow" : "",
        isImageLikeNode ? "tapnow-node-image" : "",
        isVideoLikeNode ? "tapnow-node-video" : "",
        isCommand ? "tapnow-node-command" : "",
        isCroppedImageResult ? "tapnow-node-cropped-result" : "",
        data.isReferenceSelectionActive ? "tapnow-node-reference-mode" : "",
        data.isReferenceSelectionEligible
          ? "tapnow-node-reference-eligible"
          : "",
        data.isReferenceSelectionPicked ? "tapnow-node-reference-picked" : "",
        data.isReferenceSelectionAnchor ? "tapnow-node-reference-anchor" : "",
        isReferenceMuted ? "tapnow-node-reference-muted" : "",
        data.isConnectionModeActive ? "tapnow-node-connection-mode" : "",
        data.isConnectionAnchor ? "tapnow-node-connection-anchor" : "",
        data.isConnectionCandidate ? "tapnow-node-connection-candidate" : "",
        isConnectionMuted ? "tapnow-node-connection-muted" : "",
      ].join(" ")}
      style={{
        width: visualSize.width,
        height: visualSize.height,
      }}
    >
      <div className="tapnow-node-title">
        {isText ? <Menu className="size-4" /> : null}
        {isMedia ? (
          node.kind === "result" && node.data.mediaKind === "video" ? (
            <Video className="size-4" />
          ) : node.kind === "input" && node.data.mediaKind === "video" ? (
            <Video className="size-4" />
          ) : (
            <ImageIcon className="size-4" />
          )
        ) : null}
        {isWorkflow ? (
          isVideoWorkflow ? (
            <Video className="size-4" />
          ) : (
            <ImageIcon className="size-4" />
          )
        ) : null}
        {isTitleEditing ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={() => commitTitleChange()}
            onPointerDown={stopTitleEvent}
            onMouseDown={stopTitleEvent}
            onClick={stopTitleEvent}
            onDoubleClick={stopTitleEvent}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                commitTitleChange();
              } else if (event.key === "Escape") {
                event.preventDefault();
                cancelTitleEditing();
              }
            }}
            className="nodrag nopan tapnow-node-title-input"
          />
        ) : (
          <button
            type="button"
            className="tapnow-node-title-trigger"
            onPointerDown={stopTitleEvent}
            onMouseDown={stopTitleEvent}
            onClick={stopTitleEvent}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsTitleEditing(true);
            }}
          >
            <span>{nodeTitle}</span>
          </button>
        )}
      </div>

      {isText && selected ? (
        <TextFormatToolbar
          editorRef={textEditorRef}
          value={textDraft}
          backgroundColor={node.data.backgroundColor}
          onChange={commitTextChange}
          onBackgroundChange={(backgroundColor) =>
            data.onTextBackgroundChange(node.id, backgroundColor)
          }
          onToggleExpand={() => setIsFullscreenEditorOpen(true)}
        />
      ) : null}

      {isText && isFullscreenEditorOpen ? (
        <FullscreenTextEditor
          value={textDraft}
          backgroundColor={node.data.backgroundColor}
          onChange={commitTextChange}
          onClose={() => setIsFullscreenEditorOpen(false)}
        />
      ) : null}

      {isImagePreviewOpen && imageResourceUrl ? (
        <FullscreenImagePreview
          imageUrl={imageResourceUrl}
          title={nodeTitle}
          onClose={() => setIsImagePreviewOpen(false)}
        />
      ) : null}

      {isVideoPreviewOpen && videoResourceUrl ? (
        <FullscreenVideoPreview
          videoUrl={videoResourceUrl}
          title={nodeTitle}
          onClose={() => setIsVideoPreviewOpen(false)}
        />
      ) : null}

      {selected && hasVideoResource && !isTrimmedVideoResult ? (
        <VideoResourceToolbar
          activeMode={activeVideoOverlay}
          onModeChange={(mode) => {
            if (mode === "trim") {
              dispatchOverlayActivity(true);
              void animateViewportToNode({
                maxZoom: 1.72,
                widthPadding: 1.28,
                heightPadding: 1.36,
                minZoom: 0.96,
              }).then(() => {
                window.setTimeout(() => setActiveVideoOverlay("trim"), 80);
              });
              return;
            }

            dispatchOverlayActivity(true);
            setActiveVideoOverlay((current) =>
              current === mode ? null : mode,
            );
          }}
          onDownload={() => void downloadVideoResource()}
          onFullscreenPreview={() => setIsVideoPreviewOpen(true)}
        />
      ) : null}

      {selected &&
      hasVideoResource &&
      !isTrimmedVideoResult &&
      activeVideoOverlay &&
      activeVideoOverlay !== "trim" &&
      activeVideoOverlay !== "quality" ? (
        <VideoToolbarPanel
          mode={activeVideoOverlay}
          cleanSelection={videoCleanSelection}
          isCleanSelecting={isVideoCleanSelecting}
          isCleanPending={isVideoSegmentationPending}
          cleanStatus={videoCleanStatus}
          hasCleanMask={Boolean(videoCleanMask)}
          cleanPreviewUrl={videoCleanPreviewUrl}
          onCleanSelect={beginVideoCleanSelection}
          onCleanClear={clearVideoCleanState}
          onCleanGenerate={() => void handleVideoCleanGenerate()}
        />
      ) : null}

      {activeVideoOverlay === "quality" ? (
        <VideoUpscaleOverlay
          videoUrl={videoResourceUrl || ""}
          duration={videoDuration}
          pending={isVideoUpscalePending}
          errorMessage={videoUpscaleError}
          onClose={() => {
            if (isVideoUpscalePending) return;
            setVideoUpscaleError("");
            setActiveVideoOverlay(null);
          }}
          onSubmit={handleVideoUpscaleConfirm}
        />
      ) : null}

      {selected && hasImageResource && activeImageOverlay !== "erase" ? (
        <ImageResourceToolbar
          onCrop={() => {
            dispatchOverlayActivity(true);
            void animateViewportToNode().then(() => {
              window.setTimeout(() => setActiveImageOverlay("crop"), 80);
            });
          }}
          onRelight={() => {
            dispatchOverlayActivity(true);
            setActiveImageOverlay("relight");
          }}
          onMultipleAngles={() => {
            dispatchOverlayActivity(true);
            setActiveImageOverlay("multiple-angles");
          }}
          onErase={() => {
            dispatchOverlayActivity(true);
            void animateViewportToNode().then(() => {
              window.setTimeout(() => setActiveImageOverlay("erase"), 80);
            });
          }}
          onMore={() => {
            dispatchOverlayActivity(true);
            setActiveImageOverlay((current) =>
              current === "more" ? null : "more",
            );
          }}
          onReplace={
            canReplaceImage ? () => uploadInputRef.current?.click() : undefined
          }
          onDownload={downloadImageResource}
          onFullscreenPreview={() => setIsImagePreviewOpen(true)}
          onExpand={expandImageResource}
        />
      ) : null}

      {selected && hasImageResource && activeImageOverlay === "more" ? (
        <ImageToolMoreMenu
          onClose={() => setActiveImageOverlay(null)}
          onAction={(action) => {
            if (action === "upscale") {
              dispatchOverlayActivity(true);
              setActiveImageOverlay(null);
              setActiveImageOverlay("upscale");
              return;
            }
            if (action === "cutout") {
              void runImageToolAction({ tool: "cutout" });
              return;
            }
            if (action === "quick-split-2") {
              void runImageToolAction({ tool: "quick-split", grid: 2 });
              return;
            }
            if (action === "quick-split-3") {
              void runImageToolAction({ tool: "quick-split", grid: 3 });
              return;
            }
            if (action === "quick-split-4") {
              void runImageToolAction({ tool: "quick-split", grid: 4 });
              return;
            }
            dispatchOverlayActivity(true);
            setActiveImageOverlay(action === "annotate" ? "annotate" : null);
          }}
        />
      ) : null}

      {renderNodeBody()}

      {canUploadImage ||
      canReplaceImage ||
      canUploadVideo ||
      canReplaceVideo ? (
        <>
          <input
            ref={uploadInputRef}
            type="file"
            accept={canUploadVideo || canReplaceVideo ? "video/*" : "image/*"}
            className="hidden"
            onChange={(event) =>
              void uploadImageFile(event.currentTarget.files?.[0])
            }
          />
          <button
            type="button"
            className={[
              "nodrag nopan tapnow-node-upload-button",
              hasImageResource || hasVideoResource
                ? "tapnow-node-replace-button"
                : "tapnow-node-upload-button-empty",
            ].join(" ")}
            aria-label={
              hasVideoResource || canUploadVideo || canReplaceVideo
                ? hasVideoResource
                  ? "替换视频"
                  : "上传视频"
                : hasImageResource
                  ? "替换图片"
                  : "上传图片"
            }
            disabled={isUploadingImage}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              uploadInputRef.current?.click();
            }}
          >
            {isUploadingImage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : hasImageResource || hasVideoResource ? (
              <>
                <Upload className="size-4" />
                <span>替换</span>
              </>
            ) : (
              <Upload className="size-4" />
            )}
          </button>
        </>
      ) : null}

      {data.isReferenceSelectionEligible ? (
        <div className="tapnow-reference-marquee" aria-hidden />
      ) : null}

      {data.isConnectionTargetActive ? (
        <div className="tapnow-connection-target-marquee" aria-hidden />
      ) : null}

      {imageResourceUrl && activeImageOverlay === "crop" ? (
        <ImageCropOverlay
          imageUrl={imageResourceUrl}
          pending={isImageToolPending}
          onClose={() => setActiveImageOverlay(null)}
          onSubmit={handleCropConfirm}
        />
      ) : null}

      {videoResourceUrl && activeVideoOverlay === "trim" ? (
        <VideoTrimEditor
          videoUrl={videoResourceUrl}
          title={nodeTitle}
          duration={videoDuration || 5}
          initialCurrentTime={videoCurrentTime}
          onSubmit={handleVideoTrimConfirm}
          onSmartClip={handleVideoSmartClip}
          onClose={() => setActiveVideoOverlay(null)}
        />
      ) : null}

      {isVideoCleanSelectorOpen && videoResourceUrl ? (
        <VideoCleanSelectionOverlay
          videoUrl={videoResourceUrl}
          title={`${nodeTitle} · 框选目标`}
          initialTime={
            videoCleanFrameTime ||
            videoRef.current?.currentTime ||
            videoCurrentTime ||
            0
          }
          initialSelection={videoCleanSelection}
          onClose={() => {
            setIsVideoCleanSelecting(false);
            setIsVideoCleanSelectorOpen(false);
          }}
          onSubmit={(selection, frameTime) => {
            void handleVideoCleanSelectionConfirmed(selection, frameTime);
          }}
        />
      ) : null}

      {imageResourceUrl &&
      (activeImageOverlay === "redraw" ||
        activeImageOverlay === "erase" ||
        activeImageOverlay === "annotate") ? (
        <ImageMaskOverlay
          imageUrl={imageResourceUrl}
          mode={activeImageOverlay}
          pending={isImageToolPending}
          onClose={() => setActiveImageOverlay(null)}
          onSubmit={({ prompt, maskDataUrl }) =>
            runImageToolAction({
              tool:
                activeImageOverlay === "annotate"
                  ? "annotate"
                  : activeImageOverlay === "erase"
                    ? "erase"
                    : "redraw",
              prompt,
              maskDataUrl,
              outputFormat: "png",
            })
          }
        />
      ) : null}

      {imageResourceUrl && activeImageOverlay === "expand" ? (
        <ImageExpandOverlay
          pending={isImageToolPending}
          onClose={() => setActiveImageOverlay(null)}
          onSubmit={({ prompt, aspectRatio }) =>
            runImageToolAction({
              tool: "expand",
              prompt,
              aspectRatio,
            })
          }
        />
      ) : null}

      {imageResourceUrl && activeImageOverlay === "upscale" ? (
        <ImageUpscaleOverlay
          pending={isImageToolPending}
          onClose={() => setActiveImageOverlay(null)}
          onSubmit={({ targetResolution, outputFormat }) =>
            runImageToolAction({
              tool: "upscale",
              targetResolution,
              outputFormat,
            })
          }
        />
      ) : null}

      {imageResourceUrl && activeImageOverlay === "relight" ? (
        <ImageRelightOverlay
          imageUrl={imageResourceUrl}
          pending={isImageToolPending}
          onClose={() => setActiveImageOverlay(null)}
          onSubmit={(lighting) =>
            runImageToolAction({
              tool: "relight",
              lighting,
            })
          }
        />
      ) : null}

      {imageResourceUrl && activeImageOverlay === "multiple-angles" ? (
        <ImageMultipleAnglesOverlay
          pending={isImageToolPending}
          onClose={() => setActiveImageOverlay(null)}
          onSubmit={(multiAngle) =>
            runImageToolAction({
              tool: "multiple-angles",
              multiAngle,
              outputFormat: "png",
            })
          }
        />
      ) : null}

      <TapnowHandle
        side="left"
        node={node}
        forceVisible={
          (!data.isReferenceSelectionActive &&
            !data.isConnectionModeActive &&
            selected) ||
          (Boolean(data.isConnectionTargetActive) &&
            data.connectionTargetSide === "left")
        }
        forceHidden={isReferenceMuted || isConnectionMuted}
        onHandlePointerDown={data.onHandlePointerDown}
        onNodeCommand={data.onNodeCommand}
      />
      <TapnowHandle
        side="right"
        node={node}
        forceVisible={
          (!data.isReferenceSelectionActive &&
            !data.isConnectionModeActive &&
            selected) ||
          (Boolean(data.isConnectionTargetActive) &&
            data.connectionTargetSide === "right")
        }
        forceHidden={isReferenceMuted || isConnectionMuted}
        onHandlePointerDown={data.onHandlePointerDown}
        onNodeCommand={data.onNodeCommand}
      />
    </div>
  );
}
