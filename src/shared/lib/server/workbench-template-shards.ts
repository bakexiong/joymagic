import fs from "node:fs/promises";
import path from "node:path";

const SHARD_DIR = path.resolve(
  process.cwd(),
  "src/shared/lib/workbench-template-samples",
);

export function modelUrlToShardFileName(modelUrl: string) {
  return (
    modelUrl
      .replace(/^\/+/, "")
      .replace(/\/+/g, "__")
      .replace(/[^a-zA-Z0-9_-]/g, "_") + ".json"
  );
}

export async function readWorkbenchTemplateShard(modelUrl: string) {
  const shardPath = path.join(SHARD_DIR, modelUrlToShardFileName(modelUrl));
  const content = await fs.readFile(shardPath, "utf8");
  return JSON.parse(content) as unknown[];
}

export async function writeWorkbenchTemplateShards(
  payload: Record<string, unknown[]>,
) {
  await fs.mkdir(SHARD_DIR, { recursive: true });

  await Promise.all(
    Object.entries(payload).map(async ([modelUrl, items]) => {
      const shardPath = path.join(SHARD_DIR, modelUrlToShardFileName(modelUrl));
      await fs.writeFile(shardPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
    }),
  );
}
