import { getTranslations, setRequestLocale } from 'next-intl/server';

import { locales } from '@/config/locale';
import { CreatorWorkbench } from '@/shared/blocks/creator-workbench/creator-workbench';
import type { Header as HeaderType } from '@/shared/types/blocks/landing';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export type CreatorSearchParams = {
  scene?: string;
  model?: string;
  prompt?: string;
  params?: string;
  ref?: string;
  auto?: string;
};

const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_TEXT_TO_VIDEO_MODEL = 'seedance-1-5-pro';

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CreatorSearchParams>;
}) {
  const { locale } = await params;
  const { scene, model, prompt, params: paramsStr, ref, auto } = await searchParams;
  setRequestLocale(locale);
  const normalizedScene = (scene || "").trim();
  const defaultModel =
    normalizedScene.includes("text-to-video") || normalizedScene.includes("image-to-video")
      ? DEFAULT_TEXT_TO_VIDEO_MODEL
      : DEFAULT_IMAGE_MODEL;
  const initialModel =
    model ||
    defaultModel;

  const t = await getTranslations('landing');
  const tt = await getTranslations('ai.image');
  const header = t.raw('header') as HeaderType;

  return (
    <CreatorWorkbench
      navItems={header.nav?.items || []}
      title={tt.raw('page.title') as string}
      initialScene={scene}
      initialModel={initialModel}
      initialPrompt={prompt}
      initialParams={paramsStr}
      initialRef={ref}
      initialAuto={auto === '1'}
    />
  );
}
