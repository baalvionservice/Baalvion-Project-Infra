
/**
 * @fileOverview Institutional Analytics Registry
 * Centralized store for Maison KPIs and multi-market metrics.
 */

export const analytics = {
  sales: [
    { country: "USA", value: 1200000, trend: 12, code: 'us' },
    { country: "UK", value: 900000, trend: 8, code: 'uk' },
    { country: "UAE", value: 700000, trend: 15, code: 'ae' },
    { country: "India", value: 450000, trend: 22, code: 'in' },
    { country: "Singapore", value: 300000, trend: 5, code: 'sg' }
  ],
  leads: [
    { country: "USA", total: 45, highTier: 12, code: 'us' },
    { country: "UK", total: 32, highTier: 8, code: 'uk' },
    { country: "UAE", total: 25, highTier: 10, code: 'ae' },
    { country: "India", total: 18, highTier: 4, code: 'in' },
    { country: "Singapore", total: 12, highTier: 3, code: 'sg' }
  ],
  aiPerformance: [
    { month: 'Jan', score: 78 },
    { month: 'Feb', score: 82 },
    { month: 'Mar', score: 87 },
    { month: 'Apr', score: 92 },
    { month: 'May', score: 95 }
  ],
  regionalAiPerformance: [
    { country: "USA", score: 87, code: 'us' },
    { country: "UK", score: 92, code: 'uk' },
    { country: "UAE", score: 85, code: 'ae' },
    { country: "India", score: 80, code: 'in' },
    { country: "Singapore", score: 78, code: 'sg' }
  ],
  contentEngagement: [
    { topic: "Heritage Silk", views: 3400, resonance: 92 },
    { topic: "Grand Complications", views: 2900, resonance: 88 },
    { topic: "Bespoke UAE", views: 2100, resonance: 95 },
    { topic: "Mumbai Ateliers", views: 1600, resonance: 84 },
    { topic: "Singapore Gems", views: 900, resonance: 78 }
  ],
  revenueTrends: [
    { date: '2024-03-01', us: 45000, ae: 32000, uk: 21000 },
    { date: '2024-03-08', us: 52000, ae: 38000, uk: 25000 },
    { date: '2024-03-15', us: 68000, ae: 45000, uk: 31000 },
    { date: '2024-03-22', us: 72000, ae: 55000, uk: 38000 },
  ]
};

/**
 * Institutional Analytics Retriever
 * Filters global Maison metrics based on role and geographic jurisdiction.
 */
export function getAnalytics(role: string, country?: string, filters?: any) {
  let data = { ...analytics };

  // Super Admin bypasses geographic isolation
  if (role !== "super_admin" && country && country !== 'GLOBAL') {
    const target = country.toLowerCase();
    data = {
      sales: analytics.sales.filter(i => i.code === target),
      leads: analytics.leads.filter(i => i.code === target),
      regionalAiPerformance: analytics.regionalAiPerformance.filter(i => i.code === target),
      contentEngagement: analytics.contentEngagement, // Content is globally visible but filterable
      aiPerformance: analytics.aiPerformance,
      revenueTrends: analytics.revenueTrends
    };
  }

  console.log(`[INSTITUTIONAL ANALYTICS] Scope: ${role} | Market: ${country || "GLOBAL"}`);
  return data;
}
