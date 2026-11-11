import { getTranslations, setRequestLocale } from 'next-intl/server';

import { envConfigs } from '@/config';
import { locales, defaultLocale } from '@/config/locale';
import { Link } from '@/core/i18n/navigation';
import { getMetadata } from '@/shared/lib/seo';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = '/wan-2-6';

export const generateMetadata = getMetadata({
  metadataKey: 'landing.wan-2-6.metadata',
  canonicalUrl: CANONICAL_PATH,
});

function canonicalizeUrl(url: string) {
  if (url !== `${BASE_URL}/` && url.endsWith('/')) {
    return url.replace(/\/$/, '');
  }
  return url;
}

function getAbsoluteUrl(path: string, locale: string) {
  const localePrefix = locale && locale !== defaultLocale ? `/${locale}` : '';
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return canonicalizeUrl(`${BASE_URL}${localePrefix}${safePath}`);
}

export default async function Wan26Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('landing.wan-2-6');
  const heroTrust: string[] = t.raw('hero.trust');
  const whatIsParagraphs: string[] = t.raw('sections.what_is.paragraphs');
  const faqItems: { question: string; answer: string }[] = t.raw('faq.items');

  const canonicalUrl = getAbsoluteUrl(CANONICAL_PATH, locale);
  const homeUrl = getAbsoluteUrl('/', locale);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Wan 2.6',
        item: canonicalUrl,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-muted-foreground text-sm">
              {t('hero.kicker', { brand: envConfigs.app_name || "Barko Bear" })}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {t('hero.h1')}
            </h1>
            <p className="text-muted-foreground mt-6 text-pretty text-lg">
              {t('hero.description')}
            </p>

            <ul className="text-muted-foreground mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {heroTrust.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <p className="text-muted-foreground mt-4 text-sm">
              {t('hero.pricing_from')}{' '}
              <Link href="/pricing" className="text-foreground underline">
                {t('hero.pricing_link')}
              </Link>{' '}
              {t('hero.pricing_suffix')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">{t('sections.what_is.h2')}</h2>
            <div className="text-muted-foreground mt-4 space-y-4 leading-relaxed">
              {whatIsParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">
              {t('sections.creations.h2')}
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="text-lg font-semibold">
                  {t('sections.creations.cards.t2i.h3')}
                </h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.creations.cards.t2i.p')}
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-6">
                <h3 className="text-lg font-semibold">
                  {t('sections.creations.cards.editing.h3')}
                </h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.creations.cards.editing.p')}
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-6 md:col-span-2">
                <h3 className="text-lg font-semibold">
                  {t('sections.creations.cards.i2v.h3')}
                </h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.creations.cards.i2v.p')}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
              {t('sections.creations.links.prefix')}{' '}
              <Link href="/ai-video-generator" className="underline">
                {t('sections.creations.links.i2v')}
              </Link>{' '}
              {t('sections.creations.links.and')}{' '}
              <Link href="/ai-image-generator" className="underline">
                {t('sections.creations.links.t2i')}
              </Link>{' '}
              {t('sections.creations.links.suffix', {
                brand: envConfigs.app_name || "Barko Bear",
              })}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">
              {t('sections.i2v.h2')}
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {t('sections.i2v.p')}
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">{t('sections.i2v.cards.inputs.h3')}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.i2v.cards.inputs.p')}
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">{t('sections.i2v.cards.controls.h3')}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.i2v.cards.controls.p')}
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">{t('sections.i2v.cards.use_cases.h3')}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.i2v.cards.use_cases.p')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">{t('sections.how_to.h2')}</h2>
            <ol className="mt-8 space-y-4">
              <li className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">{t('sections.how_to.steps.1.h3')}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.how_to.steps.1.p')}
                </p>
              </li>
              <li className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">
                  {t('sections.how_to.steps.2.h3')}
                </h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.how_to.steps.2.p')}
                </p>
              </li>
              <li className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">
                  {t('sections.how_to.steps.3.h3')}
                </h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.how_to.steps.3.p')}
                </p>
              </li>
              <li className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">{t('sections.how_to.steps.4.h3')}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.how_to.steps.4.p')}
                </p>
              </li>
              <li className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">{t('sections.how_to.steps.5.h3')}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.how_to.steps.5.p')}
                </p>
              </li>
              <li className="rounded-2xl border bg-card p-6">
                <h3 className="font-semibold">
                  {t('sections.how_to.steps.6.h3')}
                </h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {t('sections.how_to.steps.6.p')}
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">{t('sections.api.h2')}</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {t('sections.api.p')}
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">{t('sections.api.links.docs_label')}</strong>{' '}
                <Link href="/docs" className="underline">
                  /docs
                </Link>
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">{t('sections.api.links.keys_label')}</strong>{' '}
                <Link href="/settings/apikeys" className="underline">
                  /settings/apikeys
                </Link>{' '}
                {t('sections.api.links.keys_suffix')}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border bg-muted/30 p-6">
              <h3 className="font-semibold">{t('sections.api.example.h3')}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {t('sections.api.example.p')}
              </p>
              <pre className="mt-4 overflow-x-auto rounded-xl border bg-background p-4 text-xs leading-relaxed">
{`POST /v1/generate
Authorization: Bearer <YOUR_API_KEY>
Content-Type: application/json

{
  "model": "wan-2.6",
  "mode": "image-to-video",
  "prompt": "A glossy product shot, soft studio light, slow push-in",
  "image": "<https://.../reference.png>",
  "options": { "duration": 5, "resolution": "720p" }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">{t('sections.pricing.h2')}</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {t('sections.pricing.p_before')}{' '}
              <Link href="/pricing" className="underline">
                /pricing
              </Link>{' '}
              {t('sections.pricing.p_after')}
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t('sections.pricing.table.task')}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t('sections.pricing.table.unit')}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t('sections.pricing.table.starting_from')}
                    </th>
                  </tr>
                </thead>
                <tbody className="[&>tr:not(:last-child)]:border-b">
                  <tr>
                    <td className="px-4 py-3">{t('sections.pricing.rows.720p.task')}</td>
                    <td className="px-4 py-3">{t('sections.pricing.rows.720p.unit')}</td>
                    <td className="px-4 py-3">{t('sections.pricing.rows.720p.start')}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">{t('sections.pricing.rows.1080p.task')}</td>
                    <td className="px-4 py-3">{t('sections.pricing.rows.1080p.unit')}</td>
                    <td className="px-4 py-3">{t('sections.pricing.rows.1080p.start')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              {t('sections.pricing.note')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">
              {t('sections.quality.h2')}
            </h2>
            <div className="text-muted-foreground mt-4 space-y-4 leading-relaxed">
              <p>{t('sections.quality.p1')}</p>
              <p>
                {t('sections.quality.p2_before')}{' '}
                <Link href="/terms-of-service" className="underline">
                  {t('sections.quality.terms_link')}
                </Link>{' '}
                {t('sections.quality.p2_after')}
              </p>
              <p>
                {t('sections.quality.p3_before')}{' '}
                <Link href="/content-moderation-policy" className="underline">
                  {t('sections.quality.moderation_link')}
                </Link>{' '}
                {t('sections.quality.p3_middle')}{' '}
                <Link href="/acceptable-use-policy" className="underline">
                  {t('sections.quality.aup_link')}
                </Link>{' '}
                {t('sections.quality.p3_after')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold">{t('faq.h2')}</h2>
            <div className="mt-6 space-y-3">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border bg-card p-6"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold outline-none [&::-webkit-details-marker]:hidden">
                    {item.question}
                  </summary>
                  <p className="text-muted-foreground mt-3 leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-muted/30 p-6">
            <h2 className="text-lg font-semibold">{t('disclaimer.h2')}</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              {t('disclaimer.p', { brand: envConfigs.app_name || "Barko Bear" })}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
