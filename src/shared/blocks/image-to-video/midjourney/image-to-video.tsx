"use client";

import { useRef, useState, useEffect } from "react";
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
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Copy,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

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
import { Slider } from "@/shared/components/ui/slider";
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

export function ImageToVideoMidjourney({ className }: { className?: string }) {
  const { user } = useAppContext();

  const t = useTranslations("landing.midjourney-image-to-video.midjourney");
  const locale = useLocale();
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [lastImage, setLastImage] = useState("");
  const [resolution, setResolution] = useState("480p");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [motion, setMotion] = useState("low");
  const [quality, setQuality] = useState(1);
  const [stylize, setStylize] = useState(0);
  const [chaos, setChaos] = useState(0);
  const [weird, setWeird] = useState(0);
  const [seed, setSeed] = useState("-1");

  const [enableBase64Output, setEnableBase64Output] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
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

  // Last image upload states
  const [lastImagePreview, setLastImagePreview] = useState<string | null>(null);
  const [lastImageFileName, setLastImageFileName] = useState("");
  const [isLastImageDragging, setIsLastImageDragging] = useState(false);
  const lastImageInputRef = useRef<HTMLInputElement | null>(null);
  const lastImageFileRef = useRef<File | null>(null);
  const lastImageDropZoneRef = useRef<HTMLDivElement | null>(null);

  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.midjourney-image-to-video.midjourney.errors",
  });

  const {
    credits: requiredCredits,
    isLoading: isEstimating,
    error: estimateError,
  } = useEstimateCredits(
    "image-to-video-midjourney",
    {
      resolution: resolution,
    },
    { debounceMs: 300 },
  );

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleLastImageUploadClick = () => {
    lastImageInputRef.current?.click();
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

    try {
      const imageUrl = await uploadImageFile(file);
      setImage(imageUrl);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setError(err.message || t("errors.uploadFailed"));
      setImageFileName("");
      setImagePreview(null);
      imageFileRef.current = null;
    }
  };

  const processLastImageFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setLastImageFileName(file.name);
    setLastImagePreview(url);
    lastImageFileRef.current = file;
    setError(null);

    try {
      const imageUrl = await uploadImageFile(file);
      setLastImage(imageUrl);
    } catch (err: any) {
      console.error("Last image upload failed:", err);
      setError(err.message || t("errors.uploadFailed"));
      setLastImageFileName("");
      setLastImagePreview(null);
      lastImageFileRef.current = null;
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
      setError(t("errors.invalidFileType"));
      return;
    }

    await processImageFile(file);
  };

  const handleLastImageFileChange = async (fileList: FileList | null) => {
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
      setError(t("errors.invalidFileType"));
      return;
    }

    await processLastImageFile(file);
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

  const handleLastImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLastImageDragging) {
      setIsLastImageDragging(true);
    }
  };

  const handleLastImageDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLastImageDragging(true);
  };

  const handleLastImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!lastImageDropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsLastImageDragging(false);
    }
  };

  const handleLastImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLastImageDragging(false);

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

    await processLastImageFile(file);
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

  const handleLastImageDelete = () => {
    if (lastImagePreview) {
      URL.revokeObjectURL(lastImagePreview);
    }
    setLastImagePreview(null);
    setLastImageFileName("");
    setLastImage("");
    lastImageFileRef.current = null;
    if (lastImageInputRef.current) {
      lastImageInputRef.current.value = "";
    }
    setError(null);
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000).toString());
  };

  const resetForm = () => {
    setPrompt("");
    setImage("");
    setLastImage("");
    setResolution("480p");
    setAspectRatio("1:1");
    setMotion("low");
    setQuality(1);
    setStylize(0);
    setChaos(0);
    setWeird(0);
    setSeed("-1");
    setEnableBase64Output(false);
    setGeneratedVideoUrl(null);
    setError(null);
    setStatus("idle");
    handleImageDelete();
    handleLastImageDelete();
  };

  const callImageToVideoAPI = async (promptText: string, imageUrl: string) => {
    const response = await fetch("/api/ai/image-to-video-midjourney/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mediaType: "video",
        prompt: promptText.trim(),
        image: imageUrl.trim(),
        last_image: lastImage.trim() || undefined,
        resolution: resolution,
        aspect_ratio: aspectRatio,
        motion: motion,
        quality: quality,
        stylize: stylize,
        chaos: chaos,
        weird: weird,
        seed: seed === "-1" ? -1 : parseInt(seed, 10),
        enable_base64_output: enableBase64Output,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || t("errors.generationFailed"));
    }

    const result = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || t("errors.generationFailed"));
    }

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
          `/api/ai/status?taskId=${requestId}&scenario=image-to-video-midjourney`,
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

    throw new Error(t("errors.taskTimeout"));
  };

  const startGenerate = async () => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError(t("errors.promptRequired"));
      return;
    }

    const trimmedImage = image.trim();
    if (!trimmedImage) {
      setError(t("errors.imageRequired") || "Image is required");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setStatus("processing");

    try {
      const result = await callImageToVideoAPI(trimmedPrompt, trimmedImage);
      console.log("Generation result:", result);

      const wavespeedData = extractWavespeedData(result);
      if (!wavespeedData) {
        throw new Error(result.message || t("errors.apiResponseParseFailed"));
      }

      const directVideoUrl = extractVideoUrl(wavespeedData);
      if (directVideoUrl) {
        setGeneratedVideoUrl(directVideoUrl);
        setStatus("completed");
        return;
      }

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
      link.download = `generated-video-${Date.now()}.mp4`;
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
        "grid gap-4 sm:gap-6 lg:grid-cols-[0.75fr_1.25fr] items-stretch",
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
              className="min-h-[120px] resize-none border border-border"
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

          {/* Image */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Label
                htmlFor="image"
                className="text-sm font-medium text-foreground"
              >
                {t("form.image.label") || "Image"}*
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t("form.image.tooltip") ||
                      "Upload an image to convert to video"}
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
                        {t("form.image.dropHere") || "Drop image here"}
                      </p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {t("form.image.dragDrop") ||
                            "Drag and drop a file or click to upload"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("form.image.hint") ||
                            "Hint: You can drag and drop a file or click to upload"}
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

          {/* Last Image (Optional) */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Label
                htmlFor="last-image"
                className="text-sm font-medium text-foreground"
              >
                {t("form.lastImage.label") || "Last Image (Optional)"}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t("form.lastImage.tooltip") ||
                      "Upload a last frame image for the video"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            {lastImage ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={lastImage} readOnly className="flex-1 text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyImageUrl(lastImage)}
                    className="h-11 w-11 sm:h-8 sm:w-8"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {lastImagePreview && (
                  <div className="relative rounded-xl border border-white/10 bg-zinc-800/50 p-2">
                    <img
                      src={lastImagePreview}
                      alt="Last Image Preview"
                      className="w-full h-auto rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLastImageDelete}
                      className="absolute top-2 right-2 h-11 w-11 bg-black/60 hover:bg-red-500/20 sm:h-8 sm:w-8"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div
                ref={lastImageDropZoneRef}
                onDragOver={handleLastImageDragOver}
                onDragEnter={handleLastImageDragEnter}
                onDragLeave={handleLastImageDragLeave}
                onDrop={handleLastImageDrop}
                onClick={handleLastImageUploadClick}
                className={cn(
                  "relative rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[120px] transition-all cursor-pointer",
                  isLastImageDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50",
                )}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                  {isLastImageDragging ? (
                    <>
                      <ImageIcon className="h-12 w-12 text-primary animate-bounce" />
                      <p className="text-sm font-medium text-primary">
                        {t("form.lastImage.dropHere") || "Drop image here"}
                      </p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {t("form.lastImage.dragDrop") ||
                            "Drag and drop a file or click to upload"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <input
              ref={lastImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLastImageFileChange(e.target.files)}
            />
          </div>

          {/* Resolution, Aspect Ratio, Motion */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Resolution */}
              <div className="flex-1">
                <Label
                  htmlFor="resolution"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {t("form.resolution.label")}
                </Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger id="resolution">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aspect Ratio */}
              <div className="flex-1">
                <Label
                  htmlFor="aspect-ratio"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {t("form.aspectRatio.label")}
                </Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspect-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                    <SelectItem value="2:3">2:3</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="1:2">1:2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Motion */}
              <div className="flex-1">
                <Label
                  htmlFor="motion"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {t("form.motion.label")}
                </Label>
                <Select value={motion} onValueChange={setMotion}>
                  <SelectTrigger id="motion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quality */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="quality"
                  className="text-sm font-medium text-foreground"
                >
                  {t("form.quality.label")}
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("form.quality.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-sm font-medium text-foreground">{quality}</span>
            </div>
            <Slider
              id="quality"
              min={0.25}
              max={2}
              step={0.25}
              value={[quality]}
              onValueChange={(values) => setQuality(values[0])}
              className="w-full"
            />
          </div>

          {/* Stylize, Chaos, Weird */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="space-y-4">
              {/* Stylize */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor="stylize"
                      className="text-sm font-medium text-foreground"
                    >
                      {t("form.stylize.label")}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("form.stylize.tooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-sm font-medium text-foreground">{stylize}</span>
                </div>
                <Slider
                  id="stylize"
                  min={0}
                  max={1000}
                  step={10}
                  value={[stylize]}
                  onValueChange={(values) => setStylize(values[0])}
                  className="w-full"
                />
              </div>

              {/* Chaos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor="chaos"
                      className="text-sm font-medium text-foreground"
                    >
                      {t("form.chaos.label")}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("form.chaos.tooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-sm font-medium text-foreground">{chaos}</span>
                </div>
                <Slider
                  id="chaos"
                  min={0}
                  max={100}
                  step={1}
                  value={[chaos]}
                  onValueChange={(values) => setChaos(values[0])}
                  className="w-full"
                />
              </div>

              {/* Weird */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor="weird"
                      className="text-sm font-medium text-foreground"
                    >
                      {t("form.weird.label")}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("form.weird.tooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-sm font-medium text-foreground">{weird}</span>
                </div>
                <Slider
                  id="weird"
                  min={0}
                  max={3000}
                  step={10}
                  value={[weird]}
                  onValueChange={(values) => setWeird(values[0])}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Seed */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Label
                htmlFor="seed"
                className="text-sm font-medium text-foreground"
              >
                {t("form.seed.label")}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("form.seed.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <Input
                id="seed"
                type="text"
                placeholder={t("form.seed.placeholder")}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={generateRandomSeed}
                className="h-11 w-11 sm:h-10 sm:w-10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Enable Base64 Output */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/50 px-3 py-3">
              <Checkbox
                id="enable-base64"
                checked={enableBase64Output}
                onCheckedChange={(checked) =>
                  setEnableBase64Output(checked === true)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="enable-base64"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {t("form.enableBase64Output.label")}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("form.enableBase64Output.tooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("form.enableBase64Output.description")}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isGenerating}
                className="flex-1 min-h-[48px] lg:min-h-[40px]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
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
                    <span>Estimating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    <span>
                      {t("form.buttons.run")}
                      {requiredCredits !== null && (
                        <span className="ml-1.5 opacity-90">
                          ({requiredCredits} Credits)
                        </span>
                      )}
                    </span>
                  </>
                )}
              </Button>
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
                buttonText="Click to pay"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 右侧预览 */}
      <div className="relative flex flex-col min-h-0">
        <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              {t("preview.title") || "Preview"}
            </h3>
            {status && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t(`status.${status}`) || status}
                </span>
                {status === "processing" && (
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center">
            {!generatedVideoUrl && !isGenerating && (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <Video className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("preview.placeholder")}
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <Wand2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {t("form.buttons.generating")}
                </p>
              </div>
            )}

            {generatedVideoUrl && (
              <div className="w-full h-full flex flex-col gap-3">
                <div className="relative flex-1 min-h-0 rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    src={generatedVideoUrl}
                    className="w-full h-full object-contain"
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={togglePlayPause}
                        className="h-10 w-10 bg-black/60 hover:bg-black/80"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white" />
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={toggleMute}
                        className="h-10 w-10 bg-black/60 hover:bg-black/80"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4 text-white" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-white" />
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setEnlargedVideo(generatedVideoUrl)}
                        className="h-10 w-10 bg-black/60 hover:bg-black/80"
                      >
                        <Maximize2 className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleDownload(generatedVideoUrl)}
                        className="h-10 w-10 bg-black/60 hover:bg-black/80"
                      >
                        <Download className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged Video Dialog */}
      <Dialog open={!!enlargedVideo} onOpenChange={() => setEnlargedVideo(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
          {enlargedVideo && (
            <video
              src={enlargedVideo}
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

