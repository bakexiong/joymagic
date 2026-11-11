// .source folder will be generated when you run `next dev`
import { createElement } from 'react';
import { docs, pages, posts } from '@/.source';
import type { I18nConfig } from 'fumadocs-core/i18n';
import { loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';

import { locales } from '@/config/locale';

export const i18n: I18nConfig = {
  defaultLanguage: 'en',
  languages: locales,
};

const iconHelper = (icon: string | undefined) => {
  if (!icon) {
    // You may set a default icon
    return;
  }
  if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
};

// Fumadocs version compatibility: the generated source exposes `files` as a
// function in our setup, while `loader` expects an array. Normalize here to
// avoid runtime errors like "files.map is not a function".
const normalizeSource = (source: { files: any }) => ({
  files: typeof source.files === 'function' ? source.files() : source.files,
});

// Docs source
export const docsSource = loader({
  baseUrl: '/docs',
  source: normalizeSource(docs.toFumadocsSource()),
  i18n,
  icon: iconHelper,
});

// Pages source (using root path)
export const pagesSource = loader({
  baseUrl: '/',
  source: normalizeSource(pages.toFumadocsSource()),
  i18n,
  icon: iconHelper,
});

// Posts source
export const postsSource = loader({
  baseUrl: '/blog',
  source: normalizeSource(posts.toFumadocsSource()),
  i18n,
  icon: iconHelper,
});

// Keep backward compatibility
export const source = docsSource;
