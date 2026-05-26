// Mock data for Baalvion NetStack

export const dashboardStats = {
  totalBandwidth: "2.45 TB",
  usedBandwidth: "1.23 TB",
  successRate: 98.7,
  activeProxies: 15420,
  avgLatency: 42,
  requestsToday: 1284532,
};

export const bandwidthData = [
  { time: "00:00", used: 45, limit: 100 },
  { time: "04:00", used: 32, limit: 100 },
  { time: "08:00", used: 78, limit: 100 },
  { time: "12:00", used: 92, limit: 100 },
  { time: "16:00", used: 85, limit: 100 },
  { time: "20:00", used: 67, limit: 100 },
  { time: "23:59", used: 55, limit: 100 },
];

export const successRateData = [
  { date: "Mon", success: 97.2, error: 2.8 },
  { date: "Tue", success: 98.1, error: 1.9 },
  { date: "Wed", success: 98.7, error: 1.3 },
  { date: "Thu", success: 97.9, error: 2.1 },
  { date: "Fri", success: 99.1, error: 0.9 },
  { date: "Sat", success: 98.4, error: 1.6 },
  { date: "Sun", success: 98.9, error: 1.1 },
];

export const topDomains = [
  { domain: "google.com", requests: 245123, percentage: 19.1 },
  { domain: "instagram.com", requests: 198432, percentage: 15.4 },
  { domain: "youtube.com", requests: 167823, percentage: 13.1 },
  { domain: "amazon.com", requests: 134521, percentage: 10.5 },
  { domain: "twitter.com", requests: 98234, percentage: 7.6 },
];

export const topCountries = [
  { country: "United States", code: "US", requests: 432156, percentage: 33.6 },
  { country: "United Kingdom", code: "GB", requests: 234521, percentage: 18.3 },
  { country: "Germany", code: "DE", requests: 187234, percentage: 14.6 },
  { country: "France", code: "FR", requests: 123456, percentage: 9.6 },
  { country: "Japan", code: "JP", requests: 98765, percentage: 7.7 },
];

export const subUsers = [
  { 
    id: 1, 
    name: "Marketing Team", 
    email: "marketing@company.com", 
    gbLimit: 500, 
    gbUsed: 234, 
    status: "active",
    usageHistory: [
      { date: "Mon", bandwidth: 32 },
      { date: "Tue", bandwidth: 28 },
      { date: "Wed", bandwidth: 45 },
      { date: "Thu", bandwidth: 38 },
      { date: "Fri", bandwidth: 52 },
      { date: "Sat", bandwidth: 22 },
      { date: "Sun", bandwidth: 17 },
    ]
  },
  { 
    id: 2, 
    name: "SEO Agency", 
    email: "seo@agency.com", 
    gbLimit: 1000, 
    gbUsed: 876, 
    status: "active",
    usageHistory: [
      { date: "Mon", bandwidth: 120 },
      { date: "Tue", bandwidth: 135 },
      { date: "Wed", bandwidth: 142 },
      { date: "Thu", bandwidth: 128 },
      { date: "Fri", bandwidth: 155 },
      { date: "Sat", bandwidth: 98 },
      { date: "Sun", bandwidth: 98 },
    ]
  },
  { 
    id: 3, 
    name: "Research Dept", 
    email: "research@company.com", 
    gbLimit: 250, 
    gbUsed: 89, 
    status: "active",
    usageHistory: [
      { date: "Mon", bandwidth: 12 },
      { date: "Tue", bandwidth: 15 },
      { date: "Wed", bandwidth: 18 },
      { date: "Thu", bandwidth: 14 },
      { date: "Fri", bandwidth: 16 },
      { date: "Sat", bandwidth: 8 },
      { date: "Sun", bandwidth: 6 },
    ]
  },
  { 
    id: 4, 
    name: "Data Team", 
    email: "data@company.com", 
    gbLimit: 750, 
    gbUsed: 512, 
    status: "warning",
    usageHistory: [
      { date: "Mon", bandwidth: 68 },
      { date: "Tue", bandwidth: 75 },
      { date: "Wed", bandwidth: 82 },
      { date: "Thu", bandwidth: 78 },
      { date: "Fri", bandwidth: 88 },
      { date: "Sat", bandwidth: 62 },
      { date: "Sun", bandwidth: 59 },
    ]
  },
  { 
    id: 5, 
    name: "External Partner", 
    email: "partner@external.com", 
    gbLimit: 100, 
    gbUsed: 98, 
    status: "critical",
    usageHistory: [
      { date: "Mon", bandwidth: 14 },
      { date: "Tue", bandwidth: 15 },
      { date: "Wed", bandwidth: 16 },
      { date: "Thu", bandwidth: 14 },
      { date: "Fri", bandwidth: 15 },
      { date: "Sat", bandwidth: 12 },
      { date: "Sun", bandwidth: 12 },
    ]
  },
];

export const healthIndicators = [
  { name: "Residential US", latency: 38, successRate: 99.2, status: "healthy" },
  { name: "Residential EU", latency: 45, successRate: 98.7, status: "healthy" },
  { name: "Mobile US", latency: 52, successRate: 97.8, status: "healthy" },
  { name: "Mobile APAC", latency: 78, successRate: 94.2, status: "warning" },
  { name: "Datacenter US", latency: 12, successRate: 99.8, status: "healthy" },
  { name: "Datacenter EU", latency: 15, successRate: 99.5, status: "healthy" },
];

export const proxyList = [
  { id: 1, type: "Residential", country: "US", state: "California", city: "Los Angeles", ip: "192.168.1.***", port: 8080, protocol: "HTTP/HTTPS", status: "active" },
  { id: 2, type: "Residential", country: "US", state: "New York", city: "New York", ip: "192.168.2.***", port: 8080, protocol: "SOCKS5", status: "active" },
  { id: 3, type: "Mobile", country: "US", state: "Texas", city: "Houston", ip: "192.168.3.***", port: 8080, protocol: "HTTP/HTTPS", status: "active" },
  { id: 4, type: "Datacenter", country: "DE", state: "Bavaria", city: "Munich", ip: "192.168.4.***", port: 8080, protocol: "HTTP/HTTPS", status: "active" },
  { id: 5, type: "Residential", country: "GB", state: "England", city: "London", ip: "192.168.5.***", port: 8080, protocol: "SOCKS5", status: "maintenance" },
];

export const presets = [
  { id: 1, name: "YouTube US Desktop", type: "Residential", country: "US", rotation: "Sticky 10min", protocol: "HTTP/HTTPS", icon: "youtube" },
  { id: 2, name: "Instagram Mobile US", type: "Mobile", country: "US", rotation: "Rotating", protocol: "HTTP/HTTPS", icon: "instagram" },
  { id: 3, name: "Scraper Mode", type: "Datacenter", country: "Auto", rotation: "Rotating Fast", protocol: "SOCKS5", icon: "scraper" },
  { id: 4, name: "SEO Audit", type: "Residential", country: "Multi", rotation: "Sticky 30min", protocol: "HTTP/HTTPS", icon: "seo" },
];

export const savedProfiles = [
  { id: 1, name: "SEO Campaign", proxies: 250, lastUsed: "2 hours ago", config: { type: "Residential", rotation: "Sticky" } },
  { id: 2, name: "Social Media Bot", proxies: 100, lastUsed: "1 day ago", config: { type: "Mobile", rotation: "Rotating" } },
  { id: 3, name: "Price Scraping", proxies: 500, lastUsed: "5 hours ago", config: { type: "Datacenter", rotation: "Fast" } },
];

export const invoices = [
  { id: "INV-2024-001", date: "2024-01-15", amount: 299.00, status: "paid", plan: "Enterprise" },
  { id: "INV-2024-002", date: "2024-02-15", amount: 299.00, status: "paid", plan: "Enterprise" },
  { id: "INV-2024-003", date: "2024-03-15", amount: 299.00, status: "pending", plan: "Enterprise" },
];

export const apiEndpoints = [
  { method: "GET", endpoint: "/api/v1/proxies", description: "List all proxies" },
  { method: "POST", endpoint: "/api/v1/proxies/generate", description: "Generate proxy list" },
  { method: "GET", endpoint: "/api/v1/usage", description: "Get usage statistics" },
  { method: "POST", endpoint: "/api/v1/subusers", description: "Create sub-user" },
  { method: "DELETE", endpoint: "/api/v1/subusers/:id", description: "Delete sub-user" },
];

export const pricingPlans = [
  {
    name: "Starter",
    price: 49,
    bandwidth: "50 GB",
    features: ["Residential Proxies", "5 Countries", "HTTP/HTTPS", "Email Support", "Basic Analytics"],
    popular: false,
  },
  {
    name: "Professional",
    price: 149,
    bandwidth: "250 GB",
    features: ["Residential + Mobile", "50+ Countries", "SOCKS5 Support", "Priority Support", "Advanced Analytics", "Sub-users (3)"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 299,
    bandwidth: "1 TB",
    features: ["All Proxy Types", "195 Countries", "Dedicated IPs", "24/7 Support", "Custom Analytics", "Unlimited Sub-users", "API Access"],
    popular: false,
  },
];

export const statusHistory = [
  { date: "2024-03-14", status: "operational", uptime: 100 },
  { date: "2024-03-13", status: "operational", uptime: 100 },
  { date: "2024-03-12", status: "degraded", uptime: 98.5, incident: "Minor latency increase in EU region" },
  { date: "2024-03-11", status: "operational", uptime: 100 },
  { date: "2024-03-10", status: "operational", uptime: 99.9 },
];

export const caseStudies = [
  {
    id: 1,
    title: "E-commerce Price Monitoring",
    company: "Global Retail Corp",
    improvement: "340%",
    metric: "Data Collection Speed",
    description: "Scaled from 10K to 500K daily price checks across 12 countries.",
  },
  {
    id: 2,
    title: "Social Media Analytics",
    company: "Digital Agency Pro",
    improvement: "99.2%",
    metric: "Success Rate",
    description: "Achieved industry-leading success rates for Instagram data collection.",
  },
  {
    id: 3,
    title: "SEO Rank Tracking",
    company: "SEO Masters Inc",
    improvement: "67%",
    metric: "Cost Reduction",
    description: "Reduced infrastructure costs while improving accuracy and speed.",
  },
];

// Analytics data
export const analyticsData = {
  daily: [
    { date: "Dec 1", requests: 145000, bandwidth: 12.5, successRate: 98.7, avgLatency: 42 },
    { date: "Dec 2", requests: 152000, bandwidth: 13.2, successRate: 98.9, avgLatency: 38 },
    { date: "Dec 3", requests: 148000, bandwidth: 12.8, successRate: 98.5, avgLatency: 45 },
    { date: "Dec 4", requests: 167000, bandwidth: 14.1, successRate: 99.1, avgLatency: 40 },
    { date: "Dec 5", requests: 172000, bandwidth: 14.8, successRate: 98.8, avgLatency: 41 },
    { date: "Dec 6", requests: 158000, bandwidth: 13.5, successRate: 98.6, avgLatency: 43 },
    { date: "Dec 7", requests: 143000, bandwidth: 12.1, successRate: 98.4, avgLatency: 46 },
    { date: "Dec 8", requests: 156000, bandwidth: 13.4, successRate: 98.9, avgLatency: 39 },
    { date: "Dec 9", requests: 168000, bandwidth: 14.3, successRate: 99.0, avgLatency: 37 },
    { date: "Dec 10", requests: 175000, bandwidth: 15.0, successRate: 99.2, avgLatency: 36 },
    { date: "Dec 11", requests: 182000, bandwidth: 15.6, successRate: 98.7, avgLatency: 40 },
    { date: "Dec 12", requests: 178000, bandwidth: 15.2, successRate: 98.8, avgLatency: 41 },
    { date: "Dec 13", requests: 165000, bandwidth: 14.0, successRate: 98.5, avgLatency: 44 },
    { date: "Dec 14", requests: 189000, bandwidth: 16.2, successRate: 99.1, avgLatency: 38 },
  ],
  weekly: [
    { date: "Week 46", requests: 1050000, bandwidth: 89.5, successRate: 98.6, avgLatency: 42 },
    { date: "Week 47", requests: 1120000, bandwidth: 95.2, successRate: 98.8, avgLatency: 40 },
    { date: "Week 48", requests: 1180000, bandwidth: 100.4, successRate: 98.9, avgLatency: 39 },
    { date: "Week 49", requests: 1250000, bandwidth: 106.8, successRate: 99.0, avgLatency: 38 },
  ],
  monthly: [
    { date: "Sep", requests: 4200000, bandwidth: 358.0, successRate: 98.2, avgLatency: 45 },
    { date: "Oct", requests: 4580000, bandwidth: 390.5, successRate: 98.5, avgLatency: 43 },
    { date: "Nov", requests: 4920000, bandwidth: 419.2, successRate: 98.7, avgLatency: 41 },
    { date: "Dec", requests: 5100000, bandwidth: 434.8, successRate: 98.9, avgLatency: 40 },
  ],
  byCountry: [
    { country: "United States", percentage: 33.6 },
    { country: "United Kingdom", percentage: 18.3 },
    { country: "Germany", percentage: 14.6 },
    { country: "France", percentage: 9.6 },
    { country: "Japan", percentage: 7.7 },
    { country: "Other", percentage: 16.2 },
  ],
  byProxyType: [
    { type: "Residential", percentage: 45 },
    { type: "Mobile", percentage: 28 },
    { type: "Datacenter", percentage: 27 },
  ],
  errorBreakdown: [
    { type: "Timeout", count: 12000, percentage: 40 },
    { type: "Connection Refused", count: 7500, percentage: 25 },
    { type: "DNS Failure", count: 4500, percentage: 15 },
    { type: "Rate Limited", count: 3600, percentage: 12 },
    { type: "Other", count: 2400, percentage: 8 },
  ],
};

// Admin data
export const adminStats = {
  totalUsers: 2847,
  activeUsers: 1923,
  activeSubscriptions: 2654,
  totalRevenue: 284750,
  monthlyRevenue: 47892,
  openTickets: 23,
  avgResponseTime: "42",
  bandwidthUsed: "45.2 TB",
  totalBandwidth: "45.2 TB",
  uptimePercent: "99.9",
  proxyPoolSize: 15420000,
};

export const adminUsers = [
  { id: 1, name: "John Smith", email: "john@company.com", plan: "Enterprise", status: "active", bandwidth: "1.2 TB", joined: "2024-01-15", lastActive: "2 hours ago", createdAt: "Jan 15, 2024", lastLogin: "2 hours ago" },
  { id: 2, name: "Sarah Johnson", email: "sarah@agency.com", plan: "Professional", status: "active", bandwidth: "456 GB", joined: "2024-02-20", lastActive: "5 minutes ago", createdAt: "Feb 20, 2024", lastLogin: "5 minutes ago" },
  { id: 3, name: "Mike Chen", email: "mike@startup.io", plan: "Starter", status: "active", bandwidth: "89 GB", joined: "2024-03-01", lastActive: "1 day ago", createdAt: "Mar 1, 2024", lastLogin: "1 day ago" },
  { id: 4, name: "Emily Davis", email: "emily@corp.net", plan: "Enterprise", status: "suspended", bandwidth: "2.1 TB", joined: "2023-11-10", lastActive: "1 week ago", createdAt: "Nov 10, 2023", lastLogin: "1 week ago" },
  { id: 5, name: "Alex Wilson", email: "alex@tech.com", plan: "Professional", status: "active", bandwidth: "234 GB", joined: "2024-01-28", lastActive: "3 hours ago", createdAt: "Jan 28, 2024", lastLogin: "3 hours ago" },
];

export const adminPlans = [
  { id: 1, name: "Starter", price: 49, users: 892, activeUsers: 892, revenue: 43708, bandwidth: "50 GB", features: 5 },
  { id: 2, name: "Professional", price: 149, users: 1247, activeUsers: 1247, revenue: 185803, bandwidth: "250 GB", features: 8 },
  { id: 3, name: "Enterprise", price: 299, users: 708, activeUsers: 708, revenue: 211692, bandwidth: "1 TB", features: 12 },
  { id: 4, name: "Custom", price: 0, users: 23, activeUsers: 23, revenue: 89500, bandwidth: "Custom", features: 15 },
];

export const adminTickets = [
  { id: "TKT-001", user: "john@company.com", subject: "Connection timeout issues", priority: "high", status: "open", created: "2 hours ago", createdAt: "2 hours ago", lastUpdate: "30 minutes ago" },
  { id: "TKT-002", user: "sarah@agency.com", subject: "Billing question about overage", priority: "medium", status: "pending", created: "5 hours ago", createdAt: "5 hours ago", lastUpdate: "2 hours ago" },
  { id: "TKT-003", user: "mike@startup.io", subject: "API rate limiting clarification", priority: "low", status: "open", created: "1 day ago", createdAt: "1 day ago", lastUpdate: "6 hours ago" },
  { id: "TKT-004", user: "emily@corp.net", subject: "Account suspension appeal", priority: "high", status: "escalated", created: "3 days ago", createdAt: "3 days ago", lastUpdate: "1 day ago" },
  { id: "TKT-005", user: "alex@tech.com", subject: "Feature request: Custom rotation", priority: "low", status: "closed", created: "1 week ago", createdAt: "1 week ago", lastUpdate: "2 days ago" },
];
