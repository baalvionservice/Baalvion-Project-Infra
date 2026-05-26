// Global Network Map Mock Data

export interface RegionData {
  id: string;
  name: string;
  country: string;
  code: string;
  lat: number;
  lng: number;
  ipPoolCount: number;
  activeSessions: number;
  avgLatency: number;
  status: "healthy" | "degraded" | "critical";
  suppliers: string[];
  capacityPercent: number;
  exhaustionRisk: number;
}

export const regions: RegionData[] = [
  { id: "us-east", name: "US East", country: "United States", code: "US", lat: 40.7, lng: -74, ipPoolCount: 2450000, activeSessions: 185000, avgLatency: 32, status: "healthy", suppliers: ["NetGuard", "ProxyPrime", "ResidentialHub"], capacityPercent: 72, exhaustionRisk: 15 },
  { id: "us-west", name: "US West", country: "United States", code: "US", lat: 37.7, lng: -122.4, ipPoolCount: 1800000, activeSessions: 142000, avgLatency: 28, status: "healthy", suppliers: ["NetGuard", "ProxyPrime"], capacityPercent: 68, exhaustionRisk: 12 },
  { id: "eu-west", name: "EU West", country: "United Kingdom", code: "GB", lat: 51.5, lng: -0.1, ipPoolCount: 1200000, activeSessions: 98000, avgLatency: 45, status: "healthy", suppliers: ["NetGuard", "ProxyPrime"], capacityPercent: 78, exhaustionRisk: 22 },
  { id: "eu-central", name: "EU Central", country: "Germany", code: "DE", lat: 50.1, lng: 8.7, ipPoolCount: 980000, activeSessions: 76000, avgLatency: 78, status: "degraded", suppliers: ["NetGuard", "DataCenter Express"], capacityPercent: 89, exhaustionRisk: 45 },
  { id: "apac-east", name: "APAC East", country: "Japan", code: "JP", lat: 35.7, lng: 139.7, ipPoolCount: 650000, activeSessions: 52000, avgLatency: 62, status: "healthy", suppliers: ["MobileNet"], capacityPercent: 65, exhaustionRisk: 18 },
  { id: "apac-south", name: "APAC South", country: "India", code: "IN", lat: 19, lng: 72.8, ipPoolCount: 420000, activeSessions: 38000, avgLatency: 85, status: "degraded", suppliers: ["ProxyPrime"], capacityPercent: 91, exhaustionRisk: 62 },
  { id: "sa-east", name: "SA East", country: "Brazil", code: "BR", lat: -23.5, lng: -46.6, ipPoolCount: 280000, activeSessions: 21000, avgLatency: 95, status: "healthy", suppliers: ["ProxyPrime"], capacityPercent: 58, exhaustionRisk: 8 },
  { id: "eu-north", name: "EU North", country: "Netherlands", code: "NL", lat: 52.4, lng: 4.9, ipPoolCount: 520000, activeSessions: 45000, avgLatency: 38, status: "healthy", suppliers: ["NetGuard", "DataCenter Express"], capacityPercent: 71, exhaustionRisk: 14 },
  { id: "apac-se", name: "APAC SE", country: "Singapore", code: "SG", lat: 1.3, lng: 103.8, ipPoolCount: 310000, activeSessions: 28000, avgLatency: 55, status: "healthy", suppliers: ["MobileNet"], capacityPercent: 62, exhaustionRisk: 10 },
  { id: "me-south", name: "Middle East", country: "UAE", code: "AE", lat: 25.2, lng: 55.3, ipPoolCount: 150000, activeSessions: 12000, avgLatency: 72, status: "healthy", suppliers: ["ProxyPrime"], capacityPercent: 55, exhaustionRisk: 7 },
];

export const supplierDistribution = [
  { name: "NetGuard Networks", percentage: 35, ipCount: 5400000 },
  { name: "ProxyPrime Global", percentage: 28, ipCount: 4320000 },
  { name: "DataCenter Express", percentage: 18, ipCount: 2780000 },
  { name: "MobileNet Solutions", percentage: 12, ipCount: 1850000 },
  { name: "ResidentialHub", percentage: 7, ipCount: 1080000 },
];

export const latencyHeatData = [
  { region: "US East", latency: 32, color: "green" },
  { region: "US West", latency: 28, color: "green" },
  { region: "EU West", latency: 45, color: "green" },
  { region: "EU Central", latency: 78, color: "orange" },
  { region: "APAC East", latency: 62, color: "yellow" },
  { region: "APAC South", latency: 85, color: "orange" },
  { region: "SA East", latency: 95, color: "red" },
  { region: "EU North", latency: 38, color: "green" },
  { region: "APAC SE", latency: 55, color: "yellow" },
  { region: "Middle East", latency: 72, color: "orange" },
];
