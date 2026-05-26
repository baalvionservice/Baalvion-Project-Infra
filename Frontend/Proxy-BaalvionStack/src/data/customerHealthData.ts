// Customer Health & Retention Mock Data

export interface CustomerHealth {
  id: number;
  name: string;
  email: string;
  plan: string;
  healthScore: number;
  engagementScore: number;
  apiCallsLast30d: number;
  lastActive: string;
  churnProbability: number;
  status: "healthy" | "at-risk" | "critical";
  csNotes: string;
  inactiveDays: number;
}

export const customerHealthData: CustomerHealth[] = [
  { id: 1, name: "Baalvion Corp", email: "admin@baalvion.com", plan: "Enterprise", healthScore: 95, engagementScore: 92, apiCallsLast30d: 2450000, lastActive: "2 hours ago", churnProbability: 3, status: "healthy", csNotes: "Key account. Regular feature requests. Expanding to APAC.", inactiveDays: 0 },
  { id: 2, name: "SEO Masters Inc", email: "ops@seomasters.com", plan: "Professional", healthScore: 82, engagementScore: 78, apiCallsLast30d: 890000, lastActive: "1 day ago", churnProbability: 12, status: "healthy", csNotes: "Considering upgrade to Enterprise. Demo scheduled.", inactiveDays: 1 },
  { id: 3, name: "DataFlow Analytics", email: "admin@dataflow.io", plan: "Enterprise", healthScore: 45, engagementScore: 32, apiCallsLast30d: 120000, lastActive: "5 days ago", churnProbability: 68, status: "critical", csNotes: "Usage dropping. Competitor evaluation in progress. Urgent call needed.", inactiveDays: 5 },
  { id: 4, name: "WebScrape Pro", email: "team@webscrape.pro", plan: "Professional", healthScore: 58, engagementScore: 45, apiCallsLast30d: 340000, lastActive: "3 days ago", churnProbability: 42, status: "at-risk", csNotes: "Payment failed twice. Reached out via email.", inactiveDays: 3 },
  { id: 5, name: "PriceWatch Co", email: "dev@pricewatch.co", plan: "Professional", healthScore: 71, engagementScore: 65, apiCallsLast30d: 560000, lastActive: "12 hours ago", churnProbability: 22, status: "healthy", csNotes: "Recently downgraded from Enterprise. Monitor closely.", inactiveDays: 0 },
  { id: 6, name: "MarketPulse AI", email: "info@marketpulse.ai", plan: "Starter", healthScore: 25, engagementScore: 10, apiCallsLast30d: 5200, lastActive: "15 days ago", churnProbability: 89, status: "critical", csNotes: "No engagement. Trial user never converted properly.", inactiveDays: 15 },
  { id: 7, name: "AdTech Solutions", email: "ops@adtech.io", plan: "Starter", healthScore: 88, engagementScore: 85, apiCallsLast30d: 425000, lastActive: "30 min ago", churnProbability: 5, status: "healthy", csNotes: "Upsell candidate. Hitting bandwidth limits frequently.", inactiveDays: 0 },
  { id: 8, name: "RankTracker Pro", email: "admin@ranktracker.com", plan: "Professional", healthScore: 62, engagementScore: 55, apiCallsLast30d: 280000, lastActive: "2 days ago", churnProbability: 35, status: "at-risk", csNotes: "Complaints about latency in EU region. Engineering investigating.", inactiveDays: 2 },
];
