export type ContentStatus = 'draft' | 'published' | 'archived' | 'scheduled';
export type ContentType = 'page' | 'post' | 'article';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  postCount: number;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  postCount: number;
}

export interface SeoMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'image' | 'video' | 'code' | 'quote' | 'divider' | 'html';
  content: Record<string, unknown>;
  order: number;
}

export interface CmsPage {
  id: number;
  title: string;
  slug: string;
  status: ContentStatus;
  content: ContentBlock[];
  seo: SeoMeta;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface CmsPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  status: ContentStatus;
  content: ContentBlock[];
  featuredImage?: string;
  categories: Category[];
  tags: Tag[];
  seo: SeoMeta;
  publishedAt: string | null;
  scheduledAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface CreatePagePayload {
  title: string;
  slug: string;
  status?: ContentStatus;
  content?: ContentBlock[];
  seo?: SeoMeta;
  scheduledAt?: string | null;
}

export interface CreatePostPayload extends CreatePagePayload {
  excerpt?: string;
  featuredImage?: string;
  categoryIds?: number[];
  tagIds?: number[];
}
