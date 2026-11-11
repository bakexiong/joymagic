import fs from "node:fs/promises";
import path from "node:path";

const REQUESTS_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/ai-girlfriend-prompt-requests.json",
);
const RESULTS_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/ai-girlfriend-generation-results.json",
);
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/ai-girlfriend-assets.json",
);

type RequestPayload = {
  promptId: string;
  baseProfileId: string;
  sectionId: string;
  variantId: string;
  body: {
    prompt: string;
  };
};

type RequestFile = {
  generatedAt: string;
  baseProfiles?: Array<{
    id: string;
    title: string;
    prompt: string;
  }>;
  baseProfileId: string;
  basePrompt: string;
  requests: RequestPayload[];
};

type ResultRecord = {
  promptId: string;
  baseProfileId: string;
  sectionId: string;
  variantId: string;
  prompt: string;
  inputImageUrl: string;
  outputImageUrl?: string;
  status: "pending" | "completed" | "failed" | "skipped";
  error?: string;
  updatedAt: string;
};

type ResultsFile = {
  generatedAt: string;
  baseProfileId: string;
  baseImageUrl?: string;
  baseImageUrls?: Record<string, string>;
  records: ResultRecord[];
};

type AssetIndexFile = {
  generatedAt: string;
  baseProfileId: string;
  basePrompt: string;
  baseImageUrl?: string;
  baseProfiles?: Array<{
    id: string;
    title: string;
    prompt: string;
    imageUrl?: string;
  }>;
  summary: {
    totalVariants: number;
    completedVariants: number;
    pendingVariants: number;
    failedVariants: number;
  };
  sections: Array<{
    id: string;
    items: Array<{
      promptId: string;
      baseProfileId: string;
      variantId: string;
      status: "ready" | "pending" | "failed";
      imageUrl?: string;
      prompt: string;
      error?: string;
    }>;
  }>;
};

async function loadResults() {
  try {
    const raw = await fs.readFile(RESULTS_PATH, "utf8");
    return JSON.parse(raw) as ResultsFile;
  } catch {
    return undefined;
  }
}

async function main() {
  const rawRequests = await fs.readFile(REQUESTS_PATH, "utf8");
  const requestFile = JSON.parse(rawRequests) as RequestFile;
  const results = await loadResults();

  const resultMap = new Map(
    (results?.records ?? []).map((record) => [record.promptId, record]),
  );
  const records = results?.records ?? [];

  const sectionMap = new Map<
    string,
    AssetIndexFile["sections"][number]["items"]
  >();

  let completedVariants = 0;
  let pendingVariants = 0;
  let failedVariants = 0;

  for (const request of requestFile.requests) {
    const record = resultMap.get(request.promptId);

    let status: "ready" | "pending" | "failed" = "pending";
    if (
      (record?.status === "completed" || record?.status === "skipped") &&
      record.outputImageUrl
    ) {
      status = "ready";
      completedVariants += 1;
    } else if (record?.status === "failed") {
      status = "failed";
      failedVariants += 1;
    } else {
      pendingVariants += 1;
    }

    const items = sectionMap.get(request.sectionId) ?? [];
    items.push({
      promptId: request.promptId,
      baseProfileId: request.baseProfileId,
      variantId: request.variantId,
      status,
      imageUrl: record?.outputImageUrl,
      prompt: request.body.prompt,
      error: record?.error,
    });
    sectionMap.set(request.sectionId, items);
  }

  const output: AssetIndexFile = {
    generatedAt: new Date().toISOString(),
    baseProfileId: requestFile.baseProfileId,
    basePrompt: requestFile.basePrompt,
    baseImageUrl:
      results?.baseImageUrls?.[requestFile.baseProfileId] ?? results?.baseImageUrl,
    baseProfiles: requestFile.baseProfiles?.map((profile) => ({
      id: profile.id,
      title: profile.title,
      prompt: profile.prompt,
      imageUrl:
        records.find(
          (record) =>
            record.baseProfileId === profile.id &&
            record.sectionId === "ethnicity" &&
            record.variantId === profile.id &&
            record.outputImageUrl,
        )?.outputImageUrl ??
        results?.baseImageUrls?.[profile.id] ??
        (profile.id === results?.baseProfileId ? results?.baseImageUrl : undefined),
    })),
    summary: {
      totalVariants: requestFile.requests.length,
      completedVariants,
      pendingVariants,
      failedVariants,
    },
    sections: [...sectionMap.entries()].map(([id, items]) => ({
      id,
      items,
    })),
  };

  await fs.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `已生成素材索引 ${path.relative(process.cwd(), OUTPUT_PATH)}，completed=${completedVariants}, pending=${pendingVariants}, failed=${failedVariants}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
