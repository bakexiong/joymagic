import { getGenerationStatus } from "@/server/ai-generation/status-service";

export async function GET(req: Request) {
  return getGenerationStatus(req);
}
