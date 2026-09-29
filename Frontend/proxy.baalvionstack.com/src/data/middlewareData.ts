// Technical Middle Layer Simulation Data

export const bandwidthMeteringData = [
  { id: "USR-001", user: "SEO Masters", plan: "Professional", allocated: 250, used: 234.5, rate: 12.4, status: "warning", lastMeasured: "2s ago" },
  { id: "USR-002", user: "DataFlow Inc", plan: "Enterprise", allocated: 1000, used: 456.2, rate: 8.7, status: "normal", lastMeasured: "1s ago" },
  { id: "USR-003", user: "WebScrape Pro", plan: "Professional", allocated: 250, used: 189.3, rate: 15.2, status: "normal", lastMeasured: "3s ago" },
  { id: "USR-004", user: "AdTech Solutions", plan: "Starter", allocated: 50, used: 47.8, rate: 3.1, status: "critical", lastMeasured: "1s ago" },
  { id: "USR-005", user: "RankTracker", plan: "Professional", allocated: 250, used: 220.1, rate: 11.8, status: "warning", lastMeasured: "2s ago" },
  { id: "USR-006", user: "InsightHub", plan: "Enterprise", allocated: 1000, used: 112.4, rate: 4.2, status: "normal", lastMeasured: "4s ago" },
  { id: "USR-007", user: "PriceWatch Co", plan: "Professional", allocated: 250, used: 198.7, rate: 9.5, status: "normal", lastMeasured: "1s ago" },
  { id: "USR-008", user: "MarketPulse", plan: "Starter", allocated: 50, used: 12.3, rate: 0.8, status: "normal", lastMeasured: "6s ago" },
];

export const rateLimitData = [
  { endpoint: "/api/v1/proxies/generate", method: "POST", limit: 100, current: 78, window: "1min", status: "normal" },
  { endpoint: "/api/v1/proxies/list", method: "GET", limit: 500, current: 342, window: "1min", status: "normal" },
  { endpoint: "/api/v1/usage", method: "GET", limit: 200, current: 189, window: "1min", status: "warning" },
  { endpoint: "/api/v1/sessions/create", method: "POST", limit: 50, current: 48, window: "1min", status: "critical" },
  { endpoint: "/api/v1/rotate", method: "POST", limit: 300, current: 156, window: "1min", status: "normal" },
  { endpoint: "/api/v1/export", method: "GET", limit: 10, current: 7, window: "1min", status: "warning" },
];

export const sessionManagerData = [
  { id: "SES-001", user: "SEO Masters", type: "Sticky", ip: "185.232.xx.xx", country: "US", duration: "4m 32s", requests: 234, bandwidth: "12.4 MB", status: "active" },
  { id: "SES-002", user: "DataFlow Inc", type: "Rotating", ip: "Auto-rotate", country: "DE", duration: "12m 08s", requests: 1892, bandwidth: "89.2 MB", status: "active" },
  { id: "SES-003", user: "WebScrape Pro", type: "Sticky", ip: "91.134.xx.xx", country: "FR", duration: "9m 15s", requests: 567, bandwidth: "34.1 MB", status: "active" },
  { id: "SES-004", user: "AdTech Solutions", type: "Rotating", ip: "Auto-rotate", country: "GB", duration: "2m 44s", requests: 89, bandwidth: "4.2 MB", status: "throttled" },
  { id: "SES-005", user: "RankTracker", type: "Sticky", ip: "203.45.xx.xx", country: "JP", duration: "7m 22s", requests: 412, bandwidth: "22.8 MB", status: "active" },
  { id: "SES-006", user: "InsightHub", type: "Rotating", ip: "Auto-rotate", country: "US", duration: "1m 09s", requests: 45, bandwidth: "2.1 MB", status: "active" },
];

export const quotaEnforcementData = [
  { user: "SEO Masters", plan: "Professional", quotaType: "Bandwidth", limit: "250 GB", used: "234.5 GB", percent: 93.8, action: "Warning sent", enforced: true },
  { user: "AdTech Solutions", plan: "Starter", quotaType: "Bandwidth", limit: "50 GB", used: "47.8 GB", percent: 95.6, action: "Rate limited", enforced: true },
  { user: "DataFlow Inc", plan: "Enterprise", quotaType: "Concurrent", limit: "500 sessions", used: "234 sessions", percent: 46.8, action: "None", enforced: false },
  { user: "WebScrape Pro", plan: "Professional", quotaType: "Requests/min", limit: "10,000", used: "8,450", percent: 84.5, action: "Approaching limit", enforced: false },
  { user: "RankTracker", plan: "Professional", quotaType: "Bandwidth", limit: "250 GB", used: "220.1 GB", percent: 88.0, action: "Warning sent", enforced: true },
];

export const failoverRoutingData = {
  primary: { provider: "NetGuard Premium", region: "US-East", status: "healthy", latency: 32, load: 67 },
  secondary: { provider: "ProxyShield", region: "US-West", status: "healthy", latency: 45, load: 42 },
  tertiary: { provider: "IPVault Global", region: "EU-West", status: "degraded", latency: 78, load: 89 },
  routes: [
    { from: "US Residential", primary: "NetGuard Premium", fallback: "ProxyShield", status: "active", switchovers: 3 },
    { from: "EU Residential", primary: "IPVault Global", fallback: "NetGuard Premium", status: "failover", switchovers: 12 },
    { from: "Mobile US", primary: "MobileNet Corp", fallback: "NetGuard Premium", status: "active", switchovers: 1 },
    { from: "Datacenter", primary: "DCProxy Fast", fallback: "ProxyShield", status: "active", switchovers: 0 },
    { from: "APAC Residential", primary: "AsiaProxy Net", fallback: "IPVault Global", status: "active", switchovers: 5 },
  ],
};

export const usageLimiterTimeline = [
  { time: "00:00", requests: 4200, limit: 10000, throttled: 0 },
  { time: "04:00", requests: 2800, limit: 10000, throttled: 0 },
  { time: "08:00", requests: 7800, limit: 10000, throttled: 0 },
  { time: "12:00", requests: 9800, limit: 10000, throttled: 120 },
  { time: "14:00", requests: 10200, limit: 10000, throttled: 450 },
  { time: "16:00", requests: 8900, limit: 10000, throttled: 80 },
  { time: "18:00", requests: 7200, limit: 10000, throttled: 0 },
  { time: "20:00", requests: 5600, limit: 10000, throttled: 0 },
  { time: "22:00", requests: 4100, limit: 10000, throttled: 0 },
];

export const billingTrackingData = [
  { user: "SEO Masters", plan: "Professional", baseCharge: 149, overageGB: 0, overageCharge: 0, addOns: 29, total: 178, status: "current" },
  { user: "DataFlow Inc", plan: "Enterprise", baseCharge: 299, overageGB: 0, overageCharge: 0, addOns: 89, total: 388, status: "current" },
  { user: "AdTech Solutions", plan: "Starter", baseCharge: 49, overageGB: 2.8, overageCharge: 14, addOns: 0, total: 63, status: "overage" },
  { user: "WebScrape Pro", plan: "Professional", baseCharge: 149, overageGB: 0, overageCharge: 0, addOns: 49, total: 198, status: "current" },
  { user: "RankTracker", plan: "Professional", baseCharge: 149, overageGB: 0, overageCharge: 0, addOns: 0, total: 149, status: "current" },
];