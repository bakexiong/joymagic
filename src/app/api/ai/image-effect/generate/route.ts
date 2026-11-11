import { handleWavespeedAPIRequest } from "@/app/api/common-handler";
import imageEffectSamples from "@/shared/lib/image-effect-samples.json";
import { getImageEffectRequiredInputCount } from "@/shared/lib/image-effect-data";
import { buildMangoPhotoEffectsNanoPrompt } from "@/shared/lib/mango-photo-effects-catalog";
import { respErr } from "@/shared/lib/resp";

const IMAGE_EFFECT_MODEL = "gpt-image-2-image-to-image";

type ImageEffectSampleRecord = Record<
  string,
  {
    title?: string;
    nanoBananaPrompt?: string;
    baseImagePrompts?: string[];
    description?: string;
    requiredInputCount?: number;
  }
>;

const sampleMap = imageEffectSamples as ImageEffectSampleRecord;

function buildImageEffectPrompt(
  effectSlug: string,
  effect: ImageEffectSampleRecord[string],
) {
  const stylePrompt =
    effect.baseImagePrompts?.find((item) => typeof item === "string" && item.trim()) ||
    effect.nanoBananaPrompt?.trim() ||
    (effect.title ? `change to ${effect.title}` : "");

  const detailPrompt = effect.nanoBananaPrompt?.trim() || "";
  const descriptionPrompt = effect.description?.trim() || "";

  if (effectSlug === "id-portrait") {
    return buildMangoPhotoEffectsNanoPrompt(stylePrompt, effectSlug);
  }

  return [
    "Use the uploaded image only as the identity reference for the main subject.",
    "Preserve the same person, facial identity, skin tone, and recognizable facial features.",
    "Do not keep the original passport-photo pose, framing, plain shirt, or plain background unless the target effect specifically requires it.",
    "You may completely change pose, camera angle, crop, body position, hand placement, styling, outfit, hair styling, props, and background to fit the effect theme.",
    "Do not generate a face-dominant beauty close-up, headshot, or tight portrait crop.",
    "Prefer a medium-wide, half-body, three-quarter-body, or environmental portrait composition.",
    "Keep the camera farther away so the subject occupies roughly one-third to one-half of the frame rather than filling most of it.",
    "Show abundant themed environment, props, styling details, and atmospheric background around the subject.",
    "Compose the image so the effect theme and scene design are more visually prominent than the face alone.",
    "Create a clearly transformed result with strong art direction, not a lightly edited copy of the source photo.",
    "The final image should immediately read as the requested themed effect.",
    descriptionPrompt,
    stylePrompt,
    detailPrompt,
    `Effect slug: ${effectSlug}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const effectSlug =
      typeof body?.effectSlug === "string" ? body.effectSlug.trim() : "";
    const images = Array.isArray(body?.images)
      ? body.images
          .map((image: unknown) =>
            typeof image === "string" ? image.trim() : "",
          )
          .filter(Boolean)
      : typeof body?.image === "string" && body.image.trim()
        ? [body.image.trim()]
        : [];

    if (!effectSlug) {
      return respErr("effectSlug is required");
    }

    const effect = sampleMap[effectSlug];
    if (!effect) {
      return respErr(`Unsupported image effect: ${effectSlug}`);
    }

    const requiredInputCount = getImageEffectRequiredInputCount(
      effect.requiredInputCount,
    );

    if (images.length < requiredInputCount) {
      return respErr(`At least ${requiredInputCount} image(s) are required`);
    }

    const prompt = buildImageEffectPrompt(effectSlug, effect);
    const seed =
      typeof body?.seed === "number" && Number.isInteger(body.seed) && body.seed >= 0
        ? body.seed
        : undefined;

    if (!prompt) {
      return respErr(`No prompt configured for image effect: ${effectSlug}`);
    }

    const generatedRequest = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({
        enable_base64_output: false,
        images,
        mediaType: "image",
        prompt,
        resolution: "0.5k",
        resoluation: "0.5k",
        ...(seed !== undefined ? { seed } : {}),
      }),
    });

    return handleWavespeedAPIRequest(generatedRequest, {
      apiKey: IMAGE_EFFECT_MODEL,
      scene: IMAGE_EFFECT_MODEL,
      endpoint: undefined,
      description: `image effect generate request: ${effectSlug}`,
      validateParams: (requestBody: any) => ({
        valid:
          Array.isArray(requestBody?.images) &&
          requestBody.images.length > 0 &&
          typeof requestBody?.prompt === "string" &&
          requestBody.prompt.trim().length > 0,
        params: requestBody,
        error: "images and prompt are required",
      }),
      buildPayload: (requestBody: any) => requestBody,
      buildMetadata: () => ({
        type: "image-effect-generate",
        effectSlug,
      }),
      buildTaskData: (_body: any, validatedParams: any) => ({
        mediaType: "image",
        model: IMAGE_EFFECT_MODEL,
        prompt: validatedParams?.prompt || "",
        options: {
          images: validatedParams?.images,
          resolution: validatedParams?.resolution,
          ...(validatedParams?.seed !== undefined
            ? { seed: validatedParams.seed }
            : {}),
          effectSlug,
        },
      }),
      enablePromptOptimizer: false,
    });
  } catch (e: any) {
    console.error("image effect generate failed", e);
    return respErr(e.message || "image effect generate failed");
  }
}
