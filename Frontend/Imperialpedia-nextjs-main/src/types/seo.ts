/**
 * @fileOverview SEO and metadata related types.
 */

export interface IndexSummary {
  totalPages: number;
  submittedToSitemap: number;
  indexedPages: number;
  nonIndexedPages: number;
  lastSitemapUpdate: string;
}

export type IndexStatus = 'Indexed' | 'Pending' | 'Error';

export interface IndexStatusNode {
  url: string;
  status: IndexStatus;
  lastUpdated: string;
  priority: number;
}

export interface SitemapStatus {
  url: string;
  lastUpdated: string;
  totalUrls: number;
  status: 'Healthy' | 'Error';
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  og?: any;
  twitter?: any;
}

export interface SEOConfig {
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  openGraph: any;
  twitter: any;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface SEOAuditResult {
  slug: string;
  type: string;
  hasCanonical: boolean;
  hasBreadcrumbSchema: boolean;
  hasFAQSchema: boolean;
  hasMetadata: boolean;
  includedInSitemap: boolean;
  issues: string[];
}
