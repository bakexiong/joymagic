"use client";

import { useTranslations } from "next-intl";

import { Check } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type CellValue = boolean | string;

export interface ComparisonRow {
  labelKey: string;
  values: CellValue[];
}

const ALL_MODELS_VALUE = "__ALL_MODELS__";
const COMPARISON_ROW_LABEL_FALLBACKS: Record<string, string> = {
  credits_year: "Credits / Year",
  credits_month: "Credits / Month",
  credits: "Credits",
  image_gen: "Image Gen",
  video_seedance_2_0: "Video-Seedance 2.0",
  use_all_models: "Use All Models",
  priority: "Priority",
  multiple_tasks: "Multiple Tasks",
};

export const COMPARISON_TABLE_DATA: Record<string, ComparisonRow[]> = {
  yearly: [
    {
      labelKey: "credits_year",
      values: ["22,680", "50,400", "180k"],
    },
    {
      labelKey: "image_gen",
      values: ["≈11k", "≈25k", "≈90k"],
    },
    {
      labelKey: "video_seedance_2_0",
      values: ["≈648 s", "≈1,440 s", "≈5,143 s"],
    },
    {
      labelKey: "use_all_models",
      values: [ALL_MODELS_VALUE, ALL_MODELS_VALUE, ALL_MODELS_VALUE],
    },
    { labelKey: "priority", values: [false, true, true] },
    {
      labelKey: "multiple_tasks",
      values: [false, true, true],
    },
  ],
  monthly: [
    {
      labelKey: "credits_month",
      values: ["1,890", "4,200", "15,000"],
    },
    {
      labelKey: "image_gen",
      values: ["≈945", "≈2,100", "≈7,500"],
    },
    {
      labelKey: "video_seedance_2_0",
      values: ["≈54 s", "≈120 s", "≈429 s"],
    },
    {
      labelKey: "use_all_models",
      values: [ALL_MODELS_VALUE, ALL_MODELS_VALUE, ALL_MODELS_VALUE],
    },
    { labelKey: "priority", values: [false, true, true] },
    {
      labelKey: "multiple_tasks",
      values: [false, true, true],
    },
  ],
};

export const PAYG_COMPARISON_ROWS: ComparisonRow[] = [
  {
    labelKey: "credits",
    values: ["1,890", "4,200", "15,000"],
  },
  {
    labelKey: "image_gen",
    values: ["≈945", "≈2,100", "≈7,500"],
  },
  {
    labelKey: "video_seedance_2_0",
    values: ["≈54 s", "≈120 s", "≈429 s"],
  },
  {
    labelKey: "use_all_models",
    values: [ALL_MODELS_VALUE, ALL_MODELS_VALUE, ALL_MODELS_VALUE],
  },
  { labelKey: "priority", values: [false, true, true] },
  {
    labelKey: "multiple_tasks",
    values: [false, true, true],
  },
];

function CellContent({
  val,
  allModelsLabel,
}: {
  val: CellValue;
  allModelsLabel: string;
}) {
  if (typeof val === "boolean") {
    return val ? (
      <span className="inline-flex size-6 items-center justify-center rounded-full border border-[#ffd24d] bg-[#fff4c0]">
        <Check className="size-3.5 text-[#8c6414]" strokeWidth={2.8} />
      </span>
    ) : (
      <span className="text-sm text-[#c1c5cc]">—</span>
    );
  }

  return (
    <span className="text-sm font-medium tabular-nums text-[#171717]">
      {val === ALL_MODELS_VALUE ? allModelsLabel : val}
    </span>
  );
}

export function PricingComparisonTable({
  group,
  locale,
  planTitles,
  className,
}: {
  group: string;
  locale: string;
  planTitles: string[];
  className?: string;
}) {
  const t = useTranslations("pricing");
  const rows = COMPARISON_TABLE_DATA[group] ?? PAYG_COMPARISON_ROWS;
  const headers =
    planTitles.length > 0 ? planTitles : ["Starter", "Professional", "Titan"];
  const allModelsLabel = t.has("credit_modal.comparison.values.all_models")
    ? t("credit_modal.comparison.values.all_models")
    : "All";

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[24px] border border-black/8 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-black/8 bg-[#fff8de]">
            <th className="w-[38%] px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7282] md:px-6">
              {t("credit_modal.comparison.features_label")}
            </th>
            {headers.map((title, index) => (
              <th
                key={`${title}-${index}`}
                className="px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#171717] md:px-6"
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.labelKey}-${index}`}
              className={cn(
                "border-b border-black/6 transition-colors hover:bg-[#fffdf7]",
                index === rows.length - 1 && "border-b-0",
              )}
            >
              <td className="px-4 py-4 align-middle text-sm text-[#6a7282] md:px-6">
                <span className="text-[#171717]">
                  {t.has(`credit_modal.comparison.rows.${row.labelKey}`)
                    ? t(`credit_modal.comparison.rows.${row.labelKey}`)
                    : COMPARISON_ROW_LABEL_FALLBACKS[row.labelKey]}
                </span>
              </td>
              {row.values.map((val, valueIndex) => (
                <td
                  key={`${row.labelKey}-${valueIndex}`}
                  className="px-3 py-4 text-center md:px-6"
                >
                  <CellContent val={val} allModelsLabel={allModelsLabel} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
