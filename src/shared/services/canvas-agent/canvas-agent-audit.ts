export type CanvasAgentAuditStatus = "success" | "error";

export function auditCanvasAgentToolCall(input: {
  toolName: string;
  userId: string;
  projectId: string;
  threadId?: string;
  status: CanvasAgentAuditStatus;
  metadata?: Record<string, unknown>;
}) {
  console.info("[canvas-agent][tool]", {
    toolName: input.toolName,
    userId: input.userId,
    projectId: input.projectId,
    threadId: input.threadId || null,
    status: input.status,
    metadata: input.metadata || {},
    at: new Date().toISOString(),
  });
}
