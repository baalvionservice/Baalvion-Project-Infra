import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  dashboardApi, proxyApi, presetApi, analyticsApi, billingApi,
  orgApi, apiKeyApi, usageApi, subUserApi, notificationApi, auditApi, supportApi,
  developerApi, usageRealtimeApi, privacyApi, enterpriseApi, networkAnalyticsApi,
  partnerApi, marketplaceCatalogApi, referralApi, brandingApi,
} from "@/lib/platformClient";

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const useDashboardSummary = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.getSummary, staleTime: 30_000 });

// ─── Usage ───────────────────────────────────────────────────────────────────
export const useUsageSummary = () =>
  useQuery({ queryKey: ["usage", "summary"], queryFn: usageApi.getSummary, staleTime: 30_000 });

export const useUsageHistory = (days = 30) =>
  useQuery({ queryKey: ["usage", "history", days], queryFn: () => usageApi.getHistory({ days }), staleTime: 60_000 });

// ─── Analytics ───────────────────────────────────────────────────────────────
export const useBandwidth = (days = 30) =>
  useQuery({ queryKey: ["analytics", "bandwidth", days], queryFn: () => analyticsApi.getBandwidth({ days }), staleTime: 60_000 });

export const useSuccessRate = (days = 30) =>
  useQuery({ queryKey: ["analytics", "success-rate", days], queryFn: () => analyticsApi.getSuccessRate({ days }), staleTime: 60_000 });

export const useTopCountries = () =>
  useQuery({ queryKey: ["analytics", "countries"], queryFn: analyticsApi.getTopCountries, staleTime: 120_000 });

export const useTopDomains = () =>
  useQuery({ queryKey: ["analytics", "domains"], queryFn: analyticsApi.getTopDomains, staleTime: 120_000 });

export const useLatencyDistribution = () =>
  useQuery({ queryKey: ["analytics", "latency"], queryFn: analyticsApi.getLatencyDistribution, staleTime: 120_000 });

export const useAnomalies = () =>
  useQuery({ queryKey: ["analytics", "anomalies"], queryFn: analyticsApi.getAnomalies, staleTime: 60_000 });

// ─── Proxies ─────────────────────────────────────────────────────────────────
export const useProxies = (params?: { page?: number; pageSize?: number; status?: string; type?: string; country?: string }) =>
  useQuery({ queryKey: ["proxies", params], queryFn: () => proxyApi.list(params), staleTime: 15_000 });

export const useProxy = (id: string) =>
  useQuery({ queryKey: ["proxy", id], queryFn: () => proxyApi.get(id), enabled: !!id });

export const useCreateProxy = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: proxyApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proxies"] }); toast({ title: "Proxy created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateProxy = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof proxyApi.update>[1] }) =>
      proxyApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proxies"] }); toast({ title: "Proxy updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteProxy = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: proxyApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proxies"] }); toast({ title: "Proxy deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useRotateProxy = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: proxyApi.rotate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proxies"] }); toast({ title: "Proxy rotated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useTestProxy = () =>
  useMutation({ mutationFn: proxyApi.test });

export const useProxyLogs = (id: string, params?: { page?: number }) =>
  useQuery({ queryKey: ["proxy-logs", id, params], queryFn: () => proxyApi.getLogs(id, params), enabled: !!id });

// ─── Presets ─────────────────────────────────────────────────────────────────
export const usePresets = () =>
  useQuery({ queryKey: ["presets"], queryFn: presetApi.list, staleTime: 30_000 });

export const useCreatePreset = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: presetApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["presets"] }); toast({ title: "Preset created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useUpdatePreset = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof presetApi.update>[1] }) =>
      presetApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["presets"] }); toast({ title: "Preset updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDeletePreset = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: presetApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["presets"] }); toast({ title: "Preset deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Billing ─────────────────────────────────────────────────────────────────
export const useSubscription = () =>
  useQuery({ queryKey: ["billing", "subscription"], queryFn: billingApi.getSubscription, staleTime: 60_000 });

export const usePlans = () =>
  useQuery({ queryKey: ["billing", "plans"], queryFn: billingApi.getPlans, staleTime: 300_000 });

export const useCredit = () =>
  useQuery({ queryKey: ["billing", "credit"], queryFn: billingApi.getCredit, staleTime: 30_000 });

export const useInvoices = (params?: { page?: number; pageSize?: number }) =>
  useQuery({ queryKey: ["billing", "invoices", params], queryFn: () => billingApi.getInvoices(params), staleTime: 60_000 });

export const usePaymentMethods = () =>
  useQuery({ queryKey: ["billing", "payment-methods"], queryFn: billingApi.getPaymentMethods, staleTime: 60_000 });

export const useUsageForecast = () =>
  useQuery({ queryKey: ["billing", "forecast"], queryFn: billingApi.getUsageForecast, staleTime: 60_000 });

export const useChangePlan = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (planSlug: string) => billingApi.changePlan(planSlug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
      toast({ title: "Plan updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useAddPaymentMethod = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: billingApi.addPaymentMethod,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing", "payment-methods"] });
      toast({ title: "Payment method added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDeletePaymentMethod = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: billingApi.deletePaymentMethod,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing", "payment-methods"] });
      toast({ title: "Payment method removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Organization ─────────────────────────────────────────────────────────────
export const useOrganization = () =>
  useQuery({ queryKey: ["org"], queryFn: orgApi.get, staleTime: 60_000 });

export const useOrgMembers = () =>
  useQuery({ queryKey: ["org", "members"], queryFn: orgApi.listMembers, staleTime: 30_000 });

export const useOrgRoles = () =>
  useQuery({ queryKey: ["org", "roles"], queryFn: orgApi.listRoles, staleTime: 300_000 });

export const useOrgActivity = (page = 1) =>
  useQuery({ queryKey: ["org", "activity", page], queryFn: () => orgApi.getActivity({ page }), staleTime: 30_000 });

export const useInviteMember = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: orgApi.inviteMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org", "members"] });
      toast({ title: "Invitation sent" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateMemberRole = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => orgApi.updateMemberRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org", "members"] });
      toast({ title: "Role updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: orgApi.removeMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org", "members"] });
      toast({ title: "Member removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Sub-users ────────────────────────────────────────────────────────────────
export const useSubUsers = () =>
  useQuery({ queryKey: ["sub-users"], queryFn: subUserApi.list, staleTime: 30_000 });

export const useInviteSubUser = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: subUserApi.invite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub-users"] });
      toast({ title: "Sub-user invited" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useRemoveSubUser = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: subUserApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub-users"] });
      toast({ title: "Sub-user removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── API Keys ─────────────────────────────────────────────────────────────────
export const useApiKeys = () =>
  useQuery({ queryKey: ["api-keys"], queryFn: apiKeyApi.list, staleTime: 30_000 });

export const useCreateApiKey = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiKeyApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "API key created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useRevokeApiKey = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiKeyApi.revoke,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "API key revoked" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteApiKey = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiKeyApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "API key deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const useNotifications = () =>
  useQuery({ queryKey: ["notifications"], queryFn: notificationApi.list, staleTime: 15_000 });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export const useAuditLogs = (params?: { page?: number; pageSize?: number; action?: string }) =>
  useQuery({ queryKey: ["audit-logs", params], queryFn: () => auditApi.list(params), staleTime: 30_000 });

// ─── Support Tickets ─────────────────────────────────────────────────────────
export const useSupportTickets = (params?: { page?: number; pageSize?: number }) =>
  useQuery({ queryKey: ["support-tickets", params], queryFn: () => supportApi.list(params), staleTime: 30_000 });

export const useCreateSupportTicket = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: supportApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["support-tickets"] }); toast({ title: "Ticket created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Developer / Proxy access ──────────────────────────────────────────────────
export const useDeveloperContext = () =>
  useQuery({ queryKey: ["developer", "me"], queryFn: developerApi.me, staleTime: 60_000 });

export const useProxySessions = () =>
  useQuery({ queryKey: ["developer", "proxy-sessions"], queryFn: developerApi.listProxySessions, staleTime: 10_000, refetchInterval: 15_000 });

export const useRotateApiKey = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => developerApi.rotateKey(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["api-keys"] }); toast({ title: "API key rotated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// Realtime usage — polled (live counters from the metering pipeline).
export const useRealtimeUsage = () =>
  useQuery({ queryKey: ["usage", "realtime"], queryFn: usageRealtimeApi.realtime, refetchInterval: 3_000 });

export const useProjectedOverage = () =>
  useQuery({ queryKey: ["billing", "projected-overage"], queryFn: usageRealtimeApi.projectedOverage, staleTime: 60_000 });

// ─── Privacy / Trust / KYC ──────────────────────────────────────────────────
export const useTrustStatus = () =>
  useQuery({ queryKey: ["account", "trust"], queryFn: privacyApi.trustStatus, staleTime: 30_000 });

export const useRecordConsent = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: privacyApi.recordConsent,
    onSuccess: () => toast({ title: "Preference saved" }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useStartKyc = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: privacyApi.startKyc,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["account", "trust"] }); toast({ title: "Verification started" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useRequestDataExport = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const req = await privacyApi.requestExport();
      const bundle = await privacyApi.downloadExport(req.id);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `baalvion-data-export.json`; a.click();
      URL.revokeObjectURL(url);
      return req;
    },
    onSuccess: () => toast({ title: "Data export downloaded" }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useRequestDeletion = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (scope: "me" | "org") => privacyApi.requestDelete(scope),
    onSuccess: () => toast({ title: "Deletion request submitted" }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Enterprise (SSO / SCIM / RBAC / policies / SLA / white-label) ──────────────
export const useSso = () => useQuery({ queryKey: ["enterprise", "sso"], queryFn: enterpriseApi.getSso, staleTime: 30_000 });
export const useScimTokens = () => useQuery({ queryKey: ["enterprise", "scim"], queryFn: enterpriseApi.listScimTokens, staleTime: 30_000 });
export const useCustomRoles = () => useQuery({ queryKey: ["enterprise", "roles"], queryFn: enterpriseApi.listRoles, staleTime: 30_000 });
export const useOrgPolicies = () => useQuery({ queryKey: ["enterprise", "policies"], queryFn: enterpriseApi.getPolicies, staleTime: 30_000 });
export const useSla = () => useQuery({ queryKey: ["enterprise", "sla"], queryFn: enterpriseApi.getSla, staleTime: 30_000 });
export const useWhiteLabel = () => useQuery({ queryKey: ["enterprise", "white-label"], queryFn: enterpriseApi.getWhiteLabel, staleTime: 30_000 });

export const useUpsertSso = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({ mutationFn: enterpriseApi.upsertSso,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enterprise", "sso"] }); toast({ title: "SSO saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useCreateScimToken = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: enterpriseApi.createScimToken, onSuccess: () => qc.invalidateQueries({ queryKey: ["enterprise", "scim"] }) });
};
export const useCreateCustomRole = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({ mutationFn: enterpriseApi.createRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enterprise", "roles"] }); toast({ title: "Role created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useSetPolicy = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({ mutationFn: enterpriseApi.setPolicy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enterprise", "policies"] }); toast({ title: "Policy updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};
export const useUpsertWhiteLabel = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({ mutationFn: enterpriseApi.upsertWhiteLabel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enterprise", "white-label"] }); toast({ title: "Branding saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
};

// ─── Network Analytics + AI Insights (Prompt 10, org-scoped) ───────────────────
export const useGeoHeatmap = () =>
  useQuery({ queryKey: ["analytics", "geo-heatmap"], queryFn: networkAnalyticsApi.geoHeatmap, staleTime: 60_000 });

export const useTrafficIntelligence = () =>
  useQuery({ queryKey: ["analytics", "traffic-intel"], queryFn: networkAnalyticsApi.trafficIntelligence, staleTime: 60_000 });

export const useProviderMix = () =>
  useQuery({ queryKey: ["analytics", "provider-mix"], queryFn: networkAnalyticsApi.providerMix, staleTime: 60_000 });

export const useBandwidthForecast = (horizon = 30) =>
  useQuery({ queryKey: ["analytics", "forecast", "bandwidth", horizon], queryFn: () => networkAnalyticsApi.bandwidthForecast(horizon), staleTime: 300_000 });

export const useQuotaForecast = () =>
  useQuery({ queryKey: ["analytics", "forecast", "quota"], queryFn: networkAnalyticsApi.quotaForecast, staleTime: 120_000 });

export const useSlaRiskInsight = () =>
  useQuery({ queryKey: ["analytics", "sla-risk"], queryFn: networkAnalyticsApi.slaRisk, staleTime: 60_000 });

// ─── Partner / reseller self-service (Prompt 17) ────────────────────────────────
export const usePartnerProfile = () =>
  useQuery({ queryKey: ["partner", "me"], queryFn: partnerApi.me, retry: false, staleTime: 60_000 });
export const usePartnerCustomers = () =>
  useQuery({ queryKey: ["partner", "customers"], queryFn: partnerApi.customers, staleTime: 30_000 });
export const usePartnerCommissions = () =>
  useQuery({ queryKey: ["partner", "commissions"], queryFn: partnerApi.commissions, staleTime: 30_000 });
export const useMarketplaceCatalog = (category?: string) =>
  useQuery({ queryKey: ["marketplace", "catalog", category], queryFn: () => marketplaceCatalogApi.catalog(category), staleTime: 300_000 });

export const useAddPartnerCustomer = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { customerOrgId: string; quotaGb?: number; country?: string }) => partnerApi.addCustomer(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["partner", "customers"] }); toast({ title: "Customer assigned" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
export const useRequestPartnerPayout = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (method?: string) => partnerApi.requestPayout(method),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["partner"] }); toast({ title: r.ok ? `Payout ${r.status}: $${r.net}` : `Not eligible (${r.reason})` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
export const useCreateSubReseller = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { orgId: string; marginPct: number }) => partnerApi.createSubReseller(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["partner"] }); toast({ title: "Sub-reseller created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── Marketplace storefront (Prompt 17 completion) ──────────────────────────────
export const useMarketplacePrice = (sku: string, qty: number, region?: string, promo?: string) =>
  useQuery({ queryKey: ["marketplace", "price", sku, qty, region, promo], queryFn: () => marketplaceCatalogApi.price(sku, qty, region, promo), enabled: !!sku && qty > 0, staleTime: 60_000 });

export const useCreateQuote = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ items, region, promo }: { items: Array<{ sku: string; qty: number }>; region?: string; promo?: string }) => marketplaceCatalogApi.createQuote(items, region, promo),
    onSuccess: (q) => toast({ title: `Quote created — total $${q.total}` }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// ─── White-label custom domains (Prompt 17 completion) ──────────────────────────
export const useWhiteLabelDomains = () =>
  useQuery({ queryKey: ["enterprise", "wl-domains"], queryFn: enterpriseApi.listWhiteLabelDomains, staleTime: 30_000 });
export const useAddWhiteLabelDomain = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (domain: string) => enterpriseApi.addWhiteLabelDomain(domain),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["enterprise", "wl-domains"] }); toast({ title: "Domain added", description: r.instructions }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
export const useVerifyWhiteLabelDomain = () => {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => enterpriseApi.verifyWhiteLabelDomain(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enterprise", "wl-domains"] }); toast({ title: "Domain verified" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

// Public branding lookup (used by the white-label login page).
export const useBranding = (domain: string) =>
  useQuery({ queryKey: ["branding", domain], queryFn: () => brandingApi.resolve(domain), enabled: !!domain, retry: false, staleTime: 600_000 });

// re-export the public referral tracker for landing pages.
export { referralApi };
