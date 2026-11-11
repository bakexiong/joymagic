"use client";

import { motion } from "framer-motion";
import { AlertCircle, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { ShareDialog } from "@/shared/components/share-dialog";
import { SignModal } from "@/shared/blocks/sign/sign-modal";
import { useAppContext } from "@/shared/contexts/app";
import { cn } from "@/shared/lib/utils";
import { promptCategories } from "@/data/image-prompts";
import { getUserGeoLocation } from "@/shared/lib/geo";
import { Link } from "@/core/i18n/navigation";
import type { Button as ButtonConfig } from "@/shared/types/blocks/common";

const KLING_TEXT_TO_VIDEO_SCENE = "kling-v2-5-turbo-pro-text-to-video";

export function KlingV25TurboProTextToVideo({
  className,
  ctaButtons,
  disableShareGate = false,
}: {
  className?: string;
  ctaButtons?: ButtonConfig[];
  disableShareGate?: boolean;
}) {
  const { user, setIsShowSignModal } = useAppContext();
  const t = useTranslations("landing.wavespeed");
  const locale = useLocale();
  const isChineseLocale = locale?.startsWith("zh");
  const unknownErrorText = t("status.unknown_error");
  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [hasShared, setHasShared] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState(promptCategories[0].id);
  const [isMounted, setIsMounted] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isCheckingGeo, setIsCheckingGeo] = useState(true);
  useEffect(() => {
    setIsMounted(true);

    if (disableShareGate) {
      setHasShared(true);
    } else {
      if (typeof window !== "undefined") {
        const shared = localStorage.getItem("z-image-shared");
        setHasShared(shared === "true");
      }
    }

    const checkGeo = async () => {
      try {
        const location = await getUserGeoLocation();
        if (location?.isRestricted) {
          setIsRestricted(true);
        }
      } catch (err) {
        console.error("Geo check failed:", err);
      } finally {
        setIsCheckingGeo(false);
      }
    };

    checkGeo();
  }, []);

  const handleShareComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("z-image-shared", "true");
    }
    setHasShared(true);
  };

  const generateVideo = async () => {
    if (!user) {
      setIsShowSignModal(true);
      return;
    }

    if (isRestricted) {
      setError(t("errors.restricted"));
      return;
    }

    if (!hasShared && !disableShareGate) {
      setShowShareDialog(true);
      return;
    }

    if (!prompt.trim()) {
      setError(t("errors.prompt_required"));
      return;
    }

    setIsGenerating(true);
    setError("");
    setStatus(t("status.submitting"));
    setVideoUrl("");

    try {
      const payload = {
        aspect_ratio: "16:9",
        duration: 5,
        guidance_scale: 0.5,
        prompt: prompt.trim(),
        mediaType: "video",
        model: KLING_TEXT_TO_VIDEO_SCENE,
      };

      const response = await fetch(
        `/api/ai/${KLING_TEXT_TO_VIDEO_SCENE}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        const result = await response.json();
        const requestId =
          result?.data?.requestId || result?.data?.taskId || result?.data?.id;

        if (!requestId) {
          setError(
            t("errors.request_failed", {
              error: result?.message || unknownErrorText,
            }),
          );
          setIsGenerating(false);
          return;
        }

        setStatus(t("status.task_submitted", { id: requestId }));

        let attempts = 0;
        const maxAttempts = 240; // ~2 minutes at 0.5s per poll

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500));

          const resultResponse = await fetch(
            `/api/ai/status?taskId=${requestId}&scenario=${KLING_TEXT_TO_VIDEO_SCENE}`,
          );

          const resultData = await resultResponse.json();

          if (resultResponse.ok) {
            const data = resultData.data;
            const taskStatus = data.status;

            if (taskStatus === "completed") {
              // 优先使用 output 字段，其次使用 outputs 数组的第一个
              const outputUrl =
                data.output ||
                data.videoUrl ||
                (data.outputs && data.outputs.length > 0
                  ? data.outputs[0]
                  : null);
              if (outputUrl) {
                setVideoUrl(outputUrl);
                setStatus(t("status.video_success"));
              } else {
                setError(
                  t("errors.request_failed", { error: unknownErrorText }),
                );
              }
              setIsGenerating(false);
              return;
            } else if (taskStatus === "failed") {
              setError(
                t("video.errors.task_failed", {
                  error: data.error || unknownErrorText,
                }),
              );
              setIsGenerating(false);
              return;
            } else {
              setStatus(t("status.video_processing", { status: taskStatus }));
            }
          } else {
            setError(t("errors.http_error", { code: resultResponse.status }));
            setIsGenerating(false);
            return;
          }

          attempts++;
        }

        setError(t("video.errors.timeout"));
        setIsGenerating(false);
      } else {
        const errorText = await response.text();
        setError(
          t("errors.http_error_with_text", {
            code: response.status,
            text: errorText || "",
          }),
        );
        setIsGenerating(false);
      }
    } catch (err) {
      setError(
        t("errors.request_failed", {
          error: err instanceof Error ? err.message : unknownErrorText,
        }),
      );
      setIsGenerating(false);
    }
  };

  return (
    <motion.section
      className={cn("relative py-16", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 1.3,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
    >
      <div className="mx-auto w-full max-w-[92rem] px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
              <label
                htmlFor="kling-prompt"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                {t("prompt_label")}
              </label>
              <Textarea
                id="kling-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("prompt_placeholder")}
                className="min-h-[200px] resize-none"
                disabled={isGenerating}
              />

              <Button
                onClick={generateVideo}
                disabled={
                  isGenerating ||
                  !prompt.trim() ||
                  isCheckingGeo ||
                  isRestricted
                }
                className="group relative mt-4 w-full overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60"
                size="lg"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen transition duration-700 group-hover:opacity-100"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.3), transparent 30%)",
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-[120%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.4),rgba(255,255,255,0.05))] opacity-70 blur-3xl"
                />
                <span className="relative flex items-center justify-center">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("buttons.generating")}
                    </>
                  ) : isCheckingGeo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("buttons.checking")}
                    </>
                  ) : isRestricted ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      {t("buttons.unavailable")}
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isMounted && hasShared
                        ? t("buttons.generate")
                        : t("buttons.share_to_generate")}
                    </>
                  )}
                </span>
              </Button>

              <Button
                onClick={() => window.open("/pricing", "_blank")}
                className="mt-3 w-full animate-pulse bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700"
                size="lg"
              >
                <span className="mr-2">💳</span>
                {t("buttons.click_to_pay")}
              </Button>

              {isMounted && isRestricted && (
                <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <p className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{t("errors.restricted")}</span>
                  </p>
                </div>
              )}

              {isMounted && !hasShared && !isRestricted && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {t("share_hint")}
                </p>
              )}

              {status && !error && (
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {status}
                </p>
              )}

              {error && (
                <p className="mt-3 text-center text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            {/* Prompt Categories + Guides */}
            <div className="hidden rounded-lg border border-border bg-muted/50 p-4 md:block">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-foreground">
                  {t("prompt_inspirations")}
                </h3>
              </div>

              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {promptCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      disabled={isGenerating}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs transition-all",
                        activeCategory === category.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                        isGenerating && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {isChineseLocale ? category.name : category.nameEn}
                    </button>
                  ))}
                </div>

                <div className="custom-scrollbar max-h-[600px] space-y-3 overflow-y-auto pr-2">
                  {promptCategories
                    .find((cat) => cat.id === activeCategory)
                    ?.prompts.map((examplePrompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(examplePrompt.text)}
                        disabled={isGenerating}
                        className="flex w-full items-center gap-3 rounded-lg border border-border/50 p-3 text-left text-xs text-muted-foreground transition-colors hover:border-border hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {examplePrompt.thumbnail && (
                          <div className="h-[250px] w-[250px] flex-shrink-0 overflow-hidden rounded-md shadow-sm">
                            <img
                              src={examplePrompt.thumbnail}
                              alt={examplePrompt.text}
                              width={250}
                              height={250}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <span className="flex-1 line-clamp-6">
                          {examplePrompt.text}
                        </span>
                      </button>
                    ))}
                </div>
              </>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-card p-6 shadow-lg">
              {videoUrl ? (
                <div className="w-full space-y-4">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full rounded-lg"
                    autoPlay
                    loop
                  >
                    {t("video.unsupported")}
                  </video>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm text-primary hover:underline"
                  >
                    {t("video.download")}
                  </a>

                  {ctaButtons && ctaButtons.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      {ctaButtons.slice(0, 1).map((button, idx) => (
                        <Button
                          asChild
                          key={`${button.title || "cta"}-${idx}`}
                          size={button.size || "default"}
                          variant={button.variant || "default"}
                          className="w-full max-w-xs gap-2 px-5 text-sm shadow-md"
                        >
                          <Link
                            href={button.url ?? ""}
                            target={button.target ?? "_self"}
                            className="flex items-center justify-center gap-2"
                          >
                            {(button.icon_url || button.icon) && (
                              <span className="inline-flex h-5 w-5 items-center justify-center">
                                {button.icon_url ? (
                                  <img
                                    src={button.icon_url}
                                    alt={`${button.title || "Button"} icon`}
                                    className="h-5 w-5 object-contain"
                                  />
                                ) : (
                                  <Sparkles className="h-5 w-5" />
                                )}
                              </span>
                            )}
                            <span>{button.title}</span>
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ) : isGenerating ? (
                <div className="text-center">
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">{t("video.creating")}</p>
                  {status && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {status}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Wand2 className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>{t("video.title")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShareComplete={handleShareComplete}
      />

      <SignModal callbackUrl="/" />
    </motion.section>
  );
}
