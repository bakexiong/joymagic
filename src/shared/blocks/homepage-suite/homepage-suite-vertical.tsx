"use client";

import { useMemo } from "react";

import { Link } from "@/core/i18n/navigation";
import { toCdnUrl, withOssImageResize } from "@/shared/lib/cdn";
import { isHiddenAiScene } from "@/shared/lib/ai-scene-nav";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/types/blocks/common";

type AiToolsCategory = "Image" | "Video";

function toId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getCreatorSceneId(scene?: NavItem): string {
  if (!scene) return "";
  if (scene.url) return scene.url;

  const title = scene.title || scene.name || "";
  if (!title) return "";

  return toId(title);
}

function getCreatorSceneHref(scene?: NavItem): string {
  const sceneId = getCreatorSceneId(scene);
  if (!sceneId) return "#";
  const params = new URLSearchParams({ scene: sceneId });
  return `/creator?${params.toString()}`;
}

function getPreferredNavUrl(item?: NavItem): string {
  if (!item) return "#";
  if (item.url) return item.url;

  for (const child of item.children || []) {
    const childUrl = getPreferredNavUrl(child);
    if (childUrl !== "#") return childUrl;
  }

  return "#";
}

function mapSceneItems(items: NavItem[]): NavItem[] {
  return items
    .map((item) => {
      const firstChild =
        item.children?.find((child) => child.url) || item.children?.[0];

      return {
        ...item,
        url: item.url || firstChild?.url,
        description: item.description || firstChild?.description,
        badge: item.badge || firstChild?.badge,
        icon: item.icon || firstChild?.icon,
        icon_url: item.icon_url || firstChild?.icon_url,
      };
    })
    .filter((item) => Boolean(item.url) && !isHiddenAiScene(item));
}

function resolveToolHref(tool: NavItem) {
  const creatorHref = getCreatorSceneHref(tool);
  if (creatorHref !== "#") return creatorHref;
  return getPreferredNavUrl(tool);
}

function CompactToolCard({
  tool,
  category,
}: {
  tool: NavItem;
  category: AiToolsCategory;
}) {
  const label = tool.title || tool.name || "Untitled";
  const href = resolveToolHref(tool);
  const thumb = withOssImageResize(toCdnUrl(tool.icon_url), 520, 520);
  const titleGradient =
    category === "Video"
      ? "from-emerald-300 via-emerald-400 to-teal-300"
      : "from-cyan-200 via-sky-300 to-white";
  const accentGlow =
    category === "Video"
      ? "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_44%)]"
      : "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_44%)]";
  const accentLine =
    category === "Video"
      ? "from-emerald-300/75 via-emerald-400/24 to-transparent"
      : "from-sky-300/75 via-cyan-300/24 to-transparent";
  const mobileTitleClassName =
    category === "Video" ? "text-[#4EEAC2]" : "text-[#8ED8FF]";
  const mobileAccentGlow =
    category === "Video"
      ? "bg-[radial-gradient(circle_at_top_left,rgba(78,234,194,0.16),transparent_48%)]"
      : "bg-[radial-gradient(circle_at_top_left,rgba(142,216,255,0.16),transparent_48%)]";

  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "rounded-[1.05rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(24,24,24,0.96),rgba(11,11,11,0.98))]",
        "md:rounded-[1.3rem] md:border-[color:var(--color-frost-border)] md:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.014))]",
        "hover:border-white/[0.22] md:hover:-translate-y-1 md:hover:bg-white/[0.045]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.016),transparent_26%,transparent_72%,rgba(255,255,255,0.01))] md:block" />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100",
          accentGlow,
          "hidden md:block",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-90",
          mobileAccentGlow,
          "md:hidden",
        )}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.08]" />
      <div
        className={cn(
          "pointer-events-none absolute left-5 top-0 h-px w-24 bg-gradient-to-r opacity-90 transition-all duration-300 group-hover:w-32",
          accentLine,
        )}
      />
      <div className="pointer-events-none absolute -left-10 top-10 h-32 w-32 rounded-full bg-white/[0.03] blur-3xl transition-opacity duration-300 group-hover:opacity-90 md:block" />

      <div className="relative p-3 md:flex md:min-h-[176px] md:items-center md:gap-4 md:p-4">
        <div className="relative md:flex md:min-w-0 md:flex-1 md:flex-col md:justify-start md:self-stretch md:p-0">
          <div className="md:hidden">
            <h3
              className={cn(
                "line-clamp-2 font-mono text-[1.05rem] font-bold leading-[1.15] tracking-[-0.03em]",
                mobileTitleClassName,
              )}
              title={label}
            >
              {label}
            </h3>
            <p className="mt-1.5 line-clamp-3 min-h-[3.25rem] font-mono text-[0.84rem] leading-5 text-white/42">
              {tool.description ||
                "Launch this workflow directly from the workspace."}
            </p>
          </div>

          <div className="hidden md:block">
            <h3
              className={cn(
                "line-clamp-2 text-[1rem] font-semibold leading-[1.1] tracking-[-0.04em]",
                "bg-gradient-to-r bg-clip-text text-transparent",
                titleGradient,
              )}
              title={label}
            >
              <span className="block">{label}</span>
            </h3>
            <p className="mt-3 line-clamp-3 max-w-[15rem] text-[13px] leading-6 text-white/45">
              {tool.description ||
                "Launch this workflow directly from the workspace."}
            </p>
          </div>
        </div>

        <div className="relative mt-3 w-full md:mt-0 md:w-[44%] md:max-w-[220px] md:shrink-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-[0.95rem] md:rounded-[1rem] md:border md:border-[color:var(--color-frost-border-alt)] md:bg-black/30 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {thumb ? (
              <img
                src={thumb}
                alt={label}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,#060606_0%,#0d0d0d_100%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function HomepageSuiteVertical({
  headerNavItems = [],
}: {
  headerNavItems?: NavItem[];
}) {
  const { imageTools, videoTools } = useMemo(() => {
    const imageNav = headerNavItems.find((item) => item.icon === "Image");
    const videoNav = headerNavItems.find((item) => item.icon === "Video");

    const mappedImageTools = mapSceneItems(imageNav?.children || []);
    const mappedVideoTools = mapSceneItems(videoNav?.children || []);

    return {
      imageTools: mappedImageTools,
      videoTools: mappedVideoTools,
    };
  }, [headerNavItems]);

  return (
    <div
      className="space-y-10 px-2 pb-8 pt-2 xl:px-6"
      style={{ contentVisibility: "auto", containIntrinsicSize: "1400px" }}
    >
      <section className="space-y-5">
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-[22px] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
              Video tools
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
              {videoTools.map((tool) => (
                <CompactToolCard
                  key={tool.url || tool.title}
                  tool={tool}
                  category="Video"
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[22px] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
              Image tools
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
              {imageTools.map((tool) => (
                <CompactToolCard
                  key={tool.url || tool.title}
                  tool={tool}
                  category="Image"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
