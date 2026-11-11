/**
 * JSON-LD Schema Types
 * Based on Schema.org specifications
 */

// Base types
export interface Thing {
  "@type": string;
  name?: string;
  description?: string;
  url?: string;
  image?: string | ImageObject;
}

export interface ImageObject {
  "@type": "ImageObject";
  url: string;
  width?: number;
  height?: number;
}

export interface Person {
  "@type": "Person";
  name: string;
  url?: string;
  image?: string;
}

export interface ContactPoint {
  "@type": "ContactPoint";
  contactType: string;
  availableLanguage?: string[];
  email?: string;
  telephone?: string;
}

// Organization Schema
export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string | ImageObject;
  description?: string;
  sameAs?: string[];
  contactPoint?: ContactPoint;
  foundingDate?: string;
}

// WebSite Schema
export interface SearchAction {
  "@type": "SearchAction";
  target: {
    "@type": "EntryPoint";
    urlTemplate: string;
  };
  "query-input": string;
}

export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  potentialAction?: SearchAction;
  inLanguage?: string;
  publisher?: OrganizationReference;
}

export interface OrganizationReference {
  "@type": "Organization";
  name: string;
  logo?: ImageObject;
}

// Article Schema
export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article" | "BlogPosting";
  headline: string;
  description: string;
  image: string | string[];
  author: Person | OrganizationReference;
  publisher: OrganizationReference;
  datePublished: string;
  dateModified?: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
  inLanguage?: string;
}

// SoftwareApplication Schema
export interface Offer {
  "@type": "Offer";
  name?: string;
  description?: string;
  price: string | number;
  priceCurrency: string;
  priceValidUntil?: string;
  availability?: string;
  url?: string;
}

export interface AggregateOffer {
  "@type": "AggregateOffer";
  priceCurrency: string;
  lowPrice: string | number;
  highPrice: string | number;
  offerCount: number;
  offers: Offer[];
}

export interface AggregateRating {
  "@type": "AggregateRating";
  ratingValue: string | number;
  ratingCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface SoftwareApplicationSchema {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication" | "WebApplication";
  name: string;
  description: string;
  url?: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: Offer | AggregateOffer;
  aggregateRating?: AggregateRating;
  featureList?: string[];
  screenshot?: string | string[];
  softwareVersion?: string;
  author?: OrganizationReference;
}

// Product Schema
export interface ProductSchema {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  brand?: {
    "@type": "Brand";
    name: string;
  };
  offers: Offer | AggregateOffer;
  image?: string | string[];
  sku?: string;
  aggregateRating?: AggregateRating;
}

// BreadcrumbList Schema
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ListItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: ListItem[];
}

// FAQPage Schema
export interface Question {
  "@type": "Question";
  name: string;
  acceptedAnswer: {
    "@type": "Answer";
    text: string;
  };
}

export interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Question[];
}

// HowTo Schema
export interface HowToStep {
  "@type": "HowToStep";
  position: number;
  name: string;
  text: string;
  image?: string;
  url?: string;
}

export interface HowToSchema {
  "@context": "https://schema.org";
  "@type": "HowTo";
  name: string;
  description: string;
  image?: string;
  totalTime?: string; // ISO 8601 duration format (e.g., PT2M for 2 minutes)
  step: HowToStep[];
  tool?: string[];
  supply?: string[];
}

// CollectionPage Schema
export interface CollectionPageSchema {
  "@context": "https://schema.org";
  "@type": "CollectionPage";
  name: string;
  description: string;
  url: string;
  isPartOf?: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
  about?: {
    "@type": "Thing";
    name: string;
  };
  inLanguage?: string;
}

// ItemList Schema
export interface ItemListElement {
  "@type": "ListItem";
  position: number;
  name: string;
  description?: string;
  url: string;
}

export interface ItemListSchema {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  description?: string;
  url?: string;
  inLanguage?: string;
  itemListElement: ItemListElement[];
}

// Union type for all schemas
export type JsonLdSchema =
  | OrganizationSchema
  | WebSiteSchema
  | ArticleSchema
  | SoftwareApplicationSchema
  | ProductSchema
  | BreadcrumbListSchema
  | FAQPageSchema
  | HowToSchema
  | CollectionPageSchema
  | ItemListSchema;
