/**
 * @deprecated Use `@/lib/api-client` instead. This file is kept for backwards
 * compatibility — existing component imports will continue to work.
 */
import { User, BaseModule } from "@/types";
import { Article, ArticleStatus } from "@/modules/content-engine/types/article";

export const mockApi = {
  getModules: async (): Promise<BaseModule[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [
      {
        id: "core",
        name: "Core System",
        description: "Central infrastructure and services",
        status: "active",
      },
      {
        id: "content",
        name: "Content Engine",
        description: "Financial knowledge management",
        status: "active",
      },
      {
        id: "glossary",
        name: "Financial Glossary",
        description: "1M+ terms and definitions",
        status: "active",
      },
      {
        id: "creator",
        name: "Creator Platform",
        description: "Economy for financial experts",
        status: "development",
      },
      {
        id: "seo",
        name: "pSEO Engine",
        description: "Programmatic SEO scaling",
        status: "planned",
      },
    ];
  },

  getArticles: async (): Promise<Article[]> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return [
      {
        id: "1",
        title: "The Future of Decentralized Finance",
        slug: "future-of-defi",
        description:
          "An in-depth look at how DeFi is reshaping global markets.",
        body: "Long content here...",
        category: "Finance",
        tags: ["DeFi", "Finance", "Blockchain"],
        status: "published" as ArticleStatus,
        readingTime: 5,
        featuredImage: "/images/defi-future.jpg",
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: "auth-1",
      },
    ];
  },
};
