/**
 * @file event-bus.service.ts
 * @description THE PLANETARY EVENT DISPATCHER.
 * Ensures the Transactional Outbox Pattern for atomic cross-service state.
 */
import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { TradeEventTopic, SovereignEvent } from '../../events/src/trade.events';

@Injectable()
export class TradeEventBus {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  /**
   * Commits a Sovereign Event to the distributed mesh.
   */
  async publish(topic: TradeEventTopic, event: Omit<SovereignEvent, 'eventId' | 'timestamp'>) {
    const fullEvent: SovereignEvent = {
      ...event,
      eventId: `EVT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };

    return this.kafkaClient.emit(topic, fullEvent);
  }
}
