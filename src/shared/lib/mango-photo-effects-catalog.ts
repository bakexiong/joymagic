export const MANGO_PHOTO_EFFECTS_SOURCE_URL =
  "https://mangoanimate.com/zh-tw/ai/photo-effects";

export const MANGO_PHOTO_EFFECTS_REFERENCE_IMAGE_URL =
  "https://online.mangoanimate.com/mango_ai/photo-effects/sample/sample-female.png";

const MANGO_ID_PORTRAIT_PREFIX = [
  "Use the uploaded image only as the identity reference for the main subject.",
  "Preserve the same person, facial identity, skin tone, hairstyle, and recognizable facial features.",
  "Generate a true ID photo or passport-style portrait.",
  "Keep a centered, front-facing, head-and-shoulders composition with a natural neutral expression.",
  "Use a clean plain background, even studio lighting, realistic skin texture, and correct official-photo proportions.",
  "Do not add props, storytelling scenery, artistic environments, dramatic camera angles, or environmental composition.",
  "The final result should look like a polished official ID portrait.",
].join(" ");

export function buildMangoPhotoEffectsNanoPrompt(
  basePrompt: string,
  slug?: string,
) {
  if (slug === "id-portrait") {
    return `${MANGO_ID_PORTRAIT_PREFIX} ${basePrompt}`.trim();
  }

  return [
    "Use the uploaded image only as the identity reference for the main subject.",
    "Preserve the same person, facial identity, skin tone, and recognizable facial features.",
    "Do not keep the original passport-photo pose, plain shirt, plain background, or tight front-facing framing unless the target effect specifically requires it.",
    "You may fully redesign pose, camera angle, crop, composition, outfit, props, hair styling, lighting, and background so the result strongly matches the target effect theme.",
    "Do not generate a face-dominant beauty close-up, headshot, or tight portrait crop.",
    "Prefer a medium-wide, half-body, three-quarter-body, or environmental composition.",
    "Keep the camera farther away so the subject occupies roughly one-third to one-half of the frame rather than filling most of it.",
    "Include substantial background, props, and atmosphere connected to the effect theme.",
    "Make the scene design and themed styling more visually prominent than the face alone.",
    "Create a clearly transformed editorial result rather than a lightly restyled copy of the source photo.",
    basePrompt,
  ].join(" ");
}

export type MangoPhotoEffectCatalogItem = {
  slug: string;
  title: string;
  description: string;
  previewUrl: string;
  nanoBananaPrompt: string;
  gptImage2Prompt: string;
  sortOrder: number;
};

export const MANGO_PHOTO_EFFECTS_CATALOG: MangoPhotoEffectCatalogItem[] = [
  {
    slug: "ai-ghibli-effect",
    title: "AI Ghibli Effect",
    description:
      "Turn portraits into gentle Ghibli-inspired illustrations with painterly light, storybook backgrounds, and expressive anime warmth.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/ai-ghibli-effect.jpg",
    nanoBananaPrompt:
      "Transform this portrait into a whimsical Ghibli-inspired anime illustration with painterly shading, lush cinematic background details, warm natural light, soft hand-painted textures, expressive eyes, and a heartfelt storybook mood.",
    gptImage2Prompt:
      "A Ghibli-inspired illustrated portrait of an adult woman in a charming storybook world, painterly anime rendering, soft natural light, lush scenic background, expressive eyes, warm emotional atmosphere, hand-painted texture, high detail, 4:5.",
    sortOrder: 20019,
  },
  {
    slug: "spring-barbiecore",
    title: "Spring Barbiecore",
    description:
      "Create glossy pink Barbiecore portraits with playful spring styling, candy tones, and polished lifestyle energy.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/spring-barbiecore.jpg",
    nanoBananaPrompt:
      "Restyle this photo into a spring Barbiecore portrait with glossy pink fashion tones, playful feminine styling, polished beauty lighting, pastel props, blooming spring details, and a bright confident editorial mood.",
    gptImage2Prompt:
      "Editorial Barbiecore spring portrait of an adult woman, glossy pink styling, pastel floral accents, bright beauty lighting, playful chic fashion, polished social-media campaign look, ultra detailed, 4:5.",
    sortOrder: 20018,
  },
  {
    slug: "soft-spring-haze",
    title: "Soft Spring Haze",
    description:
      "Add airy pastel haze, blooming highlights, and a fresh seasonal softness for dreamy spring portraits.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/soft-spring-haze.jpg",
    nanoBananaPrompt:
      "Transform this portrait into a dreamy soft spring haze image with airy pastel light, blooming highlights, delicate florals, soft-focus depth, fresh skin glow, and a romantic seasonal atmosphere.",
    gptImage2Prompt:
      "Dreamy spring portrait of an adult woman in soft pastel haze, airy glow, blooming highlights, subtle floral atmosphere, soft-focus editorial photography, delicate romantic styling, 4:5.",
    sortOrder: 20017,
  },
  {
    slug: "provence-summer-girl",
    title: "Provence Summer Girl",
    description:
      "Style portraits like a sunlit Provence summer postcard with lavender moods, relaxed elegance, and travel-diary charm.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/provence-summer-girl.jpg",
    nanoBananaPrompt:
      "Reimagine this photo as a Provence summer portrait with lavender-field tones, sunlit countryside warmth, breezy feminine styling, soft golden daylight, travel-journal charm, and elegant French holiday atmosphere.",
    gptImage2Prompt:
      "Sunlit Provence summer portrait of an adult woman, lavender countryside palette, relaxed French-girl styling, warm golden daylight, breezy travel editorial mood, elegant and natural, 4:5.",
    sortOrder: 20016,
  },
  {
    slug: "rose-bokeh",
    title: "Rose Bokeh",
    description:
      "Wrap portraits in romantic rose-toned bokeh for a floral, date-night, and softly cinematic finish.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/rose-bokeh.jpg",
    nanoBananaPrompt:
      "Apply a romantic rose bokeh effect to this portrait with floral foreground blur, warm pink highlights, dreamy depth of field, elegant beauty styling, and a soft cinematic love-story mood.",
    gptImage2Prompt:
      "Romantic rose-bokeh portrait of an adult woman, soft floral blur, pink and gold highlights, dreamy cinematic depth, elegant beauty photography, intimate editorial atmosphere, 4:5.",
    sortOrder: 20015,
  },
  {
    slug: "ccd-style-snow",
    title: "CCD Style Snow",
    description:
      "Give portraits a nostalgic CCD-camera snow-night vibe with direct flash, grain, and youthful street energy.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/ccd-style-snow.jpg",
    nanoBananaPrompt:
      "Restyle this image into a snowy CCD-camera snapshot with nostalgic direct flash, cool winter air, visible grain, casual youth fashion, low-light street mood, and authentic early-2000s compact-camera energy.",
    gptImage2Prompt:
      "Nostalgic CCD-camera winter portrait of an adult woman in falling snow, direct flash, visible grain, cool blue street-night tones, candid youth style, early-2000s snapshot aesthetic, 4:5.",
    sortOrder: 20014,
  },
  {
    slug: "y2k-trend-collage",
    title: "Y2K Trend Collage",
    description:
      "Build scrapbook-like Y2K fashion collages with stickers, magazine cutouts, layered frames, and pop culture energy.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/y2k-trend-collage.jpg",
    nanoBananaPrompt:
      "Convert this portrait into a Y2K trend collage with magazine cutouts, sticker layers, scrapbook framing, glossy typography accents, metallic trims, and playful early-2000s pop-fashion energy.",
    gptImage2Prompt:
      "Y2K fashion collage portrait of an adult woman, layered scrapbook layout, magazine cutouts, stickers, chrome accents, pop typography, playful early-2000s trend aesthetic, 4:5.",
    sortOrder: 20013,
  },
  {
    slug: "y2k-cyber-collage",
    title: "Y2K Cyber Collage",
    description:
      "Mix Y2K collage styling with cyber chrome, neon interface overlays, and futuristic club-scene attitude.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/y2k-cyber-collage.jpg",
    nanoBananaPrompt:
      "Transform this photo into a Y2K cyber collage with chrome interface overlays, neon accents, holographic textures, layered cutout composition, futuristic club-fashion details, and edgy high-energy visual styling.",
    gptImage2Prompt:
      "Cyber Y2K collage portrait of an adult woman, chrome UI overlays, neon blue and pink glow, holographic textures, layered magazine composition, futuristic nightlife fashion, 4:5.",
    sortOrder: 20012,
  },
  {
    slug: "perler-bead",
    title: "Perler Bead",
    description:
      "Turn subjects into adorable bead-art portraits with handcrafted pixel charm and toy-like collectible appeal.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/perler-bead.jpg",
    nanoBananaPrompt:
      "Transform this portrait into perler-bead pixel craft art with colorful fuse beads, charming handmade texture, simplified character shapes, toy-like display quality, and playful DIY collectible styling.",
    gptImage2Prompt:
      "Perler-bead craft portrait of an adult woman, fuse bead mosaic look, colorful handcrafted pixel texture, toy collectible styling, cute DIY art presentation, 4:5.",
    sortOrder: 20011,
  },
  {
    slug: "elegant-floral-innocence",
    title: "Elegant Floral Innocence",
    description:
      "Create graceful floral portraits with airy innocence, delicate beauty cues, and refined boutique-editorial softness.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/elegant-floral-innocence.jpg",
    nanoBananaPrompt:
      "Apply an elegant floral innocence style with airy petals, delicate pastel styling, soft beauty light, graceful feminine posture, refined boutique-editorial polish, and a gentle romantic atmosphere.",
    gptImage2Prompt:
      "Elegant floral portrait of an adult woman, airy petals, delicate pastel styling, soft beauty light, graceful romantic editorial mood, refined innocence, high detail, 4:5.",
    sortOrder: 20010,
  },
  {
    slug: "mini-me",
    title: "Mini Me",
    description:
      "Shrink portraits into cute collectible mini-me figures with stylized proportions and polished display-box charm.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/mini-me.jpg",
    nanoBananaPrompt:
      "Turn this portrait into a cute mini-me collectible figure with stylized proportions, polished toy details, miniature display presentation, charming packaging feel, and a playful character-design finish.",
    gptImage2Prompt:
      "Mini-me collectible figure portrait of an adult woman, stylized toy proportions, polished display-box presentation, cute character design, premium miniature collectible aesthetic, 4:5.",
    sortOrder: 20009,
  },
  {
    slug: "ghost-trail",
    title: "Ghost Trail",
    description:
      "Introduce motion echoes and long-exposure ghost trails for surreal nightlife, dance, and experimental portraits.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/ghost-trail.jpg",
    nanoBananaPrompt:
      "Restyle this image with a ghost trail effect, using long-exposure motion echoes, subtle subject duplication, moody urban lighting, surreal movement, and an experimental cinematic portrait feel.",
    gptImage2Prompt:
      "Experimental ghost-trail portrait of an adult woman, long-exposure motion echoes, layered silhouette blur, moody nightlife lighting, surreal cinematic energy, 4:5.",
    sortOrder: 20008,
  },
  {
    slug: "neo-retro-pop",
    title: "Neo Retro Pop",
    description:
      "Blend retro pop graphics with fresh modern color blocking for bold, graphic, poster-friendly portraits.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/neo-retro-pop.jpg",
    nanoBananaPrompt:
      "Transform this portrait into a neo retro pop visual with bold color blocking, graphic poster composition, playful vintage-modern contrast, crisp styling, energetic shapes, and polished pop-art attitude.",
    gptImage2Prompt:
      "Neo retro pop portrait of an adult woman, bold color blocking, graphic poster layout, modern pop-art styling, playful vintage influence, crisp high-impact editorial look, 4:5.",
    sortOrder: 20007,
  },
  {
    slug: "torn-paper",
    title: "Torn Paper",
    description:
      "Create layered torn-paper compositions with handmade collage edges, scrapbook texture, and editorial storytelling.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/torn-paper.jpg",
    nanoBananaPrompt:
      "Convert this image into a torn-paper collage with layered ripped edges, textured paper surfaces, scrapbook composition, editorial cutout framing, and tactile handmade storytelling.",
    gptImage2Prompt:
      "Torn-paper collage portrait of an adult woman, layered ripped paper edges, tactile scrapbook textures, editorial cutout composition, handmade mixed-media feel, 4:5.",
    sortOrder: 20006,
  },
  {
    slug: "dark-gothic",
    title: "Dark Gothic",
    description:
      "Push portraits toward dark gothic drama with moody shadows, ornate styling, and cinematic midnight elegance.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/dark-gothic.jpg",
    nanoBananaPrompt:
      "Transform this portrait into a dark gothic scene with dramatic shadows, ornate styling, black romantic fashion, moody cinematic lighting, mysterious elegance, and rich midnight atmosphere.",
    gptImage2Prompt:
      "Dark gothic portrait of an adult woman, dramatic shadow, black romantic styling, ornate elegance, moody cinematic midnight atmosphere, luxurious gothic fashion editorial, 4:5.",
    sortOrder: 20005,
  },
  {
    slug: "id-portrait",
    title: "ID Portrait",
    description:
      "Generate clean ID-style headshots with balanced lighting, neutral styling, and professional passport-photo clarity.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/id-portrait.jpg",
    nanoBananaPrompt:
      "Restyle this image into a clean ID portrait with even lighting, tidy headshot framing, neutral background, professional grooming, accurate facial clarity, and official photo polish.",
    gptImage2Prompt:
      "Clean ID-style headshot of an adult woman, neutral background, balanced lighting, tidy professional styling, passport-photo clarity, realistic and polished, 4:5.",
    sortOrder: 20004,
  },
  {
    slug: "vintage-scrapbook",
    title: "Vintage Scrapbook",
    description:
      "Layer portraits into vintage scrapbook scenes with paper ephemera, tape, notes, and memory-book warmth.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/vintage-scrapbook.jpg",
    nanoBananaPrompt:
      "Transform this portrait into a vintage scrapbook composition with paper ephemera, tape details, handwritten note accents, aged textures, memory-book warmth, and nostalgic lifestyle storytelling.",
    gptImage2Prompt:
      "Vintage scrapbook portrait of an adult woman, layered paper ephemera, warm memory-book textures, tape and note accents, nostalgic handmade collage styling, 4:5.",
    sortOrder: 20003,
  },
  {
    slug: "bw-vintage-film",
    title: "B&W Vintage Film",
    description:
      "Give portraits monochrome vintage-film treatment with grain, classic contrast, and quiet cinematic nostalgia.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/bw-vintage-film.jpg",
    nanoBananaPrompt:
      "Convert this image into black-and-white vintage film photography with classic tonal contrast, subtle grain, timeless portrait framing, old-camera softness, and understated cinematic nostalgia.",
    gptImage2Prompt:
      "Black-and-white vintage film portrait of an adult woman, classic monochrome contrast, subtle analog grain, timeless headshot framing, cinematic nostalgia, 4:5.",
    sortOrder: 20002,
  },
  {
    slug: "campus-retro",
    title: "Campus Retro",
    description:
      "Recreate campus-memory portraits with retro youth styling, nostalgic school vibes, and diary-like warmth.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/campus-retro.jpg",
    nanoBananaPrompt:
      "Restyle this photo into a campus retro portrait with nostalgic youth fashion, school-memory warmth, soft analog color, diary-like atmosphere, and a cheerful coming-of-age mood.",
    gptImage2Prompt:
      "Campus retro portrait of an adult woman, nostalgic youth styling, school-memory atmosphere, soft analog color palette, diary-like warmth, gentle coming-of-age editorial mood, 4:5.",
    sortOrder: 20001,
  },
  {
    slug: "vintage-qipao",
    title: "Vintage Qipao",
    description:
      "Dress portraits in vintage qipao elegance with refined oriental styling, classic poise, and old-shanghai atmosphere.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/vintage-qipao.jpg",
    nanoBananaPrompt:
      "Transform this portrait into a vintage qipao scene with refined oriental elegance, classic tailored dress styling, graceful posture, nostalgic old-shanghai mood, and soft cinematic period light.",
    gptImage2Prompt:
      "Vintage qipao portrait of an adult woman, refined oriental elegance, old-shanghai atmosphere, graceful posture, classic tailored dress styling, soft cinematic period light, 4:5.",
    sortOrder: 20000,
  },
  {
    slug: "bw-double-exposure",
    title: "B&W Double Exposure",
    description:
      "Merge portraits with black-and-white double exposure for poetic silhouettes, layered meaning, and art-poster mood.",
    previewUrl:
      "https://online.mangoanimate.com/mango_ai/photo-effects/effects/bw-double-exposure.jpg",
    nanoBananaPrompt:
      "Apply a black-and-white double exposure effect to this portrait with layered silhouette imagery, poetic visual overlap, artistic grayscale contrast, atmospheric texture, and gallery-style poster composition.",
    gptImage2Prompt:
      "Black-and-white double exposure portrait of an adult woman, layered silhouette composition, artistic grayscale contrast, poetic texture, gallery-style poster mood, 4:5.",
    sortOrder: 19999,
  },
];
