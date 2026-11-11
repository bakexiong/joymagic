import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SAMPLE_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/image-effect-samples.json",
);

const FETCH_SCRIPT_PATH = path.resolve(
  process.cwd(),
  "scripts/fetch-pollo-page1.applescript",
);

type PolloTemplate = {
  templateCode: string;
  title: string;
  coverImg: string;
  usedCount?: number;
  sort?: number;
  assetsNum?: number;
  minAssetsNum?: number | null;
  templateCredit?: number;
  supportedAspectRatio?: string[];
};

type TrpcResponse = Array<{
  result?: {
    data?: {
      json?: unknown;
    };
  };
}>;

type ImageEffectSampleRecord = Record<
  string,
  {
    title: string;
    sourceUrl: string;
    coverUrl: string;
    inputImageUrl?: string;
    examples: Array<{
      inputImageUrl?: string;
      inputImageUrls?: string[];
      outputImageUrl?: string;
    }>;
    requiredInputCount?: number;
    baseImagePrompt?: string;
    baseImagePrompts?: string[];
    nanoBananaPrompt?: string;
    description?: string;
    basePrice?: number;
    visits?: number;
    sortOrder?: number;
  }
>;

function humanizeTitle(source: string) {
  return source
    .replace(/^AI\s+/i, "")
    .replace(/\bGenerator\b/gi, "Scene")
    .replace(/\bFilter\b/gi, "Style")
    .replace(/\bShot\b/gi, "Portrait")
    .replace(/\bEffect\b/gi, "Look")
    .replace(/\s+/g, " ")
    .trim();
}

function buildApproximateTitle(source: string) {
  const base = humanizeTitle(source);

  if (/selfie with celebrities/i.test(source)) return "Celebrity Selfie Scene";
  if (/pregnant/i.test(source)) return "Maternity Portrait Look";
  if (/red carpet/i.test(source)) return "Red Carpet Portrait";
  if (/window doll/i.test(source)) return "Display Window Doll";
  if (/self doll/i.test(source)) return "Mini Me Doll";
  if (/dream car/i.test(source)) return "Dream Ride Portrait";
  if (/golden spotlight/i.test(source)) return "Golden Spotlight Portrait";
  if (/thousand lighters/i.test(source)) return "Thousand Lights Scene";
  if (/celebrity duo/i.test(source)) return "Celebrity Duo Portrait";
  if (/celebrity call/i.test(source)) return "Celebrity Call Scene";
  if (/street graffiti/i.test(source)) return "Street Graffiti Twin";
  if (/ghibli/i.test(source)) return "Storybook Ghibli Mood";

  return base;
}

function buildPrompt(template: PolloTemplate, approximateTitle: string) {
  const sourceTitle = template.title.trim();
  const titleHint = sourceTitle.replace(/^AI\s+/i, "");

  return `Transform the provided source images into a result similar to "${titleHint}" while keeping the main subject recognizable. Aim for ${approximateTitle.toLowerCase()} styling, add the key props, mood, scene setup, and visual cues implied by the effect name, and produce one polished commercially appealing final image.`;
}

function resolveRequiredInputCount(template: PolloTemplate) {
  const explicitCount = Math.max(
    Number(template.assetsNum || 0),
    Number(template.minAssetsNum || 0),
  );

  if (explicitCount >= 2) {
    return explicitCount;
  }

  const title = template.title.toLowerCase();

  if (/selfie with celebrities|celebrity call|celebrity duo/i.test(title)) {
    return 2;
  }

  return 1;
}

function buildSingleBaseImagePrompt(template: PolloTemplate) {
  const title = template.title.toLowerCase();

  if (/pregnant/i.test(title)) {
    return "A realistic elegant maternity portrait of a stylish adult woman, half-body composition, soft natural light, clean background, warm expression, premium editorial photography, highly detailed face and hands.";
  }

  if (/selfie|celebrity|call|duo/i.test(title)) {
    return "A realistic modern smartphone selfie portrait of a stylish young adult, natural skin texture, flattering daylight, casual fashionable clothing, clean composition, social-media-ready photography, highly detailed face and hands.";
  }

  if (/red carpet|spotlight|concert|champagne|cheers|party|balloon|new year|flash|cafe/i.test(title)) {
    return "A realistic cinematic event portrait of a stylish young adult, fashionable outfit, dramatic but clean lighting, premium lifestyle photography, polished face detail, upscale mood, highly detailed hands and clothing.";
  }

  if (/car|career|gear|graffiti/i.test(title)) {
    return "A realistic full-body lifestyle portrait of a stylish young adult in an urban setting, confident pose, clean composition, detailed clothing, high-end editorial photography, highly detailed face and hands.";
  }

  if (/window doll|self doll|crystal ball|in my hands/i.test(title)) {
    return "A realistic centered portrait of a stylish young adult on a clean simple background, balanced lighting, clear body silhouette, highly detailed face and hands, designed to be easy for later toy or miniature stylization.";
  }

  if (/hair|eye|smile|braces|piercing|aging|bald|beardless|fat|skinny|baby|ghibli/i.test(title)) {
    return "A realistic close-up beauty portrait of a stylish young adult, neutral expression, clean background, symmetrical face, highly detailed eyes and hair, premium studio lighting, highly detailed skin and hands.";
  }

  return "A realistic portrait of a stylish young adult, clean composition, natural lighting, premium editorial photography, highly detailed face, hands, and clothing.";
}

function buildBaseImagePrompts(template: PolloTemplate) {
  const count = resolveRequiredInputCount(template);
  const title = template.title.toLowerCase();

  if (count <= 1) {
    return [buildSingleBaseImagePrompt(template)];
  }

  if (/selfie with celebrities|celebrity call/i.test(title)) {
    return [
      "A realistic smartphone selfie portrait of an ordinary stylish young adult, natural skin texture, flattering daylight, casual fashionable clothing, clean composition, highly detailed face and hands.",
      "A realistic glamorous celebrity-style portrait of a fashionable adult companion, polished studio lighting, premium styling, highly detailed face and hands, clean simple composition.",
    ];
  }

  if (/celebrity duo/i.test(title)) {
    return [
      "A realistic stylish portrait of the main young adult subject, clean background, editorial lighting, highly detailed face and hands.",
      "A realistic glamorous companion portrait of a second adult subject with star-quality styling, polished lighting, highly detailed face and hands.",
    ];
  }

  return [
    buildSingleBaseImagePrompt(template),
    "A realistic portrait of a second adult companion subject, clean composition, natural lighting, premium editorial photography, highly detailed face, hands, and clothing.",
  ];
}

async function fetchPolloTemplates() {
  const { stdout } = await execFileAsync("osascript", [FETCH_SCRIPT_PATH, "1", "100"], {
    maxBuffer: 10 * 1024 * 1024,
  });

  const parsed = JSON.parse(stdout.trim()) as TrpcResponse;
  const templateResult = parsed[1]?.result?.data?.json as
    | { total?: number; data?: PolloTemplate[] }
    | undefined;

  if (!templateResult?.data || !Array.isArray(templateResult.data)) {
    throw new Error("未能从 Pollo 接口解析到 persona-magic 模板数据");
  }

  return {
    total: templateResult.total || templateResult.data.length,
    templates: templateResult.data,
  };
}

async function main() {
  const { total, templates } = await fetchPolloTemplates();
  const raw = await fs.readFile(SAMPLE_PATH, "utf8");
  const samples = JSON.parse(raw) as ImageEffectSampleRecord;

  for (const [slug, record] of Object.entries(samples)) {
    if (
      slug.startsWith("persona-") ||
      record.sourceUrl?.startsWith("https://pollo.ai/photo-effects/")
    ) {
      delete samples[slug];
    }
  }

  for (const template of templates) {
    const approximateTitle = buildApproximateTitle(template.title);
    const slug = `persona-${template.templateCode}`;
    const requiredInputCount = resolveRequiredInputCount(template);
    const baseImagePrompts = buildBaseImagePrompts(template);

    samples[slug] = {
      title: approximateTitle,
      sourceUrl: `https://pollo.ai/photo-effects/${template.templateCode}`,
      coverUrl: "",
      examples: [
        {
          inputImageUrls: [],
        },
      ],
      requiredInputCount,
      baseImagePrompt: baseImagePrompts[0],
      baseImagePrompts,
      nanoBananaPrompt: buildPrompt(template, approximateTitle),
      description: `${approximateTitle} is a custom image effect imported from Pollo Persona Magic. It first generates ${requiredInputCount} original source image${requiredInputCount > 1 ? "s" : ""} from text, then applies the final effect transformation on top of those generated source images.`,
      basePrice: (template.templateCredit || 5) * 4000,
      visits: template.usedCount || 0,
      sortOrder: typeof template.sort === "number" ? 10000 - template.sort : 0,
    };
  }

  await fs.writeFile(SAMPLE_PATH, `${JSON.stringify(samples, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        totalFromApi: total,
        imported: templates.length,
        sample: templates.slice(0, 10).map((template) => ({
          slug: `persona-${template.templateCode}`,
          sourceTitle: template.title,
          title: buildApproximateTitle(template.title),
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
