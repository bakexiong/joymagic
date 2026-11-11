import { Agent } from "@mastra/core/agent";

import { getCanvasAgentMemory } from "../memory/canvas-agent-memory";
import { CANVAS_AGENT_OPENROUTER_MODEL_ID } from "../openrouter/canvas-openrouter";
import { canvasAssetTools } from "../tools/canvas-asset-tools";
import { canvasGenerationTools } from "../tools/canvas-generation-tools";
import { canvasReadTools } from "../tools/canvas-read-tools";
import { canvasWriteTools } from "../tools/canvas-write-tools";
import { createCanvasAgentWorkspace } from "../workspace/canvas-agent-workspace";

function createStudioAgent(input: {
  id: string;
  name: string;
  description: string;
  instructions: string;
  tools: Record<string, unknown>;
}) {
  return new Agent({
    id: input.id,
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    model: CANVAS_AGENT_OPENROUTER_MODEL_ID,
    tools: input.tools as any,
    memory: getCanvasAgentMemory(),
    workspace: createCanvasAgentWorkspace(),
  });
}

export const studioCanvasAgents = {
  canvasSupervisorAgent: createStudioAgent({
    id: "canvas-supervisor-agent",
    name: "canvas-supervisor-agent",
    description: "Studio registration for the high-level Canvas orchestration agent.",
    instructions: `
You are the server-side orchestration agent for Create Canvas.

Responsibilities:
- understand the user's creative request
- decide media intent and workflow subtype
- coordinate canvas tools when needed
- produce a concise user-facing response
    `.trim(),
    tools: {
      ...canvasReadTools,
      ...canvasAssetTools,
      ...canvasWriteTools,
      ...canvasGenerationTools,
    },
  }),
  intentPlannerAgent: createStudioAgent({
    id: "intent-planner-agent",
    name: "intent-planner-agent",
    description: "Studio registration for the Canvas intent planning agent.",
    instructions: `
You are the intent planning agent for Create Canvas.

Responsibilities:
- determine image or video intent
- determine text-based or reference-based workflow subtype
- decide whether clarification is needed before generation
    `.trim(),
    tools: {
      ...canvasReadTools,
      ...canvasAssetTools,
    },
  }),
  promptRefinerAgent: createStudioAgent({
    id: "prompt-refiner-agent",
    name: "prompt-refiner-agent",
    description: "Studio registration for the Canvas prompt refinement agent.",
    instructions: `
You are the prompt refinement agent for Create Canvas.

Responsibilities:
- preserve the user's original creative goal
- rewrite the request into a clearer execution prompt
- use references only as supporting context
    `.trim(),
    tools: {
      ...canvasReadTools,
      ...canvasAssetTools,
    },
  }),
  responseComposerAgent: createStudioAgent({
    id: "response-composer-agent",
    name: "response-composer-agent",
    description: "Studio registration for the Canvas response composition agent.",
    instructions: `
You are the response composition agent for Create Canvas.

Responsibilities:
- produce short user-visible guidance
- ask for clarification when the request is underspecified
- keep the reply aligned with the chosen workflow
    `.trim(),
    tools: {
      ...canvasReadTools,
      ...canvasAssetTools,
    },
  }),
  sceneRouterAgent: createStudioAgent({
    id: "scene-router-agent",
    name: "scene-router-agent",
    description: "Studio registration for the Canvas scene routing agent.",
    instructions: `
You are the scene routing agent for Create Canvas.

Responsibilities:
- select the preferred default model route for the chosen workflow subtype
- keep routing decisions within the allowed model list
    `.trim(),
    tools: {
      ...canvasReadTools,
      ...canvasAssetTools,
    },
  }),
} as const;
