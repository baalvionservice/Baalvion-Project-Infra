import type { SeoMeta } from './cms.types';

export type ContentItemType =
  | 'page'
  | 'post'
  | 'article'
  | 'product'
  | 'event'
  | 'job_listing'
  | 'portfolio_item'
  | 'news'
  | 'doc';

export type ContentWorkflowStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'compliance_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'video'
  | 'gallery'
  | 'code'
  | 'quote'
  | 'divider'
  | 'html'
  | 'callout'
  | 'table'
  | 'embed'
  | 'button'
  | 'columns';

export interface ContentBlock {
  id: string;
  type: BlockType;
  order: number;
  content: Record<string, unknown>;
}

export interface BlockRegistryItem {
  type: BlockType;
  label: string;
  icon: string;
  group: 'text' | 'media' | 'layout' | 'embed';
  defaultContent: Record<string, unknown>;
}

export const BLOCK_REGISTRY: BlockRegistryItem[] = [
  { type: 'paragraph', label: 'Paragraph', icon: 'AlignLeft', group: 'text', defaultContent: { text: '' } },
  { type: 'heading', label: 'Heading', icon: 'Heading', group: 'text', defaultContent: { text: '', level: 2 } },
  { type: 'quote', label: 'Quote', icon: 'Quote', group: 'text', defaultContent: { text: '', cite: '' } },
  { type: 'code', label: 'Code', icon: 'Code2', group: 'text', defaultContent: { code: '', language: 'javascript' } },
  { type: 'callout', label: 'Callout', icon: 'Info', group: 'text', defaultContent: { text: '', variant: 'info' } },
  { type: 'divider', label: 'Divider', icon: 'Minus', group: 'layout', defaultContent: {} },
  { type: 'columns', label: 'Columns', icon: 'Columns', group: 'layout', defaultContent: { columns: [[], []] } },
  { type: 'table', label: 'Table', icon: 'Table', group: 'layout', defaultContent: { headers: ['Column 1', 'Column 2'], rows: [['', '']] } },
  { type: 'image', label: 'Image', icon: 'Image', group: 'media', defaultContent: { src: '', alt: '', caption: '' } },
  { type: 'gallery', label: 'Gallery', icon: 'LayoutGrid', group: 'media', defaultContent: { images: [] } },
  { type: 'video', label: 'Video', icon: 'Video', group: 'media', defaultContent: { src: '', type: 'url' } },
  { type: 'html', label: 'HTML', icon: 'Code', group: 'embed', defaultContent: { html: '' } },
  { type: 'embed', label: 'Embed', icon: 'Globe', group: 'embed', defaultContent: { url: '' } },
  { type: 'button', label: 'Button', icon: 'MousePointer', group: 'embed', defaultContent: { text: 'Click me', href: '', variant: 'default' } },
];

export interface ContentAuthor {
  id: number;
  fullName: string;
  avatarUrl: string | null;
}

export interface ContentItem {
  id: string;
  websiteId: string;
  type: ContentItemType;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  status: ContentWorkflowStatus;
  blocks: ContentBlock[];
  seo: SeoMeta;
  categoryIds: string[];
  tagIds: string[];
  author: ContentAuthor;
  lastEditedBy?: ContentAuthor;
  publishedAt: string | null;
  scheduledAt: string | null;
  viewCount: number;
  revisionCount: number;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRevision {
  id: string;
  contentId: string;
  version: number;
  title: string;
  blocks: ContentBlock[];
  editedBy: ContentAuthor;
  changeNote?: string;
  createdAt: string;
}

export interface CreateContentPayload {
  websiteId: string;
  type: ContentItemType;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  blocks?: ContentBlock[];
  seo?: SeoMeta;
  categoryIds?: string[];
  tagIds?: string[];
  scheduledAt?: string | null;
  customFields?: Record<string, unknown>;
}

export interface UpdateContentPayload {
  title?: string;
  slug?: string;
  excerpt?: string;
  featuredImage?: string;
  blocks?: ContentBlock[];
  seo?: SeoMeta;
  categoryIds?: string[];
  tagIds?: string[];
  scheduledAt?: string | null;
  customFields?: Record<string, unknown>;
  changeNote?: string;
}

export type ContentSortField = 'title' | 'status' | 'updatedAt' | 'publishedAt' | 'viewCount';

export interface ContentListParams {
  websiteId: string;
  page?: number;
  limit?: number;
  type?: ContentItemType;
  status?: ContentWorkflowStatus;
  categoryId?: string;
  tagId?: string;
  search?: string;
  sortBy?: ContentSortField;
  sortDir?: 'asc' | 'desc';
}
