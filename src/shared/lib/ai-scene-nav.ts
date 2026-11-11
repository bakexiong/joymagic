import type { NavItem } from "@/shared/types/blocks/common";
import { isStudioToolHidden } from "@/shared/lib/studio-tool-visibility";

export type AiSceneCategory = "Image" | "Video";

type CombinedAiSceneEntry = {
  category: AiSceneCategory;
  item: NavItem;
};

function findAiMenuChildren(navItems: NavItem[], icon: AiSceneCategory) {
  return (
    navItems.find(
      (item) =>
        item.icon === icon &&
        Array.isArray(item.children) &&
        item.children.length > 0,
    )?.children ?? []
  );
}

function getNavItemUrl(item?: NavItem) {
  return item?.url || item?.children?.[0]?.url || "";
}

export function isHiddenAiScene(item?: NavItem) {
  if (!item) return false;
  const url = getNavItemUrl(item).toLowerCase();
  const title = `${item.title || ""} ${item.name || ""}`.toLowerCase();

  return (
    isStudioToolHidden(url) ||
    url.includes("/video-face-swap") ||
    url.includes("video-face-swap") ||
    title.includes("longcat avatar") ||
    title.includes("lip-sync") ||
    title.includes("video face swap")
  );
}

export function extractCombinedAiSceneItems(navItems?: NavItem[]) {
  return extractCombinedAiSceneEntries(navItems).map((entry) => entry.item);
}

export function extractCombinedAiSceneEntries(
  navItems?: NavItem[],
): CombinedAiSceneEntry[] {
  if (!navItems?.length) {
    return [];
  }

  return [
    ...findAiMenuChildren(navItems, "Image").map((item) => ({
      category: "Image" as const,
      item,
    })),
    ...findAiMenuChildren(navItems, "Video").map((item) => ({
      category: "Video" as const,
      item,
    })),
  ].filter((entry) => !isHiddenAiScene(entry.item));
}

export function groupAiScenesByCategory<
  T extends { category?: AiSceneCategory },
>(scenes: T[]) {
  return {
    imageScenes: scenes.filter((scene) => scene.category === "Image"),
    videoScenes: scenes.filter((scene) => scene.category === "Video"),
  };
}
