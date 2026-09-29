// Proxy Types for the application
// These types are designed to be API-ready

export type ProxyType = "Residential" | "Mobile" | "Datacenter";
export type ProxyStatus = "active" | "maintenance" | "offline" | "limited";
export type ProxyProtocol = "HTTP/HTTPS" | "SOCKS5" | "HTTP" | "HTTPS";

export interface ProxyLog {
  id: string;
  timestamp: string;
  url: string;
  statusCode: number;
  latency: number;
  bytesTransferred: number;
  success: boolean;
  errorMessage?: string;
}

export interface ProxyUsageData {
  date: string;
  bandwidth: number;
  requests: number;
  successRate: number;
}

export interface Proxy {
  id: number;
  type: ProxyType;
  country: string;
  countryCode: string;
  state: string;
  city: string;
  ip: string;
  port: number;
  protocol: ProxyProtocol;
  status: ProxyStatus;
  bandwidthUsed: number; // in MB
  bandwidthLimit: number; // in MB
  successRate: number;
  errorRate: number;
  avgLatency: number; // in ms
  lastChecked: string;
  uptime: number; // percentage
  totalRequests: number;
  recentLogs: ProxyLog[];
  usageHistory: ProxyUsageData[];
}

export interface ProxyFilters {
  search: string;
  type: ProxyType | "all";
  status: ProxyStatus | "all";
  country: string;
}

// API response types (for future integration)
export interface ProxyListResponse {
  data: Proxy[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProxyDetailResponse {
  data: Proxy;
}
