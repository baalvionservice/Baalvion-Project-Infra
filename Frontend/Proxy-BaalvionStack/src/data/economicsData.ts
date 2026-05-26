// Economics & Revenue Mock Data for Founder Control Room

export const mrrData = {
  current: 441203,
  previous: 412850,
  growthRate: 6.87,
  history: [
    { month: "Sep", mrr: 312400 },
    { month: "Oct", mrr: 345200 },
    { month: "Nov", mrr: 378900 },
    { month: "Dec", mrr: 412850 },
    { month: "Jan", mrr: 441203 },
    { month: "Feb", mrr: 468500 },
  ],
};

export const revenueByPlan = [
  { plan: "Starter", revenue: 43708, users: 892, color: "hsl(199, 89%, 48%)" },
  { plan: "Professional", revenue: 185803, users: 1247, color: "hsl(142, 71%, 45%)" },
  { plan: "Enterprise", revenue: 211692, users: 708, color: "hsl(38, 92%, 50%)" },
  { plan: "Custom", revenue: 89500, users: 23, color: "hsl(280, 67%, 55%)" },
];

export const marginData = [
  { month: "Sep", costPerGB: 0.42, revenuePerGB: 1.85, netMargin: 77.3 },
  { month: "Oct", costPerGB: 0.40, revenuePerGB: 1.88, netMargin: 78.7 },
  { month: "Nov", costPerGB: 0.38, revenuePerGB: 1.92, netMargin: 80.2 },
  { month: "Dec", costPerGB: 0.37, revenuePerGB: 1.90, netMargin: 80.5 },
  { month: "Jan", costPerGB: 0.36, revenuePerGB: 1.95, netMargin: 81.5 },
  { month: "Feb", costPerGB: 0.35, revenuePerGB: 1.98, netMargin: 82.3 },
];

export const subscriptionStats = {
  active: 2654,
  trial: 312,
  grace: 45,
  suspended: 23,
  cancelled: 189,
  churnRate: 3.2,
  churnTrend: [
    { month: "Sep", rate: 4.1 },
    { month: "Oct", rate: 3.8 },
    { month: "Nov", rate: 3.5 },
    { month: "Dec", rate: 3.4 },
    { month: "Jan", rate: 3.2 },
    { month: "Feb", rate: 3.0 },
  ],
};

export const highRiskChurnUsers = [
  { id: 1, name: "DataFlow Inc", email: "admin@dataflow.io", plan: "Enterprise", risk: 87, reason: "Usage dropped 60% in 2 weeks", lastActive: "5 days ago" },
  { id: 2, name: "WebScrape Pro", email: "team@webscrape.pro", plan: "Professional", risk: 76, reason: "Failed payment retry x2", lastActive: "3 days ago" },
  { id: 3, name: "InsightHub", email: "ops@insighthub.com", plan: "Enterprise", risk: 72, reason: "Opened cancellation page 3x", lastActive: "1 day ago" },
  { id: 4, name: "PriceWatch Co", email: "dev@pricewatch.co", plan: "Professional", risk: 68, reason: "Downgraded from Enterprise", lastActive: "2 hours ago" },
  { id: 5, name: "MarketPulse", email: "info@marketpulse.ai", plan: "Starter", risk: 65, reason: "Zero API calls in 10 days", lastActive: "10 days ago" },
];

export const upsellTargets = [
  { id: 1, name: "SEO Masters", email: "billing@seomasters.com", plan: "Professional", usagePercent: 94, bandwidthUsed: "235 GB", bandwidthLimit: "250 GB", upsellValue: 150 },
  { id: 2, name: "AdTech Solutions", email: "ops@adtech.io", plan: "Starter", usagePercent: 91, bandwidthUsed: "45.5 GB", bandwidthLimit: "50 GB", upsellValue: 100 },
  { id: 3, name: "RankTracker", email: "admin@ranktracker.com", plan: "Professional", usagePercent: 88, bandwidthUsed: "220 GB", bandwidthLimit: "250 GB", upsellValue: 150 },
  { id: 4, name: "DataHarvest", email: "team@dataharvest.net", plan: "Starter", usagePercent: 86, bandwidthUsed: "43 GB", bandwidthLimit: "50 GB", upsellValue: 100 },
];

export const revenueForecast = [
  { month: "Mar", projected: 495000, optimistic: 520000, pessimistic: 470000 },
  { month: "Apr", projected: 525000, optimistic: 558000, pessimistic: 492000 },
  { month: "May", projected: 558000, optimistic: 598000, pessimistic: 518000 },
];
