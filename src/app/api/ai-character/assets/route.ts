import { respData, respErr } from "@/shared/lib/resp";

type AssetIndex = {
  baseProfiles?: Array<{
    id: string;
    title: string;
    prompt: string;
    imageUrl?: string;
  }>;
  summary: {
    completedVariants: number;
    pendingVariants: number;
    failedVariants: number;
  };
  sections: Array<{
    id: string;
    items: Array<{
      baseProfileId?: string;
      variantId: string;
      status: "ready" | "pending" | "failed";
      imageUrl?: string;
      prompt: string;
      error?: string;
    }>;
  }>;
};

let assetIndexCache: AssetIndex | null = null;
let assetIndexPromise: Promise<AssetIndex> | null = null;

async function loadAssetIndex() {
  if (assetIndexCache) {
    return assetIndexCache;
  }

  if (!assetIndexPromise) {
    assetIndexPromise = import("@/shared/lib/ai-girlfriend-assets.json").then(
      (module) => {
        assetIndexCache = module.default as AssetIndex;
        return assetIndexCache;
      },
    );
  }

  return assetIndexPromise;
}

export async function GET(req: Request) {
  try {
    const assetIndex = await loadAssetIndex();
    const { searchParams } = new URL(req.url);
    const includeMeta = searchParams.get("includeMeta") === "1";
    const sectionIds = (searchParams.get("sectionIds") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const sections =
      sectionIds.length > 0
        ? assetIndex.sections.filter((section) => sectionIds.includes(section.id))
        : [];

    return respData({
      ...(includeMeta
        ? {
            meta: {
              baseProfiles: assetIndex.baseProfiles,
              summary: assetIndex.summary,
            },
          }
        : {}),
      sections,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to get ai character assets");
  }
}
