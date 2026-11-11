import { getTranslations, setRequestLocale } from 'next-intl/server';

import { envConfigs } from '@/config';
import { locales } from '@/config/locale';
import { AiMediaPageLayout } from '@/shared/blocks/common/ai-media-page-layout';
import { JsonLd } from '@/shared/components/jsonld';
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateSoftwareApplicationSchema,
} from '@/shared/lib/jsonld';
import {
  CTA as CTAType,
  FAQ as FAQType,
  Features as FeaturesType,
  Hero as HeroType,
} from '@/shared/types/blocks/landing';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { flux2KleinTextToImageConfig } from '@/shared/blocks/desktop-playground';
import { CTA } from '@/themes/default/blocks/cta';
import { FAQ } from '@/themes/default/blocks/faq';
import { Features } from '@/themes/default/blocks/features';
import { Camera, Lightbulb, Palette, Sparkles, Wand2, Zap } from 'lucide-react';

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
    const t = await getTranslations('landing.flux-2-klein-text-to-image.page.metadata');

    const canonicalUrl =
        locale !== envConfigs.locale
            ? `${envConfigs.app_url}/${locale}/text-to-image/flux-2-klein`
            : `${envConfigs.app_url}/text-to-image/flux-2-klein`;

    return {
        title: t('title', { defaultValue: 'flux-2-klein text-to-image (4B) - AI Image Generator | joymagic' }),
        description: t('description', { defaultValue: 'Generate high-quality images with flux-2-klein text-to-image. Create consistent results with seed control and export up to 1536×1536.' }),
        keywords: t('keywords', { defaultValue: 'flux-2-klein text-to-image, flux-2-klein, flux-2-klein-4b, text-to-image, ai image generator, prompt to image' }),
        alternates: {
            canonical: canonicalUrl,
        },
    };
}

export default async function Flux2KleinTextToImagePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const tPage = await getTranslations('landing.flux-2-klein-text-to-image.page');
    const tHeader = await getTranslations('landing.header');

    // 获取 header 导航菜单项
    const headerNav = tHeader.raw('nav') as any;
    const headerNavItems = headerNav?.items || [];

    // Hero data
    const heroDescription =
        (tPage.raw('hero.description') as string) ||
        'Generate with flux-2-klein text-to-image: fast, high-quality images from prompts. Use seed control for consistent results and export up to 1536×1536.';
    const heroData: HeroType = {
        id: 'hero',
        title: tPage('hero.title', { defaultValue: 'flux-2-klein text-to-image' }),
        description: heroDescription,
        buttons: [
            {
                title: tPage('hero.button1', { defaultValue: 'Try Now' }),
                url: '#playground',
                variant: 'default',
            },
            {
                title: tPage('hero.button2', { defaultValue: 'View Pricing' }),
                url: '/pricing',
                variant: 'outline',
            },
        ],
    };

    // Key Features
    const keyFeatures: FeaturesType = {
        id: 'key-features',
        title: tPage('keyFeatures.title', { defaultValue: 'Key Features' }),
        description: tPage('keyFeatures.description', { defaultValue: 'Powerful AI image generation capabilities' }),
        items: [
            {
                title: tPage('keyFeatures.highQuality.title', { defaultValue: 'High Quality Images' }),
                description: tPage('keyFeatures.highQuality.description', { defaultValue: 'Generate high-resolution images with exceptional detail and clarity. Perfect for professional use cases.' }),
                icon: 'Camera',
            },
            {
                title: tPage('keyFeatures.fastGeneration.title', { defaultValue: 'Fast Generation' }),
                description: tPage('keyFeatures.fastGeneration.description', { defaultValue: 'Generate images quickly with efficient processing. Get results in seconds.' }),
                icon: 'Zap',
            },
            {
                title: tPage('keyFeatures.styleFlexibility.title', { defaultValue: 'Style Flexibility' }),
                description: tPage('keyFeatures.styleFlexibility.description', { defaultValue: 'Create images in various styles - photorealistic, artistic, abstract, and more. Control the output with detailed prompts.' }),
                icon: 'Wand2',
            },
            {
                title: tPage('keyFeatures.seedControl.title', { defaultValue: 'Seed Control' }),
                description: tPage('keyFeatures.seedControl.description', { defaultValue: 'Control randomness with seed values. Use the same seed to reproduce similar results or use -1 for random generation.' }),
                icon: 'Sparkles',
            },
        ],
    };

    // FAQ
    const faqData: FAQType = {
        id: 'faq',
        title: tPage('faq.title', { defaultValue: 'Frequently Asked Questions' }),
        description: tPage('faq.description', { defaultValue: 'Common questions about Flux 2 Klein Text to Image' }),
        items: [
            {
                question: tPage('faq.q1.question', { defaultValue: 'What is Flux 2 Klein?' }),
                answer: tPage('faq.q1.answer', { defaultValue: 'Flux 2 Klein is an advanced AI image generation model that creates images from text descriptions. It produces high-quality images at various resolutions.' }),
            },
            {
                question: tPage('faq.q2.question', { defaultValue: 'How detailed should my prompt be?' }),
                answer: tPage('faq.q2.answer', { defaultValue: 'More detail generally means better results. Include subject, setting, lighting, style, mood, and composition details. Be specific about what you want to see.' }),
            },
            {
                question: tPage('faq.q3.question', { defaultValue: 'What is the seed parameter?' }),
                answer: tPage('faq.q3.answer', { defaultValue: 'The seed parameter controls randomness. Use -1 for random generation, or use a specific number to reproduce similar results. Same seed with same prompt will produce similar images.' }),
            },
            {
                question: tPage('faq.q4.question', { defaultValue: 'What image sizes are supported?' }),
                answer: tPage('faq.q4.answer', { defaultValue: 'You can generate images from 256×256 up to 1536×1536. The size must be a multiple of 64. Default is 1024×1024.' }),
            },
            {
                question: tPage('faq.q5.question', { defaultValue: 'How many credits does it cost?' }),
                answer: tPage('faq.q5.answer', { defaultValue: 'Each image generation costs 2 credits. This makes it an affordable option for creating high-quality images.' }),
            },
        ],
    };

    // Final CTA
    const finalCTA: CTAType = {
        id: 'final-cta',
        title: tPage('finalCTA.title', { defaultValue: 'Ready to Create?' }),
        description: tPage('finalCTA.description', { defaultValue: 'Start generating amazing images from your text descriptions today.' }),
        buttons: [
            {
                title: tPage('finalCTA.button', { defaultValue: 'Try It Now' }),
                url: '#playground',
                variant: 'default',
            },
        ],
    };

    // Generate JSON-LD schemas
    const softwareSchema = generateSoftwareApplicationSchema({
        name: tPage('schema.softwareName', { defaultValue: 'joymagic AI Flux 2 Klein Text to Image' }),
        description: heroDescription.replace(/<[^>]*>/g, '').substring(0, 200),
        url: '/text-to-image/flux-2-klein',
        locale,
        category: 'MultimediaApplication',
        features: [
            tPage('schema.features.aiTextToImage', { defaultValue: 'AI Text to Image Generation' }),
            tPage('schema.features.highQuality', { defaultValue: 'High Quality Images' }),
            tPage('schema.features.fastProcessing', { defaultValue: 'Fast Processing' }),
        ],
    });

    const howToSchema = generateHowToSchema({
        name: tPage('schema.howToName', { defaultValue: 'How to Generate Images with Flux 2 Klein' }),
        description: tPage('schema.howToDescription', { defaultValue: 'Generate images from text descriptions using Flux 2 Klein' }),
        steps: [
            { name: 'Enter your prompt', text: 'Describe the image you want to generate' },
            { name: 'Set parameters', text: 'Choose image size and seed value' },
            { name: 'Generate', text: 'Click generate to create your image' },
            { name: 'Download', text: 'Download your high-quality generated image' },
        ],
        totalTime: 'PT1M',
    });

    const faqSchema = generateFAQSchema(
        faqData.items?.map((item) => ({
            question: item.question || '',
            answer: typeof item.answer === 'string' ? item.answer : '',
        })) || []
    );

    const breadcrumbSchema = generateBreadcrumbSchema(
        [
            { name: tPage('breadcrumb.home', { defaultValue: 'Home' }), url: '/' },
            { name: tPage('breadcrumb.textToImage', { defaultValue: 'Text to Image' }), url: '/text-to-image' },
            { name: tPage('breadcrumb.flux2Klein', { defaultValue: 'Flux 2 Klein' }), url: '/text-to-image/flux-2-klein' },
        ],
        locale
    );

    return (
        <>
            <JsonLd data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]} />
            <AiMediaPageLayout
                hero={heroData}
                headerNavItems={headerNavItems}
                playgroundConfig={flux2KleinTextToImageConfig}
            >
                {/* Key Features - Learn More Section */}
                <Features features={keyFeatures} className="bg-transparent py-16 md:py-24" />

                {/* Prompting Tips */}
                <section className="bg-transparent py-16 md:py-24">
                    <div className="container">
                        <div className="mx-auto max-w-4xl">
                            <ScrollAnimation>
                                <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                                    {tPage('promptingTips.title', { defaultValue: 'Prompting Tips' })}
                                </h2>
                                <div className="mt-8 grid gap-6 md:grid-cols-2">
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Lightbulb className="size-5 text-white/75" />
                                            <h3 className="font-semibold">{tPage('promptingTips.lighting.title', { defaultValue: 'Be Specific About Lighting' })}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {tPage('promptingTips.lighting.description', { defaultValue: '"Golden hour sunlight from the left, soft shadows" works better than "good lighting."' })}
                                        </p>
                                    </div>
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Camera className="size-5 text-white/75" />
                                            <h3 className="font-semibold">{tPage('promptingTips.camera.title', { defaultValue: 'Include Camera Details' })}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {tPage('promptingTips.camera.description', { defaultValue: '"Shot with 85mm lens, shallow depth of field" adds professional photography quality.' })}
                                        </p>
                                    </div>
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Palette className="size-5 text-white/75" />
                                            <h3 className="font-semibold">{tPage('promptingTips.style.title', { defaultValue: 'Specify Art Style' })}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {tPage('promptingTips.style.description', { defaultValue: '"Digital illustration in Studio Ghibli style" or "hyperrealistic 3D render" gives clear direction.' })}
                                        </p>
                                    </div>
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Sparkles className="size-5 text-white/75" />
                                            <h3 className="font-semibold">{tPage('promptingTips.mood.title', { defaultValue: 'Describe Mood and Atmosphere' })}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {tPage('promptingTips.mood.description', { defaultValue: '"Cozy, warm, nostalgic feeling" or "dramatic, cinematic, high contrast" shapes the overall image.' })}
                                        </p>
                                    </div>
                                </div>
                            </ScrollAnimation>
                        </div>
                    </div>
                </section>

                {/* Use Cases */}
                <section className="bg-transparent py-16 md:py-24">
                    <div className="container">
                        <div className="mx-auto max-w-4xl">
                            <ScrollAnimation>
                                <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                                    {tPage('useCases.title', { defaultValue: 'Use Cases' })}
                                </h2>
                                <div className="mt-8 grid gap-6 md:grid-cols-2">
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                                        <h3 className="mb-3 font-semibold">{tPage('useCases.marketing.title', { defaultValue: 'Marketing Visuals' })}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {tPage('useCases.marketing.description', { defaultValue: 'Generate product concepts, ad imagery, and social media content without photoshoots.' })}
                                        </p>
                                    </div>
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                                        <h3 className="mb-3 font-semibold">{tPage('useCases.character.title', { defaultValue: 'Character Design' })}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {tPage('useCases.character.description', { defaultValue: 'Create original characters for games, comics, or animation projects from text descriptions.' })}
                                        </p>
                                    </div>
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                                        <h3 className="mb-3 font-semibold">{tPage('useCases.concept.title', { defaultValue: 'Concept Art' })}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {tPage('useCases.concept.description', { defaultValue: 'Visualize scenes, environments, and ideas quickly for creative projects and presentations.' })}
                                        </p>
                                    </div>
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                                        <h3 className="mb-3 font-semibold">{tPage('useCases.stock.title', { defaultValue: 'Stock Photo Alternative' })}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {tPage('useCases.stock.description', { defaultValue: 'Generate specific images you need instead of searching through generic stock libraries.' })}
                                        </p>
                                    </div>
                                </div>
                            </ScrollAnimation>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <FAQ faq={faqData} className="bg-transparent py-16 md:py-24" />

                {/* Final CTA */}
                <CTA cta={finalCTA} className="bg-transparent py-16 md:py-24 text-foreground" />
            </AiMediaPageLayout>
        </>
    );
}
