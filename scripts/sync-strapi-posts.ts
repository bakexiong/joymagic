import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load local env for CLI usage
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const GLOBAL_TIMEOUT_MS =
  Number(process.env.STRAPI_SYNC_TIMEOUT_MS || '') || 60_000;

const STRAPI_API_URL =
  process.env.STRAPI_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  'https://railwayapp-strapi-qzlh-production.up.railway.app';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
const STRAPI_SITE =
  process.env.STRAPI_SITE ||
  process.env.NEXT_PUBLIC_STRAPI_SITE ||
  '10b.ai';

if (!STRAPI_TOKEN) {
  console.log('[sync-strapi-posts] STRAPI_TOKEN is missing, skip sync.');
  process.exit(0);
}

async function fetchWithTimeout(input: string | URL, init: any = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchStrapiPosts() {
  const baseUrl = STRAPI_API_URL.replace(/\/$/, '');
  const attempts: { label: string; params: Record<string, string | number> }[] = [
    {
      label: 'strapi v5 populate content blocks/media + site filter',
      params: {
        'pagination[pageSize]': 100,
        'filters[site][site][$eq]': STRAPI_SITE,
        'populate[content_blocks][populate]': '*',
        'populate[auther][populate]': 'avatar',
        'populate[category]': '*',
        'populate[site]': '*',
        'populate[featured_image][fields][0]': 'url',
      },
    },
    {
      label: 'strapi v5 populate content blocks/media (no site filter)',
      params: {
        'pagination[pageSize]': 100,
        'populate[content_blocks][populate]': '*',
        'populate[auther][populate]': 'avatar',
        'populate[category]': '*',
        'populate[site]': '*',
        'populate[featured_image][fields][0]': 'url',
      },
    },
    {
      label: 'populate=* + site relation',
      params: {
        'pagination[pageSize]': 100,
        populate: '*',
        'filters[site][site][$eq]': STRAPI_SITE,
      },
    },
    {
      label: 'populate=* no filters',
      params: {
        'pagination[pageSize]': 100,
        populate: '*',
      },
    },
    {
      label: 'no populate + site relation',
      params: {
        'pagination[pageSize]': 100,
        'filters[site][site][$eq]': STRAPI_SITE,
      },
    },
    {
      label: 'no populate or filters',
      params: {
        'pagination[pageSize]': 100,
      },
    },
  ];

  for (const attempt of attempts) {
    const url = new URL('/api/posts', baseUrl);
    Object.entries(attempt.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    try {
      const res = await fetchWithTimeout(url.toString(), {
        headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
      });

      if (res.ok) {
        const json = await res.json();
        return json?.data || [];
      }

      const body = await res.text().catch(() => '');
      console.warn(
        `[sync-strapi-posts] ${attempt.label} failed ${res.status} ${res.statusText}${
          body ? ` - ${body}` : ''
        }`
      );
    } catch (err: any) {
      console.warn(`[sync-strapi-posts] ${attempt.label} error: ${err?.message || err}`);
    }
  }

  console.warn('[sync-strapi-posts] All Strapi attempts failed. Skipping sync.');
  return [];
}

function truncateWords(text: string, wordLimit = 150) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length <= wordLimit) return words.join(' ');
  return `${words.slice(0, wordLimit).join(' ')}…`;
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

function escapeCurlyBraces(text: string): string {
  return (text || '')
    .replace(/([{}])/g, '\\$1')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function blocksToMarkdown(blocks: any): string {
  if (!Array.isArray(blocks))
    return typeof blocks === 'string' ? escapeCurlyBraces(blocks) : '';

  const applyInlineFormatting = (text: string, node: any) => {
    let result = text || '';
    if (!result) return result;

    if (!node?.code) {
      result = escapeCurlyBraces(result);
    }

    if (node.code) result = `\`${result}\``;
    if (node.bold) result = `**${result}**`;
    if (node.italic) result = `_${result}_`;
    if (node.strikethrough) result = `~~${result}~~`;
    if (node.underline) result = `<u>${result}</u>`;

    return result;
  };

  const renderInlineNodesToMarkdown = (node: any): string => {
    if (!node) return '';
    if (typeof node === 'string') return escapeCurlyBraces(node);

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
  const toTemplateLiteral = (html: string) =>
    `\`${(html || '').replace(/`/g, '\\`')}\``;
  const renderHtmlTable = (html: string) => {
    // Use template literal to avoid acorn parsing issues on long JSON-stringified HTML
    return `\n<div className="html-table" dangerouslySetInnerHTML={{ __html: ${toTemplateLiteral(html)} }} />\n`;
  };

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const type = block.__component;

    switch (type) {
      case 'rich-text.rich-text': {
        parts.push(blocksToMarkdown(block.richtext || []));
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
          const url = normalizeUrl(attrs?.url);
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
        // fallback: try to stringify
        const text = extractText(block);
        if (text) parts.push(text);
      }
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

function wrapJsonBlocks(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let i = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // track existing fences
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      result.push(line);
      i += 1;
      continue;
    }

    // only attempt wrapping when not already inside a fenced block
    if (!inFence && trimmed === '{') {
      let end = i + 1;
      while (end < lines.length && lines[end].trim() !== '}') {
        end += 1;
      }

      if (end < lines.length && lines[end].trim() === '}') {
        result.push('```json', ...lines.slice(i, end + 1), '```');
        i = end + 1;
        continue;
      }
    }

    result.push(line);
    i += 1;
  }

  return result.join('\n');
}

function isCodeyLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const prefixes = [
    'import ',
    'from ',
    'pip install',
    'pip3 install',
    'pnpm ',
    'npm ',
    'yarn ',
    'bun ',
    'python ',
    'node ',
    'curl ',
    'wget ',
    '#!/bin',
  ];

  if (prefixes.some((p) => trimmed.startsWith(p))) return true;
  if (/^[A-Za-z_][\w.]*\s*=\s*[^=]/.test(trimmed)) return true;
  if (/^\s*def\s+[A-Za-z_]/.test(trimmed)) return true;
  if (/^\s*class\s+[A-Za-z_]/.test(trimmed)) return true;

  return false;
}

function autoFenceCodeBlocks(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];

  let i = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      result.push(line);
      i += 1;
      continue;
    }

    if (!inFence && isCodeyLine(trimmed)) {
      let end = i;
      while (
        end < lines.length &&
        (lines[end].trim() === '' || isCodeyLine(lines[end].trim()))
      ) {
        end += 1;
      }

      // only wrap if we have at least one code-like line
      result.push('```plaintext', ...lines.slice(i, end), '```');
      i = end;
      continue;
    }

    result.push(line);
    i += 1;
  }

  return result.join('\n');
}

function escapeMdxPlaceholders(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inFence = false;
  const placeholderTokens = [
    'image_url',
    'style_code',
    'code',
    'number',
    'seed',
    'image',
    'prompt',
    'value',
  ];
  const placeholderPattern = placeholderTokens.join('|');
  const commandOrPlaceholderRegex = new RegExp(
    `--[a-z0-9_-]+\\s+<(${placeholderPattern})>|<(${placeholderPattern})>`,
    'gi'
  );

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      result.push(line);
      continue;
    }

    if (inFence) {
      result.push(line);
      continue;
    }

    const segments = line.split(/(`[^`]*`)/g);
    const processed = segments
      .map((segment, idx) => {
        const isInlineCode = idx % 2 === 1 && segment.startsWith('`');
        if (isInlineCode) return segment;

        let next = segment.replace(commandOrPlaceholderRegex, (match) => `\`${match}\``);
        next = next.replace(/--style raw/g, '`--style raw`');
        return next;
      })
      .join('');

    result.push(processed);
  }

  return result.join('\n');
}

function fixMdxJsxExpressions(markdown: string): string {
  // Fix JSX expressions that might cause parsing errors
  // Common issue: dangerouslySetInnerHTML with complex HTML content
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inFence = false;
  const toTemplateLiteral = (html: string) =>
    `\`${(html || '').replace(/`/g, '\\`')}\``;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      result.push(line);
      continue;
    }

    if (inFence) {
      result.push(line);
      continue;
    }

    let fixedLine = line;
    
    // Fix JSX expressions with dangerouslySetInnerHTML
    // Ensure the HTML content is properly JSON-stringified
    if (line.includes('dangerouslySetInnerHTML')) {
      // Match the pattern: dangerouslySetInnerHTML={{ __html: ... }}
      fixedLine = fixedLine.replace(
        /dangerouslySetInnerHTML=\{\{\s*__html:\s*([^}]+?)\s*\}\}/g,
        (_match, content) => {
          // Normalize to plain string, then emit a template literal
          let raw = content.trim();
          try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'string') raw = parsed;
          } catch {
            // ignore parse errors and use the raw string
          }
          return `dangerouslySetInnerHTML={{ __html: ${toTemplateLiteral(raw)} }}`;
        }
      );
    }

    // Fix JSX expressions that might have parsing issues
    // Look for patterns like {expression} followed by unexpected content
    // This handles cases where there's content after a closing brace
    fixedLine = fixedLine.replace(/\{([^}]*)\}\s*([^\s\/<>])/g, (match, expr, after) => {
      // If there's content after }, check if it's valid
      // Valid cases: />, <tag>, whitespace
      // Invalid: any other character
      if (after && !['/', '<', '>', '\n', '\r'].includes(after)) {
        // Add a newline to separate
        return `{${expr}}\n${after}`;
      }
      return match;
    });

    result.push(fixedLine);
  }

  return result.join('\n');
}

function sanitizeMdx(markdown: string): string {
  const withJsonWrapped = wrapJsonBlocks(markdown);
  const withFences = autoFenceCodeBlocks(withJsonWrapped);
  return escapeMdxPlaceholders(withFences);
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
        if (text) parts.push(escapeCurlyBraces(text));
      }
    }
  }

  return parts.join(' ');
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${STRAPI_API_URL.replace(/\/$/, '')}${url}`;
}

function getMediaUrl(media: any): string | undefined {
  if (!media) return undefined;
  if (Array.isArray(media)) {
    for (const item of media) {
      const url = getMediaUrl(item);
      if (url) return url;
    }
    return undefined;
  }

  const url =
    media?.data?.attributes?.url ||
    media?.data?.url ||
    media?.attributes?.url ||
    media?.url;

  return normalizeUrl(url);
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
    // ignore parse errors
  }
  return null;
}

async function main() {
  const globalTimer = setTimeout(() => {
    console.warn(
      `[sync-strapi-posts] Timed out after ${GLOBAL_TIMEOUT_MS}ms, skipping sync.`
    );
    process.exit(0);
  }, GLOBAL_TIMEOUT_MS);

  const posts = await fetchStrapiPosts();
  clearTimeout(globalTimer);
  if (!posts || posts.length === 0) {
    console.log('[sync-strapi-posts] No posts synced. Existing local content kept.');
    return;
  }
  const contentDir = path.resolve('content/posts');
  fs.mkdirSync(contentDir, { recursive: true });

  for (const entry of posts) {
    const attrs = entry?.attributes || entry;
    const slug = attrs.slug || entry?.id;
    if (!slug) {
      console.log('[sync-strapi-posts] Skip entry without slug:', entry?.id);
      continue;
    }

    const body = sanitizeMdx(contentBlocksToMarkdown(attrs.content_blocks || []));
    const createdAt = attrs.publishedAt || attrs.createdAt || '';
    const author = attrs.auther?.data?.attributes || attrs.auther;
    const frontmatter: Record<string, any> = {
      title: attrs.title || slug,
      description: truncateWords(
        typeof attrs.description === 'string'
          ? attrs.description
          : extractText(attrs.description || '') ||
              contentBlocksToText(attrs.content_blocks || [])
      ),
      created_at: createdAt,
      author_name: author?.name || '',
      author_image: getMediaUrl(author?.avatar),
      image: getMediaUrl(attrs.featured_image),
      slug,
      source: 'strapi',
    };

    const fm =
      '---\n' +
      Object.entries(frontmatter)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join('\n') +
      '\n---\n\n';

    const filePath = path.join(contentDir, `${slug}.mdx`);
    fs.writeFileSync(filePath, `${fm}${body}\n`, 'utf-8');
    console.log(`[sync-strapi-posts] wrote ${filePath}`);
  }
}

main().catch((err) => {
  console.error('[sync-strapi-posts] failed:', err);
  process.exit(1);
});
