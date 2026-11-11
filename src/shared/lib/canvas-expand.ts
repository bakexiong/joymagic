export const CANVAS_EXPAND_SCENE = "canvas-expand";
export const CANVAS_EXPAND_PROVIDER_SCENARIO = "gpt-image-2-image-to-image";

type BuildCanvasExpandPromptOptions = {
  aspectRatio?: string;
  userPrompt?: string;
};

export function buildCanvasExpandPrompt({
  aspectRatio,
  userPrompt,
}: BuildCanvasExpandPromptOptions) {
  const normalizedAspectRatio =
    typeof aspectRatio === "string" && aspectRatio.trim()
      ? aspectRatio.trim()
      : "16:9";
  const normalizedUserPrompt =
    typeof userPrompt === "string" ? userPrompt.trim() : "";

  const instructions = [
    "Outpaint the provided image by extending the canvas beyond the original frame.",
    `Expand the composition naturally to fit a ${normalizedAspectRatio} canvas.`,
    "Preserve the original subject identity, pose, styling, framing balance, perspective, lighting direction, and image mood.",
    "Keep the original image content unchanged in the center and generate only the newly revealed surrounding areas.",
    "Continue the existing environment, background structures, textures, shadows, colors, and depth cues so the result feels like a wider uncropped version of the same shot.",
    "Do not duplicate the main subject, do not invent extra people unless explicitly requested, and do not add text, logos, watermarks, borders, or collage layouts.",
    "Avoid obvious seams, stretching, mirrored artifacts, repeated objects, or inconsistent geometry.",
  ];

  if (normalizedUserPrompt) {
    instructions.push(
      `Additional expansion guidance: ${normalizedUserPrompt}.`,
    );
  } else {
    instructions.push(
      "Prefer a clean, believable expansion with coherent negative space and background continuity.",
    );
  }

  instructions.push(
    "The final image must read as a single seamless photograph or illustration with a naturally expanded field of view.",
  );

  return instructions.join(" ");
}
