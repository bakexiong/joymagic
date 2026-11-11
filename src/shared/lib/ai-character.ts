export const AI_GIRL_DNA_STORAGE_KEY = "ai-girl:dna";
export const AI_GIRL_CHARACTER_ID_STORAGE_KEY = "ai-girl:character-id";

export const AI_GIRL_GENERATION_ASPECT_RATIO = "4:5";
export const AI_GIRL_GENERATION_RESOLUTION = "4k";
export const AI_GIRL_GENERATION_OUTPUT_FORMAT = "png";
export const AI_GIRL_GENERATION_SCENE = "nano-banana-2-text-to-image";

export type AiGirlCharacterDNA = {
  ethnicity: string;
  age: string;
  skin: string;
  eyes: string;
  lips: string;
  hair: string;
  hairColor: string;
  body: string;
  vibe: string;
};

export type AiGirlPerspectiveParams = {
  horizontalAngle: number;
  verticalAngle: number;
  distance: number;
};

export const defaultAiGirlCharacterDNA: AiGirlCharacterDNA = {
  ethnicity: "white-classic",
  age: "young-adult",
  skin: "tan",
  eyes: "blue",
  lips: "glossy-rose-full",
  hair: "soft-wavy-dark-brown",
  hairColor: "pink",
  body: "balanced-curvy",
  vibe: "sultry",
};

const dnaLabels = {
  ethnicity: {
    "asian-soft": "Asian",
    "black-glam": "Black",
    "white-classic": "White",
    "latina-warm": "Latina",
    "arab-lux": "Arab",
    "indian-glow": "Indian",
  },
  age: {
    teen: "Teen",
    "young-adult": "Young Adult",
    "middle-aged": "Middle-aged",
    senior: "Senior",
  },
  skin: {
    pale: "Pale",
    light: "Light",
    medium: "Medium",
    tan: "Tan",
    olive: "Olive",
    dark: "Dark",
  },
  eyes: {
    black: "Black eyes",
    brown: "Brown eyes",
    red: "Red eyes",
    yellow: "Yellow eyes",
    green: "Green eyes",
    blue: "Blue eyes",
    purple: "Purple eyes",
    pink: "Pink eyes",
    white: "White eyes",
    gray: "Gray eyes",
  },
  lips: {
    "glossy-rose-full": "Glossy full rose lips",
    "matte-nude-thin": "Matte nude thin lips",
    "m-shape-berry": "M-shaped berry lips",
    "bitten-cherry": "Bitten cherry lips",
  },
  hair: {
    "braided-blonde": "Braided hairstyle",
    "long-silky-blonde": "Long silky hairstyle",
    "blonde-see-through-bangs": "See-through bangs hairstyle",
    "high-ponytail-blonde": "High ponytail hairstyle",
    "glass-black-bob": "Short bob hairstyle",
    "soft-bun-blonde": "Soft bun hairstyle",
    "double-buns-blonde": "Double buns hairstyle",
    "soft-wavy-dark-brown": "Soft wavy hairstyle",
    "gradient-pixie": "Pixie hairstyle",
  },
  hairColor: {
    black: "black hair",
    brown: "brown hair",
    red: "red hair",
    yellow: "blonde hair",
    green: "green hair",
    blue: "blue hair",
    purple: "purple hair",
    pink: "pink hair",
    white: "white hair",
    gray: "gray hair",
  },
  body: {
    "slender-soft": "slender body",
    "balanced-curvy": "balanced curvy body",
    "athletic-toned": "athletic toned body",
    "model-nine-head": "model-like long proportions",
  },
  vibe: {
    smile: "warm friendly smile",
    sultry: "sultry magnetic expression",
    smirk: "playful smirk",
    blush: "soft blushing expression",
  },
} as const satisfies Record<keyof AiGirlCharacterDNA, Record<string, string>>;

const dnaOrder: Array<keyof AiGirlCharacterDNA> = [
  "ethnicity",
  "age",
  "skin",
  "eyes",
  "lips",
  "hair",
  "hairColor",
  "body",
  "vibe",
];

export function isValidAiGirlCharacterDNA(
  input: unknown,
): input is AiGirlCharacterDNA {
  if (!input || typeof input !== "object") {
    return false;
  }

  const value = input as Record<string, unknown>;

  return dnaOrder.every((key) => {
    const fieldValue = value[key];
    return (
      typeof fieldValue === "string" &&
      fieldValue in dnaLabels[key]
    );
  });
}

export function getAiGirlDnaLabel<K extends keyof AiGirlCharacterDNA>(
  key: K,
  value: string,
) {
  const labels = dnaLabels[key] as Record<string, string>;
  return labels[value] ?? value;
}

export function getAiGirlDnaSummary(dna: AiGirlCharacterDNA) {
  return dnaOrder.map((key) => ({
    key,
    label: getAiGirlDnaLabel(key, dna[key]),
  }));
}

export function sanitizeAiGirlExtraDescription(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, 1200);
}

export function buildAiGirlImagePrompt({
  dna,
  extraDescription,
}: {
  dna: AiGirlCharacterDNA;
  extraDescription?: string;
}) {
  const cleanedExtra = sanitizeAiGirlExtraDescription(extraDescription);
  const baseTraits = [
    `ethnicity: ${getAiGirlDnaLabel("ethnicity", dna.ethnicity)}`,
    `age: ${getAiGirlDnaLabel("age", dna.age)}`,
    `skin tone: ${getAiGirlDnaLabel("skin", dna.skin)}`,
    `eyes: ${getAiGirlDnaLabel("eyes", dna.eyes)}`,
    `lips: ${getAiGirlDnaLabel("lips", dna.lips)}`,
    `hair style: ${getAiGirlDnaLabel("hair", dna.hair)}`,
    `hair color: ${getAiGirlDnaLabel("hairColor", dna.hairColor)}`,
    `body shape: ${getAiGirlDnaLabel("body", dna.body)}`,
    `expression and vibe: ${getAiGirlDnaLabel("vibe", dna.vibe)}`,
  ];

  const promptParts = [
    "Create a single fictional AI girl portrait with premium cinematic realism.",
    `Character DNA: ${baseTraits.join(", ")}.`,
    "Keep the face coherent, attractive, anatomically correct, and visually consistent.",
    "Professional editorial photography, soft cinematic lighting, clean composition, fine skin texture, expressive eyes, rich hair detail, high detail, no text, no watermark, no extra people.",
  ];

  if (cleanedExtra) {
    promptParts.push(`User creative direction: ${cleanedExtra}.`);
  }

  return promptParts.join(" ");
}

export type AiGirlCharacterSnapshot = {
  dna: AiGirlCharacterDNA;
  extraDescription: string;
  imageUrl?: string | null;
  aspectRatio: string;
  resolution: string;
};

export function buildAiGirlCharacterSnapshot(input: {
  dna: AiGirlCharacterDNA;
  extraDescription?: string | null;
  imageUrl?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
}): AiGirlCharacterSnapshot {
  return {
    dna: input.dna,
    extraDescription: sanitizeAiGirlExtraDescription(input.extraDescription),
    imageUrl: input.imageUrl ?? null,
    aspectRatio: input.aspectRatio || AI_GIRL_GENERATION_ASPECT_RATIO,
    resolution: input.resolution || AI_GIRL_GENERATION_RESOLUTION,
  };
}

export function sanitizeAiGirlPerspectiveParams(
  input: unknown,
): AiGirlPerspectiveParams | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const value = input as Record<string, unknown>;
  const horizontalAngle = Number(value.horizontalAngle);
  const verticalAngle = Number(value.verticalAngle);
  const distance = Number(value.distance);

  if (
    !Number.isFinite(horizontalAngle) ||
    !Number.isFinite(verticalAngle) ||
    !Number.isFinite(distance)
  ) {
    return null;
  }

  return {
    horizontalAngle,
    verticalAngle,
    distance,
  };
}

export function diffAiGirlCharacterSnapshot(
  previous: AiGirlCharacterSnapshot | null,
  next: AiGirlCharacterSnapshot,
) {
  if (!previous) {
    return {
      created: true,
      next,
    };
  }

  const dnaChanges = Object.entries(next.dna).reduce<Record<string, { from: string; to: string }>>(
    (acc, [key, value]) => {
      const prevValue = previous.dna[key as keyof AiGirlCharacterDNA];
      if (prevValue !== value) {
        acc[key] = { from: prevValue, to: value };
      }
      return acc;
    },
    {},
  );

  const extraDescriptionChanged =
    previous.extraDescription !== next.extraDescription
      ? {
          from: previous.extraDescription,
          to: next.extraDescription,
        }
      : null;

  const imageUrlChanged =
    (previous.imageUrl || null) !== (next.imageUrl || null)
      ? {
          from: previous.imageUrl || null,
          to: next.imageUrl || null,
        }
      : null;

  const aspectRatioChanged =
    previous.aspectRatio !== next.aspectRatio
      ? { from: previous.aspectRatio, to: next.aspectRatio }
      : null;

  const resolutionChanged =
    previous.resolution !== next.resolution
      ? { from: previous.resolution, to: next.resolution }
      : null;

  return {
    dnaChanges,
    extraDescriptionChanged,
    imageUrlChanged,
    aspectRatioChanged,
    resolutionChanged,
  };
}
