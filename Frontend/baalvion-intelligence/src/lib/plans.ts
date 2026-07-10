export interface Plan {
  name: string;
  price: string;
  billingNote: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    billingNote: "100 requests/day",
    description: "Explore the API and prototype an integration.",
    features: ["100 requests / day", "News API access", "Community support", "7-day history"],
    cta: "Start Free",
  },
  {
    name: "Starter",
    price: "$19",
    billingNote: "/month",
    description: "For indie developers and small AI projects.",
    features: [
      "10,000 requests / month",
      "AI summaries",
      "Entity extraction",
      "Email support",
      "30-day history",
    ],
    cta: "Start Starter",
  },
  {
    name: "Growth",
    price: "$79",
    billingNote: "/month",
    description: "For growing startups tracking markets and competitors.",
    features: [
      "100,000 requests / month",
      "Trend detection",
      "Sentiment analysis",
      "5 real-time alerts",
      "90-day history",
    ],
    highlighted: true,
    cta: "Start Growth",
  },
  {
    name: "Pro",
    price: "$299",
    billingNote: "/month",
    description: "For agencies and analysts running production workloads.",
    features: [
      "1,000,000 requests / month",
      "Unlimited alerts",
      "Webhook + Slack + Discord delivery",
      "Priority support",
      "1-year history",
    ],
    cta: "Start Pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    billingNote: "annual contract",
    description: "For banks, governments, and large corporations.",
    features: ["Team accounts + SSO", "Audit logs", "Custom SLA", "Dedicated infrastructure", "Full history"],
    cta: "Talk to Sales",
  },
];

export const comparisonFeatures: Array<{ label: string; plans: Record<string, boolean | string> }> = [
  { label: "API access", plans: { Free: true, Starter: true, Growth: true, Pro: true, Enterprise: true } },
  { label: "AI summaries", plans: { Free: false, Starter: true, Growth: true, Pro: true, Enterprise: true } },
  { label: "Trend detection", plans: { Free: false, Starter: false, Growth: true, Pro: true, Enterprise: true } },
  { label: "Real-time alerts", plans: { Free: false, Starter: false, Growth: "5", Pro: "Unlimited", Enterprise: "Unlimited" } },
  { label: "SSO", plans: { Free: false, Starter: false, Growth: false, Pro: false, Enterprise: true } },
  { label: "Audit logs", plans: { Free: false, Starter: false, Growth: false, Pro: false, Enterprise: true } },
  { label: "SLA", plans: { Free: false, Starter: false, Growth: false, Pro: false, Enterprise: true } },
];
