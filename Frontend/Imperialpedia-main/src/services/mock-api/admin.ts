import { ApiResponse } from '@/types';
import { 
  AdminArticle, 
  GlossaryTermNode, 
  UserNode, 
  AuthorExpert, 
  RevenueMetric, 
  SEOMetric,
  PlatformDashboardStats 
} from '@/types/admin';

/**
 * @fileOverview Mock API service for all Admin Panel modules.
 */

export const adminService = {
  getStats: async (): Promise<ApiResponse<PlatformDashboardStats>> => {
    await new Promise(r => setTimeout(r, 400));
    return {
      data: {
        totalUsers: 142500,
        articlesPublished: 12480,
        aiGenerated: 4520,
        revenue: "$168,400",
        activeAlerts: 3
      },
      status: 200
    };
  },

  getArticles: async (): Promise<ApiResponse<AdminArticle[]>> => {
    await new Promise(r => setTimeout(r, 500));
    return {
      data: [
        { id: '1', title: "The Fed's Neutral Rate Paradigm", author: "Julian Wealth", category: "Economics", status: "Published", wordCount: 2400, qualityScore: 94 },
        { id: '2', title: "CBDC Adoption in Emerging Markets", author: "Sarah Crypto", category: "Macro", status: "Editor Review", wordCount: 1850, qualityScore: 88 },
        { id: '3', title: "Yield Curve Inversion Audit", author: "Eleanor Vance", category: "Bonds", status: "Compliance", wordCount: 3200, qualityScore: 91 }
      ],
      status: 200
    };
  },

  getGlossary: async (): Promise<ApiResponse<GlossaryTermNode[]>> => {
    await new Promise(r => setTimeout(r, 400));
    return {
      data: [
        { id: 'g1', term: "Quantitative Easing", definition: "A monetary policy whereby a central bank purchases at-scale government bonds.", relatedArticles: 124, searchRanking: 3, status: 'Active' },
        { id: 'g2', term: "Stagflation", definition: "Persistent high inflation combined with high unemployment.", relatedArticles: 42, searchRanking: 8, status: 'Active' }
      ],
      status: 200
    };
  },

  getUsers: async (): Promise<ApiResponse<UserNode[]>> => {
    await new Promise(r => setTimeout(r, 600));
    return {
      data: [
        { id: 'u1', name: "John Doe", email: "john@example.com", role: "Premium Member", status: "Active", subscription: "Pro" },
        { id: 'u2', name: "Jane Expert", email: "jane@imperial.com", role: "Author", status: "Active", subscription: "Enterprise" }
      ],
      status: 200
    };
  },

  getRevenueTrends: async (): Promise<ApiResponse<RevenueMetric[]>> => {
    await new Promise(r => setTimeout(r, 500));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return {
      data: months.map(m => ({
        date: m,
        ads: Math.floor(Math.random() * 50000) + 20000,
        subscriptions: Math.floor(Math.random() * 80000) + 40000,
        affiliate: Math.floor(Math.random() * 20000) + 10000
      })),
      status: 200
    };
  }
};
