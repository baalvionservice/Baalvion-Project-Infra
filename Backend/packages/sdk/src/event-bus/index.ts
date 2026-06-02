import { newId } from '../id';
import { loadOptional } from '../load-optional';
import type { SdkEventBus, EventBusOptions, SdkEvent, EventSubscription } from '../types';

/**
 * Facade over @baalvion/events. Guarantees the canonical envelope
 * { eventType, tenantId, timestamp, traceId, payload } and auto-fills
 * tenantId/traceId from the current trace context, so call sites stay one line.
 *
 * Maps onto the existing PlatformEvent ( eventType→type, tenantId→orgId ), so the
 * SDK interoperates with services already on @baalvion/events. New event types
 * should be added to the `EventType` union in @baalvion/types for first-class typing.
 */
export async function createSdkEventBus(opts: EventBusOptions): Promise<SdkEventBus> {
  const mod = await loadOptional<any>('@baalvion/events');
  let bus: any = null;
  if (mod?.createEventBus) {
    bus = await mod.createEventBus({
      transport: opts.transport ?? 'noop',
      nats: opts.nats,
      kafka: opts.kafka,
      logger: opts.logger,
    });
  } else {
    opts.logger?.warn?.({}, 'event-bus: @baalvion/events unavailable — using noop');
  }

  function toSdkEvent<T>(pe: any): SdkEvent<T> {
    return {
      id: pe.id,
      eventType: pe.type,
      tenantId: pe.orgId ?? null,
      userId: pe.userId ?? null,
      timestamp: pe.timestamp,
      traceId: pe.traceId,
      payload: pe.payload as T,
    };
  }

  return {
    async publish<T>(eventType: string, payload: T, meta?: { tenantId?: string | null; userId?: string | null }) {
      const t = opts.trace?.current();
      const platformEvent = {
        id: newId(),
        type: eventType,
        payload,
        orgId: meta?.tenantId ?? t?.tenantId ?? null,
        userId: meta?.userId ?? t?.userId ?? null,
        timestamp: new Date().toISOString(),
        traceId: t?.traceId ?? newId(),
      };
      if (bus) await bus.publish(platformEvent);
      else opts.logger?.debug?.({ eventType, tenantId: platformEvent.orgId, traceId: platformEvent.traceId }, 'event (noop bus)');
    },

    async subscribe<T>(pattern: string, durable: string, handler: (e: SdkEvent<T>) => Promise<void> | void): Promise<EventSubscription> {
      if (!bus) return { unsubscribe: async () => {} };
      return bus.subscribe(pattern, durable, (pe: any) => handler(toSdkEvent<T>(pe)));
    },

    async close() { if (bus?.close) await bus.close(); },
    raw() { return bus; },
  };
}
