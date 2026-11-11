import { getTranslations } from "next-intl/server";

import { SmartIcon } from "@/shared/blocks/common/smart-icon";
import { Landing } from "@/shared/types/blocks/landing";
import { MobileHomepageConfig } from "@/shared/lib/mobile-homepage";
import {
  landingSidebarContainerCn,
  landingSidebarRowCenteredCn,
} from "@/shared/lib/landing-sidebar-layout-classes";
import { cn } from "@/shared/lib/utils";
import { FAQ } from "@/themes/default/blocks/faq";
import { FeaturesAccordion } from "@/themes/default/blocks/features-accordion";
import { FeaturesList } from "@/themes/default/blocks/features-list";
import { LandingV2HeroIntro } from "@/themes/default/blocks/landing-v2-hero-intro";
import {
  DeferredDesktopHeroModules,
  DeferredMobileHomepage,
  DeferredPcHomepage,
} from "@/themes/default/pages/landing-v2-responsive";

export default async function LandingPageV2({
  page,
  mobileHomepageConfig,
  pcHomepageConfig,
}: {
  page: Landing;
  mobileHomepageConfig: MobileHomepageConfig;
  pcHomepageConfig: {
    bannerSlides: MobileHomepageConfig["bannerSlides"];
    showcaseGroups: MobileHomepageConfig["showcaseGroups"];
  };
}) {
  const disclaimerText =
    page.footer?.disclaimer ||
    'Barko Bear LLC operates an independent AI creation application that integrates third-party models. Model names and rights remain with their respective providers; their inclusion does not imply endorsement';

  // 获取 header 导航菜单项
  const tHeader = await getTranslations("landing.header");
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  return (
    <div className="dark bg-[color:var(--color-page-bg)] text-foreground">
      {/* 移动端：MobileHomepage 放在最上方 */}
      {page.hero ? (
        <DeferredMobileHomepage
          hero={page.hero}
          config={mobileHomepageConfig}
          sectionClassName="pt-0"
          headerNavItems={headerNavItems}
        />
      ) : null}

      {/* 桌面端 - Hero区域 - 包含SEO标题和5个大卡片 */}
      {page.hero && (
        <div className="hidden md:block">
          <section className="relative bg-[#050505] pt-4 pb-12 md:pt-5 md:pb-14">
            <div className="relative z-10">
              <DeferredDesktopHeroModules
                bannerSlides={pcHomepageConfig.bannerSlides}
                headerNavItems={headerNavItems}
              />
            </div>
          </section>
          <div className="bg-[#050505]">
            <div
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "2200px",
              }}
            >
              <DeferredPcHomepage hero={page.hero} config={pcHomepageConfig} />
            </div>
          </div>
        </div>
      )}

      {/* 标题区挪到瀑布流后面 */}
      {page.hero ? (
        <div
          style={{ contentVisibility: "auto", containIntrinsicSize: "500px" }}
        >
          <LandingV2HeroIntro hero={page.hero} />
        </div>
      ) : null}

      <section
        className="bg-[#050505] px-3 pb-10 pt-2 sm:px-6 md:px-10 md:pb-12"
        style={{ contentVisibility: "auto", containIntrinsicSize: "220px" }}
      >
        <div className={landingSidebarRowCenteredCn("mx-auto max-w-4xl")}>
          <div className="rounded-2xl border border-white/6 bg-gradient-to-b from-white/6 via-transparent to-[#17171b] px-5 py-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur sm:px-6">
            <p className="text-center font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm">
              <span className="font-semibold text-foreground">Barko Bear</span>{" "}
              is an independent AI service and is not affiliated with any model
              provider. We deploy and optimize Apache-2.0 licensed models on our
              own infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* SEO相关内容 - 移到下面 */}
      <div className="bg-[#050505]">
        {/* PC 端 V2：introduce 使用“居中标题 + 4列卖点”的版式，同时文字类名对齐 feature/railway_0319 */}
        {page.introduce ? (
          <section
            id="features"
            className="overflow-x-hidden py-16 scroll-mt-[calc(var(--header-h,4.5rem)+1rem)] md:py-24"
            style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}
          >
            <div
              className={landingSidebarContainerCn(
                "container overflow-x-hidden",
              )}
            >
              <div
                className={cn(
                  "mx-auto max-w-4xl text-center text-balance",
                  "md:group-data-[layout=with-sidebar]/sidebar-layout:mx-auto",
                )}
              >
                <h2 className="text-foreground text-4xl font-semibold text-balance break-words">
                  {page.introduce.title}
                </h2>
                <p className="text-md text-muted-foreground my-6 text-balance break-words">
                  {page.introduce.description}
                </p>
              </div>

              {/* 四列卖点网格：侧栏布局下完全居中 */}
              <div className={landingSidebarRowCenteredCn("mx-auto max-w-5xl")}>
                <div className="relative grid min-w-0 grid-cols-1 gap-x-3 gap-y-6 border-t pt-12 break-words sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                  {page.introduce.items?.map((item, idx) => (
                    <div className="min-w-0 space-y-3 break-words" key={idx}>
                      <div className="flex min-w-0 items-center gap-2">
                        {item.icon ? (
                          <SmartIcon name={item.icon as string} size={16} />
                        ) : null}
                        <h3 className="min-w-0 text-sm font-medium break-words">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground min-w-0 text-sm break-words">
                        {item.description ?? ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
        {page.benefits ? (
          <div
            style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}
          >
            <FeaturesAccordion features={page.benefits} />
          </div>
        ) : null}
        {page.faq ? (
          <div
            style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}
          >
            <FAQ faq={page.faq} />
          </div>
        ) : null}

        {/* Disclaimer Section */}
        <section
          className="mt-10 bg-[#050505] py-10"
          style={{ contentVisibility: "auto", containIntrinsicSize: "260px" }}
        >
          <div className={landingSidebarContainerCn("container px-4")}>
            <div
              className={cn(
                "mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-sm backdrop-blur-sm",
                "md:group-data-[layout=with-sidebar]/sidebar-layout:mx-auto",
              )}
            >
              <p
                className="text-lg text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: disclaimerText }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
