export type FaceGeneratorOption = {
  value: string;
  label: string;
};

export type FaceGeneratorFormValues = {
  gender: string;
  age: string;
  ethnos: string;
  bodyType: string;
  eyeColor: string;
  hairColor: string;
  hairType: string;
  hairStyle: string;
  makeup: string;
  aspectRatio: string;
  quality: string;
  imageCount: number;
};

export type FaceLibraryItem = {
  id: string;
  title: string;
  previewUrl: string;
  thumbnailUrl: string;
  generatedUrl: string;
  likes: number;
  params: Partial<FaceGeneratorFormValues>;
};

export const GENDER_OPTIONS: FaceGeneratorOption[] = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
];

export const AGE_OPTIONS: FaceGeneratorOption[] = [
  { value: "18-25", label: "18-25" },
  { value: "26-35", label: "26-35" },
  { value: "36-45", label: "36-45" },
  { value: "46-55", label: "46-55" },
  { value: "56-65", label: "56-65" },
  { value: "66-75", label: "66-75" },
  { value: "75-85", label: "75-85" },
  { value: "85+", label: "85+" },
];

export const ETHNOS_OPTIONS: FaceGeneratorOption[] = [
  { value: "European", label: "European" },
  { value: "North American", label: "North American" },
  { value: "South American", label: "South American" },
  { value: "Central American", label: "Central American" },
  { value: "Middle Eastern", label: "Middle Eastern" },
  { value: "North African", label: "North African" },
  { value: "East Asian", label: "East Asian" },
  { value: "South Asian", label: "South Asian" },
  { value: "Southeast Asian", label: "Southeast Asian" },
  { value: "Central Asian", label: "Central Asian" },
  {
    value: "Oceanian / Pacific Islander",
    label: "Oceanian / Pacific Islander",
  },
];

export const BODY_TYPE_OPTIONS: FaceGeneratorOption[] = [
  { value: "Normal", label: "Normal" },
  { value: "Slim", label: "Slim" },
  { value: "Fit", label: "Fit" },
  { value: "Muscular", label: "Muscular" },
  { value: "Curvy", label: "Curvy" },
  { value: "Chubby", label: "Chubby" },
];

export const EYE_COLOR_OPTIONS: FaceGeneratorOption[] = [
  { value: "Albino", label: "Albino" },
  { value: "Amber", label: "Amber" },
  { value: "Blue", label: "Blue" },
  { value: "Brown", label: "Brown" },
  { value: "Green", label: "Green" },
  { value: "Gray", label: "Gray" },
  { value: "Hazel", label: "Hazel" },
  { value: "Heterochromia", label: "Heterochromia" },
  { value: "Red", label: "Red" },
  { value: "Violet", label: "Violet" },
];

export const HAIR_COLOR_OPTIONS: FaceGeneratorOption[] = [
  { value: "Black", label: "Black" },
  { value: "Brunette", label: "Brunette" },
  { value: "Blonde", label: "Blonde" },
  { value: "Gray", label: "Gray" },
  { value: "Platinum", label: "Platinum" },
  { value: "Honey", label: "Honey" },
  { value: "Ombre", label: "Ombre" },
  { value: "Salt and Pepper", label: "Salt and Pepper" },
  { value: "Red", label: "Red" },
  { value: "Pink", label: "Pink" },
  { value: "Violet", label: "Violet" },
  { value: "Blue", label: "Blue" },
  { value: "Green", label: "Green" },
];

export const HAIR_TYPE_OPTIONS: FaceGeneratorOption[] = [
  { value: "Straight", label: "Straight" },
  { value: "Wavy", label: "Wavy" },
  { value: "Curly", label: "Curly" },
  { value: "Coily", label: "Coily" },
  { value: "Frizzy", label: "Frizzy" },
  { value: "Silky", label: "Silky" },
  { value: "Thick", label: "Thick" },
  { value: "Thin", label: "Thin" },
  { value: "Bald", label: "Bald" },
];

export const HAIR_STYLE_OPTIONS: FaceGeneratorOption[] = [
  { value: "Bob", label: "Bob" },
  { value: "Pixie", label: "Pixie" },
  { value: "Caesar", label: "Caesar" },
  { value: "Mohawk", label: "Mohawk" },
  { value: "Afro", label: "Afro" },
  { value: "Shag", label: "Shag" },
  { value: "Undercut", label: "Undercut" },
  { value: "Bowl", label: "Bowl" },
  { value: "Buzzcut", label: "Buzzcut" },
  { value: "Bun", label: "Bun" },
  { value: "Ponytail", label: "Ponytail" },
  { value: "Braids", label: "Braids" },
  { value: "Pigtails", label: "Pigtails" },
  { value: "Updo", label: "Updo" },
];

export const MAKEUP_OPTIONS: FaceGeneratorOption[] = [
  { value: "Natural Makeup", label: "Natural Makeup" },
  { value: "Classic Makeup", label: "Classic Makeup" },
  { value: "Dewy Makeup", label: "Dewy Makeup" },
  { value: "Glam Makeup", label: "Glam Makeup" },
  { value: "Party Makeup", label: "Party Makeup" },
  { value: "Vintage Makeup", label: "Vintage Makeup" },
  { value: "Bohemian Makeup", label: "Bohemian Makeup" },
  { value: "Monochromatic Makeup", label: "Monochromatic Makeup" },
];

export const ASPECT_RATIO_OPTIONS: FaceGeneratorOption[] = [
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
];

export const QUALITY_OPTIONS: FaceGeneratorOption[] = [
  { value: "4K", label: "4K" },
];

export const IMAGE_COUNT_OPTIONS: FaceGeneratorOption[] = [
  { value: "1", label: "1 Image" },
  { value: "2", label: "2 Images" },
  { value: "3", label: "3 Images" },
  { value: "4", label: "4 Images" },
];

export const DEFAULT_FACE_GENERATOR_VALUES: FaceGeneratorFormValues = {
  gender: "Female",
  age: "26-35",
  ethnos: "European",
  bodyType: "",
  eyeColor: "",
  hairColor: "",
  hairType: "",
  hairStyle: "",
  makeup: "",
  aspectRatio: "1:1",
  quality: "4K",
  imageCount: 4,
};

export function mergeFaceGeneratorValues(
  partialValues?: Partial<FaceGeneratorFormValues>,
): FaceGeneratorFormValues {
  return {
    ...DEFAULT_FACE_GENERATOR_VALUES,
    ...partialValues,
    imageCount:
      typeof partialValues?.imageCount === "number"
        ? partialValues.imageCount
        : DEFAULT_FACE_GENERATOR_VALUES.imageCount,
  };
}

export function buildFacePrompt(
  partialValues: Partial<FaceGeneratorFormValues>,
  variantIndex = 0,
) {
  const values = mergeFaceGeneratorValues(partialValues);
  const descriptors = [
    `${values.gender.toLowerCase()} adult`,
    values.age ? `age range ${values.age}` : "",
    values.ethnos ? `${values.ethnos.toLowerCase()} heritage` : "",
    values.bodyType ? `${values.bodyType.toLowerCase()} body type` : "",
    values.eyeColor ? `${values.eyeColor.toLowerCase()} eyes` : "",
    values.hairColor ? `${values.hairColor.toLowerCase()} hair` : "",
    values.hairType ? `${values.hairType.toLowerCase()} hair texture` : "",
    values.hairStyle ? `${values.hairStyle.toLowerCase()} hairstyle` : "",
    values.makeup ? `${values.makeup.toLowerCase()}` : "",
  ].filter(Boolean);

  const variantLine =
    values.imageCount > 1
      ? `Create a distinct synthetic identity for variation ${variantIndex + 1}, while keeping all requested attributes consistent.`
      : "Create one distinct synthetic identity that does not resemble a real person.";

  return [
    "Photorealistic AI face portrait, high-detail skin texture, natural facial proportions, clean studio-grade lighting, realistic hair strands, sharp eyes, subtle depth of field.",
    `Subject: ${descriptors.join(", ")}.`,
    "Frame as a polished headshot or tight portrait crop with a neutral, premium commercial aesthetic.",
    "No text, no watermark, no extra limbs, no duplicate face, no collage.",
    variantLine,
  ].join(" ");
}
