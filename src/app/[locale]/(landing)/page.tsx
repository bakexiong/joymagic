import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { getThemePage } from "@/core/theme";
import { JsonLd } from "@/shared/components/jsonld";
import { getConfigs } from "@/shared/models/config";
import {
  generateItemListSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/shared/lib/jsonld";
import { homepageScenarioPaths } from "@/shared/blocks/mango-homepage/static-tool-previews";
import {
  getMobileHomepageConfig,
  getPcHomepageConfig,
} from "@/shared/lib/mobile-homepage";
import { getMetadata } from "@/shared/lib/seo";
import { getLatestPosts } from "@/shared/models/post";
import { Post as BlogPost } from "@/shared/types/blocks/blog";
import { Landing } from "@/shared/types/blocks/landing";
import LandingPageStudio from "@/themes/default/pages/landing-studio";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600; // ISR: revalidate every hour

export const generateMetadata = getMetadata({
  title: "Barko Bear LLC | AI Image & Video Software — Public Beta",
  description:
    "Barko Bear LLC develops browser-based AI image and video creation software. Public beta: explore supported tools and planned pricing. Paid access has not launched.",
  keywords:
    "AI image generator, AI video generator, AI image editor, image to video AI, AI background remover, AI image upscaler, text to image AI, AI portrait generator, AI photo editor",
  canonicalUrl: "/",
});

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  setRequestLocale(locale);

  // load page data
  const t = await getTranslations("landing");
  const configs = await getConfigs();
  const layoutParam = Array.isArray(resolvedSearchParams.layout)
    ? resolvedSearchParams.layout[0]
    : resolvedSearchParams.layout;
  const isLegacyHomePage = false;

  let latestPosts: BlogPost[] = [];

  // build page params
  const page: Landing = {
    hero: t.raw("hero"),
    logos: t.raw("logos"),
    introduce: t.raw("introduce"),
    benefits: t.raw("benefits"),
    features: t.raw("features"),
    faq: t.raw("faq"),
  };

  if (isLegacyHomePage) {
    try {
      latestPosts = await getLatestPosts({
        locale,
        limit: 6,
      });
    } catch (error) {
      console.log("getting latest posts failed:", error);
    }
  }

  // load page component
  const Page = await getThemePage("landing");
  const mobileHomepageConfig = getMobileHomepageConfig(configs);
  const pcHomepageConfig = getPcHomepageConfig(configs);

  // Generate JSON-LD schemas
  const organizationSchema = generateOrganizationSchema();
  const webSiteSchema = generateWebSiteSchema({ locale });
  const scenarioItemListSchema = generateItemListSchema({
    name: "AI creative tools by keyword and scene",
    description:
      "Curated Barko Bear workflows for AI image generation, AI video generation, image editing, image-to-video, background removal, upscaling, and commercial creative scenes.",
    url: "/",
    locale,
    items: homepageScenarioPaths.map((scenario) => ({
      name: scenario.title,
      description: scenario.description,
      url: scenario.href,
    })),
  });

  // 如果是Legacy版本，使用旧版页面组件
  if (isLegacyHomePage) {
    return (
      <>
        <JsonLd
          data={[organizationSchema, webSiteSchema, scenarioItemListSchema]}
        />
        <Page
          locale={locale}
          page={page}
          latestPosts={latestPosts}
          isLegacyHomePage={isLegacyHomePage}
          mobileHomepageConfig={mobileHomepageConfig}
        />
      </>
    );
  }

  // 默认使用新版 Studio 首页组件；保留原 V2 组件文件，便于后续手动切换
  return (
    <>
      <JsonLd
        data={[organizationSchema, webSiteSchema, scenarioItemListSchema]}
      />
      <LandingPageStudio
        page={page}
        mobileHomepageConfig={mobileHomepageConfig}
        pcHomepageConfig={pcHomepageConfig}
      />
    </>
  );
}
