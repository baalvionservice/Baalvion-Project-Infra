// Admin Types for Enterprise Features

export interface Provider {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down";
  avgLatency: number;
  successRate: number;
  supportedCountries: string[];
  lastCheck: string;
  latencyTrend: { time: string; latency: number }[];
  successTrend: { time: string; rate: number }[];
  recentIncidents: ProviderIncident[];
}

export interface ProviderIncident {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  startTime: string;
  endTime?: string;
  description: string;
  affectedCountries: string[];
}

export interface CountryAlert {
  id: string;
  country: string;
  countryCode: string;
  issueType: "latency_spike" | "block_rate" | "provider_outage";
  severity: "low" | "medium" | "high";
  timestamp: string;
  status: "active" | "resolved";
  message: string;
}

export interface IPPoolHealth {
  type: "Residential" | "Mobile" | "Datacenter";
  avgLatency: number;
  successRate: number;
  errorRate: number;
  status: "healthy" | "degraded" | "critical";
  totalIPs: number;
  activeIPs: number;
}

export interface IncidentDetail {
  id: string;
  title: string;
  summary: string;
  affectedProxyTypes: string[];
  affectedCountries: string[];
  startTime: string;
  endTime?: string;
  duration: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  resolutionNotes?: string;
  updates: { time: string; message: string }[];
}

export interface EnhancedPreset {
  id: number;
  name: string;
  type: string;
  country: string;
  rotation: string;
  protocol: string;
  icon: string;
  sessionDuration?: number;
  isCustom?: boolean;
}

export interface EnhancedUser {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: "active" | "suspended" | "paused" | "banned";
  bandwidth: string;
  createdAt: string;
  lastLogin: string;
  usagePercent: number;
  expiryDate: string;
  enforcementState?: "normal" | "warning" | "critical" | "blocked";
}

export interface EnhancedPlan {
  id: number;
  name: string;
  price: number;
  bandwidth: string;
  activeUsers: number;
  revenue: number;
  allowedProxyTypes: string[];
  sessionLimit: number;
  rotationRules: string[];
  overageBehavior: "blocked" | "throttled" | "pay-as-you-go";
}

export interface Supplier {
  id: string;
  name: string;
  priority: number;
  status: "healthy" | "degraded" | "down";
  failoverEnabled: boolean;
  avgLatency: number;
  successRate: number;
  supportedTypes: string[];
}

export interface AbuseLog {
  id: string;
  userId: string;
  userName: string;
  type: "rate_limit" | "abuse_flag" | "auto_block";
  timestamp: string;
  details: string;
  action: string;
  resolved: boolean;
}

export interface RateLimitConfig {
  id: string;
  name: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  enabled: boolean;
}

export interface SystemService {
  id: string;
  name: string;
  status: "operational" | "degraded" | "down";
  lastCheck: string;
  uptime: number;
  responseTime: number;
  description: string;
}
