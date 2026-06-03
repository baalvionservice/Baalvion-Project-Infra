import { tokenStore } from "@/lib/tokenStore";

const BASE = import.meta.env.VITE_API_PLATFORM_BASE_URL || 'https://api.baalvion.com/api/v1/infrastructure/proxy/v1';

// Access token lives in memory (P0); shared with AuthContext via tokenStore.
const getToken = () => tokenStore.getAccess();

const getOrgId = (): string => {
  const user = tokenStore.getUser();
  if (user?.orgId) return user.orgId;
  return "a0000000-0000-0000-0000-000000000001";
};

async function request<T>(
  method: string,
  path: string,
  body?: object,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Org-Id": getOrgId(),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = `${BASE}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.error?.message || `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { status: number; code: string };
    err.status = res.status;
    err.code = json?.error?.code || "UNKNOWN_ERROR";
    throw err;
  }

  return (json.data ?? json) as T;
}

const get = <T>(path: string, params?: Record<string, string | number | undefined>) =>
  request<T>("GET", path, undefined, params);

const post = <T>(path: string, body?: object) => request<T>("POST", path, body);
const put = <T>(path: string, body?: object) => request<T>("PUT", path, body);
const del = <T>(path: string) => request<T>("DELETE", path);

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => get<DashboardSummary>("/dashboard/summary"),
};

// ─── Proxies ─────────────────────────────────────────────────────────────────
export const proxyApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string; type?: string; country?: string }) =>
    get<Paginated<Proxy>>("/proxies", params as Record<string, string | number | undefined>),
  get: (id: string) => get<Proxy>(`/proxies/${id}`),
  create: (data: Partial<Proxy>) => post<Proxy>("/proxies", data),
  update: (id: string, data: Partial<Proxy>) => put<Proxy>(`/proxies/${id}`, data),
  delete: (id: string) => del<void>(`/proxies/${id}`),
  rotate: (id: string) => post<Proxy>(`/proxies/${id}/rotate`),
  test: (data: { url: string; proxyId?: string; type?: string; country?: string }) =>
    post<ProxyTestResult>("/proxies/test", data),
  getLogs: (id: string, params?: { page?: number; pageSize?: number }) =>
    get<Paginated<ProxyLog>>(`/proxies/${id}/logs`, params as Record<string, string | number | undefined>),
  export: (format: "csv" | "json" | "txt") => post<{ url: string }>("/proxies/export", { format }),
};

// ─── Presets ─────────────────────────────────────────────────────────────────
export const presetApi = {
  list: () => get<Paginated<Preset>>("/presets"),
  create: (data: Partial<Preset>) => post<Preset>("/presets", data),
  update: (id: string, data: Partial<Preset>) => put<Preset>(`/presets/${id}`, data),
  delete: (id: string) => del<void>(`/presets/${id}`),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getBandwidth: (params?: { days?: number }) => get<TimeSeriesData[]>("/analytics/bandwidth", params as Record<string, number | undefined>),
  getSuccessRate: (params?: { days?: number }) => get<TimeSeriesData[]>("/analytics/success-rate", params as Record<string, number | undefined>),
  getTopCountries: () => get<TopEntry[]>("/analytics/top-countries"),
  getTopDomains: () => get<TopEntry[]>("/analytics/top-domains"),
  getLatencyDistribution: () => get<LatencyBucket[]>("/analytics/latency-distribution"),
  getAnomalies: () => get<Anomaly[]>("/analytics/anomalies"),
};

// ─── Billing ─────────────────────────────────────────────────────────────────
export const billingApi = {
  getSubscription: () => get<Subscription>("/billing/subscription"),
  getPlans: () => get<Plan[]>("/billing/plans"),
  getInvoices: (params?: { page?: number; pageSize?: number }) =>
    get<Paginated<Invoice>>("/billing/invoices", params as Record<string, number | undefined>),
  getInvoice: (id: string) => get<Invoice>(`/billing/invoices/${id}`),
  changePlan: (planSlug: string) => post<Subscription>("/billing/change-plan", { planSlug }),
  // Activate the org's subscription for a plan AFTER a successful payment (trial → active).
  activate: (planSlug: string) => post<Subscription>("/billing/activate", { planSlug }),
  // Pay-As-You-Go prepaid credit wallet.
  getCredit: () => get<{ balanceUsd: number; gbRemaining: number; usdPerGb: number }>("/billing/credit"),
  buyCredit: (amountUsd: number) =>
    post<{ balanceUsd: number; gbRemaining: number; usdPerGb: number; planSlug: string }>("/billing/credit", { amountUsd }),
  getPaymentMethods: () => get<PaymentMethod[]>("/billing/payment-methods"),
  addPaymentMethod: (data: Partial<PaymentMethod>) => post<PaymentMethod>("/billing/payment-methods", data),
  deletePaymentMethod: (id: string) => del<void>(`/billing/payment-methods/${id}`),
  // Backend currently returns { predicted, limit, trend }; older/full shape uses
  // { projectedGb, daysRemaining, willExceed, overageGb }. Normalize so the UI never
  // receives undefined numeric fields (these were white-screening Billing pages).
  getUsageForecast: async (): Promise<UsageForecast> => {
    const raw = (await get<Record<string, unknown>>("/billing/usage-forecast")) || {};
    const projectedGb = Number(raw.projectedGb ?? raw.predicted ?? 0);
    const limit = Number(raw.limit ?? raw.bandwidthLimitGb ?? 0);
    const overageGb = raw.overageGb != null ? Number(raw.overageGb) : Math.max(0, projectedGb - limit);
    const willExceed = raw.willExceed != null ? Boolean(raw.willExceed) : limit > 0 && projectedGb > limit;
    let daysRemaining = raw.daysRemaining != null ? Number(raw.daysRemaining) : NaN;
    if (Number.isNaN(daysRemaining)) {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
    }
    return { projectedGb, daysRemaining, willExceed, overageGb };
  },
};

// ─── Organisation ─────────────────────────────────────────────────────────────
export const orgApi = {
  get: () => get<Organization>("/org"),
  update: (data: Partial<Organization>) => put<Organization>("/org", data),
  listMembers: () => get<OrgMember[]>("/org/members"),
  inviteMember: (data: { email: string; role: string }) => post<OrgMember>("/org/members/invite", data),
  updateMemberRole: (id: string, role: string) => put<OrgMember>(`/org/members/${id}/role`, { role }),
  removeMember: (id: string) => del<void>(`/org/members/${id}`),
  // Backend returns role rows keyed { key, label, description, permissions }; the UI
  // model is { id, name, permissions, isSystem }. Normalize so name is never undefined.
  listRoles: async (): Promise<RoleDefinition[]> => {
    const rows = (await get<Array<Record<string, unknown>>>("/org/roles")) || [];
    return rows.map((r) => ({
      id: String(r.id ?? r.key ?? r.name ?? ""),
      name: String(r.name ?? r.label ?? r.key ?? "role"),
      permissions: Array.isArray(r.permissions) ? (r.permissions as string[]) : [],
      isSystem: Boolean(r.isSystem ?? r.is_system ?? true),
    }));
  },
  getActivity: (params?: { page?: number }) =>
    get<Paginated<ActivityEntry>>("/org/activity", params as Record<string, number | undefined>),
};

// ─── API Keys ─────────────────────────────────────────────────────────────────
export const apiKeyApi = {
  list: () => get<ApiKey[]>("/api-keys"),
  create: (data: { name: string; permissions?: string[]; scopes?: string[]; keyType?: "api" | "proxy" }) =>
    post<ApiKeyCreated>("/api-keys", data),
  revoke: (id: string) => post<void>(`/api-keys/${id}/revoke`),
  delete: (id: string) => del<void>(`/api-keys/${id}`),
};

// ─── Public marketing data (no auth required) ──────────────────────────────────
export interface PublicPlan { slug: string; name: string; price: number; bandwidth: string; bandwidthGb: number; features: string[]; popular: boolean; }
export interface PublicStatusService { name: string; status: string; uptime: string; }
export interface PublicStatusDay { date: string; status: string; uptime: number; incident?: string; }
export interface PublicStatus { overall: string; services: PublicStatusService[]; history: PublicStatusDay[]; }
export interface PublicStats { activeProxies: number; countriesCovered: number; providers: number; customers: number; successRate: number; uptime: number; }
export interface PublicCaseStudy { id: number; title: string; company: string; improvement: string; metric: string; description: string; }
export interface PublicApiEndpoint { method: string; endpoint: string; description: string; }
export const publicApi = {
  plans: () => get<PublicPlan[]>("/public/plans"),
  status: () => get<PublicStatus>("/public/status"),
  stats: () => get<PublicStats>("/public/stats"),
  caseStudies: () => get<PublicCaseStudy[]>("/public/case-studies"),
  apiReference: () => get<PublicApiEndpoint[]>("/public/api-reference"),
};

// ─── Exports (inline-content downloads) ────────────────────────────────────────
export interface InlineExport { filename: string; contentType: string; content: string; }
function saveInline(exp: InlineExport) {
  const blob = new Blob([exp.content ?? ""], { type: exp.contentType || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exp.filename || "export";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
export const exportApi = {
  auditLogs: async () => saveInline(await get<InlineExport>("/audit-logs/export")),
  analytics: async () => saveInline(await get<InlineExport>("/analytics/export")),
  usageLogs: async () => saveInline(await post<InlineExport>("/exports/usage-logs")),
  apiLogs: async () => saveInline(await post<InlineExport>("/exports/api-logs")),
  accountData: async () => saveInline(await post<InlineExport>("/exports/account-data")),
  proxies: async () => saveInline(await post<InlineExport>("/proxies/export", { format: "csv" })),
};

// ─── Account (self-service) ────────────────────────────────────────────────────
export interface MyProfile { id: string; email: string; name?: string; fullName?: string; company?: string; timezone?: string; role?: string; }
export const accountApi = {
  getProfile: () => get<MyProfile>("/users/me"),
  updateProfile: (data: { name?: string; company?: string; timezone?: string }) =>
    put<MyProfile>("/users/me", data),
  changePassword: (oldPassword: string, newPassword: string) =>
    post<{ ok: boolean }>("/users/change-password", { oldPassword, newPassword }),
};

// ─── Security (sessions, IP allowlist, login history, MFA) ─────────────────────
export interface SecuritySession {
  id: string; ipAddress?: string; userAgent?: string; expiresAt?: string; current?: boolean;
}
export interface LoginHistoryEntry {
  id: string; ipAddress?: string; userAgent?: string; success?: boolean; createdAt: string;
}
export const securityApi = {
  getIpAllowlist: () => get<string[]>("/security/ip-allowlist"),
  addIp: (ip: string) => post<string[]>("/security/ip-allowlist", { ip }),
  removeIp: (ip: string) => del<string[]>(`/security/ip-allowlist/${encodeURIComponent(ip)}`),
  listSessions: () => get<SecuritySession[]>("/security/sessions"),
  revokeSession: (id: string) => del<void>(`/security/sessions/${id}`),
  getLoginHistory: () => get<LoginHistoryEntry[]>("/security/login-history"),
  enableMfa: () => post<{ qrCodeUrl: string; secret?: string }>("/auth/mfa/enable"),
  verifyMfa: (code: string) => post<{ enabled: boolean }>("/auth/mfa/verify", { code }),
  disableMfa: () => post<{ disabled: boolean }>("/auth/mfa/disable"),
};

// ─── Developer / Proxy gateway API (/v1/developer) ─────────────────────────────
export const developerApi = {
  me: () => get<DeveloperContext>("/developer/me"),
  listProxySessions: () => get<ProxySession[]>("/developer/proxy/sessions"),
  rotateKey: (id: string) => post<{ id: string; key: string; message: string }>(`/developer/keys/${id}/rotate`),
};

// Realtime usage is polled from /usage/realtime (EventSource can't send the
// Authorization header; the SSE endpoint /usage/stream remains for header-less
// consumers). Projected overage comes from the billing engine.
export const usageRealtimeApi = {
  realtime: () => get<RealtimeUsage>("/usage/realtime"),
  projectedOverage: () => get<ProjectedOverage>("/billing/projected-overage"),
};

// ─── Privacy / Trust / KYC (customer self-service) ────────────────────────────
export const privacyApi = {
  trustStatus: () => get<TrustStatus>("/account/trust/status"),
  recordConsent: (data: { purpose: string; granted: boolean; version?: string }) =>
    post<{ ok: boolean }>("/account/privacy/consent", data),
  requestExport: () => post<{ id: string; downloadUrl: string }>("/account/privacy/export"),
  downloadExport: (id: string) => get<Record<string, unknown>>(`/account/privacy/export/${id}/download`),
  requestDelete: (scope: "me" | "org") => post<{ id: string; anonymized: number }>("/account/privacy/delete", { scope }),
  startKyc: (data: { subjectType?: "individual" | "business"; country?: string }) =>
    post<{ provider: string; applicantId: string | null }>("/kyc/start", data),
};

export interface TrustStatus {
  kycStatus: string;
  riskLevel: string;
  accountStatus: string;
  latestRisk: { score: number; level: string; computed_at: string } | null;
}

// ─── Enterprise (org-admin self-service) ──────────────────────────────────────
export const enterpriseApi = {
  getSso: () => get<SsoConnection | null>("/enterprise/sso"),
  upsertSso: (data: Record<string, unknown>) => put<{ ok: boolean; acsUrl: string; metadataUrl: string }>("/enterprise/sso", data),
  listScimTokens: () => get<Array<{ id: string; token_prefix: string; created_at: string; revoked_at: string | null }>>("/enterprise/scim/tokens"),
  createScimToken: () => post<{ token: string; baseUrl: string; message: string }>("/enterprise/scim/tokens"),
  revokeScimToken: (id: string) => post<void>(`/enterprise/scim/tokens/${id}/revoke`),
  listRoles: () => get<{ builtIn: string[]; custom: CustomRole[] }>("/enterprise/roles"),
  createRole: (data: { name: string; description?: string; inherits?: string[]; permissions?: string[] }) => post<{ id: string }>("/enterprise/roles", data),
  getPolicies: () => get<Record<string, Record<string, unknown>>>("/enterprise/policies"),
  setPolicy: (data: { policyType: string; config: Record<string, unknown>; enabled?: boolean }) => post<void>("/enterprise/policies", data),
  getSla: () => get<{ definition: SlaDefinition; periods: SlaPeriod[] }>("/enterprise/sla"),
  setSla: (data: Record<string, unknown>) => post<void>("/enterprise/sla", data),
  getWhiteLabel: () => get<WhiteLabel | null>("/enterprise/white-label"),
  upsertWhiteLabel: (data: Record<string, unknown>) => post<void>("/enterprise/white-label", data),
  listWhiteLabelDomains: () => get<WhiteLabelDomain[]>("/enterprise/white-label/domains"),
  addWhiteLabelDomain: (domain: string) => post<{ id: number; domain: string; verifyToken: string; instructions: string }>("/enterprise/white-label/domains", { domain }),
  verifyWhiteLabelDomain: (id: number) => post<{ id: number; verified: boolean }>(`/enterprise/white-label/domains/${id}/verify`),
};

export interface WhiteLabelDomain { id: number; domain: string; verified: boolean; cert_status: string; created_at: string; }

// Public (no auth) — affiliate click tracking + white-label branding resolution.
export const referralApi = {
  track: (code: string, visitorId?: string) => post<{ tracked: boolean }>("/referral/track", { code, visitorId }),
};
export const brandingApi = {
  resolve: (domain: string) => get<BrandingConfig | null>("/white-label/resolve", { domain }),
};
export interface BrandingConfig {
  org_id: string; domain: string; brand_name?: string; logo_url?: string; primary_color?: string;
  support_email?: string; login_bg_url?: string; custom_css?: string;
}

export interface SsoConnection {
  id: string; type: "saml" | "oidc"; enabled: boolean;
  idp_entity_id?: string; idp_sso_url?: string; oidc_issuer?: string; oidc_client_id?: string;
  attribute_map?: Record<string, string>; group_role_map?: Record<string, string>; default_role?: string;
}
export interface CustomRole { id: string; name: string; description?: string; inherits: string[]; permissions: string[]; }
export interface SlaDefinition { uptime_target: number; latency_target_ms: number; success_target: number; }
export interface SlaPeriod { period_start: string; uptime: number; success_rate: number; violated: boolean; credit_amount: number; }
export interface WhiteLabel { domain?: string; brand_name?: string; primary_color?: string; logo_url?: string; support_email?: string; enabled?: boolean; }

// Proxy gateway connection target (the Go data plane). Configurable per env.
export const PROXY_GATEWAY = {
  host: import.meta.env.VITE_PROXY_GATEWAY_HOST || "gw.baalvion.net",
  httpPort: Number(import.meta.env.VITE_PROXY_GATEWAY_HTTP_PORT || 10000),
  socksPort: Number(import.meta.env.VITE_PROXY_GATEWAY_SOCKS_PORT || 1080),
};

// ─── Usage ─────────────────────────────────────────────────────────────────
export const usageApi = {
  getSummary: () => get<UsageSummary>("/usage/summary"),
  getHistory: (params?: { days?: number }) =>
    get<UsageHistory[]>("/usage/history", params as Record<string, number | undefined>),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  list: () => get<Notification[]>("/notifications"),
  markRead: (id: string) => put<void>(`/notifications/${id}/read`),
  markAllRead: () => post<void>("/notifications/mark-all-read"),
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: { page?: number; pageSize?: number; action?: string }) =>
    get<Paginated<AuditLogEntry>>("/audit-logs", params as Record<string, number | string | undefined>),
};

// ─── Support Tickets (user-facing) ───────────────────────────────────────────
export const supportApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    get<SupportTicket[]>("/support/tickets", params as Record<string, number | undefined>),
  create: (data: { subject: string; message: string; priority?: string }) =>
    post<SupportTicket>("/support/tickets", data),
  reply: (ticketId: string, message: string) =>
    post<void>(`/support/tickets/${ticketId}/reply`, { message }),
};

// ─── Sub-users (org members as sub-users) ────────────────────────────────────
export const subUserApi = {
  list: () => get<OrgMember[]>("/org/members"),
  invite: (data: { email: string; role: string; bandwidthLimit?: number }) =>
    post<OrgMember>("/org/members/invite", data),
  updateRole: (id: string, role: string) => put<OrgMember>(`/org/members/${id}/role`, { role }),
  remove: (id: string) => del<void>(`/org/members/${id}`),
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Proxy {
  id: string;
  orgId: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  country: string;
  type: "residential" | "datacenter" | "mobile" | "isp";
  protocol: "http" | "https" | "socks5";
  status: "healthy" | "degraded" | "offline";
  providerId?: string;
  bandwidthUsedGb: number;
  bandwidthLimitGb?: number;
  successRate?: number;
  avgLatency?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProxyTestResult {
  success: boolean;
  statusCode?: number;
  latency?: number;
  ip?: string;
  location?: string;
  headers?: Record<string, string>;
  error?: string;
}

export interface ProxyLog {
  id: string;
  proxyId: string;
  statusCode: number;
  latency: number;
  ip: string;
  location: string;
  createdAt: string;
}

export interface Preset {
  id: string;
  orgId: string;
  name: string;
  country?: string;
  type?: string;
  protocol?: string;
  rotation?: string;
  createdAt: string;
}

export interface DashboardSummary {
  activeProxies: number;
  totalRequests: number;
  successRate: number;
  avgLatency: number;
  bandwidthUsedGb: number;
  bandwidthLimitGb: number;
  bandwidthChangePercent?: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface TopEntry {
  label: string;
  value: number;
  percent?: number;
}

export interface LatencyBucket {
  label: string;
  count: number;
}

export interface Anomaly {
  date: string;
  metric: string;
  deviation: number;
  severity: string;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  monthlyPrice: number;
  bandwidthLimitGb: number;
  enforcementMode: string;
  features: string[];
}

export interface Subscription {
  id: string;
  orgId: string;
  planSlug: string;
  status: "active" | "past_due" | "cancelled" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
}

export interface Invoice {
  id: string;
  orgId: string;
  subscriptionId?: string;
  amount: number;
  tax?: number;
  total?: number;
  status: "paid" | "pending" | "failed" | "refunded";
  issuedAt: string;
  dueAt?: string;
}

export interface PaymentMethod {
  id: string;
  orgId: string;
  type: "card" | "wallet" | "bank";
  brand?: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  status: string;
  planSlug: string;
  bandwidthLimitGb: number;
  bandwidthUsedGb: number;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: string;
  email?: string;
  name?: string;
  status?: string;
  bandwidthLimit?: number;
  bandwidthUsed?: number;
  createdAt: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface ActivityEntry {
  id: string;
  actorUserId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  keyPrefix: string;
  keyType?: "api" | "proxy";
  scopes?: string[];
  createdBy?: string;
  revokedAt?: string | null;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  rawKey: string;
}

export interface DeveloperContext {
  type: string;
  organizationId: string;
  plan: string | null;
  scopes: string[];
  permissions: string[];
}

export interface ProxySession {
  id: string;
  sessionToken: string;
  rotation: string;
  country: string | null;
  zone: string | null;
  status: string;
  connection: {
    host: string;
    port: number;
    username: string;
    passwordHint: string;
  };
}

export interface RealtimeUsage {
  orgId: string;
  periodBytes: number;
  periodGb: number;
  activeSessions: number;
  ts: number;
}

export interface ProjectedOverage {
  totalGb: number;
  includedGb: number;
  overageGb: number;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: Array<{ kind: string; description: string; quantity: number; unitPrice: number; amount: number }>;
}

export interface UsageSummary {
  bandwidthUsedGb: number;
  bandwidthLimitGb: number;
  totalRequests: number;
  successRate: number;
  avgLatency: number;
}

export interface UsageHistory {
  id: string;
  date: string;
  bandwidth: number;
  requests: number;
  successRate: number;
  avgLatency: number;
}

export interface UsageForecast {
  projectedGb: number;
  daysRemaining: number;
  willExceed: boolean;
  overageGb?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  message?: string;
  type?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  orgId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  orgId: string;
  subject: string;
  status: string;
  priority: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Network Analytics + AI Insights (Prompt 10, org-scoped) ───────────────────
export const networkAnalyticsApi = {
  geoHeatmap: () => get<GeoHeatCell[]>("/analytics/geo-heatmap"),
  trafficIntelligence: () => get<TrafficIntelligence>("/analytics/traffic-intelligence"),
  providerMix: () => get<ProviderMixRow[]>("/analytics/provider-mix"),
  bandwidthForecast: (horizon?: number) =>
    get<BandwidthForecast>("/analytics/forecast/bandwidth", horizon ? { horizon } : undefined),
  quotaForecast: () => get<QuotaForecast>("/analytics/forecast/quota"),
  slaRisk: () => get<SlaRiskInsight>("/analytics/sla-risk"),
};

export interface GeoHeatCell { country: string; requests: number; gb: number; p50Latency: number; p95Latency: number; }
export interface TrafficIntelligence {
  latencyDistribution: Array<{ label: string; count: number }>;
  topDomains: Array<{ label: string; value: number }>;
}
export interface ProviderMixRow { provider: string; gb: number; requests: number; share: number; }
export interface ForecastPointC { date: string; yhat: number; lower?: number; upper?: number; }
export interface BandwidthForecast { entityId: string; points: ForecastPointC[]; total: number; seasonal?: boolean; insufficientData?: boolean; }
export interface QuotaForecast {
  orgId: string; includedGb?: number; ceilingGb?: number; usedGb?: number; dailyRateGb?: number;
  daysToIncluded?: number | null; daysToCeiling?: number | null; insufficientData?: boolean;
}
export interface SlaRiskInsight {
  orgId: string; risk: number; uptime: number; latencyP95: number; latencyTrend: number; targetUptime: number; latencyBudget: number;
}

// ─── Marketplace catalog + Partner self-service (Prompt 17, org-scoped) ─────────
export const marketplaceCatalogApi = {
  catalog: (category?: string) => get<MarketplaceProduct[]>("/marketplace/catalog", category ? { category } : undefined),
  price: (sku: string, qty: number, region?: string, promo?: string) =>
    get<PricedSku>("/marketplace/price", { sku, qty, region, promo }),
  createQuote: (items: Array<{ sku: string; qty: number }>, region?: string, promo?: string) =>
    post<QuoteResult>("/marketplace/quote", { items, region, promo }),
};

export const partnerApi = {
  me: () => get<ResellerProfile>("/partner/me"),
  customers: () => get<ResellerCustomer[]>("/partner/customers"),
  addCustomer: (data: { customerOrgId: string; quotaGb?: number; country?: string; customPricing?: Record<string, unknown> }) =>
    post<unknown>("/partner/customers", data),
  createSubReseller: (data: { orgId: string; marginPct: number }) => post<{ id: string }>("/partner/sub-resellers", data),
  commissions: () => get<CommissionRollup[]>("/partner/commissions"),
  requestPayout: (method = "manual") => post<PayoutRequestResult>("/partner/payouts/request", { method }),
};

export interface MarketplaceProduct { sku: string; name: string; category: string; base_price: number; unit: string; currency: string; metadata?: Record<string, unknown>; }
export interface PricedSku { sku: string; currency: string; unitPrice: number; qty: number; gross: number; volumeDiscount: number; promoDiscount: number; total: number; discount: number; bonusGb: number; }
export interface QuoteResult { quoteId: string | null; subtotal: number; discount: number; total: number; items: PricedSku[]; }
export interface ResellerProfile { id: string; org_id: string; tier: string; status: string; margin_pct: number; wholesale_discount: number; quota_gb?: number; kyb_status?: string; }
export interface ResellerCustomer { customer_org_id: string; quota_gb?: number; status: string; created_at: string; }
export interface CommissionRollup { basis: string; status: string; amount: number; n: number; }
export interface PayoutRequestResult { ok: boolean; payoutId?: string; status?: string; net?: number; gross?: number; fees?: number; reason?: string; eligible?: boolean; }
