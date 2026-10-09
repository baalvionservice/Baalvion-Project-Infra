// Bug-bounty client: tasks, rules acceptance, vulnerability reports, and the private
// hunter<->admin thread. Browser-only (everything needs a session), so it always goes
// through the same-origin proxy that turns the httpOnly cookie into a Bearer token.

import { ApiError } from "./nightlife";

export { ApiError };

const PROXY_BASE = "/api/community-proxy";

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

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";
export interface BountyTask {
  id: string;
  title: string;
  target: string;
  difficulty: Difficulty;
  rewardLabel: string;
  description: string;
  rules: string | null;
  status: "draft" | "open" | "closed";
}
export type PayoutMethod = "bank_transfer" | "upi" | "btc" | "usdt" | "other";
export interface Payout {
  method: PayoutMethod;
  amount: number;
  currency: string;
  reference: string;
  paidAt?: string;
}
export type ReportStatus = "submitted" | "triaged" | "accepted" | "rejected" | "duplicate" | "paid";
export interface BountyReport {
  id: string;
  taskId: string;
  title: string;
  description: string;
  evidenceLinks: string[];
  status: ReportStatus;
  reviewerNote: string | null;
  rewardNote: string | null;
  payout?: Payout | null;
  createdAt: string;
  task?: { id: string; title: string };
  userId?: string;
  reporter?: string | null;
}
export interface ThreadMessage {
  id: string;
  fromAdmin: boolean;
  content: string;
  createdAt: string;
  senderLabel: string | null;
}
export interface ThreadSummary {
  userId: string;
  lastAt: string;
  lastMessage: string;
  hunter: string | null;
  unread: number;
}

export const bounty = {
  status: () => call<{ accepted: boolean; rulesVersion: string }>("GET", "/bounty/status"),
  accept: () => call<{ accepted: boolean }>("POST", "/bounty/accept"),
  tasks: () => call<BountyTask[]>("GET", "/bounty/tasks"),
  report: (d: { taskId: string; title: string; description: string; evidenceLinks: string[] }) =>
    call<BountyReport>("POST", "/bounty/reports", d),
  myReports: () => call<BountyReport[]>("GET", "/bounty/reports/mine"),
  thread: (after?: string) => call<ThreadMessage[]>("GET", `/bounty/thread${after ? `?after=${encodeURIComponent(after)}` : ""}`),
  send: (content: string) => call<ThreadMessage>("POST", "/bounty/thread", { content }),
  unread: () => call<{ unread: number }>("GET", "/bounty/unread"),
};

export const bountyAdmin = {
  tasks: () => call<BountyTask[]>("GET", "/admin/bounty/tasks"),
  createTask: (d: Omit<BountyTask, "id" | "status">) => call<BountyTask>("POST", "/admin/bounty/tasks", d),
  updateTask: (id: string, d: Partial<Omit<BountyTask, "id">>) => call<BountyTask>("PATCH", `/admin/bounty/tasks/${id}`, d),
  reports: (status?: ReportStatus) =>
    call<{ items: BountyReport[] }>("GET", `/admin/bounty/reports${status ? `?status=${status}` : ""}`).then((r) => r.items),
  review: (id: string, d: { status: Exclude<ReportStatus, "submitted">; reviewerNote?: string; rewardNote?: string; payout?: Omit<Payout, "paidAt"> }) =>
    call<BountyReport>("PATCH", `/admin/bounty/reports/${id}`, d),
  threads: () => call<ThreadSummary[]>("GET", "/admin/bounty/threads"),
  thread: (userId: string, after?: string) =>
    call<ThreadMessage[]>("GET", `/admin/bounty/threads/${userId}${after ? `?after=${encodeURIComponent(after)}` : ""}`),
  reply: (userId: string, content: string) => call<ThreadMessage>("POST", `/admin/bounty/threads/${userId}`, { content }),
};
