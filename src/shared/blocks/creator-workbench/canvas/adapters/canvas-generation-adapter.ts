"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { PlaygroundConfig } from "@/shared/blocks/desktop-playground";
import { useAppContext } from "@/shared/contexts/app";
import { useEstimateCredits } from "@/shared/hooks/use-estimate-credits";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import type { GenerationCallbacks } from "@/shared/lib/ai-generation";
import type {
  CanvasNode,
  CanvasReferenceItem,
  CanvasWorkflowNode,
} from "../core/canvas-types";

type GenerationAdapterParams = {
  workflowNode: CanvasWorkflowNode | null;
  config?: PlaygroundConfig;
  onTaskSubmitted?: (payload: {
    requestId: string;
    scenario: string;
  }) => void | Promise<void>;
};

type GeneratePayload = {
  prompt: string;
  settings: Record<string, any>;
  references: CanvasReferenceItem[];
  onTaskSubmitted?: (payload: {
    requestId: string;
    scenario: string;
  }) => void | Promise<void>;
};

function buildReferencePayload(
  references: CanvasReferenceItem[],
  config?: PlaygroundConfig,
) {
  if (!config) return {};

  const images = references.filter((item) => item.kind === "image");
  const videos = references.filter((item) => item.kind === "video");
  const imageItems = images.map((item) => ({
    url: item.url,
    status: "success",
  }));
  const videoItems = videos.map((item) => ({
    url: item.url,
    status: "success",
  }));

  const payload: Record<string, any> = {};
  if (config.schema.referenceImages) {
    payload.referenceImages = imageItems;
  } else if (imageItems.length) {
    const firstImageUploadField = Object.entries(config.schema).find(
      ([key, field]) =>
        key !== "prompt" &&
        field?.type === "upload" &&
        (field.previewType === "image" || field.accept?.includes("image")),
    );
    if (firstImageUploadField) {
      payload[firstImageUploadField[0]] = imageItems;
    }
  }

  if (videoItems.length) {
    const firstVideoUploadField = Object.entries(config.schema).find(
      ([key, field]) =>
        key !== "prompt" &&
        field?.type === "upload" &&
        (field.previewType === "video" || field.accept?.includes("video")),
    );
    if (firstVideoUploadField) {
      payload[firstVideoUploadField[0]] = videoItems;
    }
  }

  return payload;
}

type GenerateCanvasWorkflowWithConfigParams = {
  workflowNode: CanvasWorkflowNode;
  config: PlaygroundConfig;
  prompt: string;
  settings: Record<string, any>;
  references: CanvasReferenceItem[];
  callbacks: GenerationCallbacks;
  translate: (key: string, params?: Record<string, any>) => string;
  requiredCredits: number | null;
  remainingCredits: number;
  onTaskSubmitted?: (payload: {
    requestId: string;
    scenario: string;
  }) => void | Promise<void>;
};

export function generateCanvasWorkflowWithConfig({
  workflowNode,
  config,
  prompt,
  settings,
  references,
  callbacks,
  translate,
  requiredCredits,
  remainingCredits,
  onTaskSubmitted,
}: GenerateCanvasWorkflowWithConfigParams) {
  const values = {
    ...settings,
    prompt,
    __modelUrl: workflowNode.data.modelUrl,
    __modelLabel: workflowNode.data.modelLabel,
    ...buildReferencePayload(references, config),
  };

  return config.onGenerate(values, {
    callbacks: {
      ...callbacks,
      modelUrl: workflowNode.data.modelUrl,
      modelLabel: workflowNode.data.modelLabel,
      onTaskSubmitted,
    },
    t: translate,
    requiredCredits,
    remainingCredits,
  });
}

export function getReferenceItemsFromGraph(
  workflowNode: CanvasWorkflowNode | null,
  nodes: CanvasNode[],
  edges: Array<{ source: string; target: string; semantic: string }>,
) {
  if (!workflowNode) return [];

  const selfReferences: CanvasReferenceItem[] = [];
  if (workflowNode.data.uploadedImageUrl) {
    selfReferences.push({
      id: `${workflowNode.id}-uploaded-image`,
      kind: "image",
      url: workflowNode.data.uploadedImageUrl,
      label: workflowNode.data.uploadedImageName || "上传图片",
    });
  }
  if (workflowNode.data.uploadedVideoUrl) {
    selfReferences.push({
      id: `${workflowNode.id}-uploaded-video`,
      kind: "video",
      url: workflowNode.data.uploadedVideoUrl,
      label: workflowNode.data.uploadedVideoName || "上传视频",
    });
  }

  const edgeReferences = edges
    .filter(
      (edge) =>
        edge.target === workflowNode.id && edge.semantic === "reference",
    )
    .map((edge) => nodes.find((node) => node.id === edge.source))
    .filter(Boolean)
    .flatMap((node) => {
      if (!node) return [];
      if (node.kind === "result") {
        return [
          {
            id: node.id,
            kind: node.data.mediaKind,
            url: node.data.url,
            label:
              String(node.data.title || "").trim() ||
              node.data.prompt ||
              "生成结果",
          },
        ];
      }
      if (node.kind === "input" && node.data.url && node.data.mediaKind) {
        return [
          {
            id: node.id,
            kind: node.data.mediaKind,
            url: node.data.url,
            label: String(node.data.title || "").trim() || node.data.label,
          },
        ];
      }
      return [];
    });

  return [...selfReferences, ...edgeReferences];
}

export function useCanvasGenerationAdapter({
  workflowNode,
  config,
  onTaskSubmitted,
}: GenerationAdapterParams) {
  const tCommonApi = useTranslations("common.api");
  const tWave = useTranslations("landing.wavespeed");
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  const estimateParams = useMemo(
    () => config?.estimateParams?.(workflowNode?.data.settings || {}),
    [config, workflowNode?.data.settings],
  );

  const { credits } = useEstimateCredits(
    config?.creditScenario ?? "flux-2-klein-text-to-image",
    {
      ...(estimateParams || {}),
      __modelUrl: workflowNode?.data.modelUrl,
    },
    { enabled: Boolean(config && workflowNode?.data.modelUrl) },
  );

  const callbacks: GenerationCallbacks = useMemo(
    () => ({
      checkAccess: () => checkAccess(),
      modelUrl: workflowNode?.data.modelUrl,
      modelLabel: workflowNode?.data.modelLabel,
      showPricingModal: () => setIsShowPaymentModal(true),
      showSignModal: () => setIsShowSignModal(true),
      fetchUserInfo: async () => {
        await fetchUserInfo();
      },
      onStatusUpdate: () => {},
      deferPolling: true,
      onTaskSubmitted,
      onError: () => {},
      translateApiError: (translationKey) => tCommonApi(translationKey as any),
    }),
    [
      checkAccess,
      fetchUserInfo,
      onTaskSubmitted,
      setIsShowPaymentModal,
      setIsShowSignModal,
      tCommonApi,
      workflowNode?.data.modelLabel,
      workflowNode?.data.modelUrl,
    ],
  );

  const generate = async ({
    prompt,
    settings,
    references,
    onTaskSubmitted: requestOnTaskSubmitted,
  }: GeneratePayload) => {
    if (!config || !workflowNode) {
      throw new Error("当前工作流还没有可用配置");
    }

    return generateCanvasWorkflowWithConfig({
      workflowNode,
      config,
      prompt,
      settings,
      references,
      callbacks,
      translate: (key: string, params?: Record<string, any>) => {
        const translated = tWave(key as never, params as never);
        return typeof translated === "string"
          ? translated
          : params?.defaultValue || key;
      },
      requiredCredits: credits,
      remainingCredits: user?.credits?.remainingCredits ?? 0,
      onTaskSubmitted: requestOnTaskSubmitted ?? onTaskSubmitted,
    });
  };

  return {
    requiredCredits: credits,
    generate,
  };
}
