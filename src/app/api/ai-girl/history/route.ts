import { respData, respErr } from "@/shared/lib/resp";
import { getUserInfo } from "@/shared/models/user";
import { getAICharacterHistories } from "@/shared/models/ai_character_history";

export async function GET(req: Request) {
  const user = await getUserInfo();
  if (!user?.id) {
    return respErr("Please sign in first");
  }

  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get("characterId");

  if (!characterId) {
    return respErr("characterId is required");
  }

  const histories = await getAICharacterHistories(characterId, user.id);
  return respData(histories);
}
