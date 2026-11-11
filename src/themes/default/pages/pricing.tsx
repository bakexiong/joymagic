import { Subscription } from "@/shared/models/subscription";
import { FAQ as FAQType } from "@/shared/types/blocks/landing";
import { Pricing as PricingType } from "@/shared/types/blocks/pricing";
import { CreditsCostTable } from "@/themes/default/blocks/credits-cost-table";
import { FAQ } from "@/themes/default/blocks/faq";
import { Pricing } from "@/themes/default/blocks/pricing";
import { PricingMobile } from "@/themes/default/blocks/pricing-mobile";

export default async function PricingPage({
  locale,
  pricing,
  currentSubscription,
  faq,
}: {
  locale?: string;
  pricing: PricingType;
  currentSubscription?: Subscription;
  faq?: FAQType;
}) {
  return (
    <>
      <style>{`
        body:has(#pricing),
        html:has(#pricing) {
          background: #ffffff;
        }
      `}</style>
      <div className="hidden md:block">
        <Pricing pricing={pricing} currentSubscription={currentSubscription} />
      </div>
      <div className="block md:hidden">
        <PricingMobile
          pricing={pricing}
          currentSubscription={currentSubscription}
        />
      </div>
      <div className="bg-white">
        <CreditsCostTable className="bg-white" />
        {faq && <FAQ faq={faq} centered className="bg-white" variant="light" />}
      </div>
    </>
  );
}
