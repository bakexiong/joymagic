import fs from "fs";
import path from "path";

import {
  getCanvasAgentSkillRegistry,
  type CanvasAgentSkillRegistryItem,
} from "@/mastra/workspace/canvas-agent-skill-registry";

export type CanvasAgentSkillId =
  | "auto"
  | "template"
  | "commerce-set"
  | "poster-design"
  | "brand-design"
  | "interior-design"
  | "social-media"
  | "story-short"
  | "marketing-video"
  | "smart-comic"
  | "marketing-poster"
  | "product-image-edit"
  | "story-video";

export type ResolvedCanvasAgentSkillId = Exclude<CanvasAgentSkillId, "auto">;

export type CanvasAgentSkillSelection = {
  requestedSkillId?: string | null;
  resolvedSkillId?: ResolvedCanvasAgentSkillId;
  routeStrategy:
    | "explicit"
    | "auto-disabled"
    | "auto-matched"
    | "auto-template";
  routeReason: string;
};

function normalizeSkillId(value?: string | null) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized || null;
}

const skillInstructionCache = new Map<string, string>();
const CANVAS_AGENT_SKILL_ALIAS_MAP: Partial<
  Record<CanvasAgentSkillId, ResolvedCanvasAgentSkillId>
> = {
  "marketing-poster": "poster-design",
  "product-image-edit": "commerce-set",
  "story-video": "story-short",
};

function getEnabledCanvasAgentSkills() {
  return getCanvasAgentSkillRegistry().filter((item) => item.enabled);
}

function getCanvasAgentSkillById(id?: string | null) {
  if (!id) return null;
  const resolvedId =
    CANVAS_AGENT_SKILL_ALIAS_MAP[id as CanvasAgentSkillId] || id;
  return (
    getEnabledCanvasAgentSkills().find((item) => item.id === resolvedId) ?? null
  );
}

function getCanvasAgentSkillsDirectory() {
  return path.join(process.cwd(), "src/mastra/skills");
}

function readSkillInstructions(directory: string) {
  const cacheKey = directory;
  const cached = skillInstructionCache.get(cacheKey);
  if (cached) return cached;

  const filePath = path.join(
    getCanvasAgentSkillsDirectory(),
    directory,
    "SKILL.md",
  );
  const content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8").trim()
    : "";

  skillInstructionCache.set(cacheKey, content);
  return content;
}

function scoreSkillMatch(input: {
  message: string;
  referencesCount?: number;
  item: CanvasAgentSkillRegistryItem;
}) {
  const normalizedMessage = input.message.toLowerCase();
  let score = 0;

  for (const keyword of input.item.keywords || []) {
    if (normalizedMessage.includes(keyword.toLowerCase())) {
      score += keyword.length <= 3 ? 1 : 2;
    }
  }

  if (input.item.prefersReferences && (input.referencesCount || 0) > 0) {
    score += 3;
  }

  if (
    input.item.preferredMediaIntent === "video" &&
    /(视频|动画|motion|trailer|teaser|reel|storyboard|镜头|camera|cinematic)/i.test(
      input.message,
    )
  ) {
    score += 2;
  }

  if (
    input.item.id === "marketing-video" &&
    /(产品|卖点|转化|广告|promo|commercial|marketing|feed ad|tvc|listing)/i.test(
      input.message,
    )
  ) {
    score += 3;
  }

  if (
    input.item.id === "story-short" &&
    /(剧情|角色|反转|冲突|叙事|narrative|drama|story|episode)/i.test(
      input.message,
    )
  ) {
    score += 3;
  }

  if (
    input.item.preferredMediaIntent === "image" &&
    /(海报|banner|poster|商品图|产品图|主图|white background|mockup|品牌|logo|vi|interior|室内|social|carousel|comic|漫画|漫剧)/i.test(
      input.message,
    )
  ) {
    score += 2;
  }

  return score;
}

function resolveAutoMatchedSkill(input: {
  message: string;
  referencesCount?: number;
}): {
  skill: CanvasAgentSkillRegistryItem | null;
  reason: string;
} {
  const candidates = getEnabledCanvasAgentSkills().filter(
    (item) =>
      item.id !== "template" &&
      item.id !== "marketing-poster" &&
      item.id !== "product-image-edit" &&
      item.id !== "story-video",
  );

  let bestMatch: CanvasAgentSkillRegistryItem | null = null;
  let bestScore = 0;

  for (const item of candidates) {
    const score = scoreSkillMatch({
      message: input.message,
      referencesCount: input.referencesCount,
      item,
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (!bestMatch || bestScore < 2) {
    return {
      skill: getCanvasAgentSkillById("template"),
      reason:
        "No strong skill match was found, so the generic canvas skill was selected.",
    };
  }

  return {
    skill: bestMatch,
    reason: `Matched the request to ${bestMatch.id} with score ${bestScore}.`,
  };
}

export type CanvasAgentResolvedSkillContext = {
  requestedSkillId?: string | null;
  resolvedSkillId: ResolvedCanvasAgentSkillId;
  routeStrategy: CanvasAgentSkillSelection["routeStrategy"];
  routeReason: string;
  title: string;
  description: string;
  instructions: string;
};

export function resolveCanvasAgentSkillSelection(input: {
  requestedSkillId?: string | null;
  message: string;
  referencesCount?: number;
  autoRoutingEnabled?: boolean;
}): CanvasAgentSkillSelection {
  const requestedSkillId = normalizeSkillId(input.requestedSkillId);
  const requestedSkill = getCanvasAgentSkillById(requestedSkillId);

  if (requestedSkillId && requestedSkillId !== "auto") {
    return {
      requestedSkillId,
      resolvedSkillId: (requestedSkill?.id ||
        "template") as ResolvedCanvasAgentSkillId,
      routeStrategy: "explicit",
      routeReason: requestedSkill
        ? `The caller explicitly requested the ${requestedSkill.id} skill.`
        : `The caller requested an unknown skill (${requestedSkillId}), so the generic template skill was used.`,
    };
  }

  if (!input.autoRoutingEnabled) {
    return {
      requestedSkillId,
      resolvedSkillId: undefined,
      routeStrategy: "auto-disabled",
      routeReason: "Automatic skill routing is disabled for this request.",
    };
  }

  const match = resolveAutoMatchedSkill({
    message: input.message,
    referencesCount: input.referencesCount,
  });

  return {
    requestedSkillId,
    resolvedSkillId: match.skill?.id as ResolvedCanvasAgentSkillId | undefined,
    routeStrategy:
      match.skill?.id && match.skill.id !== "template"
        ? "auto-matched"
        : "auto-template",
    routeReason: match.reason,
  };
}

export function buildCanvasAgentResolvedSkillContext(input: {
  requestedSkillId?: string | null;
  message: string;
  referencesCount?: number;
  autoRoutingEnabled?: boolean;
}): CanvasAgentResolvedSkillContext | null {
  const selection = resolveCanvasAgentSkillSelection(input);
  const skill = getCanvasAgentSkillById(selection.resolvedSkillId);

  if (!skill) return null;

  return {
    requestedSkillId: selection.requestedSkillId,
    resolvedSkillId: skill.id as ResolvedCanvasAgentSkillId,
    routeStrategy: selection.routeStrategy,
    routeReason: selection.routeReason,
    title: skill.title,
    description: skill.description,
    instructions: readSkillInstructions(skill.directory),
  };
}
