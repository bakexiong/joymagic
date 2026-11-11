import fs from "node:fs/promises";
import path from "node:path";

const PACK_PATH = path.resolve(
  process.cwd(),
  "scripts/ai-girlfriend-prompt-pack.json",
);
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/ai-girlfriend-prompt-batch.json",
);
const REQUEST_OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/ai-girlfriend-prompt-requests.json",
);
const DEFAULT_RESOLUTION = "0.5k";
const DEFAULT_OUTPUT_FORMAT = "png";
const DEFAULT_ASPECT_RATIO = "3:4";

type Variant = {
  id: string;
  label: string;
  details: string[];
};

type Section = {
  id: string;
  title: string;
  promptPrefix: string;
  preserve: string;
  resultLine: string;
  variants: Variant[];
};

type PromptPack = {
  defaultBaseProfileId?: string;
  baseProfiles?: Array<{
    id: string;
    title: string;
    basePrompt: string;
  }>;
  baseProfile: {
    id: string;
    title: string;
    basePrompt: string;
  };
  consistencyRule: string;
  sections: Section[];
};

type GeneratedPrompt = {
  id: string;
  baseProfileId: string;
  sectionId: string;
  sectionTitle: string;
  variantId: string;
  variantLabel: string;
  prompt: string;
};

type OutputFile = {
  generatedAt: string;
  baseProfiles: NonNullable<PromptPack["baseProfiles"]>;
  baseProfile: PromptPack["baseProfile"];
  totals: {
    sectionCount: number;
    promptCount: number;
  };
  basePrompt: string;
  prompts: GeneratedPrompt[];
};

type RequestPayload = {
  promptId: string;
  baseProfileId: string;
  sectionId: string;
  variantId: string;
  body: {
    prompt: string;
    mediaType: "image";
    aspect_ratio: string;
    enable_base64_output: false;
    enable_sync_mode: false;
    seed: -1;
    resolution: string;
  };
};

type RequestOutputFile = {
  generatedAt: string;
  baseProfiles: Array<{
    id: string;
    title: string;
    prompt: string;
    body: {
      prompt: string;
      aspect_ratio: string;
      resolution: string;
      output_format: string;
      enable_web_search: false;
      enable_image_search: false;
      enable_sync_mode: false;
      enable_base64_output: false;
    };
  }>;
  api: {
    provider: "wavespeed";
    textToImage: {
      model: "google/nano-banana-2/text-to-image";
      endpoint: string;
      body: {
        prompt: string;
        aspect_ratio: string;
        resolution: string;
        output_format: string;
        enable_web_search: false;
        enable_image_search: false;
        enable_sync_mode: false;
        enable_base64_output: false;
      };
      note: string;
    };
    edit: {
      model: "google/nano-banana-2/edit";
      endpoint: string;
      note: string;
    };
  };
  baseProfileId: string;
  basePrompt: string;
  requests: RequestPayload[];
};

function joinPrompt(parts: string[]) {
  return parts.filter(Boolean).join("\n\n").trim();
}

function buildHairColorPrompts(
  activeBaseProfile: NonNullable<PromptPack["baseProfiles"]>[number],
  pack: PromptPack,
  hairSection: Section,
  hairColorSection: Section,
) {
  return hairSection.variants.flatMap((hairVariant) =>
    hairColorSection.variants.map((colorVariant) => ({
      id: `${activeBaseProfile.id}__${hairColorSection.id}__${hairVariant.id}__${colorVariant.id}`,
      baseProfileId: activeBaseProfile.id,
      sectionId: hairColorSection.id,
      sectionTitle: hairColorSection.title,
      variantId: `${hairVariant.id}__${colorVariant.id}`,
      variantLabel: `${hairVariant.label} / ${colorVariant.label}`,
      prompt: joinPrompt([
        hairColorSection.promptPrefix,
        "Preserve this exact hairstyle while only updating the hair color.",
        "Current hairstyle to preserve:",
        hairVariant.details.join("\n"),
        "Target hair color:",
        colorVariant.details.join("\n"),
        hairColorSection.preserve,
        hairColorSection.resultLine,
        pack.consistencyRule,
      ]),
    })),
  );
}

async function main() {
  const raw = await fs.readFile(PACK_PATH, "utf8");
  const pack = JSON.parse(raw) as PromptPack;
  const availableBaseProfiles =
    pack.baseProfiles?.length && pack.defaultBaseProfileId
      ? pack.baseProfiles
      : [pack.baseProfile];
  const activeBaseProfile =
    availableBaseProfiles.find(
      (profile) => profile.id === pack.defaultBaseProfileId,
    ) ?? availableBaseProfiles[0];

  const hairSection = pack.sections.find((section) => section.id === "hair");
  const hairColorSection = pack.sections.find(
    (section) => section.id === "hairColor",
  );

  const prompts: GeneratedPrompt[] = availableBaseProfiles.flatMap((baseProfile) =>
    pack.sections.flatMap((section) => {
      if (section.id === "hairColor") {
        if (!hairSection) {
          throw new Error("缺少 hair section，无法生成 hairColor 组合 prompt");
        }

        return buildHairColorPrompts(baseProfile, pack, hairSection, section);
      }

      return section.variants.map((variant) => ({
        id: `${baseProfile.id}__${section.id}__${variant.id}`,
        baseProfileId: baseProfile.id,
        sectionId: section.id,
        sectionTitle: section.title,
        variantId: variant.id,
        variantLabel: variant.label,
        prompt: joinPrompt([
          section.promptPrefix,
          variant.details.join("\n"),
          section.preserve,
          section.resultLine,
          pack.consistencyRule,
        ]),
      }));
    }),
  );

  const output: OutputFile = {
    generatedAt: new Date().toISOString(),
    baseProfiles: availableBaseProfiles,
    baseProfile: activeBaseProfile,
    totals: {
      sectionCount: pack.sections.length,
      promptCount: prompts.length,
    },
    basePrompt: joinPrompt([
      activeBaseProfile.basePrompt,
      pack.consistencyRule.replace(
        "Only change the requested attribute.",
        "This image should serve as the master base image for later controlled variations.",
      ),
    ]),
    prompts,
  };

  const requestOutput: RequestOutputFile = {
    generatedAt: output.generatedAt,
    baseProfiles: availableBaseProfiles.map((profile) => ({
      id: profile.id,
      title: profile.title,
      prompt: joinPrompt([
        profile.basePrompt,
        pack.consistencyRule.replace(
          "Only change the requested attribute.",
          "This image should serve as the master base image for later controlled variations.",
        ),
      ]),
      body: {
        prompt: joinPrompt([
          profile.basePrompt,
          pack.consistencyRule.replace(
            "Only change the requested attribute.",
            "This image should serve as the master base image for later controlled variations.",
          ),
        ]),
        aspect_ratio: DEFAULT_ASPECT_RATIO,
        resolution: DEFAULT_RESOLUTION,
        output_format: DEFAULT_OUTPUT_FORMAT,
        enable_web_search: false,
        enable_image_search: false,
        enable_sync_mode: false,
        enable_base64_output: false,
      },
    })),
    api: {
      provider: "wavespeed",
      textToImage: {
        model: "google/nano-banana-2/text-to-image",
        endpoint:
          "https://api.wavespeed.ai/api/v3/google/nano-banana-2/text-to-image",
        body: {
          prompt: output.basePrompt,
          aspect_ratio: DEFAULT_ASPECT_RATIO,
          resolution: DEFAULT_RESOLUTION,
          output_format: DEFAULT_OUTPUT_FORMAT,
          enable_web_search: false,
          enable_image_search: false,
          enable_sync_mode: false,
          enable_base64_output: false,
        },
        note: "用于先生成 base 图。",
      },
      edit: {
        model: "google/nano-banana-2/edit",
        endpoint: "https://api.wavespeed.ai/api/v3/google/nano-banana-2/edit",
        note: "运行时补 images 数组；用于基于 base 图做局部编辑。",
      },
    },
    baseProfileId: activeBaseProfile.id,
    basePrompt: output.basePrompt,
    requests: prompts.map((item) => ({
      promptId: item.id,
      baseProfileId: item.baseProfileId,
      sectionId: item.sectionId,
      variantId: item.variantId,
      body: {
        prompt: item.prompt,
        mediaType: "image",
        aspect_ratio: DEFAULT_ASPECT_RATIO,
        enable_base64_output: false,
        enable_sync_mode: false,
        seed: -1,
        resolution: DEFAULT_RESOLUTION,
      },
    })),
  };

  await fs.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    REQUEST_OUTPUT_PATH,
    `${JSON.stringify(requestOutput, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `已生成 ${prompts.length} 条 prompt，输出到 ${path.relative(process.cwd(), OUTPUT_PATH)}，并生成请求参数到 ${path.relative(process.cwd(), REQUEST_OUTPUT_PATH)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
