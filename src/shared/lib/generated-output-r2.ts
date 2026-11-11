import { enqueueR2UploadTask } from "@/shared/models/r2-upload-task";

type PersistGeneratedOutputsToR2Input = {
  taskDbId?: string | null;
  userId?: string | null;
  outputUrls: string[];
  workbenchCreationRecords?: Array<{
    url: string;
    creationRecordId: string;
  }>;
  sceneId?: string | null;
  providerName?: string | null;
  providerLabel?: string | null;
  prompt?: string | null;
  generationParams?: Record<string, any> | null;
  aspectRatio?: string | null;
};

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export async function persistGeneratedOutputsToR2(
  input: PersistGeneratedOutputsToR2Input,
) {
  const sourceUrls = input.outputUrls.filter(
    (url): url is string =>
      typeof url === "string" && url.trim().length > 0 && isHttpUrl(url),
  );

  if (sourceUrls.length === 0) {
    console.warn("[generated-output-r2] skip enqueue empty output urls", {
      sceneId: input.sceneId,
      taskDbId: input.taskDbId,
    });
    return;
  }

  try {
    const creationIdByUrl = new Map(
      (input.workbenchCreationRecords || []).map((item) => [
        item.url,
        item.creationRecordId,
      ]),
    );
    const payload = {
      sceneId: input.sceneId || null,
      providerName: input.providerName || null,
      providerLabel: input.providerLabel || null,
      prompt: input.prompt || null,
      generationParams: input.generationParams || null,
      aspectRatio: input.aspectRatio || null,
    };
    const tasks = await Promise.all(
      sourceUrls.map((sourceUrl) =>
        enqueueR2UploadTask({
          aiTaskId: input.taskDbId || null,
          userId: input.userId || null,
          sourceUrl,
          workbenchCreationId: creationIdByUrl.get(sourceUrl) || null,
          payload,
        }),
      ),
    );

    console.log("[generated-output-r2] enqueued R2 upload task", {
      r2UploadTaskIds: tasks.map((task) => task?.id).filter(Boolean),
      taskDbId: input.taskDbId,
      sceneId: input.sceneId,
      outputCount: sourceUrls.length,
      workbenchCreationIds: sourceUrls.map(
        (sourceUrl) => creationIdByUrl.get(sourceUrl) || null,
      ),
    });
  } catch (error) {
    console.error("[generated-output-r2] enqueue R2 upload task failed", {
      sceneId: input.sceneId,
      taskDbId: input.taskDbId,
      error,
    });
  }
}
