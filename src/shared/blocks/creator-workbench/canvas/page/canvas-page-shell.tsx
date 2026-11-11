"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { nanoid } from "nanoid";
import { useLocale, useTranslations } from "next-intl";
import { Clapperboard, Crosshair, Sparkles, Wand2 } from "lucide-react";

import { defaultLocale } from "@/config/locale";
import { usePathname } from "@/core/i18n/navigation";
import { extractImageAiScenes } from "@/shared/blocks/ai-image-generator/ai-image-generator-shared";
import { findFirstSceneWithWorkspace } from "@/shared/blocks/common/ai-generator-shared";
import { type PlaygroundConfig } from "@/shared/blocks/desktop-playground";
import { type GeneratedMediaItem } from "@/shared/blocks/desktop-playground/components/generated-media-panel";
import {
  getPlaygroundConfigByUrl,
  REGISTRY_KEY_BY_URL,
} from "@/shared/blocks/desktop-playground/playground-config-registry";
import { useAppContext } from "@/shared/contexts/app";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import {
  executeGeneration,
  type GenerationCallbacks,
} from "@/shared/lib/ai-generation";
import {
  CANVAS_VIDEO_SEGMENTATION_SCENE,
  extractCanvasVideoSegmentationMask,
  type CanvasVideoSegmentationInvocation,
  type CanvasVideoSegmentationRequestBody,
  type CanvasVideoSegmentationResult,
} from "@/shared/lib/canvas-video-segmentation";
import {
  CANVAS_VIDEO_UPSCALER_SCENE,
  type CanvasVideoUpscaleInvocation,
  type CanvasVideoUpscaleRequestBody,
} from "@/shared/lib/canvas-video-upscaler";
import {
  CANVAS_EXPAND_PROVIDER_SCENARIO,
  CANVAS_EXPAND_SCENE,
} from "@/shared/lib/canvas-expand";
import {
  buildWorkbenchTemplateCatalog,
  filterWorkbenchTemplateSamplesByPolicy,
  type WorkbenchTemplateItem,
} from "@/shared/lib/workbench-template-catalog";
import { getModelVendorLogo } from "@/shared/lib/model-vendor-logo";
import { resolveDefaultVideoModelUrl } from "@/shared/lib/video-model-defaults";
import type { NavItem, UserNav } from "@/shared/types/blocks/common";
import {
  getReferenceItemsFromGraph,
  generateCanvasWorkflowWithConfig,
  useCanvasGenerationAdapter,
} from "../adapters/canvas-generation-adapter";
import {
  CanvasAgentDock,
  type CanvasAgentAttachment,
  type CanvasAgentSkillId,
  type CanvasAgentMessage,
  type CanvasAgentThreadSummary,
  type CanvasAgentSuggestion,
} from "../agent/canvas-agent-dock";
import type {
  CanvasAgentSceneRouterPresentation,
  CanvasAgentSceneRouterField,
} from "../agent/canvas-agent-json-cards";
import { mapHistoryItemToCanvasNode } from "../adapters/canvas-history-adapter";
import { mapTemplateToCanvasNode } from "../adapters/canvas-template-adapter";
import { CanvasCommandMenu } from "../commands/canvas-command-menu";
import { getAvailableCommandsForNode } from "../commands/canvas-command-registry";
import { CanvasComposer } from "../composer/canvas-composer";
import {
  useCanvasGraphActions,
  useCanvasGraphState,
  useSelectedWorkflowNode,
} from "../core/canvas-selectors";
import { CanvasWorkspaceProvider } from "../core/canvas-workspace-provider";
import type {
  CanvasCommandType,
  CanvasEdgeSemantic,
  CanvasGraph,
  CanvasImageToolKind,
  CanvasImageToolRequest,
  CanvasNode,
  CanvasReferenceItem,
  CanvasTextNode,
  CanvasWorkflowNode,
  CanvasWorkflowSubtype,
} from "../core/canvas-types";
import { ReactFlowStage } from "../runtime/react-flow-stage";
import { CanvasBottomControls } from "../ui/canvas-bottom-controls";
import { CanvasNodeContextMenu } from "../ui/canvas-node-context-menu";
import { CanvasSidebarDialog } from "../ui/canvas-sidebar-dialog";
import { CanvasToolRail } from "../ui/canvas-tool-rail";
import { CanvasTopBar } from "../ui/canvas-top-bar";
import {
  screenToWorld,
  worldToScreen,
} from "../runtime/canvas-viewport-controller";
import { getCanvasCopy } from "../canvas-copy";
import type {
  CanvasAgentCreateGroupOperation,
  CanvasAgentCreateEdgeOperation,
  CanvasAgentCreateInputOperation,
  CanvasAgentCreateTextOperation,
  CanvasAgentExecutionMode,
  CanvasAgentCreateWorkflowOperation,
  CanvasAgentLayoutOperation,
  CanvasAgentOperation,
} from "@/shared/services/canvas-agent/canvas-agent-plan";
import {
  extractCanvasAgentMessageCards,
  type CanvasAgentExecutionReviewCard,
  type CanvasAgentMessagePart,
  type CanvasAgentPromptGuideCard,
  type CanvasAgentSceneRouterCard,
} from "@/shared/lib/canvas-agent-message-cards";

type CanvasPageShellProps = {
  navItems: NavItem[];
  title: string;
  userNav?: UserNav;
  projectId?: string;
  projectName?: string;
  initialGraph?: CanvasGraph | null;
  initialSnapshotVersion?: number | null;
  initialScene?: string;
  initialModel?: string;
};

const CANVAS_AGENT_AUTO_OPEN_STORAGE_KEY_PREFIX = "canvas-agent:auto-open:";
const EMPTY_STATE_FIRST_FRAME_MODEL_URL = "/image-to-video/seedance-2-0";
const CANVAS_PROJECT_AUTO_GENERATE_STORAGE_KEY_PREFIX =
  "canvas-project:auto-generate:";

type WorkbenchCreationRecord = {
  id: string;
  mediaType: string;
  sceneId?: string | null;
  modelUrl?: string | null;
  prompt?: string | null;
  params?: string | null;
  aspectRatio?: string | null;
  url: string;
  createdAt: string;
};

type CanvasPendingResultContext = {
  nodeId: string;
  sourceNodeId: string;
  mediaKind: "image" | "video";
  replaceSourceNode?: boolean;
  edgeSemantic: CanvasEdgeSemantic;
  title?: string;
  creationRecordId?: string;
  prompt?: string;
  aspectRatio?: string;
  sceneId?: string;
  modelUrl?: string;
};

type CanvasAgentMode = CanvasAgentExecutionMode;

type CanvasAgentServerGenerationSubmission = {
  workflowNodeId: string;
  executionMode: "server-submitted" | "client-deferred";
  accepted: boolean;
  mediaIntent: "image" | "video";
  subtype:
    | "text-to-image"
    | "image-to-image"
    | "text-to-video"
    | "image-to-video";
  sceneId: string;
  modelUrl: string;
  requestId?: string;
  taskId?: string;
  scenario?: string;
  directUrl?: string;
  outputs?: string[];
  error?: string;
};

type CanvasAgentServerAttachment = {
  assetId: string;
  kind: "image";
  source?: "upload" | "canvas-node" | "history";
  nodeId?: string;
  name?: string;
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
};

type CanvasAgentServerMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  status: string;
  content: string;
  parts?: CanvasAgentMessagePart[];
  attachments?: CanvasAgentServerAttachment[];
  mentionedReferences?: unknown[];
  billing?: {
    chatCredits: number;
    charged: boolean;
    refunded: boolean;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
      reasoningTokens: number;
      totalTokens: number;
    };
    estimatedCostUsd?: number;
    creditUnitPriceUsd?: number;
    appliedProfitMargin?: number;
    minimumCredits?: number;
    pricingStrategy?: "token-usage" | "minimum-charge";
  } | null;
  generation?: {
    status: string;
    taskId?: string;
    scenario?: string;
    errorMessage?: string;
    tasks?: Array<{
      taskId: string;
      workflowNodeId?: string;
      scenario?: string;
      status: "submitted" | "completed" | "failed";
      outputs?: string[];
      creationRecordIds?: string[];
      errorMessage?: string;
      updatedAt: string;
    }>;
  } | null;
  createdAt: string;
};

type CanvasAgentServerThread = {
  id: string;
  projectId: string;
  sessionId: string;
  resourceId: string;
  status: string;
  title: string;
  lastMessageAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CanvasSubmissionQueueItem = {
  nonce: string;
  sourceNode: CanvasNode;
  mediaKind: "image" | "video";
  edgeSemantic: CanvasEdgeSemantic;
  prompt?: string;
  title?: string;
  aspectRatio?: string;
  sceneId?: string;
  modelUrl?: string;
};

function getDefaultValues(config?: PlaygroundConfig) {
  if (!config) return {};

  const initialValues: Record<string, any> = {};
  Object.entries(config.schema).forEach(([key, field]) => {
    if (field) initialValues[key] = field.defaultValue;
  });
  return initialValues;
}

function getCanvasAgentEditableFields(
  config?: PlaygroundConfig,
): CanvasAgentSceneRouterField[] {
  if (!config) return [];

  return Object.entries(config.schema).flatMap(([key, field]) => {
    if (!field || field.visible === false) return [];
    if (field.type === "upload") return [];

    return [
      {
        key,
        type: field.type,
        label: field.label,
        description: field.description,
        placeholder: field.placeholder,
        min: field.min,
        max: field.max,
        step: field.step,
        options: field.options?.map((option) => ({
          label: option.label,
          value: option.value,
        })),
      } satisfies CanvasAgentSceneRouterField,
    ];
  });
}

function getPreferredSceneUrl(scene: {
  url?: string;
  children?: Array<{ url: string }>;
}) {
  return resolveDefaultVideoModelUrl(scene);
}

function mapCreationRecordToGeneratedItem(
  record: WorkbenchCreationRecord,
): GeneratedMediaItem {
  let parsedParams: Record<string, any> = {};
  if (record.params) {
    try {
      const result = JSON.parse(record.params);
      if (result && typeof result === "object" && !Array.isArray(result)) {
        parsedParams = result;
      }
    } catch {
      parsedParams = {};
    }
  }

  return {
    url: record.url,
    params: {
      ...parsedParams,
      creationRecordId: record.id,
    },
    aspectRatio:
      record.aspectRatio || String(parsedParams.aspectRatio || "1:1"),
    mediaKind: record.mediaType === "video" ? "video" : "image",
    createdAt: record.createdAt,
    sceneId: record.sceneId || undefined,
    modelUrl: record.modelUrl || undefined,
    prompt: record.prompt || String(parsedParams.prompt || ""),
  };
}

function createWorkflowNode(params: {
  id?: string;
  sceneId: string;
  sceneLabel: string;
  modelUrl: string;
  modelLabel: string;
  subtype: CanvasWorkflowSubtype;
  position: { x: number; y: number };
  settings?: Record<string, any>;
}): CanvasWorkflowNode {
  return {
    id: params.id ?? `workflow-${nanoid(6)}`,
    kind: "workflow",
    subtype: params.subtype,
    position: params.position,
    size: { width: 228, height: 228 },
    data: {
      sceneId: params.sceneId,
      sceneLabel: params.sceneLabel,
      modelUrl: params.modelUrl,
      modelLabel: params.modelLabel,
      prompt: String(params.settings?.prompt || ""),
      aspectRatio: params.settings?.aspectRatio || "1:1",
      count: Number(params.settings?.count || 1),
      settings: {
        ...params.settings,
        prompt: String(params.settings?.prompt || ""),
      },
      status: "idle",
    },
  };
}

function createTextNode(
  position: { x: number; y: number },
  label = "Text Node",
): CanvasTextNode {
  return {
    id: `text-${nanoid(6)}`,
    kind: "text",
    subtype: "copy",
    position,
    size: { width: 300, height: 300 },
    data: {
      label,
      content: "",
    },
  };
}

function setCanvasNodeGeneratingState(node: CanvasNode): CanvasNode {
  if (
    node.kind === "workflow" ||
    node.kind === "input" ||
    node.kind === "result"
  ) {
    return {
      ...node,
      data: {
        ...node.data,
        status: "generating",
        errorMessage: undefined,
      },
    } as CanvasNode;
  }
  return node;
}

function setCanvasNodeSuccessState(node: CanvasNode): CanvasNode {
  if (
    node.kind === "workflow" ||
    node.kind === "input" ||
    node.kind === "result"
  ) {
    return {
      ...node,
      data: {
        ...node.data,
        status: "success",
        errorMessage: undefined,
      },
    } as CanvasNode;
  }
  return node;
}

function setCanvasNodeErrorState(
  node: CanvasNode,
  message: string,
): CanvasNode {
  if (
    node.kind === "workflow" ||
    node.kind === "input" ||
    node.kind === "result"
  ) {
    return {
      ...node,
      data: {
        ...node.data,
        status: "error",
        errorMessage: message,
      },
    } as CanvasNode;
  }
  return node;
}

function getEdgeSemanticForNodes(
  sourceNode: CanvasNode,
  targetNode: CanvasNode,
  handles?: {
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
): CanvasEdgeSemantic | null {
  if (!isCanvasNodeConnectionAllowed(sourceNode, targetNode, handles))
    return null;

  if (sourceNode.kind === "template" || sourceNode.kind === "text") {
    return "control";
  }

  if (sourceNode.kind === "input" || sourceNode.kind === "result") {
    return "reference";
  }

  if (sourceNode.kind === "workflow") {
    return targetNode.kind === "workflow" ? "derivation" : "reference";
  }

  return null;
}

function isCanvasVideoNode(node: CanvasNode) {
  return (
    (node.kind === "workflow" &&
      (node.subtype === "text-to-video" ||
        node.subtype === "image-to-video")) ||
    (node.kind === "result" && node.data.mediaKind === "video") ||
    (node.kind === "input" && node.data.mediaKind === "video")
  );
}

function isCanvasImageNode(node: CanvasNode) {
  return (
    (node.kind === "workflow" &&
      (node.subtype === "text-to-image" ||
        node.subtype === "image-to-image")) ||
    (node.kind === "result" && node.data.mediaKind === "image") ||
    (node.kind === "input" &&
      (node.data.mediaKind === "image" ||
        (!node.data.mediaKind && node.subtype !== "audio")))
  );
}

function isCanvasAudioNode(node: CanvasNode) {
  return (
    node.kind === "input" &&
    (node.data.mediaKind === "audio" || node.subtype === "audio")
  );
}

function isCanvasNodeConnectionAllowed(
  sourceNode: CanvasNode,
  targetNode: CanvasNode,
  handles?: {
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
) {
  if (sourceNode.id === targetNode.id) return false;
  if (handles?.sourceHandle && handles.sourceHandle !== "right") return false;
  if (handles?.targetHandle && handles.targetHandle !== "left") return false;

  if (sourceNode.kind === "text") {
    return (
      targetNode.kind === "text" ||
      isCanvasImageNode(targetNode) ||
      isCanvasVideoNode(targetNode) ||
      isCanvasAudioNode(targetNode)
    );
  }

  if (isCanvasVideoNode(sourceNode)) {
    return isCanvasVideoNode(targetNode);
  }

  if (isCanvasImageNode(sourceNode)) {
    return isCanvasImageNode(targetNode) || isCanvasVideoNode(targetNode);
  }

  return false;
}

function getHandleCommandMenuConfig(
  node: CanvasNode,
  side: "left" | "right",
): {
  title: string;
  commands: CanvasCommandType[];
} {
  if (side === "left" && isCanvasImageNode(node)) {
    return {
      title: "选择上游输入",
      commands: ["context-text", "context-image"],
    };
  }

  return {
    title: "引用该节点生成",
    commands: getAvailableCommandsForNode(node),
  };
}

function canAttachNodeToWorkflow(
  node: CanvasNode,
  workflow: CanvasWorkflowNode,
) {
  const mediaKind =
    node.kind === "result"
      ? node.data.mediaKind
      : node.kind === "input"
        ? node.data.mediaKind
        : null;

  if (!mediaKind) return false;
  if (
    workflow.subtype === "image-to-image" ||
    workflow.subtype === "image-to-video"
  ) {
    return mediaKind === "image";
  }

  return mediaKind === "image" || mediaKind === "video";
}

function getCanvasNodeReferenceKind(
  node: CanvasNode,
): CanvasReferenceItem["kind"] | null {
  if (node.kind === "result") return node.data.mediaKind;
  if (node.kind === "input") return node.data.mediaKind || null;
  return null;
}

function getReferenceDrivenSubtype(
  workflow: CanvasWorkflowNode,
  referenceKind: CanvasReferenceItem["kind"] | null,
): CanvasWorkflowSubtype | null {
  if (referenceKind !== "image") return null;
  if (workflow.subtype === "text-to-image") return "image-to-image";
  if (workflow.subtype === "text-to-video") return "image-to-video";
  return null;
}

function getSubtypeWithoutImageReference(
  workflow: CanvasWorkflowNode,
): CanvasWorkflowSubtype {
  if (workflow.subtype === "image-to-image") return "text-to-image";
  if (workflow.subtype === "image-to-video") return "text-to-video";
  return workflow.subtype;
}

function getWorkflowSubtypeForImageReferenceState(
  workflow: CanvasWorkflowNode,
  imageReferenceCount: number,
): CanvasWorkflowSubtype {
  if (imageReferenceCount > 0) {
    return getReferenceDrivenSubtype(workflow, "image") || workflow.subtype;
  }

  return getSubtypeWithoutImageReference(workflow);
}

function swapModelUrlScenario(
  modelUrl: string,
  targetSubtype: CanvasWorkflowSubtype,
) {
  if (targetSubtype === "image-to-image") {
    return modelUrl.replace(/^\/text-to-image\//, "/image-to-image/");
  }
  if (targetSubtype === "image-to-video") {
    return modelUrl.replace(/^\/text-to-video\//, "/image-to-video/");
  }
  return modelUrl;
}

function getReferenceImageLimit(config?: PlaygroundConfig) {
  const field = config?.schema.referenceImages;
  if (!field) return 0;
  if (typeof field.maxFiles === "number") return field.maxFiles;
  return field.multiple ? Number.POSITIVE_INFINITY : 1;
}

function supportsImageReferenceCount(
  config: PlaygroundConfig | undefined,
  count: number,
) {
  if (count <= 0) return true;
  return getReferenceImageLimit(config) >= count;
}

function isReferenceToVideoScene(scene: {
  title?: string;
  url?: string;
  children?: Array<{ url: string }>;
}) {
  return Boolean(
    scene.url?.startsWith("/reference-to-video") ||
    scene.children?.some((child) =>
      child.url.startsWith("/reference-to-video/"),
    ) ||
    scene.title?.toLowerCase().includes("reference to video"),
  );
}

function isImageToVideoScene(scene: {
  url?: string;
  children?: Array<{ url: string }>;
}) {
  return Boolean(
    scene.url?.startsWith("/image-to-video") ||
    scene.children?.some((child) => child.url.startsWith("/image-to-video/")),
  );
}

function getAllowedSceneIdsForVideoReferenceCount(
  scenes: Array<{
    id: string;
    url?: string;
    title?: string;
    children?: Array<{ url: string }>;
  }>,
  count: number,
) {
  if (count <= 0) return null;

  const imageToVideoSceneIds = scenes
    .filter((scene) => isImageToVideoScene(scene))
    .map((scene) => scene.id);
  const referenceToVideoSceneIds = scenes
    .filter((scene) => isReferenceToVideoScene(scene))
    .map((scene) => scene.id);

  if (count === 1) {
    return new Set([...imageToVideoSceneIds, ...referenceToVideoSceneIds]);
  }

  return new Set(referenceToVideoSceneIds);
}

function getCanvasReferenceImageCount(
  workflowId: string,
  nodes: CanvasNode[],
  edges: CanvasGraph["edges"],
  extraSourceId?: string,
) {
  const sourceIds = new Set(
    edges
      .filter(
        (edge) => edge.target === workflowId && edge.semantic === "reference",
      )
      .map((edge) => edge.source),
  );
  if (extraSourceId) sourceIds.add(extraSourceId);

  return Array.from(sourceIds).filter((sourceId) => {
    const source = nodes.find((node) => node.id === sourceId);
    return source ? getCanvasNodeReferenceKind(source) === "image" : false;
  }).length;
}

function isLikelyVideoPrompt(prompt: string) {
  return /视频|短片|分镜|运镜|动画|动起来|video|clip|shot|motion|trailer|commercial/i.test(
    prompt,
  );
}

function getMediaFamilyForSubtype(subtype: CanvasWorkflowSubtype) {
  return subtype === "text-to-video" || subtype === "image-to-video"
    ? "video"
    : "image";
}

function getReferenceNodeKind(node: CanvasNode | null) {
  if (!node) return null;
  if (node.kind === "result") return node.data.mediaKind;
  if (node.kind === "input") return node.data.mediaKind ?? null;
  return null;
}

function CanvasPageInner({
  navItems,
  title,
  userNav,
  projectId,
  projectName,
  initialGraph,
  initialSnapshotVersion,
  initialScene,
  initialModel,
}: CanvasPageShellProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const tc = useTranslations("creator");
  const canvasCopy = getCanvasCopy(locale);
  const tWave = useTranslations("landing.wavespeed");
  const tCommonApi = useTranslations("common.api");
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });
  const graph = useCanvasGraphState();
  const {
    setGraph,
    addNode,
    setNodes,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    setViewport,
    setSelection,
    setCommandMenu,
  } = useCanvasGraphActions();
  const selectedWorkflowNode = useSelectedWorkflowNode();
  const scenes = useMemo(() => extractImageAiScenes(navItems), [navItems]);

  const [configMap, setConfigMap] = useState<Record<string, PlaygroundConfig>>(
    {},
  );
  const [historyItems, setHistoryItems] = useState<GeneratedMediaItem[]>([]);
  const [templateItems, setTemplateItems] = useState<WorkbenchTemplateItem[]>(
    [],
  );
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);
  const [copiedNode, setCopiedNode] = useState<CanvasNode | null>(null);
  const [referenceSelection, setReferenceSelection] = useState<{
    anchorNodeId: string;
    anchorSide?: "left" | "right";
    source?: "composer" | "node-handle";
  } | null>(null);
  const [activeOverlayNodeIds, setActiveOverlayNodeIds] = useState<string[]>(
    [],
  );
  const [sidebarDialogMode, setSidebarDialogMode] = useState<
    "projects" | "creations" | "collections" | null
  >(null);
  const [isConnectionModeActive, setIsConnectionModeActive] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentMode, setAgentMode] = useState<CanvasAgentMode>("auto");
  const [agentSkillId, setAgentSkillId] = useState<CanvasAgentSkillId>("auto");
  const [agentMessages, setAgentMessages] = useState<CanvasAgentMessage[]>([]);
  const [agentThreadId, setAgentThreadId] = useState<string | null>(null);
  const [agentThreads, setAgentThreads] = useState<CanvasAgentThreadSummary[]>(
    [],
  );
  const [agentThreadsLoading, setAgentThreadsLoading] = useState(false);
  const [agentAttachments, setAgentAttachments] = useState<
    CanvasAgentAttachment[]
  >([]);
  const [pendingAgentGenerationIds, setPendingAgentGenerationIds] = useState<
    string[]
  >([]);
  const [
    pendingServerGenerationSubmissions,
    setPendingServerGenerationSubmissions,
  ] = useState<CanvasAgentServerGenerationSubmission[]>([]);
  const [agentSubmitting, setAgentSubmitting] = useState(false);
  const [agentThinkingText, setAgentThinkingText] = useState<string | null>(
    null,
  );
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >(projectId ? "saved" : "idle");
  const [hasMounted, setHasMounted] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState(
    projectName || title,
  );
  const [snapshotVersion, setSnapshotVersion] = useState<number | null>(
    initialSnapshotVersion ?? null,
  );
  const lastSavedGraphRef = useRef(
    JSON.stringify({
      ...(initialGraph ?? graph),
      commandMenu: null,
    }),
  );
  const agentThreadIdRef = useRef<string | null>(null);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setCurrentProjectName(projectName || title);
  }, [projectName, title]);
  useEffect(() => {
    agentThreadIdRef.current = agentThreadId;
  }, [agentThreadId]);

  useEffect(() => {
    const node = selectedWorkflowNode;
    if (!node || configMap[node.data.modelUrl]) return;

    let cancelled = false;
    getPlaygroundConfigByUrl(node.data.modelUrl).then((config) => {
      if (!config || cancelled) return;
      setConfigMap((prev) => ({ ...prev, [node.data.modelUrl]: config }));
    });

    return () => {
      cancelled = true;
    };
  }, [configMap, selectedWorkflowNode]);

  useEffect(() => {
    const handleOverlayActivity = (event: Event) => {
      const detail = (
        event as CustomEvent<{ nodeId?: string; active?: boolean }>
      ).detail;
      const nodeId = typeof detail?.nodeId === "string" ? detail.nodeId : "";
      if (!nodeId) return;

      setActiveOverlayNodeIds((prev) => {
        if (detail?.active) {
          return prev.includes(nodeId) ? prev : [...prev, nodeId];
        }
        return prev.filter((id) => id !== nodeId);
      });
    };

    window.addEventListener(
      "z-image:canvas-overlay-activity",
      handleOverlayActivity as EventListener,
    );

    return () => {
      window.removeEventListener(
        "z-image:canvas-overlay-activity",
        handleOverlayActivity as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCreations = async () => {
      try {
        const response = await fetch("/api/workbench/creations?limit=30");
        const result = await response.json();
        if (!response.ok || result.code !== 0) return;

        const items = Array.isArray(result.data?.items)
          ? (result.data.items as WorkbenchCreationRecord[]).map(
              mapCreationRecordToGeneratedItem,
            )
          : [];

        if (!cancelled) setHistoryItems(items);
      } catch {
        if (!cancelled) setHistoryItems([]);
      }
    };

    void loadCreations();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const currentConfig = selectedWorkflowNode
    ? configMap[selectedWorkflowNode.data.modelUrl]
    : undefined;

  const selectedNode = useMemo(
    () =>
      graph.selection.nodeId
        ? (graph.nodes.find((node) => node.id === graph.selection.nodeId) ??
          null)
        : null,
    [graph.nodes, graph.selection.nodeId],
  );

  useEffect(() => {
    if (!selectedWorkflowNode || !currentConfig) {
      setTemplateItems([]);
      return;
    }

    let cancelled = false;
    buildWorkbenchTemplateCatalog({
      sceneId: selectedWorkflowNode.data.sceneId,
      sceneLabel: selectedWorkflowNode.data.sceneLabel,
      modelUrl: selectedWorkflowNode.data.modelUrl,
      modelLabel: selectedWorkflowNode.data.modelLabel,
      config: currentConfig,
    })
      .then((items) => {
        if (!cancelled) {
          setTemplateItems(
            filterWorkbenchTemplateSamplesByPolicy(items, "default"),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setTemplateItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [currentConfig, selectedWorkflowNode]);

  const references = useMemo(
    () =>
      getReferenceItemsFromGraph(
        selectedWorkflowNode,
        graph.nodes,
        graph.edges,
      ) as CanvasReferenceItem[],
    [graph.edges, graph.nodes, selectedWorkflowNode],
  );

  const attachableNodes = useMemo(
    () =>
      selectedWorkflowNode
        ? graph.nodes.filter(
            (node) =>
              node.id !== selectedWorkflowNode.id &&
              canAttachNodeToWorkflow(node, selectedWorkflowNode),
          )
        : [],
    [graph.nodes, selectedWorkflowNode],
  );

  const agentSuggestions = useMemo<CanvasAgentSuggestion[]>(() => {
    const isZh = locale.toLowerCase().startsWith("zh");
    if (isZh) {
      return [
        {
          id: "agent-image-commerce",
          title: "电商套图",
          description: "一键生成全平台主图套装",
          prompt:
            "帮我生成一组高级感电商主图，适合护肤产品，先出主图和两张细节图。",
          composerLabel: "选个方向",
          composerPrompt: "帮我做一套电商主图，产品是：",
          quickOptions: [
            {
              id: "commerce-amazon-listing",
              label: "Amazon Listing",
              prompt:
                "帮我做一套适合 Amazon Listing 的主图套装，包含主图、卖点图、尺寸/细节展示，产品是：",
            },
            {
              id: "commerce-shopify-hero",
              label: "Shopify Hero",
              prompt:
                "帮我做一组适合 Shopify 独立站首页 Hero Banner 与首屏产品视觉，产品是：",
            },
            {
              id: "commerce-meta-ads",
              label: "Meta Ads",
              prompt:
                "帮我做一组适合 Facebook / Instagram 投放的电商广告素材，突出卖点与转化感，产品是：",
            },
            {
              id: "commerce-pdp-features",
              label: "PDP 卖点图",
              prompt:
                "帮我做一组适合海外电商 PDP 详情页的卖点讲解图，突出功能、对比与使用场景，产品是：",
            },
          ],
          mode: "auto",
          icon: "commerce",
        },
        {
          id: "agent-poster-design",
          title: "海报设计",
          description: "营销 / 节日 / 活动主视觉",
          prompt:
            "帮我设计一张活动海报主视觉，画面醒目，有品牌感，适合线上传播。",
          composerPrompt: "帮我设计一张海报，主题是：",
          quickOptions: [
            {
              id: "poster-sale-campaign",
              label: "促销活动",
              prompt:
                "帮我设计一张适合海外电商促销活动的海报，突出折扣、限时感和购买转化，主题是：",
            },
            {
              id: "poster-seasonal-launch",
              label: "季节上新",
              prompt:
                "帮我设计一张适合季节上新发布的产品海报，强调新品氛围和品牌调性，主题是：",
            },
            {
              id: "poster-social-announcement",
              label: "社媒宣发",
              prompt:
                "帮我设计一张适合 Instagram / Facebook 宣发的品牌海报，画面抓眼、适合线上传播，主题是：",
            },
            {
              id: "poster-event-key-visual",
              label: "活动主视觉",
              prompt:
                "帮我设计一张品牌活动主视觉海报，强调视觉冲击力和统一品牌感，主题是：",
            },
          ],
          mode: "auto",
          icon: "poster",
        },
        {
          id: "agent-brand-design",
          title: "品牌设计",
          description: "Logo / VI / 品牌全套识别",
          prompt:
            "帮我围绕一个轻奢护肤品牌做品牌视觉方案，包含 logo 气质、主色和 KV 风格。",
          composerLabel: "选个方向",
          composerPrompt: "为我的品牌做一套视觉方案，品牌名称是：",
          quickOptions: [
            {
              id: "brand-logo-design",
              label: "Logo 设计",
              prompt: "为我的公司设计一套 Logo，公司名字是：",
            },
            {
              id: "brand-vi-system",
              label: "VI 全套设计",
              prompt: "为我的品牌设计一套完整 VI 视觉识别系统，品牌名称是：",
            },
            {
              id: "brand-mascot",
              label: "品牌战役",
              prompt:
                "为我的品牌策划一套 campaign 主视觉方向，包含核心视觉语言与传播风格，品牌名称是：",
            },
            {
              id: "brand-assets",
              label: "品牌周边",
              prompt:
                "为我的品牌设计一组品牌周边延展视觉，包含包装、贴纸或礼品风格，品牌名称是：",
            },
            {
              id: "brand-ip-design",
              label: "IP 设计",
              prompt: "为我的品牌设计一个专属 IP 形象与视觉设定，品牌名称是：",
            },
          ],
          mode: "ask",
          icon: "brand",
        },
        {
          id: "agent-interior-design",
          title: "室内设计",
          description: "户型上色 / 装修方案 / 材质拼板",
          prompt:
            "帮我做一套现代极简风格的室内设计概念图，包含客厅主视角和材质氛围。",
          composerLabel: "选个方向",
          composerPrompt: "帮我做一套室内设计方案，空间需求是：",
          quickOptions: [
            {
              id: "interior-3d-render",
              label: "3D 渲染",
              prompt:
                "帮我做一组室内设计 3D 渲染效果图，强调空间氛围、光影和整体风格，空间需求是：",
            },
            {
              id: "interior-floor-plan",
              label: "彩平图",
              prompt:
                "帮我做一张室内设计彩平图，清晰展示功能分区、动线和软装配色，空间需求是：",
            },
            {
              id: "interior-material-board",
              label: "材质拼板",
              prompt:
                "帮我做一组室内设计材质拼板，体现主材、配色和风格方向，空间需求是：",
            },
            {
              id: "interior-furniture-plan",
              label: "家具方案",
              prompt:
                "帮我做一套室内家具配置方案，突出家具组合、尺度和风格统一，空间需求是：",
            },
            {
              id: "interior-detail-closeup",
              label: "细部大样",
              prompt:
                "帮我做一组室内设计细部大样图，突出节点、材质收口和局部质感，空间需求是：",
            },
          ],
          mode: "auto",
          icon: "interior",
        },
        {
          id: "agent-social-media",
          title: "社交媒体",
          description: "轮播、跨平台适配、投放素材、视频模封",
          prompt:
            "帮我生成一组适合小红书和 Instagram 的社交媒体视觉，统一风格并适合轮播。",
          composerLabel: "选个方向",
          composerPrompt: "帮我做一组海外社交媒体视觉，产品或主题是：",
          quickOptions: [
            {
              id: "social-carousel",
              label: "社交轮播",
              prompt:
                "帮我做一组适合 Instagram / LinkedIn 的社交轮播图，强调连续叙事和统一视觉，产品或主题是：",
            },
            {
              id: "social-cross-platform",
              label: "跨平台适配",
              prompt:
                "帮我做一组适配 Instagram、Facebook、X 和 LinkedIn 的跨平台社交媒体视觉，产品或主题是：",
            },
            {
              id: "social-paid-creative",
              label: "投放创意",
              prompt:
                "帮我做一组适合 Meta Ads / TikTok Ads 的投放创意素材，突出转化和卖点表达，产品或主题是：",
            },
            {
              id: "social-video-cover",
              label: "视频横封",
              prompt:
                "帮我做一组适合 YouTube Shorts、TikTok 或 Reels 的视频封面与横封视觉，产品或主题是：",
            },
            {
              id: "social-static-post",
              label: "发帖图文",
              prompt:
                "帮我做一组适合海外社交平台日常发帖的图文视觉，强调品牌感和互动感，产品或主题是：",
            },
          ],
          mode: "auto",
          icon: "social",
        },
        {
          id: "agent-story-short",
          title: "剧情短片",
          description: "自动生成剧本与分镜短片",
          prompt: "帮我做一支带剧情转折的短片，先规划分镜和主要镜头氛围。",
          composerLabel: "选个方向",
          composerPrompt: "帮我做一支适合海外平台的剧情短片，主题是：",
          quickOptions: [
            {
              id: "story-narrative-short",
              label: "故事短片",
              prompt:
                "帮我做一支适合海外短视频平台传播的故事短片，强调情节起伏、情感钩子和结尾反转，主题是：",
            },
            {
              id: "story-micro-drama",
              label: "微短剧",
              prompt:
                "帮我做一支适合 TikTok / Reels 风格的微短剧，节奏快、冲突强、适合连续追更，主题是：",
            },
            {
              id: "story-cinematic-short",
              label: "电影感短片",
              prompt:
                "帮我做一支电影感剧情短片，强调镜头语言、氛围和情绪张力，主题是：",
            },
            {
              id: "story-vlog-short",
              label: "Vlog 短片",
              prompt:
                "帮我做一支带剧情包装的 Vlog 短片，适合 YouTube Shorts / TikTok 的生活方式内容，主题是：",
            },
            {
              id: "story-creative-ad",
              label: "创意广告片",
              prompt:
                "帮我做一支带故事线的创意广告短片，适合海外社交平台投放和品牌传播，主题是：",
            },
          ],
          mode: "ask",
          icon: "story",
        },
        {
          id: "agent-video-marketing",
          title: "营销视频",
          description: "一句话帮你生成营销推广视频",
          prompt:
            "帮我做一支 8 秒营销短视频，画面高级、节奏利落，突出产品卖点。",
          composerLabel: "选个方向",
          composerPrompt: "帮我做一支适合海外市场的营销视频，产品或主题是：",
          quickOptions: [
            {
              id: "marketing-video-feed-15s",
              label: "信息流 15s",
              prompt:
                "帮我做一支适合 TikTok、Reels 和 Meta Feed 投放的 15 秒信息流营销视频，强调前 3 秒钩子和转化表达，产品或主题是：",
            },
            {
              id: "marketing-video-tvc-30s",
              label: "标准 TVC 30s",
              prompt:
                "帮我做一支 30 秒标准 TVC 风格的营销视频，强调品牌质感、卖点铺陈和完整节奏，产品或主题是：",
            },
            {
              id: "marketing-video-brand-story-60s",
              label: "品牌故事 60s",
              prompt:
                "帮我做一支 60 秒品牌故事营销视频，强调品牌价值、情绪氛围和长期记忆点，产品或主题是：",
            },
            {
              id: "marketing-video-amazon",
              label: "亚马逊适配",
              prompt:
                "帮我做一支适合 Amazon Listing / Marketplace 商品页的营销视频，突出功能演示和购买决策信息，产品或主题是：",
            },
          ],
          mode: "auto",
          icon: "ad",
        },
        {
          id: "agent-smart-comic",
          title: "智能漫剧",
          description: "剧情分镜 / 角色一致短片",
          prompt:
            "帮我生成一组适合漫剧的分镜画面，保持角色一致性和明确剧情推进。",
          composerLabel: "选个方向",
          composerPrompt: "帮我做一组适合海外受众的智能漫剧内容，主题是：",
          quickOptions: [
            {
              id: "comic-narrative-short",
              label: "剧情短片",
              prompt:
                "帮我做一组剧情短片式漫剧分镜，强调故事推进、镜头节奏和角色一致性，主题是：",
            },
            {
              id: "comic-series",
              label: "系列漫剧",
              prompt:
                "帮我做一组适合海外平台连载的系列漫剧内容，强调章节感、角色稳定和追更动力，主题是：",
            },
            {
              id: "comic-character-sheet",
              label: "角色定稿",
              prompt:
                "帮我做一组漫剧角色定稿与设定图，确保角色外观、服装和气质统一，主题是：",
            },
            {
              id: "comic-storyboard",
              label: "漫画分镜板",
              prompt:
                "帮我做一组漫画分镜板，突出镜头构图、情节转场和阅读节奏，主题是：",
            },
            {
              id: "comic-character-showcase",
              label: "角色展示",
              prompt:
                "帮我做一组角色展示型漫剧画面，用于展示主角魅力、设定和世界观，主题是：",
            },
          ],
          mode: "ask",
          icon: "comic",
        },
      ];
    }

    return [
      {
        id: "agent-image-commerce",
        title: "Commerce Set",
        description: "Generate a full cross-platform product key visual set",
        prompt:
          "Create a premium ecommerce hero image for a skincare product, then expand it into two detail-focused variations.",
        composerLabel: "Pick a direction",
        composerPrompt: "Create a commerce hero image set for this product:",
        quickOptions: [
          {
            id: "commerce-amazon-listing",
            label: "Amazon Listing",
            prompt:
              "Create an Amazon listing image set for this product, including the main image, key feature slides, and size/detail frames:",
          },
          {
            id: "commerce-shopify-hero",
            label: "Shopify Hero",
            prompt:
              "Create a Shopify storefront hero banner and above-the-fold product visual set for this product:",
          },
          {
            id: "commerce-meta-ads",
            label: "Meta Ads",
            prompt:
              "Create a set of Meta ad creatives for Facebook and Instagram focused on conversion and clear product benefits for this product:",
          },
          {
            id: "commerce-pdp-features",
            label: "PDP Features",
            prompt:
              "Create a PDP feature visual pack for this product with benefit callouts, comparison moments, and usage scenarios:",
          },
        ],
        mode: "auto",
        icon: "commerce",
      },
      {
        id: "agent-poster-design",
        title: "Poster Design",
        description: "Marketing, holiday, and campaign key visuals",
        prompt:
          "Design a campaign poster key visual with strong hierarchy and a polished brand feel.",
        composerPrompt: "Design a poster for this theme:",
        quickOptions: [
          {
            id: "poster-sale-campaign",
            label: "Sale Campaign",
            prompt:
              "Design a promotional poster for an overseas ecommerce sale campaign with strong discount messaging, urgency, and conversion-focused hierarchy for this theme:",
          },
          {
            id: "poster-seasonal-launch",
            label: "Seasonal Launch",
            prompt:
              "Design a seasonal product launch poster with a fresh campaign feel and a strong branded visual direction for this theme:",
          },
          {
            id: "poster-social-announcement",
            label: "Social Promo",
            prompt:
              "Design a poster for Instagram and Facebook promotion with bold visual impact and strong social-first composition for this theme:",
          },
          {
            id: "poster-event-key-visual",
            label: "Event KV",
            prompt:
              "Design an event key visual poster with clear hierarchy, campaign polish, and strong brand presence for this theme:",
          },
        ],
        mode: "auto",
        icon: "poster",
      },
      {
        id: "agent-brand-design",
        title: "Brand Design",
        description: "Logo, VI, and full brand identity directions",
        prompt:
          "Create a brand visual direction for a premium skincare label, including logo mood, colors, and key visual style.",
        composerLabel: "Pick a direction",
        composerPrompt: "Create a brand visual system for this company:",
        quickOptions: [
          {
            id: "brand-logo-design",
            label: "Logo Design",
            prompt: "Design a logo system for my company. The company name is:",
          },
          {
            id: "brand-vi-system",
            label: "VI System",
            prompt:
              "Create a full visual identity system for my brand, including color, typography, and core brand rules. The brand name is:",
          },
          {
            id: "brand-campaign",
            label: "Brand Campaign",
            prompt:
              "Create a brand campaign visual direction with a clear hero look, communication mood, and rollout style. The brand name is:",
          },
          {
            id: "brand-assets",
            label: "Brand Assets",
            prompt:
              "Create a set of branded merchandise and supporting visual assets for my brand. The brand name is:",
          },
          {
            id: "brand-ip-design",
            label: "IP Design",
            prompt:
              "Design a signature brand IP character and visual world for my brand. The brand name is:",
          },
        ],
        mode: "ask",
        icon: "brand",
      },
      {
        id: "agent-interior-design",
        title: "Interior Design",
        description: "Color studies, renovation concepts, and material boards",
        prompt:
          "Create a modern minimalist interior concept with a main living-room view and a matching material mood board.",
        composerLabel: "Pick a direction",
        composerPrompt: "Create an interior design concept for this space:",
        quickOptions: [
          {
            id: "interior-3d-render",
            label: "3D Render",
            prompt:
              "Create a set of interior 3D renders with strong atmosphere, lighting, and a cohesive design direction for this space:",
          },
          {
            id: "interior-floor-plan",
            label: "Color Plan",
            prompt:
              "Create a colored floor plan that clearly shows zoning, circulation, and key furniture layout for this space:",
          },
          {
            id: "interior-material-board",
            label: "Material Board",
            prompt:
              "Create an interior material board with finishes, colors, and style references for this space:",
          },
          {
            id: "interior-furniture-plan",
            label: "Furniture Plan",
            prompt:
              "Create an interior furniture plan with coordinated furniture choices, layout logic, and style consistency for this space:",
          },
          {
            id: "interior-detail-closeup",
            label: "Detail Views",
            prompt:
              "Create a set of interior detail views that highlight joinery, material transitions, and local design moments for this space:",
          },
        ],
        mode: "auto",
        icon: "interior",
      },
      {
        id: "agent-social-media",
        title: "Social Media",
        description:
          "Carousels, cross-platform assets, paid creatives, and covers",
        prompt:
          "Generate a unified social media visual set for Instagram and Xiaohongshu that works as a swipe carousel.",
        composerLabel: "Pick a direction",
        composerPrompt:
          "Create an overseas social media visual set for this product or theme:",
        quickOptions: [
          {
            id: "social-carousel",
            label: "Carousel",
            prompt:
              "Create a social carousel set for Instagram and LinkedIn with strong visual continuity and clear storytelling for this product or theme:",
          },
          {
            id: "social-cross-platform",
            label: "Cross-Platform",
            prompt:
              "Create a cross-platform social asset set adapted for Instagram, Facebook, X, and LinkedIn for this product or theme:",
          },
          {
            id: "social-paid-creative",
            label: "Paid Creative",
            prompt:
              "Create a set of paid social creatives for Meta Ads and TikTok Ads with conversion-focused messaging and clear product benefits for this product or theme:",
          },
          {
            id: "social-video-cover",
            label: "Video Cover",
            prompt:
              "Create a set of video cover visuals for YouTube Shorts, TikTok, and Reels for this product or theme:",
          },
          {
            id: "social-static-post",
            label: "Static Posts",
            prompt:
              "Create a set of branded static social posts for overseas platforms with strong engagement and brand consistency for this product or theme:",
          },
        ],
        mode: "auto",
        icon: "social",
      },
      {
        id: "agent-story-short",
        title: "Story Short",
        description: "Auto-generate scripts and storyboard-driven shorts",
        prompt:
          "Help me plan a short narrative video with a clear story beat and storyboard-friendly shot structure.",
        composerLabel: "Pick a direction",
        composerPrompt:
          "Create a story-driven short video for overseas platforms around this theme:",
        quickOptions: [
          {
            id: "story-narrative-short",
            label: "Narrative Short",
            prompt:
              "Create a narrative short for overseas short-video platforms with a strong hook, emotional arc, and satisfying twist around this theme:",
          },
          {
            id: "story-micro-drama",
            label: "Micro Drama",
            prompt:
              "Create a fast-paced micro drama for TikTok and Reels with high conflict, cliffhanger energy, and bingeable structure around this theme:",
          },
          {
            id: "story-cinematic-short",
            label: "Cinematic Short",
            prompt:
              "Create a cinematic short with strong visual language, mood, and emotional tension around this theme:",
          },
          {
            id: "story-vlog-short",
            label: "Vlog Short",
            prompt:
              "Create a story-led vlog short for YouTube Shorts and TikTok with lifestyle energy and natural pacing around this theme:",
          },
          {
            id: "story-creative-ad",
            label: "Creative Ad",
            prompt:
              "Create a story-driven creative ad short for overseas social platforms with clear brand appeal and strong audience retention around this theme:",
          },
        ],
        mode: "ask",
        icon: "story",
      },
      {
        id: "agent-video-marketing",
        title: "Marketing Video",
        description: "Turn one sentence into a promotional video concept",
        prompt:
          "Create an 8-second marketing video with premium lighting, crisp pacing, and clear product selling points.",
        composerLabel: "Pick a direction",
        composerPrompt:
          "Create a marketing video for overseas audiences around this product or theme:",
        quickOptions: [
          {
            id: "marketing-video-feed-15s",
            label: "15s Feed Ad",
            prompt:
              "Create a 15-second feed ad for TikTok, Reels, and Meta placements with a strong first-3-second hook and clear conversion messaging for this product or theme:",
          },
          {
            id: "marketing-video-tvc-30s",
            label: "30s TVC",
            prompt:
              "Create a 30-second TVC-style marketing video with strong brand polish, clear product benefits, and a complete narrative arc for this product or theme:",
          },
          {
            id: "marketing-video-brand-story-60s",
            label: "60s Brand Story",
            prompt:
              "Create a 60-second brand story marketing video with emotional pacing, brand values, and memorable storytelling for this product or theme:",
          },
          {
            id: "marketing-video-amazon",
            label: "Amazon Ready",
            prompt:
              "Create a marketplace-ready product marketing video for Amazon and similar listings with clear feature demos and decision-driving information for this product or theme:",
          },
        ],
        mode: "auto",
        icon: "ad",
      },
      {
        id: "agent-smart-comic",
        title: "Smart Comic",
        description: "Story shots and character-consistent short-form scenes",
        prompt:
          "Create a comic-style sequence with consistent characters and clear scene-to-scene progression.",
        composerLabel: "Pick a direction",
        composerPrompt:
          "Create a smart comic concept for overseas audiences around this theme:",
        quickOptions: [
          {
            id: "comic-narrative-short",
            label: "Narrative Short",
            prompt:
              "Create a comic-style narrative short with clear scene progression, pacing, and consistent characters around this theme:",
          },
          {
            id: "comic-series",
            label: "Series Comic",
            prompt:
              "Create a serialized comic concept for overseas platforms with recurring characters, episode continuity, and bingeable appeal around this theme:",
          },
          {
            id: "comic-character-sheet",
            label: "Character Sheet",
            prompt:
              "Create a character sheet set for a smart comic project with stable appearance, outfit logic, and personality clarity around this theme:",
          },
          {
            id: "comic-storyboard",
            label: "Storyboard",
            prompt:
              "Create a comic storyboard board with strong framing, readable action beats, and clear visual transitions around this theme:",
          },
          {
            id: "comic-character-showcase",
            label: "Character Showcase",
            prompt:
              "Create a character showcase set for a smart comic project that highlights hero appeal, design details, and world-building around this theme:",
          },
        ],
        mode: "ask",
        icon: "comic",
      },
    ];
  }, [locale]);

  const currentAgentThread = useMemo(
    () => agentThreads.find((thread) => thread.id === agentThreadId) || null,
    [agentThreadId, agentThreads],
  );
  const latestAgentThreadId = agentThreads[0]?.id || null;

  const pendingResultMapRef = useRef<
    Record<string, CanvasPendingResultContext>
  >({});
  const submissionQueueRef = useRef<CanvasSubmissionQueueItem[]>([]);
  const agentTaskMessageMapRef = useRef<Record<string, string>>({});
  const agentWorkflowMessageMapRef = useRef<Record<string, string>>({});
  const agentThreadRefreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;

    const storageKey = `${CANVAS_AGENT_AUTO_OPEN_STORAGE_KEY_PREFIX}${projectId}`;
    if (window.sessionStorage.getItem(storageKey) !== "1") return;

    window.sessionStorage.removeItem(storageKey);
    setAgentOpen(true);
  }, [projectId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTaskSubmitted = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          requestId?: string;
          scenario?: string;
          modelUrl?: string;
        }>
      ).detail;

      if (!detail?.requestId) return;

      const queueIndex = submissionQueueRef.current.findIndex((item) => {
        if (detail.modelUrl && item.modelUrl === detail.modelUrl) return true;
        if (detail.scenario && item.sceneId === detail.scenario) return true;
        return false;
      });

      if (queueIndex === -1) return;

      const [item] = submissionQueueRef.current.splice(queueIndex, 1);
      if (!item) return;

      createPendingResultNode({
        sourceNode: item.sourceNode,
        mediaKind: item.mediaKind,
        taskId: detail.requestId,
        edgeSemantic: item.edgeSemantic,
        prompt: item.prompt,
        title: item.title,
        aspectRatio: item.aspectRatio,
        sceneId: detail.scenario || item.sceneId,
        modelUrl: item.modelUrl,
      });
    };

    window.addEventListener(
      "z-image:canvas-task-submitted",
      handleTaskSubmitted as EventListener,
    );

    return () => {
      window.removeEventListener(
        "z-image:canvas-task-submitted",
        handleTaskSubmitted as EventListener,
      );
    };
  }, []);

  const createPendingResultNode = (params: {
    sourceNode: CanvasNode;
    mediaKind: "image" | "video";
    taskId: string;
    edgeSemantic?: CanvasEdgeSemantic;
    reuseNodeId?: string;
    replaceSourceNode?: boolean;
    title?: string;
    creationRecordId?: string;
    prompt?: string;
    aspectRatio?: string;
    sceneId?: string;
    modelUrl?: string;
  }) => {
    console.log("[canvas] createPendingResultNode", {
      taskId: params.taskId,
      title: params.title,
      sourceNodeId: params.sourceNode.id,
      mediaKind: params.mediaKind,
      replaceSourceNode: params.replaceSourceNode,
      edgeSemantic: params.edgeSemantic,
      reuseNodeId: params.reuseNodeId,
    });
    const existing = pendingResultMapRef.current[params.taskId];
    if (existing) return existing.nodeId;

    const resultNodeId = params.reuseNodeId
      ? params.reuseNodeId
      : params.replaceSourceNode
        ? params.sourceNode.id
        : `result-${nanoid(6)}`;

    flushSync(() => {
      if (params.reuseNodeId || params.replaceSourceNode) {
        const targetNodeId = params.reuseNodeId ?? params.sourceNode.id;
        updateNode(targetNodeId, (node) => {
          if (node.kind === "workflow") {
            return {
              ...node,
              data: {
                ...node.data,
                generatedCreationRecordId:
                  params.creationRecordId ??
                  node.data.generatedCreationRecordId,
                status: "generating",
                errorMessage: undefined,
              },
            };
          }

          if (node.kind === "result") {
            return {
              ...node,
              data: {
                ...node.data,
                creationRecordId:
                  params.creationRecordId ?? node.data.creationRecordId,
                prompt: params.prompt ?? node.data.prompt,
                title: params.title ?? node.data.title,
                taskId: params.taskId,
                status: "generating",
                errorMessage: undefined,
                aspectRatio: params.aspectRatio ?? node.data.aspectRatio,
                sceneId: params.sceneId ?? node.data.sceneId,
                modelUrl: params.modelUrl ?? node.data.modelUrl,
                sourceNodeId: node.data.sourceNodeId ?? params.sourceNode.id,
              },
            };
          }

          if (node.kind === "input") {
            return {
              ...node,
              data: {
                ...node.data,
                creationRecordId:
                  params.creationRecordId ?? node.data.creationRecordId,
                prompt: params.prompt ?? node.data.prompt,
                status: "generating",
                errorMessage: undefined,
              },
            };
          }

          return node;
        });
        setSelection({ nodeId: targetNodeId, edgeId: null });
        return;
      }

      const resultCount = graph.nodes.filter(
        (node) => node.kind === "result",
      ).length;
      const nodeSize =
        params.mediaKind === "video"
          ? { width: 220, height: 140 }
          : { width: 118, height: 118 };
      addNode({
        id: resultNodeId,
        kind: "result",
        subtype: params.mediaKind,
        position: {
          x:
            params.sourceNode.position.x +
            params.sourceNode.size.width +
            140 +
            (resultCount % 2) * 24,
          y: params.sourceNode.position.y + Math.floor(resultCount / 2) * 24,
        },
        size: nodeSize,
        data: {
          mediaKind: params.mediaKind,
          url: "",
          creationRecordId: params.creationRecordId,
          prompt: params.prompt,
          title: params.title,
          taskId: params.taskId,
          status: "generating",
          aspectRatio: params.aspectRatio,
          sceneId: params.sceneId,
          modelUrl: params.modelUrl,
          sourceNodeId: params.sourceNode.id,
        },
      });
      addEdge({
        id: `edge-pending-${nanoid(6)}`,
        source: params.sourceNode.id,
        target: resultNodeId,
        semantic: params.edgeSemantic ?? "result",
      });
      setSelection({ nodeId: resultNodeId, edgeId: null });
    });
    pendingResultMapRef.current[params.taskId] = {
      nodeId: resultNodeId,
      sourceNodeId: params.sourceNode.id,
      mediaKind: params.mediaKind,
      replaceSourceNode: params.replaceSourceNode,
      edgeSemantic: params.edgeSemantic ?? "result",
      title: params.title,
      creationRecordId: params.creationRecordId,
      prompt: params.prompt,
      aspectRatio: params.aspectRatio,
      sceneId: params.sceneId,
      modelUrl: params.modelUrl,
    };
    return resultNodeId;
  };

  const resolvePendingResultNode = (
    taskId: string,
    params: {
      url: string;
      outputs?: string[];
      creationRecords?: Array<{ url: string; creationRecordId: string }>;
      title?: string;
      prompt?: string;
      sceneId?: string;
    },
  ) => {
    const pending = pendingResultMapRef.current[taskId];
    if (!pending) return false;

    if (pending.replaceSourceNode) {
      updateNode(pending.nodeId, (node) => {
        if (node.kind === "workflow") {
          return {
            ...node,
            data: {
              ...node.data,
              generatedImageUrl:
                pending.mediaKind === "image"
                  ? params.url
                  : node.data.generatedImageUrl,
              generatedVideoUrl:
                pending.mediaKind === "video"
                  ? params.url
                  : node.data.generatedVideoUrl,
              generatedCreationRecordId:
                params.creationRecords?.find((item) => item.url === params.url)
                  ?.creationRecordId ?? pending.creationRecordId,
              status: "success",
              errorMessage: undefined,
            },
          };
        }

        if (node.kind === "result") {
          return {
            ...node,
            data: {
              ...node.data,
              url: params.url,
              creationRecordId:
                params.creationRecords?.find((item) => item.url === params.url)
                  ?.creationRecordId ?? pending.creationRecordId,
              prompt: params.prompt ?? pending.prompt,
              title: params.title ?? pending.title,
              taskId,
              status: "success",
              errorMessage: undefined,
              sceneId: params.sceneId ?? pending.sceneId,
              aspectRatio: pending.aspectRatio,
              modelUrl: pending.modelUrl,
            },
          };
        }

        if (node.kind === "input") {
          return {
            ...node,
            data: {
              ...node.data,
              url: params.url,
              creationRecordId:
                params.creationRecords?.find((item) => item.url === params.url)
                  ?.creationRecordId ?? pending.creationRecordId,
              prompt: params.prompt ?? pending.prompt,
              status: "success",
              errorMessage: undefined,
            },
          };
        }

        return node;
      });
      delete pendingResultMapRef.current[taskId];
      return true;
    }

    updateNode(pending.nodeId, (node) =>
      node.kind === "result"
        ? {
            ...node,
            data: {
              ...node.data,
              url: params.url,
              creationRecordId:
                params.creationRecords?.find((item) => item.url === params.url)
                  ?.creationRecordId ?? pending.creationRecordId,
              outputs: undefined,
              title: params.title ?? pending.title,
              prompt: params.prompt ?? pending.prompt,
              taskId,
              status: "success",
              errorMessage: undefined,
              sceneId: params.sceneId ?? pending.sceneId,
            },
          }
        : node,
    );

    const extraOutputs = (params.outputs || []).filter(
      (item) => item !== params.url,
    );
    if (extraOutputs.length > 0) {
      const sourceNode = graph.nodes.find(
        (node) => node.id === pending.sourceNodeId,
      );
      if (sourceNode) {
        extraOutputs.forEach((url, index) => {
          const extraNodeId = `result-${nanoid(6)}`;
          const nodeSize =
            pending.mediaKind === "video"
              ? { width: 220, height: 140 }
              : { width: 118, height: 118 };
          addNode({
            id: extraNodeId,
            kind: "result",
            subtype: pending.mediaKind,
            position: {
              x:
                sourceNode.position.x +
                sourceNode.size.width +
                168 +
                index * 26,
              y: sourceNode.position.y + 42 + index * 20,
            },
            size: nodeSize,
            data: {
              mediaKind: pending.mediaKind,
              url,
              creationRecordId: params.creationRecords?.find(
                (item) => item.url === url,
              )?.creationRecordId,
              prompt: params.prompt ?? pending.prompt,
              title: params.title ?? pending.title,
              taskId,
              aspectRatio: pending.aspectRatio,
              sceneId: pending.sceneId,
              modelUrl: pending.modelUrl,
              sourceNodeId: pending.sourceNodeId,
              status: "success",
            },
          });
          addEdge({
            id: `edge-result-${nanoid(6)}`,
            source: pending.sourceNodeId,
            target: extraNodeId,
            semantic: pending.edgeSemantic,
          });
        });
      }
    }

    delete pendingResultMapRef.current[taskId];
    return true;
  };

  const failPendingResultNode = (taskId: string, message: string) => {
    const pending = pendingResultMapRef.current[taskId];
    if (!pending) return;
    updateNode(pending.nodeId, (node) =>
      node.kind === "workflow"
        ? {
            ...node,
            data: {
              ...node.data,
              status: "error",
              errorMessage: message,
            },
          }
        : node.kind === "result"
          ? {
              ...node,
              data: {
                ...node.data,
                status: "error",
                errorMessage: message,
              },
            }
          : node.kind === "input"
            ? {
                ...node,
                data: {
                  ...node.data,
                  status: "error",
                  errorMessage: message,
                },
              }
            : node,
    );
    delete pendingResultMapRef.current[taskId];
  };

  const getGenerationTaskId = (result: {
    requestId?: unknown;
    taskId?: unknown;
  }) => {
    if (typeof result.requestId === "string") return result.requestId;
    if (typeof result.taskId === "string") return result.taskId;
    return undefined;
  };

  const pollCanvasTaskResult = async (taskId: string, scenario: string) => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await fetch(
        `/api/ai/status?taskId=${encodeURIComponent(taskId)}&scenario=${encodeURIComponent(scenario)}`,
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || "任务状态查询失败");
      }

      const status = result?.data?.status;
      if (status === "completed") {
        const outputs = Array.isArray(result?.data?.outputs)
          ? result.data.outputs.filter(
              (item: unknown): item is string => typeof item === "string",
            )
          : [];
        const output =
          typeof result?.data?.output === "string"
            ? result.data.output
            : outputs[0] || result?.data?.imageUrl || result?.data?.videoUrl;
        if (!output || typeof output !== "string") {
          throw new Error("任务完成但未返回媒体结果");
        }
        return {
          output,
          outputs,
          creationRecords: Array.isArray(result?.data?.creationRecords)
            ? result.data.creationRecords.filter(
                (
                  item: unknown,
                ): item is {
                  url: string;
                  creationRecordId: string;
                } =>
                  Boolean(item) &&
                  typeof item === "object" &&
                  typeof (item as { url?: unknown }).url === "string" &&
                  typeof (item as { creationRecordId?: unknown })
                    .creationRecordId === "string",
              )
            : [],
        };
      }
      if (status === "failed") {
        throw new Error(result?.data?.error || "生成失败");
      }
    }

    throw new Error("生成超时，请稍后重试");
  };

  const pollCanvasTaskPayload = async (taskId: string, scenario: string) => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await fetch(
        `/api/ai/status?taskId=${encodeURIComponent(taskId)}&scenario=${encodeURIComponent(scenario)}`,
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || "任务状态查询失败");
      }

      const status = result?.data?.status;
      if (status === "completed") {
        return result?.data;
      }
      if (status === "failed") {
        throw new Error(result?.data?.error || "任务执行失败");
      }
    }

    throw new Error("任务处理超时");
  };

  const { requiredCredits } = useCanvasGenerationAdapter({
    workflowNode: selectedWorkflowNode,
    config: currentConfig,
  });

  const selectedScene = useMemo(
    () =>
      scenes.find((scene) => scene.id === selectedWorkflowNode?.data.sceneId) ??
      null,
    [scenes, selectedWorkflowNode?.data.sceneId],
  );

  useEffect(() => {
    if (!selectedScene?.children?.length) return;

    let cancelled = false;
    selectedScene.children.forEach((model) => {
      if (configMap[model.url]) return;
      getPlaygroundConfigByUrl(model.url).then((config) => {
        if (!config || cancelled) return;
        setConfigMap((prev) =>
          prev[model.url] ? prev : { ...prev, [model.url]: config },
        );
      });
    });

    return () => {
      cancelled = true;
    };
  }, [configMap, selectedScene?.children]);

  const referenceImageCount = selectedWorkflowNode
    ? getCanvasReferenceImageCount(
        selectedWorkflowNode.id,
        graph.nodes,
        graph.edges,
      )
    : 0;

  const currentModelOptions = useMemo(() => {
    const allowedSceneIds =
      selectedWorkflowNode &&
      (selectedWorkflowNode.subtype === "text-to-video" ||
        selectedWorkflowNode.subtype === "image-to-video")
        ? getAllowedSceneIdsForVideoReferenceCount(scenes, referenceImageCount)
        : null;
    const sourceScenes = allowedSceneIds
      ? scenes.filter((scene) => allowedSceneIds.has(scene.id))
      : selectedScene
        ? [selectedScene]
        : [];
    const sceneModels = sourceScenes.flatMap((scene) => scene.children ?? []);
    const subtypeMatchedModels = sceneModels.filter((model) => {
      const config = configMap[model.url];
      if (!config || !selectedWorkflowNode) return true;
      return config.scenarioType === selectedWorkflowNode.subtype;
    });
    const countSupportedModels = subtypeMatchedModels.filter((model) => {
      const config = configMap[model.url];
      if (!config) return true;
      return supportsImageReferenceCount(config, referenceImageCount);
    });
    const fallbackModels =
      countSupportedModels.length > 0
        ? countSupportedModels
        : subtypeMatchedModels.length > 0
          ? subtypeMatchedModels
          : sceneModels;
    const options = fallbackModels.map((model) => ({
      url: model.url,
      label: model.title || "Untitled model",
      badge: model.badge,
      iconUrl:
        getModelVendorLogo({ url: model.url, title: model.title }).url ||
        model.icon_url,
      monogram: (model.title || "M")
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase(),
    }));

    if (
      selectedWorkflowNode?.data.modelUrl &&
      !options.some(
        (option) => option.url === selectedWorkflowNode.data.modelUrl,
      )
    ) {
      options.unshift({
        url: selectedWorkflowNode.data.modelUrl,
        label: selectedWorkflowNode.data.modelLabel || "Model",
        badge: undefined,
        iconUrl: getModelVendorLogo({
          url: selectedWorkflowNode.data.modelUrl,
          title: selectedWorkflowNode.data.modelLabel,
        }).url,
        monogram: (selectedWorkflowNode.data.modelLabel || "M")
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
          .toUpperCase(),
      });
    }

    return options;
  }, [
    configMap,
    referenceImageCount,
    scenes,
    selectedScene,
    selectedWorkflowNode,
  ]);

  const composerParameterFields = useMemo(() => {
    const schema = currentConfig?.schema;
    if (!schema) return [];

    const priority = [
      "aspectRatio",
      "resolution",
      "outputFormat",
      "duration",
      "quality",
      "mode",
      "targetResolution",
      "width",
      "height",
      "count",
    ];
    const hiddenKeys = new Set(["prompt", "referenceImages"]);

    return Object.entries(schema)
      .filter(([key, field]) => {
        if (!field || field.visible === false || hiddenKeys.has(key))
          return false;
        if (
          field.type === "upload" ||
          field.type === "textarea" ||
          field.type === "text"
        ) {
          return false;
        }
        return (
          field.type === "select" ||
          field.type === "number" ||
          field.type === "slider" ||
          field.type === "toggle"
        );
      })
      .sort(([left], [right]) => {
        const leftIndex = priority.indexOf(left);
        const rightIndex = priority.indexOf(right);
        return (
          (leftIndex === -1 ? 999 : leftIndex) -
          (rightIndex === -1 ? 999 : rightIndex)
        );
      })
      .slice(0, 4)
      .flatMap(([key, field]) => (field ? [{ key, field }] : []));
  }, [currentConfig?.schema]);

  const syncCanvasUrl = (sceneId: string, modelUrl: string) => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const externalPathname =
      locale === defaultLocale ? pathname : `/${locale}${pathname}`;
    params.set("scene", sceneId);
    const modelKey = modelUrl.split("/").filter(Boolean).pop();
    if (modelKey) params.set("model", modelKey);
    const nextQuery = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      nextQuery ? `${externalPathname}?${nextQuery}` : externalPathname,
    );
  };

  const applySceneToWorkflow = (workflowNodeId: string, sceneId: string) => {
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene) return;
    const modelUrl = getPreferredSceneUrl(scene);
    const modelLabel =
      scene.children?.find((child) => child.url === modelUrl)?.title ||
      scene.title;
    const subtype =
      scene.category === "Video" ? "text-to-video" : "text-to-image";

    updateNode(workflowNodeId, (node) => {
      if (node.kind !== "workflow") return node;
      return {
        ...node,
        subtype,
        data: {
          ...node.data,
          sceneId: scene.id,
          sceneLabel: scene.title,
          modelUrl,
          modelLabel,
          settings: {
            ...getDefaultValues(configMap[modelUrl]),
            prompt: node.data.prompt,
          },
        },
      };
    });
    syncCanvasUrl(scene.id, modelUrl);
  };

  const applyModelToWorkflow = (workflowNodeId: string, modelUrl: string) => {
    const sceneEntry = findSceneForModelUrl(modelUrl);
    const scene = sceneEntry?.scene ?? null;
    const modelLabel = sceneEntry?.model?.title || "Model";
    const defaults = getDefaultValues(configMap[modelUrl]);

    updateNode(workflowNodeId, (node) => {
      if (node.kind !== "workflow") return node;
      return {
        ...node,
        data: {
          ...node.data,
          sceneId: scene?.id || node.data.sceneId,
          sceneLabel: scene?.title || node.data.sceneLabel,
          modelUrl,
          modelLabel,
          aspectRatio:
            typeof defaults.aspectRatio === "string"
              ? defaults.aspectRatio
              : node.data.aspectRatio,
          count:
            typeof defaults.count === "number"
              ? defaults.count
              : node.data.count,
          settings: {
            ...defaults,
            prompt: node.data.prompt,
          },
        },
      };
    });
    if (scene) syncCanvasUrl(scene.id, modelUrl);
  };

  const findSceneForModelUrl = (modelUrl: string) => {
    const scene = scenes.find(
      (item) =>
        item.url === modelUrl ||
        item.children?.some((child) => child.url === modelUrl),
    );
    const model = scene?.children?.find((child) => child.url === modelUrl);
    return scene ? { scene, model } : null;
  };

  const resolveModelForSubtype = async (
    workflow: CanvasWorkflowNode,
    subtype: CanvasWorkflowSubtype,
    referenceCount: number,
  ) => {
    const preferredUrl = swapModelUrlScenario(workflow.data.modelUrl, subtype);
    const candidateUrls = Array.from(
      new Set([
        preferredUrl,
        ...Object.keys(REGISTRY_KEY_BY_URL).filter(
          (url) =>
            url === `/${subtype}` ||
            url.startsWith(`/${subtype}/`) ||
            (subtype === "image-to-video" &&
              referenceCount > 1 &&
              url.startsWith("/reference-to-video/")),
        ),
      ]),
    );

    for (const modelUrl of candidateUrls) {
      const config =
        configMap[modelUrl] || (await getPlaygroundConfigByUrl(modelUrl));
      if (!config || config.scenarioType !== subtype) continue;
      if (!supportsImageReferenceCount(config, referenceCount)) continue;

      const sceneEntry = findSceneForModelUrl(modelUrl);
      if (!sceneEntry) continue;

      if (!configMap[modelUrl]) {
        setConfigMap((prev) => ({ ...prev, [modelUrl]: config }));
      }

      return {
        config,
        modelUrl,
        modelLabel: sceneEntry.model?.title || config.model.name || "Model",
        sceneId: sceneEntry.scene.id,
        sceneLabel: sceneEntry.scene.title,
      };
    }

    return null;
  };

  const switchWorkflowForReferences = async (
    workflow: CanvasWorkflowNode,
    subtype: CanvasWorkflowSubtype,
    referenceCount: number,
  ) => {
    const resolved = await resolveModelForSubtype(
      workflow,
      subtype,
      referenceCount,
    );
    if (!resolved) return;

    const defaults = getDefaultValues(resolved.config);
    updateNode(workflow.id, (node) => {
      if (node.kind !== "workflow") return node;
      return {
        ...node,
        subtype,
        data: {
          ...node.data,
          sceneId: resolved.sceneId,
          sceneLabel: resolved.sceneLabel,
          modelUrl: resolved.modelUrl,
          modelLabel: resolved.modelLabel,
          aspectRatio:
            typeof defaults.aspectRatio === "string"
              ? defaults.aspectRatio
              : node.data.aspectRatio,
          count:
            typeof defaults.count === "number"
              ? defaults.count
              : node.data.count,
          settings: {
            ...defaults,
            prompt: node.data.prompt,
          },
        },
      };
    });
    syncCanvasUrl(resolved.sceneId, resolved.modelUrl);
  };

  const generationCallbacks: GenerationCallbacks = useMemo(
    () => ({
      checkAccess: () => checkAccess(),
      showPricingModal: () => setIsShowPaymentModal(true),
      showSignModal: () => setIsShowSignModal(true),
      fetchUserInfo: async () => {
        await fetchUserInfo();
      },
      onStatusUpdate: () => {},
      deferPolling: true,
      onError: () => {},
      translateApiError: (translationKey) => tCommonApi(translationKey as any),
    }),
    [
      checkAccess,
      fetchUserInfo,
      setIsShowPaymentModal,
      setIsShowSignModal,
      tCommonApi,
    ],
  );

  const TOOL_REQUIRED_CREDITS: Partial<Record<string, number>> = {
    "image-eraser": 10,
    "image-background-remover": 2,
    "image-upscaler": 4,
  };

  const uploadFileToStorage = async (
    file: File,
    targetNode?: CanvasNode | null,
  ) => {
    const formData = new FormData();
    formData.append("files", file);
    if (targetNode?.kind === "workflow") {
      formData.append("sceneId", targetNode.data.sceneId);
      formData.append("sceneLabel", targetNode.data.sceneLabel);
      formData.append("modelUrl", targetNode.data.modelUrl);
      formData.append("modelLabel", targetNode.data.modelLabel);
    } else if (selectedWorkflowNode) {
      formData.append("sceneId", selectedWorkflowNode.data.sceneId);
      formData.append("sceneLabel", selectedWorkflowNode.data.sceneLabel);
      formData.append("modelUrl", selectedWorkflowNode.data.modelUrl);
      formData.append("modelLabel", selectedWorkflowNode.data.modelLabel);
    }

    const response = await fetch(getUploadEndpoint(file), {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    const url = result?.data?.urls?.[0];
    if (result?.code !== 0 || !url) {
      throw new Error(result?.message || "Upload failed");
    }

    return url as string;
  };

  const uploadDataUrlToStorage = async (
    dataUrl: string,
    filename: string,
    targetNode?: CanvasNode | null,
  ) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, {
      type: blob.type || "image/png",
    });
    return uploadFileToStorage(file, targetNode);
  };

  const insertGeneratedImageNode = (
    sourceNode: CanvasNode,
    imageUrl: string,
    prompt?: string,
    title?: string,
  ) => {
    const resultNodeId = `result-${nanoid(6)}`;
    const offsetIndex = graph.nodes.filter(
      (node) => node.kind === "result",
    ).length;
    addNode({
      id: resultNodeId,
      kind: "result",
      subtype: "image",
      position: {
        x:
          sourceNode.position.x +
          sourceNode.size.width +
          140 +
          (offsetIndex % 2) * 24,
        y: sourceNode.position.y + Math.floor(offsetIndex / 2) * 24,
      },
      size: { width: 118, height: 118 },
      data: {
        mediaKind: "image",
        url: imageUrl,
        prompt,
        title,
        sourceNodeId: sourceNode.id,
      },
    });
    addEdge({
      id: `edge-derive-${nanoid(6)}`,
      source: sourceNode.id,
      target: resultNodeId,
      semantic: "derivation",
    });
    setSelection({ nodeId: resultNodeId, edgeId: null });
  };

  const insertDerivedUploadedImageNode = (
    sourceNode: CanvasNode,
    imageUrl: string,
    label = "Cropped image",
  ) => {
    const resultNodeId = `result-${nanoid(6)}`;
    const resultCount = graph.nodes.filter(
      (node) => node.kind === "result",
    ).length;
    addNode({
      id: resultNodeId,
      kind: "result",
      subtype: "image",
      position: {
        x:
          sourceNode.position.x +
          sourceNode.size.width +
          132 +
          (resultCount % 3) * 18,
        y: sourceNode.position.y + 18 + Math.floor(resultCount / 3) * 18,
      },
      size: { width: 118, height: 118 },
      data: {
        mediaKind: "image",
        url: imageUrl,
        prompt: label,
        sourceNodeId: sourceNode.id,
      },
    });
    addEdge({
      id: `edge-crop-${nanoid(6)}`,
      source: sourceNode.id,
      target: resultNodeId,
      semantic: "derivation",
    });
    setSelection({ nodeId: resultNodeId, edgeId: null });
  };

  const insertDerivedUploadedVideoNode = (
    sourceNode: CanvasNode,
    videoUrl: string,
    label = "剪辑结果",
  ) => {
    const resultNodeId = `result-${nanoid(6)}`;
    const resultCount = graph.nodes.filter(
      (node) => node.kind === "result",
    ).length;
    addNode({
      id: resultNodeId,
      kind: "result",
      subtype: "video",
      position: {
        x:
          sourceNode.position.x +
          sourceNode.size.width +
          132 +
          (resultCount % 3) * 18,
        y: sourceNode.position.y + 18 + Math.floor(resultCount / 3) * 18,
      },
      size: { width: 220, height: 140 },
      data: {
        mediaKind: "video",
        url: videoUrl,
        prompt: label,
        title: label,
        derivationKind: "video-trim",
        sourceNodeId: sourceNode.id,
      },
    });
    addEdge({
      id: `edge-trim-${nanoid(6)}`,
      source: sourceNode.id,
      target: resultNodeId,
      semantic: "derivation",
    });
    setSelection({ nodeId: resultNodeId, edgeId: null });
  };

  const runStandaloneConfigGeneration = async (params: {
    sourceNode: CanvasNode;
    modelUrl: string;
    values: Record<string, any>;
    resultMode?: "create-node" | "replace-source";
    edgeSemantic?: CanvasEdgeSemantic;
  }) => {
    const config =
      configMap[params.modelUrl] ||
      (await getPlaygroundConfigByUrl(params.modelUrl));
    if (!config) {
      throw new Error("当前工具配置不可用");
    }
    if (!configMap[params.modelUrl]) {
      setConfigMap((prev) => ({ ...prev, [params.modelUrl]: config }));
    }

    const mediaKind =
      config.scenarioType === "text-to-video" ||
      config.scenarioType === "image-to-video"
        ? "video"
        : "image";
    const submissionNonce = nanoid(8);
    submissionQueueRef.current.push({
      nonce: submissionNonce,
      sourceNode: params.sourceNode,
      mediaKind,
      edgeSemantic: params.edgeSemantic ?? "result",
      prompt: String(params.values.prompt || ""),
      title: config.model.name,
      aspectRatio:
        typeof params.values.aspectRatio === "string"
          ? params.values.aspectRatio
          : undefined,
      sceneId: config.creditScenario || undefined,
      modelUrl: params.modelUrl,
    });
    let submittedTaskId: string | null = null;
    try {
      const result = await config.onGenerate(params.values, {
        callbacks: {
          ...generationCallbacks,
          modelUrl: params.modelUrl,
          modelLabel: config.model.name,
          onTaskSubmitted: async ({ requestId, scenario }) => {
            console.log("[canvas] standalone onTaskSubmitted", {
              requestId,
              scenario,
              modelUrl: params.modelUrl,
            });
            submittedTaskId = requestId;
            createPendingResultNode({
              sourceNode: params.sourceNode,
              mediaKind,
              taskId: requestId,
              edgeSemantic: params.edgeSemantic ?? "result",
              replaceSourceNode: params.resultMode === "replace-source",
              prompt: String(params.values.prompt || ""),
              title: config.model.name,
              aspectRatio:
                typeof params.values.aspectRatio === "string"
                  ? params.values.aspectRatio
                  : undefined,
              sceneId: scenario,
              modelUrl: params.modelUrl,
            });
          },
        },
        t: (key: string, payload?: Record<string, any>) => {
          const translated = tWave(key as never, payload as never);
          return typeof translated === "string"
            ? translated
            : payload?.defaultValue || key;
        },
        requiredCredits:
          (config.creditScenario
            ? TOOL_REQUIRED_CREDITS[config.creditScenario]
            : undefined) ?? null,
        remainingCredits: user?.credits?.remainingCredits ?? 0,
      });

      submissionQueueRef.current = submissionQueueRef.current.filter(
        (item) => item.nonce !== submissionNonce,
      );

      const generated =
        result.imageUrls || result.imageUrl || result.videoUrl || null;
      const bucket = Array.isArray(generated)
        ? generated
        : generated
          ? [generated]
          : [];
      const taskId = submittedTaskId || getGenerationTaskId(result);
      const scenario =
        typeof result.scenario === "string"
          ? result.scenario
          : typeof params.modelUrl === "string"
            ? params.modelUrl.replace(/^\//, "").replace(/\//g, "-")
            : undefined;

      if (taskId && bucket[0]) {
        const resolvedPending = resolvePendingResultNode(taskId, {
          url: bucket[0],
          outputs: bucket,
          title: config.model.name,
          prompt: String(params.values.prompt || ""),
        });
        if (!resolvedPending) {
          if (params.resultMode === "replace-source" && bucket[0]) {
            applyGeneratedOutputToSourceNode({
              sourceNode: params.sourceNode,
              mediaKind,
              url: bucket[0],
              prompt: String(params.values.prompt || ""),
              title: config.model.name,
              taskId,
              sceneId: scenario,
              modelUrl: params.modelUrl,
            });
          } else {
            bucket.forEach((url) =>
              insertGeneratedImageNode(
                params.sourceNode,
                url,
                String(params.values.prompt || ""),
                config.model.name,
              ),
            );
          }
        }
        return;
      }

      if (taskId && scenario) {
        if (!pendingResultMapRef.current[taskId]) {
          createPendingResultNode({
            sourceNode: params.sourceNode,
            mediaKind,
            taskId,
            edgeSemantic: params.edgeSemantic ?? "result",
            replaceSourceNode: params.resultMode === "replace-source",
            prompt: String(params.values.prompt || ""),
            title: config.model.name,
            aspectRatio:
              typeof params.values.aspectRatio === "string"
                ? params.values.aspectRatio
                : undefined,
            sceneId: scenario,
            modelUrl: params.modelUrl,
          });
        }

        void (async () => {
          try {
            const taskResult = await pollCanvasTaskResult(taskId, scenario);
            resolvePendingResultNode(taskId, {
              url: taskResult.output,
              outputs: taskResult.outputs,
              creationRecords: taskResult.creationRecords,
              title: config.model.name,
              prompt: String(params.values.prompt || ""),
            });
          } catch (error) {
            failPendingResultNode(
              taskId,
              error instanceof Error ? error.message : "生成失败",
            );
          }
        })();
        return;
      }

      if (params.resultMode === "replace-source" && bucket[0]) {
        applyGeneratedOutputToSourceNode({
          sourceNode: params.sourceNode,
          mediaKind,
          url: bucket[0],
          prompt: String(params.values.prompt || ""),
          title: config.model.name,
          taskId,
          sceneId: scenario,
          modelUrl: params.modelUrl,
        });
      } else {
        bucket.forEach((url) =>
          insertGeneratedImageNode(
            params.sourceNode,
            url,
            String(params.values.prompt || ""),
            config.model.name,
          ),
        );
      }
    } catch (error) {
      submissionQueueRef.current = submissionQueueRef.current.filter(
        (item) => item.nonce !== submissionNonce,
      );
      throw error;
    }
  };

  const getNodeImageUrl = (node: CanvasNode | undefined | null) => {
    if (!node) return null;
    if (node.kind === "workflow") {
      return node.data.generatedImageUrl || node.data.uploadedImageUrl || null;
    }
    if (node.kind === "input" && node.data.mediaKind === "image") {
      return node.data.url || null;
    }
    if (node.kind === "result" && node.data.mediaKind === "image") {
      return node.data.url || null;
    }
    return null;
  };

  const applyGeneratedOutputToSourceNode = (params: {
    sourceNode: CanvasNode;
    mediaKind: "image" | "video";
    url: string;
    creationRecordId?: string;
    prompt?: string;
    title?: string;
    taskId?: string | null;
    aspectRatio?: string;
    sceneId?: string;
    modelUrl?: string;
  }) => {
    updateNode(params.sourceNode.id, (node) => {
      if (node.kind === "workflow") {
        return {
          ...node,
          data: {
            ...node.data,
            generatedImageUrl:
              params.mediaKind === "image"
                ? params.url
                : node.data.generatedImageUrl,
            generatedVideoUrl:
              params.mediaKind === "video"
                ? params.url
                : node.data.generatedVideoUrl,
            generatedCreationRecordId:
              params.creationRecordId ?? node.data.generatedCreationRecordId,
            status: "success",
            errorMessage: undefined,
          },
        };
      }

      if (node.kind === "result") {
        return {
          ...node,
          data: {
            ...node.data,
            mediaKind: params.mediaKind,
            url: params.url,
            creationRecordId:
              params.creationRecordId ?? node.data.creationRecordId,
            prompt: params.prompt ?? node.data.prompt,
            title: params.title ?? node.data.title,
            taskId: params.taskId ?? node.data.taskId,
            status: "success",
            errorMessage: undefined,
            aspectRatio: params.aspectRatio ?? node.data.aspectRatio,
            sceneId: params.sceneId ?? node.data.sceneId,
            modelUrl: params.modelUrl ?? node.data.modelUrl,
          },
        };
      }

      if (node.kind === "input") {
        return {
          ...node,
          data: {
            ...node.data,
            mediaKind: params.mediaKind,
            url: params.url,
            creationRecordId:
              params.creationRecordId ?? node.data.creationRecordId,
            prompt: params.prompt ?? node.data.prompt,
            status: "success",
            errorMessage: undefined,
          },
        };
      }

      return node;
    });
    setSelection({ nodeId: params.sourceNode.id, edgeId: null });
  };

  const getUploadEndpoint = (file: File) => {
    if (file.type.startsWith("video/")) return "/api/storage/upload-video";
    if (file.type.startsWith("audio/")) return "/api/storage/upload-audio";
    return "/api/storage/upload-image";
  };

  const createSplitImageResultNode = (params: {
    sourceNode: CanvasNode;
    label: string;
    url: string;
    position: { x: number; y: number };
  }) => {
    const resultNodeId = `result-${nanoid(6)}`;
    addNode({
      id: resultNodeId,
      kind: "result",
      subtype: "image",
      position: params.position,
      size: { width: 118, height: 118 },
      data: {
        mediaKind: "image",
        url: params.url,
        prompt: params.label,
        title: params.label,
        sourceNodeId: params.sourceNode.id,
        status: "success",
      },
    });
    addEdge({
      id: `edge-split-${nanoid(6)}`,
      source: params.sourceNode.id,
      target: resultNodeId,
      semantic: "derivation",
    });
    return resultNodeId;
  };

  const splitImageIntoGrid = async (
    sourceImageUrl: string,
    grid: 2 | 3 | 4,
    sourceNode: CanvasNode,
  ) => {
    const image = new Image();
    let objectUrl: string | null = null;

    try {
      const response = await fetch(sourceImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch source image: ${response.status}`);
      }
      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
    } catch {
      objectUrl = null;
    }

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load source image"));
      image.src = objectUrl || sourceImageUrl;
    });

    try {
      const xBoundaries = Array.from({ length: grid + 1 }, (_, index) =>
        Math.round((image.naturalWidth * index) / grid),
      );
      const yBoundaries = Array.from({ length: grid + 1 }, (_, index) =>
        Math.round((image.naturalHeight * index) / grid),
      );
      const baseX = sourceNode.position.x + sourceNode.size.width + 144;
      const baseY = sourceNode.position.y + 12;
      let lastCreatedNodeId: string | null = null;

      for (let row = 0; row < grid; row += 1) {
        for (let col = 0; col < grid; col += 1) {
          const startX = xBoundaries[col] ?? 0;
          const endX = xBoundaries[col + 1] ?? image.naturalWidth;
          const startY = yBoundaries[row] ?? 0;
          const endY = yBoundaries[row + 1] ?? image.naturalHeight;
          const tileWidth = Math.max(1, endX - startX);
          const tileHeight = Math.max(1, endY - startY);
          const canvas = document.createElement("canvas");
          canvas.width = tileWidth;
          canvas.height = tileHeight;
          const context = canvas.getContext("2d");
          if (!context) continue;
          context.drawImage(
            image,
            startX,
            startY,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight,
          );
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png"),
          );
          if (!blob) continue;
          const uploadedUrl = await uploadFileToStorage(
            new File([blob], `split-${row + 1}-${col + 1}.png`, {
              type: "image/png",
            }),
            sourceNode,
          );
          lastCreatedNodeId = createSplitImageResultNode({
            sourceNode,
            label: `Cropped Image ${row + 1},${col + 1}`,
            url: uploadedUrl,
            position: {
              x: baseX + col * 164,
              y: baseY + row * 164,
            },
          });
        }
      }

      if (lastCreatedNodeId) {
        setSelection({ nodeId: lastCreatedNodeId, edgeId: null });
      }
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const handleImageToolAction = async (request: CanvasImageToolRequest) => {
    const sourceNode = graph.nodes.find((node) => node.id === request.nodeId);
    const sourceImageUrl = getNodeImageUrl(sourceNode);
    if (!sourceNode || !sourceImageUrl) return;
    const resultMode = "create-node";

    if (request.tool === "quick-split") {
      await splitImageIntoGrid(sourceImageUrl, request.grid || 2, sourceNode);
      return;
    }

    if (request.tool === "upscale") {
      await runStandaloneConfigGeneration({
        sourceNode,
        modelUrl: "/image-upscaler",
        edgeSemantic: "derivation",
        resultMode,
        values: {
          referenceImages: [{ url: sourceImageUrl, status: "success" }],
          prompt: "",
          targetResolution: request.targetResolution || "4k",
          outputFormat: request.outputFormat || "png",
        },
      });
      return;
    }

    if (request.tool === "cutout") {
      await runStandaloneConfigGeneration({
        sourceNode,
        modelUrl: "/image-background-remover",
        edgeSemantic: "derivation",
        resultMode,
        values: {
          referenceImages: [{ url: sourceImageUrl, status: "success" }],
          prompt: "",
        },
      });
      return;
    }

    if (
      request.tool === "redraw" ||
      request.tool === "erase" ||
      request.tool === "annotate"
    ) {
      const maskUrl = request.maskDataUrl
        ? await uploadDataUrlToStorage(
            request.maskDataUrl,
            `${request.tool}-mask.png`,
            sourceNode,
          )
        : undefined;

      await runStandaloneConfigGeneration({
        sourceNode,
        modelUrl: "/image-eraser",
        edgeSemantic: "derivation",
        resultMode,
        values: {
          referenceImages: [{ url: sourceImageUrl, status: "success" }],
          maskImage: maskUrl ? [{ url: maskUrl, status: "success" }] : [],
          prompt: request.prompt || "",
          outputFormat: request.outputFormat || "png",
        },
      });
      return;
    }

    if (request.tool === "relight") {
      const result = await executeGeneration(
        {
          apiEndpoint: "/api/ai/canvas-relight/generate",
          scenario: "gpt-image-2-image-to-image",
          requestBody: {
            image: sourceImageUrl,
            lighting: request.lighting,
            aspectRatio: "auto",
            resolution: "4k",
            outputFormat: request.outputFormat || "png",
          },
          requiredCredits: null,
          remainingCredits: user?.credits?.remainingCredits ?? 0,
        },
        {
          ...generationCallbacks,
          onTaskSubmitted: async ({ requestId, scenario }) => {
            createPendingResultNode({
              sourceNode,
              mediaKind: "image",
              taskId: requestId,
              edgeSemantic: "derivation",
              title: "打光",
              sceneId: scenario,
              modelUrl: "/image-to-image/gpt-image-2",
            });
          },
          onError: (message) => {
            throw new Error(message || "打光生成失败");
          },
        },
        (key: string, payload?: Record<string, any>) => {
          const translated = tWave(key as never, payload as never);
          return typeof translated === "string"
            ? translated
            : payload?.defaultValue || key;
        },
      );

      if (!result.success) {
        throw new Error(result.error || "打光生成失败");
      }

      const taskId = getGenerationTaskId({
        requestId: result.requestId,
        taskId: result.requestId,
      });

      if (!taskId) {
        throw new Error("打光生成没有返回任务 ID");
      }

      try {
        const taskResult = await pollCanvasTaskResult(
          taskId,
          "gpt-image-2-image-to-image",
        );
        resolvePendingResultNode(taskId, {
          url: taskResult.output,
          outputs: taskResult.outputs,
          creationRecords: taskResult.creationRecords,
          title: "打光",
        });
      } catch (error) {
        failPendingResultNode(
          taskId,
          error instanceof Error ? error.message : "打光生成失败",
        );
        throw error;
      }

      return;
    }

    if (request.tool === "multiple-angles") {
      const response = await fetch(
        "/api/ai/qwen-image-edit-multiple-angles/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images: [sourceImageUrl],
            prompt: request.prompt || "",
            horizontal_angle: request.multiAngle?.horizontalAngle ?? 0,
            vertical_angle: request.multiAngle?.verticalAngle ?? 0,
            distance: request.multiAngle?.distance ?? 1,
            size: request.multiAngle?.size || "1536*1536",
            output_format: request.outputFormat || "png",
          }),
        },
      );
      const result = await response.json();
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message || "多角度生成失败");
      }
      const taskId =
        typeof result?.data?.requestId === "string"
          ? result.data.requestId
          : typeof result?.data?.taskId === "string"
            ? result.data.taskId
            : null;
      if (!taskId) {
        throw new Error("多角度生成没有返回任务 ID");
      }

      createPendingResultNode({
        sourceNode,
        mediaKind: "image",
        taskId,
        edgeSemantic: "derivation",
        title: "多角度",
        prompt: request.prompt || "多角度",
        sceneId: "qwen-image-edit-multiple-angles",
      });

      try {
        const taskResult = await pollCanvasTaskResult(
          taskId,
          "qwen-image-edit-multiple-angles",
        );
        resolvePendingResultNode(taskId, {
          url: taskResult.output,
          outputs: taskResult.outputs,
          creationRecords: taskResult.creationRecords,
          title: "多角度",
          prompt: request.prompt || "多角度",
        });
      } catch (error) {
        failPendingResultNode(
          taskId,
          error instanceof Error ? error.message : "多角度生成失败",
        );
        throw error;
      }
      return;
    }

    if (request.tool === "expand") {
      const result = await executeGeneration(
        {
          apiEndpoint: "/api/ai/canvas-expand/generate",
          scenario: CANVAS_EXPAND_SCENE,
          requestBody: {
            image: sourceImageUrl,
            prompt: request.prompt || "",
            aspectRatio: request.aspectRatio || "16:9",
            resolution: "4k",
            outputFormat: request.outputFormat || "png",
          },
          requiredCredits: null,
          remainingCredits: user?.credits?.remainingCredits ?? 0,
        },
        {
          ...generationCallbacks,
          onTaskSubmitted: async ({ requestId }) => {
            createPendingResultNode({
              sourceNode,
              mediaKind: "image",
              taskId: requestId,
              edgeSemantic: "derivation",
              title: "扩图",
              prompt: request.prompt || "扩图",
              sceneId: CANVAS_EXPAND_SCENE,
              modelUrl: "/image-to-image/gpt-image-2",
            });
          },
          onError: (message) => {
            throw new Error(message || "扩图生成失败");
          },
        },
        (key: string, payload?: Record<string, any>) => {
          const translated = tWave(key as never, payload as never);
          return typeof translated === "string"
            ? translated
            : payload?.defaultValue || key;
        },
      );

      if (!result.success) {
        throw new Error(result.error || "扩图生成失败");
      }

      const taskId = getGenerationTaskId({
        requestId: result.requestId,
        taskId: result.requestId,
      });

      if (!taskId) {
        throw new Error("扩图生成没有返回任务 ID");
      }

      try {
        const taskResult = await pollCanvasTaskResult(
          taskId,
          CANVAS_EXPAND_PROVIDER_SCENARIO,
        );
        resolvePendingResultNode(taskId, {
          url: taskResult.output,
          outputs: taskResult.outputs,
          creationRecords: taskResult.creationRecords,
          title: "扩图",
          prompt: request.prompt || "扩图",
          sceneId: CANVAS_EXPAND_SCENE,
        });
      } catch (error) {
        failPendingResultNode(
          taskId,
          error instanceof Error ? error.message : "扩图生成失败",
        );
        throw error;
      }

      return;
    }
  };

  const handleImageCrop = async (nodeId: string, file: File) => {
    const sourceNode = graph.nodes.find((node) => node.id === nodeId);
    if (!sourceNode) return;
    const uploadedUrl = await uploadFileToStorage(file, sourceNode);
    insertDerivedUploadedImageNode(sourceNode, uploadedUrl, "Cropped image");
  };

  const handleVideoTrim = async (
    nodeId: string,
    file: File,
    meta: { trimStart: number; trimEnd: number; duration: number },
  ) => {
    const sourceNode = graph.nodes.find((node) => node.id === nodeId);
    if (!sourceNode) return;
    const uploadedUrl = await uploadFileToStorage(file, sourceNode);
    const trimDuration = Math.max(0, meta.trimEnd - meta.trimStart);
    const minutes = Math.floor(trimDuration / 60);
    const seconds = trimDuration - minutes * 60;
    const durationLabel = `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
    insertDerivedUploadedVideoNode(
      sourceNode,
      uploadedUrl,
      `剪辑结果 (${durationLabel})`,
    );
  };

  const handleVideoSegmentation = async (
    nodeId: string,
    request: CanvasVideoSegmentationInvocation,
  ): Promise<CanvasVideoSegmentationResult> => {
    const sourceNode = graph.nodes.find((node) => node.id === nodeId);
    if (!sourceNode) {
      throw new Error("视频节点不存在");
    }

    const requestBody: CanvasVideoSegmentationRequestBody = {
      video: request.videoUrl,
      duration: request.duration,
      prompt: request.prompt?.trim() || "selected object",
      point_prompts: [],
      box_prompts: [
        {
          frame_index: Math.max(0, Math.round(request.frameTime * 24)),
          object_id: 1,
          x_min: request.boxPrompt.x1,
          y_min: request.boxPrompt.y1,
          x_max: request.boxPrompt.x2,
          y_max: request.boxPrompt.y2,
        },
      ],
      apply_mask: false,
    };

    const result = await executeGeneration(
      {
        apiEndpoint: `/api/ai/${CANVAS_VIDEO_SEGMENTATION_SCENE}/generate`,
        scenario: CANVAS_VIDEO_SEGMENTATION_SCENE,
        requestBody,
        requiredCredits: null,
        remainingCredits: user?.credits?.remainingCredits ?? 0,
      },
      {
        ...generationCallbacks,
        deferPolling: true,
        onError: (message) => {
          throw new Error(message || "视频分割失败");
        },
      },
      (key: string, payload?: Record<string, any>) => {
        const translated = tWave(key as never, payload as never);
        return typeof translated === "string"
          ? translated
          : payload?.defaultValue || key;
      },
    );

    if (!result.success) {
      throw new Error(result.error || "视频分割失败");
    }

    const taskId = getGenerationTaskId({
      requestId: result.requestId,
      taskId: result.requestId,
    });
    if (!taskId) {
      throw new Error("视频分割没有返回任务 ID");
    }

    const taskData = await pollCanvasTaskPayload(
      taskId,
      CANVAS_VIDEO_SEGMENTATION_SCENE,
    );

    const mask = extractCanvasVideoSegmentationMask(taskData);
    if (!mask) {
      throw new Error("视频分割没有返回可用的蒙层");
    }

    return {
      mask,
    };
  };

  const handleVideoUpscale = async (
    nodeId: string,
    request: CanvasVideoUpscaleInvocation,
  ) => {
    const sourceNode = graph.nodes.find((node) => node.id === nodeId);
    if (!sourceNode) {
      throw new Error("视频节点不存在");
    }

    const requestBody: CanvasVideoUpscaleRequestBody = {
      video: request.videoUrl,
      target_resolution: request.targetResolution,
      duration: request.duration,
    };

    const result = await executeGeneration(
      {
        apiEndpoint: `/api/ai/${CANVAS_VIDEO_UPSCALER_SCENE}/generate`,
        scenario: CANVAS_VIDEO_UPSCALER_SCENE,
        requestBody,
        requiredCredits: null,
        remainingCredits: user?.credits?.remainingCredits ?? 0,
      },
      {
        ...generationCallbacks,
        onTaskSubmitted: async ({ requestId, scenario }) => {
          createPendingResultNode({
            sourceNode,
            mediaKind: "video",
            taskId: requestId,
            edgeSemantic: "derivation",
            title: "高清增强",
            prompt: `${request.targetResolution.toUpperCase()} 增强`,
            sceneId: scenario,
            modelUrl: "/video-upscaler",
          });
        },
        onError: (message) => {
          throw new Error(message || "视频高清增强失败");
        },
      },
      (key: string, payload?: Record<string, any>) => {
        const translated = tWave(key as never, payload as never);
        return typeof translated === "string"
          ? translated
          : payload?.defaultValue || key;
      },
    );

    if (!result.success) {
      throw new Error(result.error || "视频高清增强失败");
    }

    const taskId = getGenerationTaskId({
      requestId: result.requestId,
      taskId: result.requestId,
    });

    if (!taskId) {
      throw new Error("视频高清增强没有返回任务 ID");
    }

    try {
      const taskResult = await pollCanvasTaskResult(
        taskId,
        CANVAS_VIDEO_UPSCALER_SCENE,
      );
      resolvePendingResultNode(taskId, {
        url: taskResult.output,
        outputs: taskResult.outputs,
        creationRecords: taskResult.creationRecords,
        title: "高清增强",
        prompt: `${request.targetResolution.toUpperCase()} 增强`,
        sceneId: CANVAS_VIDEO_UPSCALER_SCENE,
      });
    } catch (error) {
      failPendingResultNode(
        taskId,
        error instanceof Error ? error.message : "视频高清增强失败",
      );
      throw error;
    }
  };

  const handleRemoveReference = (referenceId: string) => {
    if (!selectedWorkflowNode) return;

    if (referenceId === `${selectedWorkflowNode.id}-uploaded-image`) {
      const nextImageCount = getCanvasReferenceImageCount(
        selectedWorkflowNode.id,
        graph.nodes,
        graph.edges,
      );
      const targetSubtype = getWorkflowSubtypeForImageReferenceState(
        selectedWorkflowNode,
        nextImageCount,
      );
      updateNode(selectedWorkflowNode.id, (node) =>
        node.kind === "workflow"
          ? {
              ...node,
              data: {
                ...node.data,
                uploadedImageUrl: undefined,
                uploadedImageName: undefined,
              },
            }
          : node,
      );
      if (targetSubtype !== selectedWorkflowNode.subtype) {
        void switchWorkflowForReferences(
          selectedWorkflowNode,
          targetSubtype,
          nextImageCount,
        );
      }
      return;
    }

    if (referenceId === `${selectedWorkflowNode.id}-uploaded-video`) {
      updateNode(selectedWorkflowNode.id, (node) =>
        node.kind === "workflow"
          ? {
              ...node,
              data: {
                ...node.data,
                uploadedVideoUrl: undefined,
                uploadedVideoName: undefined,
              },
            }
          : node,
      );
      return;
    }

    const referenceEdge = graph.edges.find(
      (edge) =>
        edge.target === selectedWorkflowNode.id &&
        edge.source === referenceId &&
        edge.semantic === "reference",
    );
    if (referenceEdge) {
      const nextImageCount =
        getCanvasReferenceImageCount(
          selectedWorkflowNode.id,
          graph.nodes,
          graph.edges.filter((edge) => edge.id !== referenceEdge.id),
        ) + (selectedWorkflowNode.data.uploadedImageUrl ? 1 : 0);
      const targetSubtype = getWorkflowSubtypeForImageReferenceState(
        selectedWorkflowNode,
        nextImageCount,
      );
      removeEdge(referenceEdge.id);
      if (targetSubtype !== selectedWorkflowNode.subtype) {
        void switchWorkflowForReferences(
          selectedWorkflowNode,
          targetSubtype,
          nextImageCount,
        );
      }
    }
  };

  async function generateWorkflowNodeWithSnapshot(
    sourceNode: CanvasWorkflowNode,
    graphSnapshot: CanvasGraph,
  ) {
    const workflowNodeId = sourceNode.id;
    const workflowConfig =
      configMap[sourceNode.data.modelUrl] ||
      (await getPlaygroundConfigByUrl(sourceNode.data.modelUrl));
    if (!workflowConfig) {
      throw new Error("当前工作流还没有可用配置");
    }
    if (!configMap[sourceNode.data.modelUrl]) {
      setConfigMap((prev) => ({
        ...prev,
        [sourceNode.data.modelUrl]: workflowConfig,
      }));
    }

    const workflowReferences = getReferenceItemsFromGraph(
      sourceNode,
      graphSnapshot.nodes,
      graphSnapshot.edges,
    ) as CanvasReferenceItem[];
    const mediaKind =
      sourceNode.subtype === "text-to-video" ||
      sourceNode.subtype === "image-to-video"
        ? "video"
        : "image";

    const controlParams = graphSnapshot.edges
      .filter(
        (edge) => edge.target === sourceNode.id && edge.semantic === "control",
      )
      .map((edge) =>
        graphSnapshot.nodes.find((node) => node.id === edge.source),
      )
      .filter(
        (
          node,
        ): node is Extract<
          (typeof graphSnapshot.nodes)[number],
          { kind: "template" }
        > => Boolean(node && node.kind === "template"),
      )
      .reduce<Record<string, any>>(
        (acc, node) => ({ ...acc, ...node.data.params }),
        {},
      );

    updateNode(sourceNode.id, (node) =>
      node.kind === "workflow"
        ? {
            ...node,
            data: {
              ...node.data,
              status: "generating",
              errorMessage: undefined,
            },
          }
        : node,
    );

    let submittedTaskId: string | null = null;
    const agentMessageId = agentWorkflowMessageMapRef.current[workflowNodeId];
    try {
      const result = await generateCanvasWorkflowWithConfig({
        workflowNode: sourceNode,
        config: workflowConfig,
        prompt: sourceNode.data.prompt,
        settings: {
          ...controlParams,
          ...sourceNode.data.settings,
        },
        references: workflowReferences,
        callbacks: generationCallbacks,
        translate: (key: string, params?: Record<string, any>) => {
          const translated = tWave(key as never, params as never);
          return typeof translated === "string"
            ? translated
            : params?.defaultValue || key;
        },
        requiredCredits: null,
        remainingCredits: user?.credits?.remainingCredits ?? 0,
        onTaskSubmitted: async ({ requestId, scenario }) => {
          console.log("[canvas] workflow onTaskSubmitted", {
            requestId,
            scenario,
            sourceNodeId: sourceNode.id,
          });
          submittedTaskId = requestId;
          if (agentMessageId) {
            agentTaskMessageMapRef.current[requestId] = agentMessageId;
            void syncAgentGenerationMessage({
              messageId: agentMessageId,
              taskId: requestId,
              workflowNodeId: workflowNodeId,
              scenario,
              status: "submitted",
            });
          }
          createPendingResultNode({
            sourceNode,
            mediaKind,
            taskId: requestId,
            replaceSourceNode: true,
            prompt: sourceNode.data.prompt,
            title: sourceNode.data.sceneLabel,
            aspectRatio: sourceNode.data.aspectRatio,
            sceneId: scenario,
            modelUrl: sourceNode.data.modelUrl,
          });
        },
      });

      const generated =
        result.imageUrls || result.imageUrl || result.videoUrl || null;
      const taskId = submittedTaskId || getGenerationTaskId(result);
      const scenario =
        typeof (result as { scenario?: unknown }).scenario === "string"
          ? (result as { scenario: string }).scenario
          : sourceNode.data.sceneId;

      if (generated) {
        const bucket = Array.isArray(generated) ? generated : [generated];
        const resolvedPending = taskId
          ? resolvePendingResultNode(taskId, {
              url: bucket[0],
              outputs: bucket,
              title: sourceNode.data.sceneLabel,
              prompt: sourceNode.data.prompt,
            })
          : false;

        if (!resolvedPending) {
          bucket.forEach((url, index) => {
            if (index === 0) {
              applyGeneratedOutputToSourceNode({
                sourceNode,
                mediaKind,
                url,
                prompt: sourceNode.data.prompt,
                title: sourceNode.data.sceneLabel,
                taskId,
                aspectRatio: sourceNode.data.aspectRatio,
                sceneId: sourceNode.data.sceneId,
                modelUrl: sourceNode.data.modelUrl,
              });
              return;
            }

            const resultNodeId = `result-${nanoid(6)}`;
            addNode({
              id: resultNodeId,
              kind: "result",
              subtype: mediaKind,
              position: {
                x: sourceNode.position.x + 420 + index * 26,
                y: sourceNode.position.y + index * 36,
              },
              size: { width: 118, height: 118 },
              data: {
                mediaKind,
                url,
                prompt: sourceNode.data.prompt,
                title: sourceNode.data.sceneLabel,
                taskId,
                aspectRatio: sourceNode.data.aspectRatio,
                sceneId: sourceNode.data.sceneId,
                modelUrl: sourceNode.data.modelUrl,
                sourceNodeId: sourceNode.id,
                status: "success",
              },
            });
            addEdge({
              id: `edge-result-${nanoid(6)}`,
              source: sourceNode.id,
              target: resultNodeId,
              semantic: "result",
            });
          });
        }
      } else if (taskId && scenario) {
        if (!pendingResultMapRef.current[taskId]) {
          createPendingResultNode({
            sourceNode,
            mediaKind,
            taskId,
            replaceSourceNode: true,
            prompt: sourceNode.data.prompt,
            title: sourceNode.data.sceneLabel,
            aspectRatio: sourceNode.data.aspectRatio,
            sceneId: scenario,
            modelUrl: sourceNode.data.modelUrl,
          });
        }

        void (async () => {
          try {
            const taskResult = await pollCanvasTaskResult(taskId, scenario);
            void syncAgentGenerationMessage({
              messageId:
                agentTaskMessageMapRef.current[taskId] || agentMessageId,
              taskId,
              workflowNodeId,
              scenario,
              status: "completed",
              outputs: taskResult.outputs,
              creationRecordIds: taskResult.creationRecords.map(
                (item: { url: string; creationRecordId: string }) =>
                  item.creationRecordId,
              ),
            });
            resolvePendingResultNode(taskId, {
              url: taskResult.output,
              outputs: taskResult.outputs,
              creationRecords: taskResult.creationRecords,
              title: sourceNode.data.sceneLabel,
              prompt: sourceNode.data.prompt,
            });
            updateNode(sourceNode.id, (node) =>
              node.kind === "workflow"
                ? { ...node, data: { ...node.data, status: "success" } }
                : node,
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "生成失败，请稍后重试";
            void syncAgentGenerationMessage({
              messageId:
                agentTaskMessageMapRef.current[taskId] || agentMessageId,
              taskId,
              workflowNodeId,
              scenario,
              status: "failed",
              errorMessage: message,
            });
            failPendingResultNode(taskId, message);
            updateNode(sourceNode.id, (node) =>
              node.kind === "workflow"
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: "error",
                      errorMessage: message,
                    },
                  }
                : node,
            );
          }
        })();
        return;
      }

      updateNode(sourceNode.id, (node) =>
        node.kind === "workflow"
          ? { ...node, data: { ...node.data, status: "success" } }
          : node,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "生成失败，请稍后重试";
      if (submittedTaskId) {
        failPendingResultNode(submittedTaskId, message);
        void syncAgentGenerationMessage({
          messageId:
            agentTaskMessageMapRef.current[submittedTaskId] || agentMessageId,
          taskId: submittedTaskId,
          workflowNodeId,
          status: "failed",
          errorMessage: message,
        });
      }
      updateNode(sourceNode.id, (node) =>
        node.kind === "workflow"
          ? {
              ...node,
              data: {
                ...node.data,
                status: "error",
                errorMessage: message,
              },
            }
          : node,
      );
    }
  }

  async function generateWorkflowNode(workflowNodeId: string) {
    const sourceNode = graph.nodes.find(
      (node): node is CanvasWorkflowNode =>
        node.id === workflowNodeId && node.kind === "workflow",
    );
    if (!sourceNode) return;

    await generateWorkflowNodeWithSnapshot(sourceNode, graph);
  }

  const handleGenerate = async () => {
    if (!selectedWorkflowNode) return;
    await generateWorkflowNode(selectedWorkflowNode.id);
  };

  useEffect(() => {
    if (!projectId || typeof window === "undefined" || !selectedWorkflowNode) {
      return;
    }
    if (selectedWorkflowNode.data.status !== "idle") return;
    if (!selectedWorkflowNode.data.prompt.trim()) return;

    const storageKey = `${CANVAS_PROJECT_AUTO_GENERATE_STORAGE_KEY_PREFIX}${projectId}`;
    if (window.sessionStorage.getItem(storageKey) !== "1") return;

    window.sessionStorage.removeItem(storageKey);
    void generateWorkflowNode(selectedWorkflowNode.id);
  }, [projectId, selectedWorkflowNode, generateWorkflowNode]);

  useEffect(() => {
    if (pendingAgentGenerationIds.length === 0) return;

    const runnableIds = pendingAgentGenerationIds.filter((workflowNodeId) =>
      graph.nodes.some(
        (node) => node.id === workflowNodeId && node.kind === "workflow",
      ),
    );
    if (runnableIds.length === 0) return;

    setPendingAgentGenerationIds((prev) =>
      prev.filter((id) => !runnableIds.includes(id)),
    );

    void (async () => {
      try {
        for (const workflowNodeId of runnableIds) {
          await generateWorkflowNode(workflowNodeId);
        }
      } catch (error) {
        console.error(
          "[canvas] failed to auto-run agent workflow node generation:",
          error,
        );
      }
    })();
  }, [generateWorkflowNode, graph.nodes, pendingAgentGenerationIds]);

  useEffect(() => {
    if (pendingServerGenerationSubmissions.length === 0) return;

    const runnableSubmissions = pendingServerGenerationSubmissions.filter(
      (submission) =>
        graph.nodes.some(
          (node) =>
            node.id === submission.workflowNodeId && node.kind === "workflow",
        ),
    );
    if (runnableSubmissions.length === 0) return;

    setPendingServerGenerationSubmissions((prev) =>
      prev.filter(
        (submission) =>
          !runnableSubmissions.some(
            (runnable) =>
              runnable.workflowNodeId === submission.workflowNodeId &&
              runnable.requestId === submission.requestId,
          ),
      ),
    );

    void (async () => {
      for (const submission of runnableSubmissions) {
        const sourceNode = graph.nodes.find(
          (node): node is CanvasWorkflowNode =>
            node.id === submission.workflowNodeId && node.kind === "workflow",
        );
        if (!sourceNode) continue;

        const mediaKind = submission.mediaIntent;
        const directOutputs = [
          ...(Array.isArray(submission.outputs) ? submission.outputs : []),
        ];
        if (
          submission.directUrl &&
          !directOutputs.includes(submission.directUrl)
        ) {
          directOutputs.unshift(submission.directUrl);
        }

        if (directOutputs.length > 0) {
          applyGeneratedOutputToSourceNode({
            sourceNode,
            mediaKind,
            url: directOutputs[0],
            prompt: sourceNode.data.prompt,
            title: sourceNode.data.sceneLabel,
            taskId: submission.requestId || submission.taskId,
            aspectRatio: sourceNode.data.aspectRatio,
            sceneId: submission.sceneId,
            modelUrl: sourceNode.data.modelUrl,
          });
          updateNode(sourceNode.id, (node) =>
            node.kind === "workflow"
              ? { ...node, data: { ...node.data, status: "success" } }
              : node,
          );
          continue;
        }

        const taskId = submission.requestId || submission.taskId;
        if (!taskId || !submission.scenario) {
          setPendingAgentGenerationIds((prev) =>
            prev.includes(sourceNode.id) ? prev : [...prev, sourceNode.id],
          );
          continue;
        }

        updateNode(sourceNode.id, (node) =>
          node.kind === "workflow"
            ? {
                ...node,
                data: {
                  ...node.data,
                  status: "generating",
                  errorMessage: undefined,
                },
              }
            : node,
        );

        if (!pendingResultMapRef.current[taskId]) {
          createPendingResultNode({
            sourceNode,
            mediaKind,
            taskId,
            replaceSourceNode: true,
            prompt: sourceNode.data.prompt,
            title: sourceNode.data.sceneLabel,
            aspectRatio: sourceNode.data.aspectRatio,
            sceneId: submission.scenario,
            modelUrl: sourceNode.data.modelUrl,
          });
        }
        if (submission.requestId) {
          const messageId =
            agentWorkflowMessageMapRef.current[submission.workflowNodeId];
          if (messageId) {
            agentTaskMessageMapRef.current[submission.requestId] = messageId;
            void syncAgentGenerationMessage({
              messageId,
              taskId: submission.requestId,
              workflowNodeId: submission.workflowNodeId,
              scenario: submission.scenario,
              status: "submitted",
            });
          }
        }

        try {
          const taskResult = await pollCanvasTaskResult(
            taskId,
            submission.scenario,
          );
          const messageId =
            agentTaskMessageMapRef.current[taskId] ||
            agentWorkflowMessageMapRef.current[submission.workflowNodeId];
          resolvePendingResultNode(taskId, {
            url: taskResult.output,
            outputs: taskResult.outputs,
            creationRecords: taskResult.creationRecords,
            title: sourceNode.data.sceneLabel,
            prompt: sourceNode.data.prompt,
            sceneId: submission.sceneId,
          });
          void syncAgentGenerationMessage({
            messageId,
            taskId,
            workflowNodeId: submission.workflowNodeId,
            scenario: submission.scenario,
            status: "completed",
            outputs: taskResult.outputs,
            creationRecordIds: taskResult.creationRecords.map(
              (item: { url: string; creationRecordId: string }) =>
                item.creationRecordId,
            ),
          });
          updateNode(sourceNode.id, (node) =>
            node.kind === "workflow"
              ? { ...node, data: { ...node.data, status: "success" } }
              : node,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "生成失败，请稍后重试";
          const messageId =
            agentTaskMessageMapRef.current[taskId] ||
            agentWorkflowMessageMapRef.current[submission.workflowNodeId];
          failPendingResultNode(taskId, message);
          void syncAgentGenerationMessage({
            messageId,
            taskId,
            workflowNodeId: submission.workflowNodeId,
            scenario: submission.scenario,
            status: "failed",
            errorMessage: message,
          });
          updateNode(sourceNode.id, (node) =>
            node.kind === "workflow"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "error",
                    errorMessage: message,
                  },
                }
              : node,
          );
        }
      }
    })();
  }, [
    applyGeneratedOutputToSourceNode,
    createPendingResultNode,
    graph.nodes,
    pendingServerGenerationSubmissions,
    pollCanvasTaskResult,
    resolvePendingResultNode,
    syncAgentGenerationMessage,
    updateNode,
  ]);

  const insertHistoryNode = () => {
    const firstItem = historyItems[0];
    if (!firstItem) return;
    addNode(
      mapHistoryItemToCanvasNode(firstItem, {
        x:
          120 + graph.nodes.filter((node) => node.kind === "input").length * 24,
        y: 220,
      }),
    );
  };

  const createWorkflowFromCommand = (command: CanvasCommandType) => {
    const commandMenu = graph.commandMenu;
    if (!commandMenu) return;
    const sourceNode = graph.nodes.find(
      (node) => node.id === commandMenu.nodeId,
    );
    if (!sourceNode) return;

    if (command === "context-text") {
      const textNode = createTextNode(
        {
          x: sourceNode.position.x - 360,
          y: sourceNode.position.y + 24,
        },
        canvasCopy.toolRail.text,
      );
      addNode(textNode);
      addEdge({
        id: `edge-link-${nanoid(6)}`,
        source: textNode.id,
        target: sourceNode.id,
        semantic: "control",
      });
      setSelection({ nodeId: textNode.id, edgeId: null });
      closeCommandMenu();
      return;
    }

    if (command === "context-image") {
      const imageScene =
        findFirstSceneWithWorkspace(scenes, "Image") ??
        findFirstSceneWithWorkspace(scenes);
      if (!imageScene) return;
      const modelUrl = swapModelUrlScenario(
        getPreferredSceneUrl(imageScene),
        "image-to-image",
      );
      const imageNode = createWorkflowNode({
        sceneId: imageScene.id,
        sceneLabel: imageScene.title,
        modelUrl,
        modelLabel:
          imageScene.children?.find((child) => child.url === modelUrl)?.title ||
          imageScene.title,
        subtype: "image-to-image",
        position: {
          x: sourceNode.position.x - 360,
          y: sourceNode.position.y + 96,
        },
        settings: {},
      });
      addNode(imageNode);
      addEdge({
        id: `edge-link-${nanoid(6)}`,
        source: imageNode.id,
        target: sourceNode.id,
        semantic: "reference",
      });
      setSelection({ nodeId: imageNode.id, edgeId: null });
      closeCommandMenu();
      return;
    }

    const targetWorkflowId =
      sourceNode.kind === "workflow"
        ? sourceNode.id
        : selectedWorkflowNode?.id || null;

    if (command === "upload-reference") {
      const firstHistory = historyItems[0];
      if (firstHistory && targetWorkflowId) {
        const historyNode = mapHistoryItemToCanvasNode(firstHistory, {
          x: sourceNode.position.x - 280,
          y: sourceNode.position.y + 10,
        });
        addNode(historyNode);
        addEdge({
          id: `edge-reference-${nanoid(6)}`,
          source: historyNode.id,
          target: targetWorkflowId,
          semantic: "reference",
        });
      }
      closeCommandMenu();
      return;
    }

    if (command === "apply-template") {
      const firstTemplate = templateItems[0];
      if (firstTemplate && targetWorkflowId) {
        const templateNode = mapTemplateToCanvasNode(firstTemplate, {
          x: sourceNode.position.x - 300,
          y: sourceNode.position.y + 120,
        });
        addNode(templateNode);
        addEdge({
          id: `edge-control-${nanoid(6)}`,
          source: templateNode.id,
          target: targetWorkflowId,
          semantic: "control",
        });
        updateNode(targetWorkflowId, (node) =>
          node.kind === "workflow"
            ? {
                ...node,
                data: {
                  ...node.data,
                  prompt: firstTemplate.prompt || node.data.prompt,
                  settings: {
                    ...node.data.settings,
                    ...firstTemplate.params,
                    ...(firstTemplate.prompt
                      ? { prompt: firstTemplate.prompt }
                      : {}),
                  },
                },
              }
            : node,
        );
      }
      closeCommandMenu();
      return;
    }

    const imageScene =
      findFirstSceneWithWorkspace(scenes, "Image") ??
      findFirstSceneWithWorkspace(scenes);
    const videoScene =
      findFirstSceneWithWorkspace(scenes, "Video") ??
      findFirstSceneWithWorkspace(scenes);

    const targetScene =
      command === "text-to-video" || command === "image-to-video"
        ? videoScene
        : imageScene;

    if (!targetScene) return;

    const targetModelUrl = getPreferredSceneUrl(targetScene);
    const targetModelLabel =
      targetScene.children?.find((child) => child.url === targetModelUrl)
        ?.title || targetScene.title;
    const subtype: CanvasWorkflowSubtype =
      command === "text-to-video"
        ? "text-to-video"
        : command === "image-to-video"
          ? "image-to-video"
          : command === "image-to-image"
            ? "image-to-image"
            : "text-to-image";

    const nextNode = createWorkflowNode({
      sceneId: targetScene.id,
      sceneLabel: targetScene.title,
      modelUrl: targetModelUrl,
      modelLabel: targetModelLabel,
      subtype,
      position: {
        x: commandMenu.position.x + 40,
        y: commandMenu.position.y - 70,
      },
      settings: {
        ...getDefaultValues(configMap[targetModelUrl]),
        prompt:
          sourceNode.kind === "result"
            ? sourceNode.data.prompt || ""
            : sourceNode.kind === "workflow"
              ? sourceNode.data.prompt
              : "",
      },
    });

    addNode(nextNode);
    addEdge({
      id: `edge-derive-${nanoid(6)}`,
      source: sourceNode.id,
      target: nextNode.id,
      semantic:
        sourceNode.kind === "result" || sourceNode.kind === "input"
          ? "reference"
          : "derivation",
    });
    setSelection({ nodeId: nextNode.id, edgeId: null });
    setCommandMenu(null);

    graph.nodes
      .filter((node) => node.kind === "command")
      .forEach((node) => removeNode(node.id));
    graph.edges
      .filter((edge) => edge.semantic === "command")
      .forEach((edge) => removeEdge(edge.id));
  };

  const appendAgentMessage = useCallback(
    (message: Omit<CanvasAgentMessage, "id">) => {
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `${message.role}-${nanoid(8)}`,
          createdAt: new Date().toISOString(),
          ...message,
        },
      ]);
    },
    [],
  );

  const mapServerMessagesToAgentMessages = useCallback(
    (messages: CanvasAgentServerMessage[]): CanvasAgentMessage[] => {
      const next = messages
        .filter(
          (message) => message.role === "assistant" || message.role === "user",
        )
        .map((message) => ({
          id: message.id,
          role: message.role as "assistant" | "user",
          content: message.content,
          createdAt: message.createdAt,
          parts: Array.isArray(message.parts)
            ? (message.parts as CanvasAgentMessagePart[])
            : undefined,
          generation: message.generation || null,
        }));

      return next;
    },
    [],
  );

  const syncAgentThreadList = useCallback(
    async (preferredThreadId?: string | null) => {
      if (!projectId) return [];

      setAgentThreadsLoading(true);
      try {
        const response = await fetch(
          `/api/agent/canvas/threads?projectId=${encodeURIComponent(projectId)}`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        const result = await response.json().catch(() => null);
        if (
          !response.ok ||
          result?.code !== 0 ||
          !Array.isArray(result?.data?.items)
        ) {
          throw new Error(
            result?.message || "failed to load canvas agent threads",
          );
        }

        const items = result.data.items
          .filter((item: unknown): item is CanvasAgentServerThread => {
            return Boolean(
              item &&
              typeof item === "object" &&
              typeof (item as { id?: unknown }).id === "string",
            );
          })
          .map((item: CanvasAgentServerThread) => ({
            id: item.id,
            title: item.title,
            lastMessageAt: item.lastMessageAt || undefined,
            createdAt: item.createdAt || undefined,
          }));

        setAgentThreads(items);
        if (!agentThreadId && items.length > 0) {
          setAgentThreadId(preferredThreadId || items[0]!.id);
        }
        return items;
      } finally {
        setAgentThreadsLoading(false);
      }
    },
    [agentThreadId, projectId],
  );

  const syncAgentThread = useCallback(
    async (threadId: string) => {
      if (!projectId) return;

      const response = await fetch(
        `/api/agent/canvas/thread/${threadId}?projectId=${encodeURIComponent(projectId)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || !result?.data) {
        throw new Error(
          result?.message || "failed to load canvas agent thread",
        );
      }

      const messages = Array.isArray(result.data.messages)
        ? (result.data.messages as CanvasAgentServerMessage[])
        : [];
      const resolvedThreadId =
        typeof result.data.thread?.id === "string"
          ? result.data.thread.id
          : threadId;
      const nextMessages = mapServerMessagesToAgentMessages(messages);
      setAgentMessages((prev) => {
        if (nextMessages.length > 0) return nextMessages;
        const isSameThread =
          agentThreadIdRef.current !== null &&
          agentThreadIdRef.current === resolvedThreadId;
        if (isSameThread && prev.length > 0) {
          return prev;
        }
        return [];
      });
      setAgentThreadId(resolvedThreadId);
      setAgentThreads((prev) => {
        const nextThread: CanvasAgentThreadSummary = {
          id: resolvedThreadId,
          title:
            typeof result.data.thread?.title === "string"
              ? result.data.thread.title
              : "",
          lastMessageAt:
            typeof result.data.thread?.lastMessageAt === "string" ||
            result.data.thread?.lastMessageAt instanceof Date
              ? String(result.data.thread.lastMessageAt)
              : undefined,
        };
        const rest = prev.filter((item) => item.id !== nextThread.id);
        return [nextThread, ...rest];
      });
    },
    [mapServerMessagesToAgentMessages, projectId],
  );

  const scheduleAgentThreadRefresh = useCallback(
    (threadIdOverride?: string | null) => {
      const nextThreadId = threadIdOverride || agentThreadId;
      if (!projectId || !nextThreadId) return;

      if (agentThreadRefreshTimerRef.current !== null) {
        window.clearTimeout(agentThreadRefreshTimerRef.current);
      }

      agentThreadRefreshTimerRef.current = window.setTimeout(() => {
        agentThreadRefreshTimerRef.current = null;
        void syncAgentThread(nextThreadId).catch(() => null);
      }, 1200);
    },
    [agentThreadId, projectId, syncAgentThread],
  );

  const updateAgentMessageGeneration = useCallback(
    (input: {
      messageId: string;
      taskId: string;
      workflowNodeId?: string;
      scenario?: string;
      status: "submitted" | "completed" | "failed";
      outputs?: string[];
      creationRecordIds?: string[];
      errorMessage?: string;
    }) => {
      setAgentMessages((prev) =>
        prev.map((message) => {
          if (message.id !== input.messageId) return message;

          const existingGeneration = message.generation || {
            status: "idle",
            tasks: [],
          };
          const existingTasks = Array.isArray(existingGeneration.tasks)
            ? existingGeneration.tasks
            : [];
          const nextTask = {
            taskId: input.taskId,
            workflowNodeId: input.workflowNodeId,
            scenario: input.scenario,
            status: input.status,
            outputs: input.outputs,
            creationRecordIds: input.creationRecordIds,
            errorMessage: input.errorMessage,
            updatedAt: new Date().toISOString(),
          };
          const nextTasks = [
            ...existingTasks.filter((task) => task.taskId !== input.taskId),
            nextTask,
          ].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
          const statusSet = new Set(nextTasks.map((task) => task.status));
          const nextStatus: NonNullable<
            CanvasAgentMessage["generation"]
          >["status"] =
            statusSet.size === 0
              ? "idle"
              : statusSet.size === 1
                ? statusSet.has("submitted")
                  ? "submitted"
                  : statusSet.has("completed")
                    ? "completed"
                    : "failed"
                : statusSet.has("failed") && statusSet.has("completed")
                  ? "partial"
                  : statusSet.has("submitted")
                    ? "submitted"
                    : "partial";

          return {
            ...message,
            generation: {
              status: nextStatus,
              taskId: input.taskId,
              scenario: input.scenario || existingGeneration.scenario,
              errorMessage:
                input.status === "failed" ? input.errorMessage : undefined,
              tasks: nextTasks,
            },
          };
        }),
      );
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (agentThreadRefreshTimerRef.current !== null) {
        window.clearTimeout(agentThreadRefreshTimerRef.current);
      }
    };
  }, []);

  async function syncAgentGenerationMessage(input: {
    messageId?: string | null;
    taskId?: string | null;
    workflowNodeId?: string;
    scenario?: string;
    status: "submitted" | "completed" | "failed";
    outputs?: string[];
    creationRecordIds?: string[];
    errorMessage?: string;
  }) {
    if (!projectId || !input.messageId || !input.taskId) return;
    if (!agentThreadId) return;

    updateAgentMessageGeneration({
      messageId: input.messageId,
      taskId: input.taskId,
      workflowNodeId: input.workflowNodeId,
      scenario: input.scenario,
      status: input.status,
      outputs: input.outputs,
      creationRecordIds: input.creationRecordIds,
      errorMessage: input.errorMessage,
    });

    await fetch("/api/agent/canvas/message-generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        projectId,
        threadId: agentThreadId,
        messageId: input.messageId,
        taskId: input.taskId,
        workflowNodeId: input.workflowNodeId,
        scenario: input.scenario,
        status: input.status,
        outputs: input.outputs || [],
        creationRecordIds: input.creationRecordIds || [],
        errorMessage: input.errorMessage,
      }),
    }).catch(() => null);

    scheduleAgentThreadRefresh(agentThreadId);
  }

  const ensureAgentThread = useCallback(
    async (createNew = false) => {
      if (!projectId) {
        throw new Error("canvas project is required");
      }
      if (!createNew && agentThreadId) return agentThreadId;

      const response = await fetch("/api/agent/canvas/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ projectId, createNew }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || !result?.data?.threadId) {
        throw new Error(
          result?.message || "failed to create canvas agent session",
        );
      }

      const threadId = String(result.data.threadId);
      setAgentThreadId(threadId);
      return threadId;
    },
    [agentThreadId, projectId],
  );

  const switchAgentThread = useCallback(
    async (threadId: string) => {
      if (!threadId) return;
      setAgentOpen(true);
      setAgentSubmitting(false);
      setAgentAttachments([]);
      setAgentThreadId(threadId);
      await syncAgentThread(threadId);
      void syncAgentThreadList(threadId).catch(() => null);
    },
    [syncAgentThread, syncAgentThreadList],
  );

  const createNewAgentThread = useCallback(async () => {
    const threadId = await ensureAgentThread(true);
    setAgentOpen(true);
    setAgentSubmitting(false);
    setAgentAttachments([]);
    setAgentMessages([]);
    await syncAgentThread(threadId);
    await syncAgentThreadList(threadId);
  }, [ensureAgentThread, syncAgentThread, syncAgentThreadList]);

  const handleAgentUploadFiles = useCallback(
    async (files: FileList) => {
      if (!projectId) {
        throw new Error("canvas project is required");
      }

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/agent/canvas/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || !result?.data?.items) {
        throw new Error(result?.message || "upload image failed");
      }

      const nextAttachments = (
        result.data.items as Array<Record<string, unknown>>
      ).flatMap((item) => {
        if (typeof item?.assetId !== "string") return [];
        return [
          {
            assetId: item.assetId,
            name:
              typeof item.filename === "string" && item.filename.trim()
                ? item.filename
                : "reference-image",
            url: typeof item.url === "string" ? item.url : undefined,
          },
        ];
      });

      if (nextAttachments.length === 0) {
        throw new Error("no uploaded images returned");
      }

      setAgentAttachments((prev) => [...prev, ...nextAttachments]);
      setAgentOpen(true);
    },
    [projectId],
  );

  const getAgentSceneEntryForSubtype = useCallback(
    (subtype: CanvasWorkflowSubtype) => {
      const matchingModel = scenes
        .flatMap((scene) =>
          (scene.children ?? []).map((model) => ({ scene, model })),
        )
        .find(
          ({ model }) =>
            model.url === `/${subtype}` || model.url.startsWith(`/${subtype}/`),
        );

      if (matchingModel) return matchingModel;

      const fallbackScene =
        subtype === "text-to-video" || subtype === "image-to-video"
          ? (findFirstSceneWithWorkspace(scenes, "Video") ??
            findFirstSceneWithWorkspace(scenes))
          : (findFirstSceneWithWorkspace(scenes, "Image") ??
            findFirstSceneWithWorkspace(scenes));
      if (!fallbackScene) return null;

      const fallbackModelUrl =
        subtype === "text-to-video" || subtype === "image-to-video"
          ? swapModelUrlScenario(getPreferredSceneUrl(fallbackScene), subtype)
          : subtype === "image-to-image"
            ? swapModelUrlScenario(getPreferredSceneUrl(fallbackScene), subtype)
            : getPreferredSceneUrl(fallbackScene);
      const fallbackModel =
        fallbackScene.children?.find(
          (child) => child.url === fallbackModelUrl,
        ) ?? fallbackScene.children?.[0];

      return fallbackModel
        ? { scene: fallbackScene, model: fallbackModel }
        : null;
    },
    [scenes],
  );

  const getAgentSceneEntriesForSubtype = useCallback(
    (subtype: CanvasWorkflowSubtype) => {
      const matchingEntries = scenes.flatMap((scene) =>
        (scene.children ?? [])
          .filter(
            (model) =>
              model.url === `/${subtype}` ||
              model.url.startsWith(`/${subtype}/`),
          )
          .map((model) => ({ scene, model })),
      );

      if (matchingEntries.length > 0) {
        return matchingEntries;
      }

      const fallbackEntry = getAgentSceneEntryForSubtype(subtype);
      return fallbackEntry ? [fallbackEntry] : [];
    },
    [getAgentSceneEntryForSubtype, scenes],
  );

  useEffect(() => {
    const missingModelUrls = Array.from(
      new Set(
        agentMessages
          .flatMap((message) =>
            extractCanvasAgentMessageCards(message.parts).flatMap((card) =>
              card.kind === "scene-router"
                ? getAgentSceneEntriesForSubtype(card.subtype).map(
                    (entry) => entry.model.url,
                  )
                : [],
            ),
          )
          .filter((modelUrl) => modelUrl && !configMap[modelUrl]),
      ),
    );

    if (missingModelUrls.length === 0) return;

    let cancelled = false;

    Promise.all(
      missingModelUrls.map(async (modelUrl) => {
        const config = await getPlaygroundConfigByUrl(modelUrl);
        return config ? [modelUrl, config] : null;
      }),
    )
      .then((resolvedConfigs) => {
        if (cancelled) return;

        const entries = resolvedConfigs.filter(
          (item): item is [string, PlaygroundConfig] => Boolean(item),
        );
        if (entries.length === 0) return;

        setConfigMap((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      })
      .catch((error) => {
        console.error(
          "[canvas] failed to preload playground configs from agent cards:",
          error,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [agentMessages, configMap, getAgentSceneEntriesForSubtype]);

  const applyAgentOperations = useCallback(
    (operations: unknown[]) => {
      const createdWorkflowIds: string[] = [];
      const tempNodeIds = new Map<string, string>();
      const tempGroupIds = new Map<string, string>();
      const layoutByTempId = new Map<
        string,
        {
          x: number;
          y: number;
        }
      >();

      const normalizedOperations = operations.filter(
        (operation): operation is CanvasAgentOperation =>
          Boolean(
            operation &&
            typeof operation === "object" &&
            typeof (operation as { type?: unknown }).type === "string",
          ),
      );

      normalizedOperations.forEach((operation) => {
        if (operation.type !== "layout") return;
        operation.items.forEach((item) => {
          layoutByTempId.set(item.tempId, item.position);
        });
      });

      normalizedOperations.forEach((operation) => {
        if (operation.type !== "create-text") return;

        const textOperation = operation as CanvasAgentCreateTextOperation;
        const position = layoutByTempId.get(textOperation.tempId) ?? {
          x: 48,
          y: 176,
        };
        const textNode = createTextNode(position, textOperation.label);
        textNode.size = { width: 308, height: 188 };
        textNode.data = {
          ...textNode.data,
          label: textOperation.label,
          content: textOperation.content,
          backgroundColor: "#143022",
        };
        addNode(textNode);
        tempNodeIds.set(textOperation.tempId, textNode.id);
      });

      normalizedOperations.forEach((operation) => {
        if (operation.type !== "create-workflow") return;

        const workflowOperation =
          operation as CanvasAgentCreateWorkflowOperation;
        const sceneEntry =
          (workflowOperation.preferredModelUrl
            ? scenes
                .flatMap((scene) =>
                  (scene.children ?? []).map((model) => ({
                    scene,
                    model,
                  })),
                )
                .find(
                  ({ model }) =>
                    model.url === workflowOperation.preferredModelUrl,
                )
            : undefined) ??
          getAgentSceneEntryForSubtype(workflowOperation.subtype);
        if (!sceneEntry) return;

        const position = layoutByTempId.get(workflowOperation.tempId) ?? {
          x:
            320 +
            graph.nodes.filter((item) => item.kind === "workflow").length * 60,
          y: 220,
        };

        const workflowNode = createWorkflowNode({
          sceneId: sceneEntry.scene.id,
          sceneLabel: sceneEntry.scene.title,
          modelUrl: sceneEntry.model.url,
          modelLabel: sceneEntry.model.title || sceneEntry.scene.title,
          subtype: workflowOperation.subtype,
          position,
          settings: {
            ...getDefaultValues(configMap[sceneEntry.model.url]),
            prompt: workflowOperation.prompt,
          },
        });

        addNode(workflowNode);
        tempNodeIds.set(workflowOperation.tempId, workflowNode.id);
        createdWorkflowIds.push(workflowNode.id);
      });

      normalizedOperations.forEach((operation) => {
        if (operation.type !== "create-input") return;

        const inputOperation = operation as CanvasAgentCreateInputOperation;
        const existingNode = graph.nodes.find((node) => {
          if (node.kind === "input" || node.kind === "result") {
            return node.data.creationRecordId === inputOperation.assetId;
          }
          return false;
        });

        if (existingNode) {
          tempNodeIds.set(inputOperation.tempId, existingNode.id);
          return;
        }

        const position = layoutByTempId.get(inputOperation.tempId) ?? {
          x: 0,
          y: 0,
        };
        const inputNodeId = `upload-${nanoid(6)}`;
        addNode({
          id: inputNodeId,
          kind: "input",
          subtype: "upload",
          position,
          size: { width: 270, height: 270 },
          data: {
            label: inputOperation.label,
            prompt: inputOperation.label,
            mediaKind: inputOperation.mediaKind,
            url: inputOperation.url,
            creationRecordId: inputOperation.assetId,
            status: "success",
          },
        });
        tempNodeIds.set(inputOperation.tempId, inputNodeId);
      });

      normalizedOperations.forEach((operation) => {
        if (operation.type !== "create-edge") return;

        const edgeOperation = operation as CanvasAgentCreateEdgeOperation;
        const sourceId = edgeOperation.source.nodeId
          ? edgeOperation.source.nodeId
          : edgeOperation.source.tempId
            ? tempNodeIds.get(edgeOperation.source.tempId)
            : null;
        const targetId = edgeOperation.target.nodeId
          ? edgeOperation.target.nodeId
          : edgeOperation.target.tempId
            ? tempNodeIds.get(edgeOperation.target.tempId)
            : null;

        if (!sourceId || !targetId) return;

        addEdge({
          id: `edge-agent-${nanoid(6)}`,
          source: sourceId,
          target: targetId,
          semantic: edgeOperation.semantic,
        });
      });

      normalizedOperations.forEach((operation) => {
        if (operation.type !== "layout") return;

        const layoutOperation = operation as CanvasAgentLayoutOperation;
        layoutOperation.items.forEach((item) => {
          const nodeId = tempNodeIds.get(item.tempId);
          if (!nodeId) return;
          updateNode(nodeId, (node) => ({
            ...node,
            position: item.position,
          }));
        });
      });

      normalizedOperations.forEach((operation) => {
        if (operation.type !== "create-group") return;

        const groupOperation = operation as CanvasAgentCreateGroupOperation;
        const resolvedGroupId =
          tempGroupIds.get(groupOperation.tempId) || `group-agent-${nanoid(6)}`;
        tempGroupIds.set(groupOperation.tempId, resolvedGroupId);
        const resolvedNodeIds = groupOperation.nodeTempIds
          .map((tempId) => tempNodeIds.get(tempId))
          .filter((nodeId): nodeId is string => Boolean(nodeId));

        if (resolvedNodeIds.length < 2) return;

        resolvedNodeIds.forEach((nodeId) => {
          updateNode(nodeId, (node) => ({
            ...node,
            groupId: resolvedGroupId,
            groupLabel: groupOperation.label,
          }));
        });
      });

      const lastWorkflowId = createdWorkflowIds.at(-1);
      if (lastWorkflowId) {
        setSelection({ nodeId: lastWorkflowId, edgeId: null });
      }

      return createdWorkflowIds;
    },
    [
      addEdge,
      addNode,
      configMap,
      getAgentSceneEntryForSubtype,
      graph.nodes,
      updateNode,
      setSelection,
    ],
  );

  const resolveAgentSceneRouterCard = useCallback(
    (
      card: CanvasAgentSceneRouterCard,
    ): CanvasAgentSceneRouterPresentation | null => {
      const workflowNodeId =
        card.workflowNodeIds.find((nodeId) =>
          graph.nodes.some(
            (node) => node.id === nodeId && node.kind === "workflow",
          ),
        ) || card.workflowNodeIds[0];
      const workflowNode = graph.nodes.find(
        (node): node is CanvasWorkflowNode =>
          node.id === workflowNodeId && node.kind === "workflow",
      );

      if (!workflowNode) return null;

      const sceneEntries = getAgentSceneEntriesForSubtype(card.subtype);
      if (sceneEntries.length === 0) return null;

      const resolvedModelUrl =
        card.preferredModelUrl ||
        workflowNode.data.modelUrl ||
        sceneEntries[0]?.model.url ||
        "";
      const selectedEntry =
        sceneEntries.find((entry) => entry.model.url === resolvedModelUrl) ||
        sceneEntries[0];
      if (!selectedEntry) return null;

      const config = configMap[selectedEntry.model.url];
      const defaultValues = getDefaultValues(config);
      const nextValues = {
        ...defaultValues,
        ...workflowNode.data.settings,
        prompt:
          typeof workflowNode.data.prompt === "string" &&
          workflowNode.data.prompt.trim().length > 0
            ? workflowNode.data.prompt
            : card.prompt,
      };

      return {
        workflowNodeId,
        title: card.mediaIntent === "video" ? "视频场景参数" : "图片场景参数",
        subtitle: `${selectedEntry.scene.title} · ${selectedEntry.model.title || selectedEntry.scene.title}`,
        prompt: String(nextValues.prompt || card.prompt || ""),
        selectedModelUrl: selectedEntry.model.url,
        modelOptions: sceneEntries.map((entry) => ({
          sceneId: entry.scene.id,
          sceneLabel: entry.scene.title,
          modelUrl: entry.model.url,
          modelLabel: entry.model.title || entry.scene.title,
        })),
        fields: getCanvasAgentEditableFields(config),
        values: nextValues,
      };
    },
    [configMap, getAgentSceneEntriesForSubtype, graph.nodes],
  );

  const applyAgentSceneRouterCard = useCallback(
    async (input: {
      workflowNodeId: string;
      modelUrl: string;
      values: Record<string, any>;
    }) => {
      const sceneEntries = scenes.flatMap((scene) =>
        (scene.children ?? []).map((model) => ({
          scene,
          model,
        })),
      );
      const selectedEntry = sceneEntries.find(
        (entry) => entry.model.url === input.modelUrl,
      );

      const sourceWorkflow = graph.nodes.find(
        (node) => node.id === input.workflowNodeId && node.kind === "workflow",
      );
      if (!sourceWorkflow || sourceWorkflow.kind !== "workflow") {
        return null;
      }

      const currentSettings =
        sourceWorkflow.data.settings &&
        typeof sourceWorkflow.data.settings === "object"
          ? sourceWorkflow.data.settings
          : {};
      const nextPrompt = String(
        input.values.prompt || sourceWorkflow.data.prompt || "",
      );
      const nextWorkflowNode: CanvasWorkflowNode = {
        ...sourceWorkflow,
        data: {
          ...sourceWorkflow.data,
          sceneId: selectedEntry?.scene.id || sourceWorkflow.data.sceneId,
          sceneLabel:
            selectedEntry?.scene.title || sourceWorkflow.data.sceneLabel,
          modelUrl: input.modelUrl,
          modelLabel:
            selectedEntry?.model.title ||
            selectedEntry?.scene.title ||
            sourceWorkflow.data.modelLabel,
          prompt: nextPrompt,
          aspectRatio:
            typeof input.values.aspectRatio === "string"
              ? input.values.aspectRatio
              : sourceWorkflow.data.aspectRatio,
          settings: {
            ...currentSettings,
            ...input.values,
            prompt: nextPrompt,
            aspectRatio:
              typeof input.values.aspectRatio === "string"
                ? input.values.aspectRatio
                : sourceWorkflow.data.aspectRatio,
          },
          status: "idle",
          errorMessage: undefined,
        },
      };

      const controlTextNodeIds = new Set(
        graph.edges
          .filter(
            (edge) =>
              edge.target === sourceWorkflow.id && edge.semantic === "control",
          )
          .map((edge) => edge.source),
      );

      const nextGraph: CanvasGraph = {
        ...graph,
        nodes: graph.nodes.map((node) => {
          if (node.id === sourceWorkflow.id) {
            return nextWorkflowNode;
          }
          if (controlTextNodeIds.has(node.id) && node.kind === "text") {
            return {
              ...node,
              data: {
                ...node.data,
                content: nextPrompt,
              },
            };
          }
          return node;
        }),
        selection: { nodeId: nextWorkflowNode.id, edgeId: null },
        composer: {
          ...graph.composer,
          nodeId: nextWorkflowNode.id,
        },
      };
      flushSync(() => {
        setGraph(nextGraph);
      });
      setAgentOpen(true);
      return { workflowNode: nextWorkflowNode, graph: nextGraph };
    },
    [graph, scenes, setGraph],
  );

  const generateFromAgentSceneRouterCard = useCallback(
    async (input: {
      workflowNodeId: string;
      modelUrl: string;
      values: Record<string, any>;
    }) => {
      const result = await applyAgentSceneRouterCard(input);
      if (!result) return;
      await generateWorkflowNodeWithSnapshot(result.workflowNode, result.graph);
    },
    [applyAgentSceneRouterCard],
  );

  const confirmAgentExecutionReviewCard = useCallback(
    async (input: { card: CanvasAgentExecutionReviewCard }) => {
      const workflowNodeIds = input.card.workflowNodeIds.filter(
        (workflowNodeId) =>
          graph.nodes.some(
            (node) => node.id === workflowNodeId && node.kind === "workflow",
          ),
      );

      for (const workflowNodeId of workflowNodeIds) {
        await generateWorkflowNode(workflowNodeId);
      }
    },
    [generateWorkflowNode, graph.nodes],
  );

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    (async () => {
      try {
        const threadId = await ensureAgentThread();
        if (cancelled) return;
        await syncAgentThread(threadId);
        if (cancelled) return;
        await syncAgentThreadList(threadId);
      } catch {
        if (cancelled) return;
        setAgentMessages([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureAgentThread, projectId, syncAgentThread, syncAgentThreadList]);

  const handleAgentSubmit = useCallback(
    async (
      prompt: string,
      modeOverride?: CanvasAgentMode,
      suggestionTitle?: string,
    ) => {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt || agentSubmitting) return;
      setAgentOpen(true);
      setAgentSubmitting(true);
      setAgentThinkingText(null);
      appendAgentMessage({
        role: "user",
        content: trimmedPrompt,
        createdAt: new Date().toISOString(),
      });

      try {
        const threadId = await ensureAgentThread();
        const response = await fetch("/api/agent/canvas/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            projectId,
            threadId,
            executionMode: modeOverride ?? agentMode,
            skillId: agentSkillId,
            messageId: `msg-${nanoid(8)}`,
            message: trimmedPrompt,
            sourceTitle: suggestionTitle,
            attachments: agentAttachments.map((attachment) => ({
              assetId: attachment.assetId,
              kind: "image",
              source: "upload",
              name: attachment.name,
              url: attachment.url,
            })),
            selection: selectedNode
              ? { nodeIds: [selectedNode.id] }
              : undefined,
          }),
        });
        const contentType = response.headers.get("content-type") || "";
        let result: any = null;

        if (contentType.includes("text/event-stream")) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          if (!reader) {
            throw new Error("stream body is not available");
          }

          let buffer = "";
          let currentEvent = "message";

          const processEventBlock = (block: string) => {
            const lines = block.split("\n");
            const dataLines: string[] = [];

            currentEvent = "message";
            for (const rawLine of lines) {
              const line = rawLine.trimEnd();
              if (line.startsWith("event:")) {
                currentEvent = line.slice(6).trim() || "message";
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trim());
              }
            }

            if (dataLines.length === 0) return;
            const payload = JSON.parse(dataLines.join("\n"));

            if (currentEvent === "thinking") {
              const reasoning =
                typeof payload?.reasoning === "string" ? payload.reasoning : "";
              if (reasoning.trim()) {
                setAgentThinkingText(reasoning);
              }
              return;
            }

            if (currentEvent === "final") {
              result = payload;
              return;
            }

            if (currentEvent === "error") {
              throw new Error(
                typeof payload?.message === "string"
                  ? payload.message
                  : "failed to send canvas agent message",
              );
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let separatorIndex = buffer.indexOf("\n\n");
            while (separatorIndex >= 0) {
              const block = buffer.slice(0, separatorIndex).trim();
              buffer = buffer.slice(separatorIndex + 2);
              if (block) {
                processEventBlock(block);
              }
              separatorIndex = buffer.indexOf("\n\n");
            }
          }

          const trailing = buffer.trim();
          if (trailing) {
            processEventBlock(trailing);
          }
        } else {
          result = await response.json().catch(() => null);
        }

        if (!response.ok || result?.code !== 0 || !result?.data) {
          throw new Error(
            result?.message || "failed to send canvas agent message",
          );
        }

        if (
          result.data.snapshot?.graph &&
          typeof result.data.snapshot?.version === "number"
        ) {
          const nextGraph = result.data.snapshot.graph as CanvasGraph;
          setGraph(nextGraph);
          const normalizedGraphJson = JSON.stringify({
            ...nextGraph,
            commandMenu: null,
          });
          lastSavedGraphRef.current = normalizedGraphJson;
          setSnapshotVersion(result.data.snapshot.version);
          setSaveState("saved");

          if (Array.isArray(result.data.createdWorkflowNodeIds)) {
            const createdWorkflowIds =
              result.data.createdWorkflowNodeIds.filter(
                (item: unknown): item is string =>
                  typeof item === "string" && item.trim().length > 0,
              );
            if (typeof result.data.assistantMessageId === "string") {
              createdWorkflowIds.forEach((workflowNodeId: string) => {
                agentWorkflowMessageMapRef.current[workflowNodeId] =
                  result.data.assistantMessageId;
              });
            }
            const generationSubmissions: CanvasAgentServerGenerationSubmission[] =
              Array.isArray(result.data.generation?.submissions)
                ? result.data.generation.submissions.filter(
                    (
                      item: unknown,
                    ): item is CanvasAgentServerGenerationSubmission =>
                      Boolean(
                        item &&
                        typeof item === "object" &&
                        typeof (item as { workflowNodeId?: unknown })
                          .workflowNodeId === "string",
                      ),
                  )
                : [];
            const serverSubmittedNodeIds = new Set(
              generationSubmissions
                .filter(
                  (item: CanvasAgentServerGenerationSubmission) =>
                    item.executionMode === "server-submitted" &&
                    Boolean(item.requestId || item.directUrl),
                )
                .map(
                  (item: CanvasAgentServerGenerationSubmission) =>
                    item.workflowNodeId,
                ),
            );

            if (generationSubmissions.length > 0) {
              const acceptedSubmissions = generationSubmissions.filter(
                (item: CanvasAgentServerGenerationSubmission) =>
                  item.executionMode === "server-submitted" &&
                  (Boolean(item.requestId && item.scenario) ||
                    Boolean(item.directUrl) ||
                    Boolean(item.outputs?.length)),
              );
              if (acceptedSubmissions.length > 0) {
                if (typeof result.data.assistantMessageId === "string") {
                  acceptedSubmissions.forEach((submission) => {
                    if (submission.requestId) {
                      agentTaskMessageMapRef.current[submission.requestId] =
                        result.data.assistantMessageId;
                    }
                    agentWorkflowMessageMapRef.current[
                      submission.workflowNodeId
                    ] = result.data.assistantMessageId;
                  });
                }
                setPendingServerGenerationSubmissions(acceptedSubmissions);
              }
            }

            const deferredWorkflowIds = createdWorkflowIds.filter(
              (workflowNodeId: string) =>
                !serverSubmittedNodeIds.has(workflowNodeId),
            );
            if (
              result.data.plan?.executionMode !== "ask" &&
              deferredWorkflowIds.length > 0
            ) {
              if (typeof result.data.assistantMessageId === "string") {
                deferredWorkflowIds.forEach((workflowNodeId: string) => {
                  agentWorkflowMessageMapRef.current[workflowNodeId] =
                    result.data.assistantMessageId;
                });
              }
              setPendingAgentGenerationIds(deferredWorkflowIds);
            }
          }
        } else if (
          Array.isArray(result.data.operations) &&
          result.data.operations.length > 0
        ) {
          const createdWorkflowIds = applyAgentOperations(
            result.data.operations,
          );
          if (
            result.data.plan?.executionMode !== "ask" &&
            createdWorkflowIds.length > 0
          ) {
            setPendingAgentGenerationIds(createdWorkflowIds);
          }
        }

        if (result.data.billing?.charged) {
          void fetchUserInfo();
        }

        setAgentAttachments([]);
        const nextThreadId =
          typeof result.data.threadId === "string"
            ? result.data.threadId
            : threadId;
        if (
          typeof result.data.assistantMessage === "string" &&
          result.data.assistantMessage.trim().length > 0
        ) {
          setAgentMessages((prev) => {
            const next = prev;
            const assistantMessageId =
              typeof result.data.assistantMessageId === "string" &&
              result.data.assistantMessageId.trim().length > 0
                ? result.data.assistantMessageId
                : `assistant-local-${nanoid(8)}`;

            if (next.some((message) => message.id === assistantMessageId)) {
              return next;
            }

            return [
              ...next,
              {
                id: assistantMessageId,
                role: "assistant",
                content: result.data.assistantMessage,
                createdAt: new Date().toISOString(),
                parts: Array.isArray(result.data.assistantParts)
                  ? (result.data.assistantParts as CanvasAgentMessagePart[])
                  : undefined,
                generation: result.data.generation?.status
                  ? {
                      status: result.data.generation.status,
                    }
                  : null,
              },
            ];
          });
        }

        setAgentThreadId(nextThreadId);
        scheduleAgentThreadRefresh(nextThreadId);
        void syncAgentThreadList(nextThreadId).catch(() => null);
      } catch (error) {
        const isZh = locale.toLowerCase().startsWith("zh");
        appendAgentMessage({
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : isZh
                ? "智能体执行失败，请稍后再试。"
                : "The agent failed to run. Please try again.",
        });
      } finally {
        setAgentThinkingText(null);
        setAgentSubmitting(false);
      }
    },
    [
      agentMode,
      agentSkillId,
      agentAttachments,
      agentSubmitting,
      applyAgentOperations,
      appendAgentMessage,
      ensureAgentThread,
      fetchUserInfo,
      locale,
      projectId,
      scheduleAgentThreadRefresh,
      selectedNode,
      syncAgentThreadList,
    ],
  );

  const openCommandMenuFromNode = (
    nodeId: string,
    side: "left" | "right",
    position: { x: number; y: number },
  ) => {
    const node = graph.nodes.find((item) => item.id === nodeId);
    if (!node) return;

    if (side === "left" && node.kind === "text") {
      return;
    }

    if (
      side === "left" &&
      node.kind === "workflow" &&
      !isCanvasImageNode(node)
    ) {
      closeCommandMenu();
      setReferenceSelection({
        anchorNodeId: nodeId,
        anchorSide: "left",
        source: "node-handle",
      });
      return;
    }

    graph.nodes
      .filter((item) => item.kind === "command")
      .forEach((item) => removeNode(item.id));
    graph.edges
      .filter((edge) => edge.semantic === "command")
      .forEach((edge) => removeEdge(edge.id));

    setReferenceSelection(null);
    const menuConfig = getHandleCommandMenuConfig(node, side);
    setCommandMenu({
      nodeId,
      side,
      position,
      title: menuConfig.title,
      commands: menuConfig.commands,
    });
  };

  const closeCommandMenu = () => {
    graph.nodes
      .filter((node) => node.kind === "command")
      .forEach((node) => removeNode(node.id));
    graph.edges
      .filter((edge) => edge.semantic === "command")
      .forEach((edge) => removeEdge(edge.id));
    setCommandMenu(null);
  };

  const connectNodes = (
    sourceId: string,
    targetId: string,
    handles?: {
      sourceHandle?: string | null;
      targetHandle?: string | null;
    },
  ) => {
    const sourceNode = graph.nodes.find((node) => node.id === sourceId);
    const targetNode = graph.nodes.find((node) => node.id === targetId);
    if (!sourceNode || !targetNode) return;
    if (!isCanvasNodeConnectionAllowed(sourceNode, targetNode, handles)) return;

    const semantic = getEdgeSemanticForNodes(sourceNode, targetNode, handles);
    const nextSemantic =
      semantic || (sourceNode.kind === "text" ? "control" : "reference");

    const exists = graph.edges.some(
      (edge) =>
        edge.source === sourceId &&
        edge.target === targetId &&
        edge.semantic === nextSemantic,
    );
    if (exists) return;

    addEdge({
      id: `edge-link-${nanoid(6)}`,
      source: sourceId,
      target: targetId,
      semantic: nextSemantic,
    });
    setSelection({ nodeId: targetId, edgeId: null });
  };

  const uploadImageToInputNode = async (nodeId: string, file: File) => {
    const targetNode = graph.nodes.find((node) => node.id === nodeId);
    const isVideoFile = file.type.startsWith("video/");
    if (targetNode) {
      updateNode(nodeId, (node) => setCanvasNodeGeneratingState(node));
    }
    const formData = new FormData();
    formData.append("files", file);
    if (targetNode?.kind === "workflow") {
      formData.append("sceneId", targetNode.data.sceneId);
      formData.append("sceneLabel", targetNode.data.sceneLabel);
      formData.append("modelUrl", targetNode.data.modelUrl);
      formData.append("modelLabel", targetNode.data.modelLabel);
    } else if (selectedWorkflowNode) {
      formData.append("sceneId", selectedWorkflowNode.data.sceneId);
      formData.append("sceneLabel", selectedWorkflowNode.data.sceneLabel);
      formData.append("modelUrl", selectedWorkflowNode.data.modelUrl);
      formData.append("modelLabel", selectedWorkflowNode.data.modelLabel);
    }

    try {
      const response = await fetch(getUploadEndpoint(file), {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      const url = result?.data?.urls?.[0];
      if (result?.code !== 0 || !url) {
        throw new Error(result?.message || "Upload failed");
      }

      if (targetNode?.kind === "workflow") {
        if (!isVideoFile) {
          const targetSubtype = getWorkflowSubtypeForImageReferenceState(
            targetNode,
            1,
          );
          if (targetSubtype !== targetNode.subtype) {
            await switchWorkflowForReferences(targetNode, targetSubtype, 1);
          }
        }
        updateNode(targetNode.id, (node) =>
          node.kind === "workflow"
            ? {
                ...node,
                data: {
                  ...node.data,
                  uploadedImageUrl: isVideoFile
                    ? node.data.uploadedImageUrl
                    : url,
                  uploadedImageName: isVideoFile
                    ? node.data.uploadedImageName
                    : file.name || "Image",
                  uploadedVideoUrl: isVideoFile
                    ? url
                    : node.data.uploadedVideoUrl,
                  uploadedVideoName: isVideoFile
                    ? file.name || "Video"
                    : node.data.uploadedVideoName,
                  status: "success",
                  errorMessage: undefined,
                },
              }
            : node,
        );
        setSelection({ nodeId: targetNode.id, edgeId: null });
        return;
      }

      updateNode(nodeId, (node) =>
        node.kind === "input"
          ? {
              ...node,
              data: {
                ...node.data,
                label: file.name || (isVideoFile ? "Video" : "Image"),
                mediaKind: isVideoFile ? "video" : "image",
                url,
                status: "success",
                errorMessage: undefined,
              },
            }
          : node,
      );
    } catch (error) {
      updateNode(nodeId, (node) =>
        setCanvasNodeErrorState(
          node,
          error instanceof Error ? error.message : "上传失败，请稍后重试",
        ),
      );
      throw error;
    }
  };

  const attachReferenceNode = async (
    sourceId: string,
    workflowNode = selectedWorkflowNode,
  ) => {
    if (!workflowNode) return;
    const sourceNode = graph.nodes.find((node) => node.id === sourceId);
    if (!sourceNode || !canAttachNodeToWorkflow(sourceNode, workflowNode)) {
      return;
    }

    const referenceKind = getCanvasNodeReferenceKind(sourceNode);
    const nextImageCount = getCanvasReferenceImageCount(
      workflowNode.id,
      graph.nodes,
      graph.edges,
      sourceId,
    );
    const targetSubtype =
      referenceKind === "image"
        ? getWorkflowSubtypeForImageReferenceState(workflowNode, nextImageCount)
        : workflowNode.subtype;

    if (
      targetSubtype !== workflowNode.subtype ||
      (referenceKind === "image" && nextImageCount > 1)
    ) {
      await switchWorkflowForReferences(
        workflowNode,
        targetSubtype,
        nextImageCount,
      );
    }

    const exists = graph.edges.some(
      (edge) =>
        edge.source === sourceId &&
        edge.target === workflowNode.id &&
        edge.semantic === "reference",
    );
    if (!exists) {
      addEdge({
        id: `edge-reference-${nanoid(6)}`,
        source: sourceId,
        target: workflowNode.id,
        semantic: "reference",
      });
    }
    setSelection({ nodeId: workflowNode.id, edgeId: null });
  };

  const getReferenceSelectionAnchorNode = () => {
    const anchorNodeId = referenceSelection?.anchorNodeId;
    return anchorNodeId
      ? (graph.nodes.find((node) => node.id === anchorNodeId) ?? null)
      : null;
  };

  const isCanvasReferenceSelectable = (
    node: CanvasNode,
    anchorNode: CanvasNode | null,
    anchorSide: "left" | "right" = "left",
  ) => {
    if (!anchorNode || node.id === anchorNode.id) return false;
    if (anchorSide === "left") {
      return isCanvasNodeConnectionAllowed(node, anchorNode, {
        sourceHandle: "right",
        targetHandle: "left",
      });
    }

    return isCanvasNodeConnectionAllowed(anchorNode, node, {
      sourceHandle: "right",
      targetHandle: "left",
    });
  };

  const selectCanvasReferenceNode = (nodeId: string) => {
    const anchorNode = getReferenceSelectionAnchorNode();
    const node = graph.nodes.find((item) => item.id === nodeId);
    const anchorSide = referenceSelection?.anchorSide ?? "left";
    if (!node || !isCanvasReferenceSelectable(node, anchorNode, anchorSide)) {
      return;
    }

    if (anchorNode?.kind === "workflow" && anchorSide === "left") {
      void attachReferenceNode(nodeId, anchorNode);
      return;
    }

    if (!anchorNode) return;
    if (anchorSide === "left") {
      connectNodes(nodeId, anchorNode.id, {
        sourceHandle: "right",
        targetHandle: "left",
      });
    } else {
      connectNodes(anchorNode.id, nodeId, {
        sourceHandle: "right",
        targetHandle: "left",
      });
    }
    setReferenceSelection(null);
  };

  const locateAgentMessageNode = useCallback(
    (nodeId: string) => {
      const node = graph.nodes.find((item) => item.id === nodeId);
      if (!node) return;

      const scale = graph.viewport.scale || 1;
      const panelWidth = agentOpen ? 520 : 0;
      const availableWidth = Math.max(window.innerWidth - panelWidth, 320);
      const targetScreenX = Math.max(
        220,
        Math.min(availableWidth / 2, window.innerWidth * 0.4),
      );
      const targetScreenY = Math.max(180, window.innerHeight * 0.46);
      const nodeCenterX = node.position.x + node.size.width / 2;
      const nodeCenterY = node.position.y + node.size.height / 2;

      setSelection({ nodeId: node.id, edgeId: null });
      setViewport({
        scale,
        x: targetScreenX - nodeCenterX * scale,
        y: targetScreenY - nodeCenterY * scale,
      });
    },
    [agentOpen, graph.nodes, graph.viewport.scale, setSelection, setViewport],
  );

  const selectedContextNode = contextMenu
    ? (graph.nodes.find((node) => node.id === contextMenu.nodeId) ?? null)
    : null;

  const closeContextMenu = () => setContextMenu(null);

  const getVisibleCanvasPoint = useCallback(
    (
      screenXFactor: number,
      screenYFactor: number,
      fallbackX: number,
      fallbackY: number,
    ) => {
      if (typeof window === "undefined") {
        return { x: fallbackX, y: fallbackY };
      }

      return screenToWorld(graph.viewport, {
        x: Math.max(window.innerWidth * screenXFactor, fallbackX),
        y: Math.max(window.innerHeight * screenYFactor, fallbackY),
      });
    },
    [graph.viewport],
  );

  const insertMediaNodeFromLibrary = useCallback(
    (item: GeneratedMediaItem) => {
      const point = getVisibleCanvasPoint(0.48, 0.44, 260, 220);
      const node = mapHistoryItemToCanvasNode(item, point);
      addNode(node);
      setSelection({ nodeId: node.id, edgeId: null });
      setSidebarDialogMode(null);
    },
    [addNode, getVisibleCanvasPoint, setSelection],
  );

  const copyNodeToMemory = () => {
    if (!selectedContextNode) return;
    setCopiedNode(selectedContextNode);
    if (selectedContextNode.kind === "text") {
      void navigator.clipboard?.writeText(selectedContextNode.data.content);
    }
    closeContextMenu();
  };

  const pasteIntoTextNode = async () => {
    if (!selectedContextNode || selectedContextNode.kind !== "text") return;
    let pastedText = "";
    try {
      pastedText = await navigator.clipboard.readText();
    } catch {
      pastedText = copiedNode?.kind === "text" ? copiedNode.data.content : "";
    }
    if (!pastedText && copiedNode?.kind === "text") {
      pastedText = copiedNode.data.content;
    }
    if (!pastedText) return;

    updateNode(selectedContextNode.id, (node) =>
      node.kind === "text"
        ? {
            ...node,
            data: {
              ...node.data,
              content: node.data.content
                ? `${node.data.content}\n${pastedText}`
                : pastedText,
            },
          }
        : node,
    );
    closeContextMenu();
  };

  const duplicateContextNode = () => {
    if (!selectedContextNode) return;
    const nextNode = {
      ...selectedContextNode,
      id: `${selectedContextNode.kind}-${nanoid(6)}`,
      position: {
        x: selectedContextNode.position.x + 42,
        y: selectedContextNode.position.y + 42,
      },
      data: {
        ...selectedContextNode.data,
      } as typeof selectedContextNode.data,
    } as CanvasNode;
    addNode(nextNode);
    setSelection({ nodeId: nextNode.id, edgeId: null });
    closeContextMenu();
  };

  const deleteContextNode = () => {
    if (!selectedContextNode) return;
    graph.edges
      .filter(
        (edge) =>
          edge.source === selectedContextNode.id ||
          edge.target === selectedContextNode.id,
      )
      .forEach((edge) => removeEdge(edge.id));

    graph.nodes
      .filter(
        (node) =>
          node.kind === "command" &&
          graph.edges.some(
            (edge) =>
              edge.semantic === "command" &&
              (edge.source === selectedContextNode.id ||
                edge.target === selectedContextNode.id ||
                edge.source === node.id ||
                edge.target === node.id),
          ),
      )
      .forEach((node) => removeNode(node.id));

    removeNode(selectedContextNode.id);
    setSelection({ nodeId: null, edgeId: null });
    closeContextMenu();
  };

  const copyNodeToClipboard = () => {
    if (!selectedContextNode) return;
    const payload =
      selectedContextNode.kind === "text"
        ? selectedContextNode.data.content
        : JSON.stringify(selectedContextNode, null, 2);
    void navigator.clipboard?.writeText(payload);
    closeContextMenu();
  };

  const composerPosition = useMemo(() => {
    if (!selectedWorkflowNode) return null;
    if (typeof window === "undefined" || !hasMounted) {
      return {
        x: selectedWorkflowNode.position.x,
        y:
          selectedWorkflowNode.position.y +
          selectedWorkflowNode.size.height +
          24,
      };
    }

    const composerWidth = Math.min(720, window.innerWidth - 64);
    const padding = 24;
    const nodeTopLeft = worldToScreen(
      graph.viewport,
      selectedWorkflowNode.position,
    );
    const nodeWidth = selectedWorkflowNode.size.width * graph.viewport.scale;
    const nodeHeight = selectedWorkflowNode.size.height * graph.viewport.scale;
    const centeredX = nodeTopLeft.x + nodeWidth / 2 - composerWidth / 2;
    const clampedX = Math.max(
      padding,
      Math.min(centeredX, window.innerWidth - composerWidth - padding),
    );
    const belowY = nodeTopLeft.y + nodeHeight + 18;

    return {
      x: clampedX,
      y: Math.max(padding, belowY),
    };
  }, [graph.viewport, hasMounted, selectedWorkflowNode]);

  const commandMenuPosition = useMemo(() => {
    const commandMenu = graph.commandMenu;
    if (!commandMenu) return null;
    if (typeof window === "undefined") return commandMenu.position;

    const menuWidth = 420;
    const menuHeight = 454;
    const padding = 24;
    const screenPoint = worldToScreen(graph.viewport, commandMenu.position);
    const preferredX = screenPoint.x + 24;
    const fallbackX = screenPoint.x - menuWidth - 24;
    const preferredY = screenPoint.y - 52;

    return {
      x:
        preferredX + menuWidth < window.innerWidth - padding
          ? preferredX
          : Math.max(padding, fallbackX),
      y: Math.max(
        padding,
        Math.min(preferredY, window.innerHeight - menuHeight - padding),
      ),
    };
  }, [graph.commandMenu, graph.viewport]);

  const referenceSelectionTarget = referenceSelection
    ? (graph.nodes.find(
        (node) => node.id === referenceSelection.anchorNodeId,
      ) ?? null)
    : null;
  const referenceSelectionEligibleNodeIds = referenceSelectionTarget
    ? graph.nodes
        .filter((node) =>
          isCanvasReferenceSelectable(
            node,
            referenceSelectionTarget,
            referenceSelection?.anchorSide ?? "left",
          ),
        )
        .map((node) => node.id)
    : [];
  const referenceSelectionPickedNodeIds = referenceSelectionTarget
    ? graph.edges
        .filter((edge) =>
          (referenceSelection?.anchorSide ?? "left") === "left"
            ? edge.target === referenceSelectionTarget.id
            : edge.source === referenceSelectionTarget.id,
        )
        .map((edge) =>
          (referenceSelection?.anchorSide ?? "left") === "left"
            ? edge.source
            : edge.target,
        )
    : [];
  const shouldHideSelectedWorkflowComposer = Boolean(
    referenceSelectionTarget ||
    isConnectionModeActive ||
    graph.commandMenu ||
    activeOverlayNodeIds.length > 0,
  );
  const selectedWorkflowHasGeneratedOrReferenceMedia = selectedWorkflowNode
    ? Boolean(selectedWorkflowNode.data.uploadedImageUrl) ||
      Boolean(selectedWorkflowNode.data.generatedImageUrl) ||
      Boolean(selectedWorkflowNode.data.uploadedVideoUrl) ||
      Boolean(selectedWorkflowNode.data.generatedVideoUrl) ||
      graph.edges.some((edge) => {
        if (
          edge.target !== selectedWorkflowNode.id ||
          edge.semantic !== "reference"
        ) {
          return false;
        }
        const source = graph.nodes.find((node) => node.id === edge.source);
        return (
          source?.kind === "input" &&
          source.subtype === "upload" &&
          source.data.mediaKind === "image" &&
          Boolean(source.data.url)
        );
      })
    : false;

  const isEmptyCanvas = graph.nodes.length === 0;
  const persistedGraphJson = useMemo(
    () =>
      JSON.stringify({
        ...graph,
        commandMenu: null,
      }),
    [graph],
  );

  const handleRenameProject = useCallback(
    async (nextName: string) => {
      if (!projectId) return;

      const previousName = currentProjectName;
      setCurrentProjectName(nextName);

      try {
        const response = await fetch(
          `/api/workbench/canvas-projects/${projectId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: nextName,
            }),
          },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.code !== 0) {
          throw new Error(result?.message || "项目重命名失败");
        }
      } catch (error) {
        setCurrentProjectName(previousName);
        throw error;
      }
    },
    [currentProjectName, projectId],
  );

  useEffect(() => {
    if (!projectId) return;
    if (persistedGraphJson === lastSavedGraphRef.current) return;

    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/workbench/canvas-projects/${projectId}/snapshot`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              graph: {
                ...graph,
                commandMenu: null,
              },
              expectedVersion: snapshotVersion,
            }),
          },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.code !== 0) {
          throw new Error(result?.message || "保存失败");
        }

        lastSavedGraphRef.current = persistedGraphJson;
        setSnapshotVersion(result.data?.snapshot?.version ?? snapshotVersion);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [graph, persistedGraphJson, projectId, snapshotVersion]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#040404] text-white">
      {!isEmptyCanvas ? (
        <CanvasTopBar
          title={currentProjectName}
          homeHref={`/${locale}`}
          remainingCredits={user?.credits?.remainingCredits ?? null}
          onOpenPricing={() => setIsShowPaymentModal(true)}
          onRename={handleRenameProject}
        />
      ) : null}

      <CanvasToolRail
        onOpenProjects={() => setSidebarDialogMode("projects")}
        onOpenCreations={() => setSidebarDialogMode("creations")}
        onOpenCollections={() => setSidebarDialogMode("collections")}
        userNav={userNav}
        onCreateTextNode={() => {
          const node = createTextNode(
            {
              x:
                240 +
                graph.nodes.filter((item) => item.kind === "text").length * 48,
              y:
                160 +
                graph.nodes.filter((item) => item.kind === "text").length * 42,
            },
            canvasCopy.toolRail.text,
          );
          addNode(node);
          setSelection({ nodeId: node.id, edgeId: null });
        }}
        onCreateImageNode={() => {
          const scene =
            findFirstSceneWithWorkspace(scenes, "Image") ??
            findFirstSceneWithWorkspace(scenes);
          if (!scene) return;
          const modelUrl = getPreferredSceneUrl(scene);
          const node = createWorkflowNode({
            sceneId: scene.id,
            sceneLabel: scene.title,
            modelUrl,
            modelLabel:
              scene.children?.find((child) => child.url === modelUrl)?.title ||
              scene.title,
            subtype: "text-to-image",
            position: {
              x:
                240 +
                graph.nodes.filter((item) => item.kind === "workflow").length *
                  60,
              y:
                180 +
                graph.nodes.filter((item) => item.kind === "workflow").length *
                  44,
            },
            settings: {},
          });
          addNode(node);
          setSelection({ nodeId: node.id, edgeId: null });
        }}
        onCreateVideoNode={() => {
          const scene =
            findFirstSceneWithWorkspace(scenes, "Video") ??
            findFirstSceneWithWorkspace(scenes);
          if (!scene) return;
          const modelUrl = getPreferredSceneUrl(scene);
          const node = createWorkflowNode({
            sceneId: scene.id,
            sceneLabel: scene.title,
            modelUrl,
            modelLabel:
              scene.children?.find((child) => child.url === modelUrl)?.title ||
              scene.title,
            subtype: "text-to-video",
            position: {
              x:
                260 +
                graph.nodes.filter((item) => item.kind === "workflow").length *
                  60,
              y:
                220 +
                graph.nodes.filter((item) => item.kind === "workflow").length *
                  44,
            },
            settings: {},
          });
          addNode(node);
          setSelection({ nodeId: node.id, edgeId: null });
        }}
        onCreateAudioNode={() => {
          const node = {
            id: `audio-${nanoid(6)}`,
            kind: "input" as const,
            subtype: "audio" as const,
            position: {
              x:
                200 +
                graph.nodes.filter((item) => item.kind === "input").length * 32,
              y: 340,
            },
            size: { width: 270, height: 270 },
            data: {
              label: "音频节点",
              prompt: "音频参考素材",
              mediaKind: "audio" as const,
            },
          };
          addNode(node);
          setSelection({ nodeId: node.id, edgeId: null });
        }}
        onCreateUploadNode={() => {
          const node = {
            id: `upload-${nanoid(6)}`,
            kind: "input" as const,
            subtype: "upload" as const,
            position: {
              x:
                180 +
                graph.nodes.filter((item) => item.kind === "input").length * 28,
              y: 500,
            },
            size: { width: 270, height: 270 },
            data: {
              label: "上传节点",
              prompt: "待上传的参考素材",
              mediaKind: "image" as const,
            },
          };
          addNode(node);
          setSelection({ nodeId: node.id, edgeId: null });
        }}
      />

      <CanvasSidebarDialog
        open={sidebarDialogMode !== null}
        mode={sidebarDialogMode}
        locale={locale}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSidebarDialogMode(null);
          }
        }}
        onUseItem={insertMediaNodeFromLibrary}
      />

      <section className="relative h-full w-full overflow-hidden">
        <ReactFlowStage
          nodes={graph.nodes}
          edges={graph.edges}
          viewport={graph.viewport}
          selectedNodeId={graph.selection.nodeId}
          referenceSelection={
            referenceSelectionTarget
              ? {
                  active: true,
                  anchorNodeId: referenceSelectionTarget.id,
                  eligibleNodeIds: referenceSelectionEligibleNodeIds,
                  pickedNodeIds: referenceSelectionPickedNodeIds,
                }
              : null
          }
          onNodeSelect={(nodeId) => {
            if (referenceSelectionTarget) {
              selectCanvasReferenceNode(nodeId);
              return;
            }
            setSelection({ nodeId, edgeId: null });
          }}
          onPaneSelect={() => {
            if (referenceSelectionTarget) {
              if (referenceSelection?.source === "node-handle") {
                setReferenceSelection(null);
              }
              return;
            }
            setSelection({ nodeId: null, edgeId: null });
          }}
          onNodeContextMenu={(nodeId, position) => {
            setContextMenu({
              nodeId,
              x: Math.max(12, Math.min(position.x, window.innerWidth - 294)),
              y: Math.max(12, Math.min(position.y, window.innerHeight - 330)),
            });
          }}
          onNodeMove={(nodeId, position) =>
            updateNode(nodeId, (node) => ({ ...node, position }))
          }
          onGroupMove={(groupId, delta) => {
            setNodes(
              graph.nodes.map((node) =>
                node.groupId === groupId
                  ? {
                      ...node,
                      position: {
                        x: node.position.x + delta.x,
                        y: node.position.y + delta.y,
                      },
                    }
                  : node,
              ),
            );
          }}
          onNodeCommand={openCommandMenuFromNode}
          onNodeTitleChange={(nodeId, title) =>
            updateNode(nodeId, (node) => {
              switch (node.kind) {
                case "workflow":
                case "result":
                case "command":
                case "input":
                case "text":
                case "template":
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      title,
                    },
                  } as typeof node;
                default:
                  return node;
              }
            })
          }
          onTextChange={(nodeId, content) =>
            updateNode(nodeId, (node) =>
              node.kind === "text"
                ? { ...node, data: { ...node.data, content } }
                : node,
            )
          }
          onTextBackgroundChange={(nodeId, backgroundColor) =>
            updateNode(nodeId, (node) =>
              node.kind === "text"
                ? { ...node, data: { ...node.data, backgroundColor } }
                : node,
            )
          }
          onImageUpload={uploadImageToInputNode}
          onImageCrop={handleImageCrop}
          onVideoTrim={handleVideoTrim}
          onVideoSegmentation={handleVideoSegmentation}
          onVideoUpscale={handleVideoUpscale}
          onImageToolAction={handleImageToolAction}
          onConnectNodes={connectNodes}
          isConnectionAllowed={(sourceId, targetId, handles) => {
            const sourceNode = graph.nodes.find((node) => node.id === sourceId);
            const targetNode = graph.nodes.find((node) => node.id === targetId);
            if (!sourceNode || !targetNode) return false;
            return isCanvasNodeConnectionAllowed(
              sourceNode,
              targetNode,
              handles,
            );
          }}
          onRemoveEdge={(edgeId) => {
            removeEdge(edgeId);
            setSelection({ nodeId: graph.selection.nodeId, edgeId: null });
          }}
          onViewportChange={setViewport}
          onConnectionModeChange={setIsConnectionModeActive}
        />

        {referenceSelectionTarget &&
        referenceSelection?.source === "composer" ? (
          <div className="pointer-events-auto absolute left-1/2 top-5 z-40 flex -translate-x-1/2 items-center gap-3 rounded-[18px] bg-[#26aee8] px-5 py-3 text-[0.95rem] font-semibold text-white shadow-[0_18px_48px_rgba(38,174,232,0.24)]">
            <span>{canvasCopy.common.chooseReferenceFromCanvas}</span>
            <span className="flex size-8 items-center justify-center rounded-[12px] bg-black/20">
              <Crosshair className="size-4" />
            </span>
            <span className="h-5 w-px bg-white/28" />
            <button
              type="button"
              className="rounded-[12px] bg-black/18 px-3 py-1.5 text-[0.86rem] transition hover:bg-black/28"
              onClick={() => setReferenceSelection(null)}
            >
              {canvasCopy.common.exit}
            </button>
          </div>
        ) : null}

        {!isEmptyCanvas ? (
          <CanvasBottomControls
            scale={graph.viewport.scale}
            onZoomChange={(scale) => setViewport({ ...graph.viewport, scale })}
          />
        ) : null}

        {isEmptyCanvas ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="pointer-events-auto flex max-w-[64rem] flex-col items-center px-6 text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(24,26,30,0.9)] px-5 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.08] text-[#4bc2ff]">
                  <Sparkles className="size-4" />
                </span>
                <span className="text-[1.05rem] font-semibold text-white/90">
                  {canvasCopy.common.doubleClick}
                </span>
                <span className="text-[1.05rem] text-white/54">
                  {canvasCopy.common.emptyHint}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const scene =
                      findFirstSceneWithWorkspace(scenes, "Video") ??
                      findFirstSceneWithWorkspace(scenes);
                    if (!scene) return;
                    const modelUrl = getPreferredSceneUrl(scene);
                    const node = createWorkflowNode({
                      sceneId: scene.id,
                      sceneLabel: scene.title,
                      modelUrl,
                      modelLabel:
                        scene.children?.find((child) => child.url === modelUrl)
                          ?.title || scene.title,
                      subtype: "text-to-video",
                      position: { x: 440, y: 260 },
                      settings: {},
                    });
                    addNode(node);
                    setSelection({ nodeId: node.id, edgeId: null });
                  }}
                  className="inline-flex items-center gap-2 rounded-[20px] border border-white/10 bg-[rgba(20,22,27,0.92)] px-5 py-3 text-[0.98rem] text-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
                >
                  <Clapperboard className="size-4" />
                  <span>{canvasCopy.common.textToVideo}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const node = {
                      id: `empty-image-edit-${nanoid(6)}`,
                      kind: "input" as const,
                      subtype: "upload" as const,
                      position: { x: 420, y: 300 },
                      size: { width: 270, height: 270 },
                      data: {
                        label: canvasCopy.common.imageBackground,
                        prompt: canvasCopy.common.imageBackgroundPrompt,
                        mediaKind: "image" as const,
                      },
                    };
                    addNode(node);
                    setSelection({ nodeId: node.id, edgeId: null });
                  }}
                  className="inline-flex items-center gap-2 rounded-[20px] border border-white/10 bg-[rgba(20,22,27,0.92)] px-5 py-3 text-[0.98rem] text-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
                >
                  <Wand2 className="size-4" />
                  <span>{canvasCopy.common.imageBackground}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const scene =
                      scenes.find((candidate) =>
                        candidate.children?.some(
                          (child) =>
                            child.url === EMPTY_STATE_FIRST_FRAME_MODEL_URL,
                        ),
                      ) ??
                      findFirstSceneWithWorkspace(scenes, "Video") ??
                      findFirstSceneWithWorkspace(scenes);
                    if (!scene) return;

                    const modelUrl = EMPTY_STATE_FIRST_FRAME_MODEL_URL;
                    const modelLabel =
                      scene.children?.find((child) => child.url === modelUrl)
                        ?.title ?? "Seedance 2.0";
                    const node = createWorkflowNode({
                      sceneId: scene.id,
                      sceneLabel: scene.title,
                      modelUrl,
                      modelLabel,
                      subtype: "image-to-video",
                      position: { x: 460, y: 260 },
                      settings: {},
                    });
                    addNode(node);
                    setSelection({ nodeId: node.id, edgeId: null });
                  }}
                  className="inline-flex items-center gap-2 rounded-[20px] border border-white/10 bg-[rgba(20,22,27,0.92)] px-5 py-3 text-[0.98rem] text-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
                >
                  <Sparkles className="size-4" />
                  <span>{canvasCopy.common.firstFrameToVideo}</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {graph.commandMenu && commandMenuPosition ? (
          <CanvasCommandMenu
            x={commandMenuPosition.x}
            y={commandMenuPosition.y}
            title={graph.commandMenu.title}
            commands={graph.commandMenu.commands}
            onSelect={createWorkflowFromCommand}
            onClose={closeCommandMenu}
          />
        ) : null}

        {contextMenu && selectedContextNode ? (
          <CanvasNodeContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            canPaste={selectedContextNode.kind === "text"}
            onCopy={copyNodeToMemory}
            onPaste={pasteIntoTextNode}
            onDuplicate={duplicateContextNode}
            onDelete={deleteContextNode}
            onCopyToClipboard={copyNodeToClipboard}
            onClose={closeContextMenu}
          />
        ) : null}

        {selectedWorkflowNode &&
        composerPosition &&
        !shouldHideSelectedWorkflowComposer &&
        !selectedWorkflowHasGeneratedOrReferenceMedia ? (
          <CanvasComposer
            node={selectedWorkflowNode}
            x={composerPosition.x}
            y={composerPosition.y}
            references={references}
            attachableNodes={attachableNodes}
            modelOptions={currentModelOptions}
            parameterFields={composerParameterFields}
            requiredCredits={requiredCredits}
            isGenerating={selectedWorkflowNode.data.status === "generating"}
            onPromptChange={(value) =>
              updateNode(selectedWorkflowNode.id, (node) =>
                node.kind === "workflow"
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        prompt: value,
                        settings: { ...node.data.settings, prompt: value },
                      },
                    }
                  : node,
              )
            }
            onModelChange={(modelUrl) =>
              applyModelToWorkflow(selectedWorkflowNode.id, modelUrl)
            }
            onSettingChange={(key, value) =>
              updateNode(selectedWorkflowNode.id, (node) =>
                node.kind === "workflow"
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        ...(key === "aspectRatio" && typeof value === "string"
                          ? { aspectRatio: value }
                          : {}),
                        ...(key === "count" && typeof value === "number"
                          ? { count: value }
                          : {}),
                        settings: { ...node.data.settings, [key]: value },
                      },
                    }
                  : node,
              )
            }
            onGenerate={handleGenerate}
            onAttachNode={(nodeId) => void attachReferenceNode(nodeId)}
            onAddNode={() => {
              setReferenceSelection({
                anchorNodeId: selectedWorkflowNode.id,
                anchorSide: "left",
                source: "composer",
              });
              setCommandMenu(null);
            }}
            onRemoveReference={handleRemoveReference}
          />
        ) : null}

        <CanvasAgentDock
          locale={locale}
          open={agentOpen}
          mode={agentMode}
          selectedSkillId={agentSkillId}
          messages={agentMessages}
          attachments={agentAttachments}
          suggestions={agentSuggestions}
          isSubmitting={agentSubmitting}
          currentThinking={agentThinkingText}
          greetingName={
            typeof user?.name === "string" && user.name.trim()
              ? user.name
              : typeof user?.email === "string"
                ? user.email.split("@")[0]
                : null
          }
          currentThreadId={agentThreadId}
          currentThreadTitle={currentAgentThread?.title || null}
          latestThreadId={latestAgentThreadId}
          threads={agentThreads}
          threadsLoading={agentThreadsLoading}
          onToggle={() => setAgentOpen((value) => !value)}
          onModeChange={setAgentMode}
          onSkillChange={setAgentSkillId}
          onUploadFiles={handleAgentUploadFiles}
          onSubmit={(prompt) => handleAgentSubmit(prompt)}
          onCreateThread={() => createNewAgentThread()}
          onSelectThread={(threadId) => switchAgentThread(threadId)}
          onSuggestionSelect={(suggestion) => {
            setAgentMode(suggestion.mode ?? "auto");
            void handleAgentSubmit(
              suggestion.prompt,
              suggestion.mode ?? "auto",
              suggestion.title,
            );
          }}
          resolveSceneRouterCard={resolveAgentSceneRouterCard}
          onApplySceneRouterCard={({ workflowNodeId, modelUrl, values }) =>
            generateFromAgentSceneRouterCard({
              workflowNodeId,
              modelUrl,
              values,
            })
          }
          onGenerateSceneRouterCard={({ workflowNodeId, modelUrl, values }) =>
            generateFromAgentSceneRouterCard({
              workflowNodeId,
              modelUrl,
              values,
            })
          }
          onConfirmExecutionReviewCard={({ card }) =>
            confirmAgentExecutionReviewCard({ card })
          }
          onLocateMessageNode={locateAgentMessageNode}
        />
      </section>
    </div>
  );
}

export function CanvasPageShell(props: CanvasPageShellProps) {
  const emptyGraph = useMemo<CanvasGraph>(
    () => ({
      nodes: [],
      edges: [],
      viewport: { x: 140, y: 120, scale: 1 },
      selection: { nodeId: null, edgeId: null },
      composer: { nodeId: null, references: [] },
      commandMenu: null,
    }),
    [],
  );
  const initialGraph = props.initialGraph ?? emptyGraph;

  return (
    <CanvasWorkspaceProvider initialGraph={initialGraph}>
      <CanvasPageInner {...props} />
    </CanvasWorkspaceProvider>
  );
}
