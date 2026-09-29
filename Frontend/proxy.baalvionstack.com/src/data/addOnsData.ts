// Add-Ons Marketplace Mock Data

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  enabled: boolean;
  popular?: boolean;
}

export const addOns: AddOn[] = [
  { id: "dedicated-ips", name: "Dedicated IPs", description: "Get dedicated residential IPs that are exclusively yours. No sharing, maximum trust score.", price: 29, unit: "/mo per IP", category: "IP Management", enabled: false, popular: true },
  { id: "static-pool", name: "Static IP Pool", description: "Reserve a pool of static IPs for consistent fingerprinting and session persistence.", price: 49, unit: "/mo per pool", category: "IP Management", enabled: false },
  { id: "extra-bandwidth", name: "Extra Bandwidth Pack", description: "Add 100 GB of additional bandwidth to your current plan. Rolls over for 30 days.", price: 39, unit: "/100 GB", category: "Bandwidth", enabled: false, popular: true },
  { id: "priority-routing", name: "Priority Routing", description: "Get fastest route selection with <30ms latency guarantee. Bypass standard queuing.", price: 59, unit: "/mo", category: "Performance", enabled: false },
  { id: "advanced-geo", name: "Advanced Geo-Targeting", description: "Unlock ZIP code, ASN, and carrier-level targeting for precise location control.", price: 19, unit: "/mo", category: "Targeting", enabled: true },
  { id: "webhook-alerts", name: "Webhook Alerts", description: "Real-time webhook notifications for usage alerts, quota limits, and pool health.", price: 9, unit: "/mo", category: "Monitoring", enabled: true },
  { id: "sla-premium", name: "Premium SLA", description: "99.99% uptime guarantee with 10x service credits and dedicated support channel.", price: 99, unit: "/mo", category: "Support", enabled: false },
  { id: "data-export", name: "Automated Data Export", description: "Schedule automated daily/weekly usage reports exported to S3, GCS, or email.", price: 15, unit: "/mo", category: "Monitoring", enabled: false },
];

export const overageRates = {
  residential: { perGB: 5.50, discount10: 4.95, discount50: 4.40 },
  mobile: { perGB: 14.00, discount10: 12.60, discount50: 11.20 },
  datacenter: { perGB: 1.20, discount10: 1.08, discount50: 0.96 },
};