import {
  buildWorkbenchTemplateCatalog,
  filterWorkbenchTemplateSamplesByPolicy,
} from "@/shared/lib/workbench-template-catalog";
import { getPlaygroundConfigByUrl } from "@/shared/blocks/desktop-playground/playground-config-registry";
import { listWorkbenchCreations } from "@/shared/models/workbench-creation";
import { listWorkbenchUploads } from "@/shared/models/workbench-upload";
import {
  resolveCanvasAgentMentionedReferences,
  type CanvasAgentMessageAttachmentInput,
} from "@/shared/models/workbench-canvas-chat";

export async function listCanvasAgentRecentCreations(input: {
  userId: string;
  mediaType?: "image" | "video";
  limit?: number;
}) {
  return listWorkbenchCreations({
    userId: input.userId,
    mediaType: input.mediaType || "all",
    limit: input.limit ?? 12,
    offset: 0,
  });
}

export async function listCanvasAgentRecentUploads(input: {
  userId: string;
  mediaType?: "image" | "video";
  limit?: number;
}) {
  return listWorkbenchUploads({
    userId: input.userId,
    mediaType: input.mediaType || "all",
    limit: input.limit ?? 12,
    offset: 0,
  });
}

export async function listCanvasAgentTemplateCatalog(input: {
  modelUrl: string;
  sceneId?: string;
  sceneLabel?: string;
  modelLabel?: string;
}) {
  const config = await getPlaygroundConfigByUrl(input.modelUrl);
  if (!config) {
    throw new Error("template catalog config not found");
  }

  const items = await buildWorkbenchTemplateCatalog({
    sceneId: input.sceneId,
    sceneLabel: input.sceneLabel,
    modelUrl: input.modelUrl,
    modelLabel: input.modelLabel,
    config,
  });

  return filterWorkbenchTemplateSamplesByPolicy(items, "default");
}

export async function resolveCanvasAgentReferences(input: {
  userId: string;
  projectId: string;
  content: string;
  attachments?: CanvasAgentMessageAttachmentInput[];
}) {
  return resolveCanvasAgentMentionedReferences(input);
}
