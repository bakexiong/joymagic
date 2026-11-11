import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/image-effect-samples.json",
);

const DEFAULT_INPUT_IMAGE_URL =
  "https://ocdn.10b.ai/image-effects/images/5389961d8a458feff33cd6ce46fa02e4.jpeg";

type SampleRecord = {
  title: string;
  sourceUrl: string;
  coverUrl: string;
  inputImageUrl?: string;
  examples: Array<{
    inputImageUrl?: string;
    outputImageUrl?: string;
  }>;
  nanoBananaPrompt?: string;
  description?: string;
  basePrice?: number;
  visits?: number;
  sortOrder?: number;
};

const POLLO_EFFECTS: Array<{
  slug: string;
  title: string;
  sourceSlug: string;
  sourceTitle: string;
  coverUrl: string;
  prompt: string;
}> = [
  {
    slug: "vintage-younger-polaroid",
    title: "Vintage Younger Polaroid",
    sourceSlug: "hug-my-younger-self",
    sourceTitle: "Polaroid with My Younger Self",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/bd984121-2d53-4cba-9fb3-c3ccd57eff9f.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a style reference. Transform the result into a nostalgic double-subject instant film photo where the person appears beside their younger self, with warm vintage tones, soft analog grain, a realistic printed Polaroid frame, gentle emotional storytelling, and a believable memory-photo aesthetic.",
  },
  {
    slug: "hero-comic-panels",
    title: "Hero Comic Panels",
    sourceSlug: "ai-superhero-comic-strip-generator",
    sourceTitle: "AI Superhero Comic Strip Generator",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/d0d936d2-2d25-4cfd-ac7e-9329e70e9fc3.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a layout and style reference. Turn the person into a bold superhero comic-strip scene with multiple comic panels, dynamic action posing, dramatic lighting, clean ink outlines, halftone details, speech-bubble-ready composition, and polished graphic-novel energy.",
  },
  {
    slug: "braided-style-makeover",
    title: "Braided Style Makeover",
    sourceSlug: "ai-braids",
    sourceTitle: "AI Braids Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/1331a2ca-2491-48f3-a090-038fd78227a2.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a hairstyle reference. Restyle the person with beautifully defined braids, natural hair texture, flattering portrait lighting, realistic skin detail, fashionable beauty-editorial styling, and a clean premium makeover look.",
  },
  {
    slug: "dramatic-shadow-silhouette",
    title: "Dramatic Shadow Silhouette",
    sourceSlug: "ai-silhouette-maker",
    sourceTitle: "AI Silhouette Maker",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cm2l89z02005cohh6cl26c8hn/image/1749631523998-6fc8d4e8-5616-4340-b2b9-9aa8cb6d8dcf.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a silhouette style reference. Convert the photo into a clean, dramatic silhouette portrait with strong edge lighting, elegant side profile readability, minimal background distraction, rich contrast, and a cinematic poster-like shadow design.",
  },
  {
    slug: "crystal-blue-eyes",
    title: "Crystal Blue Eyes",
    sourceSlug: "ai-blue-eye-filter",
    sourceTitle: "AI Blue Eye Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm9t9f56n007z2kltoujsnuzd/image/1748598950793-5d3622b6-ab13-4a18-8bf6-b652d208eb99.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a beauty reference. Keep the person realistic and change the eyes to vivid crystal blue with natural reflections, subtle lash detail, balanced skin tones, and a polished high-end portrait-retouch aesthetic.",
  },
  {
    slug: "radiant-smile-portrait",
    title: "Radiant Smile Portrait",
    sourceSlug: "ai-smile-filter",
    sourceTitle: "AI Smile Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/51166122-8ff9-472c-b192-7c2a13339de3.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as an expression reference. Enhance the portrait with a warm, natural, confident smile, flattering facial balance, bright eyes, soft beauty lighting, and realistic editorial-photo polish.",
  },
  {
    slug: "soft-bangs-look",
    title: "Soft Bangs Look",
    sourceSlug: "ai-bangs-filter",
    sourceTitle: "AI Bangs filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm56iv761000dojox4vkhnwch/image/1748589720704-7d538153-34d0-46a3-90c8-403fc45e922b.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a haircut reference. Give the person soft fashionable bangs with realistic hair strands, natural face framing, balanced beauty styling, and studio-quality portrait refinement.",
  },
  {
    slug: "classic-bob-cut",
    title: "Classic Bob Cut",
    sourceSlug: "ai-bob-haircut-filter",
    sourceTitle: "AI Bob Haircut Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm9t9f56n007z2kltoujsnuzd/image/1748504030601-1f3f9742-055a-4c1c-beec-c3f27b506be6.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a haircut reference. Transform the hairstyle into a clean modern bob cut with natural volume, realistic texture, flattering face framing, and magazine-style beauty portrait quality.",
  },
  {
    slug: "flowing-long-hair",
    title: "Flowing Long Hair",
    sourceSlug: "ai-long-hair-filter",
    sourceTitle: "AI Long Hair Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/2cb5eef4-7005-4535-ba8c-ee2623c1fd05.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a hairstyle reference. Restyle the subject with long flowing hair, soft natural movement, healthy shine, realistic strand detail, and an elegant portrait-photography finish.",
  },
  {
    slug: "soft-wave-glam",
    title: "Soft Wave Glam",
    sourceSlug: "ai-wavy-hair-filter",
    sourceTitle: "AI Wavy Hair Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm56iv761000dojox4vkhnwch/image/1748506539995-d42e2e5a-73e3-4069-adb9-ac88f525dd99.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a hairstyle reference. Add soft glamorous waves with realistic texture, natural bounce, flattering beauty lighting, and a polished salon-makeover portrait style.",
  },
  {
    slug: "cartoon-statue-buddy",
    title: "Cartoon Statue Buddy",
    sourceSlug: "next-to-my-cartoon-statue",
    sourceTitle: "Next to My Cartoon Statue",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/95e42825-69f9-4662-9138-3a91bba45d18.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a composition reference. Create a playful scene where the person stands beside a cute cartoon statue version of themselves, with clean stylized proportions, collectible-toy charm, cheerful color, and polished character-poster presentation.",
  },
  {
    slug: "cartoon-soda-hero-can",
    title: "Cartoon Soda Hero Can",
    sourceSlug: "ai-cartoon-soda-can-generator",
    sourceTitle: "AI Cartoon Soda Can Generator",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/2009c1a2-9e15-4d53-9362-0342d3f7e199.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a packaging-style reference. Turn the person into a fun cartoon soda can character design with bright branding colors, playful mascot energy, clean product illustration styling, and polished pop-commercial composition.",
  },
  {
    slug: "vivid-eye-color-swap",
    title: "Vivid Eye Color Swap",
    sourceSlug: "ai-eye-color-filter",
    sourceTitle: "AI Eye Color Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cmbagua2i002vj82bi6r69wbe/image/1749538515232-13e936fc-4d01-47bf-aa31-1f7b73448ca5.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a beauty reference. Change the eye color into a vivid striking shade while keeping realistic pupils, natural reflections, clean skin texture, and refined close-up portrait detail.",
  },
  {
    slug: "golden-blonde-makeover",
    title: "Golden Blonde Makeover",
    sourceSlug: "ai-blonde-hair-filter",
    sourceTitle: "AI Blonde Hair Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cmbagua2i002vj82bi6r69wbe/image/1749436364514-ed6e9fec-8b90-4f50-84f2-5bf9ff46fb21.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a hair-color reference. Transform the hairstyle into luminous blonde tones with realistic hair shading, dimensional highlights, natural roots, and premium makeover-photography quality.",
  },
  {
    slug: "fashion-hair-color-switch",
    title: "Fashion Hair Color Switch",
    sourceSlug: "ai-hair-color-changer",
    sourceTitle: "AI Hair Color Changer",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/1397a2f1-0e75-41c7-b4cb-b7bfa3a1f683.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a style reference. Change the hair color into a fashionable salon-quality tone with realistic lighting, smooth transitions, natural texture, and beauty-editorial portrait polish.",
  },
  {
    slug: "subtle-nose-piercing-style",
    title: "Subtle Nose Piercing Style",
    sourceSlug: "ai-nose-piercing-filter",
    sourceTitle: "AI Nose Piercing Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/ceaef888-aae8-48b1-a01c-18491c420a0a.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as an accessory reference. Add a tasteful nose piercing with realistic jewelry reflections, natural skin integration, stylish portrait makeup balance, and modern fashion-photo presentation.",
  },
  {
    slug: "fresh-short-cut",
    title: "Fresh Short Cut",
    sourceSlug: "ai-short-hair-filter",
    sourceTitle: "AI Short Hair Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm9t9f56n007z2kltoujsnuzd/image/1748503911661-26acf8fe-1bda-473d-9adf-f8bbec392215.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a haircut reference. Give the person a neat short hairstyle with realistic strand texture, clean shape, flattering proportions, and a sharp contemporary portrait look.",
  },
  {
    slug: "clean-buzzcut-style",
    title: "Clean Buzzcut Style",
    sourceSlug: "ai-buzzcut-filter",
    sourceTitle: "AI Buzz Cut Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm56iv761000dojox4vkhnwch/image/1748508176793-2fb29cf4-c569-48ef-9756-0344c15fff82.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a haircut reference. Transform the subject with a clean buzz cut, natural scalp shading, realistic facial features, crisp portrait lighting, and minimal modern styling.",
  },
  {
    slug: "sleek-straight-hair",
    title: "Sleek Straight Hair",
    sourceSlug: "ai-straight-hair-filter",
    sourceTitle: "AI Straight Hair Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm56iv761000dojox4vkhnwch/image/1748504194446-75a19798-74d9-4061-9298-53015f65371f.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a hairstyle reference. Restyle the hair into a sleek straight look with natural shine, smooth texture, realistic flow, and a clean premium beauty-photo finish.",
  },
  {
    slug: "self-portrait-exhibit",
    title: "Self Portrait Exhibit",
    sourceSlug: "self-portrait-gallery",
    sourceTitle: "Self-Portrait Gallery",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/062110b5-1ced-4b5f-ae35-cad34d043bd2.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a composition reference. Create an artistic gallery scene featuring multiple framed self-portraits of the same person, elegant exhibition styling, curated wall presentation, and refined contemporary art-photography mood.",
  },
  {
    slug: "city-giant-scale",
    title: "City Giant Scale",
    sourceSlug: "ai-giant-person-effect",
    sourceTitle: "AI Giant Person Effect",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/6f510422-94fa-488d-b8ff-a1759fc99bbc.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a scale-composition reference. Create a surreal giant-person scene where the subject towers over a realistic city or street environment, with believable perspective, cinematic lighting, and polished visual-effects realism.",
  },
  {
    slug: "defined-brow-style",
    title: "Defined Brow Style",
    sourceSlug: "ai-eyebrow-filter",
    sourceTitle: "Eyebrow Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/8625e0c5-7b19-45a5-9e85-5c0e2dbbf6e4.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a brow styling reference. Enhance the eyebrows with clean shape, realistic hair strokes, flattering symmetry, soft beauty lighting, and natural portrait-retouch quality.",
  },
  {
    slug: "bright-braces-look",
    title: "Bright Braces Look",
    sourceSlug: "ai-braces-filter",
    sourceTitle: "AI Braces Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/30ad3b38-d6bc-465d-83fd-caccfe8e241d.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as an expression and accessory reference. Add realistic braces to the smile with natural mouth detail, flattering expression, clean portrait lighting, and believable beauty-photo polish.",
  },
  {
    slug: "cinematic-crying-portrait",
    title: "Cinematic Crying Portrait",
    sourceSlug: "ai-crying-filter",
    sourceTitle: "AI Crying Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/0881eebe-af4b-45a5-ac5f-f33f687c8683.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as an emotion reference. Create a cinematic emotional portrait with visible tears, expressive eyes, realistic skin detail, moody lighting, and dramatic movie-poster intimacy.",
  },
  {
    slug: "defined-curly-hair",
    title: "Defined Curly Hair",
    sourceSlug: "ai-curly-hair-filter",
    sourceTitle: "AI Curly Hair Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/production/cme7vv31x037y13fz5dnb1j5l/image/ea3955a4-1d8a-4918-8e06-2ee4e9287a72.webp",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a hairstyle reference. Restyle the subject with richly defined curls, realistic spring and texture, natural shine, and a polished salon-editorial portrait feel.",
  },
  {
    slug: "urban-dread-style",
    title: "Urban Dread Style",
    sourceSlug: "ai-dread-filter",
    sourceTitle: "AI Dread Filter",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm56iv761000dojox4vkhnwch/image/1748507048636-b2bb77f8-af2d-4f7a-a9d4-487caff156f8.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a hairstyle reference. Transform the hairstyle into stylish dreads with realistic texture, natural volume, authentic detail, and strong portrait-fashion presentation.",
  },
  {
    slug: "crystal-ball-couple-keepsake",
    title: "Crystal Ball Couple Keepsake",
    sourceSlug: "ai-3d-couple-crystal-ball-generator",
    sourceTitle: "AI 3D Couple Crystal Ball Generator",
    coverUrl:
      "https://videocdn.pollo.ai/web-cdn/pollo/test/cm2cojsmo0000ojcuibtgiw60/image/1746762101871-74602c9f-aec9-430b-852b-ebfe95dbbf7a.jpg",
    prompt:
      "Use the uploaded portrait as the identity reference and use the cover image as a scene reference. Turn the person into a cute 3D crystal-ball keepsake scene with a romantic couple collectible vibe, glossy transparent glass reflections, miniature figurine styling, and charming premium ornament detail.",
  },
];

async function main() {
  const raw = await fs.readFile(OUTPUT_PATH, "utf8");
  const samples = JSON.parse(raw) as Record<string, SampleRecord>;

  POLLO_EFFECTS.forEach((effect, index) => {
    samples[effect.slug] = {
      title: effect.title,
      sourceUrl: `https://pollo.ai/photo-effects/${effect.sourceSlug}`,
      coverUrl: effect.coverUrl,
      inputImageUrl: DEFAULT_INPUT_IMAGE_URL,
      examples: [
        {
          inputImageUrl: DEFAULT_INPUT_IMAGE_URL,
        },
      ],
      nanoBananaPrompt: effect.prompt,
      description: `${effect.title} is a custom image effect inspired by Pollo Persona Magic. It uses the input portrait together with the cover image as a visual reference to recreate a similar stylized result.`,
      basePrice: 20000,
      visits: 0,
      sortOrder: 1000 - index,
    };
  });

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(samples, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        synced: POLLO_EFFECTS.length,
        sample: POLLO_EFFECTS.slice(0, 5).map((item) => ({
          slug: item.slug,
          title: item.title,
          sourceTitle: item.sourceTitle,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
