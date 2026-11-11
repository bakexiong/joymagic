import { Link } from "@/core/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandLogo, Copyright, LocaleSelector } from "@/shared/blocks/common";
import { SmartIcon } from "@/shared/blocks/common/smart-icon";
import { NavItem } from "@/shared/types/blocks/common";
import { Footer as FooterType } from "@/shared/types/blocks/landing";
import { isCreemReviewMode } from "@/shared/lib/creem-review";
import { isStudioToolHidden } from "@/shared/lib/studio-tool-visibility";

type FooterQuickLink = {
  title: string;
  url: string;
  target?: string;
};

type FooterSection = {
  title: string;
  items: FooterQuickLink[];
};

type SidebarToolGroup = {
  items: Record<string, string>;
};

function getItemTitle(item: NavItem) {
  return item.title || item.name || "";
}

function isGenericModelTitle(title: string) {
  const normalized = title.trim().toLowerCase();
  return normalized === "general";
}

function dedupeFooterLinks(items: FooterQuickLink[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.url}::${item.title}`;
    if (!item.url || !item.title || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getModelSlugFromUrl(url: string) {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function collectCreatorModelCandidates(items: NavItem[] = []) {
  return dedupeFooterLinks(
    items
      .flatMap((item) => {
        if (!Array.isArray(item.children) || item.children.length === 0) {
          return [];
        }

        return item.children.map((child) => ({
          title: getItemTitle(child),
          url: child.url || "",
        }));
      })
      .filter(
        (item) => item.title && item.url && !isGenericModelTitle(item.title),
      ),
  ).map((item) => ({
    title: item.title,
    url: `/model/${getModelSlugFromUrl(item.url)}`,
  }));
}

function isCreemReviewBlockedPublicLink(url: string) {
  const normalized = (url || "").toLowerCase();
  return (
    normalized.includes("video-face-swap") ||
    normalized.includes("ai-clothes-remover") ||
    normalized.includes("ai-bikini") ||
    normalized.includes("ai-twerk") ||
    normalized.includes("ai-kissing") ||
    normalized.includes("blow-kiss") ||
    normalized.includes("french-kiss") ||
    normalized.includes("kissing-pro") ||
    normalized.includes("rain-kiss") ||
    normalized.includes("sexy-me") ||
    normalized.includes("jiggle-up")
  );
}

function getFooterCopy(locale: string) {
  const normalizedLocale = locale.toLowerCase();
  const isChineseLocale = normalizedLocale.startsWith("zh");

  return {
    companyName: isChineseLocale
      ? "星耀互聯科技有限公司"
      : "STARLIGHT INTERNET TECHNOLOGY CO., LIMITED",
    sections: {
      imageTools: isChineseLocale ? "图片工具" : "Image Tools",
      videoTools: isChineseLocale ? "视频工具" : "Video Tools",
      aiEffect: "AI Effect",
      imageModels: isChineseLocale ? "图片模型" : "Image Models",
      videoModels: isChineseLocale ? "视频模型" : "Video Models",
    },
    imageTools: [],
    videoTools: [],
    aiEffect: [
      {
        title: "Image Effects",
        url: "/image-effect",
      },
      {
        title: "Video Effects",
        url: "/video-effect",
      },
    ],
    resources: isChineseLocale ? "现有内容" : "Existing Content",
  };
}

function normalizeFooterBrand(footer: FooterType) {
  if (!footer.brand) {
    return undefined;
  }

  return {
    ...footer.brand,
    title: "joymagic",
    logo: footer.brand.logo
      ? {
          ...footer.brand.logo,
          src: "/brand/joymagic-wordmark-dark.png",
          alt: "joymagic",
        }
      : footer.brand.logo,
    description: footer.brand.description
      ?.replace(/10b\.ai\.ai/gi, "joymagic")
      .replace(/10b\.ai/gi, "joymagic"),
  };
}

function normalizeAgreementItems(footer: FooterType) {
  return footer.agreement?.items?.map((item) => ({
    ...item,
    title:
      item.title === "support@joymagic.fun"
        ? "support@joymagic.fun"
        : item.title,
    url:
      item.url === "mailto:support@joymagic.fun"
        ? "mailto:support@joymagic.fun"
        : item.url,
  }));
}

function getDefaultSupportEmail() {
  return (
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@joymagic.fun"
  );
}

function buildRequiredAgreementItems(locale: string): NavItem[] {
  const isChineseLocale = locale.toLowerCase().startsWith("zh");
  const supportEmail = getDefaultSupportEmail();

  return [
    {
      title: supportEmail,
      url: `mailto:${supportEmail}`,
    },
    {
      title: isChineseLocale ? "隐私政策" : "Privacy Policy",
      url: "/privacy-policy",
    },
    {
      title: isChineseLocale ? "服务条款" : "Terms of Service",
      url: "/terms-of-service",
    },
    {
      title: isChineseLocale ? "内容审核政策" : "Content Moderation Policy",
      url: "/content-moderation-policy",
    },
    {
      title: isChineseLocale ? "可接受使用政策" : "Acceptable Use Policy",
      url: "/acceptable-use-policy",
    },
    {
      title: isChineseLocale ? "退款政策" : "Refund Policy",
      url: "/refund-policy",
    },
  ];
}

function mergeAgreementItems(locale: string, items?: NavItem[]) {
  const required = buildRequiredAgreementItems(locale);
  const existing = items || [];
  const merged = [...existing];

  const existingKey = new Set(
    existing.map((item) => `${item.title || ""}::${item.url || ""}`),
  );

  for (const item of required) {
    const key = `${item.title || ""}::${item.url || ""}`;
    if (!existingKey.has(key)) {
      merged.push(item);
      existingKey.add(key);
    }
  }

  if (isCreemReviewMode()) {
    return merged.filter((item) => {
      const url = (item.url || "").toLowerCase();
      return (
        !url.includes("/video-face-swap") &&
        !url.includes("/ai-clothes-remover")
      );
    });
  }

  return merged;
}

function buildResourceLinks(footer: FooterType) {
  return (
    footer.nav?.items.flatMap((group) =>
      (group.children || []).map((item) => ({
        title: item.title || "",
        url: item.url || "",
        target: item.target || "",
      })),
    ) || []
  ).filter((item) => item.title && item.url);
}

export async function Footer({ footer }: { footer: FooterType }) {
  const locale = await getLocale();
  const footerCopy = getFooterCopy(locale);
  const footerBrand = normalizeFooterBrand(footer);
  const footerAgreementItems = mergeAgreementItems(
    locale,
    normalizeAgreementItems(footer),
  );
  const footerCopyrightBrand = footer.brand
    ? { ...footer.brand, title: "joymagic" }
    : undefined;
  const resourceLinks = buildResourceLinks(footer);
  const tLanding = await getTranslations({ locale, namespace: "landing" });
  const headerNav = (tLanding.raw("header.nav.items") as NavItem[]) || [];
  const tSidebar = await getTranslations({
    locale,
    namespace: "landing.sidebarStudio",
  });
  const imageTools = tSidebar.raw("imageTools") as SidebarToolGroup["items"];
  const videoTools = tSidebar.raw("videoTools") as SidebarToolGroup["items"];
  const imageToolLinks = Object.entries(imageTools).map(([key, title]) => ({
    title,
    url:
      {
        "Editor & Combiner": "/tool/editor-combiner",
        "Image to Image": "/tool/image-to-image",
        "Text to Image": "/tool/text-to-image",
        PhotoShoot: "/tool/photoshoot",
        Variations: "/tool/variations",
        "Face Generator": "/tool/face-generator",
        "Image Upscaler": "/tool/image-upscaler",
        "Background Remover": "/tool/image-background-remover",
        "Image Eraser": "/tool/image-eraser",
        "Image Effects": "/tool/image-effect",
      }[key] || "",
  }));
  const videoToolLinks = Object.entries(videoTools)
    .map(([key, title]) => ({
      title,
      url:
        {
          "Image to Video": "/tool/image-to-video",
          "Text to Video": "/tool/text-to-video",
          "Longcat Avatar": "/tool/longcat-avatar",
          "Motion Control": "/tool/motion-control",
          "Video Effects": "/tool/video-effect",
        }[key] || "",
    }))
    .filter((item) => item.url && !isStudioToolHidden(item.url));
  const effectsLinks = [
    {
      title: tSidebar("imageTools.Image Effects"),
      url: "/tool/image-effect",
    },
    {
      title: tSidebar("videoTools.Video Effects"),
      url: "/tool/video-effect",
    },
  ];
  const imageNav =
    headerNav.find((item) => getItemTitle(item) === "Image AI") ||
    headerNav.find((item) => item.icon === "Image");
  const videoNav =
    headerNav.find((item) => getItemTitle(item) === "Video AI") ||
    headerNav.find((item) => item.icon === "Video");
  const imageModelLinks = dedupeFooterLinks(
    collectCreatorModelCandidates(imageNav?.children || []),
  );
  const videoModelLinks = dedupeFooterLinks(
    collectCreatorModelCandidates(videoNav?.children || []),
  );
  const filteredImageModelLinks =
    isCreemReviewMode() && imageModelLinks.length
      ? imageModelLinks.filter(
          (item) => !isCreemReviewBlockedPublicLink(item.url),
        )
      : imageModelLinks;
  const filteredVideoModelLinks =
    isCreemReviewMode() && videoModelLinks.length
      ? videoModelLinks.filter(
          (item) => !isCreemReviewBlockedPublicLink(item.url),
        )
      : videoModelLinks;

  const footerSections: FooterSection[] = [
    {
      title: tSidebar("primary.image"),
      items: imageToolLinks,
    },
    {
      title: tSidebar("primary.video"),
      items: videoToolLinks,
    },
    {
      title: tSidebar("primary.effects"),
      items: effectsLinks,
    },
    {
      title: footerCopy.sections.imageModels,
      items: filteredImageModelLinks,
    },
    {
      title: footerCopy.sections.videoModels,
      items: filteredVideoModelLinks,
    },
  ].filter((section) => section.items.length > 0);

  return (
    <footer
      id={footer.id}
      data-default-landing-footer
      className={`overflow-x-hidden border-t border-white/8 bg-[#050505] py-10 text-[#f2f2f4] sm:py-12 ${footer.className || ""}`}
    >
      <div className="container overflow-x-hidden">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-5">
            {footerSections.map((section) => (
              <div key={section.title} className="min-w-0">
                <h3 className="mb-4 text-base font-semibold text-[#f2f2f4]">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <Link
                      key={`${section.title}-${item.url}`}
                      href={item.url}
                      target={item.target || ""}
                      className="block text-sm leading-6 text-[#a9a9b2] transition-colors duration-150 hover:text-white"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="min-w-0 border-t border-white/8 pt-8 xl:border-t-0 xl:border-l xl:pl-10 xl:pt-0">
            <div className="space-y-6">
              <div className="space-y-4">
                {footerBrand ? (
                  <BrandLogo brand={footerBrand} showTitle={false} />
                ) : null}

                {footerBrand?.description ? (
                  <p
                    className="text-sm leading-6 text-[#b9b9c0]"
                    dangerouslySetInnerHTML={{
                      __html: footerBrand.description,
                    }}
                  />
                ) : null}
              </div>

              {resourceLinks.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7d7d86]">
                    {footerCopy.resources}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {resourceLinks.map((item) => (
                      <Link
                        key={`resource-${item.url}`}
                        href={item.url}
                        target={item.target || ""}
                        className="text-sm text-[#b9b9c0] transition-colors duration-150 hover:text-white"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {footer.show_locale !== false ? (
                <LocaleSelector
                  type="button"
                  className="border-white/12 bg-transparent text-[#d9d9df] hover:bg-white/5"
                />
              ) : null}

              {footer.social ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {footer.social.items.map((item: NavItem, index) => (
                    <Link
                      key={index}
                      href={item.url || ""}
                      target={item.target || ""}
                      className="block cursor-pointer rounded-full border border-white/10 bg-[#111214] p-2 text-[#b9b9c0] duration-150 hover:border-white/20 hover:text-[#f2f2f4]"
                    >
                      {item.icon && (
                        <SmartIcon name={item.icon as string} size={18} />
                      )}
                    </Link>
                  ))}
                </div>
              ) : null}

              {footerAgreementItems?.length ? (
                <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-2">
                  {footerAgreementItems.map((item: NavItem, index: number) => (
                    <Link
                      key={index}
                      href={item.url || ""}
                      target={item.target || ""}
                      className="text-xs leading-5 text-[#9f9fa8] underline-offset-4 transition-colors duration-150 hover:text-white hover:underline"
                    >
                      {item.title || ""}
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2 border-t border-white/8 pt-5">
                {footer.copyright ? (
                  <p
                    className="text-sm text-balance break-words text-[#b9b9c0]"
                    dangerouslySetInnerHTML={{ __html: footer.copyright }}
                  />
                ) : footerCopyrightBrand ? (
                  <Copyright brand={footerCopyrightBrand} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
