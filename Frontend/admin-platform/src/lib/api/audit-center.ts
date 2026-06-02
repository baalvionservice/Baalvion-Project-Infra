import { serviceClients } from './client';

// audit-service (port 3032, mounted at /v1) is the immutable hash-chain audit log (WORM).
// IMPORTANT: unlike commerce/order/inventory, audit-service returns RAW JSON — it does NOT
// wrap responses in the { success, data } envelope. So callers read r.data.items / r.data
// directly (no r.data.data).
const client = serviceClients.audit;

export type AuditSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AuditOutcome = 'success' | 'deny' | 'failure';

export interface AuditEvent {
  seq: number;
  eventId: string;
  occurredAt: string;
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  tenantId: string | null;
  scopeId: string | null;
  outcome: string;
  severity: string;
  sourceService: string | null;
  correlationId: string | null;
  metadata: Record<string, unknown>;
  hash: string;
}

export interface AuditListResponse {
  items: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditVerifyResponse {
  ok: boolean;
  checked: number;
  brokenAtSeq: number | null;
  reason: string | null;
}

export interface AuditListParams {
  action?: string;
  actorId?: string;
  resourceType?: string;
  sourceService?: string;
  severity?: AuditSeverity;
  outcome?: AuditOutcome;
  tenantId?: string;
  correlationId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface AuditVerifyParams {
  fromSeq?: number;
  toSeq?: number;
}

export const auditCenterApi = {
  list: (params?: AuditListParams) =>
    client.get<AuditListResponse>('/audit', { params }),

  verify: (params?: AuditVerifyParams) =>
    client.get<AuditVerifyResponse>('/audit/verify', { params }),

  // CSV export: the bearer token is attached by the shared request interceptor, so we must
  // fetch the blob through axios (NOT window.open, which would omit the Authorization header).
  exportCsv: (params?: AuditListParams) =>
    client.get<Blob>('/audit/export', { params, responseType: 'blob' }),
};
