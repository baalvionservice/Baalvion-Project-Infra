import { serviceClients } from './client';
import type { IrListEnvelope, IrResource } from '@/lib/types/ir.types';
import type {
  Shareholder, ShareholderPayload,
  EarningsCall, EarningsPayload,
  IrEvent, EventPayload,
  Filing, FilingPayload,
  IrDocument, DocumentPayload,
  PerformanceSnapshot, PerformancePayload,
  MarketSnapshot, MarketPayload,
  InvestorApplication,
} from '@/lib/types/ir-modules.types';

const ir = serviceClients.ir;
type Page = { page?: number; limit?: number };

// Each resource mirrors irReportsApi: list → bespoke {data:{items}} envelope,
// single ops → {data:<T>}. Writes are authed (bearer attached by shared interceptor).
export const shareholdersApi = {
  list: (p?: Page) => ir.get<IrListEnvelope<Shareholder>>('/shareholders', { params: p }),
  create: (b: ShareholderPayload) => ir.post<IrResource<Shareholder>>('/shareholders', b),
  update: (id: string, b: Partial<ShareholderPayload>) => ir.patch<IrResource<Shareholder>>(`/shareholders/${id}`, b),
  remove: (id: string) => ir.delete<IrResource<{ deleted: boolean }>>(`/shareholders/${id}`),
};

export const earningsApi = {
  list: (p?: Page) => ir.get<IrListEnvelope<EarningsCall>>('/earnings', { params: p }),
  create: (b: EarningsPayload) => ir.post<IrResource<EarningsCall>>('/earnings', b),
  update: (id: string, b: Partial<EarningsPayload>) => ir.patch<IrResource<EarningsCall>>(`/earnings/${id}`, b),
};

export const eventsApi = {
  list: (p?: Page) => ir.get<IrListEnvelope<IrEvent>>('/events', { params: p }),
  create: (b: EventPayload) => ir.post<IrResource<IrEvent>>('/events', b),
  update: (id: string, b: Partial<EventPayload>) => ir.patch<IrResource<IrEvent>>(`/events/${id}`, b),
  remove: (id: string) => ir.delete<IrResource<{ deleted: boolean }>>(`/events/${id}`),
};

export const filingsApi = {
  list: (p?: Page) => ir.get<IrListEnvelope<Filing>>('/filings', { params: p }),
  create: (b: FilingPayload) => ir.post<IrResource<Filing>>('/filings', b),
  update: (id: string, b: Partial<FilingPayload>) => ir.patch<IrResource<Filing>>(`/filings/${id}`, b),
  remove: (id: string) => ir.delete<IrResource<{ deleted: boolean }>>(`/filings/${id}`),
};

export const documentsApi = {
  list: (p?: Page) => ir.get<IrListEnvelope<IrDocument>>('/documents', { params: p }),
  create: (b: DocumentPayload) => ir.post<IrResource<IrDocument>>('/documents', b),
  update: (id: string, b: Partial<DocumentPayload>) => ir.patch<IrResource<IrDocument>>(`/documents/${id}`, b),
  remove: (id: string) => ir.delete<IrResource<{ deleted: boolean }>>(`/documents/${id}`),
};

export const performanceApi = {
  get: () => ir.get<IrResource<PerformanceSnapshot>>('/performance/metrics'),
  update: (b: PerformancePayload) => ir.put<IrResource<PerformanceSnapshot>>('/performance/metrics', b),
};

export const marketApi = {
  get: () => ir.get<IrResource<MarketSnapshot>>('/market'),
  update: (b: MarketPayload) => ir.put<IrResource<MarketSnapshot>>('/market', b),
  refresh: () => ir.post<IrResource<MarketSnapshot>>('/market/refresh'),
};

export const applicationsApi = {
  list: (p?: Page & { status?: string }) =>
    ir.get<IrListEnvelope<InvestorApplication>>('/applications', { params: p }),
  review: (id: string, body: { action: 'approve' | 'reject'; review_note?: string }) =>
    ir.patch<IrResource<InvestorApplication>>(`/applications/${id}`, body),
};
