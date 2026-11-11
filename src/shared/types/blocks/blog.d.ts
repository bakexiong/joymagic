import { ReactNode } from 'react';

import type { TOCItemType } from '@/core/docs/toc';

export interface Blog {
  id?: string;
  sr_only_title?: string;
  title?: string;
  description?: string;
  categories?: Category[];
  currentCategory?: Category;
  posts: Post[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
  };
  className?: string;
}

export interface Post {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  image?: string;
  content?: string;
  created_at?: string;
  created_at_value?: number;
  author_name?: string;
  author_role?: string;
  author_image?: string;
  url?: string;
  target?: string;
  categories?: Category[];
  body?: ReactNode;
  toc?: TOCItemType[];
}

export interface Category {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  target?: string;
}
