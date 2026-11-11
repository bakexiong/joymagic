"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  Boxes,
  Check,
  ChevronDown,
  ImageIcon,
  Loader2,
  Maximize2,
  MousePointer2,
  Plus,
  Send,
  X,
} from "lucide-react";

import type { FieldSchema } from "@/shared/blocks/desktop-playground";
import { WorkbenchComposerToolbar } from "@/shared/blocks/desktop-playground/components/workbench-composer-toolbar";
import type { StaticFieldSchema } from "@/shared/blocks/desktop-playground/toolbar-schemas";
import { cn } from "@/shared/lib/utils";
import { getCanvasCopy } from "../canvas-copy";
import type {
  CanvasNode,
  CanvasReferenceItem,
  CanvasWorkflowNode,
} from "../core/canvas-types";
import { CanvasContextChip } from "./canvas-context-chip";

type CanvasComposerProps = {
  node: CanvasWorkflowNode;
  x: number;
  y: number;
  references: CanvasReferenceItem[];
  attachableNodes: CanvasNode[];
  modelOptions: Array<{
    url: string;
    label: string;
    badge?: string;
    iconUrl?: string;
    monogram?: string;
  }>;
  parameterFields: Array<{ key: string; field: FieldSchema }>;
  requiredCredits: number | null;
  isGenerating: boolean;
  onPromptChange: (value: string) => void;
  onModelChange: (modelUrl: string) => void;
  onSettingChange: (key: string, value: any) => void;
  onGenerate: () => void;
  onAttachNode: (nodeId: string) => void;
  onAddNode: () => void;
  onRemoveReference: (referenceId: string) => void;
};

function getReferenceLabel(node: CanvasNode) {
  const customTitle = String(node.data.title || "").trim();
  if (customTitle) return customTitle;
  if (node.kind === "result") {
    return node.data.prompt || (node.data.mediaKind === "video" ? "Video" : "Image");
  }
  if (node.kind === "input") {
    return node.data.label || node.data.mediaKind || "Reference";
  }
  return "Reference";
}

function getReferenceThumb(node: CanvasNode) {
  if (node.kind === "result") return node.data.url;
  if (node.kind === "input") return node.data.url;
  return undefined;
}

function getOptionLabel(field: FieldSchema, value: unknown) {
  const option = field.options?.find((item) => item.value === value);
  return option?.label || String(value ?? field.defaultValue ?? "");
}

function toStaticField(field: FieldSchema): StaticFieldSchema | null {
  if (field.type === "select" && field.options) {
    return {
      type: "select",
      label: field.label,
      defaultValue: String(field.defaultValue ?? field.options[0]?.value ?? ""),
      options: field.options.map((option) => ({
        label: option.label,
        value: String(option.value),
      })),
    };
  }

  if (field.type === "number" || field.type === "slider") {
    return {
      type: "number",
      label: field.label,
      defaultValue: Number(field.defaultValue ?? 0),
      min: field.min,
      max: field.max,
      step: field.step,
    };
  }

  return null;
}

function ComposerSelect({
  id,
  value,
  options,
  className,
  menuClassName,
  showIcons = false,
  onChange,
}: {
  id: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
    badge?: string;
    iconUrl?: string;
    monogram?: string;
  }>;
  className?: string;
  menuClassName?: string;
  showIcons?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-[18px] border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-left font-semibold text-white outline-none transition hover:border-white/[0.16] hover:bg-white/[0.06]",
          className,
        )}
        onClick={() => setOpen((next) => !next)}
      >
        {showIcons ? (
          <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[0.62rem] font-bold text-white/70">
            {selected?.iconUrl ? (
              <img
                src={selected.iconUrl}
                alt=""
                className="block size-full object-contain p-0.5"
              />
            ) : (
              selected?.monogram || selected?.label.charAt(0)
            )}
          </span>
        ) : null}
        <span className="max-w-full truncate">{selected?.label || "Select"}</span>
        {selected?.badge ? (
          <span className="rounded-[7px] bg-[#7c4dff] px-1.5 py-0.5 text-[0.62rem] font-black leading-none text-white">
            {selected.badge}
          </span>
        ) : null}
        <ChevronDown className="size-3.5 shrink-0 text-white/50" />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={id}
          className={cn(
            "absolute left-0 top-10 z-[80] w-max min-w-56 rounded-[20px] border border-white/[0.12] bg-[#07080a] p-2 shadow-[0_22px_70px_rgba(0,0,0,0.58)] backdrop-blur-xl",
            menuClassName,
          )}
        >
          <div className="max-h-72 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left text-[0.92rem] font-semibold transition",
                    active
                      ? "bg-white/[0.1] text-white"
                      : "text-white/82 hover:bg-white/[0.07] hover:text-white",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {showIcons ? (
                    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[0.68rem] font-bold text-white/70">
                      {option.iconUrl ? (
                        <img
                          src={option.iconUrl}
                          alt=""
                          className="block size-full object-contain p-0.5"
                        />
                      ) : (
                        option.monogram || option.label.charAt(0)
                      )}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.badge ? (
                    <span className="rounded-[7px] bg-[#7c4dff] px-1.5 py-0.5 text-[0.62rem] font-black leading-none text-white">
                      {option.badge}
                    </span>
                  ) : null}
                  <span className="ml-auto flex size-4 shrink-0 items-center justify-center text-emerald-400">
                    {active ? <Check className="size-4" strokeWidth={3} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CanvasComposer({
  node,
  x,
  y,
  references,
  attachableNodes,
  modelOptions,
  parameterFields,
  requiredCredits,
  isGenerating,
  onPromptChange,
  onModelChange,
  onSettingChange,
  onGenerate,
  onAttachNode,
  onAddNode,
  onRemoveReference,
}: CanvasComposerProps) {
  const locale = useLocale();
  const copy = getCanvasCopy(locale);
  const [isReferencePickerOpen, setIsReferencePickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedModelLabel = useMemo(
    () =>
      modelOptions.find((option) => option.url === node.data.modelUrl)?.label ||
      node.data.modelLabel ||
      modelOptions[0]?.label ||
      "Model",
    [modelOptions, node.data.modelLabel, node.data.modelUrl],
  );
  const referenceHint =
    node.subtype === "image-to-image" || node.subtype === "image-to-video"
      ? copy.common.referenceImage
      : copy.common.referenceNode;
  const toolbarFields = useMemo(
    () =>
      parameterFields.flatMap(({ key, field }) => {
        const staticField = toStaticField(field);
        return staticField ? [{ key, field: staticField }] : [];
      }),
    [parameterFields],
  );
  const imageReferences = useMemo(
    () => references.filter((item) => item.kind === "image" && item.url),
    [references],
  );
  const otherReferences = useMemo(
    () => references.filter((item) => item.kind !== "image" || !item.url),
    [references],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 84), 188)}px`;
  }, [node.data.prompt]);

  return (
    <div
      className="absolute z-30 w-[min(40rem,calc(100vw-4rem))] rounded-[22px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(31,31,32,0.96),rgba(28,28,29,0.94))] p-2.5 shadow-[0_22px_72px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-[11px] border border-white/[0.08] bg-white/[0.05] text-white/58 transition hover:bg-white/[0.09] hover:text-white"
            aria-label={copy.common.selectCanvasNode}
            onClick={() => setIsReferencePickerOpen((value) => !value)}
          >
            <MousePointer2 className="size-4" />
          </button>
          <span className="h-6 w-px bg-white/[0.08]" />
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-[11px] bg-white/[0.09] text-white/70 transition hover:bg-white/[0.14] hover:text-white"
            aria-label={copy.common.addNodeAria}
            onClick={onAddNode}
          >
            <Plus className="size-4" />
          </button>
          {isReferencePickerOpen ? (
            <div className="absolute left-0 top-12 z-40 w-72 rounded-[22px] border border-white/[0.09] bg-[rgba(28,28,30,0.98)] p-2 shadow-[0_22px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="px-3 py-2 text-xs font-semibold text-white/42">
                {referenceHint}
              </div>
              {attachableNodes.length ? (
                <div className="max-h-56 overflow-y-auto pr-1">
                  {attachableNodes.map((item) => {
                    const thumb = getReferenceThumb(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-[16px] px-2 py-2 text-left text-white/76 transition hover:bg-white/[0.07] hover:text-white"
                        onClick={() => {
                          onAttachNode(item.id);
                          setIsReferencePickerOpen(false);
                        }}
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white/[0.06]">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="size-5 text-white/48" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {getReferenceLabel(item)}
                          </span>
                          <span className="block text-xs text-white/38">
                            {item.kind === "result" ? item.data.mediaKind : item.kind}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-5 text-sm text-white/42">
                  {copy.common.noAttachableNodes}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-full text-white/45 transition hover:bg-white/[0.06] hover:text-white/82"
          aria-label={copy.common.expandInput}
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      {imageReferences.length ? (
        <div className="mt-3 -mx-0.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-2 px-0.5">
            {imageReferences.map((item) => (
              <div
                key={item.id}
                className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-[16px] border border-white/[0.1] bg-white/[0.04] shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
                title={item.label || copy.common.referenceImage}
              >
                <img
                  src={item.url}
                  alt={item.label || copy.common.referenceImage}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/58 text-white/82 opacity-0 transition group-hover:opacity-100 hover:bg-black/76"
                  aria-label={copy.common.removeReference}
                  onClick={() => onRemoveReference(item.id)}
                >
                  <X className="size-3.5" />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-[0.62rem] font-medium text-white/84">
                  <span className="block truncate">
                    {item.label || copy.common.referenceImage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {otherReferences.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {otherReferences.map((item) => (
            <CanvasContextChip key={item.id} item={item} />
          ))}
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={node.data.prompt}
        onChange={(event) => {
          onPromptChange(event.target.value);
          event.currentTarget.style.height = "auto";
          event.currentTarget.style.height = `${Math.min(
            Math.max(event.currentTarget.scrollHeight, 84),
            188,
          )}px`;
        }}
        placeholder={copy.common.promptPlaceholder}
        className="mt-3 max-h-[11.75rem] min-h-[5.25rem] w-full resize-none overflow-y-auto bg-transparent px-1 text-[0.92rem] font-semibold leading-6 text-white outline-none placeholder:text-white/28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      />

      <div className="mt-0.5 flex items-center justify-between gap-2 overflow-visible">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-visible whitespace-nowrap pr-2 text-[0.78rem] font-semibold leading-none text-white/82">
          <div className="flex shrink-0 items-center gap-2">
            <ComposerSelect
              id="canvas-model"
              value={node.data.modelUrl}
              options={modelOptions.map((option) => ({
                value: option.url,
                label: option.label,
                badge: option.badge,
                iconUrl: option.iconUrl,
                monogram: option.monogram,
              }))}
              className="max-w-48 text-[0.82rem]"
              menuClassName="min-w-72"
              showIcons
              onChange={onModelChange}
            />
          </div>
          <span className="h-4 w-px shrink-0 bg-white/[0.09]" />
          <WorkbenchComposerToolbar
            modelUrl={node.data.modelUrl}
            values={{
              ...node.data.settings,
              aspectRatio: node.data.aspectRatio,
              count: node.data.count,
            }}
            fields={toolbarFields}
            density="compact"
            onChange={onSettingChange}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 text-[0.78rem] font-semibold text-white/70">
          <button
            type="button"
            disabled={isGenerating}
            onClick={onGenerate}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.16] py-0.5 pl-2 pr-0.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-white/[0.22] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Boxes className="size-3.5" />
            )}
            <span>{requiredCredits ?? "..."}</span>
            <span className="flex size-6 items-center justify-center rounded-full bg-white/70 text-[#111]">
              <Send className="size-3.5" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
