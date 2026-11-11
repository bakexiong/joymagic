import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";

import { MobileImageAiPostWorkbenchShell } from "@/shared/blocks/common/mobile-image-ai-post-workbench-shell";
import { MobileHomepage } from "@/shared/blocks/mobile-homepage/mobile-homepage";
import { MobileHomepageConfig } from "@/shared/lib/mobile-homepage";
import { Post as BlogPost } from "@/shared/types/blocks/blog";
import { Landing } from "@/shared/types/blocks/landing";
import { FAQ } from "@/themes/default/blocks/faq";
import { Features } from "@/themes/default/blocks/features";
import { Hero } from "@/themes/default/blocks/hero";
import { Stats } from "@/themes/default/blocks/stats";
import { Testimonials } from "@/themes/default/blocks/testimonials";

// 动态导入非首屏组件，减少初始 JavaScript 包大小
const FeaturesAccordion = dynamic(
  () =>
    import("@/themes/default/blocks/features-accordion").then((mod) => ({
      default: mod.FeaturesAccordion,
    })),
  {
    loading: () => <div className="py-16 md:py-24" />,
  },
);

const FeaturesList = dynamic(
  () =>
    import("@/themes/default/blocks/features-list").then((mod) => ({
      default: mod.FeaturesList,
    })),
  {
    loading: () => <div className="py-16 md:py-24" />,
  },
);

const HeroImageWall = dynamic(
  () =>
    import("@/themes/default/blocks/hero-image-wall").then((mod) => ({
      default: mod.HeroImageWall,
    })),
  {
    loading: () => <div className="py-8" />,
  },
);

export default async function LandingPage({
  page,
  latestPosts,
  isLegacyHomePage = false,
  mobileHomepageConfig,
}: {
  page: Landing;
  latestPosts?: BlogPost[];
  isLegacyHomePage?: boolean;
  mobileHomepageConfig?: MobileHomepageConfig;
}) {
  const disclaimerText =
    page.footer?.disclaimer ||
    'Barko Bear LLC operates an independent AI creation application that integrates third-party models. Model names and rights remain with their respective providers; their inclusion does not imply endorsement';

  // 获取 header 导航菜单项
  const tHeader = await getTranslations("landing.header");
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  return (
    <>
      {!isLegacyHomePage && page.hero && mobileHomepageConfig && (
        <div className="md:hidden">
          <MobileHomepage hero={page.hero} config={mobileHomepageConfig} />
        </div>
      )}
      <div className="dark bg-background text-foreground">
        {page.hero && (
          <div className={isLegacyHomePage ? "" : "hidden md:block"}>
            <Hero
              hero={page.hero}
              latestPosts={latestPosts}
              templateWall={<HeroImageWall />}
              showProductTabs={true}
              headerNavItems={headerNavItems}
            />
          </div>
        )}
        {!isLegacyHomePage && page.hero && (
          <div className="md:hidden">
            <Hero
              hero={page.hero}
              latestPosts={latestPosts}
              showProductTabs={false}
              showGenerator={false}
              showBackgroundGrid={false}
              headerNavItems={headerNavItems}
            />
          </div>
        )}
        <MobileImageAiPostWorkbenchShell>
          {/*page.logos && <Logos logos={page.logos} />*/}
          {page.introduce && <FeaturesList features={page.introduce} />}
          {page.benefits && <FeaturesAccordion features={page.benefits} />}
          {page.features && <Features features={page.features} />}
          {page.stats && <Stats stats={page.stats} className="bg-muted" />}
          {page.testimonials && (
            <Testimonials testimonials={page.testimonials} />
          )}
          {page.faq && <FAQ faq={page.faq} />}
          {page.hero && (page.hero.tip || page.hero.show_avatars) && (
            <section className="mt-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-10 text-center text-foreground">
              <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4">
                {page.hero.tip && (
                  <p
                    className="text-sm text-amber-200/90"
                    dangerouslySetInnerHTML={{ __html: page.hero.tip }}
                  />
                )}
                {page.hero.show_avatars && page.hero.avatars_tip && (
                  <p className="text-muted-foreground text-sm">
                    {page.hero.avatars_tip}
                  </p>
                )}
              </div>
            </section>
          )}
          <section className="mt-10 bg-slate-950 py-10">
            <div className="container px-4">
              <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-sm backdrop-blur-sm">
                <p
                  className="text-lg text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: disclaimerText }}
                />
              </div>
            </div>
          </section>
        </MobileImageAiPostWorkbenchShell>
      </div>
    </>
  );
}
