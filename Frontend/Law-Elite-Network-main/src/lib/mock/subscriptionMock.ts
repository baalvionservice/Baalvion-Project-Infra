/**
 * @fileOverview Subscription Mock Data and Storage.
 * Defines the monetization tiers for the Law Elite Network.
 */

import { Plan } from "@/types/subscription";

export const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    features: [
      "Standard Discovery Listing",
      "Standard Channel Access",
      "Limited Dashboard Analytics"
    ],
  },
  {
    id: "pro",
    name: "Professional",
    price: 2999,
    features: [
      "Priority Search Ranking",
      "Advanced Chambers Analytics",
      "Verified Professional Badge",
      "Priority Lead Matching"
    ],
    recommended: true
  },
  {
    id: "elite",
    name: "Elite",
    price: 7999,
    features: [
      "Top-Tier Placement",
      "Unlimited Discovery Boost",
      "Elite Practitioner Badge",
      "Exclusive Network Events",
      "24/7 Priority Support"
    ],
  },
];

export const getSubscriptionMock = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem("law_elite_subscriptions") || "[]");
};

export const saveSubscriptionMock = (data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("law_elite_subscriptions", JSON.stringify(data));
};
