"use client";

import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CopyPlus,
  FileUp,
  Filter,
  FolderOpen,
  Grid2X2,
  History,
  Image as ImageIcon,
  Info,
  Minus,
  Search,
  Video,
  Volume2,
  X,
} from "lucide-react";

import {
  GeneratedMediaPanel,
  type GeneratedMediaItem,
  type MediaPreviewLayout,
} from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import { UploadsMediaGrid } from "@/shared/blocks/desktop-playground/components/uploads-media-grid";
import { WorkbenchCollectionsGrid } from "@/shared/blocks/desktop-playground/components/workbench-collections-grid";
import { WorkbenchTemplateGallery } from "@/shared/blocks/desktop-playground/components/workbench-template-gallery";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { WorkbenchTemplateItem } from "@/shared/lib/workbench-template-catalog";
import { cn } from "@/shared/lib/utils";
import {
  WORKBENCH_PANEL_AMBIENT_CLASS,
  WORKBENCH_PANEL_SURFACE_CLASS,
  WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
} from "@/shared/lib/workbench-panel-shared";
import { usePathname } from "@/core/i18n/navigation";
import { useAppContext } from "@/shared/contexts/app";

type PanelTab = "templates" | "creations" | "collections";
type AssetCategoryFilter = "all" | "photo" | "video" | "effect" | "voice";

type GeneratedPanelProps = ComponentProps<typeof GeneratedMediaPanel>;
type CreationView = "creations" | "uploads";
type FilterOption = {
  value: string;
  label: string;
  category?: AssetCategoryFilter;
};
type DateRangeValue = {
  start: string | null;
  end: string | null;
};
type UploadRecord = {
  id: string;
  mediaType: string;
  sceneId?: string | null;
  sceneLabel?: string | null;
  modelUrl?: string | null;
  modelLabel?: string | null;
  filename: string;
  url: string;
  mimeType?: string | null;
  createdAt: string;
};
type CollectionRecord = {
  id: string;
  name: string;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
};
type CreationRecord = {
  id: string;
  mediaType: string;
  sceneId?: string | null;
  sceneLabel?: string | null;
  modelUrl?: string | null;
  modelLabel?: string | null;
  filename: string;
  url: string;
  mimeType?: string | null;
  prompt?: string | null;
  params?: string | null;
  aspectRatio?: string | null;
  createdAt: string;
};
type CollectionDetailItem = {
  id: string;
  mediaType: string;
  sceneId?: string | null;
  sceneLabel?: string | null;
  modelUrl?: string | null;
  modelLabel?: string | null;
  filename: string;
  url: string;
  mimeType?: string | null;
  prompt?: string | null;
  params?: string | null;
  aspectRatio?: string | null;
  createdAt: string;
};
type AssetFilterSourceItem = {
  mediaType: string;
  sceneId?: string | null;
  modelUrl?: string | null;
  prompt?: string | null;
  filename?: string | null;
  createdAt?: string | null;
};
type FloatingPosition = {
  top: number;
  left: number;
};

function getCreationSelectionKey(item: GeneratedMediaItem) {
  const sourceIndex = item.params?.__sourceGeneratedIndex;
  if (typeof sourceIndex === "number") {
    return `session:${sourceIndex}`;
  }

  const creationRecordId = item.params?.creationRecordId;
  if (typeof creationRecordId === "string" && creationRecordId.trim()) {
    return `creation:${creationRecordId}`;
  }

  return `url:${item.url}`;
}

function parseCreationParams(params?: string | null) {
  if (!params) return {};

  try {
    const parsed = JSON.parse(params);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getAssetCategory(input: {
  mediaType?: string | null;
  sceneId?: string | null;
}): Exclude<AssetCategoryFilter, "all"> {
  const mediaType = `${input.mediaType || ""}`.toLowerCase();
  const sceneId = `${input.sceneId || ""}`.toLowerCase();

  if (
    sceneId.startsWith("image-effect-") ||
    sceneId.startsWith("video-effect-")
  ) {
    return "effect";
  }

  if (["audio", "voice", "speech", "music"].includes(mediaType)) {
    return "voice";
  }

  if (mediaType === "video") {
    return "video";
  }

  return "photo";
}

function getMediaTypeParamForCategory(category: AssetCategoryFilter) {
  if (category === "photo") return "image";
  if (category === "video") return "video";
  if (category === "voice") return "audio";
  return null;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(a: Date | null, b: Date | null) {
  return Boolean(a && b && toDateKey(a) === toDateKey(b));
}

function formatMonthLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateRangeLabel(range: DateRangeValue, emptyLabel: string) {
  if (!range.start || !range.end) return emptyLabel;
  return `${range.start} → ${range.end}`;
}

function buildCalendarWeeks(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
      return date;
    }),
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isDateWithinRange(date: Date, minDate: Date, maxDate: Date) {
  const current = startOfDay(date).getTime();
  return (
    current >= startOfDay(minDate).getTime() &&
    current <= startOfDay(maxDate).getTime()
  );
}

function monthHasSelectableDate(month: Date, minDate: Date, maxDate: Date) {
  const firstDay = startOfDay(
    new Date(month.getFullYear(), month.getMonth(), 1),
  );
  const lastDay = startOfDay(
    new Date(month.getFullYear(), month.getMonth() + 1, 0),
  );

  return (
    firstDay.getTime() <= startOfDay(maxDate).getTime() &&
    lastDay.getTime() >= startOfDay(minDate).getTime()
  );
}

function resolveItemDate(item: GeneratedMediaItem) {
  const candidate =
    item.createdAt ||
    item.params?.createdAt ||
    item.params?.generatedAt ||
    item.params?.timestamp ||
    null;

  if (candidate === null || candidate === undefined) return null;

  if (typeof candidate === "number") {
    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(String(candidate));
  return Number.isNaN(date.getTime()) ? null : date;
}

function FilteredResultsEmptyState({
  title,
  description,
  actionLabel,
  onClear,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClear: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center px-6 py-10">
      <div className="flex max-w-[18rem] flex-col items-center text-center">
        <div className="relative flex size-[88px] items-center justify-center rounded-[28px] border border-[rgba(214,235,253,0.19)] bg-[linear-gradient(180deg,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.02)_100%)] shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px,inset_0_1px_0_rgba(255,255,255,0.06),0_20px_48px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-[10px] rounded-[20px] bg-white/[0.03]" />
          <Search
            className="relative size-8 text-[#F0F0F0]"
            strokeWidth={1.8}
          />
          <div className="absolute bottom-3 right-3 flex size-5 items-center justify-center rounded-full border border-[rgba(214,235,253,0.19)] bg-[#0A0A0A]">
            <X className="size-3 text-[#A1A4A5]" strokeWidth={2.2} />
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <p className="text-[14px] font-medium leading-[1.35] tracking-[0.01em] text-[#F0F0F0]">
            {title}
          </p>
          <p className="text-[12px] leading-[1.5] text-[#A1A4A5]">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex min-h-[36px] cursor-pointer items-center justify-center rounded-full border border-[rgba(214,235,253,0.19)] bg-white/[0.03] px-4 text-[12px] font-medium tracking-[0.01em] text-[#F0F0F0] transition-colors hover:bg-white/[0.08]"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function WorkbenchDetailPanelLoading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.035),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.025),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_24%,transparent_76%,rgba(255,255,255,0.01))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#A1A4A5]">
              {title}
            </div>
            <p className="mt-2 text-sm text-white/48">{subtitle}</p>
          </div>
          <div className="h-9 w-28 animate-pulse rounded-full border border-[rgba(214,235,253,0.12)] bg-white/[0.05]" />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.72fr)]">
          <div className="relative overflow-hidden rounded-[1.85rem] border border-[rgba(214,235,253,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-4">
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_46%)]" />
            <div className="relative z-10 flex h-full min-h-[18rem] flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-32 animate-pulse rounded-full bg-white/[0.08]" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-white/[0.06]" />
              </div>
              <div className="flex-1 rounded-[1.4rem] border border-[rgba(214,235,253,0.1)] bg-[#0B0D11]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" />
              <div className="mt-4 flex gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-8 w-20 animate-pulse rounded-full border border-[rgba(214,235,253,0.1)] bg-white/[0.05]"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-[18rem] flex-col gap-4">
            <div className="rounded-[1.6rem] border border-[rgba(214,235,253,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.018)_100%)] p-4">
              <div className="mb-3 h-4 w-24 animate-pulse rounded-full bg-white/[0.08]" />
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-11 animate-pulse rounded-[1rem] border border-[rgba(214,235,253,0.1)] bg-white/[0.04]"
                  />
                ))}
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[1.35rem] border border-[rgba(214,235,253,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-3"
                >
                  <div className="mb-3 aspect-[1.05] animate-pulse rounded-[1rem] bg-white/[0.05]" />
                  <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/[0.08]" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-white/[0.05]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetGridLoading({
  title: _title,
  subtitle: _subtitle,
  cards = 8,
}: {
  title: string;
  subtitle: string;
  cards?: number;
}) {
  const skeletonCardVariants = [
    {
      aspectRatio: "1 / 1",
      basis: "min(calc(50% - 0.5rem), 16rem)",
      maxWidth: "min(calc(50% - 0.5rem), 16rem)",
      minHeight: 248,
    },
    {
      aspectRatio: "4 / 5",
      basis: "min(calc(50% - 0.5rem), 16rem)",
      maxWidth: "min(calc(50% - 0.5rem), 16rem)",
      minHeight: 320,
    },
    {
      aspectRatio: "4 / 5",
      basis: "min(calc(50% - 0.5rem), 16rem)",
      maxWidth: "min(calc(50% - 0.5rem), 16rem)",
      minHeight: 312,
    },
    {
      aspectRatio: "3 / 4",
      basis: "min(calc(50% - 0.5rem), 16rem)",
      maxWidth: "min(calc(50% - 0.5rem), 16rem)",
      minHeight: 300,
    },
  ] as const;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-3 md:px-4 md:py-4">
        <div className="flex flex-wrap items-start gap-3 md:gap-4">
          {Array.from({ length: cards }).map((_, index) =>
            (() => {
              const variant =
                skeletonCardVariants[index % skeletonCardVariants.length];
              return (
                <div
                  key={index}
                  className="w-full shrink-0"
                  style={{
                    flexBasis: variant.basis,
                    maxWidth: variant.maxWidth,
                  }}
                >
                  <div className="relative overflow-hidden rounded-[1.2rem] bg-[#090b0f] shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
                    <div className="relative p-2.5">
                      <div
                        className="relative overflow-hidden rounded-[0.25rem] bg-[#0d1014]"
                        style={{
                          aspectRatio: variant.aspectRatio,
                          minHeight: variant.minHeight,
                        }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_36%,rgba(255,255,255,0.01)_64%,rgba(255,255,255,0.04))]" />
                        <Skeleton className="absolute inset-0 h-full w-full rounded-[0.25rem] bg-white/[0.045]" />

                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          <div className="rounded-[1rem] border border-white/35 bg-[linear-gradient(180deg,rgba(96,96,96,0.44)_0%,rgba(32,32,32,0.68)_100%)] p-[1px] shadow-[0_8px_16px_rgba(0,0,0,0.24)]">
                            <Skeleton className="h-10 w-10 rounded-[0.9rem] bg-white/[0.08]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })(),
          )}
        </div>
      </div>
    </div>
  );
}

function UploadsGridLoading({
  title,
  subtitle,
  cards = 8,
}: {
  title: string;
  subtitle: string;
  cards?: number;
}) {
  const normalizedSubtitle = subtitle.trim();
  const shouldShowSubtitle =
    normalizedSubtitle.length > 0 && !normalizedSubtitle.includes(".");

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
        <div className="mb-5">
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#A1A4A5]">
            {title}
          </div>
          {shouldShowSubtitle ? (
            <p className="mt-2 text-sm text-white/48">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start gap-4">
          {Array.from({ length: cards }).map((_, index) => (
            <div
              key={index}
              className="w-full shrink-0"
              style={{
                flexBasis: `${index % 4 === 2 ? 17.5 : 15.5}rem`,
                maxWidth: `${index % 4 === 2 ? 17.5 : 15.5}rem`,
              }}
            >
              <div className="overflow-hidden rounded-[0.75rem] bg-[#0b0c0f]">
                <Skeleton
                  className="w-full rounded-[0.75rem] bg-white/[0.06]"
                  style={{
                    aspectRatio: index % 4 === 2 ? "16 / 10" : "1 / 1",
                    minHeight: 260,
                  }}
                />
                <div className="pointer-events-none -mt-16 px-3 pb-3">
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex min-w-0 items-center overflow-hidden rounded-full border border-white/8 bg-black/40 pr-2">
                      <Skeleton className="m-1 h-6 w-6 rounded-full bg-white/[0.08]" />
                      <Skeleton className="h-3 w-24 rounded-full bg-white/[0.08]" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-[0.8rem] bg-white/[0.08]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkbenchMediaPanel({
  generatedPanelProps,
  templateItems,
  onUseTemplate,
  filterTools,
  filterModelsByTool,
  defaultTab = "templates",
  isSignedIn = false,
  visibleTabs = ["templates", "creations", "collections"],
  embeddedShell = false,
  hideInternalHeader = false,
  defaultCreationView = "creations",
}: {
  generatedPanelProps: GeneratedPanelProps;
  templateItems: WorkbenchTemplateItem[];
  onUseTemplate?: (item: WorkbenchTemplateItem) => void;
  filterTools?: FilterOption[];
  filterModelsByTool?: Record<string, FilterOption[]>;
  defaultTab?: PanelTab;
  isSignedIn?: boolean;
  visibleTabs?: PanelTab[];
  embeddedShell?: boolean;
  hideInternalHeader?: boolean;
  defaultCreationView?: CreationView;
}) {
  const t = useTranslations("landing.wavespeed.desktopPlayground.mediaPanel");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<PanelTab>(
    visibleTabs.includes(defaultTab)
      ? defaultTab
      : visibleTabs[0] || "creations",
  );
  const [activeCreationView, setActiveCreationView] =
    useState<CreationView>(defaultCreationView);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState<DateRangeValue>({
    start: null,
    end: null,
  });
  const [appliedDateRange, setAppliedDateRange] = useState<DateRangeValue>({
    start: null,
    end: null,
  });
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] =
    useState<AssetCategoryFilter>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [cardScale, setCardScale] = useState(50);
  const [previewLayout, setPreviewLayout] =
    useState<MediaPreviewLayout>("original");
  const [showMetadataOverlay, setShowMetadataOverlay] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerPosition, setDatePickerPosition] =
    useState<FloatingPosition | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfDay(new Date()),
  );
  const [uploadItems, setUploadItems] = useState<UploadRecord[]>([]);
  const [creationItems, setCreationItems] = useState<CreationRecord[]>([]);
  const [creationsLoading, setCreationsLoading] = useState(false);
  const [creationsLoadingMore, setCreationsLoadingMore] = useState(false);
  const [creationsHasMore, setCreationsHasMore] = useState(false);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [uploadsLoadingMore, setUploadsLoadingMore] = useState(false);
  const [uploadsHasMore, setUploadsHasMore] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionItems, setCollectionItems] = useState<CollectionRecord[]>(
    [],
  );
  const [activeCollection, setActiveCollection] =
    useState<CollectionRecord | null>(null);
  const [activeCollectionItems, setActiveCollectionItems] = useState<
    CollectionDetailItem[]
  >([]);
  const [creationSelectedKeys, setCreationSelectedKeys] = useState<string[]>(
    [],
  );
  const [activeCollectionSelectedIndices, setActiveCollectionSelectedIndices] =
    useState<number[]>([]);
  const [activeCollectionLoading, setActiveCollectionLoading] = useState(false);
  const [activeCollectionLoadingMore, setActiveCollectionLoadingMore] =
    useState(false);
  const [activeCollectionHasMore, setActiveCollectionHasMore] = useState(false);
  const [templateScrollRoot, setTemplateScrollRoot] =
    useState<HTMLDivElement | null>(null);
  const dateTriggerRef = useRef<HTMLButtonElement | null>(null);
  const keywordInputRef = useRef<HTMLInputElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setIsShowSignModal } = useAppContext();
  const generatedItems = generatedPanelProps.items as GeneratedMediaItem[];
  const sceneMetaById = generatedPanelProps.sceneMetaById ?? {};
  const modelMetaByUrl = generatedPanelProps.modelMetaByUrl ?? {};
  const allLabel = t("common.all");
  const weekdayLabels = [
    t("weekdays.su"),
    t("weekdays.mo"),
    t("weekdays.tu"),
    t("weekdays.we"),
    t("weekdays.th"),
    t("weekdays.fr"),
    t("weekdays.sa"),
  ];

  const signInCallbackUrl = useMemo(() => {
    const query = searchParams?.toString();
    if (!pathname) {
      return query ? `/?${query}` : "/";
    }

    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const handleRequireSignIn = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("signin_callback_url", signInCallbackUrl);
    }
    setIsShowSignModal(true);
  }, [setIsShowSignModal, signInCallbackUrl]);

  const handleUseTemplate = useCallback(
    (item: WorkbenchTemplateItem) => {
      if (!isSignedIn) {
        handleRequireSignIn();
        return;
      }

      onUseTemplate?.(item);
    },
    [handleRequireSignIn, isSignedIn, onUseTemplate],
  );

  useEffect(() => {
    if (generatedItems.length > 0 || generatedPanelProps.isGenerating) {
      setActiveTab("creations");
      setActiveCreationView("creations");
    }
  }, [generatedItems.length, generatedPanelProps.isGenerating]);

  const assetFilterSourceItems = useMemo<AssetFilterSourceItem[]>(() => {
    if (activeTab === "collections" && activeCollection) {
      return activeCollectionItems.map((item) => ({
        mediaType: item.mediaType,
        sceneId: item.sceneId,
        modelUrl: item.modelUrl,
        prompt: item.prompt,
        filename: item.filename,
        createdAt: item.createdAt,
      }));
    }

    if (activeTab === "creations" && activeCreationView === "uploads") {
      return uploadItems.map((item) => ({
        mediaType: item.mediaType,
        sceneId: item.sceneId,
        modelUrl: item.modelUrl,
        prompt: item.filename,
        filename: item.filename,
        createdAt: item.createdAt,
      }));
    }

    return creationItems.map((item) => ({
      mediaType: item.mediaType,
      sceneId: item.sceneId,
      modelUrl: item.modelUrl,
      prompt: item.prompt || item.filename,
      filename: item.filename,
      createdAt: item.createdAt,
    }));
  }, [
    activeCollection,
    activeCollectionItems,
    activeCreationView,
    activeTab,
    creationItems,
    uploadItems,
  ]);

  const toolOptions = useMemo(() => {
    const categorySceneIdSet = new Set(
      assetFilterSourceItems
        .filter(
          (item) =>
            categoryFilter !== "all" &&
            getAssetCategory({
              mediaType: item.mediaType,
              sceneId: item.sceneId,
            }) === categoryFilter,
        )
        .map((item) => item.sceneId)
        .filter((sceneId): sceneId is string => Boolean(sceneId)),
    );
    const categorySceneIds =
      categoryFilter === "all" || categorySceneIdSet.size === 0
        ? null
        : categorySceneIdSet;

    if (filterTools?.length) {
      const hasCategorizedTools = filterTools.some((option) =>
        Boolean(option.category),
      );
      const scopedTools = categorySceneIds
        ? filterTools.filter((option) => categorySceneIds.has(option.value))
        : filterTools;
      const categoryScopedTools =
        categoryFilter === "all"
          ? scopedTools
          : scopedTools.filter(
              (option) =>
                option.category === categoryFilter ||
                (!hasCategorizedTools && !option.category),
            );
      return [{ value: "all", label: allLabel }, ...categoryScopedTools];
    }

    const seen = new Set<string>();

    const options = assetFilterSourceItems
      .filter(
        (item) =>
          categoryFilter === "all" ||
          getAssetCategory({
            mediaType: item.mediaType,
            sceneId: item.sceneId,
          }) === categoryFilter,
      )
      .map((item) => item.sceneId)
      .filter((sceneId): sceneId is string => Boolean(sceneId))
      .filter((sceneId) => {
        if (seen.has(sceneId)) return false;
        seen.add(sceneId);
        return true;
      })
      .map((sceneId) => ({
        value: sceneId,
        label: sceneMetaById[sceneId]?.label || sceneId,
      }));

    return [{ value: "all", label: allLabel }, ...options];
  }, [
    allLabel,
    assetFilterSourceItems,
    categoryFilter,
    filterTools,
    sceneMetaById,
  ]);

  const modelOptions = useMemo(() => {
    if (filterModelsByTool) {
      if (toolFilter !== "all" && filterModelsByTool[toolFilter]?.length) {
        return [
          { value: "all", label: allLabel },
          ...filterModelsByTool[toolFilter],
        ];
      }

      if (toolFilter === "all") {
        const merged = Object.values(filterModelsByTool).flat();
        const seen = new Set<string>();
        return [
          { value: "all", label: allLabel },

          ...merged.filter((option) => {
            if (seen.has(option.value)) return false;
            seen.add(option.value);
            return true;
          }),
        ];
      }
    }

    const seen = new Set<string>();

    const options = assetFilterSourceItems
      .filter((item) => toolFilter === "all" || item.sceneId === toolFilter)
      .map((item) => item.modelUrl)
      .filter((modelUrl): modelUrl is string => Boolean(modelUrl))
      .filter((modelUrl) => {
        if (seen.has(modelUrl)) return false;
        seen.add(modelUrl);
        return true;
      })
      .map((modelUrl) => ({
        value: modelUrl,
        label: modelMetaByUrl[modelUrl]?.label || modelUrl,
      }));

    return [{ value: "all", label: allLabel }, ...options];
  }, [
    allLabel,
    assetFilterSourceItems,
    filterModelsByTool,
    modelMetaByUrl,
    toolFilter,
  ]);

  useEffect(() => {
    if (toolFilter === "all") return;
    const hasTool = toolOptions.some((option) => option.value === toolFilter);
    if (!hasTool) {
      setToolFilter("all");
      setModelFilter("all");
    }
  }, [toolFilter, toolOptions]);

  useEffect(() => {
    if (modelFilter === "all") return;
    const hasModel = modelOptions.some(
      (option) => option.value === modelFilter,
    );
    if (!hasModel) {
      setModelFilter("all");
    }
  }, [modelFilter, modelOptions]);

  const hasActiveFilters = Boolean(
    (appliedDateRange.start && appliedDateRange.end) ||
    toolFilter !== "all" ||
    modelFilter !== "all" ||
    categoryFilter !== "all" ||
    searchKeyword.trim(),
  );

  const creationGeneratedItems = useMemo<GeneratedMediaItem[]>(
    () =>
      creationItems.map((item) => {
        const parsedParams = parseCreationParams(item.params);
        return {
          url: item.url,
          params: {
            ...parsedParams,
            creationRecordId: item.id,
            filename: item.filename,
          },
          aspectRatio:
            item.aspectRatio ||
            String(parsedParams.aspectRatio || parsedParams.size || "1:1"),
          mediaKind:
            item.mediaType === "video"
              ? "video"
              : item.mediaType === "audio"
                ? "audio"
                : "image",
          createdAt: item.createdAt,
          sceneId: item.sceneId || undefined,
          modelUrl: item.modelUrl || undefined,
          prompt: item.prompt || item.filename,
        };
      }),
    [creationItems],
  );

  const sessionCreationGeneratedItems = useMemo<GeneratedMediaItem[]>(() => {
    const persistedUrls = new Set(creationItems.map((item) => item.url));

    return generatedItems
      .map((item, index) => ({
        item,
        index,
      }))
      .filter(({ item }) => !item.params?.creationRecordId)
      .filter(({ item }) => !persistedUrls.has(item.url))
      .filter(({ item }) => {
        const matchesTool = toolFilter === "all" || item.sceneId === toolFilter;
        const matchesModel =
          modelFilter === "all" || item.modelUrl === modelFilter;
        const matchesType =
          categoryFilter === "all" ||
          getAssetCategory({
            mediaType: item.mediaKind,
            sceneId: item.sceneId,
          }) === categoryFilter;
        const keyword = searchKeyword.trim().toLowerCase();
        const haystack = [
          item.prompt,
          item.sceneId,
          item.modelUrl,
          item.params?.filename,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesKeyword = !keyword || haystack.includes(keyword);

        const matchesDate =
          !appliedDateRange.start ||
          !appliedDateRange.end ||
          (() => {
            const createdAt = resolveItemDate(item);
            if (!createdAt) return false;
            const start = startOfDay(
              fromDateKey(appliedDateRange.start) ?? new Date(),
            );
            const end = endOfDay(
              fromDateKey(appliedDateRange.end) ?? new Date(),
            );
            return (
              createdAt.getTime() >= start.getTime() &&
              createdAt.getTime() <= end.getTime()
            );
          })();

        return (
          matchesTool &&
          matchesModel &&
          matchesType &&
          matchesKeyword &&
          matchesDate
        );
      })
      .map(({ item, index }) => ({
        ...item,
        params: {
          ...item.params,
          __sessionGenerated: true,
          __sourceGeneratedIndex: index,
        },
      }));
  }, [
    appliedDateRange.end,
    appliedDateRange.start,
    creationItems,
    generatedItems,
    categoryFilter,
    modelFilter,
    searchKeyword,
    toolFilter,
  ]);

  const visibleCreationItems = useMemo(
    () => [...sessionCreationGeneratedItems, ...creationGeneratedItems],
    [creationGeneratedItems, sessionCreationGeneratedItems],
  );

  const creationSourceIndexById = useMemo(() => {
    const map = new Map<string, number>();
    generatedItems.forEach((item, index) => {
      const creationId = item.params?.creationRecordId;
      if (creationId) {
        map.set(creationId, index);
      }
    });
    return map;
  }, [generatedItems]);

  const creationSelectedIndices = useMemo(() => {
    const selected = new Set(creationSelectedKeys);

    return visibleCreationItems.reduce<number[]>((acc, item, index) => {
      if (selected.has(getCreationSelectionKey(item))) {
        acc.push(index);
      }
      return acc;
    }, []);
  }, [creationSelectedKeys, visibleCreationItems]);

  const creationPanelProps: GeneratedPanelProps = {
    ...generatedPanelProps,
    items: visibleCreationItems,
    isGenerating: Boolean(generatedPanelProps.isGenerating) || creationsLoading,
    pendingItemCount: generatedPanelProps.pendingItemCount,
    isLoadingMore: creationsLoadingMore,
    hasMore: creationsHasMore,
    cardScale,
    previewLayout,
    showMetadata: showMetadataOverlay,
    selectedIndices: creationSelectedIndices,
    onToggleSelectItem: (index) => {
      const item = visibleCreationItems[index];
      if (!item) return;

      const key = getCreationSelectionKey(item);
      setCreationSelectedKeys((prev) =>
        prev.includes(key)
          ? prev.filter((itemKey) => itemKey !== key)
          : [...prev, key],
      );
    },
    onClearSelection: () => {
      setCreationSelectedKeys([]);
    },
    onUseItem: generatedPanelProps.onUseItem
      ? (index, params) => {
          const sourceIndex = params?.__sourceGeneratedIndex;
          if (typeof sourceIndex === "number") {
            generatedPanelProps.onUseItem?.(sourceIndex, params);
            return;
          }
          const creationId = params?.creationRecordId;
          if (!creationId) {
            generatedPanelProps.onUseItem?.(index, params);
            return;
          }
          const originalIndex = creationSourceIndexById.get(creationId);
          if (originalIndex === undefined) {
            generatedPanelProps.onUseItem?.(index, params);
            return;
          }
          generatedPanelProps.onUseItem?.(originalIndex, params);
        }
      : undefined,
    onUpscaleItem: generatedPanelProps.onUpscaleItem
      ? (index, params) => {
          const sourceIndex = params?.__sourceGeneratedIndex;
          if (typeof sourceIndex === "number") {
            generatedPanelProps.onUpscaleItem?.(sourceIndex, params);
            return;
          }
          const creationId = params?.creationRecordId;
          if (!creationId) return;
          const originalIndex = creationSourceIndexById.get(creationId);
          if (originalIndex === undefined) return;
          generatedPanelProps.onUpscaleItem?.(originalIndex, params);
        }
      : undefined,
    onDeleteItem: (index) => {
      if (!isSignedIn) return;
      const item = visibleCreationItems[index];
      const sourceIndex = item?.params?.__sourceGeneratedIndex;
      if (typeof sourceIndex === "number") {
        generatedPanelProps.onDeleteItem?.(sourceIndex);
        return;
      }
      const creationId = item?.params?.creationRecordId;
      if (!creationId) return;
      void fetch(`/api/workbench/creations/${creationId}`, {
        method: "DELETE",
      }).finally(() => {
        setCreationItems((prev) =>
          prev.filter((entry) => entry.id !== creationId),
        );
      });
    },
    onDeleteItems: (indices) => {
      if (!isSignedIn) return;
      const sessionIndices = indices
        .map(
          (index) =>
            visibleCreationItems[index]?.params?.__sourceGeneratedIndex,
        )
        .filter((value): value is number => typeof value === "number");
      if (sessionIndices.length > 0) {
        generatedPanelProps.onDeleteItems?.(sessionIndices);
      }

      const ids = indices
        .map((index) => visibleCreationItems[index]?.params?.creationRecordId)
        .filter((value): value is string => Boolean(value));
      if (ids.length === 0) return;
      void Promise.all(
        ids.map((id) =>
          fetch(`/api/workbench/creations/${id}`, {
            method: "DELETE",
          }),
        ),
      ).finally(() => {
        setCreationItems((prev) =>
          prev.filter((entry) => !ids.includes(entry.id)),
        );
      });
    },
  };

  useEffect(() => {
    setCreationSelectedKeys((prev) => {
      if (prev.length === 0) return prev;

      const availableKeys = new Set(
        visibleCreationItems.map((item) => getCreationSelectionKey(item)),
      );
      const next = prev.filter((key) => availableKeys.has(key));

      return next.length === prev.length ? prev : next;
    });
  }, [visibleCreationItems]);

  const filteredActiveCollectionItems = useMemo(() => {
    return activeCollectionItems.filter((item) => {
      const matchesTool = toolFilter === "all" || item.sceneId === toolFilter;
      const matchesModel =
        modelFilter === "all" || item.modelUrl === modelFilter;
      const matchesType =
        categoryFilter === "all" ||
        getAssetCategory({
          mediaType: item.mediaType,
          sceneId: item.sceneId,
        }) === categoryFilter;
      const keyword = searchKeyword.trim().toLowerCase();
      const haystack = [
        item.prompt,
        item.filename,
        item.sceneLabel,
        item.modelLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword);

      const matchesDate =
        !appliedDateRange.start ||
        !appliedDateRange.end ||
        (() => {
          const createdAt = resolveItemDate({
            url: item.url,
            params: {},
            aspectRatio: item.aspectRatio || "1:1",
            mediaKind:
              item.mediaType === "video"
                ? "video"
                : item.mediaType === "audio"
                  ? "audio"
                  : "image",
            createdAt: item.createdAt,
          });
          if (!createdAt) return false;
          const start = startOfDay(
            fromDateKey(appliedDateRange.start) ?? new Date(),
          );
          const end = endOfDay(fromDateKey(appliedDateRange.end) ?? new Date());
          return (
            createdAt.getTime() >= start.getTime() &&
            createdAt.getTime() <= end.getTime()
          );
        })();

      return (
        matchesTool &&
        matchesModel &&
        matchesType &&
        matchesKeyword &&
        matchesDate
      );
    });
  }, [
    activeCollectionItems,
    appliedDateRange.end,
    appliedDateRange.start,
    categoryFilter,
    modelFilter,
    searchKeyword,
    toolFilter,
  ]);

  const activeCollectionGeneratedItems = useMemo<GeneratedMediaItem[]>(
    () =>
      filteredActiveCollectionItems.map((item) => {
        const parsedParams = parseCreationParams(item.params);
        return {
          url: item.url,
          params: {
            ...parsedParams,
            creationRecordId: item.id,
            filename: item.filename,
          },
          aspectRatio:
            item.aspectRatio ||
            String(parsedParams.aspectRatio || parsedParams.size || "1:1"),
          mediaKind:
            item.mediaType === "video"
              ? "video"
              : item.mediaType === "audio"
                ? "audio"
                : "image",
          createdAt: item.createdAt,
          sceneId: item.sceneId || undefined,
          modelUrl: item.modelUrl || undefined,
          prompt: item.prompt || item.filename,
        };
      }),
    [filteredActiveCollectionItems],
  );

  const activeCollectionPanelProps: GeneratedPanelProps = {
    ...generatedPanelProps,
    items: activeCollectionGeneratedItems,
    isGenerating: activeCollectionLoading,
    isLoadingMore: activeCollectionLoadingMore,
    hasMore: activeCollectionHasMore,
    embedded: true,
    cardScale,
    previewLayout,
    showMetadata: showMetadataOverlay,
    selectedIndices: activeCollectionSelectedIndices,
    onToggleSelectItem: (index) => {
      setActiveCollectionSelectedIndices((prev) =>
        prev.includes(index)
          ? prev.filter((item) => item !== index)
          : [...prev, index].sort((a, b) => a - b),
      );
    },
    onClearSelection: () => {
      setActiveCollectionSelectedIndices([]);
    },
    onDeleteItem: undefined,
    onDeleteItems: undefined,
    emptyStateTitle: activeCollection?.name || t("collections.heading"),
    emptyStateDescription: t("collections.emptyDescription"),
    emptyStateChips: [],
    emptyStatePreviewItems: [],
    hideDeleteAction: true,
    selectionActions: activeCollection
      ? [
          {
            key: "remove-from-collection",
            label: t("collectionActions.remove"),
            icon: <Minus className="h-3.5 w-3.5 shrink-0" />,
            variant: "danger",
            disabled:
              activeCollectionSelectedIndices.length === 0 ||
              activeCollectionLoading,
            onClick: async () => {
              if (!isSignedIn) return;
              const selectedIds = activeCollectionSelectedIndices
                .map((index) => filteredActiveCollectionItems[index]?.id)
                .filter((value): value is string => Boolean(value));

              if (selectedIds.length === 0) return;

              setActiveCollectionLoading(true);
              try {
                const response = await fetch(
                  `/api/workbench/collections/${activeCollection.id}/items`,
                  {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      creationIds: selectedIds,
                    }),
                  },
                );
                const result = await response.json();

                if (result.code !== 0) {
                  throw new Error(
                    result.message || t("collectionActions.error"),
                  );
                }

                setActiveCollectionItems((prev) =>
                  prev.filter((item) => !selectedIds.includes(item.id)),
                );
                setActiveCollectionSelectedIndices([]);
                setCollectionItems((prev) =>
                  prev.map((item) =>
                    item.id === activeCollection.id
                      ? {
                          ...item,
                          assetCount:
                            result.data?.assetCount ??
                            Math.max(0, item.assetCount),
                        }
                      : item,
                  ),
                );
              } catch (error) {
                console.error(t("collectionActions.error"), error);
              } finally {
                setActiveCollectionLoading(false);
              }
            },
          },
        ]
      : [],
  };

  useEffect(() => {
    setActiveCollectionSelectedIndices([]);
  }, [activeCollection?.id, filteredActiveCollectionItems.length]);

  const tabButtonClassName =
    "inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-[11px] font-semibold tracking-[0.35px] transition-[background,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/28 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F12] active:scale-[0.985]";
  const toolbarIconButtonClassName =
    "flex size-9 cursor-pointer items-center justify-center rounded-[14px] border border-[rgba(214,235,253,0.16)] bg-white/[0.03] text-[#8E9498] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[background,border-color,color,box-shadow,transform] duration-200 ease-out hover:border-white/18 hover:bg-white/[0.07] hover:text-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/28 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F12] active:scale-[0.96] data-[state=open]:border-white/22 data-[state=open]:bg-white/[0.1] data-[state=open]:text-white";
  const toolbarSegmentButtonClassName =
    "flex size-8 cursor-pointer items-center justify-center rounded-[10px] text-[#8E9498] transition-[background,color,box-shadow,transform] duration-200 ease-out hover:bg-white/[0.08] hover:text-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/24 focus-visible:ring-offset-1 focus-visible:ring-offset-[#14171A] active:scale-[0.96]";
  const menuItemClassName =
    "cursor-pointer rounded-[12px] px-3 py-2.5 text-sm text-white/82 transition-[background,color,transform] duration-150 ease-out focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white";

  const shellClassName = embeddedShell
    ? "relative flex min-h-0 flex-1 flex-col overflow-hidden"
    : cn(
        "group relative flex min-h-[18rem] flex-1 flex-col overflow-hidden rounded-[2rem] max-md:rounded-none max-md:border-0 max-md:shadow-none md:h-[calc(100vh-12rem)] md:min-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-12rem)]",
        WORKBENCH_PANEL_SURFACE_CLASS,
        WORKBENCH_PANEL_SURFACE_HOVER_CLASS,
      );
  const mobileAssetListShellClassName = cn(
    shellClassName,
    !embeddedShell && "max-md:h-[70dvh] max-md:max-h-[70dvh]",
  );
  const assetListShellClassName = embeddedShell
    ? "relative flex min-h-0 flex-1 flex-col overflow-hidden"
    : mobileAssetListShellClassName;
  const collectionsListShellClassName = embeddedShell
    ? "relative flex min-h-0 flex-1 flex-col overflow-hidden"
    : "relative flex min-h-[18rem] flex-1 flex-col overflow-hidden rounded-[2rem] max-md:rounded-none md:h-[calc(100vh-12rem)] md:min-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-12rem)]";

  const creationTriggerLabel =
    activeCreationView === "uploads" ? t("tabs.uploads") : t("tabs.creations");
  const CreationTriggerIcon =
    activeCreationView === "uploads" ? FileUp : History;
  const noResultsTitle = t("states.noMatchingTitle");
  const noResultsDescription = t("states.noMatchingDescription");
  const clearFiltersLabel = t("states.clearFilters");
  const recent7DaysHint = t("hints.recent7Days");
  const showCreationsTab = visibleTabs.includes("creations");
  const showCollectionsTab = visibleTabs.includes("collections");
  const showTemplatesTab = visibleTabs.includes("templates");

  const renderRecent7DaysHintButton = (
    size: "desktop" | "mobile" = "desktop",
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={recent7DaysHint}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full border border-[rgba(214,235,253,0.16)] bg-white/[0.03] text-[#8E9498] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[background,border-color,color,box-shadow,transform] duration-200 ease-out hover:border-white/18 hover:bg-white/[0.07] hover:text-[#F5F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/28 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F12] active:scale-[0.96]",
            size === "desktop" ? "size-7" : "size-8",
          )}
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="z-[1600] max-w-[260px] rounded-[16px] border border-white/10 bg-[#101214] px-3 py-2.5 text-[12px] leading-5 text-white/88 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
      >
        {recent7DaysHint}
      </TooltipContent>
    </Tooltip>
  );
  const today = useMemo(() => startOfDay(new Date()), []);
  const recent7DaysStart = useMemo(() => addDays(today, -6), [today]);
  const isRecent7DaysRestrictedView =
    activeTab === "creations" ||
    (activeTab === "collections" && Boolean(activeCollection));
  const canSelectDate = useCallback(
    (date: Date) =>
      !isRecent7DaysRestrictedView ||
      isDateWithinRange(date, recent7DaysStart, today),
    [isRecent7DaysRestrictedView, recent7DaysStart, today],
  );
  const canGoPrevMonth = useMemo(() => {
    if (!isRecent7DaysRestrictedView) return true;
    const prevMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() - 1,
      1,
    );
    return monthHasSelectableDate(prevMonth, recent7DaysStart, today);
  }, [isRecent7DaysRestrictedView, recent7DaysStart, today, visibleMonth]);
  const canGoNextMonth = useMemo(() => {
    if (!isRecent7DaysRestrictedView) return true;
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    );
    return monthHasSelectableDate(nextMonth, recent7DaysStart, today);
  }, [isRecent7DaysRestrictedView, recent7DaysStart, today, visibleMonth]);

  const resetDraftRange = (nextRange: DateRangeValue = appliedDateRange) => {
    setDraftDateRange(nextRange);
    const anchorDate =
      fromDateKey(nextRange.end) ||
      fromDateKey(nextRange.start) ||
      startOfDay(new Date());
    setVisibleMonth(
      startOfDay(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)),
    );
  };

  const handleDateSelect = (date: Date) => {
    if (!canSelectDate(date)) return;

    const nextKey = toDateKey(date);

    setDraftDateRange((prev) => {
      if (!prev.start || (prev.start && prev.end)) {
        return { start: nextKey, end: null };
      }

      if (nextKey < prev.start) {
        return { start: nextKey, end: prev.start };
      }

      if (nextKey === prev.start) {
        return { start: nextKey, end: nextKey };
      }

      return { start: prev.start, end: nextKey };
    });
  };

  const handleApplyFilters = () => {
    if (!draftDateRange.start || !draftDateRange.end) return;
    setAppliedDateRange(draftDateRange);
    setDatePickerOpen(false);
    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    const cleared = { start: null, end: null };
    setAppliedDateRange(cleared);
    setToolFilter("all");
    setModelFilter("all");
    setCategoryFilter("all");
    setSearchKeyword("");
    resetDraftRange(cleared);
    setDatePickerOpen(false);
  };

  const handleCancelFilters = () => {
    resetDraftRange(appliedDateRange);
    setDatePickerOpen(false);
    setFiltersOpen(false);
  };

  const handleQuickCategoryFilter = (value: AssetCategoryFilter) => {
    setCategoryFilter(value);
    setToolFilter("all");
    setModelFilter("all");
  };

  useEffect(() => {
    if (!filtersOpen) return;

    const frame = window.requestAnimationFrame(() => {
      keywordInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [filtersOpen]);

  useEffect(() => {
    if (!datePickerOpen) return;

    const updatePosition = () => {
      const trigger = dateTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const panelWidth = 320;
      const viewportPadding = 16;
      const maxLeft = window.innerWidth - panelWidth - viewportPadding;
      const left = Math.min(Math.max(rect.left, viewportPadding), maxLeft);

      setDatePickerPosition({
        top: rect.bottom + 12,
        left,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [datePickerOpen]);

  useEffect(() => {
    if (!isSignedIn) {
      setUploadsLoading(false);
      setUploadsLoadingMore(false);
      setUploadsHasMore(false);
      setUploadItems([]);
      return;
    }

    if (activeTab !== "creations" || activeCreationView !== "uploads") {
      return;
    }

    const controller = new AbortController();

    const loadUploads = async () => {
      setUploadsLoading(true);
      setUploadItems([]);
      setUploadsHasMore(false);
      try {
        const params = new URLSearchParams();
        const mediaTypeParam = getMediaTypeParamForCategory(categoryFilter);
        if (mediaTypeParam) params.set("mediaType", mediaTypeParam);
        if (toolFilter !== "all") params.set("sceneId", toolFilter);
        if (modelFilter !== "all") params.set("modelUrl", modelFilter);
        if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
        if (appliedDateRange.start)
          params.set("startDate", appliedDateRange.start);
        if (appliedDateRange.end) params.set("endDate", appliedDateRange.end);
        params.set("limit", "20");
        params.set("offset", "0");

        const response = await fetch(
          `/api/workbench/uploads?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );
        const result = await response.json();
        if (result.code !== 0) {
          setUploadItems([]);
          setUploadsHasMore(false);
          return;
        }

        setUploadItems((result.data?.items || []) as UploadRecord[]);
        setUploadsHasMore(Boolean(result.data?.hasMore));
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setUploadItems([]);
          setUploadsHasMore(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setUploadsLoading(false);
          setUploadsLoadingMore(false);
        }
      }
    };

    void loadUploads();

    return () => controller.abort();
  }, [
    activeCreationView,
    activeTab,
    appliedDateRange.end,
    appliedDateRange.start,
    isSignedIn,
    categoryFilter,
    modelFilter,
    searchKeyword,
    toolFilter,
  ]);

  useEffect(() => {
    if (!isSignedIn) {
      setCreationsLoading(false);
      setCreationsLoadingMore(false);
      setCreationsHasMore(false);
      setCreationItems([]);
      return;
    }

    if (activeTab !== "creations" || activeCreationView !== "creations") {
      return;
    }

    const controller = new AbortController();

    const loadCreations = async () => {
      setCreationsLoading(true);
      setCreationsLoadingMore(false);
      setCreationItems([]);
      setCreationsHasMore(false);
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (toolFilter !== "all") params.set("sceneId", toolFilter);
        if (modelFilter !== "all") params.set("modelUrl", modelFilter);
        if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
        if (appliedDateRange.start)
          params.set("startDate", appliedDateRange.start);
        if (appliedDateRange.end) params.set("endDate", appliedDateRange.end);
        params.set("limit", "20");
        params.set("offset", "0");

        const response = await fetch(
          `/api/workbench/creations?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );
        const result = await response.json();

        if (result.code !== 0) {
          setCreationItems([]);
          setCreationsHasMore(false);
          return;
        }

        setCreationItems((result.data?.items || []) as CreationRecord[]);
        setCreationsHasMore(Boolean(result.data?.hasMore));
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setCreationItems([]);
          setCreationsHasMore(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCreationsLoading(false);
          setCreationsLoadingMore(false);
        }
      }
    };

    void loadCreations();

    return () => controller.abort();
  }, [
    activeCreationView,
    activeTab,
    appliedDateRange.end,
    appliedDateRange.start,
    categoryFilter,
    modelFilter,
    searchKeyword,
    toolFilter,
    isSignedIn,
  ]);

  const loadMoreCreations = useCallback(async () => {
    if (
      !isSignedIn ||
      creationsLoading ||
      creationsLoadingMore ||
      !creationsHasMore ||
      activeTab !== "creations" ||
      activeCreationView !== "creations"
    ) {
      return;
    }

    setCreationsLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (toolFilter !== "all") params.set("sceneId", toolFilter);
      if (modelFilter !== "all") params.set("modelUrl", modelFilter);
      if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
      if (appliedDateRange.start)
        params.set("startDate", appliedDateRange.start);
      if (appliedDateRange.end) params.set("endDate", appliedDateRange.end);
      params.set("limit", "20");
      params.set("offset", String(creationItems.length));

      const response = await fetch(
        `/api/workbench/creations?${params.toString()}`,
      );
      const result = await response.json();

      if (result.code !== 0) {
        setCreationsHasMore(false);
        return;
      }

      const nextItems = (result.data?.items || []) as CreationRecord[];
      setCreationItems((prev) => {
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
    } catch {
      setCreationsHasMore(false);
    } finally {
      setCreationsLoadingMore(false);
    }
  }, [
    activeCreationView,
    activeTab,
    appliedDateRange.end,
    appliedDateRange.start,
    creationItems.length,
    creationsHasMore,
    creationsLoading,
    creationsLoadingMore,
    isSignedIn,
    categoryFilter,
    modelFilter,
    searchKeyword,
    toolFilter,
  ]);

  const loadMoreUploads = useCallback(async () => {
    if (
      !isSignedIn ||
      uploadsLoading ||
      uploadsLoadingMore ||
      !uploadsHasMore ||
      activeTab !== "creations" ||
      activeCreationView !== "uploads"
    ) {
      return;
    }

    setUploadsLoadingMore(true);

    try {
      const params = new URLSearchParams();
      const mediaTypeParam = getMediaTypeParamForCategory(categoryFilter);
      if (mediaTypeParam) params.set("mediaType", mediaTypeParam);
      if (toolFilter !== "all") params.set("sceneId", toolFilter);
      if (modelFilter !== "all") params.set("modelUrl", modelFilter);
      if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
      if (appliedDateRange.start)
        params.set("startDate", appliedDateRange.start);
      if (appliedDateRange.end) params.set("endDate", appliedDateRange.end);
      params.set("limit", "20");
      params.set("offset", String(uploadItems.length));

      const response = await fetch(
        `/api/workbench/uploads?${params.toString()}`,
      );
      const result = await response.json();
      if (result.code !== 0) {
        setUploadsHasMore(false);
        return;
      }

      const nextItems = (result.data?.items || []) as UploadRecord[];
      setUploadItems((prev) => {
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
    } catch {
      setUploadsHasMore(false);
    } finally {
      setUploadsLoadingMore(false);
    }
  }, [
    activeCreationView,
    activeTab,
    appliedDateRange.end,
    appliedDateRange.start,
    categoryFilter,
    modelFilter,
    searchKeyword,
    toolFilter,
    uploadItems.length,
    uploadsHasMore,
    uploadsLoading,
    uploadsLoadingMore,
    isSignedIn,
  ]);

  useEffect(() => {
    if (!isSignedIn) {
      setCollectionsLoading(false);
      setCollectionItems([]);
      setActiveCollection(null);
      return;
    }

    if (activeTab !== "collections") {
      return;
    }

    const controller = new AbortController();

    const loadCollections = async () => {
      setCollectionsLoading(true);

      try {
        const response = await fetch("/api/workbench/collections", {
          signal: controller.signal,
        });
        const result = await response.json();

        if (result.code !== 0) {
          setCollectionItems([]);
          return;
        }

        setCollectionItems((result.data?.items || []) as CollectionRecord[]);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setCollectionItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCollectionsLoading(false);
        }
      }
    };

    void loadCollections();

    return () => controller.abort();
  }, [activeTab, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setActiveCollectionLoading(false);
      setActiveCollectionLoadingMore(false);
      setActiveCollectionHasMore(false);
      setActiveCollectionItems([]);
      setActiveCollectionSelectedIndices([]);
      return;
    }

    if (activeTab !== "collections" || !activeCollection) {
      return;
    }

    const controller = new AbortController();

    const loadCollectionItems = async () => {
      setActiveCollectionLoading(true);
      setActiveCollectionLoadingMore(false);
      setActiveCollectionHasMore(false);
      setActiveCollectionItems([]);
      setActiveCollectionSelectedIndices([]);
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (toolFilter !== "all") params.set("sceneId", toolFilter);
        if (modelFilter !== "all") params.set("modelUrl", modelFilter);
        if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
        if (appliedDateRange.start)
          params.set("startDate", appliedDateRange.start);
        if (appliedDateRange.end) params.set("endDate", appliedDateRange.end);
        params.set("limit", "20");
        params.set("offset", "0");

        const response = await fetch(
          `/api/workbench/collections/${activeCollection.id}/items?${params.toString()}`,
          { signal: controller.signal },
        );
        const result = await response.json();

        if (result.code !== 0) {
          setActiveCollectionItems([]);
          setActiveCollectionHasMore(false);
          return;
        }

        setActiveCollectionItems(
          (result.data?.items || []) as CollectionDetailItem[],
        );
        setActiveCollectionHasMore(Boolean(result.data?.hasMore));
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setActiveCollectionItems([]);
          setActiveCollectionHasMore(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setActiveCollectionLoading(false);
          setActiveCollectionLoadingMore(false);
        }
      }
    };

    void loadCollectionItems();

    return () => controller.abort();
  }, [
    activeCollection,
    activeTab,
    appliedDateRange.end,
    appliedDateRange.start,
    isSignedIn,
    categoryFilter,
    modelFilter,
    searchKeyword,
    toolFilter,
  ]);

  const loadMoreActiveCollectionItems = useCallback(async () => {
    if (
      !isSignedIn ||
      !activeCollection ||
      activeCollectionLoading ||
      activeCollectionLoadingMore ||
      !activeCollectionHasMore ||
      activeTab !== "collections"
    ) {
      return;
    }

    setActiveCollectionLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (toolFilter !== "all") params.set("sceneId", toolFilter);
      if (modelFilter !== "all") params.set("modelUrl", modelFilter);
      if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
      if (appliedDateRange.start)
        params.set("startDate", appliedDateRange.start);
      if (appliedDateRange.end) params.set("endDate", appliedDateRange.end);
      params.set("limit", "20");
      params.set("offset", String(activeCollectionItems.length));

      const response = await fetch(
        `/api/workbench/collections/${activeCollection.id}/items?${params.toString()}`,
      );
      const result = await response.json();

      if (result.code !== 0) {
        setActiveCollectionHasMore(false);
        return;
      }

      const nextItems = (result.data?.items || []) as CollectionDetailItem[];
      setActiveCollectionItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        nextItems.forEach((item) => {
          if (!seen.has(item.id)) {
            merged.push(item);
          }
        });
        return merged;
      });
      setActiveCollectionHasMore(Boolean(result.data?.hasMore));
    } catch {
      setActiveCollectionHasMore(false);
    } finally {
      setActiveCollectionLoadingMore(false);
    }
  }, [
    activeCollection,
    activeCollectionHasMore,
    activeCollectionItems.length,
    activeCollectionLoading,
    activeCollectionLoadingMore,
    activeTab,
    appliedDateRange.end,
    appliedDateRange.start,
    isSignedIn,
    categoryFilter,
    modelFilter,
    searchKeyword,
    toolFilter,
  ]);

  const renderFiltersMenu = () => (
    <DropdownMenu
      open={filtersOpen}
      onOpenChange={(open) => {
        setFiltersOpen(open);
        if (open) {
          resetDraftRange(appliedDateRange);
          setDatePickerOpen(false);
        }
      }}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("filters.open")}
          className={cn(
            toolbarIconButtonClassName,
            filtersOpen &&
              "border-white/24 bg-white/[0.1] text-white shadow-[0_12px_30px_rgba(255,255,255,0.08)]",
            hasActiveFilters &&
              "border-white/26 bg-white/[0.06] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
          )}
        >
          <Filter className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-[320px] rounded-[24px] border border-[rgba(214,235,253,0.19)] bg-[#17191B] p-0 text-white shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px,0_24px_70px_rgba(0,0,0,0.45)]"
      >
        <div className="relative space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-white">
                {t("filters.title")}
              </div>
              <div className="mt-1 text-[12px] text-white/38">
                {t("filters.subtitle")}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/38">
              {t("filters.dateRange")}
            </div>
            <button
              ref={dateTriggerRef}
              type="button"
              onClick={() => setDatePickerOpen((prev) => !prev)}
              className={cn(
                "flex h-[40px] w-full items-center justify-between rounded-[14px] border border-[rgba(214,235,253,0.19)] bg-white/[0.03] px-3.5 text-left text-[11px] font-medium leading-[1.27] text-[#F0F0F0] transition-colors hover:bg-white/[0.06]",
                datePickerOpen && "bg-white/[0.06]",
              )}
            >
              <span className="truncate">
                {formatDateRangeLabel(
                  draftDateRange,
                  t("filters.pickDateRange"),
                )}
              </span>
              <ChevronDown
                className={cn(
                  "size-3 text-white/55 transition-transform",
                  datePickerOpen && "rotate-180",
                )}
              />
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/38">
              {t("filters.keyword")}
            </div>
            <div className="flex h-[40px] items-center rounded-[14px] border border-[rgba(214,235,253,0.19)] bg-white/[0.03] px-3.5">
              <Search className="mr-2 size-3 text-white/40" />
              <input
                ref={keywordInputRef}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="h-full w-full bg-transparent text-[11px] font-medium leading-[1.27] text-white outline-none placeholder:text-white/32"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/38">
              {t("filters.type")}
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value as AssetCategoryFilter);
                setToolFilter("all");
                setModelFilter("all");
              }}
            >
              <SelectTrigger className="h-[40px] w-full rounded-[14px] border-[rgba(214,235,253,0.19)] bg-white/[0.03] px-3.5 text-left text-[11px] font-medium leading-[1.27] text-white shadow-none hover:bg-white/[0.06] focus-visible:ring-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[1300] min-w-[var(--radix-select-trigger-width)] rounded-[14px] border-[rgba(214,235,253,0.19)] bg-[#1C1F22] text-white"
              >
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="photo">Photo</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="effect">Effect</SelectItem>
                <SelectItem value="voice">Voice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/38">
              {t("filters.tool")}
            </div>
            <Select
              value={toolFilter}
              onValueChange={(value) => {
                setToolFilter(value);
                setModelFilter("all");
              }}
            >
              <SelectTrigger className="h-[40px] w-full rounded-[14px] border-[rgba(214,235,253,0.19)] bg-white/[0.03] px-3.5 text-left text-[11px] font-medium leading-[1.27] text-white shadow-none hover:bg-white/[0.06] focus-visible:ring-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[1300] min-w-[var(--radix-select-trigger-width)] rounded-[14px] border-[rgba(214,235,253,0.19)] bg-[#1C1F22] text-white"
              >
                {toolOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/38">
              {t("filters.model")}
            </div>
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="h-[40px] w-full rounded-[14px] border-[rgba(214,235,253,0.19)] bg-white/[0.03] px-3.5 text-left text-[11px] font-medium leading-[1.27] text-white shadow-none hover:bg-white/[0.06] focus-visible:ring-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[1300] min-w-[var(--radix-select-trigger-width)] rounded-[14px] border-[rgba(214,235,253,0.19)] bg-[#1C1F22] text-white"
              >
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              className="rounded-full px-3 py-2 text-[11px] font-medium leading-[1.27] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
              onClick={handleClearFilters}
            >
              {t("filters.clear")}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-[rgba(214,235,253,0.19)] bg-transparent px-3 py-2 text-[11px] font-medium leading-[1.27] text-white transition-colors hover:bg-white/[0.06]"
                onClick={handleCancelFilters}
              >
                {t("filters.cancel")}
              </button>
              <button
                type="button"
                disabled={!draftDateRange.start || !draftDateRange.end}
                className="rounded-[14px] bg-white px-4 py-2 text-[12px] font-semibold leading-[1.33] text-black transition-colors hover:bg-[#F0F0F0] disabled:cursor-not-allowed disabled:bg-white/28 disabled:text-black/45"
                onClick={handleApplyFilters}
              >
                {t("filters.apply")}
              </button>
            </div>
          </div>

          {datePickerOpen &&
            datePickerPosition &&
            createPortal(
              <div
                className="fixed z-[1400] w-[320px] rounded-[22px] border border-[rgba(214,235,253,0.19)] bg-[#17191B] p-3 shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px,0_24px_60px_rgba(0,0,0,0.42)]"
                style={{
                  top: datePickerPosition.top,
                  left: datePickerPosition.left,
                  maxWidth: "calc(100vw - 32px)",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={!canGoPrevMonth}
                    className="flex size-8 items-center justify-center rounded-full border border-[rgba(214,235,253,0.19)] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
                    onClick={() => {
                      if (!canGoPrevMonth) return;
                      setVisibleMonth(
                        new Date(
                          visibleMonth.getFullYear(),
                          visibleMonth.getMonth() - 1,
                          1,
                        ),
                      );
                    }}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <div className="text-[15px] font-semibold text-white/75">
                    {formatMonthLabel(visibleMonth, locale)}
                  </div>
                  <button
                    type="button"
                    disabled={!canGoNextMonth}
                    className="flex size-8 items-center justify-center rounded-full border border-[rgba(214,235,253,0.19)] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
                    onClick={() => {
                      if (!canGoNextMonth) return;
                      setVisibleMonth(
                        new Date(
                          visibleMonth.getFullYear(),
                          visibleMonth.getMonth() + 1,
                          1,
                        ),
                      );
                    }}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="pb-1 text-center text-[11px] font-medium text-white/34"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {buildCalendarWeeks(visibleMonth).map((week, weekIndex) => (
                    <div
                      key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${weekIndex}`}
                      className="grid grid-cols-7 gap-1 rounded-[14px] bg-[#23272A] p-1"
                    >
                      {week.map((day) => {
                        const dayKey = toDateKey(day);
                        const isOutsideMonth =
                          day.getMonth() !== visibleMonth.getMonth();
                        const isDisabled = !canSelectDate(day);
                        const start = fromDateKey(draftDateRange.start);
                        const end = fromDateKey(draftDateRange.end);
                        const isStart = sameDay(day, start);
                        const isEnd = sameDay(day, end);
                        const inRange =
                          start &&
                          end &&
                          day.getTime() >= startOfDay(start).getTime() &&
                          day.getTime() <= startOfDay(end).getTime();

                        return (
                          <button
                            key={dayKey}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleDateSelect(day)}
                            className={cn(
                              "flex h-10 items-center justify-center rounded-[12px] text-[14px] font-medium transition-colors",
                              isDisabled
                                ? "cursor-not-allowed text-white/18 hover:bg-transparent hover:text-white/18"
                                : isOutsideMonth
                                  ? "text-white/30"
                                  : "text-white/72 hover:bg-white/[0.08] hover:text-white",
                              !isDisabled &&
                                inRange &&
                                "bg-white/[0.08] text-white",
                              !isDisabled &&
                                (isStart || isEnd) &&
                                "bg-white text-black",
                            )}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[rgba(214,235,253,0.19)] bg-transparent px-3 py-2 text-[11px] font-medium leading-[1.27] text-white transition-colors hover:bg-white/[0.06]"
                    onClick={() => {
                      setDatePickerOpen(false);
                    }}
                  >
                    {t("filters.done")}
                  </button>
                </div>
              </div>,
              document.body,
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderAssetScaleControl = (currentTab: PanelTab) => {
    const showAssetToolbar =
      currentTab === "creations" ||
      (currentTab === "collections" && Boolean(activeCollection));

    if (!showAssetToolbar) return null;

    const cardScaleMin = 20;
    const cardScaleMax = 80;
    const cardScaleProgress = Math.min(
      100,
      Math.max(
        0,
        ((cardScale - cardScaleMin) / (cardScaleMax - cardScaleMin)) * 100,
      ),
    );
    return (
      <div className="hidden min-w-0 items-center justify-center xl:flex">
        <div className="flex min-w-[15rem] max-w-[20rem] flex-1 items-center justify-center px-2">
          <div className="relative flex h-9 w-full max-w-[22rem] items-center">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/[0.12]" />
            <div
              className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/[0.36] shadow-[0_0_18px_rgba(255,255,255,0.1)]"
              style={{ width: `${cardScaleProgress}%` }}
            />
            <div
              className="pointer-events-none absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/18 bg-white shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
              style={{ left: `${cardScaleProgress}%` }}
            />
            <input
              type="range"
              min={cardScaleMin}
              max={cardScaleMax}
              step={1}
              value={cardScale}
              onChange={(event) => setCardScale(Number(event.target.value))}
              aria-label="Adjust card size"
              className="absolute inset-0 h-9 w-full cursor-pointer appearance-none opacity-0"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderAssetActionControls = (currentTab: PanelTab) => {
    const showAssetToolbar =
      currentTab === "creations" ||
      (currentTab === "collections" && Boolean(activeCollection));

    if (!showAssetToolbar) return null;

    const viewModeTitle = t("viewMode.title");
    const previewLayoutLabel = t("viewMode.previewLayout");
    const overlaysLabel = t("viewMode.overlays");
    const metadataLabel = t("viewMode.metadata");

    return (
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden shrink-0 items-center gap-1 rounded-[16px] border border-[rgba(214,235,253,0.16)] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:flex">
          {[
            { key: "photo", icon: ImageIcon, value: "photo" as const },
            { key: "video", icon: Video, value: "video" as const },
            { key: "effect", icon: Grid2X2, value: "effect" as const },
            { key: "voice", icon: Volume2, value: "voice" as const },
          ].map(({ key, icon: Icon, value }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleQuickCategoryFilter(value)}
              className={cn(
                toolbarSegmentButtonClassName,
                categoryFilter === value &&
                  "bg-white/10 text-[#F5F7F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              )}
            >
              <Icon className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearFilters}
            className={cn(
              "flex h-8 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[10px] px-2.5 text-[11px] font-semibold tracking-[0.35px] transition-[background,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/24 focus-visible:ring-offset-1 focus-visible:ring-offset-[#14171A] active:scale-[0.97]",
              !hasActiveFilters && categoryFilter === "all"
                ? "bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.12)]"
                : "text-[#8E9498] hover:bg-white/[0.08] hover:text-[#F5F7F8]",
            )}
          >
            {t("common.all")}
          </button>
        </div>

        {renderFiltersMenu()}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                toolbarIconButtonClassName,
                (previewLayout !== "original" || !showMetadataOverlay) &&
                  "border-white/24 bg-white/[0.1] text-white shadow-[0_12px_30px_rgba(255,255,255,0.08)]",
              )}
              aria-label={viewModeTitle}
            >
              <Grid2X2 className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-[20rem] rounded-[1.8rem] border border-[rgba(214,235,253,0.19)] bg-[#1b1d1f]/98 p-4 text-white shadow-[rgba(176,199,217,0.145)_0px_0px_0px_1px,inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl"
          >
            <div className="space-y-4">
              <div>
                <div className="text-[14px] font-semibold leading-[1.35] text-[#F0F0F0]">
                  {viewModeTitle}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-medium tracking-[0.01em] text-[#A1A4A5]">
                  {previewLayoutLabel}
                </div>
                <div className="flex rounded-[14px] border border-[rgba(214,235,253,0.12)] bg-white/[0.03] p-1">
                  {[
                    {
                      key: "original" as const,
                      label: t("viewMode.originalRatio"),
                    },
                    {
                      key: "crop" as const,
                      label: t("viewMode.cropToFill"),
                    },
                    {
                      key: "mixed" as const,
                      label: t("viewMode.mixedGrid"),
                    },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setPreviewLayout(option.key)}
                      className={cn(
                        "flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-[12px] px-2 text-[10px] font-medium leading-[1.2] transition-colors",
                        previewLayout === option.key
                          ? "bg-white/[0.12] text-[#F0F0F0]"
                          : "text-[#A1A4A5] hover:text-[#F0F0F0]",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-medium tracking-[0.01em] text-[#A1A4A5]">
                  {overlaysLabel}
                </div>
                <div className="rounded-[16px] border border-[rgba(214,235,253,0.12)] bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] font-medium text-[#F0F0F0]">
                      {metadataLabel}
                    </span>
                    <Switch
                      checked={showMetadataOverlay}
                      onCheckedChange={setShowMetadataOverlay}
                      className="data-[state=checked]:bg-[#F0F0F0] data-[state=unchecked]:bg-white/18"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const renderDesktopHeader = (currentTab: PanelTab) => (
    <div className="relative hidden border-b border-[rgba(214,235,253,0.12)] px-4 py-3.5 md:block">
      <div className="grid grid-cols-[max-content_minmax(0,1fr)_max-content] items-center gap-x-5 gap-y-3">
        <div className="flex min-w-0 items-center gap-1 lg:gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  tabButtonClassName,
                  currentTab === "creations"
                    ? "border-[rgba(214,235,253,0.18)] bg-white text-black shadow-[0_14px_32px_rgba(255,255,255,0.12)]"
                    : "border-transparent bg-transparent text-[#8E9498] shadow-none hover:border-white/12 hover:bg-white/[0.04] hover:text-[#F5F7F8] data-[state=open]:border-white/14 data-[state=open]:bg-white/[0.06] data-[state=open]:text-white",
                )}
              >
                <CreationTriggerIcon className="size-3" />
                {creationTriggerLabel}
                <ChevronDown className="size-3 transition-transform duration-200 data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[180px] rounded-[16px] border-white/10 bg-[#101214] p-1.5 text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
                {t("tabs.assets")}
              </DropdownMenuLabel>
              <DropdownMenuItem
                className={cn(
                  menuItemClassName,
                  activeCreationView === "creations" &&
                    "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                )}
                onClick={() => {
                  setActiveTab("creations");
                  setActiveCreationView("creations");
                }}
              >
                <History className="size-4 text-white/72" />
                {t("tabs.creations")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  menuItemClassName,
                  activeCreationView === "uploads" &&
                    "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                )}
                onClick={() => {
                  setActiveTab("creations");
                  setActiveCreationView("uploads");
                }}
              >
                <FileUp className="size-4 text-white/72" />
                {t("tabs.uploads")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {showCollectionsTab ? (
            <button
              type="button"
              className={cn(
                "inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-2 text-[11px] font-medium tracking-[0.35px] transition-colors",
                currentTab === "collections"
                  ? "border-[rgba(214,235,253,0.18)] bg-white px-3 text-black shadow-[0_14px_32px_rgba(255,255,255,0.12)]"
                  : "border-transparent text-[#8E9498] hover:border-white/12 hover:bg-white/[0.04] hover:text-[#F5F7F8]",
              )}
              onClick={() => setActiveTab("collections")}
            >
              <FolderOpen className="size-3" />
              {t("tabs.collections")}
            </button>
          ) : null}
          {showTemplatesTab ? (
            <button
              type="button"
              className={cn(
                tabButtonClassName,
                currentTab === "templates"
                  ? "border-[rgba(214,235,253,0.18)] bg-white text-black shadow-[0_14px_32px_rgba(255,255,255,0.12)]"
                  : "border-transparent bg-transparent text-[#8E9498] shadow-none hover:border-white/12 hover:bg-white/[0.04] hover:text-[#F5F7F8]",
              )}
              onClick={() => setActiveTab("templates")}
            >
              <CopyPlus className="size-3" />
              {t("tabs.templates")}
            </button>
          ) : null}
          {renderRecent7DaysHintButton("desktop")}
        </div>

        {renderAssetScaleControl(currentTab)}
        <div className="justify-self-end">
          {renderAssetActionControls(currentTab)}
        </div>
      </div>
    </div>
  );

  const renderMobileHeader = (currentTab: PanelTab) => (
    <div className="relative border-b border-[rgba(214,235,253,0.12)] px-2 py-2.5 md:hidden">
      <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                tabButtonClassName,
                "min-h-[38px] px-3 text-[11px]",
                currentTab === "creations"
                  ? "border-[rgba(214,235,253,0.18)] bg-white text-black shadow-[0_12px_28px_rgba(255,255,255,0.1)]"
                  : "border-transparent bg-transparent text-[#8E9498] hover:border-white/12 hover:bg-white/[0.04] hover:text-[#F5F7F8] data-[state=open]:border-white/14 data-[state=open]:bg-white/[0.06] data-[state=open]:text-white",
              )}
            >
              <CreationTriggerIcon className="size-3" />
              {creationTriggerLabel}
              <ChevronDown className="size-3 transition-transform duration-200 data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[160px] rounded-[16px] border-white/10 bg-[#101214] p-1.5 text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
          >
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
              {t("tabs.assets")}
            </DropdownMenuLabel>
            <DropdownMenuItem
              className={cn(
                menuItemClassName,
                activeCreationView === "creations" &&
                  "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              )}
              onClick={() => {
                setActiveTab("creations");
                setActiveCreationView("creations");
              }}
            >
              <History className="size-4 text-white/72" />
              {t("tabs.creations")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(
                menuItemClassName,
                activeCreationView === "uploads" &&
                  "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              )}
              onClick={() => {
                setActiveTab("creations");
                setActiveCreationView("uploads");
              }}
            >
              <FileUp className="size-4 text-white/72" />
              {t("tabs.uploads")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {showCollectionsTab ? (
          <button
            type="button"
            className={cn(
              tabButtonClassName,
              "min-h-[38px] px-3 text-[11px]",
              currentTab === "collections"
                ? "border-[rgba(214,235,253,0.18)] bg-white text-black shadow-[0_12px_28px_rgba(255,255,255,0.1)]"
                : "border-transparent bg-transparent text-[#8E9498] hover:border-white/12 hover:bg-white/[0.04] hover:text-[#F5F7F8]",
            )}
            onClick={() => setActiveTab("collections")}
          >
            <FolderOpen className="size-3" />
            {t("tabs.collections")}
          </button>
        ) : null}
        {showTemplatesTab ? (
          <button
            type="button"
            className={cn(
              tabButtonClassName,
              "min-h-[38px] px-3 text-[11px]",
              currentTab === "templates"
                ? "border-[rgba(214,235,253,0.18)] bg-white text-black shadow-[0_12px_28px_rgba(255,255,255,0.1)]"
                : "border-transparent bg-transparent text-[#8E9498] hover:border-white/12 hover:bg-white/[0.04] hover:text-[#F5F7F8]",
            )}
            onClick={() => setActiveTab("templates")}
          >
            <CopyPlus className="size-3" />
            {t("tabs.templates")}
          </button>
        ) : null}
        {renderRecent7DaysHintButton("mobile")}
      </div>
    </div>
  );

  if (activeTab === "templates") {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className={shellClassName}>
          <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
          {!hideInternalHeader ? renderMobileHeader("templates") : null}
          {!hideInternalHeader ? renderDesktopHeader("templates") : null}
          <div
            ref={setTemplateScrollRoot}
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <WorkbenchTemplateGallery
              items={templateItems}
              onUseItem={handleUseTemplate}
              scrollRoot={templateScrollRoot}
              className="min-h-0"
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "collections") {
    if (activeCollection) {
      if (
        hasActiveFilters &&
        !activeCollectionLoading &&
        activeCollectionItems.length === 0
      ) {
        return (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className={shellClassName}>
              <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
              {!hideInternalHeader ? renderMobileHeader("collections") : null}
              {!hideInternalHeader ? renderDesktopHeader("collections") : null}
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <FilteredResultsEmptyState
                  title={noResultsTitle}
                  description={noResultsDescription}
                  actionLabel={clearFiltersLabel}
                  onClear={handleClearFilters}
                />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className={shellClassName}>
            <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
            <div className="relative z-10 flex items-center justify-between border-b border-white/8 px-4 py-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCollection(null);
                    setActiveCollectionItems([]);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/72 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-[0.02em] text-white">
                    {activeCollection.name}
                  </div>
                </div>
              </div>
              <div className="hidden md:flex md:items-center md:gap-2">
                {renderAssetScaleControl("collections")}
                {renderAssetActionControls("collections")}
              </div>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden">
              {activeCollectionLoading && activeCollectionItems.length === 0 ? (
                <AssetGridLoading
                  title={activeCollection.name}
                  subtitle={t("collections.emptyDescription")}
                />
              ) : (
                <GeneratedMediaPanel
                  {...activeCollectionPanelProps}
                  onLoadMore={() => {
                    void loadMoreActiveCollectionItems();
                  }}
                  className="h-full"
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className={collectionsListShellClassName}>
          {!hideInternalHeader ? renderMobileHeader("collections") : null}
          {!hideInternalHeader ? renderDesktopHeader("collections") : null}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <WorkbenchCollectionsGrid
              items={collectionItems}
              isLoading={collectionsLoading}
              canCreate={isSignedIn}
              text={{
                heading: t("collections.heading"),
                createCardLabel: t("collections.createCardLabel"),
                createTitle: t("collections.createTitle"),
                createDescription: t("collections.createDescription"),
                renameTitle: t("collections.renameTitle"),
                renameDescription: t("collections.renameDescription"),
                deleteTitle: t("collections.deleteTitle"),
                deleteDescription: t("collections.deleteDescription"),
                renameAction: t("collections.renameAction"),
                deleteAction: t("collections.deleteAction"),
                createAction: t("collections.createAction"),
                cancelAction: t("collections.cancelAction"),
                nameLabel: t("collections.nameLabel"),
                namePlaceholder: t("collections.namePlaceholder"),
                emptyTitle: t("collections.emptyTitle"),
                emptyDescription: t("collections.emptyDescription"),
                createSuccess: t("collections.createSuccess"),
                renameSuccess: t("collections.renameSuccess"),
                deleteSuccess: t("collections.deleteSuccess"),
                createError: t("collections.createError"),
                renameError: t("collections.renameError"),
                deleteError: t("collections.deleteError"),
              }}
              onRequireSignIn={handleRequireSignIn}
              onCreate={async (name) => {
                if (!isSignedIn) return;
                const response = await fetch("/api/workbench/collections", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ name }),
                });
                const result = await response.json();

                if (result.code !== 0) {
                  throw new Error(
                    result.message || t("collections.createError"),
                  );
                }

                const nextItem = result.data?.collection as CollectionRecord;
                setCollectionItems((prev) => [nextItem, ...prev]);
              }}
              onRename={async (id, name) => {
                if (!isSignedIn) return;
                const response = await fetch(
                  `/api/workbench/collections/${id}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name }),
                  },
                );
                const result = await response.json();

                if (result.code !== 0) {
                  throw new Error(
                    result.message || t("collections.renameError"),
                  );
                }

                const nextItem = result.data?.collection as CollectionRecord;
                setCollectionItems((prev) => {
                  const rest = prev.filter((item) => item.id !== id);
                  return [nextItem, ...rest];
                });
              }}
              onDelete={async (id) => {
                if (!isSignedIn) return;
                const response = await fetch(
                  `/api/workbench/collections/${id}`,
                  {
                    method: "DELETE",
                  },
                );
                const result = await response.json();

                if (result.code !== 0) {
                  throw new Error(
                    result.message || t("collections.deleteError"),
                  );
                }

                setCollectionItems((prev) =>
                  prev.filter((item) => item.id !== id),
                );
                setActiveCollection((prev) => (prev?.id === id ? null : prev));
              }}
              onOpen={async (item) => {
                setActiveCollection({
                  id: item.id,
                  name: item.name,
                  assetCount: item.assetCount,
                  createdAt: item.createdAt || "",
                  updatedAt: item.updatedAt || item.createdAt || "",
                });
                setActiveCollectionItems([]);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeCreationView === "uploads") {
    const uploadGridItems = uploadItems.map((item) => ({
      id: item.id,
      type: item.mediaType as "image" | "video" | "audio",
      src: item.url,
      alt: item.filename,
      model: item.modelLabel || item.sceneLabel || item.filename,
      prompt: item.filename,
      sceneKey: item.sceneId || undefined,
      modelKey: item.modelUrl || undefined,
      parameters: {
        filename: item.filename,
        uploadRecordId: item.id,
      },
    }));

    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className={assetListShellClassName}>
          {!embeddedShell ? (
            <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
          ) : null}
          {!hideInternalHeader ? renderMobileHeader("creations") : null}
          {!hideInternalHeader ? renderDesktopHeader("creations") : null}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {uploadsLoading && uploadItems.length === 0 ? (
              <UploadsGridLoading
                title={t("tabs.uploads")}
                subtitle={t("states.uploadsDescription")}
              />
            ) : hasActiveFilters &&
              !uploadsLoading &&
              uploadItems.length === 0 ? (
              <FilteredResultsEmptyState
                title={noResultsTitle}
                description={noResultsDescription}
                actionLabel={clearFiltersLabel}
                onClear={handleClearFilters}
              />
            ) : (
              <UploadsMediaGrid
                items={uploadGridItems}
                isLoading={uploadsLoading}
                isLoadingMore={uploadsLoadingMore}
                hasMore={uploadsHasMore}
                onLoadMore={() => {
                  void loadMoreUploads();
                }}
                onDeleteItem={async (uploadId) => {
                  if (!isSignedIn || !uploadId) return;
                  await fetch(`/api/workbench/uploads/${uploadId}`, {
                    method: "DELETE",
                  });
                  setUploadItems((prev) =>
                    prev.filter((item) => item.id !== uploadId),
                  );
                }}
                emptyTitle={t("tabs.uploads")}
                emptyDescription={t("states.uploadsDescription")}
                emptyChips={[
                  t("mediaTypes.image"),
                  t("mediaTypes.video"),
                  t("mediaTypes.audio"),
                ]}
                cardScale={cardScale}
                previewLayout={previewLayout}
                showMetadata={showMetadataOverlay}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className={assetListShellClassName}>
        {!embeddedShell ? (
          <div className={WORKBENCH_PANEL_AMBIENT_CLASS} />
        ) : null}
        {!hideInternalHeader ? renderMobileHeader("creations") : null}
        {!hideInternalHeader ? renderDesktopHeader("creations") : null}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {creationsLoading && creationItems.length === 0 ? (
            <AssetGridLoading
              title={t("tabs.creations")}
              subtitle={t("states.creationsDescription")}
            />
          ) : hasActiveFilters &&
            !creationsLoading &&
            creationItems.length === 0 ? (
            <FilteredResultsEmptyState
              title={noResultsTitle}
              description={noResultsDescription}
              actionLabel={clearFiltersLabel}
              onClear={handleClearFilters}
            />
          ) : (
            <GeneratedMediaPanel
              {...creationPanelProps}
              onLoadMore={() => {
                void loadMoreCreations();
              }}
              embedded
              className="min-h-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
