import { handleWavespeedAPIRequest } from "@/app/api/common-handler";
import { respErr } from "@/shared/lib/resp";

type LightingPayload = {
  mode?: "perspective" | "front";
  anglePreset?:
    | "front_0"
    | "left_90"
    | "right_90"
    | "top_90"
    | "bottom_90"
    | "back_180"
    | "right_45"
    | "right_rear_45"
    | "left_rear_45"
    | "left_45"
    | "top_front_45"
    | "top_front_right_45"
    | "top_right_45"
    | "right_rear_top_45"
    | "top_rear_45"
    | "left_rear_top_45"
    | "top_left_45"
    | "top_front_left_45"
    | "bottom_front_45"
    | "bottom_front_right_45"
    | "bottom_right_45"
    | "right_rear_bottom_45"
    | "bottom_rear_45"
    | "left_rear_bottom_45"
    | "bottom_left_45"
    | "bottom_front_left_45";
  azimuthDeg?: number;
  elevationDeg?: number;
  brightness?: number;
  colorTemperature?: number;
  mainLight?: "left" | "top" | "right" | "front" | "bottom" | "back";
  rimLight?: boolean;
  rimPreset?: "back_0" | "top_back_45" | "low_back_45";
};

const ANGLE_PRESET_DESCRIPTION: Record<string, string> = {
  front_0: "front key light",
  left_90: "left side key light",
  right_90: "right side key light",
  top_90: "top-down key light",
  bottom_90: "under-lighting from below",
  back_180: "back key light",
  right_45: "front-right 45 degree key light",
  right_rear_45: "rear-right 45 degree key light",
  left_rear_45: "rear-left 45 degree key light",
  left_45: "front-left 45 degree key light",
  top_front_45: "top-front 45 degree key light",
  top_front_right_45: "top-front-right 45 degree key light",
  top_right_45: "top-right 45 degree key light",
  right_rear_top_45: "top-rear-right 45 degree key light",
  top_rear_45: "top-rear 45 degree key light",
  left_rear_top_45: "top-rear-left 45 degree key light",
  top_left_45: "top-left 45 degree key light",
  top_front_left_45: "top-front-left 45 degree key light",
  bottom_front_45: "bottom-front 45 degree key light",
  bottom_front_right_45: "bottom-front-right 45 degree key light",
  bottom_right_45: "bottom-right 45 degree key light",
  right_rear_bottom_45: "bottom-rear-right 45 degree key light",
  bottom_rear_45: "bottom-rear 45 degree key light",
  left_rear_bottom_45: "bottom-rear-left 45 degree key light",
  bottom_left_45: "bottom-left 45 degree key light",
  bottom_front_left_45: "bottom-front-left 45 degree key light",
};

const MAIN_LIGHT_DESCRIPTION: Record<string, string> = {
  left: "from the left side",
  top: "from above",
  right: "from the right side",
  front: "from the front",
  bottom: "from below",
  back: "from behind the subject",
};

const RIM_PRESET_DESCRIPTION: Record<string, string> = {
  back_0: "direct back rim light",
  top_back_45: "top-back 45 degree rim light",
  low_back_45: "low-back 45 degree rim light",
};

function describeBrightness(brightness?: number) {
  if (typeof brightness !== "number") return null;
  if (brightness <= 20) return "low-intensity lighting with gentle highlights";
  if (brightness >= 80) return "high-intensity lighting with bright, crisp highlights";
  return "medium-intensity lighting with balanced highlights and shadows";
}

function describeColorTemperature(colorTemperature?: number) {
  if (typeof colorTemperature !== "number") return null;
  if (colorTemperature <= 3200) return "warm tungsten-style color temperature";
  if (colorTemperature >= 6800) return "cool daylight color temperature";
  return "neutral daylight color temperature";
}

function buildRelightPrompt(lighting?: LightingPayload) {
  const instructions = [
    "Re-light the provided image only.",
    "Preserve the original subject identity, pose, framing, composition, perspective, materials, clothing, and background layout.",
    "Do not add or remove objects, do not change camera angle, and do not restyle the image.",
    "Focus purely on believable professional lighting, natural shadow direction, highlight placement, depth, and contrast.",
  ];

  if (!lighting) {
    instructions.push(
      "Apply tasteful studio-quality lighting enhancement with realistic shadows and highlights.",
    );
    return instructions.join(" ");
  }

  instructions.push(
    lighting.mode === "front"
      ? "Match a front-view lighting preview."
      : "Match a perspective lighting preview.",
  );

  if (lighting.anglePreset && ANGLE_PRESET_DESCRIPTION[lighting.anglePreset]) {
    instructions.push(
      `Use a ${ANGLE_PRESET_DESCRIPTION[lighting.anglePreset]}.`,
    );
  } else if (lighting.mainLight && MAIN_LIGHT_DESCRIPTION[lighting.mainLight]) {
    instructions.push(
      `Place the main key light ${MAIN_LIGHT_DESCRIPTION[lighting.mainLight]}.`,
    );
  }

  if (
    typeof lighting.azimuthDeg === "number" &&
    typeof lighting.elevationDeg === "number"
  ) {
    instructions.push(
      `Respect the lighting direction control with azimuth ${Math.round(lighting.azimuthDeg)} degrees and elevation ${Math.round(lighting.elevationDeg)} degrees.`,
    );
  }

  const brightnessDescription = describeBrightness(lighting.brightness);
  if (brightnessDescription) {
    instructions.push(`Set ${brightnessDescription}.`);
  }

  const colorTemperatureDescription = describeColorTemperature(
    lighting.colorTemperature,
  );
  if (colorTemperatureDescription) {
    instructions.push(`Use a ${colorTemperatureDescription}.`);
  }

  if (lighting.rimLight) {
    instructions.push(
      `Add a subtle ${RIM_PRESET_DESCRIPTION[lighting.rimPreset || "back_0"] || "back rim light"} that separates the subject from the background without overpowering the key light.`,
    );
  } else {
    instructions.push("Do not add rim light.");
  }

  instructions.push(
    "Keep the result photorealistic, clean, and consistent with the original image content.",
  );

  return instructions.join(" ");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const image = typeof body?.image === "string" ? body.image.trim() : "";
    const lighting =
      body?.lighting && typeof body.lighting === "object" ? body.lighting : undefined;
    const resolution =
      typeof body?.resolution === "string" && body.resolution.trim()
        ? body.resolution.trim()
        : "4k";
    const aspectRatio =
      typeof body?.aspectRatio === "string" && body.aspectRatio.trim()
        ? body.aspectRatio.trim()
        : "auto";
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

    const prompt = buildRelightPrompt(lighting);

    const generatedRequest = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({
        enable_base64_output: false,
        images: [image],
        mediaType: "image",
        prompt,
        resolution,
        output_format: outputFormat,
        ...(seed !== undefined ? { seed } : {}),
        ...(aspectRatio !== "auto" ? { aspect_ratio: aspectRatio } : {}),
      }),
    });

    return handleWavespeedAPIRequest(generatedRequest, {
      apiKey: "gpt-image-2-image-to-image",
      scene: "gpt-image-2-image-to-image",
      description: "canvas relight generate request",
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
      buildMetadata: (_body: any, validatedParams: any) => ({
        type: "canvas-relight-generate",
        resolution: validatedParams?.resolution,
        outputFormat: outputFormat,
      }),
      buildTaskData: (_body: any, validatedParams: any) => ({
        mediaType: "image",
        model: "gpt-image-2-image-to-image",
        prompt: validatedParams?.prompt || "",
        options: {
          images: validatedParams?.images,
          resolution: validatedParams?.resolution,
          aspectRatio:
            typeof validatedParams?.aspect_ratio === "string"
              ? validatedParams.aspect_ratio
              : "auto",
          lighting,
          outputFormat,
          ...(validatedParams?.seed !== undefined
            ? { seed: validatedParams.seed }
            : {}),
        },
      }),
      enablePromptOptimizer: false,
    });
  } catch (e: any) {
    console.error("canvas relight generate failed", e);
    return respErr(e.message || "canvas relight generate failed");
  }
}
