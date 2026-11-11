import { RequestContext } from "@mastra/core/request-context";

export type CanvasAgentRequestContextValues = {
  userId: string;
  projectId: string;
  threadId: string;
  resourceId: string;
  selectedNodeIds?: string[];
  requestBaseUrl?: string;
  requestCookieHeader?: string;
};

export function createCanvasAgentRequestContext(
  values: CanvasAgentRequestContextValues,
) {
  return new RequestContext<CanvasAgentRequestContextValues>([
    ["userId", values.userId],
    ["projectId", values.projectId],
    ["threadId", values.threadId],
    ["resourceId", values.resourceId],
    ["selectedNodeIds", values.selectedNodeIds || []],
    ["requestBaseUrl", values.requestBaseUrl || ""],
    ["requestCookieHeader", values.requestCookieHeader || ""],
  ]);
}
