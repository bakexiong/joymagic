"use client";

import { useRef, useState } from "react";
import {
  Video,
  Sparkles,
  Wand2,
  AlertCircle,
  Download,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Info,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  Copy,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { PaymentButton } from "@/shared/components/payment-button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useAppContext } from "@/shared/contexts/app";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/components/ui/tooltip";
import { PromptEnhanceButton } from "@/shared/components/prompt-enhance-button";
import {
  isTaskCompleted,
  isTaskFailed,
  isTaskProcessing,
} from "@/shared/lib/task-status";

// Constants
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 300; // 10 minutes max (videos take longer)

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

export function ImageToVideoPixverse56({ className }: { className?: string }) {
  const { user } = useAppContext();

  // 直接复用 text-to-video PixVerse v5.6 的文案命名空间
  const t = useTranslations("landing.pixverse-v5-6.pixverse56");

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [resolutionRatio, setResolutionRatio] = useState("1:1");
  const [resolution, setResolution] = useState<
    "360p" | "540p" | "720p" | "1080p"
  >("360p");
  const [duration, setDuration] = useState<"5" | "8" | "10">("10");
  const [generateAudioSwitch, setGenerateAudioSwitch] = useState(false);
  const [thinkingType, setThinkingType] = useState<
    "enabled" | "disabled" | "auto"
  >("auto");
  const [seed, setSeed] = useState("-1");

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

  // Image upload states (单张参考图)
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [isImageDragging, setIsImageDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileRef = useRef<File | null>(null);
  const imageDropZoneRef = useRef<HTMLDivElement | null>(null);

  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.pixverse-v5-6.pixverse56.errors",
  });

  // 清理 label：去掉末尾括号里的技术字段名，例如 "(resolution_ratio)"
  const cleanLabel = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "");

  // 使用 Hook 获取所需积分（动态：基于 resolution、duration 和 generate_audio_switch）
  // 场景 key: image-to-video-pixverse-5-6
  // 参数名: resolution (string), duration (number), generate_audio_switch (boolean)
  const {
    credits: requiredCredits,
    isLoading: isEstimating,
    error: estimateError,
  } = useEstimateCredits(
    "image-to-video-pixverse-5-6",
    {
      resolution,
      duration: parseInt(duration, 10),
      generate_audio_switch: generateAudioSwitch,
    },
    { debounceMs: 300 },
  );

  const validDurationOptions: Array<"5" | "8" | "10"> =
    resolution === "1080p" ? ["5", "8"] : ["5", "8", "10"];

  const ensureValidDuration = (nextResolution: typeof resolution) => {
    if (nextResolution === "1080p" && duration === "10") {
      setDuration("8");
    }
  };

  const resetForm = () => {
    setPrompt("");
    setNegativePrompt("");
    setResolutionRatio("1:1");
    setResolution("360p");
    setDuration("10");
    setGenerateAudioSwitch(false);
    setThinkingType("auto");
    setSeed("-1");
    setGeneratedVideoUrl(null);
    setError(null);
    setStatus("idle");
    handleImageDelete();
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1_000_000);
    setSeed(String(randomSeed));
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("files", file);

    const response = await fetch("/api/storage/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(t("errors.uploadFailed", { error: response.statusText }));
    }

    const result = await response.json();
    if (result.code !== 0 || !result.data?.urls?.length) {
      throw new Error(result.message || t("errors.uploadFailedGeneric"));
    }

    return result.data.urls[0] as string;
  };

  const processImageFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setImageFileName(file.name);
    setImagePreview(url);
    imageFileRef.current = file;
    setError(null);

    // Upload file and get URL
    try {
      const imageUrl = await uploadImageFile(file);
      setImage(imageUrl);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setError(err.message || t("errors.uploadFailedGeneric"));
      setImageFileName("");
      setImagePreview(null);
      imageFileRef.current = null;
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

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      setError(t("errors.invalidFileType"));
      return;
    }

    await processImageFile(file);
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
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
      setError(t("errors.invalidFileType"));
      return;
    }

    await processImageFile(file);
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

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const callImageToVideoAPI = async (promptText: string, imageUrl: string) => {
    // Seed 归一化逻辑与 text-to-video PixVerse 一致：
    // - 空字串或 -1 视为「随机」，不传 seed
    // - 其他情况转成非负整数
    const trimmedSeed = (seed || "").trim();
    const parsedSeed = Number.parseInt(trimmedSeed, 10);
    const normalizedSeed =
      !trimmedSeed || trimmedSeed === "-1" || Number.isNaN(parsedSeed)
        ? undefined
        : Math.max(0, parsedSeed);

    const response = await fetch(
      "/api/ai/image-to-video-pixverse-5-6/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaType: "video",
          prompt: promptText.trim(),
          image: imageUrl.trim(),
          negative_prompt: negativePrompt.trim() || undefined,
          duration: parseInt(duration, 10) || 10,
          generate_audio_switch: generateAudioSwitch,
          resolution,
          resolution_ratio: resolutionRatio,
          thinking_type: thinkingType,
          seed: normalizedSeed,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || t("errors.generationFailed"));
    }

    const result = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || t("errors.generationFailed"));
    }

    // Check for insufficient credits
    if (result.data?.success === false) {
      throw new Error(result.data.message || t("errors.generationFailed"));
    }

    return result;
  };

  const pollTaskStatus = async (requestId: string): Promise<string> => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

      try {
        const statusResponse = await fetch(
          `/api/ai/status?taskId=${requestId}&scenario=image-to-video-pixverse-5-6`,
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
          throw new Error(
            statusResult.message || t("errors.statusQueryFailed"),
          );
        }

        const statusData = statusResult.data;
        if (!statusData) {
          console.error("[Polling] Failed to parse status data:", statusResult);
          throw new Error(
            statusResult.message || t("errors.statusQueryFailed"),
          );
        }

        const taskStatus = statusData.status;
        const statusLower = (taskStatus || "").toLowerCase();
        const statusKey =
          statusLower === "processing" || statusLower === "pending"
            ? "processing"
            : statusLower === "completed" || statusLower === "success"
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
            statusData.error || statusData.message || t("errors.taskFailed");
          console.error("[Polling] Task failed:", errorMsg);
          throw new Error(errorMsg);
        } else if (isTaskProcessing(taskStatus)) {
          // Continue polling
          continue;
        } else {
          console.warn(
            `[Polling] Unknown status: ${taskStatus}, continuing...`,
          );
        }
      } catch (err: any) {
        console.warn("[Polling] Error:", err);
        // Only throw if it's not a network error
        if (err.message && !err.message.includes("fetch")) {
          throw err;
        }
      }
    }

    throw new Error(t("errors.taskTimeout"));
  };

  const startGenerate = async () => {
    // Validate access
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }

    // Validate inputs
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError(t("errors.promptRequired"));
      return;
    }

    // 1080p 不支持 10 秒，前端再兜底一次
    if (resolution === "1080p" && duration === "10") {
      setError(t("errors.unsupportedCombination1080p10s"));
      return;
    }

    const trimmedImage = image.trim();
    if (!trimmedImage) {
      setError(
        t("form.imageRequired", {
          defaultValue: "Please upload an image for PixVerse image-to-video.",
        }),
      );
      return;
    }

    // Reset state
    setIsGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setStatus("processing");

    try {
      // Step 1: Call image-to-video API
      const result = await callImageToVideoAPI(trimmedPrompt, trimmedImage);
      console.log("Generation result:", result);

      // Step 2: Extract wavespeed data
      const wavespeedData = extractWavespeedData(result);
      if (!wavespeedData) {
        throw new Error(result.message || t("errors.apiResponseParseFailed"));
      }

      // Step 3: Check for direct video URL (synchronous result)
      const directVideoUrl = extractVideoUrl(wavespeedData);
      if (directVideoUrl) {
        setGeneratedVideoUrl(directVideoUrl);
        setStatus("completed");
        return;
      }

      // Step 4: Poll for async result
      const requestId = extractRequestId(wavespeedData);
      if (!requestId) {
        throw new Error(t("errors.taskIdNotFound"));
      }

      const finalVideoUrl = await pollTaskStatus(requestId);
      setGeneratedVideoUrl(finalVideoUrl);
      setStatus("completed");
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.message || t("errors.processingFailed"));
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
      link.download = `pixverse-5-6-image-to-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError(t("actions.downloadFailed"));
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
        "grid gap-4 sm:gap-6 md:grid-cols-[0.75fr_1.25fr] items-stretch",
        className,
      )}
    >
      {/* 左侧输入 */}
      <div className="relative flex flex-col min-h-0">
        <div className="space-y-3 flex-1 min-h-0 lg:overflow-y-auto">
          {/* Prompt */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Label
                htmlFor="prompt"
                className="text-sm font-medium text-foreground"
              >
                {t("form.prompt.label")}*
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("form.prompt.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="prompt"
              placeholder={t("form.prompt.placeholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[200px] resize-none border border-border"
            />
            <div className="flex justify-end mt-2">
              <PromptEnhanceButton
                prompt={prompt}
                onEnhanced={setPrompt}
                mode="video"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Negative Prompt */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Label
                htmlFor="negative-prompt"
                className="text-sm font-medium text-foreground"
              >
                {t("form.negativePrompt.label")}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("form.negativePrompt.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="negative-prompt"
              placeholder={t("form.negativePrompt.placeholder")}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="min-h-[200px] resize-none border border-border"
            />
          </div>

          {/* Image */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Label
                htmlFor="image"
                className="text-sm font-medium text-foreground"
              >
                {t("form.image.label", { defaultValue: "Image (reference)" })}*
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t("form.image.tooltip", {
                      defaultValue:
                        "Upload a reference image. PixVerse will animate this image according to your prompt.",
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            {image ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={image} readOnly className="flex-1 text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyImageUrl(image)}
                    className="h-8 w-8"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("form.image.hint", {
                    defaultValue:
                      "Hint: You can drag and drop a file or click the area below to upload.",
                  })}
                </p>
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
                      className="absolute top-2 right-2 h-8 w-8 bg-black/60 hover:bg-red-500/20"
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
                        {t("form.image.dropHere", {
                          defaultValue: "Drop image here",
                        })}
                      </p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {t("form.image.dragDrop", {
                            defaultValue:
                              "Drag and drop a file or click to upload",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("form.image.hint", {
                            defaultValue:
                              "Hint: You can drag and drop a file or click to upload",
                          })}
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

          {/* Resolution Ratio, Resolution, Duration */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Resolution Ratio */}
              <div className="flex-1">
                <Label
                  htmlFor="resolution-ratio"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {cleanLabel(t("form.resolutionRatio.label"))}
                </Label>
                <Select
                  value={resolutionRatio}
                  onValueChange={(value) => setResolutionRatio(value)}
                >
                  <SelectTrigger id="resolution-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution */}
              <div className="flex-1">
                <Label
                  htmlFor="resolution"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {cleanLabel(t("form.resolution.label"))}
                </Label>
                <Select
                  value={resolution}
                  onValueChange={(
                    value: "360p" | "540p" | "720p" | "1080p",
                  ) => {
                    setResolution(value);
                    ensureValidDuration(value);
                  }}
                >
                  <SelectTrigger id="resolution">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="360p">360p</SelectItem>
                    <SelectItem value="540p">540p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="flex-1">
                <Label
                  htmlFor="duration"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {cleanLabel(t("form.duration.label"))}
                </Label>
                <Select
                  value={duration}
                  onValueChange={(value: "5" | "8" | "10") =>
                    setDuration(value)
                  }
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {validDurationOptions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Generate Audio */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="mb-2 flex items-center gap-1.5">
              <Label
                htmlFor="generate-audio"
                className="text-sm font-medium text-foreground"
              >
                {cleanLabel(t("form.generateAudio.label"))}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("form.generateAudio.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/50 px-3 py-3">
              <Checkbox
                id="generate-audio"
                checked={generateAudioSwitch}
                onCheckedChange={(checked) =>
                  setGenerateAudioSwitch(checked === true)
                }
                className="mt-1"
              />
              <Label
                htmlFor="generate-audio"
                className="text-sm cursor-pointer"
              >
                {t("form.generateAudio.description")}
              </Label>
            </div>
          </div>

          {/* Thinking Type */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="mb-2 flex items-center gap-1.5">
              <Label
                htmlFor="thinking-type"
                className="text-sm font-medium text-foreground"
              >
                {cleanLabel(t("form.thinkingType.label"))}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("form.thinkingType.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={thinkingType}
              onValueChange={(value: "enabled" | "disabled" | "auto") =>
                setThinkingType(value)
              }
            >
              <SelectTrigger id="thinking-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">enabled</SelectItem>
                <SelectItem value="disabled">disabled</SelectItem>
                <SelectItem value="auto">auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seed */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <Label
              htmlFor="seed"
              className="text-sm font-semibold text-primary mb-2 block"
            >
              {t("form.seed.label")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="seed"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={generateRandomSeed}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={resetForm} className="flex-1 min-h-[48px] lg:min-h-[40px]">
                {t("form.buttons.reset")}
              </Button>
              <Button
                size="lg"
                className="flex-1 min-h-[48px] group relative overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60 disabled:opacity-70 lg:min-h-[40px]"
                onClick={startGenerate}
                disabled={
                  isGenerating ||
                  !prompt.trim() ||
                  !image.trim() ||
                  ((isEstimating || requiredCredits === null))
                }
              >
                {isGenerating ? (
                  <>
                    <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("form.buttons.generating")}
                  </>
                ) : isEstimating ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    <span>{t("status.estimating")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    <span>
                      {t("form.buttons.run")}
                      <span className="ml-1.5 opacity-90">
                        ({requiredCredits} {t("buttons.credits")})
                      </span>
                    </span>
                  </>
                )}
              </Button>
              {estimateError && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="break-words">
                    {t("errors.estimate_failed")}: {estimateError}
                  </span>
                </div>
              )}
            </div>
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
      <div className="bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg flex flex-col min-h-0 mt-4 md:mt-0">
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
            {t(`status.${status.toLowerCase()}`)}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-md bg-muted/30 flex-1 min-h-0 flex flex-col">
          {generatedVideoUrl ? (
            <div className="relative flex-1 overflow-hidden rounded-md flex-shrink-0 bg-black min-h-[240px] sm:min_h-[320px] lg:min-h-[400px]">
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
                    className="h-8 w-8 text-white"
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
                  <span className="text-xs text-white">0:{duration}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white"
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
                    className="h-8 w-8 text-white"
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
                className="absolute top-2 right-2 h-8 w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(generatedVideoUrl);
                }}
                title={t("actions.downloadVideo")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground min-h-0">
              <Video className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {t("preview.placeholder")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Video 放大对话框 */}
      <Dialog
        open={Boolean(enlargedVideo)}
        onOpenChange={(open) => !open && setEnlargedVideo(null)}
      >
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto overflow-hidden border-border bg-background p-0">
          {enlargedVideo && (
            <div className="relative mx-auto flex max-h-[92vh] max-w-[96vw] items-center justify-center overflow-auto rounded-md border border-border bg-card p-2 sm:p-4">
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
