/**
 * @file server/logistics/__tests__/logistics-engine.test.ts
 * @description Unit tests for the pure logistics modules: freight rating
 * (chargeable/volumetric weight + quote maths) and shipment-tracking transitions.
 */
import { describe, it, expect } from 'vitest';
import { rateFreight, chargeableWeightKg, volumetricWeightKg, isQuoteValid } from '../freight-rating';
import {
  canTransition,
  assertTransition,
  resolveTrackingStatus,
  statusForEventType,
  isTerminal,
  ShipmentTrackingError,
} from '../shipment-tracking';

describe('freight-rating — chargeable weight', () => {
  it('computes volumetric weight at the air factor (1:6)', () => {
    expect(volumetricWeightKg('AIR', 2)).toBe(334); // 2 m³ × 167
  });

  it('bills the greater of actual and volumetric weight', () => {
    // 1 m³ sea = 1000 kg volumetric, actual 200 kg → chargeable 1000
    expect(chargeableWeightKg({ mode: 'SEA', weightKg: 200, volumeM3: 1 })).toBe(1000);
    // dense cargo: actual dominates
    expect(chargeableWeightKg({ mode: 'AIR', weightKg: 500, volumeM3: 1 })).toBe(500);
  });

  it('honours a volumetric factor override', () => {
    expect(chargeableWeightKg({ mode: 'SEA', weightKg: 0, volumeM3: 2, volumetricFactorKgPerM3: 250 })).toBe(500);
  });
});

describe('freight-rating — quote maths', () => {
  it('rates base, surcharge and total', () => {
    const r = rateFreight({ mode: 'AIR', weightKg: 1000, volumeM3: 1, ratePerKg: 2.5, surchargePct: 10 });
    // chargeable = max(1000, 167) = 1000; base = 2500; surcharge = 250; total = 2750
    expect(r.chargeableWeightKg).toBe(1000);
    expect(r.baseAmount).toBe(2500);
    expect(r.surchargeAmount).toBe(250);
    expect(r.totalAmount).toBe(2750);
  });

  it('applies the minimum charge floor', () => {
    const r = rateFreight({ mode: 'ROAD', weightKg: 5, ratePerKg: 1, minimumCharge: 75 });
    expect(r.baseAmount).toBe(75);
    expect(r.totalAmount).toBe(75);
  });

  it('rejects a negative rate', () => {
    expect(() => rateFreight({ mode: 'SEA', weightKg: 1, ratePerKg: -1 })).toThrow(/RATE_NEGATIVE/);
  });

  it('treats an open-ended quote as always valid and an expired one as invalid', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    expect(isQuoteValid(null, now)).toBe(true);
    expect(isQuoteValid(new Date('2026-06-23T00:00:00.000Z'), now)).toBe(true);
    expect(isQuoteValid(new Date('2026-06-21T00:00:00.000Z'), now)).toBe(false);
  });
});

describe('shipment-tracking — transitions', () => {
  it('allows legal transitions and rejects illegal ones', () => {
    expect(canTransition('CREATED', 'BOOKED')).toBe(true);
    expect(canTransition('BOOKED', 'IN_TRANSIT')).toBe(true);
    expect(canTransition('CREATED', 'DELIVERED')).toBe(false);
  });

  it('treats a same-status update as idempotent', () => {
    expect(canTransition('IN_TRANSIT', 'IN_TRANSIT')).toBe(true);
  });

  it('throws on a transition out of a terminal state', () => {
    expect(isTerminal('DELIVERED')).toBe(true);
    expect(() => assertTransition('DELIVERED', 'IN_TRANSIT')).toThrow(ShipmentTrackingError);
  });

  it('throws on an illegal transition', () => {
    expect(() => assertTransition('CREATED', 'DELIVERED')).toThrow(/ILLEGAL_TRANSITION/);
  });
});

describe('shipment-tracking — event resolution', () => {
  it('maps event types to implied statuses', () => {
    expect(statusForEventType('DEPARTED')).toBe('IN_TRANSIT');
    expect(statusForEventType('customs')).toBe('CUSTOMS_HOLD');
    expect(statusForEventType('UNKNOWN_EVENT')).toBeNull();
  });

  it('advances the shipment status when the event implies a legal change', () => {
    const r = resolveTrackingStatus('BOOKED', 'DEPARTED');
    expect(r.changed).toBe(true);
    expect(r.status).toBe('IN_TRANSIT');
  });

  it('records but does not change status when the transition is illegal', () => {
    const r = resolveTrackingStatus('CREATED', 'DELIVERED');
    expect(r.changed).toBe(false);
    expect(r.status).toBe('CREATED');
  });

  it('does not change a terminal shipment', () => {
    const r = resolveTrackingStatus('DELIVERED', 'EXCEPTION');
    expect(r.changed).toBe(false);
    expect(r.status).toBe('DELIVERED');
  });
});
