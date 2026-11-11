import fs from "node:fs/promises";
import path from "node:path";
import { generateObject } from "ai";
import { z } from "zod";

import { createCanvasAgentChatModel } from "../src/mastra/openrouter/canvas-openrouter";

const LIVE_PATH = path.resolve(
  process.cwd(),
  "docs/zencreator-image-editor.visible-template-headings.live.json",
);
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "docs/zencreator-image-editor.full-inference.json",
);
const API_BASE =
  "https://api.zencreator.pro/api/v1/tools/templates?tool_name=image_editor&page_size=12&public=true&sort_by=new_first_popularity&website_only=false";

type ApiTemplate = {
  id: string;
  name: string;
  input?: {
    prompt?: string | null;
  } | null;
  output?: {
    image_assets?: string[];
  } | null;
  purpose_tags?: string[];
  tool_tags?: string[];
};

type FlatTemplate = {
  template_id?: string;
  template_name?: string;
  prompt?: null | string;
  ref_image_urls?: string[];
  image_url?: null | string;
  purpose_tags?: string[];
  tool_tags?: string[];
  tool_name?: string;
};

type LiveTemplateFile = {
  visible_template_count: number;
  template_names: string[];
};

type InferredTemplate = {
  index: number;
  template_id: string;
  original_template_name: string;
  template_name_synonym: string;
  source_ref_image_urls: string[];
  source_output_image_url: string;
  source_prompt: string;
  purpose_tags: string[];
  tool_tags: string[];
  semantic_inference: {
    reasoning_sources: string[];
    environment_phrase: string;
    environment_ref_prompt: string;
    environment_ref_needed: boolean;
    strong_scene_display_needed: boolean;
    strong_scene_reason: string;
    object_cues: string[];
    object_ref_prompts: string[];
    object_ref_needed: boolean;
    assistant_ref_plan: Array<"person" | "environment" | "object">;
  };
  generic_inferred_prompt: string;
  ref_generation_prompt: string;
  supplemental_ref_prompts: string[];
  final_generation_prompt: string;
  primary_ref_image_url: string;
  ref_image_urls: string[];
  final_image_url: string;
  generation_status: "pending";
};

const semanticInferenceSchema = z.object({
  reasoning_sources: z.array(z.string()).default([
    "template_name",
    "purpose_tags",
    "source_prompt",
  ]),
  environment_phrase: z.string().default(""),
  environment_ref_prompt: z.string().default(""),
  environment_ref_needed: z.boolean().default(false),
  strong_scene_display_needed: z.boolean().default(false),
  strong_scene_reason: z.string().default(""),
  object_cues: z.array(z.string()).default([]),
  object_ref_prompts: z.array(z.string()).default([]),
  object_ref_needed: z.boolean().default(false),
  assistant_ref_plan: z
    .array(z.enum(["person", "environment", "object"]))
    .default(["person"]),
});

const llmInferenceSchema = z.object({
  template_name_synonym: z.string(),
  generic_inferred_prompt: z.string(),
  ref_generation_prompt: z.string(),
  supplemental_ref_prompts: z.array(z.string()).default([]),
  final_generation_prompt: z.string(),
  semantic_inference: semanticInferenceSchema,
});

const synonymOverrides: Record<string, string> = {
  "Playful Duck Face": "Cheeky Pout Pose",
  "Sultry Lip Pose": "Smoldering Lip Gesture",
  "Luxury Yacht - 3:4": "Prestige Superyacht - 3:4",
  "Mirror Selfie/ Sexy Pose": "Chic Mirror Snapshot",
  "Parisian golden gown": "Paris Gilded Evening Gown",
  "Outfit Change + Sitting Pose + Living Room":
    "Wardrobe Switch + Seated Lounge Pose",
  "Same Background/ Change Person - 3:4": "Backdrop Match Muse Swap - 3:4",
  "Remove Person - 3:4": "Scene Clean-Up Muse - 3:4",
  "Selfie-style photo": "Phone-Shot Portrait",
  "Ebony wrapped in red changing pose": "Crimson-Wrapped Pose Remix",
  "Close-up portrait": "Tight Framing Portrait Study",
  "Manor intrigue": "Estate Mystique",
  "Muscle Upgrade - 3:4": "Physique Glow-Up - 3:4",
  "Classy beauty beside a classic car":
    "Elegant Muse Beside A Vintage Automobile",
  "Pose Change": "Pose Remix",
  "Lavender couture & white thigh-highs": "Lilac Couture With White Accents",
  "From bath to race": "Spa-To-Speed",
  "Sunglasses elegance portrait": "Shades Elegance Portrait",
  "Home made photo": "Homestyle Snapshot",
  "Ad's photoshoot": "Campaign Photoshoot",
  "Home comfort with a martini": "Home Comfort With A Martini",
  "Makeup - 9:16": "Beauty Detail - 9:16",
  "On the boat in coral swimsuit": "Coral Swimwear On Deck",
};

function titleCase(value: string) {
  return value
    .split(/[\s/+-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildSynonym(name: string) {
  const exact = synonymOverrides[name];
  if (exact) {
    return exact;
  }

  return titleCase(name)
    .replace(/\bPhoto\b/g, "Portrait")
    .replace(/\bGirl\b/g, "Muse")
    .replace(/\bStyle\b/g, "Editorial")
    .replace(/\bOutfit\b/g, "Wardrobe")
    .replace(/\bSelfie\b/g, "Snapshot")
    .replace(/\bMakeup\b/g, "Beauty Detail");
}

function compactPrompt(value: null | string) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function buildPrompt(name: string, tags: string[], sourcePrompt: string) {
  const lowerKey = `${name} ${tags.join(" ")}`.toLowerCase();
  const lower = `${name} ${tags.join(" ")} ${sourcePrompt}`.toLowerCase();
  const ratio = name.includes("9:16")
    ? "vertical composition"
    : name.includes("3:4")
      ? "vertical editorial composition"
      : "";

  let scene = "a polished editorial setting";
  let styling = "stylish contemporary fashion";
  let mood = "photorealistic lifestyle photography";
  let action = "posing with relaxed confidence";
  let extras = "";

  if (lowerKey.includes("duck face") || lowerKey.includes("pout")) {
    scene = "a neon-lit hallway with glowing wall art and nightlife ambience";
    action = "making a playful pout with an expressive hand gesture";
    mood = "photorealistic candid fashion portrait";
  } else if (lowerKey.includes("lip")) {
    scene = "a moody intimate bedroom or lounge corner with dim warm light";
    action = "holding a soft finger-near-lips gesture with direct eye contact";
    mood = "cinematic close portrait photography";
  } else if (lowerKey.includes("yacht") || lowerKey.includes("boat") || lowerKey.includes("riviera")) {
    scene = "a sunlit luxury yacht deck with visible railings, open sea, and sparkling water";
    styling = "refined resort fashion";
    mood = "photorealistic summer luxury editorial";
  } else if (lowerKey.includes("mirror")) {
    scene = "a mirror-facing bedroom or dressing-room corner with visible mirror context";
    action = "capturing a relaxed mirror-snapshot pose";
    mood = "photorealistic smartphone-style portrait";
  } else if (lowerKey.includes("paris") || lowerKey.includes("eiffel")) {
    scene = "a romantic Paris street or terrace view with glowing city lights and elegant architecture";
    styling = "elegant couture eveningwear";
    mood = "luxury fashion portrait photography";
  } else if (lowerKey.includes("living room") || lowerKey.includes("home") || lowerKey.includes("housewife")) {
    scene = "a cozy living room or home lounge with sofa, side lamp, and soft ambient light";
    mood = "photorealistic domestic lifestyle portrait";
  } else if (lowerKey.includes("classic car") || lowerKey.includes("drive")) {
    scene = "a polished automotive setting with a clearly visible premium car and cinematic street presence";
    styling = "elevated retro-chic fashion";
    mood = "cinematic automotive editorial";
  } else if (lowerKey.includes("martini")) {
    scene = "a sophisticated evening living room or lounge interior with a cocktail moment";
    mood = "photorealistic quiet-luxury lifestyle editorial";
  } else if (lowerKey.includes("makeup") || lowerKey.includes("cosmetics")) {
    scene = "a beauty counter, cosmetics store aisle, or polished vanity setting";
    styling = "refined makeup-focused beauty styling";
    mood = "photorealistic beauty campaign photography";
  } else if (lowerKey.includes("tennis")) {
    scene = "a bright tennis court with net lines, court surface, and open sporty atmosphere";
    styling = "premium sports fashion";
    mood = "photorealistic athletic editorial";
  } else if (lowerKey.includes("golf")) {
    scene = "a manicured golf-club or country-club setting with fairway atmosphere";
    styling = "polished country-club fashion";
    mood = "photorealistic leisure editorial";
  } else if (lowerKey.includes("boxing") || lowerKey.includes("gym")) {
    scene = "a stylish gym or fitness studio with visible workout context";
    styling = "fashion-forward activewear";
    mood = "photorealistic sport-glam portrait";
  } else if (lowerKey.includes("resort")) {
    scene = "a bright upscale resort walkway, terrace, or poolside backdrop";
    styling = "luxury vacation fashion";
    mood = "photorealistic travel editorial";
  } else if (lowerKey.includes("rainy night")) {
    scene = "a glossy rainy-night street scene with wet pavement reflections and city lights";
    mood = "cinematic nightlife editorial";
  } else if (lowerKey.includes("morning")) {
    scene = "a soft sunlit morning room, balcony, or terrace setting";
    mood = "fresh photorealistic lifestyle portrait";
  } else if (lowerKey.includes("great canyon")) {
    scene = "a dramatic canyon overlook with expansive rocky landscape";
    mood = "photorealistic travel portrait";
  } else if (lowerKey.includes("lemons")) {
    scene = "a vivid lemon-filled summer market or decorative citrus backdrop";
    mood = "bright photorealistic campaign portrait";
  } else if (lowerKey.includes("roses") || lowerKey.includes("flower")) {
    scene = "a lush floral set with clearly visible flowers surrounding the subject";
    mood = "romantic photorealistic fashion portrait";
  } else if (lowerKey.includes("hogwarts")) {
    scene = "a magical academy-inspired hall, corridor, or stone classroom setting";
    styling = "fantasy-school fashion with cinematic polish";
    mood = "photorealistic fantasy editorial";
  } else if (lowerKey.includes("dj")) {
    scene = "a sleek DJ booth or music-club environment with nightlife energy";
    mood = "photorealistic nightlife editorial";
  } else if (lowerKey.includes("business") || lowerKey.includes("boss babe") || lowerKey.includes("high society")) {
    scene = "a premium office, luxury lobby, or high-status aspirational setting";
    styling = "powerful luxury fashion";
    mood = "photorealistic status-driven editorial";
  } else if (lowerKey.includes("muscular") || lowerKey.includes("muscle")) {
    scene = "a clean fitness-inspired environment with simple gym or training context";
    styling = "stylish activewear";
    mood = "photorealistic transformation portrait";
  } else if (lowerKey.includes("haircut")) {
    scene = "a clean portrait setting with salon-like or neutral beauty context";
    extras = "with attention on the hairstyle transformation";
    mood = "photorealistic beauty portrait";
  } else if (lowerKey.includes("caricature")) {
    scene = "a playful pink stylized backdrop with whimsical graphic energy";
    mood = "high-detail stylized character portrait";
  } else if (lowerKey.includes("beast")) {
    scene = "an upscale resort setting with a clearly present animal companion";
    mood = "photorealistic luxury lifestyle portrait";
  }

  const prompt = [
    action.charAt(0).toUpperCase() + action.slice(1),
    "in",
    scene + ",",
    styling + ",",
    mood + ",",
    ratio,
    extras,
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/,\.$/, ".")
    .replace(/,\s*$/, "")
    .trim();

  return prompt.endsWith(".") ? prompt : `${prompt}.`;
}

function buildRefPrompt(prompt: string) {
  return [
    "Create a reference image of a young adult beautiful woman.",
    "The reference should look like a natural everyday life photo or casual personal snapshot.",
    "She should feel subtly sexy, attractive, and confident in a believable everyday way.",
    "Use flattering body language, softly alluring styling, and feminine appeal without turning it into a full fashion campaign scene.",
    "Use a neutral ordinary setting such as a home interior, a quiet cafe, a hallway, a street corner, or a simple outdoor location.",
    "Do not use the same or similar scene, prop setup, wardrobe concept, product context, or atmosphere as the target generation prompt.",
    "The image should primarily establish identity, face, hair, body proportions, and general appearance rather than the final styled scene.",
    "Create a fresh reference image with a clearly different identity,",
    "the subject must be a young adult beautiful woman,",
    "keep the styling casual, believable, photorealistic, and mildly sensual,",
    "avoid dramatic fashion-editorial staging, avoid matching the target location, and avoid target-scene props.",
    "no text, no watermark, photorealistic quality.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEnvironmentPhrase(prompt: string) {
  const match = prompt.match(/ in (.*?)(?:,\s[^,]+,\s[^,]+(?:,\s[^,]+)?)?\.$/i);
  if (match?.[1]) {
    return match[1].trim();
  }

  const fallback = prompt.match(/ in (.*)$/i);
  return fallback?.[1]?.replace(/\.$/, "").trim() || "";
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function countMeaningfulWords(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part.trim().replace(/[^a-z0-9-]/gi, ""))
    .filter((part) => part.length >= 3).length;
}

function extractSceneAnchors(environmentPhrase: string) {
  return environmentPhrase
    .split(/,| with | and /i)
    .map((part) => part.trim())
    .filter((part) => countMeaningfulWords(part) >= 2);
}

function shouldForceStrongSceneDisplay(
  environmentPhrase: string,
  sourcePrompt: string,
  genericPrompt: string,
) {
  const sceneAnchors = extractSceneAnchors(environmentPhrase);
  const environmentWordCount = countMeaningfulWords(environmentPhrase);
  const lowerSourcePrompt = sourcePrompt.toLowerCase();
  const lowerGenericPrompt = genericPrompt.toLowerCase();
  const reasoning: string[] = [];

  if (
    /(background|setting|location|scene|interior|exterior|room|hallway|street|store|court|deck|view)/i.test(
      lowerSourcePrompt,
    )
  ) {
    reasoning.push("source_prompt_explicitly_mentions_the_setting");
  }

  if (sceneAnchors.length >= 2) {
    reasoning.push("environment_phrase_contains_multiple_visual_anchors");
  }

  if (environmentWordCount >= 7) {
    reasoning.push("environment_phrase_is_specific_not_generic");
  }

  if (
    /\bvisible\b|\bclearly\b|\bopen\b|\bsparkling\b|\bglowing\b|\bwet\b|\bsoft ambient\b/i.test(
      lowerGenericPrompt,
    )
  ) {
    reasoning.push("prompt_describes_observable_scene_details");
  }

  const shouldForce =
    environmentPhrase.length > 0 &&
    (sceneAnchors.length >= 2 ||
      environmentWordCount >= 7 ||
      (
        reasoning.includes("source_prompt_explicitly_mentions_the_setting") &&
        environmentWordCount >= 5
      ));

  return {
    shouldForce,
    reason: reasoning.join("; "),
  };
}

function buildSemanticInference(name: string, tags: string[], sourcePrompt: string, genericPrompt: string) {
  const lower = `${name} ${tags.join(" ")} ${sourcePrompt} ${genericPrompt}`.toLowerCase();
  const environmentPhrase = extractEnvironmentPhrase(genericPrompt);
  const reasoningSources = [
    "template_name",
    "purpose_tags",
    "source_prompt",
    "generic_inferred_prompt",
  ];

  const objectCues: string[] = [];
  const objectRefPrompts: string[] = [];
  let environmentRefPrompt = "";

  if (lower.includes("mirror") || lower.includes("selfie") || lower.includes("snapshot")) {
    objectCues.push("smartphone");
    objectRefPrompts.push(
      "Create a clean standalone reference image of a modern smartphone suitable for a mirror selfie or casual snapshot scene, natural realistic lighting, simple neutral background, photorealistic product snapshot, no text, no watermark.",
    );
  }

  if (lower.includes("martini") || lower.includes("cocktail")) {
    objectCues.push("martini glass");
    objectRefPrompts.push(
      "Create a clean standalone reference image of an elegant martini or cocktail glass in natural realistic lighting, simple neutral background, photorealistic product-style snapshot, no text, no watermark.",
    );
  }

  if (lower.includes("classic car") || lower.includes("automotive") || lower.includes("drive")) {
    objectCues.push("classic car");
    objectRefPrompts.push(
      "Create a clean standalone reference image of a premium classic car in natural realistic lighting, simple neutral environment, photorealistic vehicle snapshot, no people, no text, no watermark.",
    );
  }

  if (lower.includes("tennis")) {
    objectCues.push("tennis racket", "tennis ball");
    objectRefPrompts.push(
      "Create a clean standalone reference image of a tennis racket and tennis ball in natural realistic lighting, simple neutral background, photorealistic sports-equipment snapshot, no text, no watermark.",
    );
  }

  if (lower.includes("golf")) {
    objectCues.push("golf club", "golf ball");
    objectRefPrompts.push(
      "Create a clean standalone reference image of a golf club and golf ball in natural realistic lighting, simple neutral background, photorealistic sports-equipment snapshot, no text, no watermark.",
    );
  }

  if (lower.includes("beast") || lower.includes("animal companion") || lower.includes("beloved beast")) {
    objectCues.push("animal companion");
    objectRefPrompts.push(
      "Create a clean standalone reference image of an elegant companion animal suitable for a luxury editorial scene, natural realistic lighting, simple neutral background, photorealistic animal snapshot, no text, no watermark.",
    );
  }

  if (lower.includes("cosmetics") || lower.includes("makeup") || lower.includes("beauty")) {
    objectCues.push("beauty products");
    objectRefPrompts.push(
      "Create a clean standalone reference image of premium beauty or cosmetic items in natural realistic lighting, simple neutral background, photorealistic product snapshot, no text, no watermark.",
    );
  }

  if (lower.includes("boat") || lower.includes("yacht") || lower.includes("riviera")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of a luxury yacht or refined boat-deck environment with no people, visible railings, open sea, realistic daylight, and clear marine atmosphere, photorealistic scene reference, no text, no watermark.";
  } else if (lower.includes("paris") || lower.includes("eiffel")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of a romantic Paris city environment with glowing lights and elegant architecture, no people, photorealistic scene reference, no text, no watermark.";
  } else if (lower.includes("resort")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of an upscale resort environment with no people, warm travel-luxury atmosphere, photorealistic scene reference, no text, no watermark.";
  } else if (lower.includes("rainy night")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of a glossy rainy city night environment with no people, wet pavement reflections, photorealistic scene reference, no text, no watermark.";
  } else if (lower.includes("living room") || lower.includes("home lounge") || lower.includes("home interior") || lower.includes("domestic")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of a sophisticated cozy home interior with no people, sofa, side lamp, warm ambient lighting, photorealistic scene reference, no text, no watermark.";
  } else if (lower.includes("tennis court")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of a bright tennis-court environment with no people, visible net lines and court surface, photorealistic sports scene reference, no text, no watermark.";
  } else if (lower.includes("golf-club") || lower.includes("country-club") || lower.includes("golf course")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of an elegant golf-course or country-club environment with no people, photorealistic sports scene reference, no text, no watermark.";
  } else if (lower.includes("cosmetics store") || lower.includes("beauty counter") || lower.includes("vanity")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of a polished cosmetics-store or beauty-counter environment with no people, photorealistic retail scene reference, no text, no watermark.";
  } else if (lower.includes("hallway") || lower.includes("nightlife ambience") || lower.includes("wall art")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of a neon-lit hallway environment with glowing wall art, nightlife ambience, and no people, photorealistic scene reference, no text, no watermark.";
  } else if (lower.includes("bedroom") || lower.includes("lounge corner")) {
    environmentRefPrompt =
      "Create a clean standalone reference image of a moody intimate bedroom or lounge corner with dim warm light and no people, photorealistic scene reference, no text, no watermark.";
  }
  const strongSceneDecision = shouldForceStrongSceneDisplay(
    environmentPhrase,
    sourcePrompt,
    genericPrompt,
  );
  const strongSceneDisplayNeeded =
    Boolean(environmentRefPrompt) && strongSceneDecision.shouldForce;

  const assistantRefPlan: Array<"person" | "environment" | "object"> = ["person"];
  if (environmentRefPrompt) assistantRefPlan.push("environment");
  if (objectRefPrompts.length > 0) assistantRefPlan.push("object");

  return {
    reasoning_sources: reasoningSources,
    environment_phrase: environmentPhrase,
    environment_ref_prompt: environmentRefPrompt,
    environment_ref_needed: Boolean(environmentRefPrompt),
    strong_scene_display_needed: strongSceneDisplayNeeded,
    strong_scene_reason: strongSceneDecision.reason,
    object_cues: dedupeStrings(objectCues),
    object_ref_prompts: dedupeStrings(objectRefPrompts),
    object_ref_needed: objectRefPrompts.length > 0,
    assistant_ref_plan: assistantRefPlan,
  };
}

function buildSupplementalRefPrompts(semantic: ReturnType<typeof buildSemanticInference>) {
  const refs: string[] = [];

  if (semantic.environment_ref_needed && semantic.environment_ref_prompt) {
    refs.push(semantic.environment_ref_prompt);
  }

  refs.push(...semantic.object_ref_prompts);

  return [...new Set(refs)];
}

function buildStrongSceneInstructions(
  semantic: ReturnType<typeof buildSemanticInference>,
) {
  if (!semantic.strong_scene_display_needed || !semantic.environment_phrase) {
    return "";
  }

  return [
    `The target setting must be clearly visible and read unmistakably as ${semantic.environment_phrase}.`,
    "Replace the original background entirely with the target setting rather than keeping the everyday snapshot environment.",
    "Use a composition that gives enough space to show the scene, not an overly tight portrait crop.",
    "Keep the subject prominent, but ensure the environment is an obvious part of the final image.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFinalPrompt(
  prompt: string,
  semantic: ReturnType<typeof buildSemanticInference>,
) {
  const strongSceneInstructions = buildStrongSceneInstructions(semantic);

  return [
    "Use the uploaded reference image as the subject and identity anchor.",
    prompt,
    strongSceneInstructions,
    "Preserve the uploaded reference subject's core identity, and preserve any key object, accessory, companion, or item from the reference when it is relevant to the prompt.",
    "Do not preserve the reference photo's original background or everyday setting by default unless the prompt explicitly asks for it or the concept depends on it.",
    "Treat the reference primarily as identity and optional key-object guidance, then rebuild the target scene, styling, wardrobe, props, and atmosphere from the prompt.",
    "Make the result broadly reusable for different uploaded references while keeping a polished final image.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const live = JSON.parse(await fs.readFile(LIVE_PATH, "utf8")) as LiveTemplateFile;
  const flatPath = path.resolve(
    process.cwd(),
    "docs/zencreator-tools-templates.flat.json",
  );
  const flat = JSON.parse(await fs.readFile(flatPath, "utf8")) as FlatTemplate[];
  const flatRows = flat.filter((row) => row.tool_name === "image_editor");
  const apiRows: ApiTemplate[] = [];

  const firstPage = await fetch(`${API_BASE}&page=1`);
  const firstJson = (await firstPage.json()) as {
    data?: ApiTemplate[];
    total_pages?: number;
  };
  apiRows.push(...(firstJson.data || []));

  for (let page = 2; page <= (firstJson.total_pages || 1); page += 1) {
    const response = await fetch(`${API_BASE}&page=${page}`);
    const json = (await response.json()) as { data?: ApiTemplate[] };
    apiRows.push(...(json.data || []));
  }

  const buckets = new Map<string, ApiTemplate[]>();
  const model = await createCanvasAgentChatModel();

  for (const row of apiRows) {
    const list = buckets.get(row.name) || [];
    list.push(row);
    buckets.set(row.name, list);
  }

  const templates: InferredTemplate[] = [];

  for (const [index, name] of live.template_names.entries()) {
    const candidates = buckets.get(name) || [];
    const row = candidates.shift();

    if (!row) {
      throw new Error(`未在 API 数据中找到模板: ${name}`);
    }

    const flatMatch = flatRows.find((item) => item.template_id === row.id);
    const sourcePrompt = compactPrompt(row.input?.prompt || flatMatch?.prompt || "");
    const purposeTags = row.purpose_tags || flatMatch?.purpose_tags || [];
    const toolTags = row.tool_tags || flatMatch?.tool_tags || [];

    const llmPrompt = [
      "You are inferring reusable image-generation prompts for an image-editor template library.",
      "Use semantic understanding, not keyword matching heuristics.",
      "Return strict JSON only.",
      "",
      "Goals:",
      "1. Create a generic prompt that can still work when a user uploads a different reference image.",
      "2. Create a reference-generation prompt for an automatically generated main person reference image.",
      "3. Decide whether extra environment refs or object refs are needed based on semantic understanding of the prompt and concept.",
      "4. Decide whether the final image needs strong scene visibility.",
      "",
      "Hard requirements:",
      "- The main person ref must always be a young adult beautiful woman.",
      "- The main person ref should look like a believable everyday-life photo or casual snapshot, mildly sensual, not a campaign scene.",
      "- The main person ref scene must not be the same as the target scene.",
      "- Do not invent random fallback objects. If no object ref is clearly needed, return none.",
      "- Only ask for environment refs when the target environment is semantically important.",
      "- strong_scene_display_needed should be true only when the final image really needs the target scene to be clearly visible, not for generic portrait templates.",
      "- The final_generation_prompt must be reusable for user-uploaded refs and should not hardcode a specific identity.",
      "- The final_generation_prompt should preserve subject identity, optionally preserve relevant objects from the uploaded ref, and rebuild the target scene from the prompt.",
      "- All prompts must be in English.",
      "",
      "Template input:",
      `template_name: ${name}`,
      `purpose_tags: ${JSON.stringify(purposeTags)}`,
      `tool_tags: ${JSON.stringify(toolTags)}`,
      `source_prompt: ${JSON.stringify(sourcePrompt)}`,
      "",
      "Output fields:",
      "- template_name_synonym: close synonym or natural alternate naming",
      "- generic_inferred_prompt: one reusable prompt",
      "- ref_generation_prompt: one prompt for generating the main person ref",
      "- supplemental_ref_prompts: zero or more prompts for environment/object refs only when semantically needed",
      "- final_generation_prompt: one reusable final prompt for image-to-image generation",
      "- semantic_inference: structured explanation of the semantic decision",
      "",
      "For semantic_inference:",
      "- reasoning_sources: array of source names you relied on",
      "- environment_phrase: concise target environment phrase, or empty string",
      "- environment_ref_prompt: prompt for a standalone no-person environment ref, or empty string",
      "- environment_ref_needed: boolean",
      "- strong_scene_display_needed: boolean",
      "- strong_scene_reason: one concise sentence",
      "- object_cues: key object names only when clearly needed",
      "- object_ref_prompts: prompts for standalone object refs only when clearly needed",
      "- object_ref_needed: boolean",
      "- assistant_ref_plan: array using only person, environment, object",
    ].join("\n");

    const result = await generateObject({
      model,
      schema: llmInferenceSchema,
      prompt: llmPrompt,
    });
    const inferred = result.object;

    templates.push({
      index: index + 1,
      template_id: row.id,
      original_template_name: name,
      template_name_synonym:
        inferred.template_name_synonym || buildSynonym(name),
      source_ref_image_urls: flatMatch?.ref_image_urls || [],
      source_output_image_url: flatMatch?.image_url || "",
      source_prompt: sourcePrompt,
      purpose_tags: purposeTags,
      tool_tags: toolTags,
      semantic_inference: inferred.semantic_inference,
      generic_inferred_prompt: inferred.generic_inferred_prompt,
      ref_generation_prompt: inferred.ref_generation_prompt,
      supplemental_ref_prompts: dedupeStrings(
        inferred.supplemental_ref_prompts,
      ),
      final_generation_prompt: inferred.final_generation_prompt,
      primary_ref_image_url: "",
      ref_image_urls: [],
      final_image_url: "",
      generation_status: "pending",
    });
  }

  const output = {
    source_page: "https://app.zencreator.pro/tools/image-editor",
    source_api:
      "https://api.zencreator.pro/api/v1/tools/templates?tool_name=image_editor&page_size=12&public=true&sort_by=new_first_popularity&website_only=false",
    generated_at: new Date().toISOString(),
    note: "基于页面可见模板名、标签、原模板输入提示词与参考图做的通用化推断。最终 prompt 追求可迁移性，换 ref 后也应保持适用。",
    total_templates: templates.length,
    templates,
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: OUTPUT_PATH, total: templates.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
