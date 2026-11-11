import { MangoHomepage } from "@/shared/blocks/mango-homepage/mango-homepage";
import { MobileHomepageConfig } from "@/shared/lib/mobile-homepage";
import { Landing } from "@/shared/types/blocks/landing";

export default async function LandingPageStudio({
  page: _page,
  mobileHomepageConfig: _mobileHomepageConfig,
  pcHomepageConfig: _pcHomepageConfig,
}: {
  page: Landing;
  mobileHomepageConfig: MobileHomepageConfig;
  pcHomepageConfig: {
    bannerSlides: MobileHomepageConfig["bannerSlides"];
    showcaseGroups: MobileHomepageConfig["showcaseGroups"];
  };
}) {
  return <MangoHomepage />;
}
