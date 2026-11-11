/**
 * Home Composer 工具栏参数 Schema
 *
 * 定义每个模型在首页创作工具栏中展示哪些参数选择器。
 *
 * 策略：直接从 toolbar-schemas.ts 加载零导入的静态数据，
 * 不再同步导入 desktop-playground 配置（~2733 行含 JSX 的文件）。
 */

import {
  TOOLBAR_SCHEMAS,
  type StaticSchema,
  type StaticSelectField,
  type StaticNumberField,
} from "@/shared/blocks/desktop-playground/toolbar-schemas";

export type ParamOption = {
  label: string;
  value: string;
};

export type ParamField =
  | (Omit<StaticSelectField, "defaultValue"> & {
      type: "select";
      options: ParamOption[];
    })
  | (Omit<StaticNumberField, "defaultValue"> & {
      type: "number";
    });

export type ParamPill = {
  key: string;
  label: string;
  value: string;
};

export type ModelParamSchema = {
  params: ParamPill[];
  schema?: Partial<Record<string, ParamField>>;
};

function schemaFromStatic(staticSchema: StaticSchema): ModelParamSchema {
  const schema: Partial<Record<string, ParamField>> = {};
  const params: ParamPill[] = [];

  for (const [key, field] of Object.entries(staticSchema)) {
    if (!field) continue;

    if (field.type === "select") {
      schema[key] = {
        type: "select",
        label: field.label,
        options: field.options.map((o) => ({
          label: String(o.label),
          value: String(o.value),
        })),
      };
      if (field.defaultValue !== undefined) {
        params.push({ key, label: field.label, value: String(field.defaultValue) });
      }
    } else if (field.type === "number") {
      schema[key] = {
        type: "number",
        label: field.label,
        min: field.min,
        max: field.max,
        step: field.step,
      };
      if (field.defaultValue !== undefined) {
        params.push({ key, label: field.label, value: String(field.defaultValue) });
      }
    }
  }

  return { params, schema };
}

export function getToolbarSchema(modelUrl: string): ModelParamSchema {
  const staticSchema = TOOLBAR_SCHEMAS[modelUrl];
  if (staticSchema) return schemaFromStatic(staticSchema);
  return { params: [] };
}
