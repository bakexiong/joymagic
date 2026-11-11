# JSON-LD 结构化数据实现规范

## 项目概述

**项目**: 10b.ai
**目标**: 为核心页面添加 Schema.org JSON-LD 结构化数据，提升 SEO 和搜索引擎富媒体展示
**优先级**: 高
**影响范围**: 首页、工具页面、价格页面、博客页面

---

## 现状分析

### 已实现
- Open Graph 元数据
- Twitter Card 元数据
- Canonical URL
- hreflang 国际化链接
- 部分页面的 BreadcrumbList 和 FAQPage（wan-2-6）

### 待实现
- Organization Schema
- WebSite Schema
- SoftwareApplication Schema
- Article/BlogPosting Schema
- Product + PriceSpecification Schema
- HowTo Schema
- 完整的 BreadcrumbList 覆盖

---

## 实现计划

### 阶段 1: 基础架构

#### 1.1 创建 JSON-LD 工具库

**文件位置**: `src/shared/lib/jsonld.ts`

```typescript
// JSON-LD 类型定义和生成器函数

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  contactPoint?: ContactPoint;
}

export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  potentialAction?: SearchAction;
}

export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article" | "BlogPosting";
  headline: string;
  description: string;
  image: string;
  author: Person | Organization;
  publisher: Organization;
  datePublished: string;
  dateModified?: string;
  mainEntityOfPage: string;
}

export interface SoftwareApplicationSchema {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: Offer;
}

export interface ProductSchema {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  offers: AggregateOffer | Offer[];
}

// 生成器函数
export function generateOrganizationSchema(): OrganizationSchema;
export function generateWebSiteSchema(): WebSiteSchema;
export function generateArticleSchema(post: Post): ArticleSchema;
export function generateSoftwareApplicationSchema(tool: Tool): SoftwareApplicationSchema;
export function generateProductSchema(product: PricingPlan): ProductSchema;
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): BreadcrumbListSchema;
export function generateFAQSchema(faqs: FAQ[]): FAQPageSchema;
export function generateHowToSchema(steps: Step[]): HowToSchema;
```

#### 1.2 创建 JSON-LD 组件

**文件位置**: `src/shared/components/jsonld.tsx`

```typescript
// React 组件用于注入 JSON-LD

interface JsonLdProps {
  data: object | object[];
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdArray = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLdArray.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
```

---

### 阶段 2: 首页 JSON-LD

**目标页面**: `src/app/[locale]/(landing)/page.tsx`

#### 2.1 Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "10b.ai",
  "url": "https://10b.ai",
  "logo": "https://10b.ai/logo.png",
  "description": "AI-powered image and video generation platform",
  "sameAs": [
    "https://twitter.com/zimageai",
    "https://github.com/zimageai"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["English", "Chinese", "Japanese", "Korean"]
  }
}
```

#### 2.2 WebSite Schema with SearchAction

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "10b.ai",
  "url": "https://10b.ai",
  "description": "Create stunning AI-generated images and videos",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://10b.ai/blog?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

#### 2.3 实现位置

在首页 layout 或 page 中注入：

```typescript
// src/app/[locale]/(landing)/page.tsx
import { JsonLd } from '@/shared/components/jsonld';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/shared/lib/jsonld';

export default function HomePage() {
  return (
    <>
      <JsonLd data={[
        generateOrganizationSchema(),
        generateWebSiteSchema()
      ]} />
      {/* 页面内容 */}
    </>
  );
}
```

---

### 阶段 3: 工具页面 JSON-LD

**目标页面**: 所有 AI 工具页面

#### 3.1 SoftwareApplication Schema

适用于每个 AI 工具页面：

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "10b.ai AI Image Generator",
  "description": "Generate stunning AI images from text prompts using advanced machine learning models",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free tier available"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1500"
  },
  "featureList": [
    "Text to Image Generation",
    "Multiple AI Models",
    "High Resolution Output",
    "Fast Generation Speed"
  ]
}
```

#### 3.2 BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://10b.ai"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "AI Image Generator",
      "item": "https://10b.ai/ai-image-generator"
    }
  ]
}
```

#### 3.3 HowTo Schema

适用于工具使用说明：

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Generate AI Images with 10b.ai",
  "description": "Step-by-step guide to create AI-generated images",
  "image": "https://10b.ai/images/how-to-guide.png",
  "totalTime": "PT2M",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Enter your prompt",
      "text": "Describe the image you want to create in the text box",
      "image": "https://10b.ai/images/step1.png"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Select AI model",
      "text": "Choose from available AI models like FLUX, Stable Diffusion",
      "image": "https://10b.ai/images/step2.png"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Generate image",
      "text": "Click the Generate button and wait for your image",
      "image": "https://10b.ai/images/step3.png"
    }
  ]
}
```

#### 3.4 工具页面清单

| 页面路径 | Schema 类型 |
|---------|------------|
| `/ai-image-generator` | SoftwareApplication, HowTo, BreadcrumbList |
| `/ai-video-generator` | SoftwareApplication, HowTo, BreadcrumbList |
| `/ai-audio-generator` | SoftwareApplication, HowTo, BreadcrumbList |
| `/ai-music-generator` | SoftwareApplication, HowTo, BreadcrumbList |
| `/ai-chatbot` | SoftwareApplication, BreadcrumbList |
| `/image-to-image` | SoftwareApplication, HowTo, BreadcrumbList |
| `/image-eraser` | SoftwareApplication, HowTo, BreadcrumbList |
| `/image-background-remover` | SoftwareApplication, HowTo, BreadcrumbList |
| `/image-upscaler` | SoftwareApplication, HowTo, BreadcrumbList |
| `/video-face-swap` | SoftwareApplication, HowTo, BreadcrumbList |
| `/wan-2-6` | SoftwareApplication, HowTo, BreadcrumbList, FAQPage |
| `/text-to-video/wan-2-6` | SoftwareApplication, HowTo, BreadcrumbList, FAQPage |

---

### 阶段 4: 价格页面 JSON-LD

**目标页面**: `src/app/[locale]/(landing)/pricing/page.tsx`

#### 4.1 Product with AggregateOffer Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "10b.ai AI Credits",
  "description": "AI image and video generation credits for 10b.ai platform",
  "brand": {
    "@type": "Brand",
    "name": "10b.ai"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "5",
    "highPrice": "99.9",
    "offerCount": "3",
    "offers": [
      {
        "@type": "Offer",
        "name": "Starter",
        "description": "500 credits for beginners",
        "price": "5",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "url": "https://10b.ai/pricing"
      },
      {
        "@type": "Offer",
        "name": "Professional",
        "description": "4,200 credits with 40% bonus",
        "price": "29.9",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "url": "https://10b.ai/pricing"
      },
      {
        "@type": "Offer",
        "name": "Titan",
        "description": "15,000 credits with 50% bonus",
        "price": "99.9",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "url": "https://10b.ai/pricing"
      }
    ]
  }
}
```

#### 4.2 FAQPage Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What payment methods do you accept?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We accept credit cards (Visa, MasterCard, American Express), PayPal, and cryptocurrency."
      }
    },
    {
      "@type": "Question",
      "name": "Do credits expire?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Credits do not expire as long as your account remains active."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get a refund?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we offer refunds within 7 days of purchase for unused credits."
      }
    }
  ]
}
```

#### 4.3 BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://10b.ai"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Pricing",
      "item": "https://10b.ai/pricing"
    }
  ]
}
```

---

### 阶段 5: 博客页面 JSON-LD

#### 5.1 博客列表页 (`/blog`)

**目标页面**: `src/app/[locale]/(landing)/blog/page.tsx`

##### CollectionPage Schema

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "10b.ai Blog",
  "description": "AI image generation tutorials, tips, and news",
  "url": "https://10b.ai/blog",
  "isPartOf": {
    "@type": "WebSite",
    "name": "10b.ai",
    "url": "https://10b.ai"
  },
  "about": {
    "@type": "Thing",
    "name": "AI Image Generation"
  }
}
```

##### BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://10b.ai"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://10b.ai/blog"
    }
  ]
}
```

#### 5.2 博客文章页 (`/blog/[slug]`)

**目标页面**: `src/app/[locale]/(landing)/blog/[slug]/page.tsx`

##### Article/BlogPosting Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "50 Best Flux 1.1 Portrait Prompts (Copy & Paste)",
  "description": "Discover the best prompts for creating stunning AI portraits with Flux 1.1",
  "image": "https://10b.ai/images/blog/flux-portrait-prompts.jpg",
  "author": {
    "@type": "Person",
    "name": "10b.ai Team",
    "url": "https://10b.ai"
  },
  "publisher": {
    "@type": "Organization",
    "name": "10b.ai",
    "logo": {
      "@type": "ImageObject",
      "url": "https://10b.ai/logo.png"
    }
  },
  "datePublished": "2024-12-20T10:00:00+00:00",
  "dateModified": "2024-12-25T15:30:00+00:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://10b.ai/blog/flux-portrait-prompts"
  },
  "keywords": ["Flux 1.1", "AI portraits", "prompts", "image generation"],
  "articleSection": "Tutorials",
  "wordCount": 2500,
  "inLanguage": "en"
}
```

##### BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://10b.ai"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://10b.ai/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "50 Best Flux 1.1 Portrait Prompts",
      "item": "https://10b.ai/blog/flux-portrait-prompts"
    }
  ]
}
```

---

## 实现架构

### 文件结构

```
src/
├── shared/
│   ├── lib/
│   │   ├── seo.ts              # 现有 SEO 元数据
│   │   └── jsonld/             # 新增 JSON-LD 模块
│   │       ├── index.ts        # 导出入口
│   │       ├── types.ts        # 类型定义
│   │       ├── organization.ts # Organization schema
│   │       ├── website.ts      # WebSite schema
│   │       ├── article.ts      # Article/BlogPosting schema
│   │       ├── software.ts     # SoftwareApplication schema
│   │       ├── product.ts      # Product/Offer schema
│   │       ├── breadcrumb.ts   # BreadcrumbList schema
│   │       ├── faq.ts          # FAQPage schema
│   │       └── howto.ts        # HowTo schema
│   └── components/
│       └── jsonld.tsx          # JSON-LD 注入组件
```

### 国际化支持

JSON-LD 需要支持多语言：

```typescript
// 根据 locale 生成对应语言的 schema
function generateArticleSchema(post: Post, locale: string): ArticleSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    inLanguage: locale,
    // ...其他字段
  };
}
```

### URL 处理

确保所有 URL 使用正确的国际化前缀：

```typescript
function getCanonicalUrl(path: string, locale: string): string {
  const baseUrl = 'https://10b.ai';
  if (locale === 'en') {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${locale}${path}`;
}
```

---

## 验证和测试

### 1. Google Rich Results Test

使用 Google 官方工具验证：
- https://search.google.com/test/rich-results

### 2. Schema.org Validator

使用 Schema.org 验证器：
- https://validator.schema.org/

### 3. 测试检查清单

- [ ] Organization schema 在首页正确显示
- [ ] WebSite schema 包含正确的 SearchAction
- [ ] 所有博客文章包含 Article schema
- [ ] 定价页面包含 Product 和 Offer schema
- [ ] 所有工具页面包含 SoftwareApplication schema
- [ ] BreadcrumbList 在所有页面正确生成
- [ ] FAQPage schema 格式正确
- [ ] HowTo schema 步骤完整
- [ ] 多语言页面的 inLanguage 字段正确
- [ ] 所有 URL 使用 HTTPS
- [ ] 图片 URL 指向有效资源

---

## 实施优先级

### P0 - 立即实施（核心）

1. **创建 JSON-LD 工具库** (`src/shared/lib/jsonld/`)
2. **创建 JsonLd 组件** (`src/shared/components/jsonld.tsx`)
3. **首页 Organization + WebSite Schema**
4. **博客文章 Article Schema**

### P1 - 重要（第二周）

5. **价格页面 Product + Offer Schema**
6. **工具页面 SoftwareApplication Schema**
7. **所有页面 BreadcrumbList Schema**

### P2 - 增强（第三周）

8. **工具页面 HowTo Schema**
9. **FAQ 页面扩展到更多页面**
10. **博客列表 CollectionPage Schema**

---

## 预期收益

### SEO 改善

- 搜索结果富媒体展示（Rich Snippets）
- 提升点击率（CTR）
- 改善搜索引擎理解
- 增强品牌展示

### 具体富媒体类型

| Schema 类型 | 富媒体展示 |
|------------|-----------|
| Organization | 知识面板、Logo 展示 |
| Article | 文章预览、作者信息 |
| Product + Offer | 价格展示、可用性 |
| FAQPage | FAQ 折叠展示 |
| HowTo | 步骤列表展示 |
| BreadcrumbList | 面包屑导航 |
| SoftwareApplication | 应用信息展示 |

---

## 注意事项

1. **数据准确性**: 确保 schema 中的信息与页面实际内容一致
2. **URL 一致性**: 所有 URL 必须与 canonical URL 保持一致
3. **图片要求**: 使用高质量图片，建议尺寸至少 1200x630
4. **日期格式**: 使用 ISO 8601 格式 (YYYY-MM-DDTHH:MM:SS+00:00)
5. **避免重复**: 同一页面不要重复相同类型的 schema
6. **动态生成**: 对于动态内容（如博客文章），使用服务端渲染生成 schema

---

## 附录

### A. 完整类型定义

详见 `src/shared/lib/jsonld/types.ts`

### B. 示例实现代码

详见各页面的实现文件

### C. 参考资源

- [Schema.org 官方文档](https://schema.org/)
- [Google 结构化数据指南](https://developers.google.com/search/docs/appearance/structured-data)
- [JSON-LD 规范](https://json-ld.org/)
