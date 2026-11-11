"use client";

import { useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import type { StaticFieldSchema, StaticSchema } from "../toolbar-schemas";
import { TOOLBAR_SCHEMAS } from "../toolbar-schemas";

type WorkbenchComposerToolbarProps = {
  modelUrl: string;
  values: Record<string, any>;
  fields?: Array<{ key: string; field: StaticFieldSchema }>;
  density?: "default" | "compact";
  onChange: (key: string, value: string | number) => void;
};

function getToolbarFields(modelUrl: string, fields?: Array<{ key: string; field: StaticFieldSchema }>) {
  if (fields?.length) return fields;

  const schema: StaticSchema | undefined = TOOLBAR_SCHEMAS[modelUrl];
  if (!schema) return [];

  return Object.entries(schema).flatMap(([key, field]) =>
    field ? [{ key, field }] : [],
  );
}

function getValue(values: Record<string, any>, key: string, field: StaticFieldSchema) {
  return values[key] ?? field.defaultValue;
}

function getOptionLabel(field: StaticFieldSchema, value: unknown) {
  if (field.type === "number") return String(value ?? field.defaultValue);
  return field.options.find((option) => option.value === value)?.label || String(value ?? field.defaultValue);
}

function AspectRatioIcon({
  ratio,
  active,
  density,
}: {
  ratio: string;
  active: boolean;
  density: "default" | "compact";
}) {
  const [rawWidth, rawHeight] = ratio.split(":").map(Number);
  const width = Number.isFinite(rawWidth) ? rawWidth : 1;
  const height = Number.isFinite(rawHeight) ? rawHeight : 1;
  const aspect = width / height;
  const base = density === "compact" ? 15 : 26;
  const max = density === "compact" ? 30 : 52;
  const iconWidth = aspect > 1 ? Math.min(base * aspect, max) : base;
  const iconHeight = aspect < 1 ? Math.min(base / aspect, max) : base;

  return (
    <span
      className={cn(
        "block rounded-[4px] border-2 transition",
        active ? "border-white/66 bg-white/10" : "border-white/42",
      )}
      style={{ width: iconWidth, height: iconHeight }}
    />
  );
}

function FieldSection({
  fieldKey,
  field,
  value,
  density,
  onChange,
}: {
  fieldKey: string;
  field: StaticFieldSchema;
  value: string | number;
  density: "default" | "compact";
  onChange: (value: string | number) => void;
}) {
  const compact = density === "compact";

  if (field.type === "number") {
    return (
      <section className={compact ? "space-y-2" : "space-y-3"}>
        <h3 className={cn(compact ? "text-xs font-medium text-white/42" : "text-sm font-bold text-white/48")}>{field.label}</h3>
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={Number(value)}
          onChange={(event) => onChange(Number(event.target.value))}
          className={cn(
            "w-full border border-white/[0.1] bg-transparent text-white outline-none",
            compact ? "h-9 rounded-[12px] px-3 text-xs font-medium" : "h-12 rounded-[16px] px-4 text-sm font-bold",
          )}
        />
      </section>
    );
  }

  if (fieldKey === "aspectRatio") {
    return (
      <section className={compact ? "space-y-2" : "space-y-3"}>
        <h3 className={cn(compact ? "text-xs font-medium text-white/42" : "text-sm font-bold text-white/48")}>{field.label}</h3>
        <div
          className={cn(
            "flex overflow-x-auto border border-white/[0.1] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            compact ? "gap-1.5 rounded-[14px] p-1.5" : "gap-2 rounded-[18px] p-2",
          )}
        >
          {field.options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex flex-col items-center justify-center transition",
                  compact
                    ? "min-w-[38px] gap-1 rounded-[9px] px-1 py-1.5 text-[11px] font-medium"
                    : "min-w-[60px] gap-2 rounded-[13px] px-2 py-3 text-sm font-black",
                  active
                    ? "bg-[#272b3a] text-white"
                    : "text-white/42 hover:bg-white/[0.05] hover:text-white/72",
                )}
              >
                <AspectRatioIcon ratio={option.label} active={active} density={density} />
                {option.label}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={compact ? "space-y-2" : "space-y-3"}>
      <h3 className={cn(compact ? "text-xs font-medium text-white/42" : "text-sm font-bold text-white/48")}>{field.label}</h3>
      <div className={cn("grid grid-cols-3 border border-white/[0.1]", compact ? "gap-1 rounded-[12px] p-1" : "gap-1 rounded-[16px] p-1.5")}>
        {field.options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "transition",
                compact ? "rounded-[9px] px-3 py-2 text-xs font-semibold" : "rounded-[12px] px-4 py-3 text-sm font-black",
                active
                  ? "bg-[#272b3a] text-white"
                  : "text-white/42 hover:bg-white/[0.05] hover:text-white/72",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function WorkbenchComposerToolbar({
  modelUrl,
  values,
  fields: providedFields,
  density = "default",
  onChange,
}: WorkbenchComposerToolbarProps) {
  const [openPanel, setOpenPanel] = useState<"primary" | "more" | null>(null);
  const fields = useMemo(
    () => getToolbarFields(modelUrl, providedFields),
    [modelUrl, providedFields],
  );

  const primaryFields = fields.slice(0, 2);
  const moreFields = fields.slice(2);
  const primaryLabel = primaryFields
    .map(({ key, field }) => getOptionLabel(field, getValue(values, key, field)))
    .join(" | ");

  if (!fields.length) return null;

  const panelFields = openPanel === "more" ? moreFields : primaryFields;
  const compact = density === "compact";

  return (
    <div className={cn("relative flex shrink-0 items-center", compact ? "gap-1.5" : "gap-2")}>
      <button
        type="button"
        onClick={() => setOpenPanel(openPanel === "primary" ? null : "primary")}
        className={cn(
          "inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.025] text-white transition hover:bg-white/[0.06]",
          compact ? "h-7 gap-1.5 px-2 text-[11px] font-medium" : "h-10 gap-2 px-3 text-sm font-black",
        )}
      >
        <span className={cn("rounded-[3px] border-2 border-white/52", compact ? "h-2.5 w-3.5" : "h-3.5 w-5")} />
        <span>{primaryLabel}</span>
        <ChevronDown className={cn("text-white/46", compact ? "size-3" : "size-3.5")} />
      </button>
      {moreFields.length ? (
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === "more" ? null : "more")}
          className={cn(
            "inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.025] text-white/76 transition hover:bg-white/[0.06] hover:text-white",
            compact ? "h-7 gap-1.5 px-2 text-[11px] font-medium" : "h-10 gap-2 px-3 text-sm font-black",
          )}
        >
          <SlidersHorizontal className={cn("text-white/46", compact ? "size-3.5" : "size-4")} />
          <span>{moreFields.length} more</span>
          <ChevronDown className={cn("text-white/46", compact ? "size-3" : "size-3.5")} />
        </button>
      ) : null}
      {openPanel ? (
        <div
          className={cn(
            "absolute left-0 z-[90] border border-white/[0.1] bg-[#0d0d0f] shadow-[0_24px_80px_rgba(0,0,0,0.58)]",
            compact
              ? "top-9 w-[min(27rem,calc(100vw-3rem))] rounded-[16px] p-2.5"
              : "top-12 w-[min(46rem,calc(100vw-3rem))] rounded-[24px] p-5",
          )}
        >
          <div className={compact ? "space-y-3" : "space-y-7"}>
            {panelFields.map(({ key, field }) => (
              <FieldSection
                key={key}
                fieldKey={key}
                field={field}
                value={getValue(values, key, field)}
                density={density}
                onChange={(value) => onChange(key, value)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
