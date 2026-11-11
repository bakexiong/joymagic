import { getUuid } from "@/shared/lib/hash";
import {
  buildAiGirlCharacterSnapshot,
  diffAiGirlCharacterSnapshot,
  isValidAiGirlCharacterDNA,
  type AiGirlCharacterSnapshot,
} from "@/shared/lib/ai-character";
import { respData, respErr } from "@/shared/lib/resp";
import {
  findAICharacterById,
  updateAICharacterById,
} from "@/shared/models/ai_character";
import {
  createAICharacterHistory,
  findAICharacterHistoryByVersion,
  getNextAICharacterHistoryVersion,
} from "@/shared/models/ai_character_history";
import { getUserInfo } from "@/shared/models/user";

export async function POST(req: Request) {
  const user = await getUserInfo();
  if (!user?.id) {
    return respErr("Please sign in first");
  }

  const body = await req.json().catch(() => ({}));
  const characterId =
    typeof body?.characterId === "string" ? body.characterId.trim() : "";
  const version =
    typeof body?.version === "number" ? body.version : Number(body?.version);

  if (!characterId) {
    return respErr("characterId is required");
  }

  if (!Number.isInteger(version) || version <= 0) {
    return respErr("version is required");
  }

  const character = await findAICharacterById(characterId);
  if (!character || character.userId !== user.id) {
    return respErr("Character not found");
  }

  const targetHistory = await findAICharacterHistoryByVersion(
    characterId,
    user.id,
    version,
  );
  if (!targetHistory) {
    return respErr("History version not found");
  }

  const targetSnapshot = JSON.parse(
    targetHistory.snapshot,
  ) as AiGirlCharacterSnapshot;
  if (!isValidAiGirlCharacterDNA(targetSnapshot?.dna)) {
    return respErr("Invalid history snapshot");
  }

  const previousSnapshot = buildAiGirlCharacterSnapshot({
    dna: JSON.parse(character.dna),
    extraDescription: character.extraDescription,
    imageUrl: character.imageUrl,
    aspectRatio: character.aspectRatio,
    resolution: character.resolution,
  });

  const nextVersion = await getNextAICharacterHistoryVersion(characterId);

  const updatedCharacter = await updateAICharacterById(characterId, {
    dna: JSON.stringify(targetSnapshot.dna),
    extraDescription: targetSnapshot.extraDescription,
    imageUrl: targetSnapshot.imageUrl || null,
    aspectRatio: targetSnapshot.aspectRatio,
    resolution: targetSnapshot.resolution,
    status: targetSnapshot.imageUrl ? "completed" : "pending",
    errorMessage: null,
    providerTaskId: null,
    currentVersion: nextVersion,
    completedAt: targetSnapshot.imageUrl ? new Date() : null,
  });

  if (!updatedCharacter) {
    return respErr("Failed to rollback character");
  }

  await createAICharacterHistory({
    id: getUuid(),
    characterId,
    userId: user.id,
    version: nextVersion,
    action: "rollback",
    snapshot: JSON.stringify(targetSnapshot),
    changes: JSON.stringify(
      diffAiGirlCharacterSnapshot(previousSnapshot, targetSnapshot),
    ),
    rollbackFromVersion: version,
  });

  return respData({
    character: updatedCharacter,
    snapshot: targetSnapshot,
    version: nextVersion,
  });
}
