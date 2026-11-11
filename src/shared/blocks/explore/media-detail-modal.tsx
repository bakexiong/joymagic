"use client";

import { useState, useEffect } from "react";
import {
  X,
  Copy,
  RefreshCw,
  Video,
  Maximize2,
  Edit,
  Download,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { MediaItem } from "./media-card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useAppContext } from "@/shared/contexts/app";
import { useRouter } from "@/core/i18n/navigation";

interface MediaDetailModalProps {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeOnOverlayClick?: boolean;
  onRecreate?: (item: MediaItem) => void;
  onDownload?: (item: MediaItem) => void;
  onVideo?: (item: MediaItem) => void;
  onUpscale?: (item: MediaItem) => void;
  onEdit?: (item: MediaItem) => void;
}

export function MediaDetailModal({
  item,
  open,
  onOpenChange,
  closeOnOverlayClick = true,
  onRecreate,
  onDownload,
  onVideo,
  onUpscale,
  onEdit,
}: MediaDetailModalProps) {
  const { user } = useAppContext();
  const router = useRouter();
  const t = useTranslations("explore.media_detail");
  const [copied, setCopied] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowFullPrompt(false);
      setCopied(false);
    }
  }, [open]);

  if (!item) return null;

  const isImageItem = item.type === "image";
  const isVideoItem = item.type === "video";
  const isAudioItem = item.type === "audio";
  const modalPreviewSrc = item.src?.trim() || null;

  const canRecreate = Boolean(onRecreate) && !isAudioItem;
  const canDownload = Boolean(onDownload) && Boolean(modalPreviewSrc);
  const canCreateVideo = Boolean(onVideo) && isImageItem;
  const canUpscale = Boolean(onUpscale) && isImageItem;
  const canEditImage = Boolean(onEdit) && isImageItem;
  const hasSecondaryActions = canCreateVideo || canUpscale || canEditImage;
  const hasAnyActions = canRecreate || canDownload || hasSecondaryActions;

  const promptText = item.prompt || t("no_prompt");
  const displayPrompt = showFullPrompt ? promptText : promptText.slice(0, 150);
  const dialogTitle = item.alt || item.model || "Media details";
  const dialogDescription = isVideoItem
    ? "Preview the selected video and its generation details."
    : isAudioItem
      ? "Review the selected audio item details."
      : "Preview the selected image and its generation details.";

  const checkLogin = (callback: () => void) => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    callback();
  };

  const handleCopyPrompt = async () => {
    checkLogin(async () => {
      if (item.prompt) {
        await navigator.clipboard.writeText(item.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  const handleGenerate = () => {
    checkLogin(() => {
      // 将提示词存储到 sessionStorage
      if (item.prompt) {
        sessionStorage.setItem("creator-initial-prompt", item.prompt);
      }
      // 将生成参数存储到 sessionStorage
      if (item.parameters && Object.keys(item.parameters).length > 0) {
        sessionStorage.setItem(
          "creator-initial-params",
          JSON.stringify(item.parameters),
        );
      }
      // 调用父组件传入的 onRecreate 回调
      onRecreate?.(item);
    });
  };

  const handleDownload = () => {
    // 下载也需要登录（与生成相似保持一致）
    checkLogin(() => {
      onDownload?.(item);
    });
  };

  const handleVideo = () => {
    checkLogin(() => {
      onVideo?.(item);
    });
  };

  const handleUpscale = () => {
    checkLogin(() => {
      onUpscale?.(item);
    });
  };

  const handleEdit = () => {
    checkLogin(() => {
      onEdit?.(item);
    });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[10001] flex h-[100dvh] w-screen max-w-none -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden bg-[#1a1a1f] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 focus:outline-none md:h-[min(88vh,56rem)] md:w-[min(92vw,78rem)] md:rounded-[1.5rem] md:border md:border-white/10 md:shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          onPointerDownOutside={(e) => {
            if (!closeOnOverlayClick) {
              e.preventDefault();
              return;
            }
            onOpenChange(false);
          }}
          onEscapeKeyDown={() => onOpenChange(false)}
        >
          <DialogPrimitive.Title className="sr-only">
            {dialogTitle}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {dialogDescription}
          </DialogPrimitive.Description>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-[10002] flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/20 bg-white/5 p-2.5 text-white transition-colors duration-200 hover:bg-white/10 active:bg-white/15 md:right-6 md:top-6"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col md:flex-row">
            <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center bg-[#0f0f15] md:h-full">
              {isVideoItem ? (
                <video
                  src={item.src}
                  controls
                  autoPlay
                  className="h-full w-full object-contain outline-none"
                  style={{
                    border: "none",
                    boxShadow: "none",
                  }}
                />
              ) : isAudioItem ? (
                <div className="flex h-full w-full items-center justify-center p-4 md:p-8">
                  <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center">
                    <p className="text-base font-medium text-white">
                      Audio preview coming soon
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {item.alt ||
                        "This item does not have a preview image yet."}
                    </p>
                  </div>
                </div>
              ) : modalPreviewSrc ? (
                <div className="relative flex h-full w-full items-center justify-center p-4 md:p-8">
                  <img
                    src={modalPreviewSrc}
                    alt={item.alt || t("image_alt")}
                    loading="eager"
                    decoding="async"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center p-4 md:p-8">
                  <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center">
                    <p className="text-base font-medium text-white">
                      Preview unavailable
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {item.alt || t("image_alt")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex h-full min-h-0 w-full shrink-0 flex-col border-t border-white/10 bg-[#1f1f25] md:h-full md:w-[min(100%,420px)] md:border-t-0 md:border-l md:border-white/10 md:pt-16 lg:w-[min(100%,460px)]">
              {/* 可滚动内容区域 */}
              <div
                className="flex-1 min-h-0 overflow-y-auto px-4 pt-16 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-6 md:pb-6 relative z-0"
                style={{
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {item.prompt && (
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <div className="mb-2 sm:mb-3 flex items-center justify-between">
                      <h3 className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-white/60 sm:text-xs">
                        {t("prompt_title")}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPrompt}
                        className="min-h-[44px] whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-3 text-[10px] text-white transition-colors duration-200 hover:bg-white/10 active:bg-white/15 sm:px-4 sm:text-xs md:h-7 md:px-3"
                      >
                        {copied ? t("copied_button") : t("copy_button")}
                      </Button>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4",
                        !user && "select-none",
                      )}
                      onContextMenu={
                        !user ? (e) => e.preventDefault() : undefined
                      }
                      onCopy={!user ? (e) => e.preventDefault() : undefined}
                      onCut={!user ? (e) => e.preventDefault() : undefined}
                      onDragStart={
                        !user ? (e) => e.preventDefault() : undefined
                      }
                    >
                      <p
                        className={cn(
                          "text-xs leading-relaxed text-white sm:text-sm",
                          !user && "pointer-events-none",
                        )}
                      >
                        {displayPrompt}
                        {!showFullPrompt && promptText.length > 150 && "..."}
                      </p>
                      {promptText.length > 150 && (
                        <button
                          onClick={() => setShowFullPrompt(!showFullPrompt)}
                          className="mt-2 min-h-[44px] whitespace-nowrap text-[10px] text-white/60 transition-colors duration-200 hover:text-white/80 active:text-white pointer-events-auto sm:mt-3 sm:text-xs md:mt-2 md:min-h-0"
                        >
                          {showFullPrompt ? t("show_less") : t("show_more")}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-4 sm:mb-5 md:mb-6">
                  <div className="mb-2 sm:mb-3">
                    <h3 className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-white/60 sm:text-xs">
                      {t("information_title")}
                    </h3>
                  </div>
                  <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                    {item.model && (
                      <div>
                        <span className="whitespace-nowrap text-[10px] text-white/60 sm:text-xs">
                          {t("model_label")}
                        </span>
                        <p className="whitespace-nowrap text-xs font-medium text-white sm:text-sm">
                          {item.model}
                        </p>
                      </div>
                    )}
                    {item.quality && (
                      <div>
                        <span className="whitespace-nowrap text-[10px] text-white/60 sm:text-xs">
                          {t("quality_label")}
                        </span>
                        <p className="whitespace-nowrap text-xs font-medium text-white sm:text-sm">
                          {item.quality}
                        </p>
                      </div>
                    )}
                    {item.size && (
                      <div>
                        <span className="whitespace-nowrap text-[10px] text-white/60 sm:text-xs">
                          {t("size_label")}
                        </span>
                        <p className="whitespace-nowrap text-xs font-medium text-white sm:text-sm">
                          {item.size}
                        </p>
                      </div>
                    )}
                    {item.parameters &&
                      Object.keys(item.parameters).length > 0 && (
                        <div>
                          <span className="whitespace-nowrap text-[10px] text-white/60 sm:text-xs">
                            Parameters
                          </span>
                          <div className="mt-1 space-y-1">
                            {Object.entries(item.parameters).map(
                              ([key, value]) => (
                                <p
                                  key={key}
                                  className="text-xs text-white/80 sm:text-sm break-words"
                                >
                                  <span className="text-white/60">{key}:</span>{" "}
                                  {String(value)}
                                </p>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* 固定在底部的按钮区域 */}
              {/* iOS Safari：通过 safe-area 预留底部空间即可，过大的 pb 会导致按钮被容器裁切（overflow-hidden） */}
              {/* 额外预留一部分底部空间：iOS Safari 的底部覆盖层高度不一定等于 safe-area */}
              {hasAnyActions ? (
                <div className="absolute bottom-0 left-0 right-0 z-[10] shrink-0 border-t border-white/10 bg-[#1f1f25] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-2.5 sm:space-y-3 md:p-6 md:pb-6">
                  {canDownload && (
                    <Button
                      onClick={handleDownload}
                      variant="default"
                      size="lg"
                      className="w-full min-h-[48px] whitespace-nowrap rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold text-white shadow-xl shadow-black/30 transition-colors duration-200 hover:bg-white/15 hover:shadow-2xl hover:shadow-black/40 active:bg-white/20 sm:px-6 sm:py-3.5 sm:text-sm md:min-h-[44px] md:py-3"
                    >
                      <Download className="mr-2 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      {t("download_button")}
                    </Button>
                  )}
                  {canRecreate && (
                    <Button
                      onClick={handleGenerate}
                      variant="default"
                      size="lg"
                      className="w-full min-h-[48px] whitespace-nowrap rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold text-white shadow-xl shadow-black/30 transition-colors duration-200 hover:bg-white/15 hover:shadow-2xl hover:shadow-black/40 active:bg-white/20 sm:px-6 sm:py-3.5 sm:text-sm md:min-h-[44px] md:py-3"
                    >
                      <RefreshCw className="mr-2 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      {t("generate_button")}
                    </Button>
                  )}

                  {(() => {
                    const secondaryButtons = [
                      canCreateVideo && "video",
                      canUpscale && "upscale",
                      canEditImage && "edit",
                    ].filter(Boolean);

                    const buttonCount = secondaryButtons.length;

                    if (buttonCount === 0) return null;

                    const gridClass =
                      buttonCount === 1 ? "grid-cols-1" : "grid-cols-2";

                    return (
                      <div
                        className={`grid ${gridClass} gap-2.5 sm:gap-3 md:gap-2`}
                      >
                        {canCreateVideo && (
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleVideo}
                            className="min-h-[48px] whitespace-nowrap rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-white/10 hover:border-white/30 active:bg-white/15 sm:px-4 sm:py-3 sm:text-sm md:min-h-[44px] md:py-2.5"
                          >
                            <Video className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
                            {t("video_button")}
                          </Button>
                        )}
                        {canUpscale && (
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleUpscale}
                            className="min-h-[48px] whitespace-nowrap rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-white/10 hover:border-white/30 active:bg-white/15 sm:px-4 sm:py-3 sm:text-sm md:min-h-[44px] md:py-2.5"
                          >
                            <Maximize2 className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
                            {t("upscale_button")}
                          </Button>
                        )}
                        {canEditImage && (
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleEdit}
                            className="min-h-[48px] whitespace-nowrap rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-white/10 hover:border-white/30 active:bg-white/15 sm:px-4 sm:py-3 sm:text-sm md:min-h-[44px] md:py-2.5"
                          >
                            <Edit className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
                            {t("edit_button")}
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
