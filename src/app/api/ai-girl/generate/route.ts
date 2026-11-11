import { handleWavespeedAPIRequest } from "@/app/api/common-handler";
import { getUuid } from "@/shared/lib/hash";
import { respData, respErr } from "@/shared/lib/resp";
import {
  AI_GIRL_GENERATION_ASPECT_RATIO,
  AI_GIRL_GENERATION_OUTPUT_FORMAT,
  AI_GIRL_GENERATION_RESOLUTION,
  buildAiGirlCharacterSnapshot,
  buildAiGirlImagePrompt,
  defaultAiGirlCharacterDNA,
  diffAiGirlCharacterSnapshot,
  isValidAiGirlCharacterDNA,
  sanitizeAiGirlPerspectiveParams,
  sanitizeAiGirlExtraDescription,
} from "@/shared/lib/ai-character";
import {
  createAICharacter,
  findAICharacterById,
  updateAICharacterById,
} from "@/shared/models/ai_character";
import {
  createAICharacterHistory,
  getNextAICharacterHistoryVersion,
} from "@/shared/models/ai_character_history";
import { createAICharacterPerspective } from "@/shared/models/ai_character_perspective";
import { getUserInfo } from "@/shared/models/user";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return respErr("Invalid request body");
  }

  const dna = isValidAiGirlCharacterDNA(body?.dna)
    ? body.dna
    : defaultAiGirlCharacterDNA;
  const extraDescription = sanitizeAiGirlExtraDescription(
    body?.extraDescription,
  );
  const characterId =
    typeof body?.characterId === "string" ? body.characterId.trim() : "";
  const perspective = sanitizeAiGirlPerspectiveParams(body?.perspective);
  const finalPrompt = buildAiGirlImagePrompt({
    dna,
    extraDescription,
  });

  const generatedRequest = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({
      mediaType: "image",
      prompt: finalPrompt,
      enable_base64_output: false,
      enable_sync_mode: false,
      output_format: AI_GIRL_GENERATION_OUTPUT_FORMAT,
      aspect_ratio: AI_GIRL_GENERATION_ASPECT_RATIO,
      resolution: AI_GIRL_GENERATION_RESOLUTION,
    }),
  });

  const internalResponse = await handleWavespeedAPIRequest(generatedRequest, {
    apiKey: "nano-banana-2-text-to-image",
    scene: "nano-banana-2-text-to-image",
    endpoint: undefined,
    description: "ai girl image generate request",
    validateParams: (requestBody: any) => ({
      valid:
        typeof requestBody?.prompt === "string" &&
        requestBody.prompt.trim().length > 0,
      params: requestBody,
      error: "prompt is required",
    }),
    buildPayload: (requestBody: any) => requestBody,
    buildMetadata: () => ({
      type: "ai-girl-generate",
    }),
    buildTaskData: (_body: any, validatedParams: any) => ({
      mediaType: "image",
      model: "nano-banana-2-text-to-image",
      prompt: validatedParams?.prompt || "",
      options: {
        aspect_ratio: validatedParams?.aspect_ratio,
        resolution: validatedParams?.resolution,
        output_format: validatedParams?.output_format,
      },
    }),
    enablePromptOptimizer: false,
  });

  const result = await internalResponse.json();
  if (!internalResponse.ok || result?.code !== 0) {
    return respErr(
      result?.message || `Generate failed: ${internalResponse.status}`,
    );
  }

  const user = await getUserInfo();
  if (!user?.id) {
    return respErr("Please sign in first");
  }

  const taskData = result?.data || {};
  const outputUrl =
    taskData.output ||
    taskData.outputs?.[0] ||
    taskData.imageUrl ||
    null;
  const providerTaskId =
    typeof taskData.requestId === "string"
      ? taskData.requestId
      : typeof taskData.taskId === "string"
        ? taskData.taskId
        : null;
  const status = outputUrl ? "completed" : "pending";
  const nextSnapshot = buildAiGirlCharacterSnapshot({
    dna,
    extraDescription,
    imageUrl: outputUrl,
    aspectRatio: AI_GIRL_GENERATION_ASPECT_RATIO,
    resolution: AI_GIRL_GENERATION_RESOLUTION,
  });

  let character = null;
  let previousSnapshot = null;
  let version = 1;

  if (characterId) {
    const existingCharacter = await findAICharacterById(characterId);
    if (!existingCharacter || existingCharacter.userId !== user.id) {
      return respErr("Character not found");
    }

    previousSnapshot = buildAiGirlCharacterSnapshot({
      dna: JSON.parse(existingCharacter.dna),
      extraDescription: existingCharacter.extraDescription,
      imageUrl: existingCharacter.imageUrl,
      aspectRatio: existingCharacter.aspectRatio,
      resolution: existingCharacter.resolution,
    });

    version = await getNextAICharacterHistoryVersion(characterId);
    character = await updateAICharacterById(characterId, {
      status,
      dna: JSON.stringify(dna),
      extraDescription: extraDescription || null,
      imageUrl: outputUrl,
      providerTaskId,
      aspectRatio: AI_GIRL_GENERATION_ASPECT_RATIO,
      resolution: AI_GIRL_GENERATION_RESOLUTION,
      currentVersion: version,
      errorMessage: null,
      completedAt: outputUrl ? new Date() : null,
    });
  } else {
    const newCharacterId = getUuid();
    character = await createAICharacter({
      id: newCharacterId,
      userId: user.id,
      status,
      dna: JSON.stringify(dna),
      extraDescription: extraDescription || null,
      imageUrl: outputUrl,
      providerTaskId,
      aspectRatio: AI_GIRL_GENERATION_ASPECT_RATIO,
      resolution: AI_GIRL_GENERATION_RESOLUTION,
      currentVersion: version,
      completedAt: outputUrl ? new Date() : null,
    });
  }

  if (!character) {
    return respErr("Failed to save character");
  }

  await createAICharacterHistory({
    id: getUuid(),
    characterId: character.id,
    userId: user.id,
    version,
    action: previousSnapshot ? "update" : "create",
    snapshot: JSON.stringify(nextSnapshot),
    changes: JSON.stringify(
      diffAiGirlCharacterSnapshot(previousSnapshot, nextSnapshot),
    ),
    rollbackFromVersion: null,
  });

  let perspectiveRecord = null;
  if (perspective) {
    perspectiveRecord = await createAICharacterPerspective({
      id: getUuid(),
      characterId: character.id,
      userId: user.id,
      status,
      imageUrl: outputUrl,
      providerTaskId,
      horizontalAngle: Math.round(perspective.horizontalAngle),
      verticalAngle: Math.round(perspective.verticalAngle),
      distance: perspective.distance,
      errorMessage: null,
      completedAt: outputUrl ? new Date() : null,
    });
  }

  return respData({
    requestId: providerTaskId || character.id,
    taskId: providerTaskId || character.id,
    characterId: character.id,
    perspectiveId: perspectiveRecord?.id || null,
    status,
    imageUrl: outputUrl,
  });
}
