import { MastraEditor } from "@mastra/editor";

export function createCanvasMastraEditor() {
  return new MastraEditor();
}

export const CANVAS_EDITOR_RUNTIME_BOUNDARY = {
  purpose:
    "为 Canvas Agent 提供可版本化的 Agent / Prompt / Skill / MCP 编辑能力。",
  guarantees: [
    "代码仍然是 supervisor、planner、router 等 Agent 的基线真相源",
    "Editor 仅用于运行时 override、版本发布和后续实验调优",
    "当前接入不暴露第三方集成 tool provider，也不在前端直接暴露任何密钥",
  ],
};
