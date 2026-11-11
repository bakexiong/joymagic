"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@/core/i18n/navigation";

import {
  AudioWaveform,
  Camera,
  CircleUserRound,
  Clapperboard,
  Layers3,
  Play,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";

import { CreateLayout } from "@/shared/blocks/create/create-layout";
import {
  AI_GIRL_DNA_STORAGE_KEY,
  defaultAiGirlCharacterDNA,
} from "@/shared/lib/ai-character";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/types/blocks/common";

type VisualSectionId =
  | "ethnicity"
  | "age"
  | "skin"
  | "eyes"
  | "lips"
  | "hair"
  | "hairColor"
  | "body"
  | "vibe";

type AvatarState = {
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

type Option = {
  id: string;
  label: string;
  description?: string;
  color?: string;
  darkText?: boolean;
  ring?: string;
  assetVariantIds?: string[];
  imageUrl?: string;
  status?: "ready" | "pending" | "failed";
  prompt?: string;
};

type AssetIndex = {
  baseProfiles?: Array<{
    id: string;
    title: string;
    prompt: string;
    imageUrl?: string;
  }>;
  summary: {
    completedVariants: number;
    pendingVariants: number;
    failedVariants: number;
  };
  sections: Array<{
    id: string;
    items: Array<{
      baseProfileId?: string;
      variantId: string;
      status: "ready" | "pending" | "failed";
      imageUrl?: string;
      prompt: string;
      error?: string;
    }>;
  }>;
};

const emptyAssetIndex: AssetIndex = {
  summary: {
    completedVariants: 0,
    pendingVariants: 0,
    failedVariants: 0,
  },
  sections: [],
};

type AssetSectionItems = AssetIndex["sections"][number]["items"];

let assetIndexCache: AssetIndex = emptyAssetIndex;
let assetSectionsCache: Record<string, AssetSectionItems> = {};

function getAssetSections() {
  return new Map(Object.entries(assetSectionsCache));
}

function getAssetIndex() {
  return assetIndexCache;
}

async function fetchCharacterAssets({
  includeMeta = false,
  sectionIds = [],
}: {
  includeMeta?: boolean;
  sectionIds?: string[];
}) {
  const params = new URLSearchParams();

  if (includeMeta) {
    params.set("includeMeta", "1");
  }

  if (sectionIds.length > 0) {
    params.set("sectionIds", sectionIds.join(","));
  }

  const response = await fetch(`/api/ai-character/assets?${params.toString()}`);
  const payload = await response.json();
  const data = payload?.data as
    | {
        meta?: Omit<AssetIndex, "sections">;
        sections?: AssetIndex["sections"];
      }
    | undefined;

  if (data?.meta) {
    assetIndexCache = {
      ...assetIndexCache,
      ...data.meta,
      sections: [],
    };
  }

  if (Array.isArray(data?.sections)) {
    assetSectionsCache = {
      ...assetSectionsCache,
      ...Object.fromEntries(
        data.sections.map((section) => [section.id, section.items]),
      ),
    };
  }
}

const previewCards = [
  {
    accent: "from-[#9fc8ff] to-[#6e8cff]",
    transform:
      "translate-x-5 translate-y-8 -rotate-[13deg] lg:translate-x-8 lg:translate-y-10",
  },
  {
    accent: "from-[#9ae0ff] to-[#ffdc7a]",
    transform:
      "translate-x-3 translate-y-2 -rotate-[6deg] lg:translate-x-4 lg:translate-y-3",
  },
  {
    accent: "from-[#ffcf7b] via-[#ff9a52] to-[#ff6b5b]",
    transform: "z-10 scale-110 rotate-0",
  },
  {
    accent: "from-[#a4d3ff] to-[#77a4ff]",
    transform:
      "-translate-x-3 translate-y-2 rotate-[7deg] lg:-translate-x-4 lg:translate-y-3",
  },
  {
    accent: "from-[#d7e7ff] to-[#8cc0ff]",
    transform:
      "-translate-x-5 translate-y-8 rotate-[13deg] lg:-translate-x-8 lg:translate-y-10",
  },
];

const ethnicityOptions: Option[] = [
  { id: "asian-soft", label: "Asian", ring: "from-[#f0d8cc] to-[#9cb5ff]" },
  { id: "black-glam", label: "Black", ring: "from-[#c08a5d] to-[#84d6c8]" },
  {
    id: "white-classic",
    label: "White",
    ring: "from-[#ead8d0] to-[#a2b9ff]",
  },
  { id: "latina-warm", label: "Latina", ring: "from-[#d79e7b] to-[#ffc878]" },
  { id: "arab-lux", label: "Arab", ring: "from-[#c99567] to-[#8fd1c8]" },
  { id: "indian-glow", label: "Indian", ring: "from-[#be865e] to-[#e6b67c]" },
];

const ageOptions: Option[] = [
  { id: "teen", label: "Teen", description: "Youthful" },
  { id: "young-adult", label: "Young Adult", description: "Balanced" },
  { id: "middle-aged", label: "Middle-aged", description: "Mature" },
  { id: "senior", label: "Senior", description: "Elegant" },
];

const skinOptions: Option[] = [
  {
    id: "pale",
    label: "Pale",
    color: "#f6dab3",
    darkText: true,
    assetVariantIds: ["matte-cool-white"],
  },
  {
    id: "light",
    label: "Light",
    color: "#f9d7a1",
    darkText: true,
    assetVariantIds: ["ivory-freckles", "matte-cool-white"],
  },
  {
    id: "medium",
    label: "Medium",
    color: "#d4a06a",
    assetVariantIds: ["bronze-glow", "ivory-freckles"],
  },
  {
    id: "tan",
    label: "Tan",
    color: "#a86f3d",
    assetVariantIds: ["bronze-glow"],
  },
  {
    id: "olive",
    label: "Olive",
    color: "#85501f",
    assetVariantIds: ["deep-brown-mole", "bronze-glow"],
  },
  {
    id: "dark",
    label: "Dark",
    color: "#5c3415",
    assetVariantIds: ["deep-brown-mole"],
  },
];

const eyeOptions: Option[] = [
  {
    id: "black",
    label: "Black",
    color: "#18181d",
    assetVariantIds: ["droopy-brown"],
  },
  {
    id: "brown",
    label: "Brown",
    color: "#9d531a",
    assetVariantIds: ["droopy-brown"],
  },
  {
    id: "red",
    label: "Red",
    color: "#e84848",
    assetVariantIds: ["star-purple"],
  },
  {
    id: "yellow",
    label: "Yellow",
    color: "#ffd43b",
    darkText: true,
    assetVariantIds: ["almond-blue"],
  },
  {
    id: "green",
    label: "Green",
    color: "#42c365",
    assetVariantIds: ["fox-green"],
  },
  {
    id: "blue",
    label: "Blue",
    color: "#4a83e7",
    assetVariantIds: ["almond-blue"],
  },
  {
    id: "purple",
    label: "Purple",
    color: "#9d56e5",
    assetVariantIds: ["star-purple"],
  },
  {
    id: "pink",
    label: "Pink",
    color: "#de6bb0",
    assetVariantIds: ["star-purple"],
  },
  {
    id: "white",
    label: "White",
    color: "#ececec",
    darkText: true,
    assetVariantIds: ["almond-blue"],
  },
  {
    id: "gray",
    label: "Gray",
    color: "#a6a7b0",
    assetVariantIds: ["droopy-brown"],
  },
];

const lipOptions: Option[] = [
  {
    id: "glossy-rose-full",
    label: "Glossy Full",
    color: "#e99ca8",
  },
  { id: "matte-nude-thin", label: "Matte Thin", color: "#b97680" },
  { id: "m-shape-berry", label: "M-shaped", color: "#d97f8f" },
  { id: "bitten-cherry", label: "Bitten Lips", color: "#f0a4a2" },
];

const hairOptions: Option[] = [
  { id: "braided-blonde", label: "Braided", color: "#d8be8c", darkText: true },
  { id: "long-silky-blonde", label: "Long", color: "#e2c892", darkText: true },
  {
    id: "blonde-see-through-bangs",
    label: "Bangs",
    color: "#dcc08d",
    darkText: true,
  },
  {
    id: "high-ponytail-blonde",
    label: "Ponytail",
    color: "#d5ba86",
    darkText: true,
  },
  { id: "glass-black-bob", label: "Short", color: "#181818" },
  { id: "soft-bun-blonde", label: "Bun", color: "#caa26f", darkText: true },
  {
    id: "double-buns-blonde",
    label: "Buns",
    color: "#d4b07c",
    darkText: true,
  },
  { id: "soft-wavy-dark-brown", label: "Wavy", color: "#39251d" },
  { id: "gradient-pixie", label: "Pixie", color: "#8c5cff" },
];

const hairColorOptions: Option[] = [
  {
    id: "black",
    label: "Black",
    color: "#18181d",
    assetVariantIds: ["glass-black-bob"],
  },
  {
    id: "brown",
    label: "Brown",
    color: "#9d531a",
    assetVariantIds: ["soft-wavy-dark-brown"],
  },
  {
    id: "red",
    label: "Red",
    color: "#eb4949",
    assetVariantIds: ["gradient-pixie"],
  },
  {
    id: "yellow",
    label: "Yellow",
    color: "#ffd43b",
    darkText: true,
    assetVariantIds: ["long-silky-blonde", "braided-blonde"],
  },
  {
    id: "green",
    label: "Green",
    color: "#44c467",
    assetVariantIds: ["gradient-pixie"],
  },
  {
    id: "blue",
    label: "Blue",
    color: "#4a83e7",
    assetVariantIds: ["gradient-pixie"],
  },
  {
    id: "purple",
    label: "Purple",
    color: "#9d56e5",
    assetVariantIds: ["gradient-pixie"],
  },
  {
    id: "pink",
    label: "Pink",
    color: "#e468b0",
    assetVariantIds: ["gradient-pixie"],
  },
  {
    id: "white",
    label: "White",
    color: "#efefef",
    darkText: true,
    assetVariantIds: ["long-silky-blonde"],
  },
  {
    id: "gray",
    label: "Gray",
    color: "#a8a9b0",
    assetVariantIds: ["glass-black-bob"],
  },
];

const bodyOptions: Option[] = [
  { id: "slender-soft", label: "Slender", description: "Soft silhouette" },
  { id: "balanced-curvy", label: "Balanced", description: "Curvy standard" },
  { id: "athletic-toned", label: "Athletic", description: "Toned lines" },
  { id: "model-nine-head", label: "Model", description: "Long proportion" },
];

const vibeOptions: Option[] = [
  { id: "smile", label: "Smile", description: "Friendly" },
  { id: "sultry", label: "Sultry", description: "Magnetic" },
  { id: "smirk", label: "Smirk", description: "Playful" },
  { id: "blush", label: "Blush", description: "Soft" },
];

const skinVisualMap = {
  pale: {
    base: "#f4d8be",
    highlight: "rgba(255,244,234,0.88)",
    shadow: "rgba(182,132,98,0.18)",
    blush: "rgba(244,178,176,0.16)",
  },
  light: {
    base: "#f0cfa8",
    highlight: "rgba(255,240,223,0.84)",
    shadow: "rgba(174,122,84,0.18)",
    blush: "rgba(232,165,150,0.15)",
  },
  medium: {
    base: "#d5a06d",
    highlight: "rgba(241,194,148,0.45)",
    shadow: "rgba(140,84,46,0.22)",
    blush: "rgba(206,124,102,0.12)",
  },
  tan: {
    base: "#af733e",
    highlight: "rgba(223,156,96,0.35)",
    shadow: "rgba(104,56,28,0.24)",
    blush: "rgba(173,98,84,0.1)",
  },
  olive: {
    base: "#8b5929",
    highlight: "rgba(186,131,82,0.28)",
    shadow: "rgba(78,44,22,0.26)",
    blush: "rgba(150,89,72,0.08)",
  },
  dark: {
    base: "#603817",
    highlight: "rgba(148,98,60,0.24)",
    shadow: "rgba(52,28,14,0.3)",
    blush: "rgba(122,71,58,0.07)",
  },
} as const;

const eyeVisualMap = {
  black: { iris: "#1b1c20", ring: "#0c0d10", glow: "0 0 10px rgba(255,255,255,0.08)" },
  brown: { iris: "#92501f", ring: "#5d3110", glow: "0 0 12px rgba(146,80,31,0.16)" },
  red: { iris: "#e44747", ring: "#9f2222", glow: "0 0 14px rgba(228,71,71,0.22)" },
  yellow: { iris: "#ffd43b", ring: "#b8860b", glow: "0 0 14px rgba(255,212,59,0.28)" },
  green: { iris: "#41c668", ring: "#1f7b3c", glow: "0 0 14px rgba(65,198,104,0.24)" },
  blue: { iris: "#4c86ee", ring: "#2551af", glow: "0 0 14px rgba(76,134,238,0.26)" },
  purple: { iris: "#9e56e5", ring: "#5c2fa6", glow: "0 0 18px rgba(158,86,229,0.32)" },
  pink: { iris: "#df6ab2", ring: "#a63878", glow: "0 0 14px rgba(223,106,178,0.25)" },
  white: { iris: "#f2f2f2", ring: "#c9c9c9", glow: "0 0 12px rgba(255,255,255,0.3)" },
  gray: { iris: "#9ea1ab", ring: "#6a6e78", glow: "0 0 12px rgba(158,161,171,0.18)" },
} as const;

const hairVisualMap = {
  black: { base: "#191a1e", top: "#3a3b40", shine: "rgba(255,255,255,0.06)" },
  brown: { base: "#96501e", top: "#c17b42", shine: "rgba(255,214,180,0.12)" },
  red: { base: "#eb4949", top: "#ff7b7b", shine: "rgba(255,220,220,0.12)" },
  yellow: { base: "#e1b42b", top: "#ffe173", shine: "rgba(255,248,210,0.16)" },
  green: { base: "#44c567", top: "#7de39a", shine: "rgba(228,255,235,0.12)" },
  blue: { base: "#4a83e7", top: "#82b0ff", shine: "rgba(228,238,255,0.12)" },
  purple: { base: "#9d56e5", top: "#ca9cff", shine: "rgba(246,232,255,0.12)" },
  pink: { base: "#e468b0", top: "#f39fd0", shine: "rgba(255,229,243,0.12)" },
  white: { base: "#dfdfdf", top: "#f7f7f7", shine: "rgba(255,255,255,0.24)" },
  gray: { base: "#9ea1ab", top: "#c9ccd2", shine: "rgba(255,255,255,0.12)" },
} as const;

function mergeAssetOptions(sectionId: string, options: Option[]) {
  const assetSections = getAssetSections();
  const assets = assetSections.get(sectionId) ?? [];
  const assetMap = new Map(assets.map((item) => [item.variantId, item]));

  const merged = options.map((option) => {
    const asset =
      assetMap.get(option.id) ??
      option.assetVariantIds
        ?.map((variantId) => assetMap.get(variantId))
        .find(Boolean);
    return {
      ...option,
      imageUrl: asset?.imageUrl,
      status: asset?.status ?? "pending",
      prompt: asset?.prompt,
    };
  });

  if (merged.length > 0) {
    return merged;
  }

  return assets.map((item) => ({
    id: item.variantId,
    label: humanizeVariant(item.variantId),
    status: item.status,
    imageUrl: item.imageUrl,
    prompt: item.prompt,
  }));
}

function getSectionAssets(sectionId: string, baseProfileId?: string) {
  const assetSections = getAssetSections();
  const assets = assetSections.get(sectionId) ?? [];

  if (!baseProfileId) {
    return assets;
  }

  const matched = assets.filter((item) => item.baseProfileId === baseProfileId);
  if (matched.length > 0) {
    return matched;
  }

  const shared = assets.filter((item) => !item.baseProfileId);
  return shared.length > 0 ? shared : assets;
}

function mergeAssetOptionsByBaseProfile(
  sectionId: string,
  options: Option[],
  baseProfileId?: string,
) {
  const assets = getSectionAssets(sectionId, baseProfileId);
  const assetMap = new Map(assets.map((item) => [item.variantId, item]));

  const merged = options.map((option) => {
    const asset =
      assetMap.get(option.id) ??
      option.assetVariantIds
        ?.map((variantId) => assetMap.get(variantId))
        .find(Boolean);
    return {
      ...option,
      imageUrl: asset?.imageUrl,
      status: asset?.status ?? "pending",
      prompt: asset?.prompt,
    };
  });

  if (merged.length > 0) {
    return merged;
  }

  return assets.map((item) => ({
    id: item.variantId,
    label: humanizeVariant(item.variantId),
    status: item.status,
    imageUrl: item.imageUrl,
    prompt: item.prompt,
  }));
}

function humanizeVariant(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAssetItem(
  sectionId: string,
  variantId: string,
  baseProfileId?: string,
) {
  const assetSections = getAssetSections();
  const assets = getSectionAssets(sectionId, baseProfileId);
  return (
    assets.find((item) => item.variantId === variantId) ??
    (assetSections.get(sectionId) ?? []).find(
      (item) => item.variantId === variantId && !item.baseProfileId,
    )
  );
}

function getHairColorComboOptions(hairId: string, baseProfileId?: string): Option[] {
  return hairColorOptions.map((option) => {
    const comboVariantId = `${hairId}__${option.id}`;
    const asset = getAssetItem("hairColor", comboVariantId, baseProfileId);

    return {
      ...option,
      imageUrl: asset?.imageUrl,
      status: asset?.status ?? "pending",
      prompt: asset?.prompt,
    };
  });
}

function getBaseProfileImage(baseProfileId: string) {
  return getAssetIndex().baseProfiles?.find((profile) => profile.id === baseProfileId)
    ?.imageUrl;
}

function getEthnicityOptions() {
  return ethnicityOptions.map((option) => {
    const asset = getAssetItem("ethnicity", option.id, option.id);
    const baseImageUrl = getBaseProfileImage(option.id);

    return {
      ...option,
      imageUrl: asset?.imageUrl ?? baseImageUrl,
      status:
        (asset?.imageUrl || baseImageUrl ? "ready" : undefined) ??
        asset?.status ??
        "pending",
      prompt: asset?.prompt,
    };
  });
}

function buildSectionMeta(baseProfileId: string) {
  return {
    ethnicity: {
      title: "Ethnicity",
      description: "切换角色的整体骨相气质与背景氛围。",
      options: getEthnicityOptions(),
    },
    age: {
      title: "Age Range",
      description: "控制年龄感与面部成熟度。",
      options: mergeAssetOptionsByBaseProfile("age", ageOptions, baseProfileId),
    },
    skin: {
      title: "Skin Tone",
      description: "按肤色面板快速切换角色基础肤色。",
      options: mergeAssetOptionsByBaseProfile("skin", skinOptions, baseProfileId),
    },
    eyes: {
      title: "Eye Color",
      description: "切换瞳孔主色与眼神氛围。",
      options: mergeAssetOptionsByBaseProfile("eyes", eyeOptions, baseProfileId),
    },
    lips: {
      title: "Lips",
      description: "修改唇形与妆面风格。",
      options: mergeAssetOptionsByBaseProfile("lips", lipOptions, baseProfileId),
    },
    hair: {
      title: "Hair Style",
      description: "控制发型轮廓与长度。",
      options: mergeAssetOptionsByBaseProfile("hair", hairOptions, baseProfileId),
    },
    hairColor: {
      title: "Hair Color",
      description: "切换头发主色调。",
      options: hairColorOptions,
    },
    body: {
      title: "Body Physicals",
      description: "修改身形比例、骨架和肉感。",
      options: mergeAssetOptionsByBaseProfile("body", bodyOptions, baseProfileId),
    },
    vibe: {
      title: "Expression & Vibe",
      description: "决定角色当前的情绪和镜头表现力。",
      options: mergeAssetOptionsByBaseProfile("vibe", vibeOptions, baseProfileId),
    },
  } satisfies Record<
    VisualSectionId,
    {
      title: string;
      description: string;
      options: Option[];
    }
  >;
}

const hotspotConfig: Array<{
  id: VisualSectionId;
  label: string;
  position: string;
}> = [
  {
    id: "hair",
    label: "Hair",
    position: "left-[50%] top-[9%] -translate-x-1/2",
  },
  { id: "eyes", label: "Eyes", position: "left-[59%] top-[27%]" },
  { id: "lips", label: "Lips", position: "left-[58%] top-[39%]" },
  { id: "skin", label: "Skin", position: "left-[26%] top-[30%]" },
  { id: "hairColor", label: "Hair Color", position: "left-[19%] top-[23%]" },
  { id: "body", label: "Body", position: "left-[68%] top-[57%]" },
  { id: "vibe", label: "Vibe", position: "left-[17%] top-[15%]" },
  { id: "age", label: "Age", position: "left-[16%] top-[50%]" },
  { id: "ethnicity", label: "Ethnicity", position: "left-[18%] top-[68%]" },
];

const defaultState: AvatarState = {
  ...defaultAiGirlCharacterDNA,
};

export function AiCharacterPage({ navItems }: { navItems: NavItem[] }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<VisualSectionId>("hair");
  const [avatar, setAvatar] = useState<AvatarState>(defaultState);
  const [assetVersion, setAssetVersion] = useState(0);

  useEffect(() => {
    let disposed = false;

    fetchCharacterAssets({
      includeMeta: getAssetIndex() === emptyAssetIndex,
      sectionIds: ["ethnicity", "hair"],
    }).then(() => {
      if (!disposed) {
        setAssetVersion((value) => value + 1);
      }
    });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    const sectionIds = new Set<string>([activeSection]);

    if (activeSection === "hairColor") {
      sectionIds.add("hair");
      sectionIds.add("hairColor");
    }

    const missingSectionIds = Array.from(sectionIds).filter(
      (sectionId) => !assetSectionsCache[sectionId],
    );

    if (missingSectionIds.length === 0) {
      return () => {
        disposed = true;
      };
    }

    fetchCharacterAssets({
      sectionIds: missingSectionIds,
    }).then(() => {
      if (!disposed) {
        setAssetVersion((value) => value + 1);
      }
    });

    return () => {
      disposed = true;
    };
  }, [activeSection]);

  void assetVersion;

  const sectionMeta = buildSectionMeta(avatar.ethnicity);
  const activeMeta = sectionMeta[activeSection];
  const activeOptions =
    activeSection === "hairColor"
      ? getHairColorComboOptions(avatar.hair, avatar.ethnicity)
      : activeMeta.options;
  const ethnicityMeta = sectionMeta.ethnicity;
  const selectedLabel = activeOptions.find(
    (option) => option.id === avatar[activeSection],
  )?.label;
  const selectedActiveOption = activeOptions.find(
    (option) => option.id === avatar[activeSection],
  );
  const selectedEthnicityOption = ethnicityMeta.options.find(
    (option) => option.id === avatar.ethnicity,
  );
  const selectedHairOption = sectionMeta.hair.options.find(
    (option) => option.id === avatar.hair,
  );
  const hasGeneratedHairColorImage =
    activeSection === "hairColor" && Boolean(selectedActiveOption?.imageUrl);
  const selectedEthnicityLabel = ethnicityMeta.options.find(
    (option) => option.id === avatar.ethnicity,
  )?.label;
  const previewImageUrl =
    selectedActiveOption?.imageUrl ||
    (activeSection === "hairColor" ? selectedHairOption?.imageUrl : undefined) ||
    selectedEthnicityOption?.imageUrl;

  const toolPanelContent = (
    <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#171920] via-[#161922] to-[#13161d] backdrop-blur-sm transition-all duration-500 hover:border-white/12 hover:shadow-xl hover:shadow-black/30">
      <div className="border-b border-white/5 px-5 pb-3 pt-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-white text-black">
            <CircleUserRound className="size-4" />
          </div>
          <div>
            <h2 className="text-[1.08rem] font-semibold tracking-[-0.03em] text-white">
              AI Girlfriend
            </h2>
            <p className="text-[0.7rem] text-white/42">
              点击人物局部，直接编辑对应属性
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col gap-4">
          <div>
            <div className="px-1 pb-2">
              <div className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                Preview
              </div>
            </div>
            <VisualEditorStage
              avatar={avatar}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              selectedAssetImageUrl={previewImageUrl}
              useHairColorTint={!hasGeneratedHairColorImage}
            />
          </div>

          <div className="space-y-4">
            <section className="rounded-[24px] border border-[#ff9838]/18 bg-[linear-gradient(180deg,rgba(255,152,56,0.08),rgba(255,255,255,0.03))] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[#ffb067]">
                    Base Character
                  </div>
                  <div className="mt-1 text-[0.92rem] font-semibold text-white">
                    Ethnicity
                  </div>
                  <p className="mt-1 text-[0.7rem] leading-5 text-white/52">
                    这是角色的基础设定，会决定整体骨相、肤色方向和默认气质。
                  </p>
                </div>
                <div className="rounded-full border border-[#ff9838]/25 bg-[#2d1e14] px-2.5 py-1 text-[0.66rem] font-medium text-[#ffb067]">
                  {selectedEthnicityLabel}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {ethnicityMeta.options.map((option) => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    selected={avatar.ethnicity === option.id}
                    emphasize={avatar.ethnicity === option.id}
                    onClick={() => {
                      setAvatar((prev) => ({
                        ...prev,
                        ethnicity: option.id,
                      }));
                      setActiveSection("ethnicity");
                    }}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[0.82rem] font-semibold text-white">
                    {activeMeta.title}
                  </div>
                  <p className="mt-1 text-[0.7rem] leading-5 text-white/48">
                    {activeMeta.description}
                  </p>
                </div>
                <div className="rounded-full border border-[#ff9838]/25 bg-[#2d1e14] px-2.5 py-1 text-[0.66rem] font-medium text-[#ffb067]">
                  {selectedLabel}
                </div>
              </div>

              <div
                className={cn(
                  "mt-3 gap-2",
                  activeSection === "skin"
                    ? "grid grid-cols-3 sm:grid-cols-6"
                    : activeSection === "eyes" || activeSection === "hairColor"
                      ? "grid grid-cols-2 sm:grid-cols-4"
                      : "grid grid-cols-3",
                )}
              >
                {activeOptions.map((option) =>
                  "color" in option && option.color ? (
                    <ColorOptionButton
                      key={option.id}
                      option={option}
                      selected={avatar[activeSection] === option.id}
                      onClick={() =>
                        setAvatar((prev) => ({
                          ...prev,
                          [activeSection]: option.id,
                        }))
                      }
                    />
                  ) : (
                    <OptionCard
                      key={option.id}
                      option={option}
                      selected={avatar[activeSection] === option.id}
                      onClick={() =>
                        setAvatar((prev) => ({
                          ...prev,
                          [activeSection]: option.id,
                        }))
                      }
                    />
                  ),
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-3.5">
              <div className="text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-white/38">
                Character DNA
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <SummaryChip
                  label={findLabel(
                    sectionMeta.ethnicity.options,
                    avatar.ethnicity,
                  )}
                />
                <SummaryChip
                  label={findLabel(sectionMeta.age.options, avatar.age)}
                />
                <SummaryChip
                  label={findLabel(sectionMeta.skin.options, avatar.skin)}
                />
                <SummaryChip
                  label={findLabel(sectionMeta.eyes.options, avatar.eyes)}
                />
                <SummaryChip
                  label={findLabel(sectionMeta.hair.options, avatar.hair)}
                />
                <SummaryChip
                  label={findLabel(hairColorOptions, avatar.hairColor)}
                />
                <SummaryChip
                  label={findLabel(sectionMeta.vibe.options, avatar.vibe)}
                />
              </div>
              <button
                type="button"
                className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-full border border-[#ff9838]/30 bg-[#ff9838]/12 px-4 py-2 text-[0.78rem] font-medium text-[#ffbe82] transition hover:border-[#ff9838]/50 hover:bg-[#ff9838]/18"
                onClick={() => {
                  sessionStorage.setItem(
                    AI_GIRL_DNA_STORAGE_KEY,
                    JSON.stringify(avatar),
                  );
                  router.push("/ai-girl/generate");
                }}
              >
                进入专属生图
              </button>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-white/38">
                  Material Status
                </div>
                <div className="text-[0.7rem] text-white/46">
                  {getAssetIndex().summary.completedVariants} ready /{" "}
                  {getAssetIndex().summary.pendingVariants} pending
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  const mainPanelContent = (
    <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#111214] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-500 hover:border-white/12">
      <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 pb-3.5 pt-3.5">
        <div className="flex min-w-0 shrink items-center gap-2">
          {[
            { icon: Wand2, active: true },
            { icon: Layers3, active: false },
          ].map((item, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[18px] border transition-all duration-200",
                item.active
                  ? "border-white/10 bg-white text-[#121315]"
                  : "border-white/10 bg-transparent text-white/70 hover:border-white/18 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <item.icon className="size-[15px]" />
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 whitespace-nowrap">
          <div className="hidden items-center gap-2 xl:flex">
            <div className="h-1 w-40 rounded-full bg-white/10">
              <div className="relative h-full w-[54%] rounded-full bg-white/18">
                <span className="absolute right-0 top-1/2 size-6 -translate-y-1/2 rounded-full border border-white/20 bg-white shadow-[0_6px_18px_rgba(0,0,0,0.32)]" />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-[18px] border border-white/8 bg-white/[0.02] p-1">
            {[Camera, Clapperboard, AudioWaveform, Search].map(
              (Icon, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border transition-all duration-200",
                    index === 0
                      ? "border-white/10 bg-white/12 text-white"
                      : "border-transparent bg-transparent text-white/38 hover:text-white/72",
                  )}
                >
                  <Icon className="size-[15px]" />
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-[#0d0f14] via-[#0f1117] to-[#111319]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/[0.02] to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_52%)]" />
        <div className="flex min-h-full items-center justify-center px-6 py-10 sm:py-12 lg:py-16">
          <div className="flex w-full max-w-[760px] flex-col items-center pb-24 text-center sm:pb-28 lg:pb-32">
            <div className="absolute left-6 top-6 flex gap-2">
              <GhostPill />
              <GhostPill short />
              <GhostPill short />
            </div>

            <div className="relative mb-8 mt-8 flex w-full max-w-[520px] items-end justify-center">
              {previewCards.map((card, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative -mx-2 h-[138px] w-[94px] rounded-[20px] border border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] p-2 shadow-[0_18px_52px_rgba(0,0,0,0.34)] backdrop-blur-md sm:h-[164px] sm:w-[114px] lg:h-[194px] lg:w-[136px]",
                    card.transform,
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-[16px] bg-gradient-to-br",
                      card.accent,
                    )}
                  />
                  {index === 2 ? (
                    <button
                      aria-label="Play preview"
                      className="absolute right-3 top-3 flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/18 text-white transition-colors hover:bg-white/24"
                    >
                      <Play className="ml-0.5 size-4 fill-current" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <SkeletonLine className="h-4.5 w-40" />
            <div className="mt-3 space-y-3">
              <SkeletonLine className="h-3.5 w-72 max-w-full" />
              <SkeletonLine className="mx-auto h-3.5 w-52" />
            </div>
            <div className="mt-4 flex gap-2.5">
              <ActionDot />
              <ActionDot />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <CreateLayout
      navItems={navItems}
      category="Image"
      toolPanelContent={toolPanelContent}
      mainPanelContent={mainPanelContent}
      variant="two-column"
    />
  );
}

function VisualEditorStage({
  avatar,
  activeSection,
  onSectionChange,
  selectedAssetImageUrl,
  useHairColorTint,
}: {
  avatar: AvatarState;
  activeSection: VisualSectionId;
  onSectionChange: (section: VisualSectionId) => void;
  selectedAssetImageUrl?: string;
  useHairColorTint: boolean;
}) {
  const sectionMeta = buildSectionMeta(avatar.ethnicity);
  const skinTone =
    (sectionMeta.skin.options.find((item) => item.id === avatar.skin) as
      | Option
      | undefined) ?? skinOptions[0];
  const lipStyle =
    (sectionMeta.lips.options.find((item) => item.id === avatar.lips) as
      | Option
      | undefined) ?? lipOptions[0];
  const hairColor =
    (sectionMeta.hairColor.options.find(
      (item) => item.id === avatar.hairColor,
    ) as Option | undefined) ?? hairColorOptions[0];
  const ethnicity =
    (sectionMeta.ethnicity.options.find(
      (item) => item.id === avatar.ethnicity,
    ) as Option | undefined) ?? ethnicityOptions[0];

  const faceSizeClass =
    avatar.age === "teen"
      ? "h-[160px] w-[124px]"
      : avatar.age === "senior"
        ? "h-[176px] w-[126px]"
        : "h-[168px] w-[122px]";

  const hairShapeClass = avatar.hair.includes("gradient-pixie")
    ? "h-[34%] rounded-[42%]"
    : avatar.hair.includes("glass-black-bob")
      ? "h-[42%] rounded-t-[44%] rounded-b-[34%]"
      : avatar.hair.includes("soft-bun")
        ? "h-[42%] rounded-t-[48%] rounded-b-[30%]"
        : avatar.hair.includes("double-buns")
          ? "h-[40%] rounded-t-[46%] rounded-b-[28%]"
          : avatar.hair.includes("high-ponytail")
            ? "h-[44%] rounded-t-[50%] rounded-b-[28%]"
            : avatar.hair.includes("braided")
              ? "h-[48%] rounded-t-[48%] rounded-b-[28%]"
              : avatar.hair.includes("long")
                ? "h-[54%] rounded-t-[50%] rounded-b-[24%]"
                : avatar.hair.includes("blonde")
                  ? "h-[48%] rounded-t-[50%] rounded-b-[30%]"
                  : "h-[55%] rounded-t-[48%] rounded-b-[26%]";

  const eyeShapeClass = "h-[10px] w-[24px] rounded-[999px]";

  const bodyWidthClass = avatar.body.includes("slender-soft")
    ? "w-[42%]"
    : avatar.body.includes("athletic-toned")
      ? "w-[51%]"
      : avatar.body.includes("model-nine-head")
        ? "w-[39%]"
        : "w-[47%]";

  const mouthClass = avatar.vibe.includes("smirk")
    ? "h-[12px] w-[32px] rounded-b-[999px] border-b-[2px] border-r-[2px]"
    : avatar.vibe.includes("blush")
      ? "h-[8px] w-[26px] rounded-b-[999px] border-b-[2px]"
      : avatar.vibe.includes("smile")
        ? "h-[14px] w-[34px] rounded-b-[999px] border-b-[2px]"
        : "h-[2px] w-[28px] rounded-full";

  const eyeGlow =
    eyeVisualMap[avatar.eyes as keyof typeof eyeVisualMap]?.glow ??
    "0 0 10px rgba(255,255,255,0.1)";

  const skinVisual =
    skinVisualMap[avatar.skin as keyof typeof skinVisualMap] ??
    skinVisualMap.tan;
  const eyeVisual =
    eyeVisualMap[avatar.eyes as keyof typeof eyeVisualMap] ??
    eyeVisualMap.blue;
  const hairVisual =
    hairVisualMap[avatar.hairColor as keyof typeof hairVisualMap] ??
    hairVisualMap.pink;
  const showHairTintOnPhoto =
    activeSection === "hairColor" && useHairColorTint;
  const hairTintBlendMode =
    avatar.hairColor === "black" || avatar.hairColor === "brown"
      ? "multiply"
      : avatar.hairColor === "white" || avatar.hairColor === "yellow"
        ? "screen"
        : "color";
  const hairTintOpacity =
    avatar.hairColor === "black"
      ? 0.28
      : avatar.hairColor === "brown"
        ? 0.22
        : avatar.hairColor === "white"
          ? 0.34
          : avatar.hairColor === "gray"
            ? 0.26
            : 0.4;

  const portraitBackground = avatar.ethnicity.includes("black")
    ? "linear-gradient(180deg,#20181a 0%,#12141c 46%,#0c0e14 100%)"
    : avatar.ethnicity.includes("asian")
      ? "linear-gradient(180deg,#1d1a22 0%,#11141c 48%,#0c0f15 100%)"
      : avatar.ethnicity.includes("latina")
        ? "linear-gradient(180deg,#221916 0%,#13151c 48%,#0c0f15 100%)"
        : avatar.ethnicity.includes("arab")
          ? "linear-gradient(180deg,#221913 0%,#13161d 48%,#0c0f15 100%)"
          : avatar.ethnicity.includes("indian")
            ? "linear-gradient(180deg,#231914 0%,#14161d 48%,#0c0f15 100%)"
        : "linear-gradient(180deg,#1f1a1a 0%,#12141c 48%,#0c0f15 100%)";

  return (
      <div className="relative overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_50%_0%,rgba(115,136,255,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-2 py-2.5">
        <div className="mb-2.5 flex items-center justify-end gap-3 px-1">
          <div className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[0.66rem] text-white/58">
            {ethnicity.label}
          </div>
        </div>
        <div
          className="absolute inset-0"
          style={{ background: portraitBackground }}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-x-[14%] top-[8%] h-[62%] rounded-full bg-gradient-to-b opacity-90 blur-3xl",
            ethnicity.ring ?? "from-[#d6b8a6] to-[#9eaaff]",
          )}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_50%_50%,rgba(255,214,178,0.07),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0e1015] to-transparent" />

        <div className="relative mx-auto h-[460px] max-w-[330px]">
          {selectedAssetImageUrl ? (
            <div className="absolute inset-x-2 top-[4%] bottom-[3%] overflow-hidden rounded-[26px] border border-white/10 shadow-[0_24px_56px_rgba(0,0,0,0.4)]">
              <img
                src={selectedAssetImageUrl}
                alt={`${activeSection} preview`}
                className="h-full w-full object-cover"
              />
              {showHairTintOnPhoto ? (
                <>
                  <div
                    className="pointer-events-none absolute inset-x-[16%] top-[2%] h-[28%] rounded-[46%] blur-[6px]"
                    style={{
                      background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 58%, rgba(0,0,0,0.22) 100%)`,
                      opacity: hairTintOpacity,
                      mixBlendMode: hairTintBlendMode,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute left-[10%] top-[12%] h-[38%] w-[19%] rounded-[999px] blur-[5px]"
                    style={{
                      background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 70%, rgba(0,0,0,0.16) 100%)`,
                      opacity: hairTintOpacity * 0.8,
                      mixBlendMode: hairTintBlendMode,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute right-[10%] top-[12%] h-[38%] w-[19%] rounded-[999px] blur-[5px]"
                    style={{
                      background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 70%, rgba(0,0,0,0.16) 100%)`,
                      opacity: hairTintOpacity * 0.8,
                      mixBlendMode: hairTintBlendMode,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-[20%] top-[5%] h-[16%] rounded-[999px] blur-[14px]"
                    style={{
                      background: hairVisual.shine,
                      opacity:
                        avatar.hairColor === "black" || avatar.hairColor === "brown"
                          ? 0.04
                          : 0.16,
                      mixBlendMode: "screen",
                    }}
                  />
                </>
              ) : null}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
            </div>
          ) : null}
          {!selectedAssetImageUrl ? (
            <>
              <div className="absolute left-1/2 top-[4%] h-[380px] w-[286px] -translate-x-1/2 rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] shadow-[0_24px_56px_rgba(0,0,0,0.4)] backdrop-blur-[2px]" />
              <div className="absolute left-1/2 top-[7%] h-[322px] w-[242px] -translate-x-1/2 rounded-[26px] bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.25),transparent_28%),radial-gradient(circle_at_50%_70%,rgba(255,220,180,0.12),transparent_34%)] opacity-75" />
              <div
                className={cn(
                  "absolute left-1/2 top-[12%] -translate-x-1/2 rounded-[44%] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.42)]",
                  faceSizeClass,
                )}
                style={{
                  background: `radial-gradient(circle at 50% 18%, ${skinVisual.highlight}, transparent 22%), radial-gradient(circle at 50% 72%, ${skinVisual.shadow}, transparent 36%), ${skinVisual.base}`,
                }}
              >
                <div
                    className={cn(
                      "absolute left-1/2 top-[-8%] w-[126%] -translate-x-1/2 bg-gradient-to-b shadow-[0_30px_60px_rgba(0,0,0,0.34)]",
                      hairShapeClass,
                    )}
                    style={{
                      background: avatar.hair.includes("gradient-pixie")
                      ? `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 58%, rgba(0,0,0,0.92) 100%)`
                      : `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 54%, rgba(0,0,0,0.92) 100%)`,
                    }}
                  />
                {avatar.hair.includes("soft-wavy") ||
                avatar.hair.includes("long-silky") ? (
                  <>
                    <div
                      className="absolute left-[-13%] top-[18%] h-[50%] w-[24%] rounded-[999px] opacity-95"
                      style={{
                        background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 56%, rgba(0,0,0,0.92) 100%)`,
                      }}
                    />
                    <div
                      className="absolute right-[-13%] top-[18%] h-[52%] w-[24%] rounded-[999px] opacity-95"
                      style={{
                        background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 56%, rgba(0,0,0,0.92) 100%)`,
                      }}
                    />
                  </>
                ) : null}
                {avatar.hair.includes("braided") ? (
                  <>
                    <div
                      className="absolute left-[6%] top-[34%] h-[42%] w-[14%] rounded-[999px]"
                      style={{
                        background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 58%, rgba(0,0,0,0.88) 100%)`,
                      }}
                    />
                    <div
                      className="absolute right-[6%] top-[34%] h-[42%] w-[14%] rounded-[999px]"
                      style={{
                        background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 58%, rgba(0,0,0,0.88) 100%)`,
                      }}
                    />
                    <div className="absolute left-[8%] top-[68%] h-[6%] w-[10%] rounded-full bg-black/45" />
                    <div className="absolute right-[8%] top-[68%] h-[6%] w-[10%] rounded-full bg-black/45" />
                  </>
                ) : null}
                {avatar.hair.includes("blonde") ? (
                  <div
                    className="absolute left-[24%] top-[13%] h-[24px] w-[52%] rounded-b-[999px] shadow-[0_10px_18px_rgba(0,0,0,0.12)]"
                    style={{ backgroundColor: hairVisual.top }}
                  />
                ) : null}
                {avatar.hair.includes("high-ponytail") ? (
                  <>
                    <div
                      className="absolute left-[64%] top-[2%] h-[28%] w-[18%] rounded-[999px]"
                      style={{
                        background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 58%, rgba(0,0,0,0.9) 100%)`,
                      }}
                    />
                    <div
                      className="absolute left-[58%] top-[12%] h-[8%] w-[12%] rounded-full"
                      style={{ backgroundColor: hairVisual.shine }}
                    />
                  </>
                ) : null}
                {avatar.hair.includes("soft-bun") ? (
                  <div
                    className="absolute left-1/2 top-[-10%] h-[22%] w-[26%] -translate-x-1/2 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 56%, rgba(0,0,0,0.88) 100%)`,
                    }}
                  />
                ) : null}
                {avatar.hair.includes("double-buns") ? (
                  <>
                    <div
                      className="absolute left-[8%] top-[0%] h-[18%] w-[22%] rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 56%, rgba(0,0,0,0.88) 100%)`,
                      }}
                    />
                    <div
                      className="absolute right-[8%] top-[0%] h-[18%] w-[22%] rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${hairVisual.top} 0%, ${hairVisual.base} 56%, rgba(0,0,0,0.88) 100%)`,
                      }}
                    />
                    <div className="absolute left-[15%] top-[10%] h-[4%] w-[10%] rounded-full bg-[#f09cb9]/80" />
                    <div className="absolute right-[15%] top-[10%] h-[4%] w-[10%] rounded-full bg-[#f09cb9]/80" />
                  </>
                ) : null}
                <div
                  className="absolute left-[28%] top-[44%] h-[13px] w-[13px] rounded-full border border-black/20"
                  style={{
                    background: `radial-gradient(circle at 38% 35%, rgba(255,255,255,0.9) 0 18%, ${eyeVisual.iris} 22% 68%, ${eyeVisual.ring} 72% 100%)`,
                  }}
                />
                <div
                  className="absolute right-[28%] top-[44%] h-[13px] w-[13px] rounded-full border border-black/20"
                  style={{
                    background: `radial-gradient(circle at 38% 35%, rgba(255,255,255,0.9) 0 18%, ${eyeVisual.iris} 22% 68%, ${eyeVisual.ring} 72% 100%)`,
                  }}
                />
                <div
                  className={cn(
                    "absolute left-[18%] top-[44%] border-[#121212]",
                    eyeShapeClass,
                  )}
                  style={{
                    borderBottomWidth: 2,
                    boxShadow: eyeGlow,
                  }}
                />
                <div
                  className={cn(
                    "absolute right-[18%] top-[44%] border-[#121212]",
                    eyeShapeClass,
                  )}
                  style={{
                    borderBottomWidth: 2,
                    boxShadow: eyeGlow,
                  }}
                />
                <div className="absolute left-[20%] top-[38%] h-[14px] w-[18px] rounded-full bg-white/10 blur-md" />
                <div className="absolute right-[20%] top-[38%] h-[14px] w-[18px] rounded-full bg-white/10 blur-md" />
                <div className="absolute left-1/2 top-[58%] h-[18px] w-[2px] -translate-x-1/2 rounded-full bg-[#6f4b3d]/45" />
                <div
                  className="absolute left-[34%] top-[62%] h-[12px] w-[18px] rounded-full blur-sm"
                  style={{ backgroundColor: skinVisual.blush }}
                />
                <div
                  className="absolute right-[34%] top-[62%] h-[12px] w-[18px] rounded-full blur-sm"
                  style={{ backgroundColor: skinVisual.blush }}
                />
                <div
                  className={cn(
                    "absolute left-1/2 top-[73%] -translate-x-1/2 border-[#4e2f31]",
                    mouthClass,
                  )}
                  style={{
                    borderColor: lipStyle.color,
                    backgroundColor: avatar.vibe.includes("sultry")
                      ? lipStyle.color
                      : "transparent",
                    boxShadow: avatar.vibe.includes("sultry")
                      ? `0 0 20px ${lipStyle.color}35`
                      : undefined,
                  }}
                />
                {avatar.vibe.includes("blush") ? (
                  <>
                    <div className="absolute left-[12%] top-[62%] h-[15px] w-[24px] rounded-full bg-[#ff8ca3]/25 blur-[3px]" />
                    <div className="absolute right-[12%] top-[62%] h-[15px] w-[24px] rounded-full bg-[#ff8ca3]/25 blur-[3px]" />
                  </>
                ) : null}
              </div>

              <div
                className="absolute left-1/2 top-[47%] h-[52px] w-[34px] -translate-x-1/2 rounded-b-[22px] rounded-t-[12px] border border-white/6 opacity-85"
                style={{
                  background: `linear-gradient(180deg, ${skinVisual.base}, ${skinVisual.shadow})`,
                }}
              />

              <div
                className={cn(
                  "absolute left-1/2 top-[56%] h-[176px] -translate-x-1/2 rounded-t-[58px] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] shadow-[0_35px_60px_rgba(0,0,0,0.3)]",
                  bodyWidthClass,
                )}
              >
                <div className="absolute inset-[1px] rounded-t-[56px] bg-[linear-gradient(180deg,#2a3044,#161922)]" />
                <div
                  className="absolute left-[-16%] top-[9%] h-[22px] w-[34%] rounded-full"
                  style={{ backgroundColor: skinVisual.base }}
                />
                <div
                  className="absolute right-[-16%] top-[9%] h-[22px] w-[34%] rounded-full"
                  style={{ backgroundColor: skinVisual.base }}
                />
                <div className="absolute inset-x-[10%] top-[10%] h-[30%] rounded-[28px] bg-white/6 blur-sm" />
                <div className="absolute bottom-[-2%] left-[18%] h-[28%] w-[24%] rounded-t-[24px] bg-[#171922]" />
                <div className="absolute bottom-[-2%] right-[18%] h-[28%] w-[24%] rounded-t-[24px] bg-[#171922]" />
                <div className="absolute left-1/2 top-[8%] h-[24%] w-[30%] -translate-x-1/2 rounded-b-[36px] bg-black/12 blur-md" />
              </div>
            </>
          ) : null}

          {hotspotConfig.map((hotspot) => (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => onSectionChange(hotspot.id)}
              className={cn(
                "absolute rounded-full border px-2.5 py-1 text-[0.64rem] font-medium transition-all",
                hotspot.position,
                activeSection === hotspot.id
                  ? "border-[#ff9838] bg-[#2d1e14] text-[#ffb067] shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
                  : "border-white/10 bg-black/30 text-white/72 hover:bg-black/45",
              )}
            >
              {hotspot.label}
            </button>
          ))}
        </div>
      </div>
  );
}

function ColorOptionButton({
  option,
  selected,
  onClick,
}: {
  option: Option;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[16px] border p-2 transition-all",
        selected
          ? "border-[#ff9838] bg-[#2d1e14] shadow-[0_0_0_1px_rgba(255,152,56,0.4)]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
      )}
    >
      <div
        className="relative h-16 overflow-hidden rounded-[12px]"
        style={{ backgroundColor: option.color }}
      >
        {option.imageUrl ? (
          <img
            src={option.imageUrl}
            alt={option.label}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div
        className={cn(
          "mt-2 text-[0.7rem] font-medium",
          option.darkText ? "text-white" : "text-white/86",
        )}
      >
        {option.label}
      </div>
      <OptionStatus status={option.status} />
    </button>
  );
}

function OptionCard({
  option,
  selected,
  emphasize = false,
  onClick,
}: {
  option: Option;
  selected: boolean;
  emphasize?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[16px] border px-3 py-3 text-left transition-all",
        selected
          ? "border-[#ff9838] bg-[#2d1e14] shadow-[0_0_0_1px_rgba(255,152,56,0.4)]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
        emphasize && "shadow-[0_18px_36px_rgba(0,0,0,0.22)]",
      )}
    >
      {option.imageUrl ? (
        <div
          className={cn(
            "mb-2 overflow-hidden rounded-[12px] border border-white/8",
            emphasize ? "h-[92px]" : "h-[72px]",
          )}
        >
          <img
            src={option.imageUrl}
            alt={option.label}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="text-[0.76rem] font-semibold text-white">
        {option.label}
      </div>
      {option.description ? (
        <div className="mt-1 text-[0.68rem] leading-5 text-white/42">
          {option.description}
        </div>
      ) : null}
      <OptionStatus status={option.status} className="mt-2" />
    </button>
  );
}

function OptionStatus({
  status,
  className,
}: {
  status?: "ready" | "pending" | "failed";
  className?: string;
}) {
  if (!status) {
    return null;
  }

  const label =
    status === "ready" ? "Ready" : status === "failed" ? "Failed" : "Pending";

  return (
    <div
      className={cn(
        "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[0.62rem] font-medium",
        status === "ready"
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : status === "failed"
            ? "border-rose-400/25 bg-rose-500/10 text-rose-300"
            : "border-white/10 bg-white/[0.04] text-white/48",
        className,
      )}
    >
      {label}
    </div>
  );
}

function SummaryChip({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.68rem] text-white/78">
      {label}
    </div>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(255,255,255,0.18),rgba(255,255,255,0.08))]",
        className,
      )}
    />
  );
}

function GhostPill({ short = false }: { short?: boolean }) {
  return (
    <div
      className={cn(
        "h-6 rounded-full border border-white/8 bg-white/[0.05]",
        short ? "w-12" : "w-16",
      )}
    />
  );
}

function ActionDot() {
  return (
    <button
      aria-label="Preview action"
      className="size-8 rounded-full border border-white/10 bg-white/[0.05] transition-colors hover:bg-white/[0.1]"
    />
  );
}

function findLabel(options: Option[], id: string) {
  return options.find((item) => item.id === id)?.label ?? id;
}
