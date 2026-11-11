import { getTranslations, setRequestLocale } from 'next-intl/server';
import dynamic from 'next/dynamic';

import { locales } from '@/config/locale';
import { PageHeader } from '@/shared/blocks/common';
import { JsonLd } from '@/shared/components/jsonld';
import {
  generateSoftwareApplicationSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  type JsonLdSchema,
} from '@/shared/lib/jsonld';
import { getMetadata } from '@/shared/lib/seo';
import { CTA, FAQ } from '@/themes/default/blocks';

// 动态导入大型 MusicGenerator 组件
const MusicGenerator = dynamic(
  () => import('@/shared/blocks/generator').then(mod => ({ default: mod.MusicGenerator })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ),
  }
);

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  metadataKey: 'ai.music.metadata',
  canonicalUrl: '/ai-music-generator',
});

export default async function AiMusicGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('landing');
  const tt = await getTranslations('ai.music');
  const cta = t.has('cta') ? t.raw('cta') : null;

  // Get FAQ data
  const faqData = t.raw('faq') as { items?: Array<{ question: string; answer: string }> };

  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: 'joymagic AI Music Generator',
    description: tt.raw('page.description') as string,
    url: '/ai-music-generator',
    locale,
    category: 'MultimediaApplication',
    features: ['Text to Music', 'Multiple Genres', 'High Quality Audio', 'Fast Generation'],
  });

  const faqSchema = faqData.items ? generateFAQSchema(
    faqData.items.map((item) => ({
      question: item.question,
      answer: typeof item.answer === 'string' ? item.answer : '',
    }))
  ) : null;

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: 'Home', url: '/' },
      { name: 'AI Music Generator', url: '/ai-music-generator' },
    ],
    locale
  );

  const schemas: JsonLdSchema[] = [softwareSchema, breadcrumbSchema];
  if (faqSchema) schemas.push(faqSchema);

  return (
    <>
      <JsonLd data={schemas} />
      <PageHeader
        title={tt.raw('page.title')}
        description={tt.raw('page.description')}
        className="mt-16 -mb-32"
      />
      <MusicGenerator srOnlyTitle={tt.raw('generator.title')} />
      <FAQ faq={faqData} />
      {cta ? <CTA cta={cta} className="bg-muted" /> : null}
    </>
  );
}
