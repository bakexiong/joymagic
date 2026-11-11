export function isCanvasAgentMastraEnabled() {
  const flag = process.env.CANVAS_AGENT_ENABLE_MASTRA;

  if (!flag) return true;

  return !["0", "false", "off", "disabled"].includes(flag.toLowerCase());
}
