"use client";

import { ApiResponse } from "@/types/api.types";

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  lastModified: string;
  category: "news" | "press-release" | "earnings" | "announcement";
  status: "published" | "draft";
  priority: number;
}

export interface InvestorDocument {
  id: string;
  title: string;
  slug: string;
  type: "annual-report" | "quarterly-report" | "presentation" | "filing";
  publishedAt: string;
  lastModified: string;
  year: number;
  quarter?: number;
  status: "published" | "draft";
}

// Mock data - replace with actual API calls
const MOCK_NEWS: NewsArticle[] = [
  {
    id: "news-001",
    title: "Q4 2025 Earnings Report Released",
    slug: "q4-2025-earnings-report",
    excerpt:
      "Baalvion Industries reports strong Q4 performance with 15% revenue growth.",
    publishedAt: "2026-01-15T09:00:00Z",
    lastModified: "2026-01-15T09:00:00Z",
    category: "earnings",
    status: "published",
    priority: 0.9,
  },
  {
    id: "news-002",
    title: "Strategic Partnership with Global Trade Leaders",
    slug: "strategic-partnership-announcement",
    excerpt: "New partnership expands our reach in emerging markets.",
    publishedAt: "2026-02-01T10:00:00Z",
    lastModified: "2026-02-01T10:00:00Z",
    category: "announcement",
    status: "published",
    priority: 0.8,
  },
  {
    id: "press-001",
    title: "Expansion into Asian Markets",
    slug: "expansion-into-asian-markets",
    excerpt: "Baalvion announces major expansion into Southeast Asian markets.",
    publishedAt: "2026-02-10T08:00:00Z",
    lastModified: "2026-02-10T08:00:00Z",
    category: "press-release",
    status: "published",
    priority: 0.8,
  },
  {
    id: "press-002",
    title: "Sustainability Initiative Launch",
    slug: "sustainability-initiative-launch",
    excerpt: "New ESG framework positions company for sustainable growth.",
    publishedAt: "2026-01-20T11:00:00Z",
    lastModified: "2026-01-20T11:00:00Z",
    category: "press-release",
    status: "published",
    priority: 0.7,
  },
];

const MOCK_DOCUMENTS: InvestorDocument[] = [
  {
    id: "doc-001",
    title: "2025 Annual Report",
    slug: "2025-annual-report",
    type: "annual-report",
    publishedAt: "2026-01-31T00:00:00Z",
    lastModified: "2026-01-31T00:00:00Z",
    year: 2025,
    status: "published",
  },
  {
    id: "doc-002",
    title: "Q4 2025 Quarterly Report",
    slug: "q4-2025-quarterly-report",
    type: "quarterly-report",
    publishedAt: "2026-01-15T00:00:00Z",
    lastModified: "2026-01-15T00:00:00Z",
    year: 2025,
    quarter: 4,
    status: "published",
  },
  {
    id: "doc-003",
    title: "Q4 2025 Earnings Call Presentation",
    slug: "q4-2025-earnings-call-presentation",
    type: "presentation",
    publishedAt: "2026-01-16T00:00:00Z",
    lastModified: "2026-01-16T00:00:00Z",
    year: 2025,
    quarter: 4,
    status: "published",
  },
];

export const contentService = {
  /**
   * Get all published news articles
   */
  getNewsArticles: async (): Promise<ApiResponse<NewsArticle[]>> => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const publishedNews = MOCK_NEWS.filter(
      (article) => article.status === "published"
    );

    return {
      meta: {
        timestamp: Date.now(),
        requestId: Math.random().toString(36).substr(2, 9),
        environment: process.env.NODE_ENV || "development",
      },
      success: true,
      data: publishedNews.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    };
  },

  /**
   * Get news articles by category
   */
  getNewsByCategory: async (
    category: NewsArticle["category"]
  ): Promise<ApiResponse<NewsArticle[]>> => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const filteredNews = MOCK_NEWS.filter(
      (article) =>
        article.status === "published" && article.category === category
    );

    return {
      meta: {
        timestamp: Date.now(),
        requestId: Math.random().toString(36).substr(2, 9),
        environment: process.env.NODE_ENV || "development",
      },
      success: true,
      data: filteredNews.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    };
  },

  /**
   * Get all published investor documents
   */
  getInvestorDocuments: async (): Promise<ApiResponse<InvestorDocument[]>> => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const publishedDocs = MOCK_DOCUMENTS.filter(
      (doc) => doc.status === "published"
    );

    return {
      meta: {
        timestamp: Date.now(),
        requestId: Math.random().toString(36).substr(2, 9),
        environment: process.env.NODE_ENV || "development",
      },
      success: true,
      data: publishedDocs.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    };
  },

  /**
   * Get documents by type
   */
  getDocumentsByType: async (
    type: InvestorDocument["type"]
  ): Promise<ApiResponse<InvestorDocument[]>> => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const filteredDocs = MOCK_DOCUMENTS.filter(
      (doc) => doc.status === "published" && doc.type === type
    );

    return {
      meta: {
        timestamp: Date.now(),
        requestId: Math.random().toString(36).substr(2, 9),
        environment: process.env.NODE_ENV || "development",
      },
      success: true,
      data: filteredDocs.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    };
  },

  /**
   * Get all content for sitemap generation
   */
  getAllContentForSitemap: async (): Promise<{
    news: NewsArticle[];
    documents: InvestorDocument[];
  }> => {
    const [newsResponse, docsResponse] = await Promise.all([
      contentService.getNewsArticles(),
      contentService.getInvestorDocuments(),
    ]);

    return {
      news: newsResponse.success ? newsResponse.data || [] : [],
      documents: docsResponse.success ? docsResponse.data || [] : [],
    };
  },
};
