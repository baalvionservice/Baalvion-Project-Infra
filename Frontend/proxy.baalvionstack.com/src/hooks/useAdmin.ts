import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  adminDashboardApi, adminTenantApi, adminUserApi, adminProviderApi,
  adminRoutingApi, adminSystemApi, adminAbuseApi, adminRevenueApi,
  adminFeatureFlagApi, adminAuditApi, adminSupportApi, adminOrchestrationApi, adminTrustApi,
  adminEdgeApi, adminIntelligenceApi, adminFinanceApi, adminMarketplaceApi, adminBillingApi,
  AdminProvider, AdminRoutingRule, AdminRateLimit, RoutingPolicy,
  EdgeRegion, AsnIntel, IpPool,
} from "@/lib/adminApiClient";

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const useAdminDashboard = () =>
  useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminDashboardApi.get, staleTime: 30_000 });

// ─── Tenants ─────────────────────────────────────────────────────────────────
export const useAdminTenants = (params?: { page?: number; pageSize?: number }) =>
  useQuery({ queryKey: ["admin", "tenants", params], queryFn: () => adminTenantApi.list(params), staleTime: 30_000 });

export const useAdminTenant = (orgId: string) =>
  useQuery({ queryKey: ["admin", "tenant", orgId], queryFn: () => adminTenantApi.get(orgId), enabled: !!orgId });

export const useSuspendTenant = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminTenantApi.suspend,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "tenants"] }); toast({ title: "Tenant suspended" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useReactivateTenant = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminTenantApi.reactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "tenants"] }); toast({ title: "Tenant reactivated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useOverrideBandwidth = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ orgId, bandwidthLimitGb }: { orgId: string; bandwidthLimitGb: number }) =>
      adminTenantApi.overrideBandwidth(orgId, bandwidthLimitGb),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "tenants"] }); toast({ title: "Bandwidth limit updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const useAdminUsers = (params?: { page?: number; pageSize?: number }) =>
  useQuery({ queryKey: ["admin", "users", params], queryFn: () => adminUserApi.list(params), staleTime: 30_000 });

export const useBanUser = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminUserApi.ban,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "User banned" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useSuspendUser = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminUserApi.suspend,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "User suspended" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useReactivateUser = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminUserApi.reactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast({ title: "User reactivated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Providers ───────────────────────────────────────────────────────────────
// params are accepted for call-site compatibility but the list endpoint returns all providers
export const useAdminProviders = (_params?: { page?: number; pageSize?: number }) =>
  useQuery({ queryKey: ["admin", "providers"], queryFn: adminProviderApi.list, staleTime: 30_000 });

export const useAdminProvider = (id: string) =>
  useQuery({ queryKey: ["admin", "provider", id], queryFn: () => adminProviderApi.get(id), enabled: !!id });

export const useCreateProvider = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminProviderApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); toast({ title: "Provider created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateProvider = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminProvider> }) => adminProviderApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); toast({ title: "Provider updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteProvider = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminProviderApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); toast({ title: "Provider deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Routing Rules ───────────────────────────────────────────────────────────
export const useAdminRoutingRules = () =>
  useQuery({ queryKey: ["admin", "routing-rules"], queryFn: adminRoutingApi.list, staleTime: 60_000 });

export const useCreateRoutingRule = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminRoutingApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "routing-rules"] }); toast({ title: "Rule created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateRoutingRule = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminRoutingRule> }) => adminRoutingApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "routing-rules"] }); toast({ title: "Rule updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteRoutingRule = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminRoutingApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "routing-rules"] }); toast({ title: "Rule deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── System ──────────────────────────────────────────────────────────────────
export const useAdminSystemServices = () =>
  useQuery({ queryKey: ["admin", "system", "services"], queryFn: adminSystemApi.getServices, staleTime: 15_000 });

export const useAdminSystemMetrics = () =>
  useQuery({ queryKey: ["admin", "system", "metrics"], queryFn: adminSystemApi.getMetrics, staleTime: 10_000 });

// ─── Abuse Logs ──────────────────────────────────────────────────────────────
export const useAdminAbuseLogs = (params?: { page?: number; pageSize?: number }) =>
  useQuery({ queryKey: ["admin", "abuse-logs", params], queryFn: () => adminAbuseApi.listLogs(params), staleTime: 30_000 });

export const useResolveAbuseLog = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: adminAbuseApi.resolveLog,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "abuse-logs"] }); toast({ title: "Abuse log resolved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useAdminRateLimits = () =>
  useQuery({ queryKey: ["admin", "rate-limits"], queryFn: adminAbuseApi.getRateLimits, staleTime: 60_000 });

export const useUpdateRateLimit = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminRateLimit> }) => adminAbuseApi.updateRateLimit(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "rate-limits"] }); toast({ title: "Rate limit updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Revenue ─────────────────────────────────────────────────────────────────
export const useAdminRevenueSummary = (period?: string) =>
  useQuery({ queryKey: ["admin", "revenue", period], queryFn: () => adminRevenueApi.getSummary(period), staleTime: 60_000 });

export const useAdminCohortRetention = () =>
  useQuery({ queryKey: ["admin", "cohort-retention"], queryFn: adminRevenueApi.getCohortRetention, staleTime: 300_000 });

// ─── Feature Flags ───────────────────────────────────────────────────────────
export const useAdminFeatureFlags = () =>
  useQuery({ queryKey: ["admin", "feature-flags"], queryFn: adminFeatureFlagApi.list, staleTime: 60_000 });

export const useUpdateFeatureFlag = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: { enabled?: boolean; rollout?: number } }) =>
      adminFeatureFlagApi.update(key, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "feature-flags"] }); toast({ title: "Feature flag updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export const useAdminAuditLogs = (params?: { page?: number; pageSize?: number }) =>
  useQuery({ queryKey: ["admin", "audit-logs", params], queryFn: () => adminAuditApi.list(params), staleTime: 30_000 });

// ─── Support Tickets (admin) ──────────────────────────────────────────────────
export const useAdminTickets = (params?: { page?: number; pageSize?: number; status?: string }) =>
  useQuery({ queryKey: ["admin", "tickets", params], queryFn: () => adminSupportApi.list(params), staleTime: 30_000 });

export const useAdminTicketsPreview = () =>
  useQuery({
    queryKey: ["admin", "tickets-preview"],
    queryFn: () => adminSupportApi.list({ pageSize: 3 }).then(page => page.data),
    staleTime: 30_000,
  });

// ─── Provider Orchestration ────────────────────────────────────────────────────
export const useProviderStates = () =>
  useQuery({ queryKey: ["admin", "orchestration", "providers"], queryFn: adminOrchestrationApi.providerStates, refetchInterval: 10_000 });

export const useRoutingPolicies = () =>
  useQuery({ queryKey: ["admin", "orchestration", "policies"], queryFn: adminOrchestrationApi.listPolicies, staleTime: 30_000 });

export const useUpsertRoutingPolicy = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (p: Partial<RoutingPolicy>) => adminOrchestrationApi.upsertPolicy(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "orchestration", "policies"] }); toast({ title: "Routing policy saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useIpIntelligence = (params?: { provider?: string; country?: string; limit?: number }) =>
  useQuery({ queryKey: ["admin", "orchestration", "ip-intel", params], queryFn: () => adminOrchestrationApi.ipIntelligence(params), staleTime: 30_000 });

export const useGeoCoverage = () =>
  useQuery({ queryKey: ["admin", "orchestration", "geo"], queryFn: adminOrchestrationApi.geoCoverage, staleTime: 60_000 });

export const useOrchestrationSessions = () =>
  useQuery({ queryKey: ["admin", "orchestration", "sessions"], queryFn: adminOrchestrationApi.activeSessions, refetchInterval: 15_000 });

export const useBanAnalytics = () =>
  useQuery({ queryKey: ["admin", "orchestration", "bans"], queryFn: adminOrchestrationApi.banAnalytics, staleTime: 30_000 });

// ─── Trust & Safety ─────────────────────────────────────────────────────────
export const useModerationCases = (status?: string) =>
  useQuery({ queryKey: ["admin", "trust", "cases", status], queryFn: () => adminTrustApi.listCases(status), refetchInterval: 20_000 });

export const useKycQueue = (status?: string) =>
  useQuery({ queryKey: ["admin", "trust", "kyc", status], queryFn: () => adminTrustApi.listKyc(status), staleTime: 20_000 });

export const useComplianceReport = () =>
  useQuery({ queryKey: ["admin", "trust", "compliance"], queryFn: adminTrustApi.complianceReport, staleTime: 30_000 });

export const useDestinationIntel = () =>
  useQuery({ queryKey: ["admin", "trust", "destintel"], queryFn: adminTrustApi.destinationIntel, staleTime: 60_000 });

export const useTransitionCase = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) => adminTrustApi.transitionCase(id, status, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "trust", "cases"] }); toast({ title: "Case updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDecideKyc = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, decision, notes }: { id: string; decision: "approve" | "reject"; notes?: string }) => adminTrustApi.decideKyc(id, decision, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "trust", "kyc"] }); toast({ title: "KYC decision saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useRefreshIntel = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminTrustApi.refreshIntel(),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "trust", "destintel"] }); toast({ title: `Refreshed ${r.total} indicators` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Global Edge Network (Prompt 9) ────────────────────────────────────────────
export const useEdgeRegions = () =>
  useQuery({ queryKey: ["admin", "edge", "regions"], queryFn: adminEdgeApi.listRegions, refetchInterval: 30_000 });

export const useUpsertEdgeRegion = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<EdgeRegion>) => adminEdgeApi.upsertRegion(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "edge", "regions"] }); toast({ title: "Region saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useAsnIntel = (params?: { type?: string; limit?: number }) =>
  useQuery({ queryKey: ["admin", "edge", "asn", params], queryFn: () => adminEdgeApi.listAsn(params), staleTime: 30_000 });

export const useUpsertAsn = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<AsnIntel> & { asn: number }) => adminEdgeApi.upsertAsn(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "edge", "asn"] }); toast({ title: "ASN saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useRefreshAsn = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminEdgeApi.refreshAsn(),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "edge", "asn"] }); toast({ title: `Recomputed ${r.refreshed} ASNs (${r.banned} banned)` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useIpPools = () =>
  useQuery({ queryKey: ["admin", "edge", "pools"], queryFn: adminEdgeApi.listPools, staleTime: 30_000 });

export const useCreatePool = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<IpPool>) => adminEdgeApi.createPool(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "edge", "pools"] }); toast({ title: "Pool created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useAddPoolIPs = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: ({ poolId, ips, asn, country, regionCode }: { poolId: string; ips: string[]; asn?: number; country?: string; regionCode?: string }) =>
      adminEdgeApi.addIPs(poolId, { ips, asn, country, regionCode }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "edge", "pools"] }); toast({ title: `Added ${r.added} IPs` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useAllocateIPs = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { orgId: string; poolId: string; count?: number; geo?: string; slaTier?: string }) => adminEdgeApi.allocate(data),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "edge", "pools"] }); toast({ title: `Allocated ${r.allocated.length} IPs` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── AI Network Intelligence (Prompt 10) ───────────────────────────────────────
export const useMlModels = () =>
  useQuery({ queryKey: ["admin", "intel", "models"], queryFn: adminIntelligenceApi.listModels, staleTime: 30_000 });

export const useTrainBanModel = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (days?: number) => adminIntelligenceApi.trainBan(days),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin", "intel", "models"] });
      toast({ title: r.trained ? `Trained v${r.version} (AUC ${r.auc?.toFixed(3)})` : `Not trained — ${r.rows} rows` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useBanProbabilities = (limit = 100) =>
  useQuery({ queryKey: ["admin", "intel", "banprob", limit], queryFn: () => adminIntelligenceApi.banProbabilities(limit), staleTime: 30_000 });

export const useRouteWeights = () =>
  useQuery({ queryKey: ["admin", "intel", "weights"], queryFn: adminIntelligenceApi.routeWeights, refetchInterval: 15_000 });

export const useRecomputeWeights = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminIntelligenceApi.recomputeWeights(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "intel", "weights"] }); toast({ title: "Routing weights recomputed" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const usePredictiveFailover = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminIntelligenceApi.predictiveFailover(),
    onSuccess: (r) => toast({ title: `${r.actions.length} predictive failover action(s)` }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useProviderFeatures = () =>
  useQuery({ queryKey: ["admin", "intel", "features", "providers"], queryFn: adminIntelligenceApi.providerFeatures, refetchInterval: 30_000 });

export const useRefreshFeatures = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminIntelligenceApi.refreshFeatures(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "intel", "features"] }); toast({ title: "Feature store refreshed" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useAnomalies = (status?: string) =>
  useQuery({ queryKey: ["admin", "intel", "anomalies", status], queryFn: () => adminIntelligenceApi.anomalies(status), refetchInterval: 20_000 });

export const useSweepAnomalies = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminIntelligenceApi.sweepAnomalies(),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "intel", "anomalies"] }); toast({ title: `Swept: ${r.bandwidth + r.providerInstability + r.fanout} anomalies` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useResolveAnomaly = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminIntelligenceApi.resolveAnomaly(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "intel", "anomalies"] }); toast({ title: "Anomaly updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useLatestForecasts = (metric?: string) =>
  useQuery({ queryKey: ["admin", "intel", "forecasts", metric], queryFn: () => adminIntelligenceApi.latestForecasts(metric), staleTime: 60_000 });

export const usePlatformForecast = (horizon = 30) =>
  useQuery({ queryKey: ["admin", "intel", "platform-forecast", horizon], queryFn: () => adminIntelligenceApi.platformForecast(horizon), staleTime: 300_000 });

export const useRunForecasts = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminIntelligenceApi.runForecasts(),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "intel", "forecasts"] }); toast({ title: `Forecasted ${r.orgsForecasted} orgs` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useCostOptimization = () =>
  useQuery({ queryKey: ["admin", "intel", "cost-opt"], queryFn: () => adminIntelligenceApi.costOptimization(), staleTime: 60_000 });

export const useIntelSlaRisk = () =>
  useQuery({ queryKey: ["admin", "intel", "sla-risk"], queryFn: adminIntelligenceApi.slaRisk, staleTime: 60_000 });

// ─── Financial Operations (Prompt 16) ──────────────────────────────────────────
export const useFinanceDashboard = () =>
  useQuery({ queryKey: ["admin", "finance", "dashboard"], queryFn: adminFinanceApi.dashboard, staleTime: 60_000 });
export const useReconciliationRuns = () =>
  useQuery({ queryKey: ["admin", "finance", "recon"], queryFn: () => adminFinanceApi.listReconciliationRuns(), staleTime: 30_000 });
export const useMarginHeatmap = (scope = "org") =>
  useQuery({ queryKey: ["admin", "finance", "heatmap", scope], queryFn: () => adminFinanceApi.marginHeatmap(scope), staleTime: 60_000 });
export const useProviderCostModels = () =>
  useQuery({ queryKey: ["admin", "finance", "provider-costs"], queryFn: adminFinanceApi.listProviderCostModels, staleTime: 60_000 });
export const useRefunds = (status?: string) =>
  useQuery({ queryKey: ["admin", "finance", "refunds", status], queryFn: () => adminFinanceApi.listRefunds(status), staleTime: 30_000 });

export const useRunReconciliation = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminFinanceApi.runUsageReconciliation(),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "finance", "recon"] }); toast({ title: `Reconciliation: ${r.discrepancies} discrepancies` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
export const useSnapshotProfitability = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminFinanceApi.snapshotProfitability(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "finance", "heatmap"] }); toast({ title: "Profitability snapshot computed" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
export const useDecideRefund = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: "approve" | "reject" }) => adminFinanceApi.decideRefund(id, decision),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "finance", "refunds"] }); toast({ title: "Refund updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Marketplace / Channel (Prompt 17) ──────────────────────────────────────────
export const useResellers = () =>
  useQuery({ queryKey: ["admin", "mkt", "resellers"], queryFn: adminMarketplaceApi.listResellers, staleTime: 30_000 });
export const useChannelLeaderboard = () =>
  useQuery({ queryKey: ["admin", "mkt", "leaderboard"], queryFn: () => adminMarketplaceApi.leaderboard(), staleTime: 60_000 });
export const useChannelRevenue = () =>
  useQuery({ queryKey: ["admin", "mkt", "revenue"], queryFn: adminMarketplaceApi.channelRevenue, staleTime: 60_000 });
export const useAdminPayouts = (status?: string) =>
  useQuery({ queryKey: ["admin", "mkt", "payouts", status], queryFn: () => adminMarketplaceApi.listPayouts(status), refetchInterval: 20_000 });

export const useApproveReseller = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, kybApproved }: { id: string; kybApproved: boolean }) => adminMarketplaceApi.approveReseller(id, kybApproved),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "mkt", "resellers"] }); toast({ title: "Reseller updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
export const useApprovePayout = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => adminMarketplaceApi.approvePayout(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "mkt", "payouts"] }); toast({ title: "Payout approved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
export const useProcessPayouts = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: () => adminMarketplaceApi.processPayouts(),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "mkt", "payouts"] }); toast({ title: `Processed ${r.processed} payouts` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
export const useCreateAffiliate = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminMarketplaceApi.createAffiliate(data),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "mkt"] }); toast({ title: `Affiliate created: ${r.code}` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Finance write ops (Prompt 16 completion) ───────────────────────────────────
export const useProviderSpendForecast = () =>
  useQuery({ queryKey: ["admin", "finance", "forecast"], queryFn: () => adminFinanceApi.forecastProviderSpend(), staleTime: 300_000 });
export const useUpsertProviderCostModel = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({ mutationFn: (d: { provider: string; modelType: string; dimKey?: string; unitCost: number }) => adminFinanceApi.upsertProviderCostModel(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "finance", "provider-costs"] }); toast({ title: "Cost model saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useUpsertProviderContract = () => {
  const { toast } = useToast();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => adminFinanceApi.upsertProviderContract(d),
    onSuccess: () => toast({ title: "Provider contract saved" }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useIngestInfraCost = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => adminFinanceApi.ingestInfraCost(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "finance", "dashboard"] }); toast({ title: "Infra cost ingested" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useAttributeInfra = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({ mutationFn: () => adminFinanceApi.attributeInfra(),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["admin", "finance"] }); toast({ title: `Attributed ${r.pools} cost pools` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useUpsertTaxRate = () => {
  const { toast } = useToast();
  return useMutation({ mutationFn: (d: { country: string; region?: string; taxType: string; rate: number; b2bReverse?: boolean }) => adminFinanceApi.upsertTaxRate(d),
    onSuccess: () => toast({ title: "Tax rate saved" }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useAddCredit = () => {
  const { toast } = useToast();
  return useMutation({ mutationFn: ({ orgId, amount, reason }: { orgId: string; amount: number; reason?: string }) => adminFinanceApi.addCredit(orgId, { amount, reason }),
    onSuccess: () => toast({ title: "Credit added" }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useErpExport = () => {
  const { toast } = useToast();
  return useMutation({ mutationFn: (system: string) => adminFinanceApi.erpExportDownload(system),
    onSuccess: () => toast({ title: "ERP export downloaded" }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};

// ─── Marketplace write ops (Prompt 17 completion) ───────────────────────────────
export const useCreateReseller = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => adminMarketplaceApi.createReseller(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "mkt", "resellers"] }); toast({ title: "Reseller created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useUpsertProduct = () => {
  const { toast } = useToast();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => adminMarketplaceApi.upsertProduct(d),
    onSuccess: () => toast({ title: "Product saved" }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useUpsertPromotion = () => {
  const { toast } = useToast();
  return useMutation({ mutationFn: (d: Record<string, unknown>) => adminMarketplaceApi.upsertPromotion(d),
    onSuccess: () => toast({ title: "Promotion saved" }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};

// ─── Pending bank/wire orders (offline settlement) ─────────────────────────────
export const useAdminPendingOrders = () =>
  useQuery({ queryKey: ["admin", "pending-orders"], queryFn: adminBillingApi.listPendingOrders, staleTime: 15_000 });

export const useMarkOrderPaid = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (invoiceId: string) => adminBillingApi.markOrderPaid(invoiceId),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin", "pending-orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      toast({ title: r?.activated ? "Payment received — subscription activated" : "Order marked as paid" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
