"use client";

import { useRef, useState } from "react";
import {
  Video,
  Wand2,
  AlertCircle,
  Download,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Trash2,
  Image as ImageIcon,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { PaymentButton } from "@/shared/components/payment-button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useAppContext } from "@/shared/contexts/app";
import { PromptEnhanceButton } from "@/shared/components/prompt-enhance-button";
import {
  isTaskCompleted,
  isTaskFailed,
  isTaskProcessing,
} from "@/shared/lib/task-status";

// Constants
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 300; // 10 minutes max

// Pricing constants
const MAX_VIDEO_DURATION_SECONDS = 30;

// Helper functions
const extractWavespeedData = (result: any) => {
  if (result.code === 0 && result.data) {
    if (result.data.code === 200 && result.data.data) {
      return result.data.data;
    }
    if (result.data.requestId || result.data.id) {
      return result.data;
    }
  }
  return null;
};

const extractVideoUrl = (data: any): string | null => {
  if (!data) return null;

  const url =
    data.outputs?.[0] ||
    data.video_url ||
    data.url ||
    data.output_url ||
    data.video;

  return typeof url === "string" ? url : null;
};

const extractRequestId = (data: any): string | null => {
  if (!data) return null;
  return data.requestId || data.id || data.request_id || null;
};

const MOTION_CONTROL_UPLOAD_METADATA = {
  sceneId: "motion-control",
  sceneLabel: "Motion Control",
  modelUrl: "/motion-control/kling-2-6-pro",
  modelLabel: "Kling 2.6 Pro",
} as const;

export function KlingV26ProMotionControl({
  className,
}: {
  className?: string;
}) {
  const { user } = useAppContext();

  const t = useTranslations("landing.wavespeed");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");
  const [keepOriginalSound, setKeepOriginalSound] = useState(true);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [billedDuration, setBilledDuration] = useState<number | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [enlargedVideo, setEnlargedVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [isImageDragging, setIsImageDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileRef = useRef<File | null>(null);
  const imageDropZoneRef = useRef<HTMLDivElement | null>(null);

  // Video upload states
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileRef = useRef<File | null>(null);
  const videoDropZoneRef = useRef<HTMLDivElement | null>(null);

  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  // 使用 Hook 获取所需积分（动态：基于 duration）
  const {
    credits: requiredCredits,
    isLoading: isEstimating,
    error: estimateError,
  } = useEstimateCredits(
    "motion-control-kling-2-6",
    billedDuration
      ? { duration: billedDuration }
      : videoDuration
        ? { duration: videoDuration }
        : undefined,
    { debounceMs: 300, requireAuth: !user, enabled: !!(billedDuration || videoDuration) },
  );

  const handleImageUploadClick = () => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }
    imageInputRef.current?.click();
  };

  const handleVideoUploadClick = () => {
    videoInputRef.current?.click();
  };

  // requiredCredits 已通过 Hook 获取

  const readVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.onloadedmetadata = () => {
        const duration = videoEl.duration;
        URL.revokeObjectURL(videoEl.src);
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error("Failed to read video duration"));
          return;
        }
        resolve(duration);
      };
      videoEl.onerror = () => {
        URL.revokeObjectURL(videoEl.src);
        reject(new Error("Failed to load video metadata"));
      };
      videoEl.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (
    file: File,
    type: "image" | "video",
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("files", file);
    Object.entries(MOTION_CONTROL_UPLOAD_METADATA).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const endpoint =
      type === "image"
        ? "/api/storage/upload-image"
        : "/api/storage/upload-video";
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const result = await response.json();
    if (result.code !== 0 || !result.data?.urls?.length) {
      throw new Error(result.message || "Upload failed");
    }

    return result.data.urls[0] as string;
  };

  const processImageFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setImageFileName(file.name);
    setImagePreview(url);
    imageFileRef.current = file;
    setError(null);

    try {
      const imageUrl = await uploadFile(file, "image");
      setImage(imageUrl);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setError(err.message || "Upload failed");
      setImageFileName("");
      setImagePreview(null);
      imageFileRef.current = null;
    }
  };

  const processVideoFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoFileName(file.name);
    setVideoPreview(url);
    videoFileRef.current = file;
    setError(null);

    try {
      const duration = await readVideoDuration(file);
      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        setError(
          `Video duration must be <= ${MAX_VIDEO_DURATION_SECONDS} seconds`,
        );
        setVideoFileName("");
        setVideoPreview(null);
        setVideo("");
        videoFileRef.current = null;
        setVideoDuration(null);
        URL.revokeObjectURL(url);
        return;
      }

      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        setError(
          `Video duration must be <= ${MAX_VIDEO_DURATION_SECONDS} seconds`,
        );
        setVideoFileName("");
        setVideoPreview(null);
        setVideo("");
        videoFileRef.current = null;
        setVideoDuration(null);
        setBilledDuration(null);
        URL.revokeObjectURL(url);
        return;
      }

      // 计算 billed duration（向上取整到最近的 tier）
      const BILLING_TIERS = [
        { seconds: 5, credits: 96 },
        { seconds: 10, credits: 191 },
        { seconds: 15, credits: 286 },
        { seconds: 30, credits: 572 },
      ];
      const tier =
        BILLING_TIERS.find((t) => duration <= t.seconds) ||
        BILLING_TIERS[BILLING_TIERS.length - 1];
      const billed = tier.seconds;

      const videoUrl = await uploadFile(file, "video");
      setVideo(videoUrl);
      setVideoDuration(duration);
      setBilledDuration(billed);
    } catch (err: any) {
      console.error("Video upload failed:", err);
      setError(err.message || "Upload failed");
      setVideoFileName("");
      setVideoPreview(null);
      videoFileRef.current = null;
      setVideoDuration(null);
      setBilledDuration(null);
    }
  };

  const handleImageFileChange = async (fileList: FileList | null) => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    if (!file.type.startsWith("image/")) {
      setError("Invalid file type. Please upload an image.");
      return;
    }

    await processImageFile(file);
  };

  const handleVideoFileChange = async (fileList: FileList | null) => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    if (!file.type.startsWith("video/")) {
      setError("Invalid file type. Please upload a video.");
      return;
    }

    await processVideoFile(file);
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isImageDragging) {
      setIsImageDragging(true);
    }
  };

  const handleImageDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageDragging(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imageDropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsImageDragging(false);
    }
  };

  const handleImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageDragging(false);

    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Invalid file type. Please upload an image.");
      return;
    }

    await processImageFile(file);
  };

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isVideoDragging) {
      setIsVideoDragging(true);
    }
  };

  const handleVideoDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragging(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoDropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsVideoDragging(false);
    }
  };

  const handleVideoDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragging(false);

    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("video/")) {
      setError("Invalid file type. Please upload a video.");
      return;
    }

    await processVideoFile(file);
  };

  const handleImageDelete = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFileName("");
    setImage("");
    imageFileRef.current = null;
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setError(null);
  };

  const handleVideoDelete = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    setVideoFileName("");
    setVideo("");
    videoFileRef.current = null;
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    setError(null);
    setVideoDuration(null);
    setBilledDuration(null);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const resetForm = () => {
    setPrompt("");
    setNegativePrompt("");
    setImage("");
    setVideo("");
    setKeepOriginalSound(true);
    setGeneratedVideoUrl(null);
    setError(null);
    setStatus("idle");
    handleImageDelete();
    handleVideoDelete();
  };

  const callMotionControlAPI = async (
    promptText: string,
    imageUrl: string,
    videoUrl: string,
    negativePromptText: string,
    durationSeconds: number,
  ) => {
    const response = await fetch("/api/ai/motion-control-kling-2-6/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mediaType: "video",
        prompt: promptText.trim(),
        image: imageUrl.trim(),
        video: videoUrl.trim(),
        negative_prompt: negativePromptText.trim(),
        character_orientation: "image",
        keep_original_sound: keepOriginalSound,
        duration: durationSeconds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Generation failed");
    }

    const result = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "Generation failed");
    }

    if (result.data?.success === false) {
      throw new Error(result.data.message || "Generation failed");
    }

    return result;
  };

  const pollTaskStatus = async (requestId: string): Promise<string> => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

      try {
        const statusResponse = await fetch(
          `/api/ai/status?taskId=${requestId}&scenario=motion-control-kling-2-6`,
        );

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => ({}));
          console.warn(
            `[Polling] Status query failed (attempt ${attempt + 1}):`,
            statusResponse.status,
            errorData,
          );
          continue;
        }

        const statusResult = await statusResponse.json();

        if (statusResult.code !== 0) {
          throw new Error(statusResult.message || "Status query failed");
        }

        const statusData = statusResult.data;
        if (!statusData) {
          console.error("[Polling] Failed to parse status data:", statusResult);
          throw new Error(statusResult.message || "Status query failed");
        }

        const taskStatus = statusData.status;
        const statusKey =
          taskStatus === "processing" || taskStatus === "pending"
            ? "processing"
            : taskStatus === "completed"
              ? "completed"
              : "idle";
        setStatus(statusKey);
        console.log(
          `[Polling] Task ${requestId} status: ${taskStatus} (attempt ${attempt + 1})`,
          statusData,
        );

        if (isTaskCompleted(taskStatus)) {
          const videoUrl = statusData.output;
          if (videoUrl) {
            console.log("[Polling] Got result URL:", videoUrl);
            return videoUrl;
          }
          console.warn(
            "[Polling] No valid video URL found in response:",
            statusData,
          );
        } else if (isTaskFailed(taskStatus)) {
          const errorMsg =
            statusData.error || statusData.message || "Task failed";
          console.error("[Polling] Task failed:", errorMsg);
          throw new Error(errorMsg);
        } else if (isTaskProcessing(taskStatus)) {
          continue;
        } else {
          console.warn(
            `[Polling] Unknown status: ${taskStatus}, continuing...`,
          );
        }
      } catch (err: any) {
        console.warn("[Polling] Error:", err);
        if (err.message && !err.message.includes("fetch")) {
          throw err;
        }
      }
    }

    throw new Error("Task timeout");
  };

  const startGenerate = async () => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }

    const trimmedImage = image.trim();
    if (!trimmedImage) {
      setError("Image is required");
      return;
    }

    const trimmedVideo = video.trim();
    if (!trimmedVideo) {
      setError("Video is required");
      return;
    }

    if (!videoDuration || videoDuration <= 0) {
      setError(
        `Video duration is required (max ${MAX_VIDEO_DURATION_SECONDS}s)`,
      );
      return;
    }

    if (videoDuration > MAX_VIDEO_DURATION_SECONDS) {
      setError(`Video duration must be <= ${MAX_VIDEO_DURATION_SECONDS}s`);
      return;
    }

    if (videoDuration > MAX_VIDEO_DURATION_SECONDS) {
      setError(`Video duration must be <= ${MAX_VIDEO_DURATION_SECONDS}s`);
      return;
    }
    // 计算 billed duration（向上取整到最近的 tier）
    const BILLING_TIERS = [
      { seconds: 5, credits: 96 },
      { seconds: 10, credits: 191 },
      { seconds: 15, credits: 286 },
      { seconds: 30, credits: 572 },
    ];
    const tier =
      BILLING_TIERS.find((t) => videoDuration <= t.seconds) ||
      BILLING_TIERS[BILLING_TIERS.length - 1];
    setBilledDuration(tier.seconds);

    setIsGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setStatus("processing");

    try {
      const result = await callMotionControlAPI(
        prompt.trim(),
        trimmedImage,
        trimmedVideo,
        negativePrompt.trim(),
        billedDuration || videoDuration,
      );
      console.log("Generation result:", result);

      const wavespeedData = extractWavespeedData(result);
      if (!wavespeedData) {
        throw new Error(result.message || "API response parse failed");
      }

      const directVideoUrl = extractVideoUrl(wavespeedData);
      if (directVideoUrl) {
        setGeneratedVideoUrl(directVideoUrl);
        setStatus("completed");
        return;
      }

      const requestId = extractRequestId(wavespeedData);
      if (!requestId) {
        throw new Error("Task ID not found");
      }

      const finalVideoUrl = await pollTaskStatus(requestId);
      setGeneratedVideoUrl(finalVideoUrl);
      setStatus("completed");
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || "Processing failed");
      setStatus("idle");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (videoUrl: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `motion-control-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Download failed");
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-6 lg:grid-cols-[0.75fr_1.25fr] items-stretch",
        className,
      )}
    >
      {/* 左侧输入 */}
      <div className="relative flex flex-col min-h-0">
        <div className="space-y-3 flex-1 min-h-0 lg:overflow-y-auto">
          {/* Prompt */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <Label
              htmlFor="prompt"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Your Prompt
            </Label>
            <Textarea
              id="prompt"
              placeholder="Describe the motion control effect you want to apply..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[200px] resize-none border border-border"
            />
            <div className="mt-2 flex justify-end">
              <PromptEnhanceButton
                prompt={prompt}
                onEnhanced={setPrompt}
                disabled={isGenerating}
                mode="video"
              />
            </div>
          </div>

          {/* Negative Prompt */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <Label
              htmlFor="negative-prompt"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Negative Prompt
            </Label>
            <Textarea
              id="negative-prompt"
              placeholder="Describe what you want to avoid..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="min-h-[200px] resize-none border border-border"
            />
          </div>

          {/* Image */}
          <div className="flex items-center gap-1.5 mb-2">
            <Label
              htmlFor="image"
              className="text-sm font-semibold text-primary"
            >
              Image*
            </Label>
          </div>
          <div className="md:rounded-2xl md:border md:border-white/10 md:dark:border-white/6 md:bg-card/60 md:p-3 md:sm:p-4 md:shadow-sm">
            {image ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={image} readOnly className="flex-1 text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyUrl(image)}
                    className="h-11 w-11 sm:h-8 sm:w-8"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {imagePreview && (
                  <div className="relative rounded-xl border border-white/10 bg-zinc-800/50 p-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleImageDelete}
                      className="absolute top-2 right-2 h-11 w-11 bg-black/60 hover:bg-red-500/20 sm:h-8 sm:w-8"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div
                ref={imageDropZoneRef}
                onDragOver={handleImageDragOver}
                onDragEnter={handleImageDragEnter}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                onClick={handleImageUploadClick}
                className={cn(
                  "relative rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[120px] transition-all cursor-pointer",
                  isImageDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50",
                )}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                  {isImageDragging ? (
                    <>
                      <ImageIcon className="h-12 w-12 text-primary animate-bounce" />
                      <p className="text-sm font-medium text-primary">
                        Drop image here
                      </p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          Drag and drop an image or click to upload
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageFileChange(e.target.files)}
            />
          </div>

          {/* Video */}
          <div className="flex items-center gap-1.5 mb-2">
            <Label
              htmlFor="video"
              className="text-sm font-semibold text-primary"
            >
              Video*
            </Label>
          </div>
          <div className="md:rounded-2xl md:border md:border-white/10 md:dark:border-white/6 md:bg-card/60 md:p-3 md:sm:p-4 md:shadow-sm">
            <div className="text-xs text-muted-foreground mb-2">
              Max {MAX_VIDEO_DURATION_SECONDS}s. Step billing: 5s/10s/15s/30s.
              Current{videoDuration ? `: ${videoDuration.toFixed(1)}s` : ""}
              {billedDuration ? ` (billed: ${billedDuration.toFixed(1)}s)` : ""}
              . Credits{requiredCredits ? `: ${requiredCredits}` : ""}.
            </div>
            {video ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={video} readOnly className="flex-1 text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyUrl(video)}
                    className="h-11 w-11 sm:h-8 sm:w-8"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {videoPreview && (
                  <div className="relative rounded-xl border border-white/10 bg-zinc-800/50 p-2">
                    <video
                      src={videoPreview}
                      className="w-full h-auto rounded-lg"
                      controls
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleVideoDelete}
                      className="absolute top-2 right-2 h-11 w-11 bg-black/60 hover:bg-red-500/20 sm:h-8 sm:w-8"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div
                ref={videoDropZoneRef}
                onDragOver={handleVideoDragOver}
                onDragEnter={handleVideoDragEnter}
                onDragLeave={handleVideoDragLeave}
                onDrop={handleVideoDrop}
                onClick={handleVideoUploadClick}
                className={cn(
                  "relative rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[120px] transition-all cursor-pointer",
                  isVideoDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50",
                )}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                  {isVideoDragging ? (
                    <>
                      <Video className="h-12 w-12 text-primary animate-bounce" />
                      <p className="text-sm font-medium text-primary">
                        Drop video here
                      </p>
                    </>
                  ) : (
                    <>
                      <Video className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          Drag and drop a video or click to upload
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleVideoFileChange(e.target.files)}
            />
          </div>

          {/* Keep Original Sound */}
          <div className="flex items-center gap-1.5 mb-2">
            <Label
              htmlFor="keep-sound"
              className="text-sm font-semibold text-primary"
            >
              Keep Original Sound
            </Label>
          </div>
          <div className="md:rounded-2xl md:border md:border-white/10 md:dark:border-white/6 md:bg-card/60 md:p-3 md:sm:p-4 md:shadow-sm">
            <div className="flex items-start gap-3">
              <Checkbox
                id="keep-sound"
                checked={keepOriginalSound}
                onCheckedChange={(checked) =>
                  setKeepOriginalSound(checked === true)
                }
                className="mt-1"
              />
              <Label htmlFor="keep-sound" className="text-sm cursor-pointer">
                Keep the original audio from the video
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:rounded-2xl md:border md:border-white/10 md:dark:border-white/6 md:bg-card/60 md:p-3 md:sm:p-4 md:shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={resetForm}
                className="flex-1 min-h-[48px] lg:min-h-[40px]"
              >
                Reset
              </Button>
              <Button
                size="lg"
                className="flex-1 min-h-[48px] lg:min-h-[40px] group relative overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60 disabled:opacity-70"
                onClick={startGenerate}
                disabled={
                  isGenerating ||
                  !image.trim() ||
                  !video.trim() ||
                  (isEstimating || requiredCredits === null)
                }
              >
                {isGenerating ? (
                  <>
                    <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("buttons.generating", { defaultValue: "Generating..." })}
                  </>
                ) : isEstimating ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    <span>{t("status.estimating", { defaultValue: "Estimating..." })}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    <span>
                      {t("buttons.generate", { defaultValue: "Generate" })}
                      <span className="ml-1.5 opacity-90">
                        ({requiredCredits ?? "—"}{" "}
                        {t("buttons.credits", { defaultValue: "credits" })})
                      </span>
                    </span>
                  </>
                )}
              </Button>
            </div>
            {estimateError && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="break-words">
                  Failed to estimate credits: {estimateError}
                </span>
              </div>
            )}
            {error && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="mt-2">
              <PaymentButton
                minCredits={requiredCredits ?? 999}
                buttonText={t("buttons.click_to_pay")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 右侧预览 */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/70 to-black p-3 shadow-xl sm:p-4 flex flex-col min-h-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 flex-shrink-0">
          <span className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                status === "completed"
                  ? "bg-green-500"
                  : status === "processing"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-gray-500",
              )}
            />
            {status === "completed"
              ? "Completed"
              : status === "processing"
                ? "Processing..."
                : "Idle"}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-transparent flex-1 min-h-0 flex flex-col">
          {generatedVideoUrl ? (
            <div className="relative flex-1 overflow-hidden rounded-xl flex-shrink-0 bg-black/20 min-h-[240px] sm:min-h-[320px] lg:min-h-[400px]">
              <video
                ref={videoRef}
                src={generatedVideoUrl}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-white sm:h-8 sm:w-8"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-xs text-white">0:00</span>
                  <div className="flex-1 h-1 bg-white/20 rounded-full mx-2" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-white sm:h-8 sm:w-8"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-white sm:h-8 sm:w-8"
                    onClick={() => setEnlargedVideo(generatedVideoUrl)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Download button */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-11 w-11 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 z-20 sm:h-8 sm:w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(generatedVideoUrl);
                }}
                title="Download Video"
              >
                <Download className="h-3 w-3 text-white/90" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 w-full flex-col items-center justify-center gap-2 text-center text-slate-200 min-h-0">
              <Video className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-300">
                Your generated video will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Video放大对话框 */}
      <Dialog
        open={Boolean(enlargedVideo)}
        onOpenChange={(open) => !open && setEnlargedVideo(null)}
      >
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto overflow-hidden border-white/20 bg-black/90 p-0">
          {enlargedVideo && (
            <div className="relative mx-auto flex max-h-[92vh] max-w-[96vw] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-2 sm:p-4">
              <video
                src={enlargedVideo}
                controls
                className="block h-auto w-auto max-w-full max-h-[88vh] object-contain"
                autoPlay
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
