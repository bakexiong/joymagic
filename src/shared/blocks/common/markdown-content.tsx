// Server-side Markdown renderer for database posts
import MarkdownIt from 'markdown-it';

import { isNonBrandExternal, mergeRelValues } from '@/shared/lib/url';

function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

// Custom renderer for headings with IDs
md.renderer.rules.heading_open = function (tokens, idx) {
  const token = tokens[idx];
  const level = token.markup.length;
  const nextToken = tokens[idx + 1];

  if (nextToken && nextToken.type === 'inline') {
    const headingText = nextToken.content;
    const id = generateHeadingId(headingText);
    return `<h${level} id="${id}">`;
  }

  return `<h${level}>`;
};

// Custom renderer for links with nofollow
md.renderer.rules.link_open = function (tokens, idx, options, env, renderer) {
  const token = tokens[idx];
  const hrefIndex = token.attrIndex('href');

  if (hrefIndex >= 0) {
    const href = token.attrGet('href');
    const needsNoFollow = isNonBrandExternal(href || undefined);
    const rel = mergeRelValues(token.attrGet('rel') || undefined, needsNoFollow ? 'nofollow' : undefined);

    if (rel) {
      token.attrSet('rel', rel);
    }
    if (needsNoFollow) {
      token.attrSet('target', '_blank');
    }
  }

  return renderer.renderToken(tokens, idx, options);
};

interface MarkdownContentProps {
  content: string;
}

/**
 * Server-side Markdown renderer for database posts
 * This component uses markdown-it which works in all environments including Edge Runtime
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  const html = content ? md.render(content) : '';

  return (
    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
