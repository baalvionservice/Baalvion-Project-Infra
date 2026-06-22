/**
 * @file server/logistics/shipment-tracking.ts
 * @description Pure shipment-status mechanics: the legal status transition graph
 * and the mapping from a tracking-event type to the status it implies. Keeping
 * this pure makes the lifecycle rules deterministic and unit-testable; the
 * service applies them when a tracking event lands.
 */

export type ShipmentStatus =
  | 'CREATED'
  | 'BOOKED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'CUSTOMS_HOLD'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'CANCELLED';

/** Legal next states from each status. */
export const SHIPMENT_TRANSITIONS: Readonly<Record<ShipmentStatus, ShipmentStatus[]>> = {
  CREATED: ['BOOKED', 'CANCELLED', 'EXCEPTION'],
  BOOKED: ['IN_TRANSIT', 'CANCELLED', 'EXCEPTION'],
  IN_TRANSIT: ['ARRIVED', 'CUSTOMS_HOLD', 'DELIVERED', 'EXCEPTION'],
  ARRIVED: ['CUSTOMS_HOLD', 'DELIVERED', 'EXCEPTION'],
  CUSTOMS_HOLD: ['IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'EXCEPTION'],
  EXCEPTION: ['IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const SHIPMENT_TERMINAL: ReadonlySet<ShipmentStatus> = new Set(['DELIVERED', 'CANCELLED']);

/** The status implied by a tracking-event type, if any. */
export const EVENT_TYPE_TO_STATUS: Readonly<Record<string, ShipmentStatus>> = {
  BOOKED: 'BOOKED',
  GATE_OUT: 'IN_TRANSIT',
  DEPARTED: 'IN_TRANSIT',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  CUSTOMS: 'CUSTOMS_HOLD',
  CUSTOMS_HOLD: 'CUSTOMS_HOLD',
  CUSTOMS_CLEARED: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  EXCEPTION: 'EXCEPTION',
  DELAY: 'EXCEPTION',
  CANCELLED: 'CANCELLED',
};

export function isTerminal(status: ShipmentStatus): boolean {
  return SHIPMENT_TERMINAL.has(status);
}

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  if (from === to) return true; // idempotent updates (e.g. repeated IN_TRANSIT pings)
  return (SHIPMENT_TRANSITIONS[from] ?? []).includes(to);
}

export class ShipmentTrackingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShipmentTrackingError';
  }
}

export function assertTransition(from: ShipmentStatus, to: ShipmentStatus): void {
  if (isTerminal(from) && from !== to) {
    throw new ShipmentTrackingError(`TERMINAL_STATE: shipment is ${from} and cannot change`);
  }
  if (!canTransition(from, to)) {
    throw new ShipmentTrackingError(`ILLEGAL_TRANSITION: ${from} -> ${to}`);
  }
}

/** Map a tracking event type to its implied shipment status (null if none). */
export function statusForEventType(eventType: string): ShipmentStatus | null {
  return EVENT_TYPE_TO_STATUS[eventType.toUpperCase()] ?? null;
}

export interface TrackingEventResolution {
  status: ShipmentStatus; // the status to set after the event
  changed: boolean; // whether it differs from the current status
}

/**
 * Resolve the shipment status after a tracking event. Returns the current status
 * unchanged when the event implies no status or an illegal transition (the event
 * is still recorded — tracking is observational, never lossy).
 */
export function resolveTrackingStatus(current: ShipmentStatus, eventType: string): TrackingEventResolution {
  const implied = statusForEventType(eventType);
  if (!implied || implied === current) return { status: current, changed: false };
  if (isTerminal(current) || !canTransition(current, implied)) return { status: current, changed: false };
  return { status: implied, changed: true };
}
