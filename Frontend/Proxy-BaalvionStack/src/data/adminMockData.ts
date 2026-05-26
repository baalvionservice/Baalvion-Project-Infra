import { 
  Provider, 
  CountryAlert, 
  IPPoolHealth, 
  IncidentDetail,
  EnhancedPreset,
  EnhancedUser,
  EnhancedPlan,
  Supplier,
  AbuseLog,
  RateLimitConfig,
  SystemService
} from "@/types/admin";

// Providers Mock Data
export const providers: Provider[] = [
  {
    id: "prov-1",
    name: "NetGuard Networks",
    status: "healthy",
    avgLatency: 42,
    successRate: 99.2,
    supportedCountries: ["US", "GB", "DE", "FR", "JP", "AU", "CA", "NL", "IT", "ES"],
    lastCheck: "2 min ago",
    latencyTrend: [
      { time: "00:00", latency: 45 },
      { time: "04:00", latency: 42 },
      { time: "08:00", latency: 48 },
      { time: "12:00", latency: 38 },
      { time: "16:00", latency: 44 },
      { time: "20:00", latency: 41 },
    ],
    successTrend: [
      { time: "00:00", rate: 99.1 },
      { time: "04:00", rate: 99.3 },
      { time: "08:00", rate: 99.0 },
      { time: "12:00", rate: 99.4 },
      { time: "16:00", rate: 99.2 },
      { time: "20:00", rate: 99.3 },
    ],
    recentIncidents: [],
  },
  {
    id: "prov-2",
    name: "ProxyPrime Global",
    status: "healthy",
    avgLatency: 38,
    successRate: 98.7,
    supportedCountries: ["US", "GB", "DE", "FR", "BR", "MX", "IN"],
    lastCheck: "1 min ago",
    latencyTrend: [
      { time: "00:00", latency: 40 },
      { time: "04:00", latency: 38 },
      { time: "08:00", latency: 42 },
      { time: "12:00", latency: 35 },
      { time: "16:00", latency: 39 },
      { time: "20:00", latency: 37 },
    ],
    successTrend: [
      { time: "00:00", rate: 98.5 },
      { time: "04:00", rate: 98.9 },
      { time: "08:00", rate: 98.6 },
      { time: "12:00", rate: 98.8 },
      { time: "16:00", rate: 98.7 },
      { time: "20:00", rate: 98.9 },
    ],
    recentIncidents: [],
  },
  {
    id: "prov-3",
    name: "DataCenter Express",
    status: "degraded",
    avgLatency: 78,
    successRate: 94.5,
    supportedCountries: ["US", "DE", "NL", "SG"],
    lastCheck: "30 sec ago",
    latencyTrend: [
      { time: "00:00", latency: 55 },
      { time: "04:00", latency: 58 },
      { time: "08:00", latency: 72 },
      { time: "12:00", latency: 85 },
      { time: "16:00", latency: 92 },
      { time: "20:00", latency: 78 },
    ],
    successTrend: [
      { time: "00:00", rate: 97.2 },
      { time: "04:00", rate: 96.8 },
      { time: "08:00", rate: 95.5 },
      { time: "12:00", rate: 94.2 },
      { time: "16:00", rate: 93.8 },
      { time: "20:00", rate: 94.5 },
    ],
    recentIncidents: [
      {
        id: "inc-1",
        type: "Latency Spike",
        severity: "medium",
        startTime: "2024-03-14 14:30",
        description: "Elevated latency observed in EU region",
        affectedCountries: ["DE", "NL"],
      },
    ],
  },
  {
    id: "prov-4",
    name: "MobileNet Solutions",
    status: "healthy",
    avgLatency: 65,
    successRate: 97.8,
    supportedCountries: ["US", "GB", "DE", "FR", "JP", "KR"],
    lastCheck: "45 sec ago",
    latencyTrend: [
      { time: "00:00", latency: 68 },
      { time: "04:00", latency: 62 },
      { time: "08:00", latency: 70 },
      { time: "12:00", latency: 64 },
      { time: "16:00", latency: 66 },
      { time: "20:00", latency: 63 },
    ],
    successTrend: [
      { time: "00:00", rate: 97.5 },
      { time: "04:00", rate: 97.9 },
      { time: "08:00", rate: 97.6 },
      { time: "12:00", rate: 98.0 },
      { time: "16:00", rate: 97.8 },
      { time: "20:00", rate: 97.9 },
    ],
    recentIncidents: [],
  },
  {
    id: "prov-5",
    name: "ResidentialHub",
    status: "down",
    avgLatency: 0,
    successRate: 0,
    supportedCountries: ["US", "CA", "MX"],
    lastCheck: "5 min ago",
    latencyTrend: [
      { time: "00:00", latency: 45 },
      { time: "04:00", latency: 48 },
      { time: "08:00", latency: 52 },
      { time: "12:00", latency: 0 },
      { time: "16:00", latency: 0 },
      { time: "20:00", latency: 0 },
    ],
    successTrend: [
      { time: "00:00", rate: 98.5 },
      { time: "04:00", rate: 98.2 },
      { time: "08:00", rate: 85.0 },
      { time: "12:00", rate: 0 },
      { time: "16:00", rate: 0 },
      { time: "20:00", rate: 0 },
    ],
    recentIncidents: [
      {
        id: "inc-2",
        type: "Complete Outage",
        severity: "high",
        startTime: "2024-03-14 11:45",
        description: "Provider experiencing full service outage",
        affectedCountries: ["US", "CA", "MX"],
      },
    ],
  },
];

// Country Alerts Mock Data
export const countryAlerts: CountryAlert[] = [
  {
    id: "alert-1",
    country: "Germany",
    countryCode: "DE",
    issueType: "latency_spike",
    severity: "medium",
    timestamp: "10 min ago",
    status: "active",
    message: "Latency increased by 45% in Frankfurt region",
  },
  {
    id: "alert-2",
    country: "Japan",
    countryCode: "JP",
    issueType: "block_rate",
    severity: "high",
    timestamp: "25 min ago",
    status: "active",
    message: "Block rate elevated to 8.5% for residential IPs",
  },
  {
    id: "alert-3",
    country: "United States",
    countryCode: "US",
    issueType: "provider_outage",
    severity: "high",
    timestamp: "1 hour ago",
    status: "active",
    message: "ResidentialHub provider down affecting US coverage",
  },
  {
    id: "alert-4",
    country: "Brazil",
    countryCode: "BR",
    issueType: "latency_spike",
    severity: "low",
    timestamp: "2 hours ago",
    status: "resolved",
    message: "Minor latency fluctuation detected",
  },
  {
    id: "alert-5",
    country: "United Kingdom",
    countryCode: "GB",
    issueType: "block_rate",
    severity: "medium",
    timestamp: "3 hours ago",
    status: "resolved",
    message: "Increased blocks on social media endpoints",
  },
];

// IP Pool Health Mock Data
export const ipPoolHealth: IPPoolHealth[] = [
  {
    type: "Residential",
    avgLatency: 42,
    successRate: 98.7,
    errorRate: 1.3,
    status: "healthy",
    totalIPs: 8500000,
    activeIPs: 7200000,
  },
  {
    type: "Mobile",
    avgLatency: 68,
    successRate: 97.2,
    errorRate: 2.8,
    status: "degraded",
    totalIPs: 2100000,
    activeIPs: 1850000,
  },
  {
    type: "Datacenter",
    avgLatency: 15,
    successRate: 99.5,
    errorRate: 0.5,
    status: "healthy",
    totalIPs: 4820000,
    activeIPs: 4750000,
  },
];

// Incident Details Mock Data
export const incidentDetails: IncidentDetail[] = [
  {
    id: "inc-detail-1",
    title: "Minor latency increase in EU region",
    summary: "Users experienced elevated response times when connecting through European endpoints. The issue was traced to network congestion at a major peering point.",
    affectedProxyTypes: ["Residential", "Datacenter"],
    affectedCountries: ["Germany", "Netherlands", "France"],
    startTime: "2024-03-12 14:30 UTC",
    endTime: "2024-03-12 16:45 UTC",
    duration: "2h 15m",
    status: "resolved",
    resolutionNotes: "Traffic rerouted through alternative peering points. Monitoring shows normal latency levels restored.",
    updates: [
      { time: "14:30", message: "Investigating elevated latency reports from EU users" },
      { time: "14:45", message: "Issue identified as network congestion at DE-CIX" },
      { time: "15:30", message: "Implementing traffic rerouting" },
      { time: "16:45", message: "Issue resolved, monitoring" },
    ],
  },
  {
    id: "inc-detail-2",
    title: "Provider maintenance window",
    summary: "Scheduled maintenance on MobileNet Solutions infrastructure affecting mobile proxy availability in APAC region.",
    affectedProxyTypes: ["Mobile"],
    affectedCountries: ["Japan", "South Korea", "Singapore"],
    startTime: "2024-03-10 02:00 UTC",
    endTime: "2024-03-10 04:00 UTC",
    duration: "2h 00m",
    status: "resolved",
    resolutionNotes: "Planned maintenance completed successfully. All systems operational.",
    updates: [
      { time: "02:00", message: "Maintenance window started as scheduled" },
      { time: "03:30", message: "Core updates complete, running verification" },
      { time: "04:00", message: "Maintenance completed, all systems nominal" },
    ],
  },
];

// Enhanced Presets Mock Data
export const enhancedPresets: EnhancedPreset[] = [
  { id: 1, name: "YouTube US Desktop", type: "Residential", country: "US", rotation: "Sticky 10min", protocol: "HTTP/HTTPS", icon: "youtube", sessionDuration: 10 },
  { id: 2, name: "Instagram Mobile US", type: "Mobile", country: "US", rotation: "Rotating", protocol: "HTTP/HTTPS", icon: "instagram" },
  { id: 3, name: "Scraper Mode", type: "Datacenter", country: "Auto", rotation: "Rotating Fast", protocol: "SOCKS5", icon: "scraper" },
  { id: 4, name: "SEO Audit", type: "Residential", country: "Multi", rotation: "Sticky 30min", protocol: "HTTP/HTTPS", icon: "seo", sessionDuration: 30 },
];

// Enhanced Users Mock Data  
export const enhancedUsers: EnhancedUser[] = [
  { id: 1, name: "John Smith", email: "john@company.com", plan: "Enterprise", status: "active", bandwidth: "1.2 TB", createdAt: "Jan 15, 2024", lastLogin: "2 hours ago", usagePercent: 65, expiryDate: "2025-01-15" },
  { id: 2, name: "Sarah Johnson", email: "sarah@agency.com", plan: "Professional", status: "active", bandwidth: "456 GB", createdAt: "Feb 20, 2024", lastLogin: "5 minutes ago", usagePercent: 82, expiryDate: "2025-02-20", enforcementState: "warning" },
  { id: 3, name: "Mike Chen", email: "mike@startup.io", plan: "Starter", status: "paused", bandwidth: "89 GB", createdAt: "Mar 1, 2024", lastLogin: "1 day ago", usagePercent: 45, expiryDate: "2025-03-01" },
  { id: 4, name: "Emily Davis", email: "emily@corp.net", plan: "Enterprise", status: "banned", bandwidth: "2.1 TB", createdAt: "Nov 10, 2023", lastLogin: "1 week ago", usagePercent: 100, expiryDate: "2024-11-10", enforcementState: "blocked" },
  { id: 5, name: "Alex Wilson", email: "alex@tech.com", plan: "Professional", status: "active", bandwidth: "234 GB", createdAt: "Jan 28, 2024", lastLogin: "3 hours ago", usagePercent: 92, expiryDate: "2025-01-28", enforcementState: "critical" },
];

// Enhanced Plans Mock Data
export const enhancedPlans: EnhancedPlan[] = [
  { 
    id: 1, 
    name: "Starter", 
    price: 49, 
    bandwidth: "50 GB", 
    activeUsers: 892, 
    revenue: 43708,
    allowedProxyTypes: ["Residential"],
    sessionLimit: 5,
    rotationRules: ["Rotating only"],
    overageBehavior: "blocked"
  },
  { 
    id: 2, 
    name: "Professional", 
    price: 149, 
    bandwidth: "250 GB", 
    activeUsers: 1247, 
    revenue: 185803,
    allowedProxyTypes: ["Residential", "Mobile"],
    sessionLimit: 25,
    rotationRules: ["Rotating", "Sticky up to 30min"],
    overageBehavior: "throttled"
  },
  { 
    id: 3, 
    name: "Enterprise", 
    price: 299, 
    bandwidth: "1 TB", 
    activeUsers: 708, 
    revenue: 211692,
    allowedProxyTypes: ["Residential", "Mobile", "Datacenter"],
    sessionLimit: -1,
    rotationRules: ["All rotation modes"],
    overageBehavior: "pay-as-you-go"
  },
  { 
    id: 4, 
    name: "Pay As You Go", 
    price: 5, 
    bandwidth: "Per GB", 
    activeUsers: 23, 
    revenue: 89500,
    allowedProxyTypes: ["Residential", "Mobile", "Datacenter"],
    sessionLimit: 10,
    rotationRules: ["Rotating", "Sticky up to 10min"],
    overageBehavior: "pay-as-you-go"
  },
];

// Suppliers Mock Data
export const suppliers: Supplier[] = [
  { id: "sup-1", name: "NetGuard Networks", priority: 1, status: "healthy", failoverEnabled: true, avgLatency: 42, successRate: 99.2, supportedTypes: ["Residential", "Datacenter"] },
  { id: "sup-2", name: "ProxyPrime Global", priority: 2, status: "healthy", failoverEnabled: true, avgLatency: 38, successRate: 98.7, supportedTypes: ["Residential", "Mobile"] },
  { id: "sup-3", name: "DataCenter Express", priority: 3, status: "degraded", failoverEnabled: true, avgLatency: 78, successRate: 94.5, supportedTypes: ["Datacenter"] },
  { id: "sup-4", name: "MobileNet Solutions", priority: 4, status: "healthy", failoverEnabled: false, avgLatency: 65, successRate: 97.8, supportedTypes: ["Mobile"] },
  { id: "sup-5", name: "ResidentialHub", priority: 5, status: "down", failoverEnabled: true, avgLatency: 0, successRate: 0, supportedTypes: ["Residential"] },
];

// Abuse Logs Mock Data
export const abuseLogs: AbuseLog[] = [
  { id: "abuse-1", userId: "user-123", userName: "suspicious@temp.com", type: "rate_limit", timestamp: "5 min ago", details: "Exceeded 10,000 requests/min limit", action: "Throttled", resolved: false },
  { id: "abuse-2", userId: "user-456", userName: "bot@example.com", type: "abuse_flag", timestamp: "1 hour ago", details: "Detected automated credential stuffing pattern", action: "Flagged for review", resolved: false },
  { id: "abuse-3", userId: "user-789", userName: "scraper@bulk.io", type: "auto_block", timestamp: "2 hours ago", details: "Multiple ToS violations detected", action: "Auto-blocked", resolved: false },
  { id: "abuse-4", userId: "user-321", userName: "test@company.com", type: "rate_limit", timestamp: "1 day ago", details: "Burst limit exceeded during testing", action: "Warning issued", resolved: true },
];

// Rate Limit Configs Mock Data
export const rateLimitConfigs: RateLimitConfig[] = [
  { id: "rl-1", name: "Standard", requestsPerMinute: 1000, requestsPerHour: 50000, burstLimit: 100, enabled: true },
  { id: "rl-2", name: "Professional", requestsPerMinute: 5000, requestsPerHour: 200000, burstLimit: 500, enabled: true },
  { id: "rl-3", name: "Enterprise", requestsPerMinute: 20000, requestsPerHour: 1000000, burstLimit: 2000, enabled: true },
  { id: "rl-4", name: "Unlimited", requestsPerMinute: -1, requestsPerHour: -1, burstLimit: -1, enabled: false },
];

// System Services Mock Data
export const systemServices: SystemService[] = [
  { id: "svc-1", name: "Proxy Gateway", status: "operational", lastCheck: "30 sec ago", uptime: 99.99, responseTime: 12, description: "Main proxy routing service" },
  { id: "svc-2", name: "Usage Collector", status: "operational", lastCheck: "1 min ago", uptime: 99.95, responseTime: 45, description: "Bandwidth and request tracking" },
  { id: "svc-3", name: "Supplier Sync", status: "degraded", lastCheck: "2 min ago", uptime: 98.5, responseTime: 250, description: "Provider health monitoring" },
  { id: "svc-4", name: "Billing Engine", status: "operational", lastCheck: "1 min ago", uptime: 100, responseTime: 28, description: "Subscription and payment processing" },
  { id: "svc-5", name: "Auth Service", status: "operational", lastCheck: "30 sec ago", uptime: 99.99, responseTime: 8, description: "User authentication and sessions" },
];

// Country flags helper
export const countryFlags: Record<string, string> = {
  US: "🇺🇸",
  GB: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  JP: "🇯🇵",
  NL: "🇳🇱",
  AU: "🇦🇺",
  CA: "🇨🇦",
  BR: "🇧🇷",
  MX: "🇲🇽",
  IN: "🇮🇳",
  SG: "🇸🇬",
  KR: "🇰🇷",
  IT: "🇮🇹",
  ES: "🇪🇸",
};
