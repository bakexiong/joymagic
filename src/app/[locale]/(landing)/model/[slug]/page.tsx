import {
  generateModelLandingMetadata,
  generateModelLandingStaticParams,
  ModelLandingPageServer,
} from "@/shared/blocks/model-landing/model-landing-page";
import { notFound } from "next/navigation";
import {
  isBlockedModelSlugInCreemReviewMode,
  isCreemReviewMode,
} from "@/shared/lib/creem-review";

type ModelLandingSearchParams = {
  scene?: string;
  model?: string;
  prompt?: string;
  params?: string;
  ref?: string;
  auto?: string;
};

export const revalidate = 3600;

export const generateStaticParams = generateModelLandingStaticParams;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (isCreemReviewMode() && isBlockedModelSlugInCreemReviewMode(slug)) {
    return {};
  }
  return generateModelLandingMetadata({ locale, slug });
}

export default async function ModelLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<ModelLandingSearchParams>;
}) {
  const { locale, slug } = await params;
  if (isCreemReviewMode() && isBlockedModelSlugInCreemReviewMode(slug)) {
    notFound();
  }
  const resolvedSearchParams = await searchParams;

  return (
    <ModelLandingPageServer
      locale={locale}
      slug={slug}
      searchParams={resolvedSearchParams}
    />
  );
}
