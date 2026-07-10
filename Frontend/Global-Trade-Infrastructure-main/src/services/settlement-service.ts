/**
 * @file settlement-service.ts
 * @description Settlement engine for a single deal's escrow release.
 *
 * The real financial-services-java SettlementController (/api/v1/settlement) is a bulk batch/
 * bank-file API (createBatch -> generate -> submit) for scheduled ACH/wire disbursement runs —
 * a different concern from releasing one deal's escrow. For a single order, "getting paid" IS
 * the escrow release: escrow-service fires `escrow.hold.released` on Kafka, which the real
 * ledger-service consumer posts as the actual credit to the beneficiary account. There is no
 * separate client-side settlement step to orchestrate — the batch API is a treasury/ops-console
 * concern for a later phase, not part of the per-deal buyer/seller flow.
 */
import { releaseEscrow } from './escrow-service';
import { logger, metricsService } from './observability-service';

export type SettlementStatus = 'pending' | 'processing' | 'settled' | 'failed';

/**
 * Releases the deal's escrow, which triggers the real (server-side, async) credit to the
 * seller's ledger account. Returns true once the release call to escrow-service succeeds;
 * false on any failure (invalid state, network, etc.) so the caller can surface an error
 * without the operation half-completing.
 */
export async function triggerSettlement(escrowId: string, actorId: string): Promise<boolean> {
  logger.info('Settlement_Engine', `INITIATING_RELEASE: Escrow ${escrowId} by ${actorId}`);
  try {
    const escrow = await releaseEscrow(escrowId);
    metricsService.recordMetric('capital_release_finalized', escrow.amount);
    return true;
  } catch (error: any) {
    logger.error('Settlement_Engine', `RELEASE_FAILURE: ${error.message}`);
    return false;
  }
}
