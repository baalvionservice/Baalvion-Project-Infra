import { tokenStore } from "@/lib/tokenStore";

const BASE = import.meta.env.VITE_API_PLATFORM_BASE_URL || "https://api.baalvion.com/api/v1/infrastructure/proxy/v1";

// Access token lives in memory (P0); shared with AuthContext via tokenStore.
const getToken = () => tokenStore.getAccess();

async function request<T>(
  method: string,
  path: string,
  body?: object,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
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
export const adminDashboardApi = {
  get: () => get<AdminDashboard>("/admin/dashboard"),
};

// ─── Tenants / Orgs ──────────────────────────────────────────────────────────
export const adminTenantApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    get<Paginated<AdminTenant>>("/admin/tenants", params as Record<string, number | undefined>),
  get: (orgId: string) => get<AdminTenant>(`/admin/tenants/${orgId}`),
  suspend: (orgId: string) => put<void>(`/admin/tenants/${orgId}/suspend`),
  reactivate: (orgId: string) => put<void>(`/admin/tenants/${orgId}/reactivate`),
  overrideBandwidth: (orgId: string, bandwidthLimitGb: number) =>
    post<AdminTenant>(`/admin/tenants/${orgId}/override-bandwidth`, { bandwidthLimitGb }),
  overrideCredits: (orgId: string, credits: number) =>
    post<AdminTenant>(`/admin/tenants/${orgId}/override-credits`, { credits }),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const adminUserApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    get<Paginated<AdminUser>>("/admin/users", params as Record<string, number | undefined>),
  ban: (id: string) => put<void>(`/admin/users/${id}/ban`),
  suspend: (id: string) => put<void>(`/admin/users/${id}/suspend`),
  reactivate: (id: string) => put<void>(`/admin/users/${id}/reactivate`),
};

// ─── Providers ───────────────────────────────────────────────────────────────
export const adminProviderApi = {
  list: () => get<AdminProvider[]>("/admin/providers"),
  get: (id: string) => get<{ provider: AdminProvider; healthHistory: AdminProviderHealth[] }>(`/admin/providers/${id}`),
  create: (data: Partial<AdminProvider>) => post<AdminProvider>("/admin/providers", data),
  update: (id: string, data: Partial<AdminProvider>) => put<AdminProvider>(`/admin/providers/${id}`, data),
  delete: (id: string) => del<void>(`/admin/providers/${id}`),
  getHealth: (id: string) => get<AdminProviderHealth[]>(`/admin/providers/${id}/health`),
  getIncidents: (id: string) => get<AdminProviderIncident[]>(`/admin/providers/${id}/incidents`),
};

// ─── Routing Rules ───────────────────────────────────────────────────────────
export const adminRoutingApi = {
  list: () => get<AdminRoutingRule[]>("/admin/routing-rules"),
  create: (data: Partial<AdminRoutingRule>) => post<AdminRoutingRule>("/admin/routing-rules", data),
  update: (id: string, data: Partial<AdminRoutingRule>) => put<AdminRoutingRule>(`/admin/routing-rules/${id}`, data),
  delete: (id: string) => del<void>(`/admin/routing-rules/${id}`),
  reorder: (ids: string[]) => post<void>("/admin/routing-rules/reorder", { ids }),
};

// ─── System ──────────────────────────────────────────────────────────────────
export const adminSystemApi = {
  getServices: () => get<AdminSystemService[]>("/admin/system/services"),
  getMetrics: () => get<AdminSystemMetrics>("/admin/system/metrics"),
};

// ─── Abuse / Rate Limits ─────────────────────────────────────────────────────
export const adminAbuseApi = {
  listLogs: (params?: { page?: number; pageSize?: number }) =>
    get<Paginated<AdminAbuseLog>>("/admin/abuse/logs", params as Record<string, number | undefined>),
  resolveLog: (id: string) => put<void>(`/admin/abuse/logs/${id}/resolve`),
  // Backend returns { id, key, windowMs, max }; the UI model is
  // { id, name, requestsPerMinute, requestsPerHour, burstLimit, enabled }. Normalize so
  // numeric fields are never undefined (these were white-screening the Abuse page).
  getRateLimits: async (): Promise<AdminRateLimit[]> => {
    const rows = (await get<Array<Record<string, unknown>>>("/admin/abuse/rate-limits")) || [];
    return rows.map((r) => {
      const windowMs = Number(r.windowMs ?? 60_000);
      const max = Number(r.max ?? r.requestsPerMinute ?? 0);
      const perMin = windowMs > 0 ? Math.round((max * 60_000) / windowMs) : max;
      return {
        id: String(r.id ?? r.key ?? ""),
        name: String(r.name ?? r.key ?? "rule"),
        requestsPerMinute: Number(r.requestsPerMinute ?? perMin),
        requestsPerHour: Number(r.requestsPerHour ?? -1),
        burstLimit: Number(r.burstLimit ?? max),
        enabled: r.enabled != null ? Boolean(r.enabled) : true,
      };
    });
  },
  updateRateLimit: (id: string, data: Partial<AdminRateLimit>) =>
    put<AdminRateLimit>(`/admin/abuse/rate-limits/${id}`, data),
};

// ─── Revenue ─────────────────────────────────────────────────────────────────
export const adminRevenueApi = {
  getSummary: (period?: string) =>
    get<AdminRevenueSummary>("/admin/revenue/summary", period ? { period } : undefined),
  getCohortRetention: () => get<AdminCohortRetention>("/admin/revenue/cohort-retention"),
};

// ─── Feature Flags ───────────────────────────────────────────────────────────
export const adminFeatureFlagApi = {
  list: () => get<AdminFeatureFlag[]>("/admin/feature-flags"),
  update: (key: string, data: { enabled?: boolean; rollout?: number; conditions?: unknown }) =>
    put<AdminFeatureFlag>(`/admin/feature-flags/${key}`, data),
};

// ─── Support Tickets (admin view) ────────────────────────────────────────────
export const adminSupportApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string }) =>
    get<AdminSupportTicketPage>("/support/tickets", params as Record<string, number | string | undefined>),
  updateStatus: (ticketId: string, status: string) =>
    put<AdminSupportTicket>(`/support/tickets/${ticketId}/status`, { status }),
  reply: (ticketId: string, message: string) =>
    post<void>(`/support/tickets/${ticketId}/reply`, { message }),
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export const adminAuditApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    get<Paginated<AdminAuditLog>>("/admin/audit-logs", params as Record<string, number | undefined>),
  export: () => post<{ downloadUrl: string }>("/admin/audit-logs/export"),
};

// ─── Provider Orchestration (Prompt 5 control plane) ──────────────────────────
export const adminOrchestrationApi = {
  providerStates: () => get<ProviderStateRow[]>("/admin/orchestration/providers"),
  setCredentials: (id: string, data: { usernameTemplate: string; password: string; apiToken?: string; usageApiUrl?: string }) =>
    post<{ providerId: string; rotated: boolean }>(`/admin/orchestration/providers/${id}/credentials`, data),
  listPolicies: () => get<RoutingPolicy[]>("/admin/orchestration/routing-policies"),
  upsertPolicy: (data: Partial<RoutingPolicy>) => post<{ id: number }>("/admin/orchestration/routing-policies", data),
  ipIntelligence: (params?: { provider?: string; country?: string; limit?: number }) =>
    get<IpIntel[]>("/admin/orchestration/ip-intelligence", params as Record<string, string | number | undefined>),
  geoCoverage: () => get<GeoCoverage[]>("/admin/orchestration/geo-coverage"),
  activeSessions: () => get<OrchestrationSession[]>("/admin/orchestration/sessions"),
  banAnalytics: () => get<BanAnalytics>("/admin/orchestration/ban-analytics"),
};

// ─── Trust & Safety / compliance (Prompt 7) ───────────────────────────────────
export const adminTrustApi = {
  listCases: (status?: string) => get<ModerationCase[]>("/admin/trust/cases", status ? { status } : undefined),
  caseHistory: (id: string) => get<ModerationEvent[]>(`/admin/trust/cases/${id}/history`),
  createCase: (data: Partial<ModerationCase>) => post<{ id: string }>("/admin/trust/cases", data),
  transitionCase: (id: string, status: string, note?: string) => post<void>(`/admin/trust/cases/${id}/transition`, { status, note }),
  actOnCase: (id: string, action: string, params?: Record<string, unknown>, reason?: string) =>
    post<void>(`/admin/trust/cases/${id}/act`, { action, params, reason }),
  listKyc: (status?: string) => get<KycVerification[]>("/admin/trust/kyc", status ? { status } : undefined),
  decideKyc: (id: string, decision: "approve" | "reject", notes?: string) => post<void>(`/admin/trust/kyc/${id}/decide`, { decision, notes }),
  applyEnforcement: (orgId: string, action: string, params?: Record<string, unknown>, reason?: string) =>
    post<void>(`/admin/trust/enforcement/${orgId}`, { action, params, reason }),
  evaluateRisk: (orgId: string) => post<RiskResult>(`/admin/trust/risk/${orgId}`),
  destinationIntel: () => get<DestIntel[]>("/admin/trust/destination-intel"),
  refreshIntel: () => post<{ total: number }>("/admin/trust/destination-intel/refresh"),
  complianceReport: () => get<ComplianceReport>("/admin/trust/compliance-report"),
};

export interface ModerationCase {
  id: string; org_id: string | null; type: string; source?: string; status: string;
  severity: string; subject?: string; created_at: string; resolved_at?: string | null;
}
export interface ModerationEvent { id: number; action: string; from_status?: string; to_status?: string; note?: string; created_at: string; }
export interface KycVerification {
  id: string; org_id: string; subject_type: string; provider: string; status: string;
  country?: string; sanctions_hit: boolean; pep_hit: boolean; created_at: string;
}
export interface RiskResult { score: number; level: string; reasons: string[]; actions: string[]; }
export interface DestIntel { indicator: string; kind: string; source: string; category: string; score: number; expires_at: string; }
export interface ComplianceReport {
  kyc: { approved: number; rejected: number; open: number };
  moderation: { open: number; closed: number };
  enforcement: { active: number };
  gdpr: { exports: number; deletions: number };
  auditEntries: { n: number };
}

export interface ProviderStateRow {
  name: string;
  config: { kind?: string; proxy_type?: string; cost_per_gb?: number; weight?: number; enabled?: boolean } | null;
  health: { state: string; successRate?: number; latencyMs?: number; banRate?: number; lastError?: string; checkedAt?: string };
}
export interface RoutingPolicy {
  id?: number;
  name: string;
  planSlug?: string | null;
  strategy: string;
  country?: string | null;
  providerAllow?: string[];
  providerDeny?: string[];
  priority?: number;
  enabled?: boolean;
}
export interface IpIntel {
  ip: string; provider: string; asn: number; country: string; proxy_type: string;
  latency_ms: number; success_rate: number; ban_rate: number; health_score: number; last_seen: string;
}
export interface GeoCoverage { country: string; providers: number; entries: number; }
export interface OrchestrationSession {
  id: string; org_id: string; provider: string; country: string; rotation: string; started_at: string;
}
export interface BanAnalytics {
  providerBanRates: Array<{ name: string; banRate: number; state: string }>;
  last24h: Array<{ event_type: string; severity: string; n: number }>;
}

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

export interface AdminDashboard {
  totalTenants: number;
  totalUsers: number;
  providers: number;
  openIncidents: number;
}

export interface AdminTenant {
  id: string;
  slug: string;
  name: string;
  status: string;
  planSlug: string;
  bandwidthLimitGb: number;
  bandwidthUsedGb: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProvider {
  id: string;
  name: string;
  type: string;
  status: string;
  successRate: number;
  latency: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProviderHealth {
  id: string;
  providerId: string;
  latency: number;
  successRate: number;
  checkedAt: string;
}

export interface AdminProviderIncident {
  id: string;
  providerId: string;
  title: string;
  status: string;
  severity: string;
  startedAt: string;
  resolvedAt?: string;
}

export interface AdminRoutingRule {
  id: string;
  name: string;
  priority: number;
  condition: string;
  action: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminSystemService {
  name: string;
  status: string;
}

export interface AdminSystemMetrics {
  cpu: number;
  memory: number;
  rps: number;
  errorRate: number;
}

export interface AdminAbuseLog {
  id: string;
  orgId: string;
  eventType: string;
  severity: string;
  reason: string;
  resolved: boolean;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AdminRateLimit {
  id: string;
  name: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  enabled: boolean;
}

export interface AdminRevenueSummary {
  mrr: number;
  arr: number;
  churn: number;
  ltv: number;
  arpu: number;
}

export interface AdminCohortRetention {
  cohorts: Array<{ month: string; retention: number[] }>;
}

export interface AdminFeatureFlag {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  rolloutPercent: number;
  conditions: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AdminSupportTicket {
  id: string;
  orgId?: string;
  subject: string;
  status: string;
  priority: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSupportTicketPage {
  data: AdminSupportTicket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Global Edge Network (Prompt 9) ───────────────────────────────────────────
export const adminEdgeApi = {
  listRegions: () => get<EdgeRegion[]>("/admin/edge/regions"),
  upsertRegion: (data: Partial<EdgeRegion>) => post<{ code: string }>("/admin/edge/regions", data),
  recordHealth: (code: string, data: Partial<RegionHealthInput>) =>
    post<{ code: string; status: string }>(`/admin/edge/regions/${code}/health`, data),
  pickRegion: (country?: string) =>
    get<{ region: EdgeRegion | null }>("/admin/edge/regions/pick", country ? { country } : undefined),

  listAsn: (params?: { type?: string; limit?: number }) =>
    get<AsnIntel[]>("/admin/edge/asn", params as Record<string, string | number | undefined>),
  getAsn: (asn: number) => get<AsnIntel>(`/admin/edge/asn/${asn}`),
  upsertAsn: (data: Partial<AsnIntel> & { asn: number }) => post<{ asn: number; reputation: number }>("/admin/edge/asn", data),
  refreshAsn: () => post<{ refreshed: number; banned: number }>("/admin/edge/asn/refresh"),

  listPools: () => get<IpPool[]>("/admin/edge/pools"),
  createPool: (data: Partial<IpPool>) => post<{ id: string }>("/admin/edge/pools", data),
  addIPs: (poolId: string, data: { ips: string[]; asn?: number; country?: string; regionCode?: string }) =>
    post<{ added: number }>(`/admin/edge/pools/${poolId}/ips`, data),
  allocate: (data: { orgId: string; poolId: string; count?: number; geo?: string; slaTier?: string }) =>
    post<{ allocated: string[] }>("/admin/edge/pools/allocate", data),
  deallocate: (data: { orgId: string; ip: string }) => post<{ ok: boolean }>("/admin/edge/pools/deallocate", data),
  orgPool: (orgId: string) => get<DedicatedIp[]>(`/admin/edge/pools/org/${orgId}`),
};

export interface EdgeRegion {
  code: string; name: string; continent?: string; gateway_endpoint?: string;
  lat?: number; lon?: number; weight?: number; status?: string; enabled?: boolean;
}
export interface RegionHealthInput {
  latencyMs?: number; saturation?: number; activeTunnels?: number; successRate?: number; status?: string;
}
export interface AsnIntel {
  asn: number; name?: string; country?: string; type?: string;
  reputation: number; ban_rate?: number; success_rate?: number;
}
export interface IpPool {
  id: string; name: string; type: string; ip_version?: number; region_code?: string;
  provider?: string; asn?: number; rotation?: string; status?: string; available?: number; total?: number;
}
export interface DedicatedIp { ip: string; asn?: number; country?: string; region_code?: string; status: string; }

// ─── AI Network Intelligence (Prompt 10) ──────────────────────────────────────
export const adminIntelligenceApi = {
  listModels: () => get<MlModel[]>("/admin/intelligence/models"),
  modelMetrics: (name: string, metric = "auc", limit = 100) =>
    get<ModelMetric[]>(`/admin/intelligence/models/${name}/metrics`, { metric, limit }),
  promoteModel: (name: string, version: number) => post<{ name: string; version: number }>(`/admin/intelligence/models/${name}/promote`, { version }),

  trainBan: (days?: number) => post<BanTrainResult>("/admin/intelligence/ban/train", { days }),
  scoreBan: (days?: number) => post<{ routes: number; highRiskPublished: number }>("/admin/intelligence/ban/score", { days }),
  banProbabilities: (limit = 100) => get<BanProbability[]>("/admin/intelligence/ban/probabilities", { limit }),

  routeWeights: () => get<RouteWeights>("/admin/intelligence/routing/weights"),
  recomputeWeights: () => post<{ published: Record<string, number>; detail: RouteWeightDetail[] }>("/admin/intelligence/routing/weights"),
  predictiveFailover: () => post<{ actions: Array<{ provider: string; action: string; prewarm: string | null }> }>("/admin/intelligence/routing/predictive-failover"),

  refreshFeatures: () => post<{ providers: number; asns: number; geo: number }>("/admin/intelligence/features/refresh"),
  providerFeatures: () => get<ProviderFeature[]>("/admin/intelligence/features/providers"),
  asnQuality: (limit = 200) => get<AsnQuality[]>("/admin/intelligence/features/asn", { limit }),

  anomalies: (status?: string, limit = 100) =>
    get<AnomalyEvent[]>("/admin/intelligence/anomalies", { status, limit }),
  sweepAnomalies: () => post<{ bandwidth: number; providerInstability: number; fanout: number }>("/admin/intelligence/anomalies/sweep"),
  resolveAnomaly: (id: number, status: string) => put<{ id: number; status: string }>(`/admin/intelligence/anomalies/${id}/resolve`, { status }),

  latestForecasts: (metric?: string, limit = 200) =>
    get<ForecastRow[]>("/admin/intelligence/forecasts", { metric, limit }),
  runForecasts: () => post<{ orgsForecasted: number }>("/admin/intelligence/forecasts/run"),
  platformForecast: (horizon = 30) => get<ForecastResult>("/admin/intelligence/forecasts/platform", { horizon }),
  providerCostForecast: (horizon = 30) => get<Array<{ provider: string; projectedCost: number }>>("/admin/intelligence/forecasts/provider-cost", { horizon }),

  costOptimization: (marginFloor = 1.3) => get<CostOptimization>("/admin/intelligence/cost-optimization", { marginFloor }),
  slaRisk: () => get<SlaRiskRow[]>("/admin/intelligence/sla-risk"),
};

export interface MlModel {
  name: string; version: number; algorithm: string; framework: string; status: string;
  trained_rows: number; metrics: Record<string, number>; trained_at: string;
}
export interface ModelMetric { version: number; metric: string; value: number; evaluated_at: string; }
export interface BanTrainResult { trained: boolean; version?: number; rows: number; auc?: number; logloss?: number; }
export interface BanProbability {
  route_key: string; provider?: string; country?: string; target_class?: string; ban_probability: number; computed_at: string;
}
export interface RouteWeightDetail { provider: string; score: number; banProb: number; p95: number; state: string; }
export interface RouteWeights { weights?: Record<string, number>; ts?: number; }
export interface ProviderFeature {
  provider: string; success_rate: number; ban_rate: number; p50_latency: number; p95_latency: number;
  throughput_gb: number; cost_per_gb: number; efficiency: number; sample_count: number; computed_at: string;
}
export interface AsnQuality { asn: number; quality_score: number; success_rate?: number; ban_rate?: number; sample_count: number; updated_at: string; }
export interface AnomalyEvent {
  id: number; scope: string; entity_id: string; metric: string; observed: number; expected: number;
  score: number; severity: string; status: string; mitigation: Record<string, unknown>; detected_at: string;
}
export interface ForecastRow { entity_type: string; entity_id: string; metric: string; point_value: number | null; model: string; generated_at: string; }
export interface ForecastPoint { date: string; yhat: number; lower?: number; upper?: number; }
export interface ForecastResult { points: ForecastPoint[]; total: number; seasonal?: boolean; insufficientData?: boolean; }
export interface CostOptimization {
  recommendedWeights: { weights: Record<string, number>; detail: Array<{ provider: string; score: number; costPerGb: number; margin: number }>; sellPerGb: number };
  lowMarginCustomers: Array<{ orgId: string; gb: number; revPerGb: number; breakeven: number; plan: string }>;
  offloadRecommendations: Array<{ from: string; to: string; costDelta: number; estMonthlySaving: number }>;
}
export interface SlaRiskRow {
  orgId: string; risk: number; uptime: number; latencyP95: number; latencyTrend: number; targetUptime: number; latencyBudget: number; action?: string;
}

// ─── Financial Operations (Prompt 16) ──────────────────────────────────────────
export const adminFinanceApi = {
  dashboard: () => get<FinanceDashboard>("/admin/finance/dashboard"),
  runUsageReconciliation: () => post<ReconRun>("/admin/finance/reconciliation/usage"),
  listReconciliationRuns: (limit = 50) => get<ReconRunRow[]>("/admin/finance/reconciliation/runs", { limit }),
  listDiscrepancies: (runId: number) => get<Discrepancy[]>(`/admin/finance/reconciliation/runs/${runId}/discrepancies`),
  reconcileProvider: (data: { provider: string; billedGb: number; billedAmount: number }) =>
    post<unknown>("/admin/finance/reconciliation/provider", data),
  listProviderCostModels: () => get<ProviderCostModel[]>("/admin/finance/provider-costs"),
  upsertProviderCostModel: (data: Partial<ProviderCostModel> & { modelType: string; unitCost: number }) =>
    post<unknown>("/admin/finance/provider-costs", data),
  providerCostPreview: (provider: string, gb: number) => get<{ cost: number; model: string; effectivePerGb: number }>("/admin/finance/provider-costs/preview", { provider, gb }),
  ingestInfraCost: (data: Record<string, unknown>) => post<unknown>("/admin/finance/infra-costs", data),
  attributeInfra: () => post<{ attributed: number; pools: number }>("/admin/finance/infra-costs/attribute"),
  snapshotProfitability: () => post<unknown>("/admin/finance/profitability/snapshot"),
  marginHeatmap: (scope = "org", limit = 100) => get<MarginRow[]>("/admin/finance/profitability/heatmap", { scope, limit }),
  taxPreview: (params: { orgId?: string; amount: number; country?: string; region?: string; b2b?: boolean }) =>
    get<TaxResult>("/admin/finance/tax/preview", { orgId: params.orgId, amount: params.amount, country: params.country, region: params.region, b2b: params.b2b ? "true" : undefined }),
  ledgerBalance: (orgId: string) => get<{ orgId: string; balance: number }>(`/admin/finance/ledger/${orgId}`),
  addCredit: (orgId: string, data: { amount: number; reason?: string }) => post<unknown>(`/admin/finance/ledger/${orgId}/credit`, data),
  listRefunds: (status?: string, limit = 100) => get<RefundRow[]>("/admin/finance/refunds", { status, limit }),
  requestRefund: (data: { orgId: string; invoiceId?: number; amount: number; reason?: string }) => post<{ refundId: number; status: string; risk: { score: number; decision: string; reasons: string[] } }>("/admin/finance/refunds", data),
  decideRefund: (id: number, decision: "approve" | "reject") => post<unknown>(`/admin/finance/refunds/${id}/decide`, { decision }),
  forecastProviderSpend: (horizon = 30) => get<Array<{ provider: string; projectedCost: number }>>("/admin/finance/forecast/provider-spend", { horizon }),
  upsertProviderContract: (data: Record<string, unknown>) => post<unknown>("/admin/finance/provider-contracts", data),
  upsertTaxRate: (data: { country: string; region?: string; taxType: string; rate: number; b2bReverse?: boolean }) => post<unknown>("/admin/finance/tax/rates", data),
  erpExportDownload: async (system = "csv") => {
    const token = getToken();
    const res = await fetch(`${BASE}/admin/finance/erp-export?system=${encodeURIComponent(system)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`ERP export failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || `baalvion-${system}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  },
};

export interface FinanceDashboard {
  period: { start: string; end: string };
  revenue: number; providerCost: number; infraCost: number; grossMargin: number; marginRatio: number; totalGb: number;
  providers: Array<{ provider: string; gb: number; cost: number; costPerGb: number }>;
  negativeMarginAccounts: number;
  topAccounts: MarginRow[];
}
export interface MarginRow { entity_id: string; revenue: number; provider_cost: number; infra_cost: number; net_margin: number; margin_ratio: number; period_start?: string; }
export interface ReconRun { runId: number; discrepancies: number; maxVariance: number; healthy: boolean; }
export interface ReconRunRow { id: number; kind: string; period_start: string; period_end: string; status: string; discrepancies: number; max_variance: number; finished_at?: string; }
export interface Discrepancy { id: number; dimension: string; dim_key: string; source_a: string; value_a: number; source_b: string; value_b: number; variance: number; variance_pct: number; classification: string; }
export interface ProviderCostModel { provider: string; model_type: string; dim_key: string; unit_cost: number; currency: string; effective_from?: string; }
export interface TaxResult { lines: Array<{ type: string; rate: number; amount: number }>; totalTax: number; regime: string; reverseCharge: boolean; }
export interface RefundRow { id: number; org_id: string; invoice_id?: number; amount: number; status: string; risk_score?: number; created_at: string; }

// ─── Marketplace / Reseller / Channel (Prompt 17) ──────────────────────────────
export const adminMarketplaceApi = {
  listResellers: () => get<Reseller[]>("/admin/marketplace/resellers"),
  createReseller: (data: Record<string, unknown>) => post<{ id: string; status: string }>("/admin/marketplace/resellers", data),
  approveReseller: (id: string, kybApproved = true) => post<unknown>(`/admin/marketplace/resellers/${id}/approve`, { kybApproved }),
  resellerRisk: (id: string) => get<{ resellerId: string; score: number; fraudulent: boolean; reasons: string[] }>(`/admin/marketplace/resellers/${id}/risk`),
  upsertProduct: (data: Record<string, unknown>) => post<unknown>("/admin/marketplace/products", data),
  upsertPromotion: (data: Record<string, unknown>) => post<unknown>("/admin/marketplace/promotions", data),
  createAffiliate: (data: Record<string, unknown>) => post<{ affiliateId: string; code: string }>("/admin/marketplace/affiliates", data),
  listPayouts: (status?: string, limit = 100) => get<PayoutRow[]>("/admin/marketplace/payouts", { status, limit }),
  approvePayout: (id: string) => post<unknown>(`/admin/marketplace/payouts/${id}/approve`),
  processPayouts: () => post<{ processed: number }>("/admin/marketplace/payouts/process"),
  leaderboard: (limit = 25) => get<LeaderboardRow[]>("/admin/marketplace/channel/leaderboard", { limit }),
  channelRevenue: () => get<{ reseller: number; affiliate: number; total: number }>("/admin/marketplace/channel/revenue"),
};

export interface Reseller { id: string; org_id: string; parent_reseller_id?: string; tier: string; status: string; margin_pct: number; quota_gb?: number; kyb_status?: string; }
export interface PayoutRow { id: string; party_type: string; party_id: string; amount: number; status: string; risk_score?: number; hold_reason?: string; created_at: string; }
export interface LeaderboardRow { rank: number; resellerId: string; tier: string; revenue: number; customers: number; }
