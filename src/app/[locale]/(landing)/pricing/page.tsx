import { PAYMENTS_AVAILABLE } from "@/config/site";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { getThemePage } from "@/core/theme";
import { JsonLd } from "@/shared/components/jsonld";
import {
  generateProductSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from "@/shared/lib/jsonld";
import { getMetadata } from "@/shared/lib/seo";
import { getCurrentSubscription } from "@/shared/models/subscription";
import { getUserInfo } from "@/shared/models/user";
import { FAQ as FAQType } from "@/shared/types/blocks/landing";
import { Pricing as PricingType } from "@/shared/types/blocks/pricing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: "Planned Pricing | Barko Bear — Public Beta",
  description:
    "Explore planned AI software pricing from Barko Bear LLC. Public beta: payments and subscriptions have not launched.",
  canonicalUrl: "/pricing",
});

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // load landing data
  const tl = await getTranslations("landing");
  // loading pricing data
  const t = await getTranslations("pricing");

  // get current subscription
  let currentSubscription;
  try {
    const user = await getUserInfo();
    if (user) {
      currentSubscription = await getCurrentSubscription(user.id);
    }
  } catch (error) {
    console.log("getting current subscription failed:", error);
  }

  // load page component
  const Page = await getThemePage("pricing");

  // build sections
  const pricing: PricingType = t.raw("pricing");

  // Use pricing FAQ when available; do not fall back to landing FAQ to avoid showing the wrong content
  let faq: FAQType | undefined;
  try {
    const faqFromPricing = t.raw("faq");
    if (faqFromPricing && Object.keys(faqFromPricing).length > 0) {
      faq = faqFromPricing;
    }
  } catch (e) {
    // keep faq undefined if missing
  }

  // Generate JSON-LD schemas
  const schemas = [];

  // Product schema with pricing offers
  const oneTimeItems =
    pricing.items?.filter((item: any) => item.group === "one-time") || [];
  if (PAYMENTS_AVAILABLE && oneTimeItems.length > 0) {
    const productSchema = generateProductSchema({
      name: "Barko Bear AI Credits",
      description:
        "AI image and video generation credits for Barko Bear platform",
      offers: oneTimeItems.map((item: any) => ({
        name: item.title,
        description: item.description,
        price: item.amount / 100, // Convert cents to dollars
      })),
    });
    schemas.push(productSchema);
  }

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Pricing", url: "/pricing" },
    ],
    locale,
  );
  schemas.push(breadcrumbSchema);

  return (
    <>
      <JsonLd data={schemas} />
      <Page
        locale={locale}
        pricing={pricing}
        currentSubscription={currentSubscription}
        faq={faq}
      />
    </>
  );
}
