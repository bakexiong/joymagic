import { handleWavespeedAPIRequest } from "@/app/api/common-handler";
import { respErr } from "@/shared/lib/resp";

const VARIATIONS_PROMPT = [
  "Use the uploaded image as the only subject and identity reference.",
  "Create a premium multi-angle variation sheet of the same subject.",
  "Preserve identity, facial structure, body shape, hairstyle, outfit, materials, colors, logos, and the overall scene context.",
  "Show four clearly distinct viewpoints: front three-quarter, left profile, right profile, and back three-quarter.",
  "Keep lighting direction, lens feel, realism, and styling consistent with the source image.",
  "Do not add or remove accessories, text, props, or branding.",
  "Arrange the result as a polished 2x2 collage with balanced spacing, one angle per panel.",
  "High detail, coherent anatomy, accurate textures, no text, no watermark.",
].join(" ");

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const image = typeof body?.image === "string" ? body.image.trim() : "";
    const aspectRatio =
      typeof body?.aspectRatio === "string" ? body.aspectRatio.trim() : "1:1";

    if (!image) {
      return respErr("image is required");
    }

    const generatedRequest = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({
        mediaType: "image",
        images: [image],
        prompt: VARIATIONS_PROMPT,
        aspect_ratio: aspectRatio || "1:1",
      }),
    });

    return handleWavespeedAPIRequest(generatedRequest, {
      apiKey: "gpt-image-2-image-to-image",
      scene: "variations",
      endpoint: undefined,
      description: "variations generate request",
      validateParams: (requestBody: any) => ({
        valid:
          Array.isArray(requestBody?.images) &&
          requestBody.images.length > 0 &&
          typeof requestBody?.prompt === "string" &&
          requestBody.prompt.trim().length > 0,
        params: requestBody,
        error: "image and prompt are required",
      }),
      buildPayload: (requestBody: any) => requestBody,
      buildMetadata: () => ({
        type: "variations-generate",
      }),
      buildTaskData: (_body: any, validatedParams: any) => ({
        mediaType: "image",
        model: "gpt-image-2-image-to-image",
        prompt: validatedParams?.prompt || "",
        options: {
          images: validatedParams?.images,
          aspect_ratio: validatedParams?.aspect_ratio,
          toolAlias: "variations",
        },
      }),
      enablePromptOptimizer: false,
    });
  } catch (e: any) {
    console.error("variations generate failed", e);
    return respErr(e.message || "variations generate failed");
  }
}
