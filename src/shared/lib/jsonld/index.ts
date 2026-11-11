/**
 * JSON-LD Schema Generators
 * Generates structured data for SEO
 */

import { envConfigs } from "@/config";
import { getSiteLogoUrl } from "@/shared/lib/site-logo";
import type {
  OrganizationSchema,
  WebSiteSchema,
  ArticleSchema,
  SoftwareApplicationSchema,
  ProductSchema,
  BreadcrumbListSchema,
  BreadcrumbItem,
  FAQPageSchema,
  HowToSchema,
  HowToStep,
  CollectionPageSchema,
  ItemListSchema,
  Offer,
  AggregateOffer,
  OrganizationReference,
} from "./types";

// Re-export types
export * from "./types";

// Constants
const BASE_URL = envConfigs.app_url;
const APP_NAME = envConfigs.app_name || "joymagic";
const LOGO_URL = getSiteLogoUrl(512, 512);

/**
 * Get publisher reference for articles
 */
function getPublisher(): OrganizationReference {
  return {
    "@type": "Organization",
    name: APP_NAME,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: 512,
      height: 512,
    },
  };
}

/**
 * Get canonical URL with locale prefix
 */
export function getCanonicalUrl(path: string, locale?: string): string {
  const defaultLocale = "en";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!locale || locale === defaultLocale) {
    return `${BASE_URL}${cleanPath}`;
  }
  return `${BASE_URL}/${locale}${cleanPath}`;
}

/**
 * Generate Organization Schema
 */
export function generateOrganizationSchema(options?: {
  sameAs?: string[];
}): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: BASE_URL,
    logo: LOGO_URL,
    description: "AI-powered image and video generation platform",
    sameAs: options?.sameAs || [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: [
        "English",
        "Chinese",
        "Japanese",
        "Korean",
        "German",
        "Spanish",
      ],
    },
  };
}

/**
 * Generate WebSite Schema
 */
export function generateWebSiteSchema(options?: {
  locale?: string;
  enableSearch?: boolean;
}): WebSiteSchema {
  const schema: WebSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: BASE_URL,
    description: "Create stunning AI-generated images and videos",
    inLanguage: options?.locale || "en",
    publisher: getPublisher(),
  };

  if (options?.enableSearch !== false) {
    schema.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    };
  }

  return schema;
}

/**
 * Generate Article/BlogPosting Schema
 */
export function generateArticleSchema(options: {
  title: string;
  description: string;
  image: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  keywords?: string[];
  section?: string;
  wordCount?: number;
  locale?: string;
}): ArticleSchema {
  // Ensure image URL is absolute
  const imageUrl = options.image.startsWith("http")
    ? options.image
    : `${BASE_URL}${options.image.startsWith("/") ? "" : "/"}${options.image}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: options.title,
    description: options.description,
    image: imageUrl,
    author: {
      "@type": "Person",
      name: options.author || "joymagic Team",
      url: BASE_URL,
    },
    publisher: getPublisher(),
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": options.url,
    },
    keywords: options.keywords,
    articleSection: options.section,
    wordCount: options.wordCount,
    inLanguage: options.locale || "en",
  };
}

/**
 * Generate SoftwareApplication Schema
 */
export function generateSoftwareApplicationSchema(options: {
  name: string;
  description: string;
  url?: string;
  locale?: string;
  category?: string;
  features?: string[];
  screenshot?: string | string[];
  offers?: Offer | AggregateOffer;
  rating?: {
    value: number;
    count: number;
  };
}): SoftwareApplicationSchema {
  const schema: SoftwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: options.name,
    description: options.description,
    url: options.url ? getCanonicalUrl(options.url, options.locale) : undefined,
    applicationCategory: options.category || "MultimediaApplication",
    operatingSystem: "Web Browser",
    author: getPublisher(),
  };

  if (options.features) {
    schema.featureList = options.features;
  }

  if (options.screenshot) {
    schema.screenshot = options.screenshot;
  }

  if (options.offers) {
    schema.offers = options.offers;
  } else {
    // Default free tier offer
    schema.offers = {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available",
    };
  }

  if (options.rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: options.rating.value,
      ratingCount: options.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Generate Product Schema with Offers
 */
export function generateProductSchema(options: {
  name: string;
  description: string;
  offers: Array<{
    name: string;
    description: string;
    price: number;
    priceCurrency?: string;
  }>;
  image?: string;
}): ProductSchema {
  const offers: Offer[] = options.offers.map((offer) => ({
    "@type": "Offer",
    name: offer.name,
    description: offer.description,
    price: offer.price.toString(),
    priceCurrency: offer.priceCurrency || "USD",
    availability: "https://schema.org/InStock",
    url: `${BASE_URL}/pricing`,
  }));

  const prices = options.offers.map((o) => o.price);
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: options.name,
    description: options.description,
    brand: {
      "@type": "Brand",
      name: APP_NAME,
    },
    image: options.image || LOGO_URL,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: lowPrice.toString(),
      highPrice: highPrice.toString(),
      offerCount: offers.length,
      offers,
    },
  };
}

/**
 * Generate BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(
  items: BreadcrumbItem[],
  locale?: string,
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : getCanonicalUrl(item.url, locale),
    })),
  };
}

/**
 * Generate FAQPage Schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate HowTo Schema
 */
export function generateHowToSchema(options: {
  name: string;
  description: string;
  steps: Array<{
    name: string;
    text: string;
    image?: string;
  }>;
  image?: string;
  totalTime?: string;
}): HowToSchema {
  const steps: HowToStep[] = options.steps.map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.name,
    text: step.text,
    image: step.image,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: options.name,
    description: options.description,
    image: options.image,
    totalTime: options.totalTime,
    step: steps,
  };
}

/**
 * Generate CollectionPage Schema (for blog listing)
 */
export function generateCollectionPageSchema(options: {
  name: string;
  description: string;
  url: string;
  locale?: string;
}): CollectionPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: options.url,
    isPartOf: {
      "@type": "WebSite",
      name: APP_NAME,
      url: BASE_URL,
    },
    about: {
      "@type": "Thing",
      name: "AI Image and Video Generation",
    },
    inLanguage: options.locale || "en",
  };
}

/**
 * Generate ItemList Schema for curated tool or scenario paths
 */
export function generateItemListSchema(options: {
  name: string;
  description?: string;
  url?: string;
  locale?: string;
  items: Array<{
    name: string;
    description?: string;
    url: string;
  }>;
}): ItemListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: options.name,
    description: options.description,
    url: options.url,
    inLanguage: options.locale || "en",
    itemListElement: options.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      description: item.description,
      url: item.url.startsWith("http")
        ? item.url
        : getCanonicalUrl(item.url, options.locale),
    })),
  };
}
