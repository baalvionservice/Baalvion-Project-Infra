export interface Notification {
  id: string;
  type: "bandwidth" | "proxy" | "latency" | "abuse" | "invoice" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  severity: "info" | "warning" | "critical";
}

export const initialNotifications: Notification[] = [
  { id: "n1", type: "bandwidth", title: "Bandwidth 90% Used", message: "Your organization has used 90% of the monthly bandwidth allocation.", time: "2 min ago", read: false, severity: "warning" },
  { id: "n2", type: "proxy", title: "Proxy Pool Degraded", message: "Mobile proxy pool in APAC region is experiencing degraded performance.", time: "15 min ago", read: false, severity: "critical" },
  { id: "n3", type: "latency", title: "Supplier Latency Spike", message: "DataCenter Express latency increased to 92ms (threshold: 60ms).", time: "32 min ago", read: false, severity: "warning" },
  { id: "n4", type: "abuse", title: "Abuse Alert", message: "Suspicious pattern detected from user suspicious@temp.com.", time: "1 hour ago", read: false, severity: "critical" },
  { id: "n5", type: "invoice", title: "Invoice Generated", message: "Invoice INV-2024-004 for $299.00 has been generated.", time: "2 hours ago", read: true, severity: "info" },
  { id: "n6", type: "system", title: "System Update", message: "Proxy gateway updated to v2.4.1 with improved routing.", time: "5 hours ago", read: true, severity: "info" },
  { id: "n7", type: "bandwidth", title: "Sub-user Quota Warning", message: "External Partner has used 98% of allocated bandwidth.", time: "6 hours ago", read: true, severity: "warning" },
];
