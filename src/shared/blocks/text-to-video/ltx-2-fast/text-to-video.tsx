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
  RefreshCw,
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
import { PromptEnhanceButton } from "@/shared/components/prompt-enhance-button";
import {
  isTaskCompleted,
  isTaskFailed,
  isTaskProcessing,
} from "@/shared/lib/task-status";

// Constants
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 300; // 10 minutes max

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

export function TextToVideoLtx2Fast({ className }: { className?: string }) {
  const { user } = useAppContext();

  const t = useTranslations("landing.ltx-2-fast.ltx2Fast");
  const t2 = useTranslations("landing.wavespeed");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(8);
  const [generateAudio, setGenerateAudio] = useState(true);
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
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  // 使用 Hook 获取所需积分（动态：基于 duration 和 generateAudio）
  const {
    credits: requiredCredits,
    isLoading: isEstimating,
    error: estimateError,
  } = useEstimateCredits(
    "text-to-video-ltx-2-fast",
    {
      duration,
      generate_audio: generateAudio,
    },
    { debounceMs: 300 },
  );

  const resetForm = () => {
    setPrompt("");
    setDuration(8);
    setGenerateAudio(true);
    setGeneratedVideoUrl(null);
    setError(null);
    setStatus("idle");
  };

  const callTextToVideoAPI = async (promptText: string) => {
    const response = await fetch("/api/ai/text-to-video-ltx-2-fast/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mediaType: "video",
        prompt: promptText.trim(),
        duration: duration,
        generate_audio: generateAudio,
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
          `/api/ai/status?taskId=${requestId}&scenario=text-to-video-ltx-2-fast`,
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

    // Reset state
    setIsGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setStatus("processing");

    try {
      // Step 1: Call text-to-video API
      const result = await callTextToVideoAPI(trimmedPrompt);
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
      link.download = `ltx-2-fast-video-${Date.now()}.mp4`;
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

  // Valid durations for LTX-2: 6, 8, 10, 12, 14, 16, 18, 20
  const validDurations = [6, 8, 10, 12, 14, 16, 18, 20];

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-6 lg:grid-cols-[0.75fr_1.25fr] items-stretch",
        className,
      )}
    >
      {/* 左侧输入 */}
      <div className="relative flex flex-col min-h-0">
        <div className="space-y-4 flex-1 min-h-0 lg:overflow-y-auto">
          {/* 表单卡片 - 合并所有输入字段 */}
          <div className="bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg space-y-4">
            {/* Prompt */}
            <div>
              <Label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                {t("form.prompt.label", { defaultValue: "Prompt" })}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="prompt"
                placeholder={t("form.prompt.placeholder", {
                  defaultValue:
                    "Describe the video you want to create...\n\nExample: A cinematic aerial shot of a mountain range at golden hour. Snow-capped peaks catch warm orange light as clouds drift through valleys below. Camera slowly pans across the majestic landscape.",
                })}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] resize-none border border-border"
                disabled={isGenerating}
              />
              <div className="flex justify-end mt-1.5">
                <PromptEnhanceButton
                  prompt={prompt}
                  onEnhanced={setPrompt}
                  mode="video"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Duration, Generate Audio */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
              <div className="flex-1">
                <Label htmlFor="duration" className="mb-2 block text-sm font-medium text-foreground">
                  {t("form.duration.label", { defaultValue: "Duration" })}
                </Label>
                <Select
                  value={duration.toString()}
                  onValueChange={(value) => setDuration(parseInt(value))}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {validDurations.map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        {d} seconds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <Label htmlFor="generate-audio" className="mb-2 block text-sm font-medium text-foreground">
                  {t("form.generateAudio.label", {
                    defaultValue: "Audio Sync",
                  })}
                </Label>
                <div className="flex items-start gap-3 rounded-md border border-border bg-muted/50 px-3 py-3">
                  <Checkbox
                    id="generate-audio"
                    checked={generateAudio}
                    onCheckedChange={(checked) =>
                      setGenerateAudio(checked === true)
                    }
                    className="mt-1"
                  />
                  <label
                    htmlFor="generate-audio"
                    className="text-sm cursor-pointer"
                  >
                    {t("form.generateAudio.description", {
                      defaultValue: "Generate synchronized audio with video",
                    })}
                  </label>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <Button
                onClick={startGenerate}
                disabled={
                  isGenerating ||
                  !prompt.trim() ||
                  ((isEstimating || requiredCredits === null))
                }
                className="group relative w-full overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60"
                size="lg"
              >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen transition duration-700 group-hover:opacity-100"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.3), transparent 30%)',
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-[120%] bg-[conic-gradient(from_120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.4),rgba(255,255,255,0.05))] animate-[spin_6s_linear_infinite] opacity-70 blur-3xl"
              />
              <span className="relative flex items-center justify-center gap-2">
                {isEstimating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t2("status.estimating", {
                      defaultValue: "Estimating...",
                    })}
                  </>
                ) : isGenerating ? (
                  <>
                    <Wand2 className="h-4 w-4 animate-spin" />
                    {t("form.buttons.generating", {
                      defaultValue: "Generating...",
                    })}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>
                      {t("form.buttons.run", {
                        defaultValue: "Generate Video",
                      })}
                      {!isGenerating && !isEstimating && requiredCredits !== null && (
                        <span className="ml-1.5 opacity-90">
                          ({requiredCredits}{" "}
                          {t2("buttons.credits", { defaultValue: "credits" })})
                        </span>
                      )}
                    </span>
                  </>
                )}
              </span>
            </Button>
            {estimateError && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="break-words">
                  {t2("errors.estimate_failed", {
                    defaultValue: "Failed to estimate credits",
                  })}
                  : {estimateError}
                </span>
              </div>
            )}
            <PaymentButton
              minCredits={requiredCredits ?? 999}
              buttonText={t2("buttons.click_to_pay")}
            />
            </div>
          </div>
        </div>
      </div>

      {/* 右侧预览 */}
      <div className="bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg flex flex-col min-h-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3 flex-shrink-0">
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
            {t(`status.${status}`, {
              defaultValue:
                status === "completed"
                  ? "Completed"
                  : status === "processing"
                    ? "Processing..."
                    : "Idle",
            })}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-md bg-muted/30 flex-1 min-h-0 flex flex-col">
          {generatedVideoUrl ? (
            <div className="relative flex-1 overflow-hidden rounded-md flex-shrink-0 bg-black min-h-[240px] sm:min-h-[320px] lg:min-h-[400px]">
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
                  <span className="text-xs text-white">0:{duration}</span>
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
                className="absolute top-2 right-2 h-9 w-9 bg-background/80 hover:bg-background backdrop-blur-sm border border-border z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(generatedVideoUrl);
                }}
                title={t("actions.downloadVideo", {
                  defaultValue: "Download Video",
                })}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground min-h-0">
              <Video className="h-8 w-8" />
              <p className="text-sm font-medium">
                {t("preview.placeholder", {
                  defaultValue: "Your generated video will appear here",
                })}
              </p>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Video放大对话框 */}
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
