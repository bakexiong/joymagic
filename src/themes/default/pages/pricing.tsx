import { PlannedPricing } from "@/shared/blocks/company/planned-pricing";
import { Subscription } from "@/shared/models/subscription";
import { FAQ as FAQType } from "@/shared/types/blocks/landing";
import { Pricing as PricingType } from "@/shared/types/blocks/pricing";

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
  return <PlannedPricing pricing={pricing} />;
}
