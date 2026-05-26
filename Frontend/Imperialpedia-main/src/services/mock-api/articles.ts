import { PaginatedResponse, ApiResponse } from "@/types";
import {
  Article,
  SubmittedArticle,
  ArticleStatus,
} from "@/modules/content-engine/types/article";

/**
 * @fileOverview Mock service for managing article data.
 * @deprecated Use `articleApi` from `@/lib/api-client` instead.
 * This file is kept for backwards compatibility with existing imports.
 */

const mockArticles: Article[] = [
  {
    id: "art-1",
    slug: "understanding-yield-curve-inversion",
    title: "Understanding Yield Curve Inversion",
    description:
      "A deep dive into what the yield curve tells us about future recessions.",
    body: "The yield curve is a graphical representation of interest rates on debt for a range of maturities. It is often used as a benchmark for other debt in the market, such as mortgage rates or bank lending rates...",
    category: "Economics",
    authorId: "creator-1",
    tags: ["macro", "interest-rates", "recession"],
    featuredImage: "https://picsum.photos/seed/yield/800/600",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "published" as ArticleStatus,
    readingTime: 8,
  },
  {
    id: "art-2",
    slug: "the-power-of-compound-interest",
    title: "The Power of Compound Interest",
    description:
      "Why starting early is the most important factor in wealth building.",
    body: "Compound interest is the interest on a loan or deposit calculated based on both the initial principal and the accumulated interest from previous periods...",
    category: "Investing",
    authorId: "creator-2",
    tags: ["wealth-building", "basics", "savings"],
    featuredImage: "https://picsum.photos/seed/compound/800/600",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "published" as ArticleStatus,
    readingTime: 5,
  },
  {
    id: "art-sub-1",
    slug: "future-of-central-banking",
    title: "The Future of Central Banking in a Digital Age",
    description:
      "How CBDCs and algorithmic policy are changing the role of the Fed.",
    body: "As we move further into the 21st century, the foundational principles of central banking are being challenged by the rise of decentralized finance and digital currencies...",
    category: "Economics",
    authorId: "creator-1",
    tags: ["macro", "crypto", "banking"],
    featuredImage: "https://picsum.photos/seed/banking/800/600",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "review" as ArticleStatus,
    readingTime: 12,
  },
];

const mockSubmittedArticles: SubmittedArticle[] = [
  {
    ...mockArticles[2],
    comments: [
      {
        id: "c1",
        userId: "editor-1",
        message: "Please clarify the section on liquidity injection.",
        createdAt: "2024-03-10T10:00:00Z",
      },
    ],
    submittedAt: "2024-03-09T15:00:00Z",
  },
];

export const getArticles = async (
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Article>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockArticles,
    success: true,
    message: "Articles retrieved successfully",
    statusCode: 200,
    timestamp: "2024-03-09T15:00:00Z",
    pagination: {
      currentPage: page,
      totalPages: 1,
      pageSize: limit,
      totalItems: mockArticles.length,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

export const getArticleBySlug = async (
  slug: string
): Promise<ApiResponse<Article | null>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const article = mockArticles.find((a) => a.slug === slug) || null;

  if (article) {
    return {
      data: article,
      success: true,
      statusCode: 200,
      message: "Article retrieved successfully",
      timestamp: new Date().toISOString(),
    };
  } else {
    return {
      data: null,
      success: false,
      statusCode: 404,
      message: "Article not found",
      timestamp: new Date().toISOString(),
      path: `/api/articles/${slug}`,
    };
  }
};

export const getFeaturedArticles = async (): Promise<
  ApiResponse<Article[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // For now, return the first article as featured since we don't have meta.isFeatured
  const featured = mockArticles.slice(0, 1);
  return {
    data: featured,
    success: true,
    statusCode: 200,
    message: "Featured articles retrieved successfully",
    timestamp: new Date().toISOString(),
  };
};

export const getWriterDrafts = async (writerId: string): Promise<Article[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockArticles.filter(
    (a) => a.authorId === writerId && a.status === "draft"
  );
};

export const getSubmittedArticles = async (): Promise<SubmittedArticle[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockSubmittedArticles;
};

export const getSubmittedArticleById = async (
  id: string
): Promise<SubmittedArticle | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockSubmittedArticles.find((a) => a.id === id) || null;
};
