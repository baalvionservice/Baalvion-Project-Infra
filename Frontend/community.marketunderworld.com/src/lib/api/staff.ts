// Staff console client: who the caller is, staff management, the audit log, support tickets,
// announcements and admin-triggered notifications. Browser only (cookie session via the proxy),
// except announcements, which are public and also read on the server.

import { ApiError } from "./nightlife";

export { ApiError };

const PROXY_BASE = "/api/community-proxy";
const DIRECT_BASE = process.env.COMMUNITY_UPSTREAM_URL ?? '';

interface Envelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function call<T>(method: string, path: string, payload?: unknown): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    credentials: "include",
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || body.success === false) {
    throw new ApiError(body.error?.message || `Request failed (${res.status})`, res.status, body.error?.code);
  }
  return body.data;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : "";
};

// ── Access ──────────────────────────────────────────────────────────────────
export type Tier = "super" | "admin" | "moderator";
export type Permission =
  | "content.manage" | "content.handle" | "verify.review" | "bounty.manage" | "support.handle"
  | "announce.publish" | "audit.view" | "notify.send" | "kyc.review" | "staff.manage";

export interface StaffMe {
  tier: Tier | null;
  permissions: Permission[];
  allPermissions: Permission[];
}

export interface StaffMember {
  userId: string;
  tier: "admin" | "moderator";
  label: string | null;
  grantedBy: string;
  grantedAt: string;
}

export const access = {
  me: () => call<StaffMe>("GET", "/staff/me"),
  list: () => call<StaffMember[]>("GET", "/admin/staff"),
  grant: (userId: string, tier: "admin" | "moderator", label: string) => call<StaffMember>("PUT", `/admin/staff/${userId}`, { tier, label }),
  revoke: (userId: string) => call<{ removed: boolean }>("DELETE", `/admin/staff/${userId}`),
};

// ── Audit log ───────────────────────────────────────────────────────────────
export interface AuditItem {
  id: string;
  actorId: string;
  actor: string | null;
  tier: string | null;
  action: string;
  summary: string;
  targetId: string | null;
  severity: "info" | "warning" | "critical";
  ip: string | null;
  status: number | null;
  at: string;
}

export const audit = {
  list: (f: { severity?: string; q?: string; before?: string; limit?: number } = {}) =>
    call<{ items: AuditItem[]; last24h: Partial<Record<"info" | "warning" | "critical", number>> }>("GET", `/admin/audit${qs(f)}`),
};

// ── Support ─────────────────────────────────────────────────────────────────
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketCategory = "order" | "account" | "booking" | "verification" | "payment" | "other";

export interface Ticket {
  id: string;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  createdAt: string;
  lastMessageAt: string;
  userId?: string;
  user?: string | null;
  assignedTo?: string | null;
  assignedLabel?: string | null;
}
export interface TicketMessage {
  id: string;
  fromStaff: boolean;
  sender: string | null;
  body: string;
  createdAt: string;
}
export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

export const support = {
  create: (d: { category: TicketCategory; subject: string; message: string }) => call<Ticket>("POST", "/support/tickets", d),
  mine: () => call<Ticket[]>("GET", "/support/tickets/mine"),
  get: (id: string) => call<TicketDetail>("GET", `/support/tickets/${id}`),
  reply: (id: string, body: string) => call<TicketMessage>("POST", `/support/tickets/${id}/messages`, { body }),
  close: (id: string) => call<Ticket>("POST", `/support/tickets/${id}/close`),
};

export const supportAdmin = {
  list: (f: { status?: TicketStatus; assigned?: "me" | "none"; q?: string } = {}) =>
    call<{ items: Ticket[]; total: number; counts: Partial<Record<TicketStatus, number>> }>("GET", `/admin/support/tickets${qs(f)}`),
  get: (id: string) => call<TicketDetail>("GET", `/admin/support/tickets/${id}`),
  update: (id: string, d: { status?: TicketStatus; priority?: "low" | "normal" | "high"; assignedTo?: "me" | null }) => call<Ticket>("PATCH", `/admin/support/tickets/${id}`, d),
  reply: (id: string, body: string) => call<TicketMessage>("POST", `/admin/support/tickets/${id}/messages`, { body }),
};

// ── Announcements ───────────────────────────────────────────────────────────
export type Severity = "info" | "warning" | "critical";
export interface ActiveAnnouncement {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  linkUrl: string | null;
}
export interface Announcement extends ActiveAnnouncement {
  startsAt: string;
  endsAt: string | null;
  status: "draft" | "published" | "archived";
  createdAt: string;
}

// Public; failures just mean "no banner".
export async function getActiveAnnouncements(): Promise<ActiveAnnouncement[]> {
  try {
    const base = typeof window === "undefined" ? DIRECT_BASE : PROXY_BASE;
    const res = await fetch(`${base}/announcements/active`, typeof window === "undefined" ? { next: { revalidate: 60 } } : { cache: "no-store" });
    const body = await res.json();
    return body.success ? (body.data as ActiveAnnouncement[]) : [];
  } catch {
    return [];
  }
}

export const announcementsAdmin = {
  list: () => call<Announcement[]>("GET", "/admin/announcements"),
  create: (d: { title: string; body: string; severity: Severity; linkUrl?: string; startsAt?: string; endsAt?: string | null }) => call<Announcement>("POST", "/admin/announcements", d),
  update: (id: string, d: Partial<{ title: string; body: string; severity: Severity; linkUrl: string; startsAt: string; endsAt: string | null; status: Announcement["status"] }>) => call<Announcement>("PATCH", `/admin/announcements/${id}`, d),
};

// ── Notifications triggered by staff (seller outcomes) ──────────────────────
export const notifyUser = (d: { userId: string; type: "seller" | "listing" | "order" | "support"; title: string; body: string; url?: string }) =>
  call<{ sent: boolean }>("POST", "/admin/notify", d);
