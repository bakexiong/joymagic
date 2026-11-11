import { submitSceneGeneration } from "@/server/ai-generation/generation-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ scene: string }> },
) {
  const { scene } = await params;
  return submitSceneGeneration(req, scene);
}
