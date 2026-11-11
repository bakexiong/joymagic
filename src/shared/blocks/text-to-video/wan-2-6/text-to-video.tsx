"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Video,
  Sparkles,
  Wand2,
  AlertCircle,
  RefreshCw,
  Download,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Info,
  Trash2,
  Music,
  Mic,
  X,
  Square,
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
import { resolveApiErrorMessage } from "@/shared/lib/api-error";

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

const parseStatusData = (statusResult: any) => {
  if (statusResult.code === 0 && statusResult.data) {
    if (statusResult.data.code === 200 && statusResult.data.data) {
      return statusResult.data.data;
    }
    return statusResult.data;
  }
  return null;
};

const WAN26_AUDIO_UPLOAD_METADATA = {
  sceneId: "text-to-video",
  sceneLabel: "Text to Video",
  modelUrl: "/text-to-video/wan-2-6",
  modelLabel: "Wan 2.6",
} as const;

export function TextToVideoWan26({ className }: { className?: string }) {
  const { user } = useAppContext();

  const t = useTranslations("landing.wan-2-6.wan26");
  const tCommonApi = useTranslations("common.api");
  const t2 = useTranslations("landing.wavespeed");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [audio, setAudio] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [isAudioDragging, setIsAudioDragging] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackTime, setAudioPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [size, setSize] = useState("1280*720");
  const [duration, setDuration] = useState("10");
  const [shotType, setShotType] = useState("single");
  const [enablePromptExpansion, setEnablePromptExpansion] = useState(true);
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
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileRef = useRef<File | null>(null);
  const audioDropZoneRef = useRef<HTMLDivElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  // 使用 Hook 获取所需积分（动态：基于 size 和 duration）
  const {
    credits: requiredCredits,
    isLoading: isEstimating,
    error: estimateError,
  } = useEstimateCredits(
    "text-to-video-wan-2-6",
    {
      size,
      duration:
        typeof duration === "string" ? parseInt(duration, 10) : duration,
    },
    { debounceMs: 300 },
  );

  const handleAudioUploadClick = () => {
    audioInputRef.current?.click();
  };

  const processAudioFile = async (file: File) => {
    setAudioFileName(file.name);
    audioFileRef.current = file;
    setError(null);

    // Upload file and get URL
    try {
      const audioUrl = await uploadAudioFile(file);
      setAudio(audioUrl);
    } catch (err: any) {
      console.error("Audio upload failed:", err);
      setError(err.message || t("errors.uploadFailed"));
      setAudioFileName("");
      audioFileRef.current = null;
    }
  };

  // Initialize audio player when audio URL changes
  useEffect(() => {
    if (audio && audioPlayerRef.current) {
      audioPlayerRef.current.src = audio;
      audioPlayerRef.current.muted = false;
      audioPlayerRef.current.volume = 1;
      audioPlayerRef.current.load();
    }
  }, [audio]);

  const uploadAudioFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("files", file);
    Object.entries(WAN26_AUDIO_UPLOAD_METADATA).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch("/api/storage/upload-audio", {
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

  const handleAudioFileChange = async (fileList: FileList | null) => {
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
    if (!file.type.startsWith("audio/")) {
      setError(t("errors.invalidFileType"));
      return;
    }

    await processAudioFile(file);
  };

  const handleAudioDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAudioDragging) {
      setIsAudioDragging(true);
    }
  };

  const handleAudioDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAudioDragging(true);
  };

  const handleAudioDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioDropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsAudioDragging(false);
    }
  };

  const handleAudioDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAudioDragging(false);

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

    // 验证文件类型
    if (!file.type.startsWith("audio/")) {
      setError(t("errors.invalidFileType"));
      return;
    }

    await processAudioFile(file);
  };

  const handleAudioDelete = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }
    setAudio("");
    setAudioFileName("");
    audioFileRef.current = null;
    setIsPlayingAudio(false);
    setAudioPlaybackTime(0);
    setAudioDuration(0);
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
    setError(null);
  };

  const toggleAudioPlayback = async () => {
    if (!audioPlayerRef.current || !audio) return;

    try {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
      } else {
        // Ensure audio is not muted before playing
        audioPlayerRef.current.muted = false;
        audioPlayerRef.current.volume = 1;
        await audioPlayerRef.current.play();
      }
    } catch (err) {
      console.error("Failed to play audio:", err);
      setError(t("actions.playAudioFailed"));
    }
  };

  const toggleAudioMute = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.muted = !isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setAudioPlaybackTime(Math.floor(audioPlayerRef.current.currentTime));
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioPlayerRef.current) {
      setAudioDuration(Math.floor(audioPlayerRef.current.duration));
    }
  };

  const handleAudioProgressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (audioPlayerRef.current) {
      const newTime = parseFloat(e.target.value);
      audioPlayerRef.current.currentTime = newTime;
      setAudioPlaybackTime(Math.floor(newTime));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      setAudioChunks(chunks);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Create audio URL for playback
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setRecordedAudioBlob(audioBlob);

        // Create audio element to get duration
        const audio = new Audio(audioUrl);
        audio.addEventListener("loadedmetadata", () => {
          setTotalDuration(Math.floor(audio.duration));
        });

        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError(
        t("errors.recordingFailed") ||
          "Failed to start recording. Please check microphone permissions.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
      recordedAudioRef.current = null;
    }

    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }

    setIsRecording(false);
    setRecordingTime(0);
    setAudioChunks([]);
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);
    setPlaybackTime(0);
    setTotalDuration(0);
    setIsPlayingRecorded(false);
    setShowRecordDialog(false);
  };

  const handleRetake = () => {
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
      recordedAudioRef.current = null;
    }

    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }

    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);
    setPlaybackTime(0);
    setTotalDuration(0);
    setIsPlayingRecorded(false);
    setRecordingTime(0);
    setAudioChunks([]);
  };

  const handleCloseDialog = () => {
    if (isRecording) {
      cancelRecording();
    } else {
      handleRetake();
      setShowRecordDialog(false);
    }
  };

  const handleUseAudio = async () => {
    if (!recordedAudioBlob) return;

    setIsUploadingAudio(true);
    setError(null);

    try {
      const audioFile = new File(
        [recordedAudioBlob],
        `recording-${Date.now()}.webm`,
        { type: "audio/webm" },
      );
      await processAudioFile(audioFile);

      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }

      setShowRecordDialog(false);
      setRecordedAudioUrl(null);
      setRecordedAudioBlob(null);
      setPlaybackTime(0);
      setTotalDuration(0);
      setIsPlayingRecorded(false);
    } catch (err: any) {
      console.error("Failed to process recorded audio:", err);
      setError(err.message || t("errors.uploadFailed"));
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const togglePlayback = () => {
    if (!recordedAudioRef.current && recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl);
      recordedAudioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        setPlaybackTime(Math.floor(audio.currentTime));
      });

      audio.addEventListener("ended", () => {
        setIsPlayingRecorded(false);
        setPlaybackTime(0);
      });
    }

    if (recordedAudioRef.current) {
      if (isPlayingRecorded) {
        recordedAudioRef.current.pause();
      } else {
        recordedAudioRef.current.play();
      }
      setIsPlayingRecorded(!isPlayingRecorded);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000).toString());
  };

  const resetForm = () => {
    setPrompt("");
    setNegativePrompt("");
    setAudio("");
    setSize("1280*720");
    setDuration("10");
    setShotType("single");
    setEnablePromptExpansion(true);
    setSeed("-1");
    setGeneratedVideoUrl(null);
    setError(null);
    setStatus("idle");
  };

  const callTextToVideoAPI = async (promptText: string) => {
    const response = await fetch("/api/ai/text-to-video-wan-2-6/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mediaType: "video",
        prompt: promptText.trim(),
        negative_prompt: negativePrompt.trim() || undefined,
        audio: audio.trim() || undefined,
        size: size,
        duration: parseInt(duration) || 10,
        shot_type: shotType,
        enable_prompt_expansion: enablePromptExpansion,
        seed: seed === "-1" ? -1 : parseInt(seed) || -1,
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
          `/api/ai/status?taskId=${requestId}&scenario=text-to-video-wan-2-6`,
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
            resolveApiErrorMessage({
              payload: statusResult,
              fallback: statusResult.message || t("errors.statusQueryFailed"),
              translate: (translationKey) => tCommonApi(translationKey as any),
            }),
          );
        }

        const statusData = statusResult.data;
        if (!statusData) {
          console.error("[Polling] Failed to parse status data:", statusResult);
          throw new Error(
            resolveApiErrorMessage({
              payload: statusResult,
              fallback: statusResult.message || t("errors.statusQueryFailed"),
              translate: (translationKey) => tCommonApi(translationKey as any),
            }),
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

          {/* Audio */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Label
                htmlFor="audio"
                className="text-sm font-medium text-foreground"
              >
                {t("form.audio.label")}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("form.audio.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2">
              <p className="text-xs text-foreground/80 mb-3">
                {audioFileName
                  ? t("common.selected", { name: audioFileName })
                  : t("common.notSelected")}
              </p>
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRecordDialog(true);
                  }}
                  className="flex-1"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {t("form.audio.record")}
                </Button>
              </div>
              {audio ? (
                // Audio Player
                <div className="relative rounded-xl border border-white/10 bg-zinc-800/50 p-3">
                  <audio
                    ref={audioPlayerRef}
                    src={audio}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onLoadedMetadata={handleAudioLoadedMetadata}
                    onPlay={() => setIsPlayingAudio(true)}
                    onPause={() => setIsPlayingAudio(false)}
                    onEnded={() => {
                      setIsPlayingAudio(false);
                      setAudioPlaybackTime(0);
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleAudioPlayback}
                      className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 sm:h-8 sm:w-8"
                    >
                      {isPlayingAudio ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                    </Button>
                    <span className="text-xs text-white font-mono min-w-[80px]">
                      {Math.floor(audioPlaybackTime / 60)
                        .toString()
                        .padStart(2, "0")}
                      :{(audioPlaybackTime % 60).toString().padStart(2, "0")} /{" "}
                      {audioDuration > 0
                        ? `${Math.floor(audioDuration / 60)
                            .toString()
                            .padStart(
                              2,
                              "0",
                            )}:${(audioDuration % 60).toString().padStart(2, "0")}`
                        : "--:--"}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={audioDuration || 0}
                      value={audioPlaybackTime}
                      onChange={handleAudioProgressChange}
                      className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${audioDuration > 0 ? (audioPlaybackTime / audioDuration) * 100 : 0}%, rgba(255,255,255,0.2) ${audioDuration > 0 ? (audioPlaybackTime / audioDuration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`,
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleAudioMute}
                      className="h-11 w-11 text-white hover:bg-white/10 sm:h-8 sm:w-8"
                    >
                      {isAudioMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-white hover:bg-white/10 sm:h-8 sm:w-8"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAudioDelete}
                      className="h-11 w-11 text-white hover:bg-red-500/20 sm:h-8 sm:w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  ref={audioDropZoneRef}
                  onDragOver={handleAudioDragOver}
                  onDragEnter={handleAudioDragEnter}
                  onDragLeave={handleAudioDragLeave}
                  onDrop={handleAudioDrop}
                  onClick={handleAudioUploadClick}
                  className={cn(
                    "relative rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[100px] transition-all cursor-pointer",
                    isAudioDragging
                      ? "border-primary bg-primary/10 scale-[1.02]"
                      : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50",
                  )}
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                    {isAudioDragging ? (
                      <>
                        <Music className="h-12 w-12 text-primary animate-bounce" />
                        <p className="text-sm font-medium text-primary">
                          {t("form.audio.dropHere")}
                        </p>
                      </>
                    ) : (
                      <>
                        <Music className="h-12 w-12 text-muted-foreground" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">
                            {t("form.audio.dragDrop")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("form.audio.hint")}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleAudioFileChange(e.target.files)}
              />
            </div>
          </div>

          {/* Size, Duration, Shot Type */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Size */}
              <div className="flex-1">
                <Label
                  htmlFor="size"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {t("form.size.label")}
                </Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger id="size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1280*720">1280*720</SelectItem>
                    <SelectItem value="1920*1080">1920*1080</SelectItem>
                    <SelectItem value="720*1280">720*1280</SelectItem>
                    <SelectItem value="1080*1920">1080*1920</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="flex-1">
                <Label
                  htmlFor="duration"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {t("form.duration.label")}
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shot Type */}
              <div className="flex-1">
                <Label
                  htmlFor="shot-type"
                  className="text-sm font-semibold text-primary mb-2 block"
                >
                  {t("form.shotType.label")}
                </Label>
                <Select value={shotType} onValueChange={setShotType}>
                  <SelectTrigger id="shot-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">
                      {t("form.shotType.single")}
                    </SelectItem>
                    <SelectItem value="multiple">
                      {t("form.shotType.multiple")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Enable Prompt Expansion */}
          <div className="relative bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Label
                htmlFor="enable-prompt-expansion"
                className="text-sm font-medium text-foreground"
              >
                {t("form.enablePromptExpansion.label")}
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("form.enablePromptExpansion.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="enable-prompt-expansion"
                checked={enablePromptExpansion}
                onCheckedChange={(checked) =>
                  setEnablePromptExpansion(checked === true)
                }
              />
              <Label
                htmlFor="enable-prompt-expansion"
                className="text-sm cursor-pointer"
              >
                {t("form.enablePromptExpansion.description")}
              </Label>
            </div>
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
                    <span>
                      {t2("status.estimating", {
                        defaultValue: "Estimating...",
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    <span>
                      {t("form.buttons.run")}
                      <span className="ml-1.5 opacity-90">
                        ({requiredCredits}{" "}
                        {t2("buttons.credits", { defaultValue: "credits" })})
                      </span>
                    </span>
                  </>
                )}
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
                buttonText={t2("buttons.click_to_pay")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 右侧预览 */}
      <div className="bg-card border border-border rounded-md p-6 shadow-lg md:rounded-lg flex flex-col min-h-0">
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

      {/* Record Audio Dialog */}
      <Dialog
        open={showRecordDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent
          className="max-w-md border-white/20 bg-zinc-900"
          showCloseButton={false}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {t("form.audio.recordDialog.title")}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseDialog}
              className="h-6 w-6 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t("form.audio.recordDialog.instruction")}
          </p>
          <div className="bg-zinc-800 rounded-lg border border-white/10 p-8 mb-4 min-h-[200px] relative">
            {isRecording ? (
              <>
                {/* Recording indicator in top right */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-white font-mono">
                    {Math.floor(recordingTime / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(recordingTime % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                {/* Center content */}
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative">
                    <Mic className="h-16 w-16 text-red-500 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-20 w-20 rounded-full border-4 border-red-500 animate-ping" />
                    </div>
                  </div>
                </div>
              </>
            ) : recordedAudioUrl ? (
              <>
                {/* Waveform/Timeline */}
                <div className="relative w-full h-20 mb-4 flex items-center">
                  {/* Dashed line representing timeline */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-white/30" />
                  </div>
                  {/* Playhead indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                    style={{
                      left: `${totalDuration > 0 ? (playbackTime / totalDuration) * 100 : 0}%`,
                    }}
                  />
                </div>
                {/* Playback controls */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayback}
                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
                  >
                    {isPlayingRecorded ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white" />
                    )}
                  </Button>
                  <span className="text-sm text-white font-mono">
                    {Math.floor(playbackTime / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(playbackTime % 60).toString().padStart(2, "0")} /{" "}
                    {Math.floor(totalDuration / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(totalDuration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {t("form.audio.recordDialog.noRecording")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("form.audio.recordDialog.hint")}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {isRecording ? (
              <Button
                onClick={stopRecording}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Square className="h-4 w-4 mr-2" />
                {t("form.audio.recordDialog.stopRecording")}
              </Button>
            ) : recordedAudioUrl ? (
              <>
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("form.audio.recordDialog.retake")}
                </Button>
                <Button
                  onClick={handleUseAudio}
                  disabled={isUploadingAudio}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUploadingAudio ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("form.audio.recordDialog.uploading")}
                    </>
                  ) : (
                    t("form.audio.recordDialog.useAudio")
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={startRecording}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Mic className="h-4 w-4 mr-2" />
                {t("form.audio.recordDialog.startRecording")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
