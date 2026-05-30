'use client';
/**
 * IR engagement data client — live, backed by ir-service (:3008) endpoints
 * /api/v1/{notifications,subscriptions,votes,settings}. Replaces the former in-memory
 * mock arrays in notification/subscription/voting/settings services. Maps the backend's
 * snake_case + {success,data:{items}} envelope to the UI's camelCase shapes.
 */
import irAuthClient from './auth-client';

const IR_URL = process.env.NEXT_PUBLIC_IR_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/ir';

async function irReq<T>(path: string, opts: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth, headers: extra, ...rest } = opts as any;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(extra || {}) };
  if (auth) {
    try { const t = await irAuthClient.getValidToken(); if (t) headers.Authorization = `Bearer ${t}`; } catch { /* anon */ }
  }
  const res = await fetch(`${IR_URL}${path}`, { ...rest, headers });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json?.success === false) throw new Error(json?.error?.message || `IR request failed (${res.status})`);
  return json.data as T;
}

const listOf = (d: any): any[] => (Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []);
const clean = (o: Record<string, any>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

// ── mappers: backend row → UI shape ──────────────────────────────────────────
const mapSub = (r: any) => ({
  id: String(r.id), role: r.role, email: r.email,
  preferences: r.preferences || { News: true, Governance: true, Voting: true, DataRoom: true },
  active: !!r.active,
});
const mapNotif = (r: any) => ({
  id: String(r.id), title: r.title, message: r.message,
  moduleSource: r.module_source ?? r.moduleSource, entityId: r.entity_id ?? r.entityId,
  targetRoles: r.target_roles ?? r.targetRoles ?? [], status: r.status,
  scheduledAt: r.scheduled_at ?? r.scheduledAt, sentAt: r.sent_at ?? r.sentAt,
  deliveryStats: r.delivery_stats ?? r.deliveryStats, versionHistory: r.version_history ?? r.versionHistory ?? [],
});
const mapVote = (r: any) => {
  const v: any = {
    id: String(r.id), title: r.title, description: r.description,
    resolutionText: r.resolution_text ?? r.resolutionText, createdByRole: r.created_by_role ?? r.createdByRole,
    eligibleRoles: r.eligible_roles ?? r.eligibleRoles ?? [], status: r.status,
    startDate: r.start_date ?? r.startDate, endDate: r.end_date ?? r.endDate,
    votes: r.votes ?? [], versionHistory: r.version_history ?? r.versionHistory ?? [], results: r.results,
  };
  if (!v.results && v.status === 'Closed') {
    const total = v.votes.length;
    if (total > 0) {
      const pct = (c: string) => (v.votes.filter((x: any) => x.choice === c).length / total) * 100;
      v.results = { approve: pct('Approve'), reject: pct('Reject'), abstain: pct('Abstain'), participationRate: 75, isQuorumMet: true };
    }
  }
  return v;
};

// ── body builders: UI shape → backend snake_case (omit undefined for PATCH) ───
const toNotifBody = (n: any) => clean({
  title: n.title, message: n.message, module_source: n.moduleSource, entity_id: n.entityId,
  target_roles: n.targetRoles, status: n.status, scheduled_at: n.scheduledAt, sent_at: n.sentAt,
  delivery_stats: n.deliveryStats, version_history: n.versionHistory,
});
const toVoteBody = (v: any) => clean({
  title: v.title, description: v.description, resolution_text: v.resolutionText, created_by_role: v.createdByRole,
  eligible_roles: v.eligibleRoles, status: v.status, start_date: v.startDate, end_date: v.endDate,
  votes: v.votes, version_history: v.versionHistory,
});

export const subscriptionsApi = {
  list: async () => listOf(await irReq('/api/v1/subscriptions')).map(mapSub),
  create: async (body: any) => mapSub(await irReq('/api/v1/subscriptions', { method: 'POST', body: JSON.stringify(clean(body)), auth: true })),
  update: (id: string, patch: any) => irReq(`/api/v1/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(clean(patch)), auth: true }),
};
export const notificationsApi = {
  list: async () => listOf(await irReq('/api/v1/notifications')).map(mapNotif),
  get: async (id: string) => { try { return mapNotif(await irReq(`/api/v1/notifications/${id}`)); } catch { return null; } },
  create: async (body: any) => mapNotif(await irReq('/api/v1/notifications', { method: 'POST', body: JSON.stringify(toNotifBody(body)), auth: true })),
  update: (id: string, patch: any) => irReq(`/api/v1/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(toNotifBody(patch)), auth: true }),
};
export const votingApi = {
  list: async () => listOf(await irReq('/api/v1/votes')).map(mapVote),
  get: async (id: string) => { try { return mapVote(await irReq(`/api/v1/votes/${id}`)); } catch { return null; } },
  create: async (body: any) => mapVote(await irReq('/api/v1/votes', { method: 'POST', body: JSON.stringify(toVoteBody(body)), auth: true })),
  update: (id: string, patch: any) => irReq(`/api/v1/votes/${id}`, { method: 'PATCH', body: JSON.stringify(toVoteBody(patch)), auth: true }),
};
export const settingsApi = {
  get: async () => irReq<any>('/api/v1/settings'),
  update: (patch: any) => irReq('/api/v1/settings', { method: 'PUT', body: JSON.stringify(clean(patch)), auth: true }),
};

// ── Board materials, admin-generated reports, performance snapshot ────────────
const mapMaterial = (r: any) => ({
  id: String(r.id), title: r.title, meetingDate: r.meeting_date ?? r.meetingDate,
  classification: r.classification, relatedVotes: r.related_votes ?? r.relatedVotes ?? [],
  documentIds: r.document_ids ?? r.documentIds ?? [], workflowStatus: r.workflow_status ?? r.workflowStatus,
  versionHistory: r.version_history ?? r.versionHistory ?? [],
});
const toMaterialBody = (m: any) => clean({
  title: m.title, meeting_date: m.meetingDate, classification: m.classification,
  related_votes: m.relatedVotes, document_ids: m.documentIds, workflow_status: m.workflowStatus,
  version_history: m.versionHistory,
});
const mapReport = (r: any) => ({
  id: String(r.id), title: r.title, reportType: r.report_type ?? r.reportType,
  dateRange: r.date_range ?? r.dateRange ?? {}, includedModules: r.included_modules ?? r.includedModules ?? [],
  generatedByRole: r.generated_by_role ?? r.generatedByRole, status: r.status,
  generatedAt: r.generated_at ?? r.generatedAt, exportFormat: r.export_format ?? r.exportFormat,
  dataSnapshot: r.data_snapshot ?? r.dataSnapshot ?? {}, versionHistory: r.version_history ?? r.versionHistory ?? [],
});
const toReportBody = (r: any) => clean({
  title: r.title, report_type: r.reportType, date_range: r.dateRange, included_modules: r.includedModules,
  generated_by_role: r.generatedByRole, status: r.status, generated_at: r.generatedAt,
  export_format: r.exportFormat, data_snapshot: r.dataSnapshot, version_history: r.versionHistory,
});

export const boardMaterialsApi = {
  list: async () => listOf(await irReq('/api/v1/board-materials')).map(mapMaterial),
  create: async (body: any) => mapMaterial(await irReq('/api/v1/board-materials', { method: 'POST', body: JSON.stringify(toMaterialBody(body)), auth: true })),
  update: (id: string, patch: any) => irReq(`/api/v1/board-materials/${id}`, { method: 'PATCH', body: JSON.stringify(toMaterialBody(patch)), auth: true }),
};
export const generatedReportsApi = {
  list: async () => listOf(await irReq('/api/v1/generated-reports')).map(mapReport),
  get: async (id: string) => { try { return mapReport(await irReq(`/api/v1/generated-reports/${id}`)); } catch { return null; } },
  create: async (body: any) => mapReport(await irReq('/api/v1/generated-reports', { method: 'POST', body: JSON.stringify(toReportBody(body)), auth: true })),
  update: (id: string, patch: any) => irReq(`/api/v1/generated-reports/${id}`, { method: 'PATCH', body: JSON.stringify(toReportBody(patch)), auth: true }),
};
export const performanceApi = {
  metrics: async () => irReq<any>('/api/v1/performance/metrics'),
};
