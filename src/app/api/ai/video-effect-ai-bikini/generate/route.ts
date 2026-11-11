import { handleWavespeedAPIRequest } from "@/app/api/common-handler";
import { respErr } from "@/shared/lib/resp";
import { isCreemReviewMode } from "@/shared/lib/creem-review";

const AI_BIKINI_SCENE = "video-effect-ai-bikini";
const AI_BIKINI_PROVIDER_SCENE = "image-to-video-wan-2-7";
const AI_BIKINI_PROMPT = "change the clothes to bikini";

export async function POST(req: Request) {
  if (isCreemReviewMode()) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const imageUrls = Array.isArray(body?.image_urls)
      ? body.image_urls
          .map((image: unknown) =>
            typeof image === "string" ? image.trim() : "",
          )
          .filter(Boolean)
      : [];

    if (imageUrls.length === 0) {
      return respErr("image_urls is required");
    }

    const generatedRequest = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({
        mediaType: "video",
        image_with_roles: [
          {
            url: imageUrls[0],
            role: "first_frame",
          },
        ],
        prompt: AI_BIKINI_PROMPT,
        resolution: "720p",
        duration: 5,
        enable_prompt_expansion: false,
        seed: -1,
      }),
    });

    return handleWavespeedAPIRequest(generatedRequest, {
      apiKey: AI_BIKINI_PROVIDER_SCENE,
      scene: AI_BIKINI_SCENE,
      endpoint: undefined,
      description: "AI Bikini generate request",
      validateParams: (requestBody: any) => ({
        valid:
          Array.isArray(requestBody?.image_with_roles) &&
          requestBody.image_with_roles.length > 0 &&
          typeof requestBody.image_with_roles[0]?.url === "string" &&
          requestBody.image_with_roles[0].url.trim().length > 0 &&
          typeof requestBody?.prompt === "string" &&
          requestBody.prompt.trim().length > 0,
        params: requestBody,
        error: "image_with_roles and prompt are required",
      }),
      buildPayload: (requestBody: any) => requestBody,
      buildMetadata: () => ({
        type: "video-effect-ai-bikini",
      }),
      buildTaskData: (_body: any, validatedParams: any) => ({
        mediaType: "video",
        model: AI_BIKINI_PROVIDER_SCENE,
        prompt: validatedParams?.prompt || "",
        options: {
          image_with_roles: validatedParams?.image_with_roles,
          resolution: validatedParams?.resolution,
          duration: validatedParams?.duration,
          enable_prompt_expansion: validatedParams?.enable_prompt_expansion,
          seed: validatedParams?.seed,
          effectSlug: "ai-bikini",
        },
      }),
      enablePromptOptimizer: false,
    });
  } catch (e: any) {
    console.error("ai bikini generate failed", e);
    return respErr(e.message || "ai bikini generate failed");
  }
}
