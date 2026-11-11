"use client";

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ChevronDown,
  Clapperboard,
  Clock,
  FileImage,
  Image as ImageIcon,
  Loader2,
  Plus,
  RectangleHorizontal,
  Settings2,
  Shuffle,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/core/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { PromptEnhanceButton } from "@/shared/components/prompt-enhance-button";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { PricingPrompt } from "@/shared/blocks/payment/pricing-prompt";
import {
  extractImageAiScenes,
  findFirstSceneWithWorkspace,
  type SceneNode,
  type ModelNode,
} from "@/shared/blocks/ai-image-generator/ai-image-generator-shared";
import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground";
import {
  getPlaygroundConfigRegistry,
  REGISTRY_KEY_BY_URL,
} from "@/shared/blocks/desktop-playground/playground-config-registry";
import type { FieldSchema } from "@/shared/blocks/desktop-playground/types/playground-config";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useAppContext } from "@/shared/contexts/app";
import {
  getToolbarSchema,
  type ParamField,
  type ParamPill,
  type ModelParamSchema,
} from "@/shared/lib/model-param-schemas";
import { resolveDefaultVideoModelUrl } from "@/shared/lib/video-model-defaults";
import { landingSidebarRowCenteredCn } from "@/shared/lib/landing-sidebar-layout-classes";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/types/blocks/common";

type HomeTab = "video" | "image";

const DEFAULT_HOME_TEXT_TO_IMAGE_MODEL_URL = "/text-to-image/gpt-image-2";
const DEFAULT_HOME_IMAGE_TO_IMAGE_MODEL_URL = "/image-to-image/gpt-image-2";
const CANVAS_AGENT_AUTO_OPEN_STORAGE_KEY_PREFIX = "canvas-agent:auto-open:";

function getModelSlug(modelUrl: string): string {
  return modelUrl.split("/").filter(Boolean).pop() ?? "";
}

function getDefaultParamsForModel(modelUrl: string): ModelParamSchema {
  // 直接读取最新 schema，避免 HMR 或配置热更新后首页仍复用旧选项。
  return getToolbarSchema(modelUrl);
}

/**
 * 输入框场景下拉排除列表（按 scene.id / url 前缀匹配）
 */
const SCENE_DROPDOWN_EXCLUDED_PREFIXES = [
  "/video-face-swap",
  "/motion-control/",
  "/longcat-avatar",
  "/image-eraser",
];

function isExcludedFromSceneDropdown(scene: SceneNode): boolean {
  const id = scene.id || "";
  return SCENE_DROPDOWN_EXCLUDED_PREFIXES.some((prefix) =>
    id.startsWith(prefix),
  );
}

function filterScenesByTab(scenes: SceneNode[], tab: HomeTab): SceneNode[] {
  if (tab === "video") {
    return scenes.filter(
      (s) => s.category === "Video" && !isExcludedFromSceneDropdown(s),
    );
  }
  // Image Tab：显示 category === "Image"（排除特定工具场景）
  // 以及 category === "Video" 但没有子项的场景（同样排除特定工具场景）
  return scenes.filter((s) => {
    if (isExcludedFromSceneDropdown(s)) return false;
    if (s.category === "Image") return true;
    if (s.category === "Video" && !s.children?.length) return true;
    return false;
  });
}

function resolveDefaultHomeModelUrl(scene?: SceneNode | null) {
  if (!scene) {
    return "";
  }

  const candidates = [...(scene.children?.map((child) => child.url) ?? [])]
    .concat(scene.url ? [scene.url] : [])
    .filter(Boolean);

  const isTextToImageScene =
    scene.url?.startsWith("/text-to-image") ||
    candidates.some((url) => url.startsWith("/text-to-image/"));
  if (isTextToImageScene) {
    return (
      candidates.find((url) => url === DEFAULT_HOME_TEXT_TO_IMAGE_MODEL_URL) ||
      scene.children?.[0]?.url ||
      scene.url ||
      ""
    );
  }

  const isImageToImageScene =
    scene.url?.startsWith("/image-to-image") ||
    candidates.some((url) => url.startsWith("/image-to-image/"));
  if (isImageToImageScene) {
    return (
      candidates.find((url) => url === DEFAULT_HOME_IMAGE_TO_IMAGE_MODEL_URL) ||
      scene.children?.[0]?.url ||
      scene.url ||
      ""
    );
  }

  return resolveDefaultVideoModelUrl(scene);
}

/** 工具栏胶囊按钮共用底/边/悬停，避免「上排 Select」与「参数 / more」视觉两套 */
const toolbarPillSurfaceClass = cn(
  "rounded-[0.95rem] border border-white/[0.1] bg-white/[0.02] text-left text-[12px] font-semibold text-white/88 shadow-none",
  "hover:border-white/[0.16] hover:bg-white/[0.045]",
  "focus-visible:border-white/[0.28] focus-visible:ring-2 focus-visible:ring-white/10",
  "cursor-pointer transition-all duration-200",
);

const toolbarSelectTriggerClass = cn(
  toolbarPillSurfaceClass,
  "h-auto min-h-9 w-fit max-w-[11rem] shrink-0 gap-1.5 py-2 pl-2.5 pr-2.5",
  "data-[size=default]:h-auto data-[size=sm]:h-auto",
);

const toolbarModelSelectTriggerClass = cn(
  toolbarPillSurfaceClass,
  "h-auto min-h-9 w-fit max-w-[min(100%,22rem)] shrink-0 gap-1.5 py-2 pl-2.5 pr-2.5",
  "data-[size=default]:h-auto data-[size=sm]:h-auto",
  "[&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:overflow-visible [&_[data-slot=select-value]]:whitespace-nowrap",
);

/** 场景名（如 Text to Image）需在工具栏完整显示：避免 flex 收缩与 max-w 过窄触发省略号 */
const toolbarSceneSelectTriggerClass = cn(
  toolbarPillSurfaceClass,
  "h-auto min-h-9 min-w-[8.75rem] w-fit max-w-[min(100%,18rem)] shrink-0 gap-1.5 py-2 pl-2.5 pr-2.5 sm:min-w-[10.5rem]",
  "data-[size=default]:h-auto data-[size=sm]:h-auto",
  /* 覆盖 ui/select 里 SelectValue 的 line-clamp-1，在宽度足够时单行完整展示 */
  "[&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:overflow-visible [&_[data-slot=select-value]]:whitespace-nowrap",
);

/** 与主创作卡片内表面一致（textarea 为 transparent，视觉即此色） */
const HOME_COMPOSER_CARD_SURFACE_CLASS = "bg-[#111113]";

/** 工具栏内 Select 下拉：与参数面板同色，不用独立深蓝底 */
const HOME_COMPOSER_SELECT_CONTENT_CLASS = cn(
  "z-[60] max-h-[min(24rem,70vh)] overflow-hidden rounded-2xl border border-white/[0.08] p-1.5 text-white shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]",
  HOME_COMPOSER_CARD_SURFACE_CLASS,
);

const HOME_COMPOSER_SELECT_ITEM_CLASS =
  "cursor-pointer rounded-lg py-2 pr-8 pl-2 text-sm font-semibold text-white/90 outline-none focus:bg-white/[0.08] focus:text-white data-[highlighted]:bg-white/[0.08] data-[highlighted]:text-white";

const INLINE_PARAM_KEYS = new Set([
  "aspectRatio",
  "duration",
  "resolution",
  "numLayers",
  "targetResolution",
]);

const INLINE_PARAM_ORDER = ["aspectRatio", "duration", "resolution"] as const;

/** 参数弹层、内部控件与主卡片表面同色，避免「一块蓝灰、一块纯黑」的割裂感 */
const TOOLBAR_PARAMS_SURFACE_CLASS = HOME_COMPOSER_CARD_SURFACE_CLASS;

const TOOLBAR_PARAMS_DROPDOWN_CLASS =
  "z-[60] rounded-2xl border border-white/[0.08] p-4 text-white shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)] " +
  TOOLBAR_PARAMS_SURFACE_CLASS;

const toolbarComboTriggerClass = cn(
  toolbarPillSurfaceClass,
  "flex h-auto min-h-8 w-fit max-w-[min(100%,22rem)] shrink-0 items-center gap-0 py-1.5 pl-2.5 pr-2",
  "focus-visible:outline-none",
);

function getSelectOptionLabel(
  field: Extract<ParamField, { type: "select" }>,
  raw: string,
): string {
  const hit = field.options.find((o) => String(o.value) === String(raw));
  return hit?.label ?? raw;
}

function sortInlineParamEntries(
  entries: [string, NonNullable<ModelParamSchema["schema"]>[string]][],
): [string, NonNullable<ModelParamSchema["schema"]>[string]][] {
  const order = new Map(INLINE_PARAM_ORDER.map((k, i) => [k, i] as const));
  return [...entries].sort(
    (a, b) =>
      (order.get(a[0] as "aspectRatio" | "duration" | "resolution") ?? 99) -
      (order.get(b[0] as "aspectRatio" | "duration" | "resolution") ?? 99),
  );
}

function parseAspectRatioParts(
  text: string,
): { rw: number; rh: number } | null {
  const compact = text.replace(/\s/g, "");
  const m = compact.match(/^(\d+)[:×xX](\d+)$/);
  if (!m) return null;
  const rw = Number(m[1]);
  const rh = Number(m[2]);
  if (!Number.isFinite(rw) || !Number.isFinite(rh) || rw <= 0 || rh <= 0) {
    return null;
  }
  return { rw, rh };
}

/** 线框比例示意：在固定槽位内按宽高比缩放 */
function aspectWireframePixelSize(
  rw: number,
  rh: number,
  maxSide: number,
): { width: number; height: number } {
  const aspect = rw / rh;
  if (aspect >= 1) {
    const width = maxSide;
    const height = Math.max(10, Math.round(maxSide / aspect));
    return { width, height };
  }
  const height = maxSide;
  const width = Math.max(10, Math.round(maxSide * aspect));
  return { width, height };
}

function AspectRatioWireframe({
  optionLabel,
  optionValue,
}: {
  optionLabel: string;
  optionValue: string;
}) {
  const parsed =
    parseAspectRatioParts(optionLabel) ??
    parseAspectRatioParts(String(optionValue));
  const { rw, rh } = parsed ?? { rw: 16, rh: 9 };
  const { width, height } = aspectWireframePixelSize(rw, rh, 30);
  return (
    <div
      className="shrink-0 rounded-[3px] border border-white/45 bg-transparent"
      style={{ width, height }}
      aria-hidden
    />
  );
}

/**
 * 合并参数面板内专用：分段控件，无下拉（与创作参数预览一致）
 */
function HomeToolbarComboPanelField({
  fieldKey,
  field,
  selectedValues,
  onValuesChange,
  modelUrl,
}: {
  fieldKey: string;
  field: NonNullable<ModelParamSchema["schema"]>[string];
  selectedValues: Record<string, string>;
  onValuesChange: (next: Record<string, string>) => void;
  modelUrl?: string;
}) {
  if (!field) return null;

  // pixverse-5-6 1080p 分辨率不支持 duration=10，禁用该选项
  const isPixverse56Duration =
    fieldKey === "duration" && modelUrl?.includes("pixverse-5-6");
  const is1080p = selectedValues.resolution === "1080p";

  if (field.type === "number") {
    const numValue = selectedValues[fieldKey] ?? String(field.min ?? 0);
    return (
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-semibold text-white/50">
          {field.label}
        </span>
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={numValue}
          onChange={(e) =>
            onValuesChange({ ...selectedValues, [fieldKey]: e.target.value })
          }
          placeholder={String(field.min ?? 0)}
          className={cn(
            "w-full rounded-lg border border-white/[0.08] px-3 py-2.5 text-sm font-bold text-white placeholder:text-white/20 outline-none transition-colors hover:border-white/[0.12] focus:border-violet-500/50",
            TOOLBAR_PARAMS_SURFACE_CLASS,
          )}
          aria-label={field.label}
        />
      </div>
    );
  }

  if (field.type !== "select") return null;

  const value =
    selectedValues[fieldKey] ?? String(field.options[0]?.value ?? "");
  const cols = field.options.length;

  if (fieldKey === "aspectRatio") {
    return (
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-semibold text-white/50">
          {field.label}
        </span>
        <div
          role="radiogroup"
          aria-label={field.label}
          className={cn(
            "rounded-[10px] border border-white/[0.08] p-1.5",
            TOOLBAR_PARAMS_SURFACE_CLASS,
          )}
        >
          <div
            className="grid w-full gap-1"
            style={{
              gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))`,
            }}
          >
            {field.options.map((opt) => {
              const v = String(opt.value);
              const selected = v === String(value);
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    onValuesChange({ ...selectedValues, [fieldKey]: v })
                  }
                  className={cn(
                    "flex min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 py-2 transition-colors duration-200",
                    selected
                      ? "bg-[#252836] text-white"
                      : "text-white/45 hover:bg-white/[0.06] hover:text-white/75",
                  )}
                >
                  <div className="flex h-9 w-full items-center justify-center">
                    <AspectRatioWireframe
                      optionLabel={opt.label}
                      optionValue={v}
                    />
                  </div>
                  <span className="text-center text-[11px] font-semibold leading-tight">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[11px] font-semibold text-white/50">
        {field.label}
      </span>
      <div
        role="radiogroup"
        aria-label={field.label}
        className={cn(
          "flex rounded-[10px] border border-white/[0.08] p-1",
          TOOLBAR_PARAMS_SURFACE_CLASS,
        )}
      >
        {field.options.map((opt) => {
          const v = String(opt.value);
          const selected = v === String(value);
          // pixverse-5-6 1080p 分辨率不支持 duration=10，禁用该选项
          const isDisabled1080pDuration =
            isPixverse56Duration && is1080p && v === "10";
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={isDisabled1080pDuration}
              onClick={() => {
                if (!isDisabled1080pDuration) {
                  onValuesChange({ ...selectedValues, [fieldKey]: v });
                }
              }}
              className={cn(
                "min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-bold transition-colors duration-200",
                isDisabled1080pDuration
                  ? "cursor-not-allowed text-white/20"
                  : selected
                    ? "cursor-pointer bg-[#252836] text-white"
                    : "cursor-pointer text-white/40 hover:text-white/70",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** aspectRatio / duration / resolution 合并为一键，点击展开面板内再改 */
function HomeToolbarInlineParamsCombo({
  inlineEntries,
  selectedValues,
  onValuesChange,
  modelUrl,
}: {
  inlineEntries: [string, NonNullable<ModelParamSchema["schema"]>[string]][];
  selectedValues: Record<string, string>;
  onValuesChange: (next: Record<string, string>) => void;
  modelUrl?: string;
}) {
  const sorted = sortInlineParamEntries(inlineEntries);
  if (sorted.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={toolbarComboTriggerClass}
          aria-label="Aspect ratio, duration and resolution"
        >
          {sorted.map(([fieldKey, field], idx) => {
            if (!field) return null;
            let segment: React.ReactNode = null;
            if (field.type === "select") {
              const raw =
                selectedValues[fieldKey] ??
                String(field.options[0]?.value ?? "");
              const label = getSelectOptionLabel(field, raw);
              const Icon =
                fieldKey === "aspectRatio"
                  ? RectangleHorizontal
                  : fieldKey === "duration"
                    ? Clock
                    : null;
              segment = (
                <span className="flex items-center gap-1.5 px-1">
                  {Icon ? (
                    <Icon
                      className="size-3.5 shrink-0 text-white/55"
                      aria-hidden
                    />
                  ) : null}
                  <span className="whitespace-nowrap text-white/90">
                    {label}
                  </span>
                </span>
              );
            } else {
              const raw = selectedValues[fieldKey] ?? String(field.min ?? 0);
              segment = (
                <span className="px-1 whitespace-nowrap text-white/90">
                  {raw}
                </span>
              );
            }
            return (
              <React.Fragment key={fieldKey}>
                {idx > 0 ? (
                  <span
                    className="mx-0.5 h-4 w-px shrink-0 bg-white/[0.14]"
                    aria-hidden
                  />
                ) : null}
                {segment}
              </React.Fragment>
            );
          })}
          <ChevronDown
            className="ml-1 size-3 shrink-0 text-white/35"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          TOOLBAR_PARAMS_DROPDOWN_CLASS,
          "min-w-[min(100vw-2rem,380px)] max-w-[min(100vw-2rem,420px)]",
        )}
        sideOffset={6}
        align="start"
      >
        <div className="flex flex-col gap-6">
          {sorted.map(([fieldKey, field]) => (
            <HomeToolbarComboPanelField
              key={fieldKey}
              fieldKey={fieldKey}
              field={field}
              selectedValues={selectedValues}
              onValuesChange={onValuesChange}
              modelUrl={modelUrl}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 下拉面板中的参数字段（select 或 number） */
function HomeToolbarDropdownFieldItem({
  fieldKey,
  field,
  selectedValues,
  onValuesChange,
}: {
  fieldKey: string;
  field: NonNullable<ModelParamSchema["schema"]>[string];
  selectedValues: Record<string, string>;
  onValuesChange: (next: Record<string, string>) => void;
}) {
  if (!field) return null;

  if (field.type === "number") {
    const numValue = selectedValues[fieldKey] ?? String(field.min ?? 0);
    const isSeed = fieldKey === "seed";

    const handleRandomSeed = () => {
      const max = field.max ?? 9999999999;
      const random = Math.floor(Math.random() * max);
      onValuesChange({ ...selectedValues, [fieldKey]: String(random) });
    };

    return (
      <div key={fieldKey} className="flex min-w-0 flex-col gap-2.5">
        <span className="text-[11px] font-semibold text-white/50">
          {field.label}
        </span>
        {isSeed ? (
          <div className="relative flex items-center">
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={numValue}
              onChange={(e) =>
                onValuesChange({
                  ...selectedValues,
                  [fieldKey]: e.target.value,
                })
              }
              placeholder={String(field.min ?? 0)}
              className={cn(
                "w-full rounded-lg border border-white/[0.08] px-3 py-2.5 pr-10 font-mono text-sm font-bold tabular-nums text-white placeholder:text-white/20 outline-none transition-colors hover:border-white/[0.12] focus:border-violet-500/50",
                TOOLBAR_PARAMS_SURFACE_CLASS,
              )}
              aria-label={field.label}
            />
            <button
              type="button"
              onClick={handleRandomSeed}
              aria-label="Randomize seed"
              className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-white/40 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white/80",
              )}
            >
              <Shuffle className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={numValue}
            onChange={(e) =>
              onValuesChange({ ...selectedValues, [fieldKey]: e.target.value })
            }
            placeholder={String(field.min ?? 0)}
            className={cn(
              "w-full rounded-lg border border-white/[0.08] px-3 py-2.5 font-mono text-sm font-bold tabular-nums text-white placeholder:text-white/20 outline-none transition-colors hover:border-white/[0.12] focus:border-violet-500/50",
              TOOLBAR_PARAMS_SURFACE_CLASS,
            )}
            aria-label={field.label}
          />
        )}
      </div>
    );
  }

  if (field.type === "select") {
    const value =
      selectedValues[fieldKey] ?? String(field.options[0]?.value ?? "");
    return (
      <div key={fieldKey} className="flex min-w-0 flex-col gap-2.5">
        <span className="text-[11px] font-semibold text-white/50">
          {field.label}
        </span>
        <Select
          value={value}
          onValueChange={(v) =>
            onValuesChange({ ...selectedValues, [fieldKey]: v })
          }
        >
          <SelectTrigger
            size="sm"
            className={cn(
              "h-auto w-full min-h-10 justify-between rounded-lg border border-white/[0.08] py-2.5 pl-3 pr-3 text-sm font-bold text-white shadow-none hover:border-white/[0.12] focus:border-violet-500/50 focus:ring-0",
              TOOLBAR_PARAMS_SURFACE_CLASS,
            )}
            aria-label={field.label}
          >
            <SelectValue placeholder={field.label} />
          </SelectTrigger>
          <SelectContent
            className={cn(
              TOOLBAR_PARAMS_DROPDOWN_CLASS,
              "min-w-[var(--radix-select-trigger-width)]",
            )}
            position="popper"
          >
            {field.options.map((opt) => (
              <SelectItem
                key={String(opt.value)}
                value={String(opt.value)}
                className="cursor-pointer rounded-lg text-sm font-semibold focus:bg-white/[0.08] focus:text-white"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
}

/**
 * 工具栏参数组件：
 * - 常用参数（aspectRatio、duration、resolution）合并为一个按钮，点击展开面板
 * - 其余参数（seed 等）收拢到「N more」下拉面板
 */
function HomeToolbarParamSelects({
  schema,
  selectedValues,
  onValuesChange,
  modelUrl,
}: {
  schema: ModelParamSchema;
  selectedValues: Record<string, string>;
  onValuesChange: (next: Record<string, string>) => void;
  modelUrl?: string;
}) {
  if (!schema.schema) return null;

  const entries = Object.entries(schema.schema);
  const inlineEntries = entries.filter(([k]) => INLINE_PARAM_KEYS.has(k));
  const dropdownEntries = entries.filter(([k]) => !INLINE_PARAM_KEYS.has(k));

  // 仅 1 个 inline 且无「more」时用裸 pill；2 个及以上仍用合并 combo，避免视频等场景变成两个竖排小圆钮
  const noDropdown = dropdownEntries.length === 0;
  const useSingleBarePill = noDropdown && inlineEntries.length === 1;

  return (
    <>
      {useSingleBarePill ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {inlineEntries.map(([fieldKey, field]) => {
            if (!field) return null;
            if (field.type === "select") {
              const raw =
                selectedValues[fieldKey] ??
                String(field.options[0]?.value ?? "");
              const Icon =
                fieldKey === "aspectRatio"
                  ? RectangleHorizontal
                  : fieldKey === "duration"
                    ? Clock
                    : null;
              return (
                <DropdownMenu key={fieldKey}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        toolbarPillSurfaceClass,
                        "inline-flex min-h-8 items-center gap-1.5 px-2.5 py-1.5",
                      )}
                      aria-label={field.label}
                    >
                      {Icon ? (
                        <Icon
                          className="size-3.5 shrink-0 text-white/55"
                          aria-hidden
                        />
                      ) : null}
                      <span className="whitespace-nowrap text-white/90">
                        {getSelectOptionLabel(field, raw)}
                      </span>
                      <ChevronDown
                        className="size-3 shrink-0 text-white/35"
                        aria-hidden
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={cn(
                      TOOLBAR_PARAMS_DROPDOWN_CLASS,
                      "min-w-[min(100vw-2rem,380px)] max-w-[min(100vw-2rem,420px)]",
                    )}
                    sideOffset={6}
                    align="start"
                  >
                    <div className="flex flex-col gap-6">
                      <HomeToolbarComboPanelField
                        fieldKey={fieldKey}
                        field={field}
                        selectedValues={selectedValues}
                        onValuesChange={onValuesChange}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            // number 类型：点击弹出滑块
            const numRaw = selectedValues[fieldKey] ?? String(field.min ?? 0);
            const numVal = Number(numRaw) || field.min || 0;
            const min = field.min ?? 0;
            const max = field.max ?? 100;
            const step = field.step ?? 1;
            return (
              <DropdownMenu key={fieldKey}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      toolbarPillSurfaceClass,
                      "inline-flex min-h-8 items-center gap-1 px-2.5 py-1.5",
                    )}
                    aria-label={field.label}
                  >
                    <span className="whitespace-nowrap text-white/90">
                      {field.label}: {numRaw}
                    </span>
                    <ChevronDown
                      className="size-3 shrink-0 text-white/35"
                      aria-hidden
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(TOOLBAR_PARAMS_DROPDOWN_CLASS, "min-w-[200px]")}
                  sideOffset={6}
                  align="start"
                >
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-semibold text-white/50">
                      {field.label}
                    </span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={numVal}
                      onChange={(e) =>
                        onValuesChange({
                          ...selectedValues,
                          [fieldKey]: e.target.value,
                        })
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-violet-500"
                      aria-label={field.label}
                    />
                    <span className="text-right text-xs font-bold text-white/80">
                      {numRaw}
                    </span>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>
      ) : inlineEntries.length > 0 ? (
        <HomeToolbarInlineParamsCombo
          inlineEntries={inlineEntries}
          selectedValues={selectedValues}
          onValuesChange={onValuesChange}
          modelUrl={modelUrl}
        />
      ) : null}

      {/* 其余参数折叠到下拉面板 */}
      {dropdownEntries.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                toolbarSelectTriggerClass,
                "flex items-center gap-1.5 px-3",
              )}
              aria-label="More parameters"
            >
              <Settings2
                className="size-3.5 shrink-0 text-white/45"
                aria-hidden
              />
              <span className="text-xs font-semibold text-white/75">
                {dropdownEntries.length} more
              </span>
              <ChevronDown
                className="size-3 shrink-0 text-white/35"
                aria-hidden
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className={cn(
              TOOLBAR_PARAMS_DROPDOWN_CLASS,
              "w-[min(100vw-2rem,380px)]",
            )}
            sideOffset={6}
            align="start"
          >
            <div className="flex flex-col gap-5">
              {dropdownEntries.map(([fieldKey, field]) => (
                <HomeToolbarDropdownFieldItem
                  key={fieldKey}
                  fieldKey={fieldKey}
                  field={field}
                  selectedValues={selectedValues}
                  onValuesChange={onValuesChange}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

function applyPlaygroundSchemaDefaults(
  config: PlaygroundConfig | undefined,
  base: Record<string, unknown>,
): Record<string, any> {
  if (!config?.schema) return { ...base };
  const out: Record<string, any> = { ...base };
  for (const [key, field] of Object.entries(config.schema)) {
    if (
      out[key] === undefined &&
      field &&
      typeof field === "object" &&
      "defaultValue" in field &&
      (field as { defaultValue?: unknown }).defaultValue !== undefined
    ) {
      out[key] = (field as { defaultValue: unknown }).defaultValue;
    }
  }
  return out;
}

async function uploadHomeReferenceFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);
  const response = await fetch("/api/storage/upload-image", {
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
}

const AUTO_GENERATE_FLAG = "creator-auto-generate";

type HomeCanvasGraphNode =
  | {
      id: string;
      kind: "workflow";
      subtype:
        | "text-to-image"
        | "image-to-image"
        | "text-to-video"
        | "image-to-video";
      position: { x: number; y: number };
      size: { width: number; height: number };
      data: {
        sceneId: string;
        sceneLabel: string;
        modelUrl: string;
        modelLabel: string;
        prompt: string;
        aspectRatio?: string;
        count?: number;
        settings: Record<string, any>;
        status: "idle";
      };
    }
  | {
      id: string;
      kind: "input";
      subtype: "upload";
      position: { x: number; y: number };
      size: { width: number; height: number };
      data: {
        label: string;
        prompt: string;
        mediaKind: "image";
        url: string;
        status: "success";
      };
    };

type HomeCanvasGraphEdge = {
  id: string;
  source: string;
  target: string;
  semantic: "reference";
};

type HomeCanvasGraph = {
  nodes: HomeCanvasGraphNode[];
  edges: HomeCanvasGraphEdge[];
  viewport: { x: number; y: number; scale: number };
  selection: { nodeId: string | null; edgeId: string | null };
  composer: { nodeId: string | null; references: [] };
  commandMenu: null;
};

function buildHomeCanvasInitialGraph(params: {
  sceneId: string;
  sceneLabel: string;
  modelUrl: string;
  modelLabel: string;
  prompt: string;
  selectedValues: Record<string, string>;
  referenceUrl?: string;
}): HomeCanvasGraph {
  const workflowNodeId = crypto.randomUUID();
  const workflowNode: HomeCanvasGraphNode = {
    id: workflowNodeId,
    kind: "workflow",
    subtype: params.modelUrl.includes("/text-to-video")
      ? "text-to-video"
      : params.modelUrl.includes("/image-to-video")
        ? "image-to-video"
        : params.modelUrl.includes("/image-to-image")
          ? "image-to-image"
          : "text-to-image",
    position: { x: 260, y: 180 },
    size: { width: 228, height: 228 },
    data: {
      sceneId: params.sceneId,
      sceneLabel: params.sceneLabel,
      modelUrl: params.modelUrl,
      modelLabel: params.modelLabel,
      prompt: params.prompt,
      aspectRatio: params.selectedValues.aspectRatio || "1:1",
      count: Number(params.selectedValues.count || 1),
      settings: {
        ...params.selectedValues,
        prompt: params.prompt,
      },
      status: "idle",
    },
  };

  const nodes: HomeCanvasGraphNode[] = [workflowNode];
  const edges: HomeCanvasGraphEdge[] = [];

  if (params.referenceUrl) {
    const inputNodeId = crypto.randomUUID();
    nodes.push({
      id: inputNodeId,
      kind: "input",
      subtype: "upload",
      position: { x: 20, y: 160 },
      size: { width: 270, height: 270 },
      data: {
        label: "参考图",
        prompt: "首页带入的参考图",
        mediaKind: "image",
        url: params.referenceUrl,
        status: "success",
      },
    });
    edges.push({
      id: crypto.randomUUID(),
      source: inputNodeId,
      target: workflowNodeId,
      semantic: "reference",
    });
  }

  return {
    nodes,
    edges,
    viewport: { x: 140, y: 120, scale: 1 },
    selection: { nodeId: workflowNodeId, edgeId: null },
    composer: { nodeId: workflowNodeId, references: [] },
    commandMenu: null,
  };
}

function scheduleIdleWork(work: () => void, timeout = 900) {
  if (typeof window === "undefined") return () => {};

  const win = window as Window & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (typeof win.requestIdleCallback === "function") {
    const id = win.requestIdleCallback(work, { timeout });
    return () => win.cancelIdleCallback?.(id);
  }

  const timer = window.setTimeout(work, 220);
  return () => window.clearTimeout(timer);
}

export function HomeComposerSection({
  className,
  headerNavItems = [],
}: {
  className?: string;
  headerNavItems?: NavItem[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("landing.wavespeed");
  const { user, setIsShowSignModal } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>("image");
  const [prompt, setPrompt] = useState("");
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>("");
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(
    {},
  );
  const [homeRefAttachment, setHomeRefAttachment] = useState<{
    url: string;
    preview: string;
  } | null>(null);
  const [homeRefUploading, setHomeRefUploading] = useState(false);
  const [playgroundRegistry, setPlaygroundRegistry] = useState<
    Record<string, PlaygroundConfig>
  >({});
  const [enableDeferredWork, setEnableDeferredWork] = useState(false);
  const [sceneSelectOpen, setSceneSelectOpen] = useState(false);
  const [modelSelectOpen, setModelSelectOpen] = useState(false);
  const deferredPrompt = useDeferredValue(prompt);
  const deferredSelectedValues = useDeferredValue(selectedValues);

  const { checkAccess, checkGeoLocation } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
    checkGeoOnMount: false, // 首页首屏不应等待地理定位 fetch，延后执行
  });

  // 首屏先把输入框本体渲染出来，再在 idle 阶段启动非关键工作
  useEffect(() => {
    return scheduleIdleWork(() => {
      setEnableDeferredWork(true);
    });
  }, []);

  // 懒加载 playground config 注册表，避免首屏同步解析大体积配置
  useEffect(() => {
    if (!enableDeferredWork) return;

    let mounted = true;
    getPlaygroundConfigRegistry().then((registry) => {
      if (mounted) {
        setPlaygroundRegistry(registry);
      }
    });

    return () => {
      mounted = false;
    };
  }, [enableDeferredWork]);

  const allScenes = useMemo(
    () => extractImageAiScenes(headerNavItems),
    [headerNavItems],
  );

  const filteredScenes = useMemo(
    () => filterScenesByTab(allScenes, activeTab),
    [allScenes, activeTab],
  );

  const handleTabChange = useCallback((tab: HomeTab) => {
    setActiveTab(tab);
    setSelectedSceneId("");
    setSelectedModelUrl("");
    setSelectedValues({});
  }, []);

  const currentScene = useMemo<SceneNode | null>(() => {
    if (!selectedSceneId) return null;
    return (
      filteredScenes.find((s) => s.id === selectedSceneId) ??
      filteredScenes[0] ??
      null
    );
  }, [selectedSceneId, filteredScenes]);

  const defaultScene = useMemo<SceneNode | null>(() => {
    if (activeTab === "video")
      return findFirstSceneWithWorkspace(allScenes, "Video");
    return findFirstSceneWithWorkspace(allScenes, "Image");
  }, [activeTab, allScenes]);

  const activeScene = currentScene ?? defaultScene;
  const activeModels = activeScene?.children ?? [];
  const activeModel = useMemo<ModelNode | null>(() => {
    if (!selectedModelUrl) return null;
    return activeModels.find((m) => m.url === selectedModelUrl) ?? null;
  }, [selectedModelUrl, activeModels]);

  // currentModelUrl 为完整 URL，用于 playground config 查找和工具栏 schema 推导。
  // 叶子场景（如 Qwen 分层 / 抠图 / 放大）仅有 scene.url、无子模型，需回退到 activeScene.url。
  const currentModelUrl =
    activeModel?.url ??
    resolveDefaultHomeModelUrl(activeScene ?? undefined) ??
    activeModels[0]?.url ??
    activeScene?.url ??
    "";
  const selectedModelNode = useMemo<ModelNode | null>(
    () =>
      activeModels.find((model) => model.url === currentModelUrl) ??
      activeModel ??
      activeModels[0] ??
      null,
    [activeModel, activeModels, currentModelUrl],
  );

  // 根据 playground config 判断当前场景/模型是否需要参考图上传（useMemo 推导，无时序问题）
  const computedNeedsAttachment = useMemo(() => {
    if (!currentModelUrl) return false;

    // 注册表加载完成后，通过 URL 映射查找对应配置
    if (Object.keys(playgroundRegistry).length > 0) {
      const registryKey = REGISTRY_KEY_BY_URL[currentModelUrl];
      const config = registryKey ? playgroundRegistry[registryKey] : undefined;
      if (config) {
        return Boolean(config?.schema?.referenceImages);
      }
    }

    // 注册表未加载时，用 URL 关键字兜底（含无子项的独立工具页）
    return (
      currentModelUrl.includes("/image-to-image") ||
      currentModelUrl.includes("/image-to-video") ||
      currentModelUrl.includes("/motion-control/") ||
      currentModelUrl === "/qwen-image-layered" ||
      currentModelUrl === "/image-background-remover" ||
      currentModelUrl === "/image-upscaler"
    );
  }, [currentModelUrl, playgroundRegistry]);

  // needsAttachment 变为 false 时同步清空附件
  useEffect(() => {
    if (!computedNeedsAttachment && homeRefAttachment) {
      setHomeRefAttachment((prev) => {
        if (prev?.preview.startsWith("blob:")) {
          URL.revokeObjectURL(prev.preview);
        }
        return null;
      });
    }
  }, [computedNeedsAttachment]);

  const currentSchema = useMemo<ModelParamSchema>(
    () => getDefaultParamsForModel(currentModelUrl),
    [currentModelUrl],
  );

  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const p of currentSchema.params) {
      defaults[p.key] = p.value;
    }
    setSelectedValues(defaults);
  }, [currentSchema]);

  // pixverse-5-6 1080p 分辨率不支持 duration=10，自动调整到 8s
  useEffect(() => {
    const isPixverse56 = currentModelUrl?.includes("pixverse-5-6");
    const is1080p = selectedValues.resolution === "1080p";
    const currentDuration = selectedValues.duration;

    if (isPixverse56 && is1080p && currentDuration === "10") {
      setSelectedValues((prev) => ({ ...prev, duration: "8" }));
    }
  }, [selectedValues.resolution, selectedValues.duration, currentModelUrl]);

  const modelLogo = useMemo(() => {
    if (!currentModelUrl) return { url: undefined, needsWhiteBg: false };
    return getModelVendorLogo({
      url: currentModelUrl,
      title: activeModel?.title ?? activeModels[0]?.title ?? activeScene?.title,
    });
  }, [currentModelUrl, activeModel, activeModels, activeScene?.title]);

  const playgroundConfig = useMemo(() => {
    if (!currentModelUrl) return undefined;
    const registryKey = REGISTRY_KEY_BY_URL[currentModelUrl];
    if (!registryKey) return undefined;
    return playgroundRegistry[registryKey] ?? undefined;
  }, [currentModelUrl, playgroundRegistry]);

  const estimateInputValues = useMemo(() => {
    const base: Record<string, any> = {
      prompt: deferredPrompt,
      ...deferredSelectedValues,
    };

    if (homeRefAttachment?.url) {
      base.referenceImages = [
        {
          id: "home-composer-ref",
          preview: homeRefAttachment.preview,
          url: homeRefAttachment.url,
          status: "uploaded" as const,
        },
      ];
    } else {
      base.referenceImages = [];
    }

    // 部分模型 estimateParams 读取的字段名与 toolbar schema 不一致，在此做映射
    // aspectRatio 格式为 "16:9"（W:H），转为 "W*H" 格式
    if (
      !base.size &&
      base.aspectRatio &&
      /^\d+\*\d+$/.test(String(base.aspectRatio))
    ) {
      base.size = String(base.aspectRatio);
    }
    // aspectRatio 为 "16:9" / "9:16" / "1:1" 等，创作台期望 "W*H" 格式，在此转换
    if (
      !base.size &&
      base.aspectRatio &&
      /^\d+:\d+$/.test(String(base.aspectRatio))
    ) {
      const [w, h] = String(base.aspectRatio).split(":").map(Number);
      if (w && h) {
        base.size = `${w}*${h}`;
      }
    }
    if (!base.size && base.resolution && /\*/.test(String(base.resolution))) {
      base.size = String(base.resolution);
    }
    // flux-2-klein 用 width*height 格式
    if (!base.size && base.width && base.height) {
      base.size = `${base.width}*${base.height}`;
    }
    // ltx2-fast 创作台默认开启音频，首页工具栏未暴露此开关，默认开启以保持计费一致
    if (
      currentModelUrl?.includes("ltx2-fast") &&
      base.generateAudio === undefined
    ) {
      base.generateAudio = true;
    }

    // 首页工具栏的 generateAudio 是 select（值为 "true"/"false" 字符串），
    // 而 estimateParams 期望 boolean，Boolean("false") === true，需要先判断再转换
    if (base.generateAudio !== undefined) {
      const audioOn = base.generateAudio === "true";
      base.generateAudio = audioOn;
      // 部分模型使用 snake_case
      if (currentModelUrl?.includes("pixverse-5-6")) {
        base.generate_audio_switch = audioOn;
      } else {
        base.generate_audio = audioOn;
      }
    }

    // seedance-1-5-pro 的 estimateParams 期望 duration 为 number、cameraFixed 为 boolean
    if (currentModelUrl?.includes("seedance-1-5-pro")) {
      if (base.duration !== undefined) {
        base.duration = Number(base.duration) || 5;
      }
      if (base.cameraFixed !== undefined) {
        base.cameraFixed = base.cameraFixed === "true";
      }
    }

    return applyPlaygroundSchemaDefaults(playgroundConfig, base);
  }, [
    deferredPrompt,
    deferredSelectedValues,
    homeRefAttachment,
    playgroundConfig,
    currentModelUrl,
  ]);

  const estimateParamsRaw = useMemo(() => {
    if (!playgroundConfig?.estimateParams) return undefined;
    return playgroundConfig.estimateParams(estimateInputValues);
  }, [playgroundConfig, estimateInputValues]);

  const estimateParamsWithModel = useMemo(() => {
    if (!currentModelUrl) return {};
    if (estimateParamsRaw === undefined) {
      return { __modelUrl: currentModelUrl };
    }
    return { ...estimateParamsRaw, __modelUrl: currentModelUrl };
  }, [estimateParamsRaw, currentModelUrl]);

  const creditScenario =
    playgroundConfig?.creditScenario ?? "flux-2-klein-text-to-image";

  const { credits: requiredCredits, isLoading: isEstimatingCredits } =
    useEstimateCredits(creditScenario, estimateParamsWithModel, {
      enabled: Boolean(
        enableDeferredWork &&
        playgroundConfig &&
        currentModelUrl &&
        !homeRefUploading,
      ),
      debounceMs: 650,
    });

  const creditsCostLabel = useMemo(() => {
    if (!playgroundConfig || !currentModelUrl) return "—";
    if (homeRefUploading) return "…";
    if (isEstimatingCredits && requiredCredits === null) return "…";
    if (requiredCredits !== null) {
      return t("homeComposer.credits", { count: requiredCredits });
    }
    return "—";
  }, [
    playgroundConfig,
    currentModelUrl,
    homeRefUploading,
    isEstimatingCredits,
    requiredCredits,
    t,
  ]);

  const handleSceneChange = useCallback((sceneId: string) => {
    setSelectedSceneId(sceneId);
    setSelectedModelUrl("");
    setSelectedValues({});
    // 切换场景时清空参考图上传
    setHomeRefAttachment((prev) => {
      if (prev?.preview.startsWith("blob:")) {
        URL.revokeObjectURL(prev.preview);
      }
      return null;
    });
  }, []);

  const handleModelChange = useCallback((modelUrl: string) => {
    setSelectedModelUrl(modelUrl);
  }, []);

  const handleHomeRefFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      // 首次交互时触发地理检查（不阻塞首屏），之后检查权限
      await checkGeoLocation();
      const access = checkAccess();
      if (!access.passed) return;

      setHomeRefUploading(true);
      try {
        const preview = URL.createObjectURL(file);
        const url = await uploadHomeReferenceFile(file);
        setHomeRefAttachment((prev) => {
          if (prev?.preview.startsWith("blob:")) {
            URL.revokeObjectURL(prev.preview);
          }
          return { url, preview: url };
        });
        URL.revokeObjectURL(preview);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        toast.error(msg);
      } finally {
        setHomeRefUploading(false);
      }
    },
    [checkAccess],
  );

  const clearHomeRefAttachment = useCallback(() => {
    setHomeRefAttachment((prev) => {
      if (prev?.preview.startsWith("blob:")) {
        URL.revokeObjectURL(prev.preview);
      }
      return null;
    });
  }, []);

  const goToCreator = useCallback(
    (autoGenerate: boolean = false) => {
      if (!activeScene) return;
      const trimmed = prompt.trim();

      if (typeof window !== "undefined") {
        // 优先使用 sessionStorage 传递参数（用于同标签页内跳转）
        if (trimmed) {
          sessionStorage.setItem("creator-initial-prompt", trimmed);
        }
        if (Object.keys(selectedValues).length > 0) {
          sessionStorage.setItem(
            "creator-initial-params",
            JSON.stringify(selectedValues),
          );
        }
        if (homeRefAttachment?.url) {
          sessionStorage.setItem("creator-initial-ref", homeRefAttachment.url);
        } else {
          sessionStorage.removeItem("creator-initial-ref");
        }
        if (autoGenerate) {
          sessionStorage.setItem(AUTO_GENERATE_FLAG, "1");
        } else {
          sessionStorage.removeItem(AUTO_GENERATE_FLAG);
        }
      }

      // 构建 URL 参数（只包含 scene 和 model，支持外部链接分享）
      // prompt、params、auto 等参数通过 sessionStorage 传递
      const params = new URLSearchParams();
      params.set("scene", activeScene.id);
      if (currentModelUrl) {
        params.set("model", getModelSlug(currentModelUrl));
      }
      router.push(`/creator?${params.toString()}`);
    },
    [
      activeScene,
      currentModelUrl,
      prompt,
      router,
      selectedValues,
      homeRefAttachment,
    ],
  );

  const handleSendWithGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(t("homeComposer.toastPromptRequired"));
      return;
    }
    goToCreator(true);
  }, [prompt, goToCreator, t]);

  const handleOpenInCanvas = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error(t("homeComposer.toastPromptRequired"));
      return;
    }
    if (computedNeedsAttachment && !homeRefAttachment?.url) {
      toast.error(
        t("homeComposer.toastAttachmentRequired") || "请先上传参考图",
      );
      return;
    }
    if (!user) {
      setIsShowSignModal(true);
      return;
    }
    if (!activeScene || !currentModelUrl) {
      toast.error("当前场景不可用");
      return;
    }

    try {
      const initialGraph = buildHomeCanvasInitialGraph({
        sceneId: activeScene.id,
        sceneLabel: activeScene.title,
        modelUrl: currentModelUrl,
        modelLabel: selectedModelNode?.title ?? activeScene.title,
        prompt: trimmed,
        selectedValues,
        referenceUrl: homeRefAttachment?.url,
      });

      const response = await fetch("/api/workbench/canvas-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmed.slice(0, 48),
          entrySceneId: activeScene.id,
          entryModelUrl: currentModelUrl,
          initialGraph,
          meta: {
            source: "homepage",
          },
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || !result?.data?.project?.id) {
        throw new Error(result?.message || "创建高级模式项目失败");
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `${CANVAS_AGENT_AUTO_OPEN_STORAGE_KEY_PREFIX}${result.data.project.id}`,
          "1",
        );
      }
      window.location.assign(
        `/${locale}/create/canvas/${result.data.project.id}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "创建高级模式项目失败",
      );
    }
  }, [
    prompt,
    t,
    computedNeedsAttachment,
    homeRefAttachment,
    user,
    activeScene,
    currentModelUrl,
    selectedModelNode?.title,
    selectedValues,
    locale,
    setIsShowSignModal,
  ]);

  // 处理 Enter 键触发生成（Shift+Enter 换行）
  const needsAttachmentRef = useRef(false);
  needsAttachmentRef.current = computedNeedsAttachment;
  const handlePromptKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (!prompt.trim()) {
          toast.error(t("homeComposer.toastPromptRequired"));
          return;
        }
        if (needsAttachmentRef.current && !homeRefAttachment) {
          toast.error(
            t("homeComposer.toastAttachmentRequired") || "请先上传参考图",
          );
          return;
        }
        goToCreator(true);
      }
    },
    [prompt, homeRefAttachment, goToCreator, t],
  );

  const tabs: { id: HomeTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "image",
      label: t("homeComposer.tabImage"),
      icon: <ImageIcon className="size-[1.05rem] sm:size-[1.15rem]" />,
    },
    {
      id: "video",
      label: t("homeComposer.tabVideo"),
      icon: <Clapperboard className="size-[1.05rem] sm:size-[1.15rem]" />,
    },
  ];

  return (
    <section
      className={cn(
        "relative bg-transparent pt-3 pb-8 text-white md:pt-4 md:pb-10",
        className,
      )}
    >
      <div
        className={landingSidebarRowCenteredCn(
          "relative z-10 mx-auto w-full 2xl:max-w-[1600px] px-5",
        )}
      >
        <div className="mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative w-full overflow-hidden rounded-[2rem] border border-[color:var(--color-frost-border)] bg-[#0a0a0c] shadow-[var(--shadow-ring-frost),0_24px_80px_rgba(0,0,0,0.34)]",
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.015),transparent_22%)]" />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.06,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative min-h-[21.5rem] px-4 py-3.5 sm:min-h-[23rem] sm:px-4.5 sm:py-4"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.02),transparent_24%),radial-gradient(circle_at_80%_88%,rgba(255,255,255,0.014),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.012),transparent_18%,transparent_82%,rgba(255,255,255,0.008))]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="pointer-events-none absolute inset-x-[12%] top-[26%] h-40 rounded-full bg-white/[0.014] blur-[90px]" />

              <div
                className="absolute left-5 top-4 z-10 flex items-center gap-1.5 rounded-full border border-[color:var(--color-frost-border-alt)] bg-black/60 p-1 backdrop-blur-xl"
                role="tablist"
                aria-label={t("homeComposer.modeTabsAria")}
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "relative flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold tracking-[-0.015em] transition-all duration-200",
                        isActive
                          ? "bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.08)]"
                          : "text-white/40 hover:text-white/70",
                      )}
                    >
                      <span
                        className={cn(
                          isActive ? "text-black" : "text-white/35",
                        )}
                      >
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {computedNeedsAttachment && (
                <div className="absolute left-5 top-[3.75rem] z-10">
                  {homeRefAttachment ? (
                    <div className="group relative size-[5.75rem] overflow-hidden rounded-[1.15rem] border border-white/[0.08] bg-black/40 shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
                      <img
                        src={homeRefAttachment.preview}
                        alt="Reference"
                        className="size-full object-cover"
                      />
                      {homeRefUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white/80">
                          <Loader2 className="size-4 animate-spin" />
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={clearHomeRefAttachment}
                        className="absolute right-1.5 top-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white/75 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 hover:text-white"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        "flex size-[5.75rem] cursor-pointer items-center justify-center rounded-[1.15rem] border border-dashed border-white/[0.14] bg-white/[0.025] text-white/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200",
                        homeRefUploading
                          ? "cursor-not-allowed border-white/[0.08] opacity-60"
                          : "hover:border-white/[0.24] hover:bg-white/[0.04] hover:text-white/55",
                      )}
                      aria-label={t("homeComposer.uploadAria")}
                      onClick={() => {
                        if (!user) {
                          setIsShowSignModal(true);
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      disabled={homeRefUploading}
                    >
                      {homeRefUploading ? (
                        <Loader2 className="size-[1.35rem] animate-spin" />
                      ) : (
                        <Plus className="size-[1.5rem]" strokeWidth={1.5} />
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleHomeRefFileChange}
                  />
                </div>
              )}

              <label className="block min-h-[16.5rem] cursor-text px-2 pb-[5.5rem] pt-[4.15rem] sm:min-h-[17.5rem] sm:px-2.5">
                <span className="sr-only">{t("homeComposer.promptLabel")}</span>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handlePromptKeyDown}
                  placeholder={t("homeComposer.promptPlaceholder")}
                  rows={6}
                  className={cn(
                    "prompt-input-textarea size-full min-h-[10.5rem] resize-none bg-transparent text-[16px] leading-[1.6] tracking-[-0.02em] text-white/94 placeholder:text-white/18 focus:outline-none sm:min-h-[11.25rem] sm:text-[17px] lg:text-[18px]",
                    computedNeedsAttachment ? "pl-[7.25rem]" : "",
                  )}
                />
              </label>

              <div className="absolute bottom-[4.9rem] right-5 z-10">
                <PromptEnhanceButton
                  prompt={prompt}
                  onEnhanced={setPrompt}
                  mode={activeTab === "video" ? "video" : "image"}
                  image={homeRefAttachment?.url}
                  disabled={homeRefUploading}
                />
              </div>

              <div className="pointer-events-none absolute bottom-4 right-5 text-[10px] font-medium tracking-[-0.01em] text-white/14">
                Shift + Enter for new line
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.12,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute inset-x-4 bottom-3.5 z-10 rounded-[1.15rem] border border-[color:var(--color-frost-border-alt)] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.01))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl"
              >
                <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <Select
                      value={activeScene?.id ?? ""}
                      onValueChange={handleSceneChange}
                      open={sceneSelectOpen}
                      onOpenChange={setSceneSelectOpen}
                    >
                      <SelectTrigger
                        size="sm"
                        className={cn(
                          toolbarSceneSelectTriggerClass,
                          "text-white/85",
                        )}
                        aria-label={t("homeComposer.selectScene")}
                      >
                        <FileImage
                          className="size-3.5 shrink-0 text-white/55"
                          aria-hidden
                        />
                        <SelectValue
                          placeholder={t("homeComposer.selectScene")}
                        >
                          <span className="block truncate text-left">
                            {activeScene?.title ?? ""}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      {sceneSelectOpen ? (
                        <SelectContent
                          className={HOME_COMPOSER_SELECT_CONTENT_CLASS}
                          position="popper"
                        >
                          {filteredScenes.map((scene) => (
                            <SelectItem
                              key={scene.id}
                              value={scene.id}
                              className={HOME_COMPOSER_SELECT_ITEM_CLASS}
                            >
                              <span className="truncate">{scene.title}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      ) : null}
                    </Select>

                    {activeModels.length > 0 ? (
                      <Select
                        value={currentModelUrl}
                        onValueChange={handleModelChange}
                        open={modelSelectOpen}
                        onOpenChange={setModelSelectOpen}
                      >
                        <SelectTrigger
                          size="sm"
                          className={cn(
                            toolbarModelSelectTriggerClass,
                            "min-w-0 flex-[0_1_auto]",
                          )}
                          aria-label={t("homeComposer.selectModel")}
                        >
                          {modelLogo.url ? (
                            <span
                              className={cn(
                                "relative size-4 shrink-0 overflow-hidden rounded-sm",
                                modelLogo.needsWhiteBg && "bg-white",
                              )}
                            >
                              <Image
                                src={modelLogo.url}
                                alt=""
                                width={16}
                                height={16}
                                className="size-4 object-contain"
                                unoptimized
                              />
                            </span>
                          ) : null}
                          <SelectValue
                            placeholder={t("homeComposer.selectModel")}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="whitespace-nowrap text-left">
                                {selectedModelNode?.title ?? ""}
                              </span>
                              {selectedModelNode?.badge ? (
                                <span className="shrink-0 rounded bg-violet-500/80 px-1 py-px text-[10px] font-bold uppercase text-white">
                                  {selectedModelNode.badge}
                                </span>
                              ) : null}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        {modelSelectOpen ? (
                          <SelectContent
                            className={HOME_COMPOSER_SELECT_CONTENT_CLASS}
                            position="popper"
                          >
                            {activeModels.map((model) => {
                              const optionLogoUrl = getModelVendorLogo({
                                url: model.url,
                                title: model.title,
                              });
                              return (
                                <SelectItem
                                  key={model.url}
                                  value={model.url}
                                  className={HOME_COMPOSER_SELECT_ITEM_CLASS}
                                >
                                  <span className="flex items-center gap-2">
                                    {optionLogoUrl.url ? (
                                      <span
                                        className={cn(
                                          "relative size-4 shrink-0 overflow-hidden rounded-sm",
                                          optionLogoUrl.needsWhiteBg &&
                                            "bg-white",
                                        )}
                                      >
                                        <Image
                                          src={optionLogoUrl.url}
                                          alt=""
                                          width={16}
                                          height={16}
                                          className="size-4 object-contain"
                                          unoptimized
                                        />
                                      </span>
                                    ) : null}
                                    <span className="truncate">
                                      {model.title}
                                    </span>
                                    {model.badge ? (
                                      <span className="shrink-0 rounded bg-violet-500/80 px-1 py-px text-[10px] font-bold uppercase text-white">
                                        {model.badge}
                                      </span>
                                    ) : null}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        ) : null}
                      </Select>
                    ) : null}

                    <div className="hidden h-6 w-px shrink-0 bg-white/[0.08] lg:block" />

                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:min-h-9 sm:gap-2">
                      <HomeToolbarParamSelects
                        schema={currentSchema}
                        selectedValues={selectedValues}
                        onValuesChange={setSelectedValues}
                        modelUrl={currentModelUrl}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 border-l border-white/[0.08] pl-2.5">
                    <button
                      type="button"
                      onClick={handleOpenInCanvas}
                      className={cn(
                        "inline-flex h-10 cursor-pointer items-center justify-center rounded-[0.95rem] border border-white/[0.12] px-3.5 text-[13px] font-semibold text-white/76 transition-all duration-200",
                        "bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/[0.22] hover:bg-white/[0.06] hover:text-white",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30",
                        (!prompt.trim() ||
                          (computedNeedsAttachment && !homeRefAttachment)) &&
                          "cursor-not-allowed opacity-60",
                      )}
                      disabled={
                        !prompt.trim() ||
                        (computedNeedsAttachment && !homeRefAttachment)
                      }
                    >
                      Canvas
                    </button>
                    <div className="rounded-[0.9rem] border border-[color:var(--color-frost-border)] bg-transparent px-2.5 py-2 text-[11px] font-medium tabular-nums tracking-tight text-white/38 transition-colors duration-200 hover:bg-white/[0.04] hover:text-white/62">
                      {creditsCostLabel}
                    </div>
                    <PricingPrompt autoPrompt={false}>
                      {() => {
                        return (
                          <button
                            type="button"
                            onClick={handleSendWithGenerate}
                            className={cn(
                              "group relative inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[0.95rem] px-4.5 transition-all duration-200",
                              "bg-primary text-primary-foreground",
                              "shadow-[0_10px_24px_rgba(255,255,255,0.07)] hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_14px_30px_rgba(255,255,255,0.1)]",
                              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
                              (!prompt.trim() ||
                                (computedNeedsAttachment &&
                                  !homeRefAttachment)) &&
                                "cursor-not-allowed opacity-60",
                            )}
                            aria-label={t("homeComposer.sendAria")}
                            disabled={
                              !prompt.trim() ||
                              (computedNeedsAttachment && !homeRefAttachment)
                            }
                          >
                            <span className="text-[13px] font-semibold">
                              Generate
                            </span>
                            <ArrowUp
                              className="size-[0.95rem]"
                              strokeWidth={2.5}
                            />
                          </button>
                        );
                      }}
                    </PricingPrompt>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
