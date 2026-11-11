"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ImageIcon,
  Loader2,
  Music4,
  Play,
  Upload,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import {
  createOptimizedPreviewUrl,
  revokeObjectUrl,
} from "@/shared/lib/image-preview";
import { cn } from "@/shared/lib/utils";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";

export type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

export interface ImageUploaderValue {
  id: string;
  preview: string;
  url?: string;
  status: UploadStatus;
  size?: number;
  mimeType?: string;
  duration?: number;
}

interface ImageUploaderProps {
  allowMultiple?: boolean;
  maxImages?: number;
  maxSizeMB?: number;
  accept?: string;
  uploadUrl?: string;
  previewType?: "image" | "video" | "audio" | "auto";
  title?: string;
  emptyHint?: string;
  className?: string;
  defaultPreviews?: string[];
  onChange?: (items: ImageUploaderValue[]) => void;
  uploadMetadata?: Record<string, string | number | boolean | null | undefined>;
  errorTranslationKey?: string;
  emptyStateTitle?:
    | string
    | ((remainingCount: number, maxCount: number) => string);
  emptyStateSubtitle?:
    | string
    | ((remainingCount: number, maxCount: number) => string);
  uploadButtonLabel?:
    | string
    | ((remainingCount: number, maxCount: number) => string);
  libraryButtonLabel?: string;
  resourceLibraryPlacement?: "drawer" | "studio-panel";
  /**
   * 是否让整个容器区域都支持点击/拖拽上传
   * 默认 false，仅点击“Upload”卡片时触发
   */
  openOnContainerClick?: boolean;
}

interface UploadItem extends ImageUploaderValue {
  file?: File;
  previewError?: boolean;
}

type PreviewModalItem = {
  type: "image" | "video";
  src: string;
  fallbackSrc?: string;
  poster?: string;
};

type WorkbenchMediaType = "image" | "video" | "audio";

type WorkbenchUploadRecord = {
  id: string;
  mediaType: string;
  filename: string;
  url: string;
  mimeType?: string | null;
  fileSize?: number | null;
};

type ResourcePickerTab = "uploads" | "creations";

type WorkbenchCreationRecord = {
  id: string;
  mediaType: string;
  filename: string;
  url: string;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt?: string;
};

type StudioResourcePanelRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const inferPreviewType = (
  previewType: ImageUploaderProps["previewType"],
  mimeType?: string,
) => {
  if (previewType && previewType !== "auto") {
    return previewType;
  }

  if (mimeType?.startsWith("video/")) {
    return "video";
  }

  if (mimeType?.startsWith("audio/")) {
    return "audio";
  }

  return "image";
};

const inferWorkbenchMediaType = ({
  previewType,
  accept,
  uploadUrl,
}: {
  previewType: ImageUploaderProps["previewType"];
  accept?: string;
  uploadUrl?: string;
}): WorkbenchMediaType => {
  if (
    previewType === "video" ||
    previewType === "audio" ||
    previewType === "image"
  ) {
    return previewType;
  }

  if (uploadUrl?.includes("upload-video")) {
    return "video";
  }

  if (uploadUrl?.includes("upload-audio")) {
    return "audio";
  }

  if (accept?.includes("video/")) {
    return "video";
  }

  if (accept?.includes("audio/")) {
    return "audio";
  }

  return "image";
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const buildOssVideoPosterUrl = (input?: string) => {
  const raw = String(input || "").trim();
  if (!raw || raw.startsWith("blob:")) return undefined;
  // 通过 OSS 视频截帧生成 poster；即使走 CDN，只要透传 query 通常也能生效
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}x-oss-process=video/snapshot,t_1000,f_jpg,w_400,h_400,m_fast`;
};

function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return pathname;

  if (/^[a-z]{2}(?:-[A-Za-z]{2,4})?$/.test(segments[0])) {
    return `/${segments.slice(1).join("/")}`;
  }

  return pathname;
}

function inferSceneIdFromPathname(pathname: string) {
  const normalizedPath = stripLocalePrefix(pathname);
  const segments = normalizedPath.split("/").filter(Boolean);
  const firstSegment = segments[0];
  if (!firstSegment) return "";

  const knownSceneIds = new Set([
    "text-to-image",
    "image-to-image",
    "text-to-video",
    "image-to-video",
    "reference-to-video",
    "motion-control",
    "video-face-swap",
    "longcat-avatar",
    "ai-clothes-remover",
  ]);

  return knownSceneIds.has(firstSegment) ? firstSegment : "";
}

function inferModelKeyFromSearchParams(searchParams: URLSearchParams | null) {
  return String(searchParams?.get("model") || "").trim();
}

function humanizeSlug(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const token = raw.split("/").filter(Boolean).pop() || raw;
  return token
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveUploadMetadata(
  uploadMetadata: ImageUploaderProps["uploadMetadata"],
  pathname: string,
  searchParams: URLSearchParams | null,
) {
  const normalizedPath = stripLocalePrefix(pathname || "");
  const sceneId =
    String(uploadMetadata?.sceneId || "").trim() ||
    String(searchParams?.get("scene") || "").trim() ||
    inferSceneIdFromPathname(normalizedPath);
  const modelUrl =
    String(uploadMetadata?.modelUrl || "").trim() ||
    inferModelKeyFromSearchParams(searchParams) ||
    (normalizedPath && normalizedPath !== "/" && normalizedPath !== "/creator"
      ? normalizedPath
      : "");

  return {
    ...uploadMetadata,
    sceneId,
    sceneLabel:
      String(uploadMetadata?.sceneLabel || "").trim() || humanizeSlug(sceneId),
    modelUrl,
    modelLabel:
      String(uploadMetadata?.modelLabel || "").trim() || humanizeSlug(modelUrl),
  };
}

const uploadMediaFile = async (
  file: File,
  uploadUrl: string,
  uploadMetadata?: Record<string, string | number | boolean | null | undefined>,
) => {
  const formData = new FormData();
  formData.append("files", file);
  Object.entries(uploadMetadata || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  });

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const result = await response.json();
  if (result.code !== 0 || !result.data?.urls?.length) {
    throw new Error(result.message || "Upload failed");
  }

  return result.data.urls[0] as string;
};

const createPreviewUrl = async (file: File) => {
  if (file.type.startsWith("image/")) {
    return createOptimizedPreviewUrl(file);
  }

  return URL.createObjectURL(file);
};

const readMediaDuration = (file: File): Promise<number | undefined> => {
  if (file.type.startsWith("audio/")) {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const duration = Number.isFinite(audio.duration)
          ? audio.duration
          : undefined;
        URL.revokeObjectURL(audio.src);
        resolve(duration);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        resolve(undefined);
      };
      audio.src = URL.createObjectURL(file);
    });
  }

  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration)
          ? video.duration
          : undefined;
        URL.revokeObjectURL(video.src);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(undefined);
      };
      video.src = URL.createObjectURL(file);
    });
  }

  return Promise.resolve(undefined);
};

export function ImageUploader({
  allowMultiple = false,
  maxImages = 1,
  maxSizeMB = 10,
  accept = "image/*",
  uploadUrl = "/api/storage/upload-image",
  previewType = "auto",
  title,
  emptyHint,
  className,
  defaultPreviews,
  onChange,
  uploadMetadata,
  errorTranslationKey = "landing.wavespeed.errors",
  emptyStateTitle,
  emptyStateSubtitle,
  resourceLibraryPlacement = "drawer",
  openOnContainerClick = true,
}: ImageUploaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resourceScrollRef = useRef<HTMLDivElement | null>(null);
  const resourceDialogContentRef = useRef<HTMLDivElement | null>(null);
  const uploaderRootRef = useRef<HTMLDivElement | null>(null);
  const uploadsSentinelRef = useRef<HTMLDivElement | null>(null);
  const creationsSentinelRef = useRef<HTMLDivElement | null>(null);
  const isInitializedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const isInternalChangeRef = useRef(false);
  const resourcePanelFrameRef = useRef<number | null>(null);
  const { checkAccess } = useUserAccessCheck({ errorTranslationKey });

  // 使用 defaultPreviews 初始化 items，只在组件挂载时执行一次
  const [items, setItems] = useState<UploadItem[]>(() => {
    if (defaultPreviews?.length) {
      return defaultPreviews.map((url, index) => ({
        id: `preset-${url}-${index}`,
        preview: url,
        url,
        status: "uploaded" as UploadStatus,
      }));
    }
    return [];
  });
  const [previewModalItem, setPreviewModalItem] =
    useState<PreviewModalItem | null>(null);
  const [modalVideoSrc, setModalVideoSrc] = useState<string>("");
  const [isUploadsDialogOpen, setIsUploadsDialogOpen] = useState(false);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [uploadsLoadingMore, setUploadsLoadingMore] = useState(false);
  const [availableUploads, setAvailableUploads] = useState<
    WorkbenchUploadRecord[]
  >([]);
  const [uploadsHasMore, setUploadsHasMore] = useState(false);
  const [activeResourceTab, setActiveResourceTab] =
    useState<ResourcePickerTab>("uploads");
  const [creationsLoading, setCreationsLoading] = useState(false);
  const [creationsLoadingMore, setCreationsLoadingMore] = useState(false);
  const [availableCreations, setAvailableCreations] = useState<
    WorkbenchCreationRecord[]
  >([]);
  const [creationsHasMore, setCreationsHasMore] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [studioResourcePanelRect, setStudioResourcePanelRect] =
    useState<StudioResourcePanelRect | null>(null);

  const maxCount = allowMultiple ? maxImages : 1;
  const maxBytes = maxSizeMB * 1024 * 1024;
  const uploadMediaType = useMemo(
    () => inferWorkbenchMediaType({ previewType, accept, uploadUrl }),
    [accept, previewType, uploadUrl],
  );
  const resolvedUploadMetadata = useMemo(
    () =>
      resolveUploadMetadata(
        uploadMetadata,
        pathname,
        searchParams ? new URLSearchParams(searchParams.toString()) : null,
      ),
    [pathname, searchParams, uploadMetadata],
  );

  // 更新 onChange ref
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewportMode = () => {
      setIsCompactViewport(window.innerWidth < 1024);
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
    };
  }, []);

  const appendUploadsToItems = useCallback(
    (records: WorkbenchUploadRecord[]) => {
      if (!records.length) return;

      setItems((prev) => {
        const toUploadItem = (record: WorkbenchUploadRecord): UploadItem => ({
          id: `workbench-upload-${record.id}`,
          preview: record.url,
          url: record.url,
          status: "uploaded" as UploadStatus,
          size: record.fileSize ?? undefined,
          mimeType: record.mimeType ?? undefined,
        });

        if (!allowMultiple) {
          prev.forEach((item) => revokeObjectUrl(item.preview));
          return [toUploadItem(records[0])];
        }

        const existingUrls = new Set(
          prev.map((item) => item.url).filter(Boolean),
        );
        const availableSlots = Math.max(0, maxCount - prev.length);
        const nextRecords = records
          .filter((record) => record.url && !existingUrls.has(record.url))
          .slice(0, availableSlots);

        if (!nextRecords.length) {
          toast.error("No additional uploads can be added");
          return prev;
        }

        return [...prev, ...nextRecords.map(toUploadItem)];
      });
    },
    [allowMultiple, maxCount],
  );

  const loadWorkbenchUploads = useCallback(
    async ({ offset, append }: { offset: number; append: boolean }) => {
      const params = new URLSearchParams({
        mediaType: uploadMediaType,
        limit: "24",
        offset: String(offset),
      });

      if (append) {
        setUploadsLoadingMore(true);
      } else {
        setUploadsLoading(true);
      }

      try {
        const response = await fetch(
          `/api/workbench/uploads?${params.toString()}`,
        );
        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "Failed to load uploads");
        }

        const nextItems = (result.data?.items || []) as WorkbenchUploadRecord[];
        setAvailableUploads((prev) => {
          if (!append) {
            return nextItems;
          }

          const seen = new Set(prev.map((item) => item.id));
          const merged = [...prev];
          nextItems.forEach((item) => {
            if (!seen.has(item.id)) {
              merged.push(item);
            }
          });
          return merged;
        });
        setUploadsHasMore(Boolean(result.data?.hasMore));
      } catch (error: any) {
        toast.error(error?.message || "Failed to load uploads");
        if (!append) {
          setAvailableUploads([]);
        }
        setUploadsHasMore(false);
      } finally {
        if (append) {
          setUploadsLoadingMore(false);
        } else {
          setUploadsLoading(false);
        }
      }
    },
    [uploadMediaType],
  );

  const loadWorkbenchCreations = useCallback(
    async ({ offset, append }: { offset: number; append: boolean }) => {
      const params = new URLSearchParams({
        mediaType: uploadMediaType,
        limit: "24",
        offset: String(offset),
      });

      if (append) {
        setCreationsLoadingMore(true);
      } else {
        setCreationsLoading(true);
      }

      try {
        const response = await fetch(
          `/api/workbench/creations?${params.toString()}`,
        );
        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "Failed to load creations");
        }

        const nextItems = (result.data?.items ||
          []) as WorkbenchCreationRecord[];
        setAvailableCreations((prev) => {
          if (!append) {
            return nextItems;
          }

          const seen = new Set(prev.map((item) => item.id));
          const merged = [...prev];
          nextItems.forEach((item) => {
            if (!seen.has(item.id)) {
              merged.push(item);
            }
          });
          return merged;
        });
        setCreationsHasMore(Boolean(result.data?.hasMore));
      } catch (error: any) {
        toast.error(error?.message || "Failed to load creations");
        if (!append) {
          setAvailableCreations([]);
        }
        setCreationsHasMore(false);
      } finally {
        if (append) {
          setCreationsLoadingMore(false);
        } else {
          setCreationsLoading(false);
        }
      }
    },
    [uploadMediaType],
  );

  useEffect(() => {
    if (!isUploadsDialogOpen) return;

    void loadWorkbenchUploads({ offset: 0, append: false });
    void loadWorkbenchCreations({ offset: 0, append: false });
  }, [isUploadsDialogOpen, loadWorkbenchCreations, loadWorkbenchUploads]);

  useEffect(() => {
    const root = resourceScrollRef.current;
    const node = uploadsSentinelRef.current;

    if (
      !isUploadsDialogOpen ||
      activeResourceTab !== "uploads" ||
      !root ||
      !node ||
      !uploadsHasMore ||
      uploadsLoading ||
      uploadsLoadingMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            void loadWorkbenchUploads({
              offset: availableUploads.length,
              append: true,
            });
          }
        });
      },
      {
        root,
        rootMargin: "220px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    activeResourceTab,
    availableUploads.length,
    isUploadsDialogOpen,
    loadWorkbenchUploads,
    uploadsHasMore,
    uploadsLoading,
    uploadsLoadingMore,
  ]);

  useEffect(() => {
    const root = resourceScrollRef.current;
    const node = creationsSentinelRef.current;

    if (
      !isUploadsDialogOpen ||
      activeResourceTab !== "creations" ||
      !root ||
      !node ||
      !creationsHasMore ||
      creationsLoading ||
      creationsLoadingMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            void loadWorkbenchCreations({
              offset: availableCreations.length,
              append: true,
            });
          }
        });
      },
      {
        root,
        rootMargin: "220px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    activeResourceTab,
    availableCreations.length,
    creationsHasMore,
    creationsLoading,
    creationsLoadingMore,
    isUploadsDialogOpen,
    loadWorkbenchCreations,
  ]);

  // 同步 defaultPreviews 的变化（只在外部变化时同步，避免循环）
  useEffect(() => {
    // 跳过初始化
    if (!isInitializedRef.current) {
      return;
    }

    // 如果是内部变化触发的，跳过
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    const defaultUrls = defaultPreviews || [];

    // 使用函数式更新来访问最新的 items
    setItems((currentItems) => {
      const currentUrls = currentItems
        .filter((item) => item.status === "uploaded" && item.url)
        .map((item) => item.url as string);

      // 比较当前 items 和 defaultPreviews 是否一致
      const isSame =
        defaultUrls.length === currentUrls.length &&
        defaultUrls.every((url, index) => url === currentUrls[index]);

      // 只有当不一致时才返回新的 items
      if (!isSame) {
        return defaultUrls.map((url, index) => ({
          id: `preset-${url}-${index}`,
          preview: url,
          url,
          status: "uploaded" as UploadStatus,
        }));
      }

      return currentItems;
    });
  }, [defaultPreviews]);

  // 清理 blob URLs
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        revokeObjectUrl(item.preview);
      });
    };
  }, [items]);

  // 当 items 变化时触发 onChange，但跳过初始化时的调用
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    // 标记这是内部变化
    isInternalChangeRef.current = true;

    onChangeRef.current?.(
      items.map(({ id, preview, url, status, size, mimeType, duration }) => ({
        id,
        preview,
        url,
        status,
        size,
        mimeType,
        duration,
      })),
    );
  }, [items]);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      return;
    }

    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }

    const availableSlots = maxCount - items.length;
    if (availableSlots <= 0) {
      toast.error("Maximum number of images reached");
      return;
    }

    const filesToAdd = selectedFiles.slice(0, availableSlots).filter((file) => {
      if (file.size > maxBytes) {
        toast.error(`"${file.name}" exceeds the ${maxSizeMB}MB limit`);
        return false;
      }
      return true;
    });

    if (!filesToAdd.length) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    const newItems = await Promise.all(
      filesToAdd.map(async (file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        preview: await createPreviewUrl(file),
        file,
        size: file.size,
        mimeType: file.type,
        duration: await readMediaDuration(file),
        status: "uploading" as UploadStatus,
      })),
    );

    setItems((prev) => [...prev, ...newItems]);

    // Upload in parallel
    Promise.all(
      newItems.map(async (item) => {
        try {
          const url = await uploadMediaFile(
            item.file as File,
            uploadUrl,
            resolvedUploadMetadata,
          );
          setItems((prev) => {
            const next = prev.map((current) => {
              if (current.id === item.id) {
                const isVideoOrAudio =
                  Boolean(current.mimeType?.startsWith("video/")) ||
                  Boolean(current.mimeType?.startsWith("audio/"));

                // 对 video/audio：优先保留本地 blob 作为预览，避免远端 URL 因 CORS / range / content-type 问题无法直接播放
                // 对 image：替换为远端 URL 并回收 blob，节省内存
                if (!isVideoOrAudio) {
                  revokeObjectUrl(current.preview);
                }

                return {
                  ...current,
                  preview: isVideoOrAudio ? current.preview : url,
                  url,
                  status: "uploaded" as UploadStatus,
                  file: undefined,
                };
              }
              return current;
            });
            return next;
          });
        } catch (error: any) {
          console.error("Upload failed:", error);
          toast.error(
            error?.message
              ? `Upload failed: ${error.message}`
              : "Upload failed",
          );
          setItems((prev) => {
            const next = prev.map((current) =>
              current.id === item.id
                ? { ...current, status: "error" as UploadStatus }
                : current,
            );
            return next;
          });
        }
      }),
    );

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      revokeObjectUrl(removed?.preview);
      return next;
    });
  };

  const openPreviewModal = (item: UploadItem) => {
    const currentPreviewType = inferPreviewType(previewType, item.mimeType);
    if (currentPreviewType === "video") {
      const primarySrc = item.preview;
      const backupSrc =
        item.url && item.url !== item.preview ? item.url : undefined;
      setPreviewModalItem({
        type: "video",
        src: primarySrc,
        fallbackSrc: backupSrc,
        poster: buildOssVideoPosterUrl(item.url || item.preview),
      });
      setModalVideoSrc(primarySrc);
      return;
    }

    if (currentPreviewType === "image") {
      setPreviewModalItem({
        type: "image",
        src: item.preview,
      });
    }
  };

  const openFilePicker = () => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      return;
    }
    inputRef.current?.click();
  };

  const resolveStudioResourcePanelRect = useCallback(() => {
    const root = uploaderRootRef.current;
    const studio = root?.closest("[data-tool-generic-studio]");
    if (!studio) return null;

    const anchoredPanel = studio.querySelector("[data-resource-library-panel]");
    if (anchoredPanel instanceof HTMLElement) {
      const rect = anchoredPanel.getBoundingClientRect();
      return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      };
    }

    const rect = studio.getBoundingClientRect();
    const styles = window.getComputedStyle(studio);
    const columnGap = Number.parseFloat(styles.columnGap || styles.gap || "16");
    const gap = Number.isFinite(columnGap) ? columnGap : 16;
    const width = Math.max(320, (rect.width - gap) / 2);

    return {
      left: rect.left + width + gap + window.scrollX,
      top: rect.top + window.scrollY,
      width,
      height: rect.height,
    };
  }, []);

  const applyStudioResourcePanelRect = useCallback(
    (rect: StudioResourcePanelRect | null) => {
      const element = resourceDialogContentRef.current;
      if (!element || !rect) {
        return;
      }

      element.style.left = `${rect.left}px`;
      element.style.top = `${rect.top}px`;
      element.style.width = `${rect.width}px`;
      element.style.minWidth = `${rect.width}px`;
      element.style.maxWidth = `${rect.width}px`;
      element.style.height = `${rect.height}px`;
      element.style.minHeight = `${rect.height}px`;
      element.style.maxHeight = `${rect.height}px`;
    },
    [],
  );

  const openUploadsDialog = () => {
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      return;
    }
    if (resourceLibraryPlacement === "studio-panel" && !isCompactViewport) {
      const nextRect = resolveStudioResourcePanelRect();
      setStudioResourcePanelRect(nextRect);
      window.requestAnimationFrame(() => {
        applyStudioResourcePanelRect(nextRect);
      });
    }
    setIsUploadsDialogOpen(true);
  };

  const handleUseResourceRecord = (record: WorkbenchUploadRecord) => {
    appendUploadsToItems([record]);
  };

  useEffect(() => {
    if (
      !isUploadsDialogOpen ||
      resourceLibraryPlacement !== "studio-panel" ||
      isCompactViewport
    ) {
      return;
    }

    const applyRect = (syncState: boolean) => {
      const nextRect = resolveStudioResourcePanelRect();
      applyStudioResourcePanelRect(nextRect);

      if (syncState) {
        setStudioResourcePanelRect(nextRect);
      }
    };

    const scheduleUpdateRect = () => {
      if (resourcePanelFrameRef.current !== null) {
        return;
      }

      resourcePanelFrameRef.current = window.requestAnimationFrame(() => {
        resourcePanelFrameRef.current = null;
        applyRect(false);
      });
    };

    applyRect(true);
    window.addEventListener("resize", scheduleUpdateRect);

    return () => {
      if (resourcePanelFrameRef.current !== null) {
        window.cancelAnimationFrame(resourcePanelFrameRef.current);
        resourcePanelFrameRef.current = null;
      }
      window.removeEventListener("resize", scheduleUpdateRect);
    };
  }, [
    isCompactViewport,
    isUploadsDialogOpen,
    resourceLibraryPlacement,
    applyStudioResourcePanelRect,
    resolveStudioResourcePanelRect,
  ]);

  const useStudioPanelLayout =
    resourceLibraryPlacement === "studio-panel" &&
    !isCompactViewport &&
    Boolean(studioResourcePanelRect);

  // 允许整块区域拖拽上传
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!openOnContainerClick) return;
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!openOnContainerClick) return;
    e.preventDefault();
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      return;
    }
    const incoming = Array.from(e.dataTransfer?.files || []);
    if (!incoming.length) return;

    const availableSlots = maxCount - items.length;
    if (availableSlots <= 0) {
      toast.error("Maximum number of images reached");
      return;
    }

    const filesToAdd = incoming.slice(0, availableSlots).filter((file) => {
      if (file.size > maxBytes) {
        toast.error(`"${file.name}" exceeds the ${maxSizeMB}MB limit`);
        return false;
      }
      return true;
    });

    if (!filesToAdd.length) return;

    const newItems = await Promise.all(
      filesToAdd.map(async (file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        preview: await createPreviewUrl(file),
        file,
        size: file.size,
        mimeType: file.type,
        duration: await readMediaDuration(file),
        status: "uploading" as UploadStatus,
      })),
    );
    setItems((prev) => [...prev, ...newItems]);

    // 并行上传
    Promise.all(
      newItems.map(async (item) => {
        try {
          const url = await uploadMediaFile(
            item.file as File,
            uploadUrl,
            resolvedUploadMetadata,
          );
          setItems((prev) =>
            prev.map((current) => {
              if (current.id !== item.id) return current;
              const isVideoOrAudio =
                Boolean(current.mimeType?.startsWith("video/")) ||
                Boolean(current.mimeType?.startsWith("audio/"));
              if (!isVideoOrAudio) {
                revokeObjectUrl(current.preview);
              }
              return {
                ...current,
                preview: isVideoOrAudio ? current.preview : url,
                url,
                status: "uploaded" as UploadStatus,
                file: undefined,
              };
            }),
          );
        } catch (error: any) {
          console.error("Upload failed:", error);
          toast.error(
            error?.message
              ? `Upload failed: ${error.message}`
              : "Upload failed",
          );
          setItems((prev) =>
            prev.map((current) =>
              current.id === item.id
                ? { ...current, status: "error" as UploadStatus }
                : current,
            ),
          );
        }
      }),
    );
  };

  const countLabel = useMemo(
    () => `${items.length}/${maxCount}`,
    [items.length, maxCount],
  );
  const remainingCount = Math.max(maxCount - items.length, 0);
  const resolvedEmptyStateTitle =
    typeof emptyStateTitle === "function"
      ? emptyStateTitle(remainingCount, maxCount)
      : emptyStateTitle || "Add media";
  const resolvedEmptyStateSubtitle =
    typeof emptyStateSubtitle === "function"
      ? emptyStateSubtitle(remainingCount, maxCount)
      : emptyStateSubtitle || `Max ${maxSizeMB}MB`;
  const heroEmptyStateTitle = emptyStateTitle
    ? resolvedEmptyStateTitle
    : "Upload or choose an image";
  const heroEmptyStateSubtitle = emptyStateSubtitle
    ? resolvedEmptyStateSubtitle
    : "Click or drag to upload / choose from History";

  return (
    <div
      ref={uploaderRootRef}
      className={cn(
        "space-y-4",
        className,
        openOnContainerClick && items.length < maxCount
          ? "cursor-pointer"
          : undefined,
      )}
      onClick={(e) => {
        if (!openOnContainerClick) return;
        // 避免点击到已有的预览、按钮等时误触
        const target = e.target as HTMLElement;
        if (target.closest("button,video,img,svg")) return;
        if (items.length >= maxCount) return;
        openFilePicker();
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={allowMultiple}
        onChange={handleSelect}
        className="hidden"
      />

      {title && (
        <div className="text-foreground flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-primary h-4 w-4" />
            <span>{title}</span>
            <span className="text-primary text-xs">({countLabel})</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex flex-wrap gap-4",
          allowMultiple ? "flex-wrap" : "flex-nowrap",
        )}
      >
        {items.length < maxCount ? (
          <div
            className="relative flex min-h-[132px] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[22px] border border-dashed px-6 py-6 text-center transition"
            style={{
              borderColor: "#D7DFEA",
              backgroundColor: "#FCFDFE",
              color: "#23282F",
            }}
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F4F8]"
              style={{
                color: "#23282F",
                backgroundColor: "#F1F4F8",
              }}
            >
              <ImageIcon className="h-6 w-6" strokeWidth={1.8} />
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-[24px] font-light leading-none text-[#23282F]">
                +
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span
                className="text-[15px] font-semibold leading-none"
                style={{ color: "#23282F" }}
              >
                {heroEmptyStateTitle}
              </span>
              <div
                className="text-[13px] font-medium leading-snug"
                style={{ color: "#5E6878" }}
              >
                {emptyStateSubtitle ? (
                  heroEmptyStateSubtitle
                ) : (
                  <>
                    <span>Click or drag to upload / choose from </span>
                    <button
                      type="button"
                      className="underline underline-offset-2"
                      style={{ color: "#23282F" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openUploadsDialog();
                      }}
                    >
                      History
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {items.map((item) =>
          (() => {
            const currentPreviewType = inferPreviewType(
              previewType,
              item.mimeType,
            );
            const previewSizeClass =
              currentPreviewType === "video" ? "h-44 w-44" : "h-32 w-32";

            return (
              <div
                key={item.id}
                className="group border-border bg-muted/50 hover:border-border hover:bg-muted relative overflow-hidden rounded-xl border p-1 shadow-sm transition"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img src={item.preview} alt="Reference" className="hidden" />
                  {currentPreviewType === "image" ? (
                    <img
                      src={item.preview}
                      alt="Reference"
                      className={cn(
                        previewSizeClass,
                        "rounded-lg object-cover",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreviewModal(item);
                      }}
                    />
                  ) : currentPreviewType === "video" ? (
                    item.previewError ? (
                      <div
                        className={cn(
                          previewSizeClass,
                          "relative overflow-hidden rounded-lg bg-black/40",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreviewModal(item);
                        }}
                      >
                        <img
                          src={
                            buildOssVideoPosterUrl(item.url || item.preview) ||
                            ""
                          }
                          alt="Video preview"
                          className={cn(
                            previewSizeClass,
                            "object-cover opacity-80",
                          )}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/90">
                          无法直接预览
                        </div>
                      </div>
                    ) : (
                      <video
                        key={item.preview}
                        src={item.preview}
                        poster={buildOssVideoPosterUrl(
                          item.url || item.preview,
                        )}
                        className={cn(
                          previewSizeClass,
                          "rounded-lg object-cover",
                        )}
                        playsInline
                        controls
                        preload="metadata"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreviewModal(item);
                        }}
                        onError={() => {
                          setItems((prev) =>
                            prev.map((current) =>
                              current.id === item.id
                                ? { ...current, previewError: true }
                                : current,
                            ),
                          );
                        }}
                      />
                    )
                  ) : (
                    <div
                      className={cn(
                        previewSizeClass,
                        "flex flex-col items-center justify-center gap-2 rounded-lg bg-black/30 px-3 text-center",
                      )}
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-[11px] text-white/70">
                        Audio File
                      </span>
                    </div>
                  )}
                  {item.size && (
                    <span className="bg-background text-muted-foreground absolute bottom-2 left-2 rounded-md px-2 py-1 text-[10px] font-medium">
                      {formatBytes(item.size)}
                    </span>
                  )}
                  {item.duration ? (
                    <span className="bg-background text-muted-foreground absolute bottom-2 right-2 rounded-md px-2 py-1 text-[10px] font-medium">
                      {Math.ceil(item.duration)}s
                    </span>
                  ) : null}
                  {item.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-medium text-white">
                      Uploading...
                    </div>
                  )}
                  {item.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 text-xs font-medium text-white">
                      Failed
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })(),
        )}
      </div>

      {!title && (
        <div className="text-muted-foreground text-xs">{emptyHint}</div>
      )}

      <Dialog
        open={Boolean(previewModalItem)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewModalItem(null);
            setModalVideoSrc("");
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="w-[min(92vw,1100px)] max-w-[1100px] border-white/10 bg-black/85 p-3 sm:p-4"
        >
          {previewModalItem?.type === "video" ? (
            <video
              key={modalVideoSrc || previewModalItem.src}
              src={modalVideoSrc || previewModalItem.src}
              poster={previewModalItem.poster}
              className="max-h-[78vh] w-full rounded-lg object-contain"
              controls
              autoPlay
              playsInline
              preload="auto"
              onError={() => {
                if (
                  previewModalItem.fallbackSrc &&
                  modalVideoSrc !== previewModalItem.fallbackSrc
                ) {
                  setModalVideoSrc(previewModalItem.fallbackSrc);
                }
              }}
            />
          ) : previewModalItem?.type === "image" ? (
            <img
              src={previewModalItem.src}
              alt="Preview"
              className="max-h-[78vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        modal={false}
        open={isUploadsDialogOpen}
        onOpenChange={(open) => {
          setIsUploadsDialogOpen(open);
          if (!open) {
            setActiveResourceTab("uploads");
          }
        }}
      >
        <DialogContent
          ref={resourceDialogContentRef}
          hideOverlay
          showCloseButton
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            "flex translate-x-0 translate-y-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#FDFEFF_0%,#F4F9FF_100%)] p-0 text-[#23282F] duration-300",
            useStudioPanelLayout
              ? "absolute left-0 top-0 rounded-[24px] border border-[#D9E7F6] shadow-[0_24px_70px_rgba(35,40,47,0.18)]"
              : isCompactViewport
                ? "left-1/2 top-auto bottom-2 h-[min(85vh,calc(100dvh-1rem))] w-[calc(100vw-1rem)] max-w-none -translate-x-1/2 rounded-[24px] border border-[#D9E7F6] shadow-[0_24px_70px_rgba(35,40,47,0.18)]"
                : "left-auto right-0 top-0 h-screen max-h-screen rounded-none border-l border-[#D9E7F6] border-t-0 border-r-0 border-b-0 shadow-[-24px_0_60px_rgba(109,145,187,0.12)]",
          )}
          style={
            useStudioPanelLayout && studioResourcePanelRect
              ? {
                  left: `${studioResourcePanelRect.left}px`,
                  top: `${studioResourcePanelRect.top}px`,
                  width: `${studioResourcePanelRect.width}px`,
                  minWidth: `${studioResourcePanelRect.width}px`,
                  maxWidth: `${studioResourcePanelRect.width}px`,
                  height: `${studioResourcePanelRect.height}px`,
                  minHeight: `${studioResourcePanelRect.height}px`,
                  maxHeight: `${studioResourcePanelRect.height}px`,
                }
              : isCompactViewport
                ? {
                    width: "calc(100vw - 1rem)",
                    maxWidth: "calc(100vw - 1rem)",
                    height: "min(85vh, calc(100dvh - 1rem))",
                    maxHeight: "min(85vh, calc(100dvh - 1rem))",
                  }
                : {
                    width: "clamp(360px, calc(100vw - 320px), 960px)",
                    minWidth: "min(760px, calc(100vw - 1rem))",
                    maxWidth: "min(960px, calc(100vw - 1rem))",
                    height: "100vh",
                    minHeight: "100vh",
                    maxHeight: "100vh",
                  }
          }
        >
          <div className="border-b border-[#DCE7F4] px-4 py-3 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-2.5 pr-10 sm:gap-3 md:flex-row md:items-center md:justify-between md:gap-5 md:pr-14">
              <div className="min-w-0">
                <h3 className="text-[17px] font-semibold leading-none tracking-[-0.03em] text-[#23282F] md:text-[20px]">
                  Resource Library
                </h3>
                <p className="mt-1 text-[12px] text-[#667085] md:text-[13px]">
                  Choose {uploadMediaType} assets from Uploads or Collections
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[#DCE7F4] px-4 py-2.5 sm:px-5 lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-[#D7E4F1] bg-[#F5F9FF] p-1">
                <button
                  type="button"
                  onClick={() => setActiveResourceTab("uploads")}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition duration-200 md:px-4.5",
                    activeResourceTab === "uploads"
                      ? "bg-white text-[#23282F] shadow-[0_10px_24px_rgba(130,162,198,0.14)]"
                      : "text-[#667085] hover:bg-white hover:text-[#23282F]",
                  )}
                >
                  Uploads
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResourceTab("creations")}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition duration-200 md:px-4.5",
                    activeResourceTab === "creations"
                      ? "bg-white text-[#23282F] shadow-[0_10px_24px_rgba(130,162,198,0.14)]"
                      : "text-[#667085] hover:bg-white hover:text-[#23282F]",
                  )}
                >
                  Creations
                </button>
              </div>
            </div>
          </div>

          <div
            ref={resourceScrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6 lg:py-5"
          >
            {activeResourceTab === "uploads" ? (
              uploadsLoading ? (
                <div className="flex min-h-[240px] items-center justify-center text-[#667085]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading uploads...
                </div>
              ) : availableUploads.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-[#D7E4F1] bg-white/45 text-center text-[#667085]">
                  <ImageIcon className="h-8 w-8 opacity-60" />
                  <p className="text-sm">No matching uploads yet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                    {availableUploads.map((item) => {
                      const isVideo = item.mediaType === "video";
                      const isAudio = item.mediaType === "audio";
                      const poster = isVideo
                        ? buildOssVideoPosterUrl(item.url)
                        : undefined;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleUseResourceRecord(item)}
                          className="group overflow-hidden rounded-[18px] border border-[#DCE7F4] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FAFE_100%)] text-left transition duration-200 [contain-intrinsic-size:240px_300px] [content-visibility:auto] hover:-translate-y-0.5 hover:border-[#BDD8F0] hover:shadow-[0_14px_28px_rgba(109,145,187,0.16)]"
                        >
                          <div className="relative aspect-[4/5] overflow-hidden bg-[#EAF2FB]">
                            {isAudio ? (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_48%),linear-gradient(180deg,#F8FBFF_0%,#EAF2FB_100%)] text-[#667085]">
                                <Music4 className="h-8 w-8" />
                                <span className="text-xs uppercase tracking-[0.2em]">
                                  Audio
                                </span>
                              </div>
                            ) : isVideo ? (
                              <>
                                <video
                                  src={item.url}
                                  poster={poster}
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                  muted
                                  playsInline
                                  preload="none"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-white/10 opacity-0 transition group-hover:opacity-100">
                                  <div className="rounded-full border border-white/70 bg-white/80 p-2 shadow-[0_10px_24px_rgba(109,145,187,0.16)]">
                                    <Play className="h-4 w-4 fill-[#42556F] text-[#42556F]" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <img
                                src={item.url}
                                alt={item.filename}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                              />
                            )}

                            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#F8FBFF]/28 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#EAF2FB]/20 to-transparent" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div ref={uploadsSentinelRef} className="h-8 w-full" />
                </>
              )
            ) : creationsLoading ? (
              <div className="flex min-h-[240px] items-center justify-center text-[#667085]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading creations...
              </div>
            ) : availableCreations.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-[#D7E4F1] bg-white/45 text-center text-[#667085]">
                <ImageIcon className="h-8 w-8 opacity-60" />
                <p className="text-sm">No matching creations yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                  {availableCreations.map((item) => {
                    const isVideo = item.mediaType === "video";
                    const isAudio = item.mediaType === "audio";
                    const poster = isVideo
                      ? buildOssVideoPosterUrl(item.url)
                      : undefined;
                    const resourceRecord: WorkbenchUploadRecord = {
                      id: item.id,
                      mediaType: item.mediaType,
                      filename: item.filename,
                      url: item.url,
                      mimeType: item.mimeType,
                      fileSize: item.fileSize ?? null,
                    };

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleUseResourceRecord(resourceRecord)}
                        className="group overflow-hidden rounded-[18px] border border-[#DCE7F4] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FAFE_100%)] text-left transition duration-200 [contain-intrinsic-size:240px_300px] [content-visibility:auto] hover:-translate-y-0.5 hover:border-[#BDD8F0] hover:shadow-[0_14px_28px_rgba(109,145,187,0.16)]"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-[#EAF2FB]">
                          {isAudio ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_48%),linear-gradient(180deg,#F8FBFF_0%,#EAF2FB_100%)] text-[#667085]">
                              <Music4 className="h-8 w-8" />
                              <span className="text-xs uppercase tracking-[0.2em]">
                                Audio
                              </span>
                            </div>
                          ) : isVideo ? (
                            <>
                              <video
                                src={item.url}
                                poster={poster}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                muted
                                playsInline
                                preload="none"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-white/10 opacity-0 transition group-hover:opacity-100">
                                <div className="rounded-full border border-white/70 bg-white/80 p-2 shadow-[0_10px_24px_rgba(109,145,187,0.16)]">
                                  <Play className="h-4 w-4 fill-[#42556F] text-[#42556F]" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img
                              src={item.url}
                              alt={item.filename}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            />
                          )}

                          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#F8FBFF]/28 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#EAF2FB]/20 to-transparent" />
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div ref={creationsSentinelRef} className="h-8 w-full" />
              </>
            )}

            {activeResourceTab === "uploads" && uploadsLoadingMore ? (
              <div className="mt-5 flex justify-center text-[#667085]">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D7E4F1] bg-white/80 px-3 py-1.5 text-[11px] font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading more
                </div>
              </div>
            ) : null}

            {activeResourceTab === "creations" && creationsLoadingMore ? (
              <div className="mt-5 flex justify-center text-[#667085]">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D7E4F1] bg-white/80 px-3 py-1.5 text-[11px] font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading more
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
