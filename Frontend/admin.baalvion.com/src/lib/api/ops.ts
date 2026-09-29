import { serviceClients } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

const client = serviceClients.orders;

// ── Reconciliation report ───────────────────────────────────────────────────────
// order-service wraps single results as { success, data, meta } → unwrap via r.data.data.
// All monetary fields (capturedMinor / refundedMinor / netMinor) are in MINOR units (cents).

export interface ReconciliationCounts {
  expected: number;
  matched: number;
  missing: number;
  mismatched: number;
}

export interface ReconciliationTotals {
  capturedMinor: number;
  refundedMinor: number;
  netMinor: number;
}

export interface ReconciliationStatus {
  storeId: string;
  ledgerAvailable: boolean;
  balanced: boolean;
  counts: ReconciliationCounts;
  totals: ReconciliationTotals;
}

export interface ReconciliationBackfillResult {
  storeId: string;
  attempted: number;
  posted: number;
  failed: number;
}

export interface ReconciliationRange {
  from?: string;
  to?: string;
}

export const opsApi = {
  reconciliation: (storeId: string, params?: ReconciliationRange) =>
    client.get<ApiResponse<ReconciliationStatus>>(
      `/orders/stores/${storeId}/reconciliation`,
      { params },
    ),

  backfill: (storeId: string, params?: ReconciliationRange) =>
    client.post<ApiResponse<ReconciliationBackfillResult>>(
      `/orders/stores/${storeId}/reconciliation/backfill`,
      undefined,
      { params },
    ),
};
