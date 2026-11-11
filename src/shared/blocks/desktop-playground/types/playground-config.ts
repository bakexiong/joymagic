/**
 * Desktop Playground Schema Types
 *
 * Defines the schema structure for desktop image playground components.
 * Each model provides a schema that describes its parameters and UI configuration.
 */

import type {
  GenerationCallbacks,
  TranslationFunction,
} from "../configs/generation-contract";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "slider"
  | "toggle"
  | "upload"
  | "number";

export interface FieldOption {
  label: string;
  value: string | number;
  description?: string;
}

export interface LinkedFieldValues {
  prompt?: string;
  referenceImages?: any[];
  [key: string]: any;
}

export interface FieldSchema {
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue: any;
  options?: FieldOption[];
  visible?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  accept?: string; // For file upload
  multiple?: boolean; // For file upload
  maxFiles?: number; // For file upload
  uploadUrl?: string; // Custom storage endpoint for file upload
  previewType?: "image" | "video" | "audio" | "auto";
  maxSizeMB?: number;
  linkedValuesByOption?: Record<string, LinkedFieldValues>;
}

export interface PlaygroundSchema {
  // Core fields
  prompt: FieldSchema;
  referenceImages?: FieldSchema; // Only for image-to-image

  // Output parameters (optional - models can use aspectRatio/resolution or width/height)
  aspectRatio?: FieldSchema;
  resolution?: FieldSchema;
  outputFormat?: FieldSchema;

  // Alternative output parameters (for models that use explicit dimensions)
  width?: FieldSchema;
  height?: FieldSchema;

  // Optional fields (model-specific)
  [key: string]: FieldSchema | undefined;
}

export interface ModelInfo {
  id: string;
  name: string;
  icon?: React.ReactNode;
  badge?: string; // e.g., "New", "Pro"
}

export interface PlaygroundConfig {
  model: ModelInfo;
  schema: PlaygroundSchema;
  scenarioType:
    | "text-to-image"
    | "image-to-image"
    | "text-to-video"
    | "image-to-video";
  creditScenario?: string;
  estimateParams?: (
    values: Record<string, any>,
  ) => Record<string, any> | undefined;
  onGenerate: (
    values: Record<string, any>,
    context: {
      callbacks: GenerationCallbacks;
      t: TranslationFunction;
      requiredCredits: number | null;
      remainingCredits: number;
    },
  ) => Promise<{
    imageUrl?: string;
    imageUrls?: string[];
    videoUrl?: string;
    outputs?: string[];
    requestId?: string;
    taskId?: string;
    scenario?: string;
  }>;
  estimateCredits?: (values: Record<string, any>) => number;
}
