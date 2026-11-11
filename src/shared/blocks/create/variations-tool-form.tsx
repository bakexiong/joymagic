"use client";

import { ReferenceImageForm } from "@/shared/blocks/desktop-playground/components/reference-image-form";
import { executeGeneration } from "@/shared/blocks/desktop-playground/configs/execute-generation";
import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground/types/playground-config";
import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import type {
  WorkbenchModelOption,
  WorkbenchSceneOption,
} from "@/shared/blocks/desktop-playground/components/media-workbench-form-shell";

type VariationsToolFormProps = {
  sceneTitle?: string;
  sceneIconUrl?: string;
  sceneOptions?: WorkbenchSceneOption[];
  currentSceneId?: string;
  onSceneChange?: (sceneId: string) => void;
  onGenerate?: (imageUrl: string | string[]) => void;
  onValuesChange?: (values: Record<string, any>) => void;
  isGenerating?: boolean;
  requiredCredits?: number | null;
  modelOptions?: WorkbenchModelOption[];
  currentModelUrl?: string;
  onModelChange?: (modelUrl: string) => void;
  values?: Record<string, any>;
  generationContext?: Parameters<PlaygroundConfig["onGenerate"]>[1];
};

const VARIATIONS_FIXED_PROMPT = [
  "Use the uploaded image as the only subject and identity reference.",
  "Create a premium multi-angle variation sheet of the same subject.",
  "Preserve identity, facial structure, body shape, hairstyle, outfit, materials, colors, logos, and the overall scene context.",
  "Show four clearly distinct viewpoints: front three-quarter, left profile, right profile, and back three-quarter.",
  "Keep lighting direction, lens feel, realism, and styling consistent with the source image.",
  "Do not add or remove accessories, text, props, or branding.",
  "Arrange the result as a polished 2x2 collage with balanced spacing, one angle per panel.",
  "High detail, coherent anatomy, accurate textures, no text, no watermark.",
].join(" ");

function getUploadedImageUrls(values: Record<string, any>) {
  const images = Array.isArray(values.referenceImages)
    ? (values.referenceImages as ImageUploaderValue[])
    : [];

  return images
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
}

export const variationsPlaygroundConfig: PlaygroundConfig = {
  model: { id: "gpt-image-2-variations", name: "GPT-Image 2" },
  scenarioType: "image-to-image",
  creditScenario: "gpt-image-2-image-to-image",
  estimateParams: (values) => ({
    aspect_ratio: values.aspectRatio,
    num_images:
      (Array.isArray(values.referenceImages) ? values.referenceImages.length : 0) ||
      1,
  }),
  schema: {
    referenceImages: {
      type: "upload",
      label: "Reference image",
      description: "Upload one image to generate multi-angle variations.",
      defaultValue: [],
      required: true,
      accept: "image/*",
      multiple: false,
      maxFiles: 1,
      maxSizeMB: 15,
    },
    prompt: {
      type: "textarea",
      label: "Prompt",
      defaultValue: VARIATIONS_FIXED_PROMPT,
      required: false,
      visible: false,
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      defaultValue: "1:1",
      options: [
        { label: "1:1", value: "1:1" },
        { label: "4:5", value: "4:5" },
        { label: "9:16", value: "9:16" },
        { label: "16:9", value: "16:9" },
        { label: "3:4", value: "3:4" },
        { label: "4:3", value: "4:3" },
      ],
    },
  },
  onGenerate: async (values, context) => {
    const imageUrls = getUploadedImageUrls(values);
    const image = imageUrls[0];

    if (!image) {
      throw new Error("Reference image is required");
    }

    const result = await executeGeneration(
      {
        apiEndpoint: "/api/ai/variations/generate",
        scenario: "gpt-image-2-image-to-image",
        requestBody: {
          image,
          aspectRatio: values.aspectRatio,
        },
        requiredCredits: context.requiredCredits,
        remainingCredits: context.remainingCredits,
      },
      context.callbacks,
      context.t,
    );

    if (!result.success) {
      const isKnownNonFailure =
        result.error === "Authentication required" ||
        result.error === "Insufficient credits";

      if (!isKnownNonFailure && result.error) {
        throw new Error(result.error);
      }

      return { imageUrl: "" };
    }

    if (!result.url) {
      if (result.requestId) {
        return {
          requestId: result.requestId,
          taskId: result.requestId,
          scenario: "gpt-image-2-image-to-image",
          outputs: result.outputs,
        };
      }

      throw new Error("Failed to generate image");
    }

    return {
      imageUrl: result.url,
      outputs: result.outputs,
      requestId: result.requestId,
      taskId: result.requestId,
      scenario: "gpt-image-2-image-to-image",
    };
  },
};

export function VariationsToolForm({
  sceneTitle,
  sceneIconUrl,
  sceneOptions,
  currentSceneId,
  onSceneChange,
  onGenerate,
  onValuesChange,
  isGenerating,
  requiredCredits,
  modelOptions,
  currentModelUrl,
  onModelChange,
  values,
  generationContext,
}: VariationsToolFormProps) {
  return (
    <div className="h-full w-full min-w-0 overflow-hidden">
      <div className="h-full min-h-0 w-full min-w-0 overflow-x-hidden overflow-y-auto">
        <ReferenceImageForm
          config={variationsPlaygroundConfig}
          sceneTitle={sceneTitle}
          sceneIconUrl={sceneIconUrl}
          sceneOptions={sceneOptions}
          currentSceneId={currentSceneId}
          onSceneChange={onSceneChange}
          onGenerate={onGenerate}
          onValuesChange={onValuesChange}
          isGenerating={isGenerating}
          requiredCredits={requiredCredits}
          modelOptions={modelOptions}
          currentModelUrl={currentModelUrl}
          onModelChange={onModelChange}
          values={values}
          generationContext={generationContext}
        />
      </div>
    </div>
  );
}
