import { NextResponse } from "next/server";

import { readWorkbenchTemplateShard } from "@/shared/lib/server/workbench-template-shards";
import { getDefaultTemplateSourceModelUrlForScene } from "@/shared/lib/workbench-template-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelUrl = searchParams.get("modelUrl")?.trim();
  const scenePath = searchParams.get("scenePath")?.trim();
  const resolvedModelUrl =
    modelUrl ||
    getDefaultTemplateSourceModelUrlForScene(scenePath || undefined);

  if (!resolvedModelUrl) {
    return NextResponse.json(
      { error: "Missing modelUrl or scenePath query parameter." },
      { status: 400 },
    );
  }

  try {
    const items = await readWorkbenchTemplateShard(resolvedModelUrl);
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { items: [] },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
