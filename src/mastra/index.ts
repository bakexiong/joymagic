import { Mastra } from "@mastra/core/mastra";
import {
  FilesystemStore,
  InMemoryStore,
  MastraCompositeStore,
} from "@mastra/core/storage";
import { DefaultExporter, Observability } from "@mastra/observability";
import { studioCanvasAgents } from "./agents/studio-agent-registry";
import { createCanvasMastraEditor } from "./editor/canvas-editor";
import type { CanvasAgentTokenUsage } from "./agents/agent-usage";
import { getLocalMastraObservabilityDuckDbPath, mastraLogger } from "./logger";

import { getCanvasAgentMemory } from "./memory/canvas-agent-memory";

import { canvasGenerationTools } from "./tools/canvas-generation-tools";
import { canvasAssetTools } from "./tools/canvas-asset-tools";
import { canvasReadTools } from "./tools/canvas-read-tools";
import { canvasWriteTools } from "./tools/canvas-write-tools";
import { canvasChatRequestWorkflow } from "./workflows/canvas-chat-request-workflow";
import { canvasGenerateWorkflow } from "./workflows/canvas-generate-workflow";
import { createCanvasAgentWorkspace } from "./workspace/canvas-agent-workspace";
import { getCanvasAgentMastraServerConfig } from "./server/canvas-agent-service-routes";
import { ObservabilityScoresStore } from "./storage/observability-scores-store";
import type { CanvasAgentResolvedSkillContext } from "@/shared/services/canvas-agent/canvas-agent-skill";

function isLocalMastraObservabilityEnabled() {
  return process.env.MASTRA_ENABLE_LOCAL_OBSERVABILITY === "true";
}

const mastraObservability = isLocalMastraObservabilityEnabled()
  ? new Observability({
      configs: {
        default: {
          serviceName: "canvas-mastra",
          exporters: [new DefaultExporter()],
          logging: {
            enabled: true,
            level: "debug",
          },
        },
      },
    })
  : undefined;

const mastraInstancePromise = createMastraInstance();

function shouldUseFilesystemEditorStorage() {
  const explicit = process.env.MASTRA_ENABLE_FILESYSTEM_EDITOR_STORAGE?.trim();
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  return process.env.NODE_ENV !== "production";
}

function getLocalMastraEditorStorageDir() {
  if (process.env.MASTRA_EDITOR_STORAGE_DIR?.trim()) {
    return process.env.MASTRA_EDITOR_STORAGE_DIR.trim();
  }

  return ".mastra/editor-storage";
}

async function importAtRuntime<T>(specifier: string): Promise<T> {
  const importer = new Function("modulePath", "return import(modulePath)") as (
    modulePath: string,
  ) => Promise<T>;

  return importer(specifier);
}

async function createMastraInstance() {
  const editorStorage = shouldUseFilesystemEditorStorage()
    ? new FilesystemStore({
        dir: getLocalMastraEditorStorageDir(),
      })
    : new InMemoryStore({
        id: "canvas-mastra-editor-storage",
      });
  let storage: unknown = editorStorage;

  if (isLocalMastraObservabilityEnabled()) {
    try {
      const { DuckDBStore } = await importAtRuntime<{
        DuckDBStore: new (options: { path: string }) => {
          stores?: Record<string, unknown>;
          observability: import("@mastra/core/storage").ObservabilityStorage;
        };
      }>(["@mastra", "duckdb"].join("/"));
      const duckDbPath = getLocalMastraObservabilityDuckDbPath();
      const duckDbStorage = new DuckDBStore({
        path: duckDbPath,
      });
      const duckDbObservabilityStore = duckDbStorage.observability;
      const localStudioStore = new InMemoryStore({
        id: "canvas-mastra-local-studio-storage",
      });

      storage = new MastraCompositeStore({
        id: "canvas-mastra-storage",
        domains: {
          observability: duckDbObservabilityStore,
          scores: new ObservabilityScoresStore(duckDbObservabilityStore),
          datasets: localStudioStore.stores.datasets,
          experiments: localStudioStore.stores.experiments,
          ...(editorStorage.stores ?? {}),
        },
      });
    } catch (error) {
      console.warn(
        "[canvas-agent] failed to load DuckDBStore, continuing with editor-only storage",
        error,
      );
    }
  }

  return new Mastra({
    agents: {
      ...studioCanvasAgents,
    },
    storage: storage as undefined,
    logger: mastraLogger,
    workflows: {
      canvasChatRequestWorkflow,
      canvasGenerateWorkflow,
    },
    tools: {
      ...canvasReadTools,
      ...canvasWriteTools,
      ...canvasGenerationTools,
      ...canvasAssetTools,
    },
    memory: {
      canvasAgentChatMemory: getCanvasAgentMemory(),
    },
    observability: mastraObservability,
    server: getCanvasAgentMastraServerConfig(),
    editor: createCanvasMastraEditor(),
    workspace: createCanvasAgentWorkspace(),
  });
}

export async function getCanvasMastraInstance() {
  return mastraInstancePromise;
}

export const mastra = await mastraInstancePromise;

export async function getCanvasMastraEditor() {
  const mastra = await getCanvasMastraInstance();
  const editor = mastra.getEditor();

  if (!editor) {
    throw new Error("Canvas Mastra editor is not registered");
  }

  return editor;
}

export async function runCanvasAgentMessageWithMastra(input: {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  executionMode: "ask" | "auto";
  isFirstTextMessage?: boolean;
  skillId?: string | null;
  skillContext?: CanvasAgentResolvedSkillContext | null;
  message: string;
  requestBaseUrl?: string;
  requestCookieHeader?: string;
  contextMessages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  references: Array<{
    assetId: string;
    nodeId?: string;
    label?: string;
    url?: string;
  }>;
  selectedNodeIds?: string[];
  selectedWorkflowNodes?: Array<{
    nodeId: string;
    label: string;
    subtype:
      | "text-to-image"
      | "image-to-image"
      | "text-to-video"
      | "image-to-video";
    prompt?: string;
  }>;
  editableWorkflowNodes?: Array<{
    nodeId: string;
    label: string;
    subtype:
      | "text-to-image"
      | "image-to-image"
      | "text-to-video"
      | "image-to-video";
    prompt?: string;
  }>;
}) {
  const mastra = await getCanvasMastraInstance();
  const workflow = mastra.getWorkflow(
    "canvasChatRequestWorkflow",
  ) as typeof canvasChatRequestWorkflow;

  if (!workflow) {
    throw new Error("canvasChatRequestWorkflow is not registered");
  }

  const run = await (
    workflow as unknown as {
      createRun: (options?: { resourceId?: string }) => Promise<{
        start: (args: {
          inputData: {
            userId: string;
            projectId: string;
            threadId: string;
            resourceId: string;
            executionMode: "ask" | "auto";
            isFirstTextMessage?: boolean;
            skillId?: string | null;
            skillContext?: CanvasAgentResolvedSkillContext | null;
            message: string;
            requestBaseUrl?: string;
            requestCookieHeader?: string;
            contextMessages?: Array<{
              role: "system" | "user" | "assistant";
              content: string;
            }>;
            references: Array<{
              assetId: string;
              nodeId?: string;
              label?: string;
              url?: string;
            }>;
            selectedNodeIds?: string[];
            selectedWorkflowNodes?: Array<{
              nodeId: string;
              label: string;
              subtype:
                | "text-to-image"
                | "image-to-image"
                | "text-to-video"
                | "image-to-video";
              prompt?: string;
            }>;
            editableWorkflowNodes?: Array<{
              nodeId: string;
              label: string;
              subtype:
                | "text-to-image"
                | "image-to-image"
                | "text-to-video"
                | "image-to-video";
              prompt?: string;
            }>;
          };
        }) => Promise<{
          status: "success" | "failed" | "tripwire" | "suspended";
          result?: {
            assistantMessage: string;
            promptGuideOptions?: Array<{
              id: string;
              title: string;
              description: string;
              prompt: string;
            }>;
            nextStepTitle?: string;
            nextStepDescription?: string;
            nextStepOptions?: Array<{
              id: string;
              title: string;
              description: string;
              prompt: string;
            }>;
            uiLabels?: {
              groupLabel?: string;
              promptTextLabel?: string;
              promptGuideTitle?: string;
              promptGuideDescription?: string;
              promptGuideCustomLabel?: string;
            };
            tokenUsage: CanvasAgentTokenUsage;
            mediaIntent: "image" | "video";
            subtype:
              | "text-to-image"
              | "image-to-image"
              | "text-to-video"
              | "image-to-video";
            refinedPrompt: string;
            promptRefinementReasoning: string;
            preferredModelUrl: string;
            sceneRoutingReasoning: string;
            plan: {
              executionMode: "ask" | "auto";
              mediaIntent: "image" | "video";
              subtype:
                | "text-to-image"
                | "image-to-image"
                | "text-to-video"
                | "image-to-video";
              preferredModelUrl?: string;
            };
            operations: any[];
            snapshot: {
              id: string;
              version: number;
              graph: any;
            };
            tempNodeIdMap: Record<string, string>;
            createdWorkflowNodeIds: string[];
            generationSubmissions: Array<{
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
            }>;
          };
          error?: Error;
        }>;
      }>;
    }
  ).createRun({
    resourceId: input.resourceId,
  });

  const result = await run.start({
    inputData: {
      projectId: input.projectId,
      userId: input.userId,
      threadId: input.threadId,
      resourceId: input.resourceId,
      executionMode: input.executionMode,
      isFirstTextMessage: input.isFirstTextMessage,
      skillId: input.skillId || null,
      skillContext: input.skillContext || null,
      message: input.message,
      requestBaseUrl: input.requestBaseUrl,
      requestCookieHeader: input.requestCookieHeader,
      contextMessages: input.contextMessages || [],
      references: input.references,
      selectedNodeIds: input.selectedNodeIds || [],
      selectedWorkflowNodes: input.selectedWorkflowNodes || [],
      editableWorkflowNodes: input.editableWorkflowNodes || [],
    },
  });

  if (result.status !== "success" || !result.result) {
    throw new Error(
      result.status === "failed" && result.error
        ? result.error.message
        : "Mastra workflow failed to complete successfully",
    );
  }

  return {
    assistantMessage: result.result.assistantMessage,
    promptGuideOptions: result.result.promptGuideOptions,
    nextStepTitle: result.result.nextStepTitle,
    nextStepDescription: result.result.nextStepDescription,
    nextStepOptions: result.result.nextStepOptions,
    uiLabels: result.result.uiLabels,
    tokenUsage: result.result.tokenUsage,
    plan: result.result.plan,
    operations: result.result.operations,
    snapshot: result.result.snapshot,
    tempNodeIdMap: result.result.tempNodeIdMap,
    createdWorkflowNodeIds: result.result.createdWorkflowNodeIds,
    generationSubmissions: result.result.generationSubmissions,
  };
}

export async function streamCanvasAgentMessageWithMastra(input: {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  executionMode: "ask" | "auto";
  isFirstTextMessage?: boolean;
  skillId?: string | null;
  skillContext?: CanvasAgentResolvedSkillContext | null;
  message: string;
  requestBaseUrl?: string;
  requestCookieHeader?: string;
  contextMessages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  references: Array<{
    assetId: string;
    nodeId?: string;
    label?: string;
    url?: string;
  }>;
  selectedNodeIds?: string[];
  selectedWorkflowNodes?: Array<{
    nodeId: string;
    label: string;
    subtype:
      | "text-to-image"
      | "image-to-image"
      | "text-to-video"
      | "image-to-video";
    prompt?: string;
  }>;
  editableWorkflowNodes?: Array<{
    nodeId: string;
    label: string;
    subtype:
      | "text-to-image"
      | "image-to-image"
      | "text-to-video"
      | "image-to-video";
    prompt?: string;
  }>;
}) {
  const mastra = await getCanvasMastraInstance();
  const workflow = mastra.getWorkflow(
    "canvasChatRequestWorkflow",
  ) as typeof canvasChatRequestWorkflow;

  if (!workflow) {
    throw new Error("canvasChatRequestWorkflow is not registered");
  }

  const run = await (
    workflow as unknown as {
      createRun: (options?: { resourceId?: string }) => Promise<{
        stream: (args: {
          inputData: {
            userId: string;
            projectId: string;
            threadId: string;
            resourceId: string;
            executionMode: "ask" | "auto";
            isFirstTextMessage?: boolean;
            skillId?: string | null;
            skillContext?: CanvasAgentResolvedSkillContext | null;
            message: string;
            requestBaseUrl?: string;
            requestCookieHeader?: string;
            contextMessages?: Array<{
              role: "system" | "user" | "assistant";
              content: string;
            }>;
            references: Array<{
              assetId: string;
              nodeId?: string;
              label?: string;
              url?: string;
            }>;
            selectedNodeIds?: string[];
            selectedWorkflowNodes?: Array<{
              nodeId: string;
              label: string;
              subtype:
                | "text-to-image"
                | "image-to-image"
                | "text-to-video"
                | "image-to-video";
              prompt?: string;
            }>;
            editableWorkflowNodes?: Array<{
              nodeId: string;
              label: string;
              subtype:
                | "text-to-image"
                | "image-to-image"
                | "text-to-video"
                | "image-to-video";
              prompt?: string;
            }>;
          };
        }) => ReadableStream<any> & {
          fullStream: ReadableStream<any>;
          result: Promise<
            | {
                status: "success" | "failed" | "tripwire" | "suspended";
                result?: {
                  assistantMessage: string;
                  promptGuideOptions?: Array<{
                    id: string;
                    title: string;
                    description: string;
                    prompt: string;
                  }>;
                  nextStepTitle?: string;
                  nextStepDescription?: string;
                  nextStepOptions?: Array<{
                    id: string;
                    title: string;
                    description: string;
                    prompt: string;
                  }>;
                  uiLabels?: {
                    groupLabel?: string;
                    promptTextLabel?: string;
                    promptGuideTitle?: string;
                    promptGuideDescription?: string;
                    promptGuideCustomLabel?: string;
                  };
                  tokenUsage: CanvasAgentTokenUsage;
                  mediaIntent: "image" | "video";
                  subtype:
                    | "text-to-image"
                    | "image-to-image"
                    | "text-to-video"
                    | "image-to-video";
                  refinedPrompt: string;
                  promptRefinementReasoning: string;
                  preferredModelUrl: string;
                  sceneRoutingReasoning: string;
                  plan: {
                    executionMode: "ask" | "auto";
                    mediaIntent: "image" | "video";
                    subtype:
                      | "text-to-image"
                      | "image-to-image"
                      | "text-to-video"
                      | "image-to-video";
                    preferredModelUrl?: string;
                  };
                  operations: any[];
                  snapshot: {
                    id: string;
                    version: number;
                    graph: any;
                  } | null;
                  tempNodeIdMap: Record<string, string>;
                  createdWorkflowNodeIds: string[];
                  generationSubmissions: Array<{
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
                  }>;
                };
                error?: Error;
              }
            | undefined
          >;
        };
      }>;
    }
  ).createRun({
    resourceId: input.resourceId,
  });

  const stream = run.stream({
    inputData: {
      projectId: input.projectId,
      userId: input.userId,
      threadId: input.threadId,
      resourceId: input.resourceId,
      executionMode: input.executionMode,
      isFirstTextMessage: input.isFirstTextMessage,
      skillId: input.skillId || null,
      skillContext: input.skillContext || null,
      message: input.message,
      requestBaseUrl: input.requestBaseUrl,
      requestCookieHeader: input.requestCookieHeader,
      contextMessages: input.contextMessages || [],
      references: input.references,
      selectedNodeIds: input.selectedNodeIds || [],
      selectedWorkflowNodes: input.selectedWorkflowNodes || [],
      editableWorkflowNodes: input.editableWorkflowNodes || [],
    },
  });

  return {
    stream,
    fullStream:
      (stream as ReadableStream<any> & { fullStream?: ReadableStream<any> })
        .fullStream || stream,
  };
}
