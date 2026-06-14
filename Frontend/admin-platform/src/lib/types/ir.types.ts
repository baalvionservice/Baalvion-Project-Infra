// Investor Relations domain types.
//
// Source of truth = ir-service (Node/Express, port 3008, schema `ir`), validated
// against the live `ir.reports` table and `validators/schemas.js`. Field names are
// snake_case because they come straight off the IR API (no camelCase transform layer
// like the CMS client has). The list endpoint uses a bespoke paginated envelope
// (`sendPaginated` → { data: { items, total, ... } }), NOT the shared
// PaginatedResponse<T>, so it gets its own IrListEnvelope<T> below.

export type IrReportType = 'quarterly' | 'annual' | 'interim' | 'special';
export type IrReportStatus = 'draft' | 'review' | 'published';

export interface IrReport {
  id: string;
  org_id: string;
  created_by: number | null;
  title: string;
  report_type: IrReportType;
  period_year: number;
  period_quarter: number | null;
  summary: string | null;
  highlights: string[];
  revenue: number | null;
  net_income: number | null;
  eps: number | null;
  revenue_growth_pct: number | null;
  status: IrReportStatus;
  file_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Mutable fields a writer/editor can set. The server derives org_id, created_by,
// status, published_at — never sent by the client.
export interface CreateReportPayload {
  title: string;
  report_type: IrReportType;
  period_year: number;
  period_quarter?: number | null;
  summary?: string;
  highlights?: string[];
  revenue?: number;
  net_income?: number;
  eps?: number;
  revenue_growth_pct?: number;
  file_url?: string;
}

export type UpdateReportPayload = Partial<CreateReportPayload>;

export interface IrReportListParams {
  page?: number;
  limit?: number;
}

// ir-service list responses: { success, data: { items, total, page, limit, totalPages }, meta }
export interface IrListEnvelope<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: unknown;
}

// Single-resource responses: { success, data: <T>, meta }
export interface IrResource<T> {
  success: boolean;
  data: T;
  meta?: unknown;
}

export const IR_REPORT_TYPE_LABELS: Record<IrReportType, string> = {
  quarterly: 'Quarterly',
  annual: 'Annual',
  interim: 'Interim',
  special: 'Special',
};

export const IR_REPORT_TYPES: IrReportType[] = ['quarterly', 'annual', 'interim', 'special'];
export const IR_REPORT_STATUSES: IrReportStatus[] = ['draft', 'review', 'published'];

/** Human-readable period, e.g. "Q2 2026" or "FY 2026". */
export function formatReportPeriod(r: Pick<IrReport, 'period_year' | 'period_quarter'>): string {
  return r.period_quarter ? `Q${r.period_quarter} ${r.period_year}` : `FY ${r.period_year}`;
}
