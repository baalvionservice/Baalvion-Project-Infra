"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { adminApi, AdminResource } from "@/lib/api/admin";

// ── Cell helpers ───────────────────────────────────────────────────────────
const TONE: Record<string, string> = {
  active: "bg-green-100 text-green-800", succeeded: "bg-green-100 text-green-800",
  published: "bg-green-100 text-green-800", confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800", open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800", draft: "bg-gray-100 text-gray-700",
  suspended: "bg-red-100 text-red-800", failed: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800", rejected: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800", archived: "bg-gray-200 text-gray-600",
  expired: "bg-gray-200 text-gray-600", urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800", medium: "bg-amber-100 text-amber-800",
  low: "bg-gray-100 text-gray-700",
};
export const StatusBadge = ({ value }: { value: any }) => {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  const s = String(value);
  return <Badge variant="secondary" className={TONE[s.toLowerCase()] || "bg-gray-100 text-gray-700"}>{s.replace(/_/g, " ")}</Badge>;
};
const Bool = ({ value }: { value: any }) =>
  value ? <Badge className="bg-green-100 text-green-800">yes</Badge> : <Badge variant="secondary" className="bg-gray-100 text-gray-600">no</Badge>;
const money = (v: any, cur = "USD") => (v == null ? "—" : `${cur === "USD" ? "$" : cur + " "}${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const date = (v: any) => (v ? new Date(v).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");
const rel = (r: any, path: string) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), r) ?? "—";

// ── Types ──────────────────────────────────────────────────────────────────
export type Column = { key: string; label: string; render?: (row: any) => React.ReactNode; className?: string };
export type Field = {
  key: string; label: string;
  type?: "text" | "textarea" | "number" | "select" | "boolean";
  options?: { label: string; value: string }[];
  required?: boolean; placeholder?: string;
};
export type Filter = { key: string; label: string; options: { label: string; value: string }[] };
export type Action = {
  key: string; label: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  confirm?: string;
  visible?: (row: any) => boolean;
  run: (row: any) => Promise<any>;
};
export type ResourceConfig = {
  resource: AdminResource;
  title: string;
  subtitle?: string;
  columns: Column[];
  filters?: Filter[];
  searchPlaceholder?: string;
  fields?: Field[];
  canCreate?: boolean; canEdit?: boolean; canDelete?: boolean;
  actions?: Action[];
};

const sel = (...vals: string[]) => vals.map((v) => ({ label: v.replace(/_/g, " "), value: v }));

// ── Registry ─────────────────────────────────────────────────────────────────
export const REGISTRY: Record<string, ResourceConfig> = {
  lawyers: {
    resource: "lawyers", title: "Lawyers", subtitle: "Vet, verify and moderate practitioners",
    searchPlaceholder: "Search name, email, bar #…",
    filters: [
      { key: "status", label: "Status", options: sel("active", "pending", "suspended") },
      { key: "verified", label: "Verified", options: [{ label: "Verified", value: "true" }, { label: "Unverified", value: "false" }] },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "specializations", label: "Specializations", render: (r) => (r.specializations || []).join(", ") || "—" },
      { key: "hourly_rate", label: "Rate", render: (r) => money(r.hourly_rate) },
      { key: "rating", label: "Rating", render: (r) => `${Number(r.rating || 0).toFixed(1)} (${r.total_reviews || 0})` },
      { key: "verified", label: "Verified", render: (r) => <Bool value={r.verified} /> },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    ],
    canEdit: true, canDelete: true,
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "email", label: "Email", required: true },
      { key: "hourly_rate", label: "Hourly rate", type: "number" },
      { key: "experience", label: "Experience (yrs)", type: "number" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: sel("active", "pending", "suspended") },
      { key: "verified", label: "Verified", type: "boolean" },
    ],
    actions: [
      { key: "verify", label: "Verify", variant: "default", visible: (r) => !r.verified || r.status === "pending", run: (r) => adminApi.verifyLawyer(r.id) },
      { key: "suspend", label: "Suspend", variant: "destructive", confirm: "Suspend this lawyer?", visible: (r) => r.status !== "suspended", run: (r) => adminApi.suspendLawyer(r.id) },
      { key: "activate", label: "Activate", variant: "secondary", visible: (r) => r.status === "suspended", run: (r) => adminApi.activateLawyer(r.id) },
    ],
  },

  clients: {
    resource: "clients", title: "Clients", subtitle: "Client accounts and subscription tiers",
    searchPlaceholder: "Search name, email, phone…",
    filters: [{ key: "subscription_tier", label: "Tier", options: sel("BASIC", "PROFESSIONAL", "ENTERPRISE") }],
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "location", label: "Location" },
      { key: "subscription_tier", label: "Tier", render: (r) => <StatusBadge value={r.subscription_tier} /> },
      { key: "created_at", label: "Joined", render: (r) => date(r.createdAt || r.created_at) },
    ],
    canEdit: true, canDelete: true,
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "email", label: "Email", required: true },
      { key: "phone", label: "Phone" },
      { key: "location", label: "Location" },
      { key: "subscription_tier", label: "Tier", type: "select", options: sel("BASIC", "PROFESSIONAL", "ENTERPRISE") },
    ],
  },

  users: {
    resource: "users", title: "Users", subtitle: "Platform identities and access",
    searchPlaceholder: "Search email or name…",
    filters: [
      { key: "role", label: "Role", options: sel("admin", "lawyer", "client") },
      { key: "is_active", label: "Active", options: [{ label: "Active", value: "true" }, { label: "Suspended", value: "false" }] },
    ],
    columns: [
      { key: "full_name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role", render: (r) => <StatusBadge value={r.role} /> },
      { key: "is_active", label: "Active", render: (r) => <Bool value={r.is_active} /> },
      { key: "created_at", label: "Created", render: (r) => date(r.createdAt || r.created_at) },
    ],
    canEdit: true,
    fields: [
      { key: "full_name", label: "Full name" },
      { key: "email", label: "Email", required: true },
      { key: "role", label: "Role", type: "select", options: sel("admin", "lawyer", "client") },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
    actions: [
      { key: "suspend", label: "Suspend", variant: "destructive", confirm: "Suspend this user?", visible: (r) => r.is_active, run: (r) => adminApi.setUserStatus(r.id, "suspended") },
      { key: "activate", label: "Activate", variant: "secondary", visible: (r) => !r.is_active, run: (r) => adminApi.setUserStatus(r.id, "active") },
    ],
  },

  cases: {
    resource: "cases", title: "Cases", subtitle: "All matters across the network",
    searchPlaceholder: "Search title, description…",
    filters: [
      { key: "status", label: "Status", options: sel("open", "in_progress", "closed", "archived") },
      { key: "priority", label: "Priority", options: sel("low", "medium", "high", "urgent") },
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "client", label: "Client", render: (r) => rel(r, "client.name") },
      { key: "lawyer", label: "Lawyer", render: (r) => rel(r, "lawyer.name") },
      { key: "category", label: "Category" },
      { key: "priority", label: "Priority", render: (r) => <StatusBadge value={r.priority} /> },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    ],
    canEdit: true, canDelete: true,
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status", type: "select", options: sel("open", "in_progress", "closed", "archived") },
      { key: "priority", label: "Priority", type: "select", options: sel("low", "medium", "high", "urgent") },
      { key: "lawyer_id", label: "Lawyer ID", type: "number" },
    ],
  },

  bookings: {
    resource: "bookings", title: "Bookings", subtitle: "Consultations and engagements",
    filters: [
      { key: "status", label: "Status", options: sel("pending", "confirmed", "completed", "cancelled") },
      { key: "type", label: "Type", options: sel("consultation", "representation", "review") },
    ],
    columns: [
      { key: "id", label: "#", className: "w-12" },
      { key: "client", label: "Client", render: (r) => rel(r, "client.name") },
      { key: "lawyer", label: "Lawyer", render: (r) => rel(r, "lawyer.name") },
      { key: "type", label: "Type", render: (r) => <StatusBadge value={r.type} /> },
      { key: "scheduled_at", label: "Scheduled", render: (r) => date(r.scheduled_at) },
      { key: "total_amount", label: "Amount", render: (r) => money(r.total_amount) },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    ],
    canEdit: true,
    fields: [
      { key: "status", label: "Status", type: "select", options: sel("pending", "confirmed", "completed", "cancelled") },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "total_amount", label: "Amount", type: "number" },
    ],
  },

  payments: {
    resource: "payments", title: "Payments", subtitle: "Transactions and refunds",
    filters: [{ key: "status", label: "Status", options: sel("pending", "succeeded", "failed", "refunded") }],
    columns: [
      { key: "id", label: "#", className: "w-12" },
      { key: "client", label: "Client", render: (r) => rel(r, "client.name") },
      { key: "lawyer", label: "Lawyer", render: (r) => rel(r, "lawyer.name") },
      { key: "amount", label: "Amount", render: (r) => money(r.amount, r.currency) },
      { key: "provider", label: "Provider" },
      { key: "provider_tx_id", label: "Txn" },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      { key: "created_at", label: "Date", render: (r) => date(r.createdAt || r.created_at) },
    ],
    actions: [
      { key: "refund", label: "Refund", variant: "destructive", confirm: "Refund this payment?", visible: (r) => r.status === "succeeded", run: (r) => adminApi.refundPayment(r.id) },
    ],
  },

  subscriptions: {
    resource: "subscriptions", title: "Subscriptions", subtitle: "Recurring plans",
    filters: [
      { key: "tier", label: "Tier", options: sel("BASIC", "PROFESSIONAL", "ENTERPRISE") },
      { key: "status", label: "Status", options: sel("active", "cancelled", "expired") },
    ],
    columns: [
      { key: "id", label: "#", className: "w-12" },
      { key: "client", label: "Client", render: (r) => rel(r, "client.name") },
      { key: "tier", label: "Tier", render: (r) => <StatusBadge value={r.tier} /> },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      { key: "started_at", label: "Started", render: (r) => date(r.started_at) },
      { key: "expires_at", label: "Expires", render: (r) => date(r.expires_at) },
    ],
    actions: [
      { key: "cancel", label: "Cancel", variant: "destructive", confirm: "Cancel this subscription?", visible: (r) => r.status === "active", run: (r) => adminApi.cancelSubscription(r.id) },
    ],
  },

  reviews: {
    resource: "reviews", title: "Reviews", subtitle: "Moderate client feedback",
    filters: [{ key: "rating", label: "Rating", options: sel("5", "4", "3", "2", "1") }],
    columns: [
      { key: "id", label: "#", className: "w-12" },
      { key: "lawyer", label: "Lawyer", render: (r) => rel(r, "lawyer.name") },
      { key: "client", label: "Client", render: (r) => rel(r, "client.name") },
      { key: "rating", label: "Rating", render: (r) => "★".repeat(r.rating) + "☆".repeat(5 - r.rating) },
      { key: "comment", label: "Comment", render: (r) => <span className="line-clamp-2 max-w-md">{r.comment}</span> },
      { key: "created_at", label: "Date", render: (r) => date(r.createdAt || r.created_at) },
    ],
    canDelete: true,
  },

  articles: {
    resource: "articles", title: "Articles", subtitle: "Knowledge base editorial",
    searchPlaceholder: "Search title, slug…",
    filters: [{ key: "status", label: "Status", options: sel("draft", "published", "archived") }],
    columns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "views", label: "Views" },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      { key: "published_at", label: "Published", render: (r) => date(r.published_at) },
    ],
    canCreate: true, canEdit: true, canDelete: true,
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true, placeholder: "kebab-case-unique" },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "content", label: "Content", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: sel("draft", "published", "archived") },
      { key: "category_id", label: "Category ID", type: "number" },
    ],
    actions: [
      { key: "publish", label: "Publish", variant: "default", visible: (r) => r.status !== "published", run: (r) => adminApi.publishArticle(r.id) },
      { key: "archive", label: "Archive", variant: "secondary", visible: (r) => r.status !== "archived", run: (r) => adminApi.archiveArticle(r.id) },
    ],
  },

  categories: {
    resource: "categories", title: "Categories", subtitle: "Practice areas",
    searchPlaceholder: "Search name, slug…",
    filters: [{ key: "is_active", label: "Active", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] }],
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "icon", label: "Icon" },
      { key: "is_active", label: "Active", render: (r) => <Bool value={r.is_active} /> },
    ],
    canCreate: true, canEdit: true, canDelete: true,
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "slug", label: "Slug", required: true, placeholder: "kebab-case-unique" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon (lucide name)" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },

  subcategories: {
    resource: "subcategories", title: "Subcategories", subtitle: "Sub-areas within a practice area",
    searchPlaceholder: "Search name, slug…",
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "category", label: "Category", render: (r) => rel(r, "category.name") },
      { key: "is_active", label: "Active", render: (r) => <Bool value={r.is_active} /> },
    ],
    canCreate: true, canEdit: true, canDelete: true,
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "slug", label: "Slug", required: true, placeholder: "kebab-case-unique" },
      { key: "category_id", label: "Category ID", type: "number", required: true },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },

  referrals: {
    resource: "referrals", title: "Referrals", subtitle: "Referral codes and rewards",
    searchPlaceholder: "Search code…",
    filters: [{ key: "status", label: "Status", options: sel("pending", "completed") }],
    columns: [
      { key: "code", label: "Code" },
      { key: "referrer_id", label: "Referrer" },
      { key: "referee_id", label: "Referee" },
      { key: "reward", label: "Reward", render: (r) => money(r.reward) },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    ],
    canEdit: true, canDelete: true,
    fields: [
      { key: "status", label: "Status", type: "select", options: sel("pending", "completed") },
      { key: "reward", label: "Reward", type: "number" },
    ],
  },

  audit: {
    resource: "audit", title: "Audit Log", subtitle: "Every administrative mutation",
    searchPlaceholder: "Search actor, resource, action…",
    columns: [
      { key: "created_at", label: "When", render: (r) => new Date(r.createdAt || r.created_at).toLocaleString() },
      { key: "actor_email", label: "Actor" },
      { key: "action", label: "Action", render: (r) => <StatusBadge value={r.action} /> },
      { key: "resource", label: "Resource" },
      { key: "resource_id", label: "ID" },
    ],
  },
};

export function getConfig(resource: string): ResourceConfig | null {
  return REGISTRY[resource] || null;
}
