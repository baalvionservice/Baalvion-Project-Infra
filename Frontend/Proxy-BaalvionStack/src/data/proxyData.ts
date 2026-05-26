import { Proxy, ProxyLog, ProxyUsageData } from "@/types/proxy";

// Generate mock logs for a proxy
const generateMockLogs = (count: number): ProxyLog[] => {
  const urls = [
    "api.example.com/v1/data",
    "cdn.service.io/assets",
    "www.target-site.com/products",
    "api.analytics.net/track",
    "store.retailer.com/inventory",
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `log-${Date.now()}-${i}`,
    timestamp: new Date(Date.now() - i * 60000 * Math.random() * 10).toISOString(),
    url: urls[Math.floor(Math.random() * urls.length)],
    statusCode: Math.random() > 0.1 ? 200 : [403, 429, 500, 502][Math.floor(Math.random() * 4)],
    latency: Math.floor(30 + Math.random() * 120),
    bytesTransferred: Math.floor(1024 + Math.random() * 50000),
    success: Math.random() > 0.1,
    errorMessage: Math.random() > 0.9 ? "Connection timeout" : undefined,
  }));
};

// Generate usage history for charts
const generateUsageHistory = (): ProxyUsageData[] => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((date) => ({
    date,
    bandwidth: Math.floor(50 + Math.random() * 200),
    requests: Math.floor(1000 + Math.random() * 5000),
    successRate: 95 + Math.random() * 5,
  }));
};

// Enhanced proxy data with all required fields
export const enhancedProxyList: Proxy[] = [
  {
    id: 1,
    type: "Residential",
    country: "United States",
    countryCode: "US",
    state: "California",
    city: "Los Angeles",
    ip: "192.168.1.***",
    port: 8080,
    protocol: "HTTP/HTTPS",
    status: "active",
    bandwidthUsed: 2450,
    bandwidthLimit: 5000,
    successRate: 98.7,
    errorRate: 1.3,
    avgLatency: 42,
    lastChecked: "2 min ago",
    uptime: 99.9,
    totalRequests: 145230,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 2,
    type: "Residential",
    country: "United States",
    countryCode: "US",
    state: "New York",
    city: "New York City",
    ip: "192.168.2.***",
    port: 8080,
    protocol: "SOCKS5",
    status: "active",
    bandwidthUsed: 1800,
    bandwidthLimit: 5000,
    successRate: 99.2,
    errorRate: 0.8,
    avgLatency: 38,
    lastChecked: "1 min ago",
    uptime: 99.95,
    totalRequests: 98450,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 3,
    type: "Mobile",
    country: "United States",
    countryCode: "US",
    state: "Texas",
    city: "Houston",
    ip: "192.168.3.***",
    port: 8080,
    protocol: "HTTP/HTTPS",
    status: "active",
    bandwidthUsed: 890,
    bandwidthLimit: 2000,
    successRate: 97.5,
    errorRate: 2.5,
    avgLatency: 65,
    lastChecked: "5 min ago",
    uptime: 98.5,
    totalRequests: 45670,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 4,
    type: "Datacenter",
    country: "Germany",
    countryCode: "DE",
    state: "Bavaria",
    city: "Munich",
    ip: "192.168.4.***",
    port: 8080,
    protocol: "HTTP/HTTPS",
    status: "active",
    bandwidthUsed: 4200,
    bandwidthLimit: 10000,
    successRate: 99.8,
    errorRate: 0.2,
    avgLatency: 15,
    lastChecked: "30 sec ago",
    uptime: 99.99,
    totalRequests: 892340,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 5,
    type: "Residential",
    country: "United Kingdom",
    countryCode: "GB",
    state: "England",
    city: "London",
    ip: "192.168.5.***",
    port: 8080,
    protocol: "SOCKS5",
    status: "maintenance",
    bandwidthUsed: 3100,
    bandwidthLimit: 5000,
    successRate: 96.2,
    errorRate: 3.8,
    avgLatency: 52,
    lastChecked: "15 min ago",
    uptime: 97.5,
    totalRequests: 67890,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 6,
    type: "Mobile",
    country: "Germany",
    countryCode: "DE",
    state: "Berlin",
    city: "Berlin",
    ip: "192.168.6.***",
    port: 8080,
    protocol: "HTTP/HTTPS",
    status: "active",
    bandwidthUsed: 560,
    bandwidthLimit: 2000,
    successRate: 98.1,
    errorRate: 1.9,
    avgLatency: 58,
    lastChecked: "3 min ago",
    uptime: 99.2,
    totalRequests: 34560,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 7,
    type: "Datacenter",
    country: "United States",
    countryCode: "US",
    state: "Virginia",
    city: "Ashburn",
    ip: "192.168.7.***",
    port: 8080,
    protocol: "HTTP/HTTPS",
    status: "active",
    bandwidthUsed: 8500,
    bandwidthLimit: 10000,
    successRate: 99.9,
    errorRate: 0.1,
    avgLatency: 12,
    lastChecked: "1 min ago",
    uptime: 99.99,
    totalRequests: 1234560,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 8,
    type: "Residential",
    country: "France",
    countryCode: "FR",
    state: "Île-de-France",
    city: "Paris",
    ip: "192.168.8.***",
    port: 8080,
    protocol: "HTTP/HTTPS",
    status: "limited",
    bandwidthUsed: 4800,
    bandwidthLimit: 5000,
    successRate: 94.5,
    errorRate: 5.5,
    avgLatency: 78,
    lastChecked: "8 min ago",
    uptime: 96.0,
    totalRequests: 56780,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 9,
    type: "Mobile",
    country: "Japan",
    countryCode: "JP",
    state: "Tokyo",
    city: "Tokyo",
    ip: "192.168.9.***",
    port: 8080,
    protocol: "SOCKS5",
    status: "offline",
    bandwidthUsed: 0,
    bandwidthLimit: 2000,
    successRate: 0,
    errorRate: 100,
    avgLatency: 0,
    lastChecked: "2 hours ago",
    uptime: 0,
    totalRequests: 12340,
    recentLogs: generateMockLogs(5),
    usageHistory: generateUsageHistory(),
  },
  {
    id: 10,
    type: "Datacenter",
    country: "Netherlands",
    countryCode: "NL",
    state: "North Holland",
    city: "Amsterdam",
    ip: "192.168.10.***",
    port: 8080,
    protocol: "HTTP/HTTPS",
    status: "active",
    bandwidthUsed: 6200,
    bandwidthLimit: 10000,
    successRate: 99.7,
    errorRate: 0.3,
    avgLatency: 18,
    lastChecked: "45 sec ago",
    uptime: 99.98,
    totalRequests: 678900,
    recentLogs: generateMockLogs(10),
    usageHistory: generateUsageHistory(),
  },
];

// Helper to get unique countries from proxy list
export const getUniqueCountries = (): string[] => {
  const countries = enhancedProxyList.map((p) => p.country);
  return ["All Countries", ...Array.from(new Set(countries))];
};

// Simulated API fetch function (can be replaced with real API later)
export const fetchProxies = async (filters?: {
  type?: string;
  status?: string;
  country?: string;
  search?: string;
}): Promise<Proxy[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  let result = [...enhancedProxyList];
  
  if (filters?.type && filters.type !== "all") {
    result = result.filter((p) => p.type === filters.type);
  }
  
  if (filters?.status && filters.status !== "all") {
    result = result.filter((p) => p.status === filters.status);
  }
  
  if (filters?.country && filters.country !== "All Countries") {
    result = result.filter((p) => p.country === filters.country);
  }
  
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.city.toLowerCase().includes(search) ||
        p.country.toLowerCase().includes(search) ||
        p.ip.includes(search)
    );
  }
  
  return result;
};

// Fetch single proxy by ID
export const fetchProxyById = async (id: number): Promise<Proxy | null> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return enhancedProxyList.find((p) => p.id === id) || null;
};
