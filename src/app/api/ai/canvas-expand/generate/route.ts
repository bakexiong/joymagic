import { handleWavespeedAPIRequest } from "@/app/api/common-handler";
import {
  buildCanvasExpandPrompt,
  CANVAS_EXPAND_PROVIDER_SCENARIO,
  CANVAS_EXPAND_SCENE,
} from "@/shared/lib/canvas-expand";
import { respErr } from "@/shared/lib/resp";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const image = typeof body?.image === "string" ? body.image.trim() : "";
    const aspectRatio =
      typeof body?.aspectRatio === "string" && body.aspectRatio.trim()
        ? body.aspectRatio.trim()
        : "16:9";
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const resolution =
      typeof body?.resolution === "string" && body.resolution.trim()
        ? body.resolution.trim()
        : "4k";
    const outputFormat =
      body?.outputFormat === "jpeg" ||
      body?.outputFormat === "png" ||
      body?.outputFormat === "webp"
        ? body.outputFormat
        : "png";
    const seed =
      typeof body?.seed === "number" && Number.isInteger(body.seed) && body.seed >= 0
        ? body.seed
        : undefined;

    if (!image) {
      return respErr("image is required");
    }

    const generatedPrompt = buildCanvasExpandPrompt({
      aspectRatio,
      userPrompt: prompt,
    });

    const generatedRequest = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({
        enable_base64_output: false,
        images: [image],
        mediaType: "image",
        prompt: generatedPrompt,
        resolution,
        output_format: outputFormat,
        aspect_ratio: aspectRatio,
        sceneId: CANVAS_EXPAND_SCENE,
        ...(seed !== undefined ? { seed } : {}),
      }),
    });

    return handleWavespeedAPIRequest(generatedRequest, {
      apiKey: CANVAS_EXPAND_PROVIDER_SCENARIO,
      scene: CANVAS_EXPAND_PROVIDER_SCENARIO,
      description: "canvas expand generate request",
      validateParams: (requestBody: any) => ({
        valid:
          Array.isArray(requestBody?.images) &&
          requestBody.images.length > 0 &&
          typeof requestBody?.prompt === "string" &&
          requestBody.prompt.trim().length > 0,
        params: requestBody,
        error: "images and prompt are required",
      }),
      buildPayload: (requestBody: any) => ({
        enable_base64_output: false,
        images: requestBody?.images,
        mediaType: "image",
        prompt: requestBody?.prompt,
        resolution: requestBody?.resolution,
        seed: requestBody?.seed,
        output_format: requestBody?.output_format,
        aspect_ratio: requestBody?.aspect_ratio,
      }),
      buildMetadata: (_body: any, validatedParams: any) => ({
        type: "canvas-expand-generate",
        sceneId: CANVAS_EXPAND_SCENE,
        aspectRatio:
          typeof validatedParams?.aspect_ratio === "string"
            ? validatedParams.aspect_ratio
            : aspectRatio,
        outputFormat,
      }),
      buildTaskData: (_body: any, validatedParams: any) => ({
        mediaType: "image",
        model: CANVAS_EXPAND_PROVIDER_SCENARIO,
        prompt: validatedParams?.prompt || "",
        options: {
          images: validatedParams?.images,
          resolution: validatedParams?.resolution,
          aspectRatio:
            typeof validatedParams?.aspect_ratio === "string"
              ? validatedParams.aspect_ratio
              : aspectRatio,
          outputFormat,
          sceneId: CANVAS_EXPAND_SCENE,
          userPrompt: prompt,
          ...(validatedParams?.seed !== undefined
            ? { seed: validatedParams.seed }
            : {}),
        },
      }),
      enablePromptOptimizer: false,
    });
  } catch (e: any) {
    console.error("canvas expand generate failed", e);
    return respErr(e.message || "canvas expand generate failed");
  }
}
