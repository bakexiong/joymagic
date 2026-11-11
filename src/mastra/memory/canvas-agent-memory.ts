import { MockMemory } from "@mastra/core/memory";
import { InMemoryStore } from "@mastra/core/storage";

let canvasAgentMemory: MockMemory | null = null;

export function getCanvasAgentMemory() {
  if (!canvasAgentMemory) {
    const storage = new InMemoryStore();

    canvasAgentMemory = new MockMemory({
      storage,
      enableMessageHistory: true,
      enableWorkingMemory: false,
    });
  }

  return canvasAgentMemory;
}
