import fixedImageToImageLibrary from "@/shared/lib/workbench-template-samples/image-to-image.json";
import photoshootLibrary from "@/shared/lib/workbench-template-samples/photoshoot.json";
import {
  getImageEffectItemsSync,
  getImageEffectRequiredInputCount,
} from "@/shared/lib/image-effect-data";
import { getVideoEffectItemsSync } from "@/shared/lib/video-effect-data";
import editorCombinerLibrarySource from "../../../docs/zencreator-image-editor.full-inference.json";

export type FixedToolLibraryRecord = {
  title: string;
  prompt: string;
  previewUrl: string;
  thumbnailUrl: string;
  generatedUrl: string;
  resultPreviewUrls?: string[];
  previewClipUrl?: string;
  params: Record<string, any>;
};

export type ToolLibraryOverrideDefinition = {
  id: string;
  modelLabel: string;
  mediaType: "image" | "video";
  defaultAspectRatio?: string;
  match: {
    exactToolParams?: string[];
    toolPrefixes?: string[];
    scenePaths?: string[];
    modelUrls?: string[];
  };
  items: FixedToolLibraryRecord[];
};

type EditorCombinerInferenceFile = {
  templates?: Array<{
    index: number;
    original_template_name: string;
    final_generation_prompt: string;
    primary_ref_image_url?: string;
    ref_image_urls?: string[];
    final_image_url?: string;
  }>;
};

export const FIXED_TEXT_TO_IMAGE_LIBRARY: FixedToolLibraryRecord[] = [
  {
    title: "Crimson Cupid Couture",
    prompt:
      "Editorial studio portrait of a stylish young woman posed against a vivid red set with a keyhole-shaped opening revealing a blush pink backdrop. She has sleek lavender hair, a sculpted satin mini dress with floral accents, lace tights, and a white bow with a heart-tipped arrow, lit with crisp high-contrast studio light for a polished fashion-magazine look.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/crimson-cupid-couture-0312c76923cc1db4e5285912f5ad21df.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/crimson-cupid-couture-0312c76923cc1db4e5285912f5ad21df.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/crimson-cupid-couture-0312c76923cc1db4e5285912f5ad21df.png",
    params: {
      prompt:
        "Editorial studio portrait of a stylish young woman posed against a vivid red set with a keyhole-shaped opening revealing a blush pink backdrop. She has sleek lavender hair, a sculpted satin mini dress with floral accents, lace tights, and a white bow with a heart-tipped arrow, lit with crisp high-contrast studio light for a polished fashion-magazine look.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "City After-Dark Muse",
    prompt:
      "Raw nighttime street portrait shot with direct flash, featuring a young blonde woman in a white bandeau, red satin shorts, and an open gray cardigan with a soft fur collar. Dark city surroundings, blurred streetlights, visible skin texture, and a candid nightlife mood with strong highlights and deep shadows.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/city-after-dark-muse-8fce91b7f60b7cb71f3adad800550480.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/city-after-dark-muse-8fce91b7f60b7cb71f3adad800550480.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/city-after-dark-muse-8fce91b7f60b7cb71f3adad800550480.png",
    params: {
      prompt:
        "Raw nighttime street portrait shot with direct flash, featuring a young blonde woman in a white bandeau, red satin shorts, and an open gray cardigan with a soft fur collar. Dark city surroundings, blurred streetlights, visible skin texture, and a candid nightlife mood with strong highlights and deep shadows.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Snow Spa Serenity",
    prompt:
      "Luxury winter lifestyle image of a young woman standing waist-deep in an outdoor hot tub surrounded by snow. She wears a black swimsuit with gold trim and a fluffy white hat, with rising steam, cold daylight, and a relaxed vacation atmosphere captured in a realistic smartphone-photo style.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/snow-spa-serenity-4a371e1d53f72718850e11515843c09e.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/snow-spa-serenity-4a371e1d53f72718850e11515843c09e.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/snow-spa-serenity-4a371e1d53f72718850e11515843c09e.png",
    params: {
      prompt:
        "Luxury winter lifestyle image of a young woman standing waist-deep in an outdoor hot tub surrounded by snow. She wears a black swimsuit with gold trim and a fluffy white hat, with rising steam, cold daylight, and a relaxed vacation atmosphere captured in a realistic smartphone-photo style.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Blonde Hallway Poise",
    prompt:
      "Casual indoor phone photo of a blonde woman standing in a narrow apartment hallway, body angled slightly, one hip shifted, looking upward with a calm confident feel. She wears a fitted pastel pink romper, soft natural makeup, and is framed by white walls and a visible laundry-room doorway.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/blonde-hallway-poise-7010fd8f158b60cdc19b9ec01dff621e.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/blonde-hallway-poise-7010fd8f158b60cdc19b9ec01dff621e.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/blonde-hallway-poise-7010fd8f158b60cdc19b9ec01dff621e.png",
    params: {
      prompt:
        "Casual indoor phone photo of a blonde woman standing in a narrow apartment hallway, body angled slightly, one hip shifted, looking upward with a calm confident feel. She wears a fitted pastel pink romper, soft natural makeup, and is framed by white walls and a visible laundry-room doorway.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Italian Summer Selfie",
    prompt:
      "Close-up bedroom selfie of a young woman lying on light bedding, wearing a fitted blue cropped tank with white trim and 'ITALIA' across the chest. Soft indoor lighting, tousled dark hair, a subtle pout, and a relaxed peace-sign gesture create an intimate, self-assured smartphone snapshot.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/italian-summer-selfie-bdf88edef1858d61e49f10dce8ccc7f6.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/italian-summer-selfie-bdf88edef1858d61e49f10dce8ccc7f6.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/italian-summer-selfie-bdf88edef1858d61e49f10dce8ccc7f6.png",
    params: {
      prompt:
        "Close-up bedroom selfie of a young woman lying on light bedding, wearing a fitted blue cropped tank with white trim and 'ITALIA' across the chest. Soft indoor lighting, tousled dark hair, a subtle pout, and a relaxed peace-sign gesture create an intimate, self-assured smartphone snapshot.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Leather Sofa Glam",
    prompt:
      "Daylit living-room portrait of a woman seated on a white leather sofa, wearing black-rimmed glasses, a black off-shoulder crop top, mini skirt, and sheer thigh-high stockings. Bookshelves in the background and a slightly forward lean give the frame a confident fashion-editorial presence.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/leather-sofa-glam-10f8a39341a97ebbb40d208a27ea0cca.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/leather-sofa-glam-10f8a39341a97ebbb40d208a27ea0cca.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/leather-sofa-glam-10f8a39341a97ebbb40d208a27ea0cca.png",
    params: {
      prompt:
        "Daylit living-room portrait of a woman seated on a white leather sofa, wearing black-rimmed glasses, a black off-shoulder crop top, mini skirt, and sheer thigh-high stockings. Bookshelves in the background and a slightly forward lean give the frame a confident fashion-editorial presence.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Minimal Close Perspective",
    prompt:
      "Very close low-angle lifestyle portrait of a blonde woman in a geometric strapless dress, leaning toward the lens with a neutral expression. Clean bright wall behind her, soft daylight, realistic skin detail, and a minimalist candid feel like a phone photo taken from below.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/minimal-close-perspective-32519ae504a2bf547c2af84e29efe8ed.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/minimal-close-perspective-32519ae504a2bf547c2af84e29efe8ed.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/minimal-close-perspective-32519ae504a2bf547c2af84e29efe8ed.png",
    params: {
      prompt:
        "Very close low-angle lifestyle portrait of a blonde woman in a geometric strapless dress, leaning toward the lens with a neutral expression. Clean bright wall behind her, soft daylight, realistic skin detail, and a minimalist candid feel like a phone photo taken from below.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Cozy Sweatshirt Portrait",
    prompt:
      "Warm indoor lifestyle portrait of a young woman standing by a wooden table in a soft neutral room. She wears an oversized light gray quarter-zip sweatshirt with white fitted shorts, posing casually with one leg bent and a calm off-camera expression under diffused daylight.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cozy-sweatshirt-portrait-e95a782c95d649b4c4a6626a4c9245be.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cozy-sweatshirt-portrait-e95a782c95d649b4c4a6626a4c9245be.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cozy-sweatshirt-portrait-e95a782c95d649b4c4a6626a4c9245be.png",
    params: {
      prompt:
        "Warm indoor lifestyle portrait of a young woman standing by a wooden table in a soft neutral room. She wears an oversized light gray quarter-zip sweatshirt with white fitted shorts, posing casually with one leg bent and a calm off-camera expression under diffused daylight.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Playful Hotel Bed Pose",
    prompt:
      "Natural hotel-bedroom snapshot of a young woman lying on her stomach across white bedding, propped on her elbows and looking at the camera. A white spaghetti-strap top, mint mini skirt, soft window light, and a playful raised-leg pose give the image an intimate but everyday feel.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/playful-hotel-bed-pose-18b6f56e9701e8ad577db7541a4aa333.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/playful-hotel-bed-pose-18b6f56e9701e8ad577db7541a4aa333.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/playful-hotel-bed-pose-18b6f56e9701e8ad577db7541a4aa333.png",
    params: {
      prompt:
        "Natural hotel-bedroom snapshot of a young woman lying on her stomach across white bedding, propped on her elbows and looking at the camera. A white spaghetti-strap top, mint mini skirt, soft window light, and a playful raised-leg pose give the image an intimate but everyday feel.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Billiards Night Icon",
    prompt:
      "Nightlife-inspired flash photo of a woman lounging on a green pool table, dressed in a fitted black sleeveless top and mini skirt. Billiard balls and a cue surround her while overhead flash creates hard shadows, glossy highlights, and a moody late-night bar atmosphere.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/billiards-night-icon-7b933d94969afb62f7bef23698572a22.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/billiards-night-icon-7b933d94969afb62f7bef23698572a22.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/billiards-night-icon-7b933d94969afb62f7bef23698572a22.png",
    params: {
      prompt:
        "Nightlife-inspired flash photo of a woman lounging on a green pool table, dressed in a fitted black sleeveless top and mini skirt. Billiard balls and a cue surround her while overhead flash creates hard shadows, glossy highlights, and a moody late-night bar atmosphere.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Sunlit Shore Gaze",
    prompt:
      "Sunny beach portrait of a young woman reclining in a white metal chair on the sand, one arm raised and one hand shading her eyes. She wears a rust-toned bikini, with warm light, soft shadows, and a calm seaside editorial mood.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunlit-shore-gaze-88bf9c6af0d3f982477796c8b548f835.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunlit-shore-gaze-88bf9c6af0d3f982477796c8b548f835.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunlit-shore-gaze-88bf9c6af0d3f982477796c8b548f835.png",
    params: {
      prompt:
        "Sunny beach portrait of a young woman reclining in a white metal chair on the sand, one arm raised and one hand shading her eyes. She wears a rust-toned bikini, with warm light, soft shadows, and a calm seaside editorial mood.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Resort Glow Pose",
    prompt:
      "Poolside resort photo of a brunette posing in a leopard-print monokini under bright sun. Shot from a dramatic low angle, with tropical details, stone tiles, and palm trees in the background for a bold vacation-fashion look.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/resort-glow-pose-907e0b926259a044ca10ef5c629905e3.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/resort-glow-pose-907e0b926259a044ca10ef5c629905e3.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/resort-glow-pose-907e0b926259a044ca10ef5c629905e3.png",
    params: {
      prompt:
        "Poolside resort photo of a brunette posing in a leopard-print monokini under bright sun. Shot from a dramatic low angle, with tropical details, stone tiles, and palm trees in the background for a bold vacation-fashion look.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Heart Print Dreamframe",
    prompt:
      "Indoor low-angle fashion shot of a woman crouching very close to the camera, one knee pushed toward the lens for strong perspective. She wears a fitted red mini dress with a tiny white heart pattern and red heels, lit with direct flash against a hallway interior.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/heart-print-dreamframe-e5a48d4fc85134b801cdf6f982263678.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/heart-print-dreamframe-e5a48d4fc85134b801cdf6f982263678.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/heart-print-dreamframe-e5a48d4fc85134b801cdf6f982263678.png",
    params: {
      prompt:
        "Indoor low-angle fashion shot of a woman crouching very close to the camera, one knee pushed toward the lens for strong perspective. She wears a fitted red mini dress with a tiny white heart pattern and red heels, lit with direct flash against a hallway interior.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Over-the-Shoulder Allure",
    prompt:
      "Ultra-realistic phone-style image of an ash-blonde woman turning back over her shoulder inside an elegant room with soft daylight and white paneled walls. The frame emphasizes graceful posture, long waves, and a poised, over-the-shoulder gaze.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/over-the-shoulder-allure-b0ae554e654b8a4944eea7fc868bc722.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/over-the-shoulder-allure-b0ae554e654b8a4944eea7fc868bc722.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/over-the-shoulder-allure-b0ae554e654b8a4944eea7fc868bc722.png",
    params: {
      prompt:
        "Ultra-realistic phone-style image of an ash-blonde woman turning back over her shoulder inside an elegant room with soft daylight and white paneled walls. The frame emphasizes graceful posture, long waves, and a poised, over-the-shoulder gaze.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Spotlight Solitude",
    prompt:
      "Minimal studio portrait of a woman seated on the floor in a simple black dress against a gray seamless backdrop. A hard circular spotlight creates dramatic shadows and a contemplative editorial mood with clean composition.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/spotlight-solitude-7572268eb6d07f6a8daa40a06c41789a.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/spotlight-solitude-7572268eb6d07f6a8daa40a06c41789a.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/spotlight-solitude-7572268eb6d07f6a8daa40a06c41789a.png",
    params: {
      prompt:
        "Minimal studio portrait of a woman seated on the floor in a simple black dress against a gray seamless backdrop. A hard circular spotlight creates dramatic shadows and a contemplative editorial mood with clean composition.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Midnight Gas Station Mood",
    prompt:
      "Direct-flash night photo at a gas station, showing a young woman seated on a metal chair under greenish fluorescent canopy lights. The image feels gritty and spontaneous, with hard shadows, urban emptiness, and a moody late-night roadside aesthetic.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/midnight-gas-station-mood-a219d08deca9fa64a477ada0d17e9f54.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/midnight-gas-station-mood-a219d08deca9fa64a477ada0d17e9f54.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/midnight-gas-station-mood-a219d08deca9fa64a477ada0d17e9f54.png",
    params: {
      prompt:
        "Direct-flash night photo at a gas station, showing a young woman seated on a metal chair under greenish fluorescent canopy lights. The image feels gritty and spontaneous, with hard shadows, urban emptiness, and a moody late-night roadside aesthetic.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Backseat Street Cruise",
    prompt:
      "Nighttime car-interior lifestyle shot from a very low angle in the back seat, with oversized sneakers dominating the foreground and beige leather upholstery behind. A young woman poses casually in a streetwear-inspired look, lit like a candid phone photo during a night drive.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/backseat-street-cruise-289f742f71197a1fcf1460eacd9bdcca.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/backseat-street-cruise-289f742f71197a1fcf1460eacd9bdcca.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/backseat-street-cruise-289f742f71197a1fcf1460eacd9bdcca.png",
    params: {
      prompt:
        "Nighttime car-interior lifestyle shot from a very low angle in the back seat, with oversized sneakers dominating the foreground and beige leather upholstery behind. A young woman poses casually in a streetwear-inspired look, lit like a candid phone photo during a night drive.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Leopard Wine Lounge",
    prompt:
      "Moody indoor flash portrait of a woman sitting on the floor near a black quilted sofa and satin curtains, holding a glass of red wine. Leopard-print styling, glossy textures, and dim ambient light mixed with direct flash create a luxe after-hours vibe.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/leopard-wine-lounge-d56f9ad62e748a8adc4415ea840b9136.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/leopard-wine-lounge-d56f9ad62e748a8adc4415ea840b9136.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/leopard-wine-lounge-d56f9ad62e748a8adc4415ea840b9136.png",
    params: {
      prompt:
        "Moody indoor flash portrait of a woman sitting on the floor near a black quilted sofa and satin curtains, holding a glass of red wine. Leopard-print styling, glossy textures, and dim ambient light mixed with direct flash create a luxe after-hours vibe.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Boxing Fury Burst",
    prompt:
      "High-energy flash photo of an athletic young woman kneeling in a boxing stance, oversized red-and-white gloves raised as she shouts with intensity. The pose is aggressive and dynamic, with realistic gym-floor texture and a bold training-camp mood.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/boxing-fury-burst-11e383c74b190cf3e74adf2d4e5ba770.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/boxing-fury-burst-11e383c74b190cf3e74adf2d4e5ba770.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/boxing-fury-burst-11e383c74b190cf3e74adf2d4e5ba770.png",
    params: {
      prompt:
        "High-energy flash photo of an athletic young woman kneeling in a boxing stance, oversized red-and-white gloves raised as she shouts with intensity. The pose is aggressive and dynamic, with realistic gym-floor texture and a bold training-camp mood.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Marble Vanity Glam",
    prompt:
      "Close smartphone portrait in a luxury bathroom featuring a woman with long dark hair, polished makeup, and a composed confident expression. Marble surfaces, soft reflections, and a slightly low angle give the frame a modern upscale aesthetic.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/marble-vanity-glam-179e9442a4b209d009e44d1d634d21e4.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/marble-vanity-glam-179e9442a4b209d009e44d1d634d21e4.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/marble-vanity-glam-179e9442a4b209d009e44d1d634d21e4.png",
    params: {
      prompt:
        "Close smartphone portrait in a luxury bathroom featuring a woman with long dark hair, polished makeup, and a composed confident expression. Marble surfaces, soft reflections, and a slightly low angle give the frame a modern upscale aesthetic.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Rooftop City Joy",
    prompt:
      "Rooftop parking-lot portrait at night with a glowing city skyline in the distance. A young woman smiles under cool flash and ambient urban light, creating an open-air but intimate city-night atmosphere.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/rooftop-city-joy-0dc3f403aba28a906102169c57dfd598.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/rooftop-city-joy-0dc3f403aba28a906102169c57dfd598.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/rooftop-city-joy-0dc3f403aba28a906102169c57dfd598.png",
    params: {
      prompt:
        "Rooftop parking-lot portrait at night with a glowing city skyline in the distance. A young woman smiles under cool flash and ambient urban light, creating an open-air but intimate city-night atmosphere.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Framed by Fingers",
    prompt:
      "Extreme wide-angle close-up of a young woman leaning toward the camera with both hands stretched forward, palms nearly touching the lens. The upward perspective creates playful distortion, drawing focus to her face through a frame of fingers.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/framed-by-fingers-a0d5b530ff909b239423de708652d744.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/framed-by-fingers-a0d5b530ff909b239423de708652d744.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/framed-by-fingers-a0d5b530ff909b239423de708652d744.png",
    params: {
      prompt:
        "Extreme wide-angle close-up of a young woman leaning toward the camera with both hands stretched forward, palms nearly touching the lens. The upward perspective creates playful distortion, drawing focus to her face through a frame of fingers.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Skyline Upward Stare",
    prompt:
      "Dramatic ground-level portrait shot upward toward a woman standing above the lens beneath a bright blue sky with soft clouds. The perspective feels bold and cinematic, with confident eye contact and strong vertical composition.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/skyline-upward-stare-fc74e53a462720e440f7b1789995f64d.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/skyline-upward-stare-fc74e53a462720e440f7b1789995f64d.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/skyline-upward-stare-fc74e53a462720e440f7b1789995f64d.png",
    params: {
      prompt:
        "Dramatic ground-level portrait shot upward toward a woman standing above the lens beneath a bright blue sky with soft clouds. The perspective feels bold and cinematic, with confident eye contact and strong vertical composition.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Laundromat Cool",
    prompt:
      "Candid laundromat photo of a young woman kneeling between industrial washing machines, one hand on her knee and the other relaxed by her side. Fluorescent indoor light, dark flooring, and a composed direct gaze create a clean urban lifestyle scene.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/laundromat-cool-16df19e877d5968ee26d19a81ec94593.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/laundromat-cool-16df19e877d5968ee26d19a81ec94593.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/laundromat-cool-16df19e877d5968ee26d19a81ec94593.png",
    params: {
      prompt:
        "Candid laundromat photo of a young woman kneeling between industrial washing machines, one hand on her knee and the other relaxed by her side. Fluorescent indoor light, dark flooring, and a composed direct gaze create a clean urban lifestyle scene.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Emerald Lounge Muse",
    prompt:
      "Casual glam portrait of a woman with long dark wavy hair seated in a rich emerald-green lounge setting. Soft natural makeup, realistic skin texture, and intimate framing give it a polished lifestyle-magazine feel.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/emerald-lounge-muse-ecb140f04850977db34463002db6a7ea.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/emerald-lounge-muse-ecb140f04850977db34463002db6a7ea.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/emerald-lounge-muse-ecb140f04850977db34463002db6a7ea.png",
    params: {
      prompt:
        "Casual glam portrait of a woman with long dark wavy hair seated in a rich emerald-green lounge setting. Soft natural makeup, realistic skin texture, and intimate framing give it a polished lifestyle-magazine feel.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Midnight Bathroom Luxe",
    prompt:
      "Close, slightly low-angle smartphone shot of a woman standing in a sleek bathroom at night, surrounded by glossy modern finishes. Straight dark hair, calm confidence, and upscale ambient lighting create a premium social-photo aesthetic.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/midnight-bathroom-luxe-b6335377fdf1f9660dfc3c928c9b7c59.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/midnight-bathroom-luxe-b6335377fdf1f9660dfc3c928c9b7c59.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/midnight-bathroom-luxe-b6335377fdf1f9660dfc3c928c9b7c59.png",
    params: {
      prompt:
        "Close, slightly low-angle smartphone shot of a woman standing in a sleek bathroom at night, surrounded by glossy modern finishes. Straight dark hair, calm confidence, and upscale ambient lighting create a premium social-photo aesthetic.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Cocktail Hour Siren",
    prompt:
      "Low-angle bar portrait of a glamorous woman seated in an upscale evening restaurant, with rich brown hair, elegant styling, and moody nightlife lighting. The composition looks upward toward her for a dramatic cocktail-hour fashion feel.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cocktail-hour-siren-1a33be87e743b57c22625954594744e7.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cocktail-hour-siren-1a33be87e743b57c22625954594744e7.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cocktail-hour-siren-1a33be87e743b57c22625954594744e7.png",
    params: {
      prompt:
        "Low-angle bar portrait of a glamorous woman seated in an upscale evening restaurant, with rich brown hair, elegant styling, and moody nightlife lighting. The composition looks upward toward her for a dramatic cocktail-hour fashion feel.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Night Pavement Attitude",
    prompt:
      "Nighttime urban fashion image of a woman squatting on a city sidewalk near a softly lit historic building. Streetlights, smartphone realism, and a grounded pose create a stylish late-night downtown mood.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/night-pavement-attitude-3a2f79e7f20e78e87fd791f415a4c483.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/night-pavement-attitude-3a2f79e7f20e78e87fd791f415a4c483.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/night-pavement-attitude-3a2f79e7f20e78e87fd791f415a4c483.png",
    params: {
      prompt:
        "Nighttime urban fashion image of a woman squatting on a city sidewalk near a softly lit historic building. Streetlights, smartphone realism, and a grounded pose create a stylish late-night downtown mood.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Low-Angle Sofa Scene",
    prompt:
      "Low-angle close phone photo of a woman sitting on a beige textured sofa in a bright apartment, leaning back with relaxed confidence. The foreground perspective and natural indoor light make it feel like an intimate, candid home snapshot.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/low-angle-sofa-scene-bcc2a6974a696f5b04da5547f12a9799.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/low-angle-sofa-scene-bcc2a6974a696f5b04da5547f12a9799.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/low-angle-sofa-scene-bcc2a6974a696f5b04da5547f12a9799.png",
    params: {
      prompt:
        "Low-angle close phone photo of a woman sitting on a beige textured sofa in a bright apartment, leaning back with relaxed confidence. The foreground perspective and natural indoor light make it feel like an intimate, candid home snapshot.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Corner Store Flash Run",
    prompt:
      "Direct-flash grocery-store portrait taken in a narrow snack aisle at night, with warm fluorescent light and crisp shadows. A young woman poses casually between shelves, giving the frame a spontaneous convenience-store fashion energy.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/corner-store-flash-run-ae56b2eb78b7ee6b13b7de9be2b9a04c.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/corner-store-flash-run-ae56b2eb78b7ee6b13b7de9be2b9a04c.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/corner-store-flash-run-ae56b2eb78b7ee6b13b7de9be2b9a04c.png",
    params: {
      prompt:
        "Direct-flash grocery-store portrait taken in a narrow snack aisle at night, with warm fluorescent light and crisp shadows. A young woman poses casually between shelves, giving the frame a spontaneous convenience-store fashion energy.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "After-Hours Fridge Run",
    prompt:
      "Nighttime kitchen floor snapshot of a woman sitting in front of an open refrigerator, lit by hard flash and the cool fridge glow. The mood is candid and slightly messy, like an authentic late-night snack run at home.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/after-hours-fridge-run-af4298af31b5c7a01ad5d17e4a136246.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/after-hours-fridge-run-af4298af31b5c7a01ad5d17e4a136246.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/after-hours-fridge-run-af4298af31b5c7a01ad5d17e4a136246.png",
    params: {
      prompt:
        "Nighttime kitchen floor snapshot of a woman sitting in front of an open refrigerator, lit by hard flash and the cool fridge glow. The mood is candid and slightly messy, like an authentic late-night snack run at home.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Holiday Mirror Moment",
    prompt:
      "Mirror selfie of a slim brunette in a matching gray ribbed halter set, hair in a loose high bun, taken in a bright bedroom with holiday-at-home energy. The framing feels casual and personal, like a confident seasonal phone snapshot.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/holiday-mirror-moment-29f517a8fe04e85e5e4a340f888dd5ac.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/holiday-mirror-moment-29f517a8fe04e85e5e4a340f888dd5ac.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/holiday-mirror-moment-29f517a8fe04e85e5e4a340f888dd5ac.png",
    params: {
      prompt:
        "Mirror selfie of a slim brunette in a matching gray ribbed halter set, hair in a loose high bun, taken in a bright bedroom with holiday-at-home energy. The framing feels casual and personal, like a confident seasonal phone snapshot.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Olive Casual Lift",
    prompt:
      "Low-angle indoor fashion portrait with oversized white sneakers in the foreground and a neutral sofa behind. The subject wears an olive-toned casual outfit in a minimalist room, creating a clean everyday streetwear look.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/olive-casual-lift-2197a5a84a46d100dd4dc9c499f16878.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/olive-casual-lift-2197a5a84a46d100dd4dc9c499f16878.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/olive-casual-lift-2197a5a84a46d100dd4dc9c499f16878.png",
    params: {
      prompt:
        "Low-angle indoor fashion portrait with oversized white sneakers in the foreground and a neutral sofa behind. The subject wears an olive-toned casual outfit in a minimalist room, creating a clean everyday streetwear look.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Floor-Level Fashion Portrait",
    prompt:
      "Studio portrait of a young woman seated on the floor against a warm beige backdrop, captured from a low wide angle that emphasizes her red canvas sneakers. The overall mood is relaxed, graphic, and fashion-forward.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/floor-level-fashion-portrait-43ecc8263e0a4a8f9169fe78ee6d2731.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/floor-level-fashion-portrait-43ecc8263e0a4a8f9169fe78ee6d2731.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/floor-level-fashion-portrait-43ecc8263e0a4a8f9169fe78ee6d2731.png",
    params: {
      prompt:
        "Studio portrait of a young woman seated on the floor against a warm beige backdrop, captured from a low wide angle that emphasizes her red canvas sneakers. The overall mood is relaxed, graphic, and fashion-forward.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Velvet Floor Perspective",
    prompt:
      "Bright indoor selfie-style image of a woman sitting close to the lens on a white fluffy rug, dark hair pulled back with a headband. Soft daylight and a cozy modern room make the scene feel playful and personal.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-floor-perspective-86dabf78ed12a5b6a9269384dcf04f4a.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-floor-perspective-86dabf78ed12a5b6a9269384dcf04f4a.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-floor-perspective-86dabf78ed12a5b6a9269384dcf04f4a.png",
    params: {
      prompt:
        "Bright indoor selfie-style image of a woman sitting close to the lens on a white fluffy rug, dark hair pulled back with a headband. Soft daylight and a cozy modern room make the scene feel playful and personal.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Skate Motion Darling",
    prompt:
      "Dynamic overhead selfie of a young woman riding a skateboard on smooth pavement in daylight. Motion in the ground, a steady face, and a sporty casual outfit give the frame energy without losing a natural outdoor feel.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/skate-motion-darling-22b9904e18602feb26f8369f4a698737.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/skate-motion-darling-22b9904e18602feb26f8369f4a698737.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/skate-motion-darling-22b9904e18602feb26f8369f4a698737.png",
    params: {
      prompt:
        "Dynamic overhead selfie of a young woman riding a skateboard on smooth pavement in daylight. Motion in the ground, a steady face, and a sporty casual outfit give the frame energy without losing a natural outdoor feel.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Convenience Cola Stop",
    prompt:
      "Convenience-store fashion photo in front of a refrigerator wall filled with colorful drinks. Bright cool fridge light, a candid shopping pose, and subtle grain create a realistic late-night errand vibe.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/convenience-cola-stop-49f226918b199eb09566a0964e82df9b.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/convenience-cola-stop-49f226918b199eb09566a0964e82df9b.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/convenience-cola-stop-49f226918b199eb09566a0964e82df9b.png",
    params: {
      prompt:
        "Convenience-store fashion photo in front of a refrigerator wall filled with colorful drinks. Bright cool fridge light, a candid shopping pose, and subtle grain create a realistic late-night errand vibe.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Athletic Studio Contour",
    prompt:
      "Minimal fashion-studio image of a woman lying diagonally across the floor against a soft gray seamless background. Her pose feels flexible and sculptural, blending athletic grace with clean editorial styling.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/athletic-studio-contour-4e70cb9ef7ce41a948dc00b533d44bab.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/athletic-studio-contour-4e70cb9ef7ce41a948dc00b533d44bab.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/athletic-studio-contour-4e70cb9ef7ce41a948dc00b533d44bab.png",
    params: {
      prompt:
        "Minimal fashion-studio image of a woman lying diagonally across the floor against a soft gray seamless background. Her pose feels flexible and sculptural, blending athletic grace with clean editorial styling.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Stringlight Pasta Flirt",
    prompt:
      "Warm outdoor restaurant snapshot at night with string lights overhead and direct flash on the subject. A young woman sits at the table with pasta and a playful expression, creating a romantic yet candid dinner-scene atmosphere.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/stringlight-pasta-flirt-a3f514b841a9d574d4a215372d7bacc0.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/stringlight-pasta-flirt-a3f514b841a9d574d4a215372d7bacc0.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/stringlight-pasta-flirt-a3f514b841a9d574d4a215372d7bacc0.png",
    params: {
      prompt:
        "Warm outdoor restaurant snapshot at night with string lights overhead and direct flash on the subject. A young woman sits at the table with pasta and a playful expression, creating a romantic yet candid dinner-scene atmosphere.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Scarlet Swimsuit Editorial",
    prompt:
      "Minimalist studio fashion portrait of a woman seated on the floor in a red swimsuit, one leg folded and the other angled outward. Clean backdrop, elegant posture, and polished directional light make it feel like a modern campaign image.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/scarlet-swimsuit-editorial-71dc1b4d5575afcf5c8523f620fc5d77.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/scarlet-swimsuit-editorial-71dc1b4d5575afcf5c8523f620fc5d77.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/scarlet-swimsuit-editorial-71dc1b4d5575afcf5c8523f620fc5d77.png",
    params: {
      prompt:
        "Minimalist studio fashion portrait of a woman seated on the floor in a red swimsuit, one leg folded and the other angled outward. Clean backdrop, elegant posture, and polished directional light make it feel like a modern campaign image.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Snakeskin Industrial Edge",
    prompt:
      "Low-angle outdoor lifestyle photo of a confident woman standing near a simple industrial building under a blue sky. She wears loose blue jeans and a fitted snake-print top, with light wind in her dark curls and natural late-afternoon sunlight.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/snakeskin-industrial-edge-7ba397efe75da1a8a70214515b785a76.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/snakeskin-industrial-edge-7ba397efe75da1a8a70214515b785a76.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/snakeskin-industrial-edge-7ba397efe75da1a8a70214515b785a76.png",
    params: {
      prompt:
        "Low-angle outdoor lifestyle photo of a confident woman standing near a simple industrial building under a blue sky. She wears loose blue jeans and a fitted snake-print top, with light wind in her dark curls and natural late-afternoon sunlight.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Vertical Flex Energy",
    prompt:
      "Gym lifestyle selfie of an athletic blonde woman performing an extreme high-leg stretch on a cable machine. Soft daylight mixes with gym lighting, highlighting toned abs, a white sports bra, gray leggings, and a focused expression in a dynamic close-angle composition.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/vertical-flex-energy-05737871a54eb2153ae8f4677c44d74d.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/vertical-flex-energy-05737871a54eb2153ae8f4677c44d74d.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/vertical-flex-energy-05737871a54eb2153ae8f4677c44d74d.png",
    params: {
      prompt:
        "Gym lifestyle selfie of an athletic blonde woman performing an extreme high-leg stretch on a cable machine. Soft daylight mixes with gym lighting, highlighting toned abs, a white sports bra, gray leggings, and a focused expression in a dynamic close-angle composition.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Diner Sass Close-Up",
    prompt:
      "Close flash-lit diner portrait of a woman seated at a small metal table with a bowl of noodles and chopsticks in hand. Posters crowd the wall behind her while her exaggerated annoyed expression gives the image a playful, gritty restaurant-night personality.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/diner-sass-close-up-9a574713cd7144eb129d29f0be02780b.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/diner-sass-close-up-9a574713cd7144eb129d29f0be02780b.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/diner-sass-close-up-9a574713cd7144eb129d29f0be02780b.png",
    params: {
      prompt:
        "Close flash-lit diner portrait of a woman seated at a small metal table with a bowl of noodles and chopsticks in hand. Posters crowd the wall behind her while her exaggerated annoyed expression gives the image a playful, gritty restaurant-night personality.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Violet Tension Portrait",
    prompt:
      "Extreme close-up selfie under saturated purple and pink LED light, focused on a woman’s glossy lips, intense eyes, and one hand pressed into her hair. The lighting feels private, electric, and emotionally charged, with beauty-editorial precision.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/violet-tension-portrait-2099e6dbf66219f21c16c4c475b40a83.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/violet-tension-portrait-2099e6dbf66219f21c16c4c475b40a83.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/violet-tension-portrait-2099e6dbf66219f21c16c4c475b40a83.png",
    params: {
      prompt:
        "Extreme close-up selfie under saturated purple and pink LED light, focused on a woman’s glossy lips, intense eyes, and one hand pressed into her hair. The lighting feels private, electric, and emotionally charged, with beauty-editorial precision.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Cozy Foot-Forward Play",
    prompt:
      "Playful bedroom phone photo taken from the foot of the bed, with a young blonde woman leaning against a tufted headboard and her crossed feet close to the lens. Warm bedside lighting, denim, mesh top, and a smile create a relaxed homey mood.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cozy-foot-forward-play-13eef456ec1e65182b4232328cb7bbb3.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cozy-foot-forward-play-13eef456ec1e65182b4232328cb7bbb3.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cozy-foot-forward-play-13eef456ec1e65182b4232328cb7bbb3.png",
    params: {
      prompt:
        "Playful bedroom phone photo taken from the foot of the bed, with a young blonde woman leaning against a tufted headboard and her crossed feet close to the lens. Warm bedside lighting, denim, mesh top, and a smile create a relaxed homey mood.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Kitchen Counterline Pose",
    prompt:
      "Bright kitchen lifestyle image of a woman leaning forward over a speckled island countertop, body angled in a casual editorial pose. She wears a fitted white mini dress and sheer thigh-high socks, with soft daylight and realistic detail throughout the space.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/kitchen-counterline-pose-79f8c44971bc700edca7631d75748518.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/kitchen-counterline-pose-79f8c44971bc700edca7631d75748518.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/kitchen-counterline-pose-79f8c44971bc700edca7631d75748518.png",
    params: {
      prompt:
        "Bright kitchen lifestyle image of a woman leaning forward over a speckled island countertop, body angled in a casual editorial pose. She wears a fitted white mini dress and sheer thigh-high socks, with soft daylight and realistic detail throughout the space.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Red Accent Muse",
    prompt:
      "Stylish living-room portrait of a woman seated close to the camera on a quilted sofa, holding black-rimmed glasses with red manicured nails. A white lace top, shiny red mini skirt, and matching heels tie together the bold color story under clean daylight.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/red-accent-muse-c325802bd2ee059c39cf459dcf5eac69.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/red-accent-muse-c325802bd2ee059c39cf459dcf5eac69.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/red-accent-muse-c325802bd2ee059c39cf459dcf5eac69.png",
    params: {
      prompt:
        "Stylish living-room portrait of a woman seated close to the camera on a quilted sofa, holding black-rimmed glasses with red manicured nails. A white lace top, shiny red mini skirt, and matching heels tie together the bold color story under clean daylight.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Sunny Cafe Charm",
    prompt:
      "Sunny outdoor cafe portrait of a smiling young woman sitting in a teal chair beside a matching table. She wears a red crop top, black mini skirt, and red fishnets, lit by bright natural sunlight for a cheerful patio lifestyle look.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunny-cafe-charm-cff8f4d1165964b5f9de37b30e02cfb7.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunny-cafe-charm-cff8f4d1165964b5f9de37b30e02cfb7.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunny-cafe-charm-cff8f4d1165964b5f9de37b30e02cfb7.png",
    params: {
      prompt:
        "Sunny outdoor cafe portrait of a smiling young woman sitting in a teal chair beside a matching table. She wears a red crop top, black mini skirt, and red fishnets, lit by bright natural sunlight for a cheerful patio lifestyle look.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Homegrown Cowgirl Chic",
    prompt:
      "Indoor western-inspired fashion portrait of a blonde woman with two thick braids and a large black cowboy hat. Black low-cut top, gray jeans, white furnishings in the background, and natural window light create a home-styled cowgirl aesthetic.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/homegrown-cowgirl-chic-83a377f4ac531975fc3c3fe62c62e5c6.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/homegrown-cowgirl-chic-83a377f4ac531975fc3c3fe62c62e5c6.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/homegrown-cowgirl-chic-83a377f4ac531975fc3c3fe62c62e5c6.png",
    params: {
      prompt:
        "Indoor western-inspired fashion portrait of a blonde woman with two thick braids and a large black cowboy hat. Black low-cut top, gray jeans, white furnishings in the background, and natural window light create a home-styled cowgirl aesthetic.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Cherry Cream Fantasy",
    prompt:
      "Surreal fashion-studio image of a glamorous woman seated inside an oversized cupcake wrapper, wearing a sculptural white dress with whipped-cream texture. Bright blue backdrop, glossy cherries, and crisp studio lighting make it feel like a luxury dessert campaign.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cherry-cream-fantasy-74e2acd820c7bb7f86039fd1bce82b61.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cherry-cream-fantasy-74e2acd820c7bb7f86039fd1bce82b61.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cherry-cream-fantasy-74e2acd820c7bb7f86039fd1bce82b61.png",
    params: {
      prompt:
        "Surreal fashion-studio image of a glamorous woman seated inside an oversized cupcake wrapper, wearing a sculptural white dress with whipped-cream texture. Bright blue backdrop, glossy cherries, and crisp studio lighting make it feel like a luxury dessert campaign.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Fridge Light Milk Break",
    prompt:
      "Late-night kitchen snapshot of a blonde woman kneeling by an open refrigerator and drinking from a large milk jug. She wears a white crop top and light blue shorts, with fridge light and direct flash creating a raw playful midnight-snack mood.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/fridge-light-milk-break-76064bdb31520f7518e186aa1f73869e.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/fridge-light-milk-break-76064bdb31520f7518e186aa1f73869e.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/fridge-light-milk-break-76064bdb31520f7518e186aa1f73869e.png",
    params: {
      prompt:
        "Late-night kitchen snapshot of a blonde woman kneeling by an open refrigerator and drinking from a large milk jug. She wears a white crop top and light blue shorts, with fridge light and direct flash creating a raw playful midnight-snack mood.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Velvet Valentine Pose",
    prompt:
      "Professional studio portrait of a woman posing close to the camera on a platform draped in rich red satin. One leg extends downward while the other is bent, giving the composition a graceful Valentine-inspired editorial silhouette.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-valentine-pose-4e2d49eec4c89891b18bcf3b8a52a950.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-valentine-pose-4e2d49eec4c89891b18bcf3b8a52a950.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-valentine-pose-4e2d49eec4c89891b18bcf3b8a52a950.png",
    params: {
      prompt:
        "Professional studio portrait of a woman posing close to the camera on a platform draped in rich red satin. One leg extends downward while the other is bent, giving the composition a graceful Valentine-inspired editorial silhouette.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Diner Date Offering",
    prompt:
      "Warm diner-style restaurant portrait with subtle neon in the background, showing a young woman leaning toward the camera in a cozy booth setting. The frame feels affectionate and candid, like a playful moment captured mid-meal.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/diner-date-offering-987ed32fcd297f63bf9a3aaf331c3477.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/diner-date-offering-987ed32fcd297f63bf9a3aaf331c3477.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/diner-date-offering-987ed32fcd297f63bf9a3aaf331c3477.png",
    params: {
      prompt:
        "Warm diner-style restaurant portrait with subtle neon in the background, showing a young woman leaning toward the camera in a cozy booth setting. The frame feels affectionate and candid, like a playful moment captured mid-meal.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Retro Hall Flash",
    prompt:
      "Grainy flash photo of a woman standing in a narrow hallway with plain walls and an EXIT sign glowing in the background. The image channels a retro candid aesthetic with direct light, soft noise, and understated attitude.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/retro-hall-flash-6ad02a9f089892f767b4836f0f0a5876.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/retro-hall-flash-6ad02a9f089892f767b4836f0f0a5876.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/retro-hall-flash-6ad02a9f089892f767b4836f0f0a5876.png",
    params: {
      prompt:
        "Grainy flash photo of a woman standing in a narrow hallway with plain walls and an EXIT sign glowing in the background. The image channels a retro candid aesthetic with direct light, soft noise, and understated attitude.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Dreamcloud Reverie",
    prompt:
      "Dreamlike studio portrait of a woman lying on her stomach among fluffy artificial clouds, legs bent upward and hands near her face. Soft styling, calm expression, and a whimsical set design create an airy fantasy-fashion scene.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/dreamcloud-reverie-22fb837b90d69b866bfaefbee310d800.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/dreamcloud-reverie-22fb837b90d69b866bfaefbee310d800.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/dreamcloud-reverie-22fb837b90d69b866bfaefbee310d800.png",
    params: {
      prompt:
        "Dreamlike studio portrait of a woman lying on her stomach among fluffy artificial clouds, legs bent upward and hands near her face. Soft styling, calm expression, and a whimsical set design create an airy fantasy-fashion scene.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Cherry Pop Elegance",
    prompt:
      "Bright full-body studio image of a woman leaning forward with both hands resting on an oversized glossy cherry sculpture. A pale blue seamless background and crisp fashion lighting give the shot a playful pop-editorial feel.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cherry-pop-elegance-4266df3319f6e0fbc77ae888c3c6e519.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cherry-pop-elegance-4266df3319f6e0fbc77ae888c3c6e519.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/cherry-pop-elegance-4266df3319f6e0fbc77ae888c3c6e519.png",
    params: {
      prompt:
        "Bright full-body studio image of a woman leaning forward with both hands resting on an oversized glossy cherry sculpture. A pale blue seamless background and crisp fashion lighting give the shot a playful pop-editorial feel.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Black Balloon Empress",
    prompt:
      "Dark studio fashion portrait of a woman in side profile holding a cluster of black balloons, then turning her head back toward the camera. The black-on-black styling, sculptural pose, and moody light create a sleek party-editorial atmosphere.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/black-balloon-empress-6a81cb9d0a09823a337080e7e039648c.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/black-balloon-empress-6a81cb9d0a09823a337080e7e039648c.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/black-balloon-empress-6a81cb9d0a09823a337080e7e039648c.png",
    params: {
      prompt:
        "Dark studio fashion portrait of a woman in side profile holding a cluster of black balloons, then turning her head back toward the camera. The black-on-black styling, sculptural pose, and moody light create a sleek party-editorial atmosphere.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Golden Cherry Glow",
    prompt:
      "Very low-angle close selfie with warm indoor decorative lighting and soft golden lens flares in the background. The subject’s face fills the frame with dramatic perspective, intimate smartphone realism, and a playful beauty-focused vibe.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/golden-cherry-glow-9f475f5a3dc9953be0f0f69a19dfb06e.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/golden-cherry-glow-9f475f5a3dc9953be0f0f69a19dfb06e.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/golden-cherry-glow-9f475f5a3dc9953be0f0f69a19dfb06e.png",
    params: {
      prompt:
        "Very low-angle close selfie with warm indoor decorative lighting and soft golden lens flares in the background. The subject’s face fills the frame with dramatic perspective, intimate smartphone realism, and a playful beauty-focused vibe.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Playful Studio Kick",
    prompt:
      "Clean white studio image of a fit young woman lying on her back on a seamless floor, one leg raised high while one hand holds her sneaker. The pose feels sporty and mischievous, with crisp light and minimal styling.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/playful-studio-kick-17e43af4bb16a3bde6f6dd37ce2843fc.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/playful-studio-kick-17e43af4bb16a3bde6f6dd37ce2843fc.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/playful-studio-kick-17e43af4bb16a3bde6f6dd37ce2843fc.png",
    params: {
      prompt:
        "Clean white studio image of a fit young woman lying on her back on a seamless floor, one leg raised high while one hand holds her sneaker. The pose feels sporty and mischievous, with crisp light and minimal styling.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Curled Chair Comfort",
    prompt:
      "Warm indoor smartphone-style portrait of a young woman curled into a cozy chair in a softly lit room. Natural window light, gentle shadows, and a compact folded pose create an intimate everyday-luxury feel.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/curled-chair-comfort-02b00c4d1f74fc3ecdc3f49f424a6619.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/curled-chair-comfort-02b00c4d1f74fc3ecdc3f49f424a6619.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/curled-chair-comfort-02b00c4d1f74fc3ecdc3f49f424a6619.png",
    params: {
      prompt:
        "Warm indoor smartphone-style portrait of a young woman curled into a cozy chair in a softly lit room. Natural window light, gentle shadows, and a compact folded pose create an intimate everyday-luxury feel.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Sunfield Relaxed Pose",
    prompt:
      "Low-angle smartphone portrait of a woman seated on dry golden grass in an open sunny field. She leans back on her hands with relaxed posture, while warm light and realistic outdoor texture make the image feel breezy and natural.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunfield-relaxed-pose-cc883ca9ac7862f5793375c727554f47.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunfield-relaxed-pose-cc883ca9ac7862f5793375c727554f47.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunfield-relaxed-pose-cc883ca9ac7862f5793375c727554f47.png",
    params: {
      prompt:
        "Low-angle smartphone portrait of a woman seated on dry golden grass in an open sunny field. She leans back on her hands with relaxed posture, while warm light and realistic outdoor texture make the image feel breezy and natural.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Lavender Dusk Bloom",
    prompt:
      "Elegant dusk portrait of a woman standing in a wide purple flower field, body turned slightly while facing the camera. The scene glows with soft evening light, smooth dark hair, and a calm romantic atmosphere.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/lavender-dusk-bloom-2d22f0854572cb9afc35c30c9a2259b7.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/lavender-dusk-bloom-2d22f0854572cb9afc35c30c9a2259b7.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/lavender-dusk-bloom-2d22f0854572cb9afc35c30c9a2259b7.png",
    params: {
      prompt:
        "Elegant dusk portrait of a woman standing in a wide purple flower field, body turned slightly while facing the camera. The scene glows with soft evening light, smooth dark hair, and a calm romantic atmosphere.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Soft Chair Stillness",
    prompt:
      "Casual lifestyle portrait of a young woman with long light-brown waves sitting comfortably in a chair, facing the camera with a soft neutral expression. Realistic skin detail and relaxed home styling keep the image natural and approachable.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/soft-chair-stillness-c397f2bc2ee54447262f9f8ba1087933.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/soft-chair-stillness-c397f2bc2ee54447262f9f8ba1087933.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/soft-chair-stillness-c397f2bc2ee54447262f9f8ba1087933.png",
    params: {
      prompt:
        "Casual lifestyle portrait of a young woman with long light-brown waves sitting comfortably in a chair, facing the camera with a soft neutral expression. Realistic skin detail and relaxed home styling keep the image natural and approachable.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Home Kitchen Charm",
    prompt:
      "Friendly home-kitchen lifestyle shot of a young woman with straight dark hair and bright blue eyes, smiling softly toward the camera. Real appliances, daylight, and lived-in details give the frame an authentic domestic warmth.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/home-kitchen-charm-587275ddb4fa9c2f20eac48f08d8bf4f.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/home-kitchen-charm-587275ddb4fa9c2f20eac48f08d8bf4f.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/home-kitchen-charm-587275ddb4fa9c2f20eac48f08d8bf4f.png",
    params: {
      prompt:
        "Friendly home-kitchen lifestyle shot of a young woman with straight dark hair and bright blue eyes, smiling softly toward the camera. Real appliances, daylight, and lived-in details give the frame an authentic domestic warmth.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Neutral Power Stance",
    prompt:
      "Low-angle outdoor smartphone portrait of a stylish woman in soft beige tones, standing with a strong fashion stance under natural daylight. Slight film grain and grounded perspective give it a modern editorial street look.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/neutral-power-stance-9b041484bda24f7ef52ac73a5f811d79.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/neutral-power-stance-9b041484bda24f7ef52ac73a5f811d79.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/neutral-power-stance-9b041484bda24f7ef52ac73a5f811d79.png",
    params: {
      prompt:
        "Low-angle outdoor smartphone portrait of a stylish woman in soft beige tones, standing with a strong fashion stance under natural daylight. Slight film grain and grounded perspective give it a modern editorial street look.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Soft Dawn Stretch",
    prompt:
      "Soft morning lifestyle image of a young woman stretching with eyes closed, long dark hair falling over one shoulder. Gentle daylight, relaxed posture, and subtle skin texture create a peaceful just-woke-up mood.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/soft-dawn-stretch-74a7b8bb88b3419e8fae1f7a83112615.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/soft-dawn-stretch-74a7b8bb88b3419e8fae1f7a83112615.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/soft-dawn-stretch-74a7b8bb88b3419e8fae1f7a83112615.png",
    params: {
      prompt:
        "Soft morning lifestyle image of a young woman stretching with eyes closed, long dark hair falling over one shoulder. Gentle daylight, relaxed posture, and subtle skin texture create a peaceful just-woke-up mood.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Tequila Lounge Flash",
    prompt:
      "Close nightlife flash portrait in a dim lounge, showing a young woman raising a tequila shot under warm ambient bar light. The sharp frontal flash, crisp shadows, and candid expression create a spontaneous party-scene energy.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/tequila-lounge-flash-293aca05c8d04a43439a33f44fa3da21.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/tequila-lounge-flash-293aca05c8d04a43439a33f44fa3da21.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/tequila-lounge-flash-293aca05c8d04a43439a33f44fa3da21.png",
    params: {
      prompt:
        "Close nightlife flash portrait in a dim lounge, showing a young woman raising a tequila shot under warm ambient bar light. The sharp frontal flash, crisp shadows, and candid expression create a spontaneous party-scene energy.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Industrial Staircase Editorial",
    prompt:
      "Top-down urban fashion photo of a woman lying across a worn industrial metal staircase. Reddish-brown steps, dark railings, and moody cinematic grading create a gritty editorial composition with strong geometry.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/industrial-staircase-editorial-b3f4af24bd2ac203fa61d54acf9339b7.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/industrial-staircase-editorial-b3f4af24bd2ac203fa61d54acf9339b7.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/industrial-staircase-editorial-b3f4af24bd2ac203fa61d54acf9339b7.png",
    params: {
      prompt:
        "Top-down urban fashion photo of a woman lying across a worn industrial metal staircase. Reddish-brown steps, dark railings, and moody cinematic grading create a gritty editorial composition with strong geometry.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Sunstripe Floor Angle",
    prompt:
      "Indoor low-angle portrait shaped by dramatic window light and deep shadows across a warm wooden floor. A glamorous woman poses near the lens while sunlight creates bold stripes and a moody late-afternoon atmosphere.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunstripe-floor-angle-cb25c28ffff1e7920914083a08dd3f7a.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunstripe-floor-angle-cb25c28ffff1e7920914083a08dd3f7a.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/sunstripe-floor-angle-cb25c28ffff1e7920914083a08dd3f7a.png",
    params: {
      prompt:
        "Indoor low-angle portrait shaped by dramatic window light and deep shadows across a warm wooden floor. A glamorous woman poses near the lens while sunlight creates bold stripes and a moody late-afternoon atmosphere.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Blush Floor Selfie",
    prompt:
      "Casual close-up selfie of a young blonde woman sitting directly on the floor in a soft pink-toned setting. Minimal makeup, natural skin texture, and intimate smartphone framing make the image feel simple and personal.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/blush-floor-selfie-3ed6ab52bac057bdca6cd8e3240f9d93.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/blush-floor-selfie-3ed6ab52bac057bdca6cd8e3240f9d93.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/blush-floor-selfie-3ed6ab52bac057bdca6cd8e3240f9d93.png",
    params: {
      prompt:
        "Casual close-up selfie of a young blonde woman sitting directly on the floor in a soft pink-toned setting. Minimal makeup, natural skin texture, and intimate smartphone framing make the image feel simple and personal.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Burger Spot Glow",
    prompt:
      "Close restaurant portrait in a casual burger spot with warm wall lamps and a blurred neon sign behind the subject. The image balances cozy fast-food ambiance with a direct expressive gaze and realistic indoor lighting.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/burger-spot-glow-acdc4f5c17e61b9dfb10cd20967ecf8a.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/burger-spot-glow-acdc4f5c17e61b9dfb10cd20967ecf8a.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/burger-spot-glow-acdc4f5c17e61b9dfb10cd20967ecf8a.png",
    params: {
      prompt:
        "Close restaurant portrait in a casual burger spot with warm wall lamps and a blurred neon sign behind the subject. The image balances cozy fast-food ambiance with a direct expressive gaze and realistic indoor lighting.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Trunkside Iced Coffee",
    prompt:
      "Bright daytime fashion snapshot of a blonde woman sitting in the open trunk of a vintage car, one hand lifting her hair while the other holds an iced coffee. The scene feels sunny, carefree, and road-trip ready.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/trunkside-iced-coffee-4684b5c45b3124e3f57d3d19573306e3.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/trunkside-iced-coffee-4684b5c45b3124e3f57d3d19573306e3.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/trunkside-iced-coffee-4684b5c45b3124e3f57d3d19573306e3.png",
    params: {
      prompt:
        "Bright daytime fashion snapshot of a blonde woman sitting in the open trunk of a vintage car, one hand lifting her hair while the other holds an iced coffee. The scene feels sunny, carefree, and road-trip ready.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Bedside Play Snapshot",
    prompt:
      "Very close low-angle bed selfie of a young woman lying on her stomach and looking straight into the camera with a playful expression. Soft bedroom light, dark hair, and intimate phone framing make the image feel spontaneous and warm.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/bedside-play-snapshot-87e7392a839bdc7369dbec4813540910.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/bedside-play-snapshot-87e7392a839bdc7369dbec4813540910.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/bedside-play-snapshot-87e7392a839bdc7369dbec4813540910.png",
    params: {
      prompt:
        "Very close low-angle bed selfie of a young woman lying on her stomach and looking straight into the camera with a playful expression. Soft bedroom light, dark hair, and intimate phone framing make the image feel spontaneous and warm.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Heart Throne at Midnight",
    prompt:
      "Dramatic red studio portrait of a woman seated inside a large heart-shaped opening made from layered red fabric. Centered editorial composition, sculptural pose, and rich monochrome styling create a regal romantic mood.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/heart-throne-at-midnight-6481d0a665d1116f70198531b1485b50.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/heart-throne-at-midnight-6481d0a665d1116f70198531b1485b50.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/heart-throne-at-midnight-6481d0a665d1116f70198531b1485b50.png",
    params: {
      prompt:
        "Dramatic red studio portrait of a woman seated inside a large heart-shaped opening made from layered red fabric. Centered editorial composition, sculptural pose, and rich monochrome styling create a regal romantic mood.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Striped Rebellion",
    prompt:
      "Very low-angle outdoor selfie of a pale-skinned woman with straight black hair, bangs, and dark lipstick seated in a bright turquoise plastic chair. The striped styling, near-lens legs, and bold color contrast give the shot a chaotic alt-fashion energy.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/striped-rebellion-cf95ad1f90b06ab87e819bc0ea0c96a2.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/striped-rebellion-cf95ad1f90b06ab87e819bc0ea0c96a2.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/striped-rebellion-cf95ad1f90b06ab87e819bc0ea0c96a2.png",
    params: {
      prompt:
        "Very low-angle outdoor selfie of a pale-skinned woman with straight black hair, bangs, and dark lipstick seated in a bright turquoise plastic chair. The striped styling, near-lens legs, and bold color contrast give the shot a chaotic alt-fashion energy.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Golden Hour Curbside",
    prompt:
      "Golden-hour suburban street portrait of a woman posing by a curb in warm sunset light. Soft shadows, natural atmosphere, and smartphone realism create a calm but stylish end-of-day outdoor scene.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/golden-hour-curbside-e7666969491e0c12ccbab1601b977366.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/golden-hour-curbside-e7666969491e0c12ccbab1601b977366.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/golden-hour-curbside-e7666969491e0c12ccbab1601b977366.png",
    params: {
      prompt:
        "Golden-hour suburban street portrait of a woman posing by a curb in warm sunset light. Soft shadows, natural atmosphere, and smartphone realism create a calm but stylish end-of-day outdoor scene.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Breakbeat Studio Lift",
    prompt:
      "Dynamic red-studio fashion image of a woman lifting herself off the glossy floor in a breakdance-inspired pose, hands planted behind her for support. The shot is graphic, athletic, and highly stylized with strong body lines.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/breakbeat-studio-lift-d02ca4bc6fca3691b314e32750a4ce47.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/breakbeat-studio-lift-d02ca4bc6fca3691b314e32750a4ce47.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/breakbeat-studio-lift-d02ca4bc6fca3691b314e32750a4ce47.png",
    params: {
      prompt:
        "Dynamic red-studio fashion image of a woman lifting herself off the glossy floor in a breakdance-inspired pose, hands planted behind her for support. The shot is graphic, athletic, and highly stylized with strong body lines.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Nocturnal City Glow",
    prompt:
      "Nighttime lifestyle portrait of a young woman with chestnut waves standing in a city setting lit by soft street glow. The atmosphere is cinematic but natural, with realistic skin texture and a polished after-dark urban feel.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/nocturnal-city-glow-ad12815c3b6c402f0813aea643dacd6d.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/nocturnal-city-glow-ad12815c3b6c402f0813aea643dacd6d.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/nocturnal-city-glow-ad12815c3b6c402f0813aea643dacd6d.png",
    params: {
      prompt:
        "Nighttime lifestyle portrait of a young woman with chestnut waves standing in a city setting lit by soft street glow. The atmosphere is cinematic but natural, with realistic skin texture and a polished after-dark urban feel.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Terracotta Studio Poise",
    prompt:
      "Minimal warm-toned studio portrait of a woman seated on the floor against a seamless beige backdrop. Terracotta styling, clean composition, and soft directional light create a refined editorial fashion image.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/terracotta-studio-poise-e514a4ef9b81b72fed753980bbb121b0.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/terracotta-studio-poise-e514a4ef9b81b72fed753980bbb121b0.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/terracotta-studio-poise-e514a4ef9b81b72fed753980bbb121b0.png",
    params: {
      prompt:
        "Minimal warm-toned studio portrait of a woman seated on the floor against a seamless beige backdrop. Terracotta styling, clean composition, and soft directional light create a refined editorial fashion image.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Mall Floor Perspective",
    prompt:
      "Very low-angle mall portrait of a woman squatting in the center of a bright shopping corridor and looking down toward the lens. The perspective feels bold and modern, with glossy retail light and candid smartphone energy.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/mall-floor-perspective-6042cfd8e89b6502904b4c5655deef47.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/mall-floor-perspective-6042cfd8e89b6502904b4c5655deef47.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/mall-floor-perspective-6042cfd8e89b6502904b4c5655deef47.png",
    params: {
      prompt:
        "Very low-angle mall portrait of a woman squatting in the center of a bright shopping corridor and looking down toward the lens. The perspective feels bold and modern, with glossy retail light and candid smartphone energy.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Rosy Cocktail Fantasy",
    prompt:
      "Surreal high-fashion editorial of a woman posed inside an oversized transparent martini glass against a dreamy pastel gradient sky. A flowing fuchsia gown, metallic heels, and soft directional light turn the scene into a glamorous fantasy-cocktail campaign.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/rosy-cocktail-fantasy-4b0dd14223870de690c484d274ee6f06.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/rosy-cocktail-fantasy-4b0dd14223870de690c484d274ee6f06.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/rosy-cocktail-fantasy-4b0dd14223870de690c484d274ee6f06.png",
    params: {
      prompt:
        "Surreal high-fashion editorial of a woman posed inside an oversized transparent martini glass against a dreamy pastel gradient sky. A flowing fuchsia gown, metallic heels, and soft directional light turn the scene into a glamorous fantasy-cocktail campaign.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Grounded Barefoot Angle",
    prompt:
      "Ultra-realistic outdoor low-angle portrait of a woman seated on pavement with legs extended toward the camera. Cloudy daylight, bare feet, casual clothes, and a grounded perspective create an intimate everyday street-style image.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/grounded-barefoot-angle-18e127b7132e1930f85d3d4dc2803d69.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/grounded-barefoot-angle-18e127b7132e1930f85d3d4dc2803d69.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/grounded-barefoot-angle-18e127b7132e1930f85d3d4dc2803d69.png",
    params: {
      prompt:
        "Ultra-realistic outdoor low-angle portrait of a woman seated on pavement with legs extended toward the camera. Cloudy daylight, bare feet, casual clothes, and a grounded perspective create an intimate everyday street-style image.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
  {
    title: "Velvet Chair Stare",
    prompt:
      "Casual lifestyle portrait of a young woman curled on a vintage teal velvet chair, knees drawn close as she looks directly at the camera with a calm intense gaze. Natural side light, knit layers, and apartment details give the image a quiet, intimate realism.",
    previewUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-chair-stare-343d6a59c97319ac5324361786e91a15.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-chair-stare-343d6a59c97319ac5324361786e91a15.png",
    generatedUrl:
      "https://ocdn.10b.ai/zencreator/generator-by-prompt/velvet-chair-stare-343d6a59c97319ac5324361786e91a15.png",
    params: {
      prompt:
        "Casual lifestyle portrait of a young woman curled on a vintage teal velvet chair, knees drawn close as she looks directly at the camera with a calm intense gaze. Natural side light, knit layers, and apartment details give the image a quiet, intimate realism.",
      size: "1024*1536",
      quality: "high",
      aspectRatio: "2:3",
    },
  },
];

export const FIXED_IMAGE_TO_IMAGE_LIBRARY =
  fixedImageToImageLibrary as FixedToolLibraryRecord[];
export const FIXED_PHOTOSHOOT_LIBRARY =
  photoshootLibrary as FixedToolLibraryRecord[];
export const FIXED_VARIATIONS_LIBRARY: FixedToolLibraryRecord[] = [
  {
    title: "Court Angle Sheet",
    prompt:
      "Create a premium 2x2 multi-angle variation sheet from the uploaded reference image while preserving identity, outfit, lighting, and scene context.",
    previewUrl:
      "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-input.png",
    thumbnailUrl:
      "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-1.png",
    generatedUrl:
      "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-1.png",
    resultPreviewUrls: [
      "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-1.png",
      "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-2.png",
      "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-3.png",
      "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-output-4.png",
    ],
    params: {
      referenceImages: [
        {
          id: "variations-reference-0",
          preview:
            "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-input.png",
          url: "https://ocdn.10b.ai/homepage/generated/homepage-variations/variations-input.png",
          status: "uploaded",
        },
      ],
      prompt:
        "Create a premium 2x2 multi-angle variation sheet from the uploaded reference image while preserving identity, outfit, lighting, and scene context.",
      aspectRatio: "1:1",
    },
  },
];

function buildEditorCombinerLibrary() {
  const source = editorCombinerLibrarySource as EditorCombinerInferenceFile;
  const templates = Array.isArray(source.templates) ? source.templates : [];

  return templates
    .filter(
      (item) =>
        typeof item.final_image_url === "string" &&
        item.final_image_url &&
        Array.isArray(item.ref_image_urls) &&
        item.ref_image_urls.length > 0,
    )
    .map<FixedToolLibraryRecord>((item) => ({
      title: item.original_template_name,
      prompt: item.final_generation_prompt,
      previewUrl: item.final_image_url!,
      thumbnailUrl: item.final_image_url!,
      generatedUrl: item.final_image_url!,
      params: {
        referenceImages: (item.ref_image_urls || []).map((url, index) => ({
          id: `referenceImages-${index}`,
          preview: url,
          url,
          status: "uploaded",
        })),
        prompt: item.final_generation_prompt,
        aspectRatio: "9:16",
      },
    }));
}

function buildImageEffectsLibrary(): FixedToolLibraryRecord[] {
  return getImageEffectItemsSync()
    .sort((left, right) => {
      const leftSortOrder =
        typeof left.sortOrder === "number" ? left.sortOrder : -1;
      const rightSortOrder =
        typeof right.sortOrder === "number" ? right.sortOrder : -1;

      if (leftSortOrder !== rightSortOrder) {
        return rightSortOrder - leftSortOrder;
      }

      const leftTitle = (left.title || left.slug).toLowerCase();
      const rightTitle = (right.title || right.slug).toLowerCase();

      if (leftTitle !== rightTitle) {
        return leftTitle.localeCompare(rightTitle);
      }

      return left.slug.localeCompare(right.slug);
    })
    .map((item) => {
      const primaryPreviewUrl =
        item.previewExample?.outputImageUrl || item.coverUrl;

      const pairedReferenceUrls = [
        ...(item.previewExample?.inputImageUrls || []),
        item.previewExample?.inputImageUrl,
      ].filter((value, index, array): value is string => {
        return Boolean(value) && array.indexOf(value) === index;
      });

      const referenceImages = pairedReferenceUrls
        .filter((url) => url !== primaryPreviewUrl)
        .slice(0, getImageEffectRequiredInputCount(item.requiredInputCount));
      const prompt =
        item.description ||
        `${item.title} image effect example. Use the provided reference image to recreate a similar transformed result.`;

      return {
        title: item.title,
        prompt,
        previewUrl: primaryPreviewUrl,
        thumbnailUrl: primaryPreviewUrl,
        generatedUrl: primaryPreviewUrl,
        params: {
          prompt,
          aspectRatio: item.aspectRatio.replace(/\s+/g, ""),
          effectSlug: item.slug,
          referenceImages: referenceImages.map((url, index) => ({
            id: `image-effects-${item.slug}-${index}`,
            url,
            preview: url,
            status: "uploaded",
          })),
        },
      };
    });
}

function buildVideoEffectsLibrary(): FixedToolLibraryRecord[] {
  return getVideoEffectItemsSync().map((item) => {
    const referenceImageUrl =
      item.sourceImageUrl ||
      item.examples?.find((example) => example.inputImageUrl)?.inputImageUrl ||
      item.coverUrl ||
      "";
    const prompt = `${item.title} video effect example. Use the provided reference image to generate a similar motion effect.`;

    return {
      title: item.title,
      prompt,
      previewUrl:
        item.sampleVideoUrl || item.samplePreviewClipUrl || item.coverUrl || "",
      thumbnailUrl: item.coverUrl || referenceImageUrl,
      generatedUrl:
        item.sampleVideoUrl || item.samplePreviewClipUrl || item.coverUrl || "",
      previewClipUrl: item.samplePreviewClipUrl || item.sampleVideoUrl,
      params: {
        prompt,
        aspectRatio: item.aspectRatio.replace(/\s+/g, ""),
        effectSlug: item.slug,
        referenceImages: referenceImageUrl
          ? [
              {
                id: `video-effects-${item.slug}`,
                url: referenceImageUrl,
                preview: referenceImageUrl,
                status: "uploaded",
              },
            ]
          : [],
      },
    };
  });
}

export const FIXED_EDITOR_COMBINER_LIBRARY = buildEditorCombinerLibrary();
export const FIXED_IMAGE_EFFECTS_LIBRARY = buildImageEffectsLibrary();
export const FIXED_VIDEO_EFFECTS_LIBRARY = buildVideoEffectsLibrary();
export const TOOL_LIBRARY_OVERRIDES: ToolLibraryOverrideDefinition[] = [
  {
    id: "video-effects-scene-library",
    modelLabel: "Video Effects",
    mediaType: "video",
    defaultAspectRatio: "9:16",
    match: {
      exactToolParams: ["video-effect", "video-effects"],
      toolPrefixes: ["video-effect/", "video-effects/"],
    },
    items: FIXED_VIDEO_EFFECTS_LIBRARY,
  },
  {
    id: "image-effects-scene-library",
    modelLabel: "Image Effects",
    mediaType: "image",
    defaultAspectRatio: "4:5",
    match: {
      exactToolParams: ["image-effect", "image-effects"],
      toolPrefixes: ["image-effect/", "image-effects/"],
    },
    items: FIXED_IMAGE_EFFECTS_LIBRARY,
  },
  {
    id: "variations-scene-library",
    modelLabel: "GPT-Image 2",
    mediaType: "image",
    defaultAspectRatio: "1:1",
    match: {
      exactToolParams: ["variations"],
      toolPrefixes: ["variations/", "variations~"],
    },
    items: FIXED_VARIATIONS_LIBRARY,
  },
  {
    id: "photoshoot-scene-library",
    modelLabel: "GPT-Image 2",
    mediaType: "image",
    defaultAspectRatio: "9:16",
    match: {
      exactToolParams: ["photoshoot"],
      toolPrefixes: ["photoshoot/", "photoshoot~"],
    },
    items: FIXED_PHOTOSHOOT_LIBRARY,
  },
  {
    id: "zencreator-text-to-image",
    modelLabel: "",
    mediaType: "image",
    defaultAspectRatio: "2:3",
    match: {
      exactToolParams: [
        "text-to-image/gpt-image-1",
        "text-to-image/z-image-turbo~gpt-image-1",
      ],
      toolPrefixes: ["text-to-image/", "text-to-image~"],
      scenePaths: ["/text-to-image"],
      modelUrls: ["/text-to-image/gpt-image-1"],
    },
    items: FIXED_TEXT_TO_IMAGE_LIBRARY,
  },
  {
    id: "image-to-image-scene-library",
    modelLabel: "GPT-Image 2",
    mediaType: "image",
    defaultAspectRatio: "9:16",
    match: {
      exactToolParams: ["image-to-image"],
      toolPrefixes: ["image-to-image/", "image-to-image~"],
      scenePaths: ["/image-to-image"],
      modelUrls: ["/image-to-image/gpt-image-2"],
    },
    items: FIXED_IMAGE_TO_IMAGE_LIBRARY,
  },
  {
    id: "editor-combiner-scene-library",
    modelLabel: "GPT-Image 2",
    mediaType: "image",
    defaultAspectRatio: "9:16",
    match: {
      exactToolParams: ["editor-combiner"],
      toolPrefixes: ["editor-combiner/", "editor-combiner~"],
      scenePaths: ["/editor-combiner"],
      modelUrls: ["/editor-combiner/gpt-image-2"],
    },
    items: FIXED_EDITOR_COMBINER_LIBRARY,
  },
];
