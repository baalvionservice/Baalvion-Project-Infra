/**
 * @file trade.events.ts
 * @description THE AUTHORITATIVE KAFKA TAXONOMY.
 * Every trade lifecycle event is a cryptographically bound signal.
 */

export enum TradeEventTopic {
  SOURCING = 'baalvion.trade.sourcing',
  NEGOTIATION = 'baalvion.trade.negotiation',
  TREASURY = 'baalvion.trade.treasury',
  LOGISTICS = 'baalvion.trade.logistics',
  GOVERNANCE = 'baalvion.governance.audit',
  AI_COGNITION = 'baalvion.intelligence.cognition'
}

export interface SovereignEvent<T = any> {
  eventId: string;
  aggregateId: string;
  eventType: string;
  payload: T;
  metadata: {
    tenantId: string;
    actorId: string;
    correlationId: string;
    version: number;
    timestamp: string;
    signature: string;
  };
}

export const TRADE_EXECUTION_EVENTS = {
  RFQ_PUBLISHED: 'RFQ_PUBLISHED',
  BID_SUBMITTED: 'BID_SUBMITTED',
  HANDSHAKE_FINALIZED: 'HANDSHAKE_FINALIZED',
  ESCROW_LOCKED: 'ESCROW_LOCKED',
  SHIPMENT_BOOKED: 'SHIPMENT_BOOKED',
  MILESTONE_VERIFIED: 'MILESTONE_VERIFIED',
  SETTLEMENT_RELEASED: 'SETTLEMENT_RELEASED',
  ANOMALY_DETECTED: 'ANOMALY_DETECTED'
};