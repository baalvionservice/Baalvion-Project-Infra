
/**
 * @file escrow-service.ts
 * @description Governed management of institutional escrow accounts and multi-currency trade liquidity.
 * Implements a strict state machine for financial security.
 *
 * Escrow is owned by the Java escrow-service (financial-services-java, /api/v1/escrow) — trade-service
 * deliberately retired its own escrow write path (routes/escrowRoutes.js returns 410) to avoid a
 * divergent money state. This client calls the Java service directly via financeClient/finance-bff;
 * trade-service keeps a read-only projection (trade.escrows) synced by a webhook, for admin stats
 * and order linkage only — never call apiClient for escrow reads/writes here.
 */
import { apiClient } from '@/lib/api-client';
import { financeClient, pageContent } from '@/lib/finance-client';
import { logger } from './observability-service';

export type EscrowStatus = 'created' | 'funded' | 'in_transit' | 'delivered' | 'released' | 'refunded' | 'disputed';
export type Escrow = EscrowAccount;

const VALID_ESCROW_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  created: ['funded', 'refunded', 'disputed'],
  // 'released' is permitted directly from funded to match the backend money-state
  // machine (held->released), while keeping the richer intermediate states.
  funded: ['in_transit', 'delivered', 'released', 'refunded', 'disputed'],
  in_transit: ['delivered', 'released', 'disputed'],
  delivered: ['released', 'disputed'],
  released: [],
  refunded: [],
  disputed: ['funded', 'in_transit', 'delivered', 'released', 'refunded'] // Disputed is a "hold" state
};

// The real Escrow.metadata (financial-services-java) is a caller-supplied JSON *string*, not an
// object — this is where createEscrowAccount stashes orderId/buyerOrgId/sellerOrgId/names, since
// the Java entity itself has no concept of a GTI order or organization.
function parseMetadata(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, any>;
  try { return JSON.parse(String(raw)); } catch { return {}; }
}

/**
 * The real escrow-service status enum is HELD/RELEASED/REFUNDED/DISPUTED/EXPIRED (a hold IS the
 * funded state — there is no separate "fund" step). Map it onto the richer UI shape; EXPIRED never
 * actually lands (the Java sweep always resolves it to release/refund first) but is mapped
 * defensively to 'refunded' in case that changes.
 */
function mapEscrowFromJava(raw: any): EscrowAccount {
  const statusMap: Record<string, EscrowStatus> = {
    HELD: 'funded', RELEASED: 'released', REFUNDED: 'refunded', DISPUTED: 'disputed', EXPIRED: 'refunded',
  };
  const meta = parseMetadata(raw?.metadata);
  return {
    id: String(raw?.id ?? ''),
    orderId: String(meta.orderId ?? ''),
    buyerId: String(meta.buyerOrgId ?? ''),
    sellerId: String(meta.sellerOrgId ?? ''),
    buyerName: meta.buyerName || 'Buyer Institution',
    sellerName: meta.sellerName || 'Seller Institution',
    amount: Number(raw?.amount) || 0,
    currency: raw?.currency || 'USD',
    status: statusMap[raw?.status] || 'created',
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || new Date().toISOString(),
    escrowRef: raw?.escrowRef,
  } as EscrowAccount;
}

export interface EscrowAccount {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  escrowRef?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

function validateEscrowTransition(current: EscrowStatus, next: EscrowStatus) {
  const allowed = VALID_ESCROW_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid Escrow transition: ${current} -> ${next}`);
  }
}

// account-service has no concept of a GTI org — trade-service is the one place that remembers
// "org X's ledger account is Y" (trade.organizations.ledger_account_id), lazily provisioning it
// on first need. Resolves an org id/code to that account-service account UUID.
async function resolveLedgerAccountId(orgId: string): Promise<string> {
  const res = await apiClient.post<{ orgId: string; ledgerAccountId: string }>(`/organizations/${orgId}/ledger-account`, {});
  if (!res.success || !res.data?.ledgerAccountId) {
    throw new Error(res.error?.message || `Failed to resolve ledger account for org ${orgId}.`);
  }
  return res.data.ledgerAccountId;
}

export async function createEscrowAccount(data: {
  orderId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  currency: string;
}): Promise<EscrowAccount> {
  const [sourceAccountId, beneficiaryAccountId] = await Promise.all([
    resolveLedgerAccountId(data.buyerId),
    resolveLedgerAccountId(data.sellerId),
  ]);

  // Deterministic per-order ref: createHold is idempotent on (tenant, escrowRef), so a retried
  // request for the same order safely returns the existing hold instead of double-provisioning.
  const escrowRef = `ESCROW-ORDER-${data.orderId}`;
  const res = await financeClient.post<any>('/escrow', {
    escrowRef,
    sourceAccountId,
    beneficiaryAccountId,
    amount: data.amount,
    currency: data.currency,
    releaseCondition: 'MANUAL',
    metadata: JSON.stringify({
      orderId: data.orderId,
      buyerOrgId: data.buyerId,
      sellerOrgId: data.sellerId,
      buyerName: data.buyerName,
      sellerName: data.sellerName,
    }),
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to provision escrow.');
  }
  logger.info('EscrowService', `ESCROW_PROVISIONED: Ref ${res.data.id} for Order ${data.orderId}`);
  return mapEscrowFromJava(res.data);
}

/**
 * No-op checkpoint kept for callers written against the old contract (e.g. the trade-lifecycle
 * orchestrator's ESCROW_FUNDED step): a hold on the real escrow-service already represents the
 * funded state at creation — there is no separate "fund" transition to call.
 */
export async function markEscrowAsFunded(id: string, _fxRateUsed: number, _paymentCurrency: string): Promise<EscrowAccount> {
  const current = await getEscrowById(id);
  if (!current) throw new Error('Escrow account not found');
  logger.info('EscrowService', `ESCROW_CHECKPOINT: ${id} already funded at creation (no backend transition)`);
  return current;
}

export async function updateEscrowStatus(id: string, nextStatus: EscrowStatus, metadata: Record<string, any> = {}): Promise<EscrowAccount> {
  const current = await getEscrowById(id);
  if (!current) throw new Error('Escrow account not found');

  validateEscrowTransition(current.status, nextStatus);

  // Route to the real money-state endpoint. in_transit/delivered have no backend
  // transition — treat them as logical checkpoints so the UI flow doesn't break.
  const action: Record<string, string> = { released: 'release', refunded: 'refund', disputed: 'dispute' };
  const endpoint = action[nextStatus];
  if (!endpoint) {
    logger.info('EscrowService', `ESCROW_CHECKPOINT: ${id} -> ${nextStatus} (no backend transition)`);
    return { ...current, status: nextStatus };
  }

  // EscrowActionRequest only has reason/actor — fold any other caller-supplied context
  // (e.g. dispute-service's disputeId) into reason rather than silently dropping it.
  const { reason, actor, ...extra } = metadata;
  const combinedReason = reason || (Object.keys(extra).length ? JSON.stringify(extra) : undefined);
  const res = await financeClient.post<any>(`/escrow/${id}/${endpoint}`, {
    reason: combinedReason,
    actor,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || `Failed to ${endpoint} escrow.`);
  }
  logger.info('EscrowService', `ESCROW_STATE_TRANSITION: ${id} moved to ${nextStatus}`);
  return mapEscrowFromJava(res.data);
}

export async function releaseEscrow(escrowId: string): Promise<EscrowAccount> {
  const escrow = await getEscrowById(escrowId);
  if (!escrow) throw new Error('Escrow account not found');

  // Release is the ledger credit trigger: escrow-service fires `escrow.hold.released` on Kafka,
  // which the ledger-service consumer posts as a real GL entry crediting the beneficiary. No
  // client-side ledger call is needed (or possible — the client has no journal-posting authority).
  return updateEscrowStatus(escrow.id, 'released');
}

export async function refundEscrow(escrowId: string): Promise<EscrowAccount> {
  const escrow = await getEscrowById(escrowId);
  if (!escrow) throw new Error('Escrow account not found');

  return updateEscrowStatus(escrow.id, 'refunded');
}

export async function getEscrowById(id: string): Promise<EscrowAccount | null> {
  const res = await financeClient.get<any>(`/escrow/${id}`);
  return res.success && res.data ? mapEscrowFromJava(res.data) : null;
}

export async function getEscrows(): Promise<EscrowAccount[]> {
  const res = await financeClient.get<any>('/escrow');
  return pageContent(res.data).map(mapEscrowFromJava);
}
