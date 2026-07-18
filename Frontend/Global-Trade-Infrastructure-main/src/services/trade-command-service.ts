/**
 * @file services/trade-command-service.ts
 * @description Same-origin client for the orchestration Trade API
 * (/api/trades/*). Mirrors the platform's { success, data, error } envelope and
 * forwards the caller's identity headers so the server enforces auth/tenancy.
 * This is the read/command bridge the Trade Command Center UI uses.
 */
import type { TradeTerms } from '@/orchestration/ports';
import { fetchLocalApi } from '@/lib/local-api-client';

export interface NamedRef {
  id: string;
  name: string;
}

export interface StatusRow {
  id: string;
  status: string;
  createdAt: string;
  amount?: string;
  currency?: string;
  totalAmount?: string;
  externalRef?: string | null;
  carrier?: string | null;
  origin?: string | null;
  destination?: string | null;
  country?: string | null;
}

export interface WorkflowEventRow {
  id: string;
  type: string;
  fromState: string | null;
  toState: string;
  actorId: string;
  actorRole: string;
  reason: string | null;
  sequence: number;
  createdAt: string;
}

export interface DocumentRow {
  id: string;
  kind: string;
  version: number;
  status: string;
  url: string | null;
  createdAt: string;
}

export interface TradeGraph {
  id: string;
  reference: string;
  correlationId: string;
  currentState: string;
  riskStatus: string;
  complianceStatus: string;
  organizationId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  buyer: NamedRef | null;
  supplier: NamedRef | null;
  rfqId: string | null;
  dealId: string | null;
  orderId: string | null;
  escrowId: string | null;
  paymentId: string | null;
  shipmentId: string | null;
  customsId: string | null;
  settlementId: string | null;
  terms: TradeTerms;
  rfq: StatusRow | null;
  deal: StatusRow | null;
  order: StatusRow | null;
  escrow: StatusRow | null;
  payment: StatusRow | null;
  shipment: StatusRow | null;
  customs: StatusRow | null;
  settlement: StatusRow | null;
  documents: DocumentRow[];
  workflowEvents: WorkflowEventRow[];
}

export interface TradeListItem {
  id: string;
  reference: string;
  currentState: string;
  riskStatus: string;
  complianceStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface WorkflowView {
  tradeId: string;
  currentState: string;
  version: number;
  riskStatus: string;
  complianceStatus: string;
  history: WorkflowEventRow[];
}

export interface RiskRow {
  id: string;
  score: number;
  level: string;
  factors: string[];
  model: string;
  createdAt: string;
}

export interface ComplianceRow {
  id: string;
  type: string;
  outcome: string;
  subject: string;
  reasons: string[];
  createdAt: string;
}

export interface ComplianceView {
  risk: RiskRow[];
  compliance: ComplianceRow[];
}

export interface FinanceInstrumentRow {
  id: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  provider: string | null;
  createdAt: string;
}

export interface FinanceRequestRow {
  id: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  requestedBy: string;
  decidedBy: string | null;
  reason: string | null;
  instrumentId: string | null;
  createdAt: string;
}

export interface FinanceView {
  instruments: FinanceInstrumentRow[];
  requests: FinanceRequestRow[];
}

export interface DomainEventRow {
  id: string;
  eventId: string;
  type: string;
  correlationId: string;
  occurredAt: string;
  payload: unknown;
}

export interface AuditRow {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorRole: string | null;
  source: string;
  createdAt: string;
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// The /api/trades/* routes trust ONLY a signed gateway identity envelope, never client-supplied
// actor/org headers (CR-1). fetchLocalApi mints one from the caller's own verified session (see
// lib/local-api-client.ts) and attaches it.
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchLocalApi(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body || body.success === false) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}

export interface CreateTradeBody {
  organizationName?: string;
  organizationSlug?: string;
  reference?: string;
  terms: TradeTerms;
  buyer?: { name: string; externalRef?: string };
  supplier?: { name: string; externalRef?: string };
  metadata?: Record<string, unknown>;
}

export const tradeCommandService = {
  list(params: { page?: number; pageSize?: number; state?: string } = {}): Promise<Paginated<TradeListItem>> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.state) q.set('state', params.state);
    return request<Paginated<TradeListItem>>(`/api/trades?${q.toString()}`);
  },

  get(id: string): Promise<TradeGraph> {
    return request<TradeGraph>(`/api/trades/${id}`);
  },

  workflow(id: string): Promise<WorkflowView> {
    return request<WorkflowView>(`/api/trades/${id}/workflow`);
  },

  compliance(id: string): Promise<ComplianceView> {
    return request<ComplianceView>(`/api/trades/${id}/compliance`);
  },

  finance(id: string): Promise<FinanceView> {
    return request<FinanceView>(`/api/trades/${id}/finance`);
  },

  documents(id: string): Promise<DocumentRow[]> {
    return request<DocumentRow[]>(`/api/trades/${id}/documents`);
  },

  events(id: string): Promise<DomainEventRow[]> {
    return request<DomainEventRow[]>(`/api/trades/${id}/events`);
  },

  audit(id: string, page = 1): Promise<Paginated<AuditRow>> {
    return request<Paginated<AuditRow>>(`/api/trades/${id}/audit?page=${page}`);
  },

  create(body: CreateTradeBody): Promise<TradeGraph> {
    return request<TradeGraph>('/api/trades', { method: 'POST', body: JSON.stringify(body) });
  },

  cancel(id: string, reason: string): Promise<TradeGraph> {
    return request<TradeGraph>(`/api/trades/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
  },

  complete(id: string): Promise<TradeGraph> {
    return request<TradeGraph>(`/api/trades/${id}/complete`, { method: 'POST', body: JSON.stringify({}) });
  },

  requestFinance(
    id: string,
    body: { type: string; amount: number; currency?: string },
  ): Promise<FinanceRequestRow> {
    return request<FinanceRequestRow>(`/api/trades/${id}/finance`, { method: 'POST', body: JSON.stringify(body) });
  },

  decideFinance(
    requestId: string,
    body: { decision: 'approved' | 'rejected'; reason?: string; provider?: string },
  ): Promise<unknown> {
    return request(`/api/finance/${requestId}/decision`, { method: 'POST', body: JSON.stringify(body) });
  },

  addDocument(
    id: string,
    body: { kind: string; url?: string; metadata?: Record<string, unknown> },
  ): Promise<DocumentRow> {
    return request<DocumentRow>(`/api/trades/${id}/documents`, { method: 'POST', body: JSON.stringify(body) });
  },
};
