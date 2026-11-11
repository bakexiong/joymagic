import fs from 'fs';
import path from 'path';
import React, { type ReactNode } from 'react';

import { getMDXComponents } from '@/shared/lib/mdx-components';
import { and, count, desc, eq, like } from 'drizzle-orm';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { slug as slugify } from 'github-slugger';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/de';
import 'dayjs/locale/ko';
import 'dayjs/locale/ja';
import 'dayjs/locale/es';
import 'dayjs/locale/it';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/ru';
import 'dayjs/locale/tr';

import { envConfigs } from '@/config';
import { db } from '@/core/db';
import { pagesSource, postsSource } from '@/core/docs/source';
import { generateTOC, type TOCItemType } from '@/core/docs/toc';
import { post } from '@/config/db/schema';
import { MarkdownContent } from '@/shared/blocks/common/markdown-content';
import { isNonBrandExternal, mergeRelValues } from '@/shared/lib/url';
import {
  Category as BlogCategoryType,
  Post as BlogPostType,
} from '@/shared/types/blocks/blog';

import { getTaxonomies, TaxonomyStatus, TaxonomyType } from './taxonomy';

export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
export type UpdatePost = Partial<Omit<NewPost, 'id' | 'createdAt'>>;

export enum PostType {
  ARTICLE = 'article',
  PAGE = 'page',
}

export enum PostStatus {
  PUBLISHED = 'published', // published and visible to the public
  PENDING = 'pending', // pending review by admin
  DRAFT = 'draft', // draft and not visible to the public
  ARCHIVED = 'archived', // archived means deleted
}

// Strapi connection (server-side)
const STRAPI_API_URL =
  process.env.STRAPI_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  'https://railwayapp-strapi-qzlh-production.up.railway.app';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
const hasStrapiCredentials = Boolean(STRAPI_API_URL && STRAPI_TOKEN);

function getCurrentSiteDomain() {
  const fallback = 'joymagic';

  // Explicit override for Strapi site filter
  const siteEnv =
    process.env.STRAPI_SITE ||
    process.env.NEXT_PUBLIC_STRAPI_SITE ||
    process.env.NEXT_PUBLIC_APP_URL ||
    envConfigs.app_url;

  if (!siteEnv) return fallback;

  // Always strip protocol and paths, keep plain host/domain
  try {
    const parsed = new URL(siteEnv.includes('://') ? siteEnv : `https://${siteEnv}`);
    return parsed.hostname || fallback;
  } catch (_e) {
    return siteEnv.replace(/^https?:\/\//, '').split('/')[0] || fallback;
  }
}

function extractText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (typeof node === 'object') {
    return (
      node.text ||
      node.title ||
      extractText(node.children) ||
      extractText(node.content)
    );
  }
  return '';
}

function truncateWords(text: string, wordLimit = 150) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length <= wordLimit) return words.join(' ');
  return `${words.slice(0, wordLimit).join(' ')}…`;
}

function extractExcerptFromContent(content: string, wordLimit = 150) {
  const cleaned = content
    .replace(/^---[\s\S]*?---/, ' ') // frontmatter
    .replace(/```[\s\S]*?```/g, ' ') // code fences
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ') // images
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1') // links keep text
    .replace(/<[^>]+>/g, ' ') // html tags
    .replace(/[#>*_~\-]+/g, ' ') // markdown chars
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();

  return truncateWords(cleaned, wordLimit);
}

function getPostContentForSlug(slug: string) {
  const candidates = [
    path.join(process.cwd(), 'content', 'posts', `${slug}.mdx`),
    path.join(process.cwd(), 'content', 'posts', `${slug}.md`),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        return fs.readFileSync(filePath, 'utf-8');
      } catch {
        // ignore and continue
      }
    }
  }
  return '';
}

function resolveDescription({
  description,
  slug,
}: {
  description?: string;
  slug: string;
}) {
  if (description && description.trim()) {
    return truncateWords(description, 150);
  }

  const raw = getPostContentForSlug(slug);
  if (!raw) return '';

  return extractExcerptFromContent(raw, 150);
}

export async function addPost(data: NewPost) {
  const [result] = await db().insert(post).values(data).returning();

  return result;
}

export async function updatePost(id: string, data: UpdatePost) {
  const [result] = await db()
    .update(post)
    .set(data)
    .where(eq(post.id, id))
    .returning();

  return result;
}

export async function deletePost(id: string) {
  const result = await updatePost(id, {
    status: PostStatus.ARCHIVED,
  });

  return result;
}

export async function findPost({
  id,
  slug,
  status,
}: {
  id?: string;
  slug?: string;
  status?: PostStatus;
}) {
  const [result] = await db()
    .select()
    .from(post)
    .where(
      and(
        id ? eq(post.id, id) : undefined,
        slug ? eq(post.slug, slug) : undefined,
        status ? eq(post.status, status) : undefined
      )
    )
    .limit(1);

  return result;
}

export async function getPosts({
  type,
  status,
  category,
  tag,
  page = 1,
  limit = 30,
}: {
  type?: PostType;
  status?: PostStatus;
  category?: string;
  tag?: string[];
  page?: number;
  limit?: number;
} = {}): Promise<Post[]> {
  const result = await db()
    .select()
    .from(post)
    .where(
      and(
        type ? eq(post.type, type) : undefined,
        status ? eq(post.status, status) : undefined,
        category ? like(post.categories, `%${category}%`) : undefined,
        tag ? like(post.tags, `%${tag}%`) : undefined
      )
    )
    .orderBy(desc(post.updatedAt), desc(post.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return result;
}

export async function getPostsCount({
  type,
  status,
  category,
  tag,
}: {
  type?: PostType;
  status?: PostStatus;
  category?: string;
  tag?: string;
} = {}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(post)
    .where(
      and(
        type ? eq(post.type, type) : undefined,
        status ? eq(post.status, status) : undefined,
        category ? like(post.categories, `%${category}%`) : undefined,
        tag ? like(post.tags, `%${tag}%`) : undefined
      )
    )
    .limit(1);

  return result?.count || 0;
}

async function fetchFromStrapi<T>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<T | null> {
  if (!hasStrapiCredentials) {
    return null;
  }

  try {
    const baseUrl = STRAPI_API_URL.replace(/\/$/, '');
    const url = new URL(path, baseUrl);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.log('strapi request failed:', res.status, res.statusText);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.log('strapi request error:', error);
    return null;
  }
}

function getStrapiMediaUrl(media: any): string {
  const url =
    media?.data?.attributes?.url ||
    media?.url ||
    media?.attributes?.url ||
    '';

  if (!url) return '';
  if (url.startsWith('http')) return url;

  return `${STRAPI_API_URL.replace(/\/$/, '')}${url}`;
}

function extractStrapiText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content.map((item) => extractStrapiText(item)).join(' ').trim();
  }

  if (typeof content === 'object') {
    const textParts: string[] = [];
    if (content.text) textParts.push(content.text);
    if (content.title) textParts.push(content.title);
    if (content.children) textParts.push(extractStrapiText(content.children));
    return textParts.join(' ').trim();
  }

  return '';
}

function richTextBlocksToMarkdown(blocks: any): string {
  if (!Array.isArray(blocks)) return typeof blocks === 'string' ? blocks : '';

  const applyInlineFormatting = (text: string, node: any) => {
    let result = text || '';
    if (!result) return result;

    if (node.code) result = `\`${result}\``;
    if (node.bold) result = `**${result}**`;
    if (node.italic) result = `_${result}_`;
    if (node.strikethrough) result = `~~${result}~~`;
    if (node.underline) result = `<u>${result}</u>`;

    return result;
  };

  const renderInlineNodesToMarkdown = (node: any): string => {
    if (!node) return '';
    if (typeof node === 'string') return node;

    if (Array.isArray(node)) {
      return node.map((child) => renderInlineNodesToMarkdown(child)).join('');
    }

    if (node.type === 'link') {
      const href = node.url || '';
      const label =
        renderInlineNodesToMarkdown(node.children || []) || href || '';
      if (!href) return label;
      return `[${label}](${href})`;
    }

    if (node.type === 'text') {
      return applyInlineFormatting(node.text || '', node);
    }

    const childContent = renderInlineNodesToMarkdown(
      node.children || node.content || []
    );
    return applyInlineFormatting(childContent, node);
  };

  const lines: string[] = [];

  for (const block of blocks) {
    if (!block) continue;
    switch (block.type) {
      case 'heading': {
        const level = Math.min(Math.max(block.level || 2, 1), 6);
        const content = renderInlineNodesToMarkdown(block.children || []);
        if (content.trim()) {
          lines.push(`${'#'.repeat(level)} ${content}`.trim());
        }
        break;
      }
      case 'paragraph': {
        const content = renderInlineNodesToMarkdown(block.children || []);
        if (content.trim()) lines.push(content.trim());
        break;
      }
      case 'list': {
        const items = block.children || block.items || [];
        const ordered =
          block.format === 'ordered' || block.listType === 'ordered';
        const listLines = items
          .map((item: any, idx: number) => {
            const content = renderInlineNodesToMarkdown(
              item?.children || item?.items || []
            ).trim();
            if (!content) return '';
            const marker = ordered ? `${idx + 1}.` : '-';
            return `${marker} ${content}`;
          })
          .filter(Boolean);

        if (listLines.length) {
          lines.push(listLines.join('\n'));
        }
        break;
      }
      case 'quote': {
        const content = renderInlineNodesToMarkdown(block.children || []);
        if (content.trim()) lines.push(`> ${content.trim()}`);
        break;
      }
      case 'image': {
        const url =
          block?.image?.url ||
          block?.url ||
          block?.image?.data?.attributes?.url ||
          '';
        const alt = block?.caption || block?.alternativeText || '';
        if (url) lines.push(`![${alt}](${url})`);
        break;
      }
      default: {
        const text = renderInlineNodesToMarkdown(
          block.children || block.content || block
        );
        if (text.trim()) lines.push(text.trim());
        break;
      }
    }
  }

  return lines.filter(Boolean).join('\n\n');
}

function sanitizeTableHtml(html: string) {
  return html.replace(/ style="[^"]*"/gi, '');
}

function contentBlocksToMarkdown(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];

  const formatCodeBlock = (code: string) =>
    ['```', code || '', '```'].join('\n');
  const renderHtmlTable = (html: string) =>
    `<div className="html-table" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(
      html
    )} }} />`;

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const type = block.__component;

    switch (type) {
      case 'rich-text.rich-text': {
        parts.push(richTextBlocksToMarkdown(block.richtext || []));
        break;
      }
      case 'code.code': {
        if (block.code) {
          parts.push(formatCodeBlock(block.code));
        }
        break;
      }
      case 'image.image': {
        const media = block.image;
        const list = Array.isArray(media?.data)
          ? media.data
          : Array.isArray(media)
            ? media
            : media?.data
              ? [media.data]
              : [];
        for (const item of list) {
          const attrs = item?.attributes || item;
          const url = getStrapiMediaUrl(attrs);
          const alt = attrs?.alternativeText || attrs?.name || '';
          if (url) parts.push(`![${alt}](${url})`);
        }
        break;
      }
      case 'youtube-video.youtube-video': {
        const link = block.youtube_video?.trim();
        if (link) {
          const id = extractYouTubeId(link);
          const src = id ? `https://www.youtube.com/embed/${id}` : link;
          parts.push(
            `<iframe src="${src}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full aspect-video rounded-lg border border-border"></iframe>`
          );
        }
        break;
      }
      case 'table.htmltable': {
        if (block.htmltable) {
          parts.push(renderHtmlTable(sanitizeTableHtml(block.htmltable)));
        }
        break;
      }
      default: {
        const text = extractText(block);
        if (text) parts.push(text);
      }
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

function contentBlocksToText(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const type = block.__component;
    switch (type) {
      case 'rich-text.rich-text': {
        parts.push(extractText(block.richtext));
        break;
      }
      case 'code.code': {
        if (block.code) parts.push(block.code);
        break;
      }
      case 'image.image': {
        const media = block.image;
        const list = Array.isArray(media?.data)
          ? media.data
          : Array.isArray(media)
            ? media
            : media?.data
              ? [media.data]
              : [];
        for (const item of list) {
          const attrs = item?.attributes || item;
          if (attrs?.alternativeText) parts.push(attrs.alternativeText);
          else if (attrs?.name) parts.push(attrs.name);
        }
        break;
      }
      case 'youtube-video.youtube-video': {
        if (block.youtube_video) parts.push(block.youtube_video);
        break;
      }
      case 'table.htmltable': {
        if (block.htmltable) parts.push(block.htmltable);
        break;
      }
      default: {
        const text = extractText(block);
        if (text) parts.push(text);
      }
    }
  }

  return parts.join(' ');
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1) || null;
    }
    if (u.searchParams.get('v')) {
      return u.searchParams.get('v');
    }
    if (u.pathname.startsWith('/embed/')) {
      return u.pathname.split('/').pop() || null;
    }
  } catch {
    // ignore
  }
  return null;
}

function renderStrapiInlineNodes(
  nodes: any[],
  keyPrefix: string
): (React.ReactElement | null)[] {
  if (!nodes || nodes.length === 0) return [];

  return nodes
    .map((node, idx) => {
      if (!node) return null;

      const key = `${keyPrefix}-${idx}`;

      if (node.type === 'text') {
        let textContent: ReactNode = node.text || '';
        if (node.code) textContent = <code>{textContent}</code>;
        if (node.italic) textContent = <em>{textContent}</em>;
        if (node.underline) textContent = <u>{textContent}</u>;
        if (node.strikethrough) textContent = <s>{textContent}</s>;
        if (node.bold) textContent = <strong>{textContent}</strong>;

        return <span key={key}>{textContent}</span>;
      }

      if (node.type === 'link') {
        return (
          <a
            key={key}
            href={node.url || '#'}
            target={
              node.openInNewTab || isNonBrandExternal(node.url) ? '_blank' : '_self'
            }
            rel={mergeRelValues(
              'noreferrer',
              [
                node.openInNewTab ? 'noopener' : undefined,
                isNonBrandExternal(node.url) ? 'nofollow' : undefined,
              ].filter(Boolean) as string[]
            )}
          >
            {renderStrapiInlineNodes(node.children || [], `${key}-link`)}
          </a>
        );
      }

      if (node.children) {
        return (
          <span key={key}>
            {renderStrapiInlineNodes(node.children, `${key}-child`)}
          </span>
        );
      }

      return null;
    })
    .filter(Boolean);
}

function renderStrapiBlocks(content: any): ReactNode | undefined {
  if (!content) return undefined;

  if (typeof content === 'string') {
    return <MarkdownContent content={content} />;
  }

  if (!Array.isArray(content)) return undefined;

  return content.map((block, idx) => {
    const key = `block-${idx}`;
    if (!block) return null;

    switch (block.type) {
      case 'paragraph':
        return (
          <p key={key}>
            {renderStrapiInlineNodes(block.children || [], `${key}-p`)}
          </p>
        );
      case 'heading': {
        const level = Math.min(Math.max(block.level || 2, 1), 6);
        const Tag = `h${level}` as React.ElementType;
        const headingText = extractStrapiText(block.children);
        const id = headingText ? slugify(headingText) : undefined;

        return (
          <Tag key={key} id={id}>
            {renderStrapiInlineNodes(block.children || [], `${key}-h`)}
          </Tag>
        );
      }
      case 'list': {
        const ListTag =
          block.format === 'ordered' || block.listType === 'ordered'
            ? 'ol'
            : 'ul';
        return (
          <ListTag key={key} className="list-inside list-disc space-y-2">
            {(block.children || []).map((item: any, itemIdx: number) => (
              <li key={`${key}-li-${itemIdx}`}>
                {renderStrapiInlineNodes(
                  item?.children || item?.items || [],
                  `${key}-li-${itemIdx}`
                )}
              </li>
            ))}
          </ListTag>
        );
      }
      case 'quote':
        return (
          <blockquote
            key={key}
            className="border-l-4 border-border/60 pl-4 italic text-muted-foreground"
          >
            {renderStrapiInlineNodes(block.children || [], `${key}-q`)}
          </blockquote>
        );
      case 'image':
      case 'media': {
        const imageUrl = getStrapiMediaUrl(block.image || block.file || block);
        if (!imageUrl) return null;

        const caption =
          block.caption ||
          block.alternativeText ||
          block.name ||
          extractStrapiText(block.children);

        return (
          <figure key={key} className="my-4 overflow-hidden rounded-xl">
            <img
              src={imageUrl}
              alt={caption || ''}
              className="h-auto w-full object-cover"
            />
            {caption ? (
              <figcaption className="text-muted-foreground mt-2 text-center text-sm">
                {caption}
              </figcaption>
            ) : null}
          </figure>
        );
      }
      default:
        return (
          <p key={key}>
            {renderStrapiInlineNodes(block.children || [], `${key}-d`)}
          </p>
        );
    }
  });
}

function buildStrapiToc(blocks: any): TOCItemType[] {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .map((block) => {
      if (!block || block.type !== 'heading') return null;
      const title = extractStrapiText(block.children);
      if (!title) return null;
      const depth = block.level || 2;
      const id = slugify(title);

      return {
        title,
        url: `#${id}`,
        depth,
      };
    })
    .filter(Boolean) as TOCItemType[];
}

function buildStrapiExcerpt(content: any, fallback = '', limit = 150) {
  const rawText = extractStrapiText(content) || fallback;
  const normalized = rawText.replace(/\s+/g, ' ').trim();
  return truncateWords(normalized, limit);
}

function mapStrapiCategory(
  category: any,
  categoryPrefix: string
): BlogCategoryType | null {
  if (!category || !category.attributes) return null;
  const slug = category.attributes.slug || '';
  const title = category.attributes.name || slug;

  return {
    id: category.id ? String(category.id) : undefined,
    slug,
    title,
    description: buildStrapiExcerpt(category.attributes.description),
    url: slug ? `${categoryPrefix}${slug}` : undefined,
  };
}

function mapStrapiPost({
  entry,
  locale,
  postPrefix,
  categoryPrefix,
  includeContent = false,
}: {
  entry: any;
  locale: string;
  postPrefix: string;
  categoryPrefix: string;
  includeContent?: boolean;
}): BlogPostType | null {
  if (!entry || !entry.attributes) return null;

  const attrs = entry.attributes;
  const slug = attrs.slug || entry.id?.toString?.() || '';
  if (!slug) return null;

  const category = mapStrapiCategory(attrs.category?.data, categoryPrefix);
  const createdAt = attrs.publishedAt || attrs.createdAt;
  const createdAtValueRaw = createdAt ? new Date(createdAt).getTime() : 0;
  const createdAtValue = Number.isFinite(createdAtValueRaw)
    ? createdAtValueRaw
    : 0;
  const contentBlocks = attrs.content_blocks || [];
  const contentText = contentBlocksToText(contentBlocks);
  const markdownBody = contentBlocksToMarkdown(contentBlocks);
  const descriptionText =
    typeof attrs.description === 'string'
      ? attrs.description
      : extractStrapiText(attrs.description || '') || contentText;
  const description = truncateWords(descriptionText || '', 150);

  return {
    id: entry.id ? String(entry.id) : slug,
    slug,
    title: attrs.title || '',
    description,
    content: markdownBody || contentText,
    body: includeContent ? (
      <MarkdownContent content={markdownBody} />
    ) : undefined,
    toc: includeContent ? generateTOC(markdownBody) : undefined,
    created_at: createdAt
      ? getPostDate({
        created_at: createdAt,
        locale,
      })
      : '',
    created_at_value: createdAtValue,
    author_name: attrs.auther?.data?.attributes?.name || '',
    author_image: getStrapiMediaUrl(
      attrs.auther?.data?.attributes?.avatar || ''
    ),
    image: getStrapiMediaUrl(attrs.featured_image || ''),
    url: `${postPrefix}${slug}`,
    categories: category ? [category] : undefined,
  };
}

async function getStrapiPost({
  slug,
  locale,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
}: {
  slug: string;
  locale: string;
  postPrefix?: string;
  categoryPrefix?: string;
}): Promise<BlogPostType | null> {
  if (!hasStrapiCredentials) return null;
  const site = getCurrentSiteDomain();

  const data = await fetchFromStrapi<{ data: any[] }>('/api/posts', {
    'filters[slug][$eq]': slug,
    'filters[site][site][$eq]': site,
    'pagination[pageSize]': 1,
    'populate[featured_image]': '*',
    'populate[auther][populate]': 'avatar',
    'populate[category]': '*',
    'populate[content_blocks][populate]': 'deep',
  });

  const entry = data?.data?.[0];
  if (!entry) return null;

  return mapStrapiPost({
    entry,
    locale,
    postPrefix,
    categoryPrefix: categoryPrefix || '/blog/category/',
    includeContent: true,
  });
}

async function getStrapiPostsAndCategories({
  page = 1,
  limit = 30,
  locale,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
  categorySlug,
}: {
  page?: number;
  limit?: number;
  locale: string;
  postPrefix?: string;
  categoryPrefix?: string;
  categorySlug?: string;
}) {
  if (!hasStrapiCredentials) {
    return {
      posts: [],
      postsCount: 0,
      categories: [],
      categoriesCount: 0,
    };
  }

  const site = getCurrentSiteDomain();

  const postQuery: Record<string, string | number> = {
    'pagination[page]': page,
    'pagination[pageSize]': limit,
    'populate[featured_image]': '*',
    'populate[auther][populate]': 'avatar',
    'populate[category]': '*',
    'populate[content_blocks][populate]': 'deep',
    sort: 'publishedAt:desc',
    'filters[site][site][$eq]': site,
  };

  if (categorySlug) {
    postQuery['filters[category][slug][$eq]'] = categorySlug;
  }

  const postsResp = await fetchFromStrapi<{
    data: any[];
    meta?: { pagination?: { total?: number } };
  }>('/api/posts', postQuery);
  const categoriesResp = await fetchFromStrapi<{
    data: any[];
    meta?: { pagination?: { total?: number } };
  }>(
    '/api/categories',
    {
      'pagination[pageSize]': 100,
      sort: 'name:asc',
    }
  );

  const posts =
    postsResp?.data
      ?.map((entry) =>
        mapStrapiPost({
          entry,
          locale,
          postPrefix,
          categoryPrefix,
          includeContent: false,
        })
      )
      .filter(Boolean) ?? [];

  const categories =
    categoriesResp?.data
      ?.map((item) => mapStrapiCategory(item, categoryPrefix))
      .filter(Boolean) ?? [];

  const postsCount = postsResp?.meta?.pagination?.total ?? posts?.length ?? 0;
  const categoriesCount =
    categoriesResp?.meta?.pagination?.total ?? categories?.length ?? 0;

  return {
    posts: posts as BlogPostType[],
    postsCount,
    categories: categories as BlogCategoryType[],
    categoriesCount,
  };
}

// get single post, both from local file and database
// database post has higher priority
export async function getPost({
  slug,
  locale,
  postPrefix = '/blog/',
}: {
  slug: string;
  locale: string;
  postPrefix?: string;
}): Promise<BlogPostType | null> {
  const localPost = await getLocalPost({ slug, locale, postPrefix });
  if (localPost) return localPost;

  return null;
}

export async function getRelatedPosts({
  slug,
  locale,
  limit = 6,
  postPrefix = '/blog/',
}: {
  slug: string;
  locale: string;
  limit?: number;
  postPrefix?: string;
}): Promise<BlogPostType[]> {
  const pages = postsSource.getPages(locale);
  if (!pages || pages.length === 0) return [];

  const candidates = pages
    .map((page) => {
      const frontmatter = page.data as any;
      const pageSlug = getPostSlug({
        url: page.url,
        locale,
        prefix: postPrefix,
      });
      const rawDate = frontmatter.created_at || frontmatter.publishedAt || '';
      const timestamp = rawDate ? new Date(rawDate).getTime() : NaN;
      const sortDate = Number.isFinite(timestamp) ? timestamp : 0;

      const candidate: BlogPostType & { _sortDate: number } = {
        id: page.path,
        slug: pageSlug,
        title: frontmatter.title || '',
        description: resolveDescription({
          description: frontmatter.description,
          slug: pageSlug,
        }),
        author_name: frontmatter.author_name || '',
        author_image: frontmatter.author_image || '',
        created_at: rawDate
          ? getPostDate({
            created_at: rawDate,
            locale,
          })
          : '',
        image: frontmatter.image || frontmatter.featured_image || '',
        url: `${postPrefix}${pageSlug}`,
        _sortDate: sortDate,
      };
      return candidate;
    })
    .filter((item) => item.slug && item.slug !== slug);

  return candidates
    .sort((a, b) => (b._sortDate || 0) - (a._sortDate || 0))
    .slice(0, limit)
    .map(({ _sortDate, ...rest }) => rest as BlogPostType);
}

export async function getLocalPost({
  slug,
  locale,
  postPrefix = '/blog/',
}: {
  slug: string;
  locale: string;
  postPrefix?: string;
}): Promise<BlogPostType | null> {
  const localPost = await postsSource.getPage([slug], locale);
  if (!localPost) {
    return null;
  }

  const postData = localPost.data as any;
  const MDXContent = postData.body;
  const body = (
    <MDXContent
      components={getMDXComponents({
        // this allows you to link to other pages with relative file paths
        a: createRelativeLink(postsSource, localPost),
      })}
    />
  );

  const frontmatter = localPost.data as any;
  const resolvedDescription = resolveDescription({
    description: postData.description,
    slug,
  });

  const post: BlogPostType = {
    id: localPost.path,
    slug: slug,
    title: postData.title || '',
    description: resolvedDescription,
    content: '',
    body: body,
    toc: postData.toc, // Use fumadocs auto-generated TOC
    created_at: frontmatter.created_at
      ? getPostDate({
        created_at: frontmatter.created_at,
        locale,
      })
      : '',
    created_at_value:
      typeof frontmatter.created_at === 'string' &&
        Number.isFinite(new Date(frontmatter.created_at).getTime())
        ? new Date(frontmatter.created_at).getTime()
        : undefined,
    author_name: frontmatter.author_name || '',
    author_image: frontmatter.author_image || '',
    author_role: '',
    image: frontmatter.image || frontmatter.featured_image || '',
    url: `${postPrefix}${slug}`,
  };

  return post;
}

// get local page from: content/pages/*.md
export async function getLocalPage({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}): Promise<BlogPostType | null> {
  const localPage = await pagesSource.getPage([slug], locale);
  if (!localPage) {
    return null;
  }

  const pageData = localPage.data as any;
  const MDXContent = pageData.body;
  const body = (
    <MDXContent
      components={getMDXComponents({
        // this allows you to link to other pages with relative file paths
        a: createRelativeLink(pagesSource, localPage),
      })}
    />
  );

  const frontmatter = localPage.data as any;

  const post: BlogPostType = {
    id: localPage.path,
    slug: slug,
    title: pageData.title || '',
    description: pageData.description || '',
    content: '',
    body: body,
    toc: pageData.toc, // Use fumadocs auto-generated TOC
    created_at: frontmatter.created_at
      ? getPostDate({
        created_at: frontmatter.created_at,
        locale,
      })
      : '',
    author_name: frontmatter.author_name || '',
    author_image: frontmatter.author_image || '',
    author_role: '',
    url: `/${locale}/${slug}`,
  };

  return post;
}

// get posts and categories, both from local files and database
export async function getPostsAndCategories({
  page = 1,
  limit = 30,
  locale,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
  categorySlug,
}: {
  page?: number;
  limit?: number;
  locale: string;
  postPrefix?: string;
  categoryPrefix?: string;
  categorySlug?: string;
}): Promise<{
  posts: BlogPostType[];
  postsCount: number;
  categories: BlogCategoryType[];
  categoriesCount: number;
}> {
  const { posts: localPosts } = await getLocalPostsAndCategories({
    locale,
    postPrefix,
    categoryPrefix,
  });

  let posts = localPosts;

  if (categorySlug) {
    posts = posts.filter((post) =>
      post.categories?.some((category) => category.slug === categorySlug)
    );
  }

  const postsWithMeta = posts as Array<
    BlogPostType & { created_at_value?: number }
  >;

  const getDateValue = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;

  const sortedPosts = [...postsWithMeta].sort((a, b) => {
    const dateA = getDateValue(a.created_at_value);
    const dateB = getDateValue(b.created_at_value);
    if (dateA !== dateB) return dateB - dateA;
    return (b.slug || '').localeCompare(a.slug || '');
  });

  const currentPage = Math.max(1, page || 1);
  const currentLimit = Math.max(1, limit || 30);
  const start = (currentPage - 1) * currentLimit;
  const paginatedPosts = sortedPosts.slice(start, start + currentLimit);

  const sanitizedPosts = paginatedPosts.map(
    ({ created_at_value, ...rest }) => rest
  );

  return {
    posts: sanitizedPosts,
    postsCount: sortedPosts.length,
    categories: [],
    categoriesCount: 0,
  };
}

export async function getLatestPosts({
  locale,
  limit = 6,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
}: {
  locale: string;
  limit?: number;
  postPrefix?: string;
  categoryPrefix?: string;
}) {
  const { posts } = await getPostsAndCategories({
    locale,
    page: 1,
    limit,
    postPrefix,
    categoryPrefix,
  });

  return posts;
}

// get remote posts and categories
export async function getRemotePostsAndCategories({
  page = 1,
  limit = 30,
  locale,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
  categorySlug,
}: {
  page?: number;
  limit?: number;
  locale: string;
  postPrefix?: string;
  categoryPrefix?: string;
  categorySlug?: string;
}) {
  if (!hasStrapiCredentials) {
    return {
      posts: [],
      postsCount: 0,
      categories: [],
      categoriesCount: 0,
    };
  }

  return getStrapiPostsAndCategories({
    page,
    limit,
    locale,
    postPrefix,
    categoryPrefix,
    categorySlug,
  });
}

// get local posts and categories
export async function getLocalPostsAndCategories({
  locale,
  postPrefix = '/blog/',
  categoryPrefix = '/blog/category/',
}: {
  locale: string;
  postPrefix?: string;
  categoryPrefix?: string;
}) {
  const localPostsList: BlogPostType[] = [];

  // get posts from local files
  const localPosts = postsSource.getPages(locale);

  // no local posts
  if (!localPosts || localPosts.length === 0) {
    return {
      posts: [],
      postsCount: 0,
      categories: [],
      categoriesCount: 0,
    };
  }

  // Build posts data from local content
  localPostsList.push(
    ...localPosts.map((post) => {
      const frontmatter = post.data as any;
      const slug = getPostSlug({
        url: post.url,
        locale,
        prefix: postPrefix,
      });
      const createdAtValueRaw = frontmatter.created_at
        ? new Date(frontmatter.created_at).getTime()
        : 0;
      const createdAtValue = Number.isFinite(createdAtValueRaw)
        ? createdAtValueRaw
        : 0;

      return {
        id: post.path,
        slug: slug,
        title: post.data.title || '',
        description: resolveDescription({
          description: post.data.description,
          slug,
        }),
        author_name: frontmatter.author_name || '',
        author_image: frontmatter.author_image || '',
        created_at: frontmatter.created_at
          ? getPostDate({
            created_at: frontmatter.created_at,
            locale,
          })
          : '',
        created_at_value: createdAtValue,
        image: frontmatter.image || frontmatter.featured_image || '',
        url: `${postPrefix}${slug}`,
      };
    })
  );

  return {
    posts: localPostsList,
    postsCount: localPostsList.length,
    categories: [],
    categoriesCount: 0,
  };
}

// Helper function to replace slug for local posts
export function getPostSlug({
  url,
  locale,
  prefix = '/blog/',
}: {
  url: string; // post url, like: /zh/blog/what-is-xxx
  locale: string; // locale
  prefix?: string; // post slug prefix
}): string {
  if (url.startsWith(prefix)) {
    return url.replace(prefix, '');
  } else if (url.startsWith(`/${locale}${prefix}`)) {
    return url.replace(`/${locale}${prefix}`, '');
  }

  return url;
}

export function getPostDate({
  created_at,
  locale,
}: {
  created_at: string;
  locale?: string;
}) {
  return dayjs(created_at)
    .locale(locale || 'en')
    .format(locale === 'zh' ? 'YYYY/MM/DD' : 'MMM D, YYYY');
}

// Helper function to remove frontmatter from markdown content
export function removePostFrontmatter(content: string): string {
  // Match frontmatter pattern: ---\n...content...\n---
  const frontmatterRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
  return content.replace(frontmatterRegex, '').trim();
}
