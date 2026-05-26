// Growth Engine Mock Data

export const funnelData = [
  { stage: "Visitors", count: 48500, percentage: 100 },
  { stage: "Signups", count: 4850, percentage: 10 },
  { stage: "Activated", count: 2910, percentage: 6 },
  { stage: "First Proxy", count: 1940, percentage: 4 },
  { stage: "Paid", count: 970, percentage: 2 },
];

export const conversionRates = {
  visitorToSignup: 10.0,
  signupToActivation: 60.0,
  activationToFirstProxy: 66.7,
  firstProxyToPaid: 50.0,
  overallConversion: 2.0,
};

export const affiliateReferrals = [
  { id: 1, name: "ProxyReview.com", referrals: 342, conversions: 89, revenue: 13256, commission: 1988, conversionRate: 26 },
  { id: 2, name: "TechBlogger_Mike", referrals: 218, conversions: 52, revenue: 7748, commission: 1162, conversionRate: 23.9 },
  { id: 3, name: "SEOToolsHub", referrals: 186, conversions: 41, revenue: 6109, commission: 916, conversionRate: 22 },
  { id: 4, name: "DataScraping.io", referrals: 124, conversions: 35, revenue: 5215, commission: 782, conversionRate: 28.2 },
  { id: 5, name: "PrivacyFirst Blog", referrals: 95, conversions: 18, revenue: 2682, commission: 402, conversionRate: 18.9 },
];

export const promoCodePerformance = [
  { code: "WELCOME20", uses: 1245, revenue: 48920, discount: 20, status: "active" },
  { code: "ENTERPRISE50", uses: 89, revenue: 132500, discount: 50, status: "active" },
  { code: "PARTNER15", uses: 342, revenue: 28450, discount: 15, status: "active" },
  { code: "BLACKFRIDAY", uses: 2100, revenue: 98700, discount: 30, status: "expired" },
  { code: "LAUNCH10", uses: 567, revenue: 22680, discount: 10, status: "expired" },
];

export const revenueByChannel = [
  { channel: "Organic", revenue: 198400, percentage: 42 },
  { channel: "Paid Ads", revenue: 142300, percentage: 30 },
  { channel: "Affiliate", revenue: 71200, percentage: 15 },
  { channel: "Direct", revenue: 47500, percentage: 10 },
  { channel: "Social", revenue: 14200, percentage: 3 },
];

export const cacData = {
  current: 45.20,
  trend: [
    { month: "Sep", cac: 62.50 },
    { month: "Oct", cac: 58.30 },
    { month: "Nov", cac: 52.10 },
    { month: "Dec", cac: 48.80 },
    { month: "Jan", cac: 45.20 },
    { month: "Feb", cac: 42.90 },
  ],
};

export const ltvData = {
  current: 892,
  ltvCacRatio: 19.7,
  trend: [
    { month: "Sep", ltv: 720 },
    { month: "Oct", ltv: 765 },
    { month: "Nov", ltv: 810 },
    { month: "Dec", ltv: 848 },
    { month: "Jan", ltv: 892 },
    { month: "Feb", ltv: 935 },
  ],
};
