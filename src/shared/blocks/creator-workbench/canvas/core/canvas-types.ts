"use client";

export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasViewportState = {
  x: number;
  y: number;
  scale: number;
};

export type CanvasSelectionState = {
  nodeId: string | null;
  edgeId: string | null;
};

export type CanvasEdgeSemantic =
  | "reference"
  | "derivation"
  | "result"
  | "control"
  | "command";

export type CanvasNodeKind =
  | "workflow"
  | "result"
  | "command"
  | "input"
  | "text"
  | "template";

export type CanvasWorkflowSubtype =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video";

export type CanvasResultSubtype = "image" | "video";

export type CanvasCommandType =
  | "text-to-image"
  | "image-to-image"
  | "image-to-video"
  | "text-to-video"
  | "upload-reference"
  | "apply-template"
  | "context-text"
  | "context-image";

export type CanvasNodeStatus = "idle" | "generating" | "success" | "error";

export type CanvasReferenceKind = "image" | "video" | "audio";

export type CanvasReferenceItem = {
  id: string;
  kind: CanvasReferenceKind;
  url: string;
  label?: string;
};

export type CanvasImageToolKind =
  | "crop"
  | "redraw"
  | "erase"
  | "relight"
  | "multiple-angles"
  | "expand"
  | "annotate"
  | "upscale"
  | "cutout"
  | "quick-split";

export type CanvasImageToolRequest = {
  nodeId: string;
  tool: CanvasImageToolKind;
  prompt?: string;
  maskDataUrl?: string;
  outputFormat?: "jpeg" | "png" | "webp";
  targetResolution?: "2k" | "4k" | "8k";
  aspectRatio?: string;
  grid?: 2 | 3 | 4;
  multiAngle?: {
    horizontalAngle: number;
    verticalAngle: number;
    distance: 0 | 1 | 2;
    size?: string;
  };
  lighting?: {
    mode?: "perspective" | "front";
    anglePreset?:
      | "front_0"
      | "left_90"
      | "right_90"
      | "top_90"
      | "bottom_90"
      | "back_180"
      | "right_45"
      | "right_rear_45"
      | "left_rear_45"
      | "left_45"
      | "top_front_45"
      | "top_front_right_45"
      | "top_right_45"
      | "right_rear_top_45"
      | "top_rear_45"
      | "left_rear_top_45"
      | "top_left_45"
      | "top_front_left_45"
      | "bottom_front_45"
      | "bottom_front_right_45"
      | "bottom_right_45"
      | "right_rear_bottom_45"
      | "bottom_rear_45"
      | "left_rear_bottom_45"
      | "bottom_left_45"
      | "bottom_front_left_45";
    azimuthDeg?: number;
    elevationDeg?: number;
    brightness?: number;
    colorTemperature?: number;
    mainLight?: "left" | "top" | "right" | "front" | "bottom" | "back";
    rimLight?: boolean;
    rimPreset?: "back_0" | "top_back_45" | "low_back_45";
  };
};

export type CanvasWorkflowNodeData = {
  title?: string;
  sceneId: string;
  sceneLabel: string;
  modelUrl: string;
  modelLabel: string;
  uploadedImageUrl?: string;
  uploadedImageName?: string;
  uploadedVideoUrl?: string;
  uploadedVideoName?: string;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  generatedCreationRecordId?: string;
  prompt: string;
  aspectRatio?: string;
  count?: number;
  settings: Record<string, any>;
  status: CanvasNodeStatus;
  errorMessage?: string;
};

export type CanvasResultNodeData = {
  title?: string;
  mediaKind: CanvasResultSubtype;
  url: string;
  creationRecordId?: string;
  prompt?: string;
  derivationKind?: "image-crop" | "video-trim";
  taskId?: string;
  status?: CanvasNodeStatus;
  errorMessage?: string;
  aspectRatio?: string;
  sceneId?: string;
  modelUrl?: string;
  sourceNodeId?: string;
};

export type CanvasCommandNodeData = {
  title?: string;
  sourceNodeId: string;
  sourceHandle: "left" | "right";
  commands: CanvasCommandType[];
};

export type CanvasInputNodeData = {
  title?: string;
  label: string;
  prompt?: string;
  mediaKind?: CanvasReferenceKind;
  url?: string;
  creationRecordId?: string;
  status?: CanvasNodeStatus;
  errorMessage?: string;
};

export type CanvasTextNodeData = {
  title?: string;
  label: string;
  content: string;
  backgroundColor?: string;
};

export type CanvasTemplateNodeData = {
  title?: string;
  templateId: string;
  label: string;
  prompt?: string;
  params: Record<string, any>;
};

export type CanvasNodeData =
  | CanvasWorkflowNodeData
  | CanvasResultNodeData
  | CanvasCommandNodeData
  | CanvasInputNodeData
  | CanvasTextNodeData
  | CanvasTemplateNodeData;

export type CanvasNodeBase<TKind extends CanvasNodeKind, TData> = {
  id: string;
  kind: TKind;
  subtype?: string;
  position: CanvasPoint;
  size: CanvasSize;
  groupId?: string;
  groupLabel?: string;
  data: TData;
};

export type CanvasWorkflowNode = CanvasNodeBase<
  "workflow",
  CanvasWorkflowNodeData
> & {
  subtype: CanvasWorkflowSubtype;
};

export type CanvasResultNode = CanvasNodeBase<
  "result",
  CanvasResultNodeData
> & {
  subtype: CanvasResultSubtype;
};

export type CanvasCommandNode = CanvasNodeBase<
  "command",
  CanvasCommandNodeData
> & {
  subtype: "continue";
};

export type CanvasInputNode = CanvasNodeBase<"input", CanvasInputNodeData> & {
  subtype: "history" | "upload" | "audio";
};

export type CanvasTextNode = CanvasNodeBase<"text", CanvasTextNodeData> & {
  subtype: "copy";
};

export type CanvasTemplateNode = CanvasNodeBase<
  "template",
  CanvasTemplateNodeData
> & {
  subtype: "template";
};

export type CanvasNode =
  | CanvasWorkflowNode
  | CanvasResultNode
  | CanvasCommandNode
  | CanvasInputNode
  | CanvasTextNode
  | CanvasTemplateNode;

export type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  semantic: CanvasEdgeSemantic;
};

export type CanvasComposerContext = {
  nodeId: string | null;
  references: CanvasReferenceItem[];
};

export type CanvasCommandMenuState = {
  nodeId: string;
  position: CanvasPoint;
  side: "left" | "right";
  title?: string;
  commands: CanvasCommandType[];
} | null;

export type CanvasNodeGroup = {
  id: string;
  label: string;
  nodeIds: string[];
};

export type CanvasGraph = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: CanvasViewportState;
  selection: CanvasSelectionState;
  composer: CanvasComposerContext;
  commandMenu: CanvasCommandMenuState;
  groups?: CanvasNodeGroup[];
};
