// Risk & Abuse Intelligence Mock Data

export const userAbuseScores = [
  { id: 1, name: "suspicious@temp.com", score: 92, status: "critical", flags: ["Credential stuffing", "Rate limit bypass"], requests24h: 482000, blocked: true },
  { id: 2, name: "bot@example.com", score: 85, status: "critical", flags: ["Automated scraping", "TOS violation"], requests24h: 320000, blocked: false },
  { id: 3, name: "bulk@scraper.io", score: 73, status: "high", flags: ["Burst requests", "Suspicious rotation"], requests24h: 195000, blocked: false },
  { id: 4, name: "anon@proxy.net", score: 61, status: "medium", flags: ["Unusual geo pattern"], requests24h: 87000, blocked: false },
  { id: 5, name: "test@loadtest.com", score: 45, status: "low", flags: ["Load testing detected"], requests24h: 52000, blocked: false },
];

export const burstDetectionData = [
  { time: "00:00", normal: 12000, burst: 0 },
  { time: "02:00", normal: 8500, burst: 0 },
  { time: "04:00", normal: 6200, burst: 0 },
  { time: "06:00", normal: 9800, burst: 2400 },
  { time: "08:00", normal: 18500, burst: 0 },
  { time: "10:00", normal: 24000, burst: 8500 },
  { time: "12:00", normal: 28000, burst: 15000 },
  { time: "14:00", normal: 26500, burst: 3200 },
  { time: "16:00", normal: 22000, burst: 0 },
  { time: "18:00", normal: 19500, burst: 0 },
  { time: "20:00", normal: 15000, burst: 6800 },
  { time: "22:00", normal: 13000, burst: 0 },
];

export const apiMisuseData = [
  { date: "Mon", authFailures: 120, rateLimited: 450, invalidRequests: 89 },
  { date: "Tue", authFailures: 95, rateLimited: 380, invalidRequests: 72 },
  { date: "Wed", authFailures: 210, rateLimited: 620, invalidRequests: 145 },
  { date: "Thu", authFailures: 180, rateLimited: 520, invalidRequests: 110 },
  { date: "Fri", authFailures: 340, rateLimited: 890, invalidRequests: 230 },
  { date: "Sat", authFailures: 85, rateLimited: 280, invalidRequests: 55 },
  { date: "Sun", authFailures: 60, rateLimited: 190, invalidRequests: 42 },
];

export const asnBlockList = [
  { asn: "AS13335", name: "Cloudflare Inc", blocked: true, reason: "Known proxy detection", blockedSince: "2024-01-15" },
  { asn: "AS16509", name: "Amazon AWS", blocked: true, reason: "Datacenter range flagged", blockedSince: "2024-02-01" },
  { asn: "AS14061", name: "DigitalOcean", blocked: true, reason: "High abuse rate from range", blockedSince: "2024-01-20" },
  { asn: "AS45102", name: "Alibaba Cloud", blocked: false, reason: "Monitoring", blockedSince: null },
  { asn: "AS8075", name: "Microsoft Azure", blocked: false, reason: "Whitelisted", blockedSince: null },
];

export const countryBlockConfig = [
  { country: "China", code: "CN", blocked: true, reason: "Regulatory compliance" },
  { country: "Iran", code: "IR", blocked: true, reason: "Sanctions compliance" },
  { country: "North Korea", code: "KP", blocked: true, reason: "Sanctions compliance" },
  { country: "Russia", code: "RU", blocked: false, reason: "Monitoring increased" },
  { country: "Cuba", code: "CU", blocked: true, reason: "Sanctions compliance" },
];

export const suspiciousPatterns = [
  { id: 1, type: "Credential Stuffing", severity: "critical", detectedAt: "2 min ago", source: "suspicious@temp.com", details: "450 login attempts across 12 targets in 3 minutes", status: "active" },
  { id: 2, type: "Port Scanning", severity: "high", detectedAt: "15 min ago", source: "scan@probe.net", details: "Sequential port scan on 2,400 IPs", status: "active" },
  { id: 3, type: "Data Exfiltration", severity: "critical", detectedAt: "45 min ago", source: "bulk@scraper.io", details: "Unusual data volume: 48GB in 1 hour from single target", status: "investigating" },
  { id: 4, type: "Geo Hopping", severity: "medium", detectedAt: "1 hour ago", source: "anon@proxy.net", details: "Rapid switching between 15 countries in 5 minutes", status: "monitoring" },
  { id: 5, type: "Rate Limit Evasion", severity: "high", detectedAt: "2 hours ago", source: "bot@example.com", details: "Distributing requests across 50 sub-accounts", status: "blocked" },
];
