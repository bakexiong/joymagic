import { handleGenerationNotify } from "@/server/ai-generation/notify-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  return handleGenerationNotify(req, { params });
}
