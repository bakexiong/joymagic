import { refundWavespeedCredits } from "@/app/api/utils";
import { aiTask } from "@/config/db/schema";
import {
  findProviderForScenario,
  getProviderConfigAsync,
  getStatusQueryConfig,
  getWebhookConfig,
} from "@/config/pricing-config";
import { db } from "@/core/db";
import { AITaskStatus } from "@/extensions/ai";
import {
  extractError,
  extractOutputs,
  extractRequestId,
  extractStatus,
  isFailureStatus,
  isSuccessStatus,
  normalizeOutputUrls,
  parseTaskOptions,
} from "@/server/ai-generation/result-mapping";
import { persistSuccessfulOutputsToCreations } from "@/server/ai-generation/workbench-output";
import { respData, respErr } from "@/shared/lib/resp";
import { persistGeneratedOutputsToR2 } from "@/shared/lib/generated-output-r2";
import { updateAITaskById } from "@/shared/models/ai_task";
import { getAllConfigsDirectly } from "@/shared/models/config";
import { findUserById } from "@/shared/models/user";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function refundFailedTask(
  task: typeof aiTask.$inferSelect,
  reason: string,
) {
  const parsedOptions = parseTaskOptions(task.options);
  const refundableCredits = Number(
    parsedOptions?.__billing?.refundableCredits ?? task.costCredits ?? 0,
  );

  if (!Number.isFinite(refundableCredits) || refundableCredits <= 0) {
    return;
  }

  const taskUser = await findUserById(task.userId);
  if (!taskUser?.email) {
    return;
  }

  await refundWavespeedCredits({
    userId: taskUser.id,
    userEmail: taskUser.email,
    freeUsed: false,
    refundCredits: refundableCredits,
    description: `Refund for failed webhook callback task ${task.taskId || task.id}: ${reason}`,
  });
}

async function readWebhookRequest(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  const rawBody = await req.text();

  if (!rawBody.trim()) {
    return {
      rawBody,
      payload: {},
      contentType,
    };
  }

  try {
    return {
      rawBody,
      payload: JSON.parse(rawBody),
      contentType,
    };
  } catch {
    return {
      rawBody,
      payload: { raw: rawBody },
      contentType,
    };
  }
}

function isWavespeedProvider(provider: string, providerConfig: any) {
  return (
    provider.toLowerCase().includes("wavespeed") ||
    String(providerConfig?.name || "")
      .toLowerCase()
      .includes("wavespeed") ||
    String(providerConfig?.baseUrl || "").includes("api.wavespeed.ai")
  );
}

function verifyWaveSpeedSignature(params: {
  rawBody: string;
  headers: Headers;
  secret: string;
  maxAgeSeconds?: number;
}) {
  const webhookId = params.headers.get("webhook-id");
  const timestamp = params.headers.get("webhook-timestamp");
  const signatureHeader = params.headers.get("webhook-signature");

  if (!webhookId || !timestamp || !signatureHeader) {
    throw new Error("Missing WaveSpeed webhook signature headers");
  }

  const [version, receivedSignature] = signatureHeader.split(",");
  if (version !== "v3" || !receivedSignature) {
    throw new Error("Invalid WaveSpeed webhook signature header format");
  }

  const signedContent = `${webhookId}.${timestamp}.${params.rawBody}`;
  const secretWithoutPrefix = params.secret.startsWith("whsec_")
    ? params.secret.slice(6)
    : params.secret;
  const expectedSignature = crypto
    .createHmac("sha256", secretWithoutPrefix)
    .update(signedContent)
    .digest("hex");

  const ageSeconds = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (!Number.isFinite(ageSeconds)) {
    throw new Error("Invalid WaveSpeed webhook timestamp");
  }

  if (ageSeconds > (params.maxAgeSeconds ?? 300)) {
    throw new Error("WaveSpeed webhook signature timestamp too old");
  }

  if (
    receivedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature),
    )
  ) {
    throw new Error("Invalid WaveSpeed webhook signature");
  }

  return true;
}

export async function handleGenerationNotify(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: routeProvider } = await params;
    const { rawBody, payload, contentType } = await readWebhookRequest(req);
    const { searchParams } = new URL(req.url);
    const requestIdFromPayload =
      searchParams.get("taskId") ||
      searchParams.get("requestId") ||
      extractRequestId(payload);
    const [taskByPayloadId] = requestIdFromPayload
      ? await db()
          .select()
          .from(aiTask)
          .where(eq(aiTask.taskId, requestIdFromPayload))
          .limit(1)
      : [null];
    const scenario =
      searchParams.get("scene") ||
      payload?.scene ||
      taskByPayloadId?.scene ||
      "";
    const resolvedProvider =
      taskByPayloadId?.provider ||
      (scenario ? await findProviderForScenario(scenario) : null) ||
      routeProvider;

    console.log("[AI Notify] webhook received", {
      routeProvider,
      provider: resolvedProvider,
      scenario,
      url: req.url,
      contentType,
      topLevelKeys:
        payload && typeof payload === "object" ? Object.keys(payload) : [],
      payloadPreview: (() => {
        try {
          const text = JSON.stringify(payload);
          return text.length > 1000
            ? `${text.slice(0, 1000)}...<truncated>`
            : text;
        } catch {
          return String(payload);
        }
      })(),
    });

    const providerConfig = await getProviderConfigAsync(resolvedProvider);
    if (!providerConfig) {
      console.warn("[AI Notify] provider config not found", {
        routeProvider,
        provider: resolvedProvider,
        scenario,
      });
      return respErr(`Provider "${resolvedProvider}" not found`);
    }

    if (isWavespeedProvider(resolvedProvider, providerConfig)) {
      const runtimeConfigs = await getAllConfigsDirectly();
      const webhookSecret = String(
        runtimeConfigs.wavespeed_webhook_secret || "",
      ).trim();

      if (webhookSecret) {
        try {
          verifyWaveSpeedSignature({
            rawBody,
            headers: req.headers,
            secret: webhookSecret,
          });
          console.log("[AI Notify] WaveSpeed webhook signature verified", {
            routeProvider,
            provider: resolvedProvider,
            scenario,
            webhookId: req.headers.get("webhook-id"),
            webhookTimestamp: req.headers.get("webhook-timestamp"),
          });
        } catch (error: any) {
          console.warn(
            "[AI Notify] WaveSpeed webhook signature verification failed",
            {
              routeProvider,
              provider: resolvedProvider,
              scenario,
              message: error?.message || String(error),
              webhookId: req.headers.get("webhook-id"),
              webhookTimestamp: req.headers.get("webhook-timestamp"),
              hasSignature: Boolean(req.headers.get("webhook-signature")),
            },
          );
          return respErr(error?.message || "Invalid webhook signature");
        }
      } else {
        console.warn(
          "[AI Notify] WaveSpeed webhook secret not configured, skipping signature verification",
          {
            routeProvider,
            provider: resolvedProvider,
            scenario,
          },
        );
      }
    }

    const webhookConfig = scenario
      ? await getWebhookConfig(resolvedProvider, scenario)
      : providerConfig.webhookConfig || null;
    const statusConfig = scenario
      ? await getStatusQueryConfig(resolvedProvider, scenario, undefined)
      : null;
    const responseMapping =
      webhookConfig?.responseMapping ||
      statusConfig?.responseMapping ||
      providerConfig.statusQueryResponseMapping ||
      providerConfig.responseMapping;

    const requestId =
      requestIdFromPayload || extractRequestId(payload, responseMapping);

    console.log("[AI Notify] payload resolved", {
      routeProvider,
      provider: resolvedProvider,
      scenario,
      requestId,
      hasResponseMapping: Boolean(responseMapping),
      responseMapping,
    });

    if (!requestId) {
      console.warn("[AI Notify] requestId missing in webhook payload", {
        routeProvider,
        provider: resolvedProvider,
        scenario,
        payload,
      });
      return respErr("taskId or requestId is required in webhook payload");
    }

    const task =
      taskByPayloadId && taskByPayloadId.taskId === requestId
        ? taskByPayloadId
        : (
            await db()
              .select()
              .from(aiTask)
              .where(eq(aiTask.taskId, requestId))
              .limit(1)
          )[0];

    if (!task) {
      console.warn("[AI Notify] task not found", {
        routeProvider,
        provider: resolvedProvider,
        scenario,
        requestId,
      });
      return respErr(`Task not found for requestId: ${requestId}`);
    }

    const resolvedStatus = String(
      extractStatus(payload, responseMapping) || "processing",
    );
    const { output, outputs } = extractOutputs(payload, responseMapping);
    const errorMessage = extractError(payload, responseMapping);

    console.log("[AI Notify] task matched", {
      routeProvider,
      provider: resolvedProvider,
      scenario,
      requestId,
      dbTaskId: task.id,
      taskStatus: task.status,
      resolvedStatus,
      outputCount: outputs?.length || (output ? 1 : 0),
      output: output || outputs?.[0] || null,
      errorMessage: errorMessage || null,
    });

    if (
      task.status !== AITaskStatus.PENDING &&
      task.status !== AITaskStatus.PROCESSING
    ) {
      console.log("[AI Notify] task already terminal, skip webhook update", {
        routeProvider,
        provider: resolvedProvider,
        scenario,
        requestId,
        dbTaskId: task.id,
        taskStatus: task.status,
      });

      return respData({
        ok: true,
        requestId,
        status: task.status,
        skipped: true,
      });
    }

    if (isFailureStatus(resolvedStatus, responseMapping)) {
      console.log("[AI Notify] marking task failed", {
        routeProvider,
        provider: resolvedProvider,
        scenario,
        requestId,
        dbTaskId: task.id,
        errorMessage: errorMessage || resolvedStatus,
      });
      await refundFailedTask(task, String(errorMessage || resolvedStatus));
      await updateAITaskById(task.id, {
        status: AITaskStatus.FAILED,
        taskInfo: JSON.stringify(payload),
        taskResult: JSON.stringify({
          error: errorMessage || "Task failed",
          status: resolvedStatus,
        }),
      });

      console.log("[AI Notify] task marked failed", {
        routeProvider,
        provider: resolvedProvider,
        scenario,
        requestId,
        dbTaskId: task.id,
      });

      return respData({
        ok: true,
        requestId,
        status: resolvedStatus,
      });
    }

    if (isSuccessStatus(resolvedStatus, responseMapping)) {
      const outputUrls = normalizeOutputUrls(outputs, output);
      console.log("[AI Notify] marking task success", {
        routeProvider,
        provider: resolvedProvider,
        scenario,
        requestId,
        dbTaskId: task.id,
        outputCount: outputs?.length || (output ? 1 : 0),
      });
      await updateAITaskById(task.id, {
        status: AITaskStatus.SUCCESS,
        taskInfo: JSON.stringify(payload),
        taskResult: JSON.stringify({
          output: output || outputs?.[0] || null,
          outputs: outputUrls,
        }),
      });

      if (outputUrls.length > 0) {
        const generationParams = parseTaskOptions(task.options);
        const creationRecords = await persistSuccessfulOutputsToCreations({
          userId: task.userId,
          outputUrls,
          sceneId: task.scene || scenario,
          providerName: task.provider || resolvedProvider,
          providerLabel: task.provider || resolvedProvider,
          prompt: task.prompt || null,
          generationParams,
          aspectRatio:
            typeof generationParams?.aspectRatio === "string"
              ? generationParams.aspectRatio
              : null,
        });

        void persistGeneratedOutputsToR2({
          taskDbId: task.id,
          userId: task.userId,
          outputUrls,
          workbenchCreationRecords: creationRecords,
          sceneId: task.scene || scenario,
          providerName: task.provider || resolvedProvider,
          providerLabel: task.provider || resolvedProvider,
          prompt: task.prompt || null,
          generationParams,
        }).catch((error) => {
          console.error("[AI Notify] persist R2 outputs failed", {
            taskDbId: task.id,
            sceneId: task.scene || scenario,
            error,
          });
        });
      }

      console.log("[AI Notify] task marked success", {
        routeProvider,
        provider: resolvedProvider,
        scenario,
        requestId,
        dbTaskId: task.id,
      });

      return respData({
        ok: true,
        requestId,
        status: resolvedStatus,
      });
    }

    await updateAITaskById(task.id, {
      status:
        resolvedStatus === "pending" || resolvedStatus === "queued"
          ? AITaskStatus.PENDING
          : AITaskStatus.PROCESSING,
      taskInfo: JSON.stringify(payload),
    });

    console.log("[AI Notify] task marked non-terminal", {
      routeProvider,
      provider: resolvedProvider,
      scenario,
      requestId,
      dbTaskId: task.id,
      resolvedStatus,
    });

    return respData({
      ok: true,
      requestId,
      status: resolvedStatus,
    });
  } catch (error: any) {
    console.error("[AI Notify] webhook callback failed:", {
      message: error?.message || String(error),
      stack: error?.stack,
      error,
    });
    return respErr(error?.message || "Webhook callback failed");
  }
}
