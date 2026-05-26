/**
 * @fileOverview Schemas and initial mock data for the Search & Filtering System.
 */

export const listings = [
  { id: 1, country: "us", category: "Handbag", vendor: "Lumière Silks", price: 120000, status: "Active" },
  { id: 2, country: "uk", category: "Watch", vendor: "Geneva Horology", price: 95000, status: "Pending" },
  { id: 3, country: "ae", category: "Jewelry", vendor: "Artisanal Gold", price: 250000, status: "Active" },
  { id: 4, country: "in", category: "Handbag", vendor: "Lumière Silks", price: 70000, status: "Rejected" }
];

export const leads = [
  { id: 1, country: "us", clientName: "Alexander Cross", interest: "Handbag", assignedTo: "Operator 1", status: "New" },
  { id: 2, country: "uk", clientName: "Sophia Chen", interest: "Watch", assignedTo: "Operator 2", status: "Contacted" }
];

export const content = [
  { id: 1, country: "us", title: "Buying Guide: Luxury Handbags", category: "Guide", author: "Elena Vance", status: "Published" },
  { id: 2, country: "ae", title: "Investment Watches 2026", category: "Article", author: "Marcus Aurelius", status: "Draft" }
];
