import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/core/i18n/navigation';

import { envConfigs } from '@/config';
import { locales } from '@/config/locale';
import { Link } from '@/core/i18n/navigation';
import { AiMediaPageLayout } from '@/shared/blocks/common/ai-media-page-layout';
import { imageToImageConfig } from '@/shared/blocks/desktop-playground/configs/image-to-image-configs';
import { JsonLd } from '@/shared/components/jsonld';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateSoftwareApplicationSchema,
} from '@/shared/lib/jsonld';
import type {
  CTA as CTAType,
  FAQ as FAQType,
  Features as FeaturesType,
  Hero as HeroType,
} from '@/shared/types/blocks/landing';
import { CTA } from '@/themes/default/blocks/cta';
import { FAQ } from '@/themes/default/blocks/faq';
import { Features } from '@/themes/default/blocks/features';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('landing.image-to-image.imageToImagePage.metadata');

  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image`
      : `${envConfigs.app_url}/image-to-image`;

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ImageToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: '/image-to-image/gpt-image-2', locale });

  const tPage = await getTranslations('landing.image-to-image.imageToImagePage');
  const tHeader = await getTranslations('landing.header');

  const headerNav = tHeader.raw('nav') as any;
  const headerNavItems = headerNav?.items || [];

  const heroData: HeroType = {
    id: 'hero',
    title: tPage('hero.title'),
    description: tPage('hero.description'),
    buttons: [
      {
        title: tPage('hero.button1'),
        url: '#playground',
        variant: 'default',
      },
      {
        title: tPage('hero.button2'),
        url: '/pricing',
        variant: 'outline',
      },
    ],
  };

  const whatYouCanDo: FeaturesType = {
    id: 'what-you-can-do',
    title: tPage('whatYouCanDo.title'),
    description: tPage('whatYouCanDo.description'),
    items: [
      {
        title: tPage('whatYouCanDo.styleTransformations.title'),
        description: tPage.raw('whatYouCanDo.styleTransformations.description'),
        icon: 'Palette',
      },
      {
        title: tPage('whatYouCanDo.characterConsistency.title'),
        description: tPage.raw('whatYouCanDo.characterConsistency.description'),
        icon: 'Users',
      },
      {
        title: tPage('whatYouCanDo.productBrand.title'),
        description: tPage.raw('whatYouCanDo.productBrand.description'),
        icon: 'ShoppingBag',
      },
      {
        title: tPage('whatYouCanDo.socialContent.title'),
        description: tPage.raw('whatYouCanDo.socialContent.description'),
        icon: 'Sparkles',
      },
    ],
  };

  const keyFeatures: FeaturesType = {
    id: 'key-features',
    title: tPage('keyFeatures.title'),
    description: tPage('keyFeatures.description'),
    items: [
      {
        title: tPage('keyFeatures.uploadPromptTransform.title'),
        description: tPage.raw('keyFeatures.uploadPromptTransform.description'),
        icon: 'ImageIcon',
      },
      {
        title: tPage('keyFeatures.flexibleControl.title'),
        description: tPage.raw('keyFeatures.flexibleControl.description'),
        icon: 'Sliders',
      },
      {
        title: tPage('keyFeatures.highQuality.title'),
        description: tPage.raw('keyFeatures.highQuality.description'),
        icon: 'Highlighter',
      },
      {
        title: tPage('keyFeatures.nonDesigners.title'),
        description: tPage.raw('keyFeatures.nonDesigners.description'),
        icon: 'Wand2',
      },
    ],
  };

  const howItWorks: FeaturesType = {
    id: 'how-it-works',
    title: tPage('howItWorks.title'),
    description: tPage('howItWorks.description'),
    items: [
      {
        title: tPage('howItWorks.step1.title'),
        description: tPage.raw('howItWorks.step1.description'),
      },
      {
        title: tPage('howItWorks.step2.title'),
        description: tPage.raw('howItWorks.step2.description'),
      },
      {
        title: tPage('howItWorks.step3.title'),
        description: tPage.raw('howItWorks.step3.description'),
      },
      {
        title: tPage('howItWorks.step4.title'),
        description: tPage.raw('howItWorks.step4.description'),
      },
    ],
  };

  const whyZImage: FeaturesType = {
    id: 'why-10b.ai',
    title: tPage('whyZImage.title'),
    description: tPage('whyZImage.description'),
    items: [
      {
        title: tPage('whyZImage.focused.title'),
        description: tPage.raw('whyZImage.focused.description'),
        icon: 'Crosshair',
      },
      {
        title: tPage('whyZImage.fastWorkflows.title'),
        description: tPage('whyZImage.fastWorkflows.description'),
        icon: 'Zap',
      },
      {
        title: tPage('whyZImage.pricing.title'),
        description: tPage('whyZImage.pricing.description'),
        icon: 'CreditCard',
      },
      {
        title: tPage('whyZImage.commercialUse.title'),
        description: tPage('whyZImage.commercialUse.description'),
        icon: 'Shield',
      },
    ],
  };

  const perfectFor: FeaturesType = {
    id: 'perfect-for',
    title: tPage('perfectFor.title'),
    description: tPage('perfectFor.description'),
    items: [
      {
        title: tPage('perfectFor.creators.title'),
        description: tPage.raw('perfectFor.creators.description'),
        icon: 'Users',
      },
      {
        title: tPage('perfectFor.ecommerce.title'),
        description: tPage.raw('perfectFor.ecommerce.description'),
        icon: 'ShoppingBag',
      },
      {
        title: tPage('perfectFor.designers.title'),
        description: tPage.raw('perfectFor.designers.description'),
        icon: 'Palette',
      },
    ],
  };

  const faqData: FAQType = {
    id: 'faq',
    title: tPage('faq.title'),
    description: tPage('faq.description'),
    items: [
      {
        question: tPage('faq.q1.question'),
        answer: tPage('faq.q1.answer'),
      },
      {
        question: tPage('faq.q2.question'),
        answer: tPage('faq.q2.answer'),
      },
      {
        question: tPage('faq.q3.question'),
        answer: tPage('faq.q3.answer'),
      },
      {
        question: tPage('faq.q4.question'),
        answer: tPage.raw('faq.q4.answer'),
      },
      {
        question: tPage('faq.q5.question'),
        answer: tPage.raw('faq.q5.answer'),
      },
      {
        question: tPage('faq.q6.question'),
        answer: tPage.raw('faq.q6.answer'),
      },
      {
        question: tPage('faq.q7.question'),
        answer: tPage.raw('faq.q7.answer'),
      },
    ],
  };

  const finalCTA: CTAType = {
    id: 'final-cta',
    title: tPage('finalCTA.title'),
    description: tPage.raw('finalCTA.description'),
    buttons: [
      {
        title: tPage('finalCTA.button'),
        url: '#playground',
        variant: 'default',
      },
    ],
  };

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Barko Bear Image to Image AI",
    description: tPage('hero.description'),
    url: '/image-to-image',
    locale,
    category: 'MultimediaApplication',
    features: [
      'Style Transformations',
      'Character Consistency',
      'Product & Brand Visuals',
      'Social Content Creation',
    ],
  });

  const howToSchema = generateHowToSchema({
    name: 'How to Use Image to Image AI',
    description: tPage('howItWorks.description'),
    steps:
      howItWorks.items?.map((item) => ({
        name: item.title || '',
        text: typeof item.description === 'string' ? item.description : '',
      })) || [],
    totalTime: 'PT2M',
  });

  const faqSchema = generateFAQSchema(
    faqData.items?.map((item) => ({
      question: item.question || '',
      answer: typeof item.answer === 'string' ? item.answer : '',
    })) || [],
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: 'Home', url: '/' },
      { name: 'Image to Image', url: '/image-to-image' },
    ],
    locale,
  );

  const responsibleIdentityItems = tPage.raw('responsibleUse.identity.items') as string[];
  const responsibleProhibitedItems = tPage.raw(
    'responsibleUse.prohibited.items',
  ) as string[];
  const responsibleRoleItems = tPage.raw(
    'responsibleUse.responsibility.items',
  ) as string[];

  return (
    <>
      <JsonLd data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]} />

      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={imageToImageConfig}
      >
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.95fr]">
              <ScrollAnimation>
                <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                      {tPage('builtFor.title')}
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                      {tPage('hero.title')}
                    </h2>
                  </div>
                  <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                    {tPage('heroDescription')}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <CheckCircle2 className="size-5 text-white/75" />
                      <p className="mt-3 text-sm text-white/90">
                        {tPage('builtFor.hdOutputs')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <Zap className="size-5 text-white/75" />
                      <p className="mt-3 text-sm text-white/90">
                        {tPage('builtFor.fastGeneration')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <Briefcase className="size-5 text-white/75" />
                      <p className="mt-3 text-sm text-white/90">
                        {tPage('builtFor.commercialReady')}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className="h-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-8 shadow-[0_22px_52px_rgba(0,0,0,0.22)]">
                  <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                    Workbench
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                    {tPage('interfaceFeatures.title')}
                  </h3>
                  <div className="mt-8 space-y-4">
                    {[
                      tPage('interfaceFeatures.uploadArea'),
                      tPage('interfaceFeatures.promptBox'),
                      tPage('interfaceFeatures.styleDropdown'),
                      tPage('interfaceFeatures.strengthSlider'),
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-white/65" />
                        <p className="text-sm leading-7 text-white/82">{item}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-sm leading-7 text-muted-foreground">
                    {tPage('interfaceFeatures.generateButton')}
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <Features features={whatYouCanDo} className="py-16 md:py-24" />

        <Features
          features={keyFeatures}
          className="bg-muted/30 py-16 md:py-24"
        />

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-5xl">
              <ScrollAnimation>
                <div className="mx-auto max-w-3xl text-center">
                  <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                    Workflow
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                    {howItWorks.title}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">
                    {howItWorks.description}
                  </p>
                </div>
              </ScrollAnimation>

              <div className="mt-12 grid gap-5 md:grid-cols-2">
                {howItWorks.items?.map((item, index) => (
                  <ScrollAnimation key={item.title || index}>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white/88">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                      </div>
                      <p
                        className="mt-4 text-sm leading-7 text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: String(item.description || ''),
                        }}
                      />
                    </div>
                  </ScrollAnimation>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Features
          features={whyZImage}
          className="bg-muted/30 py-16 md:py-24"
        />

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <ScrollAnimation>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                    Safety
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                    {tPage('responsibleUse.title')}
                  </h2>
                  <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
                    <p>{tPage('responsibleUse.intro')}</p>
                    <p>{tPage('responsibleUse.note')}</p>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center gap-3">
                        <Shield className="size-5 text-white/75" />
                        <h3 className="font-semibold text-white/90">
                          {tPage('responsibleUse.safety.title')}
                        </h3>
                      </div>
                      <p className="mt-3">{tPage('responsibleUse.safety.description')}</p>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <div className="grid gap-5">
                <ScrollAnimation>
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-5 text-white/75" />
                      <h3 className="font-semibold">
                        {tPage('responsibleUse.identity.title')}
                      </h3>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                      {responsibleIdentityItems.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation>
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                    <div className="flex items-center gap-3">
                      <Sparkles className="size-5 text-white/75" />
                      <h3 className="font-semibold">
                        {tPage('responsibleUse.prohibited.title')}
                      </h3>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {tPage('responsibleUse.prohibited.intro')}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                      {responsibleProhibitedItems.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation>
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                    <div className="flex items-center gap-3">
                      <Briefcase className="size-5 text-white/75" />
                      <h3 className="font-semibold">
                        {tPage('responsibleUse.responsibility.title')}
                      </h3>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {tPage('responsibleUse.responsibility.intro')}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                      {responsibleRoleItems.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 text-sm leading-7 text-muted-foreground">
                      {tPage('responsibleUse.termsLink')}{' '}
                      <Link
                        href="/terms-of-service"
                        className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
                      >
                        {tPage('responsibleUse.termsOfService')}
                      </Link>{' '}
                      {tPage('responsibleUse.and')}{' '}
                      <Link
                        href="/acceptable-use-policy"
                        className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
                      >
                        {tPage('responsibleUse.acceptableUsePolicy')}
                      </Link>
                      {tPage('responsibleUse.period')}
                    </p>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </div>
        </section>

        <Features
          features={perfectFor}
          className="bg-muted/30 py-16 md:py-24"
        />

        <FAQ faq={faqData} className="py-16 md:py-24" />

        <CTA cta={finalCTA} className="bg-muted/30 py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
