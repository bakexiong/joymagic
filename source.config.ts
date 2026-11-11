import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { remarkImage } from 'fumadocs-core/mdx-plugins';
import { z } from 'zod';

import { remarkLiteralMdxExpressions } from './src/shared/lib/remark/remark-literal-mdx-expressions';
import { remarkSupportEmail } from './src/shared/lib/remark/remark-support-email';

// 博客文章的自定义frontmatter schema，包含image等字段
const postsFrontmatterSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  full: z.boolean().optional(),
  // 自定义字段
  image: z.string().optional(),
  featured_image: z.string().optional(),
  created_at: z.string().optional(),
  author_name: z.string().optional(),
  author_image: z.string().optional(),
  slug: z.string().optional(),
  source: z.string().optional(),
});

export const docs = defineDocs({
  dir: 'content/docs',
});

export const pages = defineDocs({
  dir: 'content/pages',
});

export const posts = defineDocs({
  dir: 'content/posts',
  docs: {
    schema: postsFrontmatterSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkLiteralMdxExpressions,
      remarkSupportEmail,
      [
        remarkImage,
        {
          external: false, // skip remote fetch/size lookup to avoid build-time failures when offline
          onError: 'ignore',
        },
      ],
    ],
    // Shiki 代码高亮已移除，代码块将显示为纯文本
    // 如需代码高亮，可以重新添加 rehypeCodeOptions 配置
  },
});
