
/**
 * @file signal-intelligence.ts
 * @description Sovereign SIGINT engine for global trade signal processing.
 * Correlates geopolitical events with institutional operational health.
 */
import { apiClient } from '@/lib/api-client';
import { logger } from '../observability-service';
import { TradeSignal } from '@/types/institutional';
import { eventBus } from '@/orchestration/event-bus';

class SignalIntelligenceService {
  private static instance: SignalIntelligenceService;

  private constructor() {}

  public static getInstance(): SignalIntelligenceService {
    if (!SignalIntelligenceService.instance) {
      SignalIntelligenceService.instance = new SignalIntelligenceService();
    }
    return SignalIntelligenceService.instance;
  }

  /**
   * Retrieves active geopolitical and operational signals affecting the network.
   * Returns a genuinely empty array when none exist — no fabricated fallback.
   */
  async getActiveSignals(): Promise<TradeSignal[]> {
    const res = await apiClient.get<TradeSignal[]>('/trade_signals', { limit: 10 });
    return res.data ?? [];
  }

  /** A single signal by id, for the detail view. */
  async getSignal(id: string): Promise<TradeSignal | null> {
    const res = await apiClient.get<TradeSignal>(`/trade_signals/${id}`);
    return res.data ?? null;
  }

  /**
   * Propagates a strategic signal through the network via the Unified Event Bus.
   */
  async propagateSignal(signal: TradeSignal) {
    logger.warn('SIGINT', `PROPAGATING_SIGNAL: ${signal.type} - Impact: ${signal.impactScore}`);
    
    await eventBus.emit('SIGINT', signal.id, 'GEOPOLITICAL_SIGNAL_PROPAGATED', signal);

    if (signal.severity === 'critical') {
      await apiClient.post('/alerts', {
        type: 'SYSTEMIC_RISK',
        message: `Strategic Signal Alarm: ${signal.message}`,
        severity: 'critical',
        status: 'active'
      });
    }
  }
}

export const sigIntService = SignalIntelligenceService.getInstance();
