"use client";

import { useMemo, useRef, useState } from "react";
import {
  Images,
  Play,
  Sparkles,
  Wand2,
  AlertCircle,
  Trash2,
  FileImage,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { PaymentButton } from "@/shared/components/payment-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useAppContext } from "@/shared/contexts/app";
import {
  isTaskCompleted,
  isTaskFailed,
  isTaskProcessing,
} from "@/shared/lib/task-status";

const POLL_INTERVAL = 2000;
const MAX_POLL_ATTEMPTS = 120;

/** 解析 generate 响应，提取任务数据（与 ltx-2-fast 等页一致的格式）。支持 data.requestId + data.data。 */
const extractWavespeedData = (result: any): Record<string, unknown> | null => {
  const codeOk = result?.code === 0 || result?.code === "0";
  if (!codeOk || !result?.data) return null;
  const d = result.data as Record<string, unknown>;
  const inner =
    d.data && typeof d.data === "object" && !Array.isArray(d.data)
      ? (d.data as Record<string, unknown>)
      : null;
  const reqId = (d.requestId ?? inner?.id ?? d.id ?? d.task_id) as
    | string
    | undefined;

  if (inner) {
    const task = { ...inner } as Record<string, unknown>;
    if (!task.id && reqId) task.id = reqId;
    return task;
  }
  if (
    d.code === 200 &&
    d.data &&
    typeof d.data === "object" &&
    !Array.isArray(d.data)
  ) {
    return d.data as Record<string, unknown>;
  }
  if (d.id || d.task_id) {
    return d as Record<string, unknown>;
  }
  if (reqId) {
    return { id: reqId };
  }
  return null;
};

const extractRequestId = (data: any): string | null => {
  if (!data) return null;
  return data.requestId ?? data.id ?? data.request_id ?? null;
};

const extractVideoUrl = (data: any): string | null => {
  if (!data) return null;
  const url =
    data.outputs?.[0] ??
    data.video_url ??
    data.url ??
    data.output_url ??
    data.video;
  return typeof url === "string" ? url : null;
};

export function SingleFaceSwap({ className }: { className?: string }) {
  const { user } = useAppContext();

  const t = useTranslations("landing.faceSwap");
  const t2 = useTranslations("landing.wavespeed");
  const [videoName, setVideoName] = useState("");
  const [faceName, setFaceName] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [swappedVideoUrl, setSwappedVideoUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<
    number | null
  >(null);

  // 使用 Hook 获取所需积分（动态：基于 duration，每 5 秒计费）
  // 未上传视频时用默认 5 秒以便调用 estimate-credits，上传后按实际时长
  const estimateParams = useMemo(
    () => ({ duration: videoDurationSeconds ?? 5 }),
    [videoDurationSeconds],
  );
  const {
    credits: requiredCredits,
    isLoading: isEstimating,
    error: estimateError,
  } = useEstimateCredits("video-face-swap", estimateParams, {
    debounceMs: 300,
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmPermission, setConfirmPermission] = useState(false);
  const [confirmLegal, setConfirmLegal] = useState(false);
  const [confirmSynthetic, setConfirmSynthetic] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingFace, setIsDraggingFace] = useState(false);
  const pendingFileRef = useRef<{ kind: "video" | "face"; file: File } | null>(
    null,
  );
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const faceInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileRef = useRef<File | null>(null);
  const faceFileRef = useRef<File | null>(null);
  const videoDropZoneRef = useRef<HTMLDivElement | null>(null);
  const faceDropZoneRef = useRef<HTMLDivElement | null>(null);
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  const handleUploadClick = (kind: "video" | "face") => {
    const targetRef = kind === "video" ? videoInputRef : faceInputRef;
    targetRef.current?.click();
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error(t("errors.videoDurationReadFailed")));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const processFile = async (kind: "video" | "face", file: File) => {
    const url = URL.createObjectURL(file);

    if (kind === "video") {
      try {
        const duration = await getVideoDuration(file);
        const maxDuration = 600;

        if (duration > maxDuration) {
          setError(
            t("errors.videoDurationExceeded", {
              max: maxDuration / 60,
              current: Math.ceil(duration / 60),
            }),
          );
          URL.revokeObjectURL(url);
          return;
        }

        // 计算并保存视频时长（秒）
        const durationSeconds = Math.ceil(duration);
        setVideoDurationSeconds(durationSeconds);
        console.log("Video duration (seconds):", durationSeconds);
      } catch (err) {
        console.error("Failed to get video duration:", err);
        setError(t("errors.videoDurationReadFailed"));
        URL.revokeObjectURL(url);
        return;
      }

      setVideoName(file.name);
      setVideoPreview(url);
      videoFileRef.current = file;
      setSwappedVideoUrl(null);
    } else {
      setFaceName(file.name);
      setFacePreview(url);
      faceFileRef.current = file;
      setSwappedVideoUrl(null);
    }
    setError(null);
  };

  const handleFileChange = async (
    kind: "video" | "face",
    fileList: FileList | null,
  ) => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    // 保存待处理的文件并显示确认弹窗
    pendingFileRef.current = { kind, file };
    setShowConfirmDialog(true);
    // 重置确认状态
    setConfirmPermission(false);
    setConfirmLegal(false);
    setConfirmSynthetic(false);
  };

  const handleConfirmUpload = async () => {
    if (!confirmPermission || !confirmLegal || !confirmSynthetic) {
      return;
    }

    if (!pendingFileRef.current) {
      return;
    }

    const { kind, file } = pendingFileRef.current;
    setShowConfirmDialog(false);
    await processFile(kind, file);
    pendingFileRef.current = null;
  };

  const handleDelete = (kind: "video" | "face") => {
    if (kind === "video") {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoPreview(null);
      setVideoName("");
      setVideoDurationSeconds(null);
      videoFileRef.current = null;
      setSwappedVideoUrl(null);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    } else {
      if (facePreview) {
        URL.revokeObjectURL(facePreview);
      }
      setFacePreview(null);
      setFaceName("");
      faceFileRef.current = null;
      setSwappedVideoUrl(null);
      if (faceInputRef.current) {
        faceInputRef.current.value = "";
      }
    }
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent, kind: "video" | "face") => {
    e.preventDefault();
    e.stopPropagation();
    if (kind === "video" && !isDraggingVideo) {
      setIsDraggingVideo(true);
    } else if (kind === "face" && !isDraggingFace) {
      setIsDraggingFace(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent, kind: "video" | "face") => {
    e.preventDefault();
    e.stopPropagation();
    if (kind === "video") {
      setIsDraggingVideo(true);
    } else {
      setIsDraggingFace(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, kind: "video" | "face") => {
    e.preventDefault();
    e.stopPropagation();
    const dropZoneRef = kind === "video" ? videoDropZoneRef : faceDropZoneRef;
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      if (kind === "video") {
        setIsDraggingVideo(false);
      } else {
        setIsDraggingFace(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, kind: "video" | "face") => {
    e.preventDefault();
    e.stopPropagation();
    if (kind === "video") {
      setIsDraggingVideo(false);
    } else {
      setIsDraggingFace(false);
    }

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
    if (kind === "video") {
      if (!file.type.startsWith("video/")) {
        setError(t("errors.videoRequired"));
        return;
      }
    } else {
      if (!file.type.startsWith("image/")) {
        setError(t("errors.faceImageRequired"));
        return;
      }
    }

    // 保存待处理的文件并显示确认弹窗
    pendingFileRef.current = { kind, file };
    setShowConfirmDialog(true);
    setConfirmPermission(false);
    setConfirmLegal(false);
    setConfirmSynthetic(false);
  };

  const uploadFile = async (file: File, isVideo: boolean): Promise<string> => {
    const formData = new FormData();
    formData.append("files", file);

    const endpoint = isVideo
      ? "/api/storage/upload-video"
      : "/api/storage/upload-image";
    const response = await fetch(endpoint, {
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

  const pollTaskStatus = async (requestId: string): Promise<string> => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      try {
        const statusResponse = await fetch(
          `/api/ai/status?taskId=${requestId}&scenario=video-face-swap`,
        );
        if (!statusResponse.ok) {
          const errBody = await statusResponse.json().catch(() => ({}));
          console.warn(
            `[Polling] Status failed (attempt ${attempt + 1}):`,
            statusResponse.status,
            errBody,
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
          console.error("[Polling] No status data:", statusResult);
          throw new Error(
            statusResult.message || t("errors.statusQueryFailed"),
          );
        }
        const taskStatus = statusData.status;
        console.log(
          `[Polling] Task ${requestId} status: ${taskStatus} (attempt ${attempt + 1})`,
          statusData,
        );

        if (isTaskCompleted(taskStatus)) {
          const url = (statusData.output ??
            statusData.outputs?.[0] ??
            statusData.video_url) as string | undefined;
          if (url && typeof url === "string") {
            return url;
          }
          console.warn("[Polling] No result URL in response:", statusData);
        } else if (isTaskFailed(taskStatus)) {
          const errMsg =
            statusData.error ?? statusData.message ?? t("errors.taskFailed");
          if (
            typeof errMsg === "string" &&
            (errMsg.includes("404") || errMsg.includes("Not Found"))
          ) {
            throw new Error(t("errors.videoFileNotFound"));
          }
          throw new Error(
            typeof errMsg === "string" ? errMsg : t("errors.taskFailed"),
          );
        } else if (!isTaskProcessing(taskStatus)) {
          console.warn(
            `[Polling] Unknown status: ${taskStatus}, continuing...`,
          );
        }
      } catch (e: any) {
        console.warn("[Polling] Error:", e);
        if (e?.message && !String(e.message).includes("fetch")) throw e;
      }
    }
    throw new Error(t("errors.taskTimeout"));
  };

  const startRender = async () => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === "restricted" && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }
    if (!videoFileRef.current) {
      setError(t("errors.videoRequired"));
      return;
    }
    if (!faceFileRef.current) {
      setError(t("errors.faceImageRequired"));
      return;
    }

    setIsRendering(true);
    setError(null);
    setSwappedVideoUrl(null);

    try {
      const videoUrl = await uploadFile(videoFileRef.current, true);
      const faceImageUrl = await uploadFile(faceFileRef.current, false);

      const response = await fetch("/api/ai/video-face-swap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: "video",
          face_image: faceImageUrl,
          video: videoUrl,
          target_gender: "all",
          target_index: 0,
          video_duration_seconds: videoDurationSeconds ?? undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as any)?.message || t("errors.faceSwapFailed"),
        );
      }

      const result = await response.json();
      const wavespeedData = extractWavespeedData(result);
      if (!wavespeedData) {
        const msg =
          result?.message && String(result.message).toLowerCase() !== "ok"
            ? result.message
            : null;
        throw new Error(msg || t("errors.apiResponseParseFailed"));
      }

      const directVideoUrl = extractVideoUrl(wavespeedData);
      if (directVideoUrl) {
        setSwappedVideoUrl(directVideoUrl);
        return;
      }

      const requestId = extractRequestId(wavespeedData);
      if (!requestId) {
        throw new Error(t("errors.taskIdNotFound"));
      }

      const finalVideoUrl = await pollTaskStatus(requestId);
      setSwappedVideoUrl(finalVideoUrl);
    } catch (err: any) {
      console.error("Render failed:", err);
      setError(err?.message || t("errors.processingFailed"));
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("uploadConfirm.title")}</DialogTitle>
            <DialogDescription>
              {t("uploadConfirm.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="permission"
                checked={confirmPermission}
                onCheckedChange={(checked) =>
                  setConfirmPermission(checked === true)
                }
                className="mt-0.5"
              />
              <label
                htmlFor="permission"
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t("uploadConfirm.permission")}
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="legal"
                checked={confirmLegal}
                onCheckedChange={(checked) => setConfirmLegal(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="legal"
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t("uploadConfirm.legal")}
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="synthetic"
                checked={confirmSynthetic}
                onCheckedChange={(checked) =>
                  setConfirmSynthetic(checked === true)
                }
                className="mt-0.5"
              />
              <label
                htmlFor="synthetic"
                className="text-sm leading-relaxed cursor-pointer"
              >
                {t("uploadConfirm.synthetic")}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                pendingFileRef.current = null;
                setConfirmPermission(false);
                setConfirmLegal(false);
                setConfirmSynthetic(false);
              }}
            >
              {t("uploadConfirm.cancel")}
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={
                !confirmPermission || !confirmLegal || !confirmSynthetic
              }
            >
              {t("uploadConfirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div
        className={cn(
          "grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_1fr]",
          className,
        )}
      >
        {/* 左侧步骤 */}
        <div className="relative">
          <div className="space-y-3">
            {/* Step 1: Upload a Video */}
            <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                  1
                </span>
                {t("steps.video.title")}
              </div>
              <div className="mt-2">
                <p className="text-muted-foreground mb-1 text-xs">
                  {t("steps.video.hint")}
                </p>
                <p className="text-xs text-foreground/80 mb-2">
                  {videoName
                    ? t("common.selected", { name: videoName })
                    : t("common.notSelected")}
                </p>
                {videoDurationSeconds !== null && (
                  <p className="text-xs text-foreground/70 mb-2">
                    Duration: {videoDurationSeconds}s
                  </p>
                )}
                <div
                  ref={videoDropZoneRef}
                  onDragOver={(e) => handleDragOver(e, "video")}
                  onDragEnter={(e) => handleDragEnter(e, "video")}
                  onDragLeave={(e) => handleDragLeave(e, "video")}
                  onDrop={(e) => handleDrop(e, "video")}
                  onClick={() => handleUploadClick("video")}
                  className={cn(
                    "relative rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[140px] transition-all cursor-pointer",
                    isDraggingVideo
                      ? "border-primary bg-primary/10 scale-[1.02]"
                      : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50",
                    videoPreview && "border-solid cursor-default",
                  )}
                >
                  {videoPreview ? (
                    <>
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full object-contain max-h-[250px]"
                        muted
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-11 w-11 bg-red-500/80 hover:bg-red-600/90 z-10 sm:h-8 sm:w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete("video");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                      {isDraggingVideo ? (
                        <>
                          <Play className="h-12 w-12 text-primary animate-bounce" />
                          <p className="text-sm font-medium text-primary">
                            {t("steps.video.dropHere") || "Drop video here"}
                          </p>
                        </>
                      ) : (
                        <>
                          <Play className="h-12 w-12 text-muted-foreground" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">
                              {t("steps.video.dragDrop") ||
                                "Drag & drop or click to upload"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("steps.video.hint")}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                  className="hidden"
                  onChange={(e) => handleFileChange("video", e.target.files)}
                />
              </div>
            </div>

            {/* Step 2: Face handling */}
            <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                  2
                </span>
                {t("steps.face.title")}
              </div>
              <div className="mt-2">
                <p className="text-muted-foreground mb-1 text-xs">
                  {t("steps.face.hint")}
                </p>
                <p className="text-xs text-foreground/80 mb-2">
                  {faceName
                    ? t("common.selected", { name: faceName })
                    : t("common.notSelected")}
                </p>
                <div
                  ref={faceDropZoneRef}
                  onDragOver={(e) => handleDragOver(e, "face")}
                  onDragEnter={(e) => handleDragEnter(e, "face")}
                  onDragLeave={(e) => handleDragLeave(e, "face")}
                  onDrop={(e) => handleDrop(e, "face")}
                  onClick={() => handleUploadClick("face")}
                  className={cn(
                    "relative rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[140px] transition-all cursor-pointer",
                    isDraggingFace
                      ? "border-primary bg-primary/10 scale-[1.02]"
                      : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50",
                    facePreview && "border-solid cursor-default",
                  )}
                >
                  {facePreview ? (
                    <>
                      <img
                        src={facePreview}
                        alt="Face preview"
                        className="w-full h-full object-contain max-h-[250px]"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-11 w-11 bg-red-500/80 hover:bg-red-600/90 z-10 sm:h-8 sm:w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete("face");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                      {isDraggingFace ? (
                        <>
                          <FileImage className="h-12 w-12 text-primary animate-bounce" />
                          <p className="text-sm font-medium text-primary">
                            {t("steps.face.dropHere") || "Drop image here"}
                          </p>
                        </>
                      ) : (
                        <>
                          <FileImage className="h-12 w-12 text-muted-foreground" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">
                              {t("steps.face.dragDrop") ||
                                "Drag & drop or click to upload"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("steps.face.hint")}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={faceInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange("face", e.target.files)}
                />
              </div>
            </div>

            {/* Step 3: Render */}
            <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                  3
                </span>
                {t("steps.render.title")}
              </div>
              <Button
                size="lg"
                className="group relative mt-3 w-full overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60 disabled:opacity-70"
                onClick={startRender}
                disabled={
                  isRendering ||
                  !videoFileRef.current ||
                  !faceFileRef.current ||
                  (isEstimating || requiredCredits === null)
                }
              >
                {isRendering ? (
                  <>
                    <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("steps.render.rendering")}
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
                    <Play className="mr-2 h-5 w-5" />
                    <span>
                      {t("steps.render.cta")}
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
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/70 to-black p-3 shadow-xl sm:p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("preview.title")}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-transparent">
            {videoPreview ? (
              <div className="flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* 原视频 */}
                <div className="relative overflow-hidden rounded-xl flex-shrink-0">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-auto max-h-[350px] object-contain"
                    autoPlay
                    loop
                    muted
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-xs text-white/80">
                    {t("preview.original")}
                  </div>
                </div>
                {/* 换脸后视频 */}
                <div className="relative overflow-hidden rounded-xl flex-shrink-0">
                  {swappedVideoUrl ? (
                    <video
                      src={swappedVideoUrl}
                      controls
                      className="w-full h-auto max-h-[350px] object-contain"
                      autoPlay
                      loop
                      muted
                    />
                  ) : (
                    <div className="flex min-h-[160px] w-full items-center justify-center rounded-xl border border-white/10 bg-black/40 sm:min-h-[120px]">
                      {isRendering ? (
                        <Wand2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("preview.swapped")}
                        </span>
                      )}
                    </div>
                  )}
                  {swappedVideoUrl && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-xs text-white/80">
                      {t("preview.swapped")}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 text-center text-slate-200 sm:min-h-[150px]">
                  <Wand2 className="h-8 w-8 text-slate-400" />
                  <p className="text-sm font-medium text-slate-300">
                    {t("preview.placeholder")}
                  </p>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <img
                    src="/imgs/cases/e0463f39-3694-46bf-9252-554e6e39f14e.webp"
                    alt="Face swap example"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </>
            )}

            {facePreview && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-2.5">
                <img
                  src={facePreview}
                  alt={t("preview.faceAlt")}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="text-sm font-medium text-white">
                  {t("preview.usingFace", { name: faceName })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
