/**
 * @file server/gckb/__tests__/duty-calculator.integration.test.ts
 * @description Integration tests for the duty-estimation orchestrator against real
 * PostgreSQL: it must read only PUBLISHED global policies, apply the FTA
 * preferential tariff when the origin qualifies, and fall back to MFN otherwise.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { estimateDuty } from '../duty-calculator';

const GLOBAL: KbActorContext = { organizationId: null, actorId: 'kb-admin', actorRole: 'PLATFORM_ADMIN', source: 'test' };

async function seedTariffWorld() {
  await gckbService.create(GLOBAL, 'country', { name: 'India', code: 'IN', status: 'PUBLISHED', attributes: { alpha2: 'IN', alpha3: 'IND' } });
  await gckbService.create(GLOBAL, 'country', { name: 'United Arab Emirates', code: 'AE', status: 'PUBLISHED', attributes: { alpha2: 'AE', alpha3: 'ARE' } });

  await gckbService.create(GLOBAL, 'country_policy', { name: 'MFN Customs Duty', countryCode: 'IN', policyType: 'tariff', code: 'mfn-1006', status: 'PUBLISHED', hsCode: '1006', attributes: { schedule: 'MFN', ratePercent: 10 } });
  await gckbService.create(GLOBAL, 'country_policy', { name: 'CEPA Preferential', countryCode: 'IN', policyType: 'tariff', code: 'cepa-1006', status: 'PUBLISHED', hsCode: '1006', attributes: { ratePercent: 0, preferentialUnder: 'IND-UAE-CEPA' } });
  await gckbService.create(GLOBAL, 'country_policy', { name: 'IGST', countryCode: 'IN', policyType: 'tax', code: 'igst', status: 'PUBLISHED', attributes: { taxName: 'IGST', taxType: 'GST', ratePercent: 18 } });
  // A DRAFT anti-dumping duty — must NOT affect the estimate.
  await gckbService.create(GLOBAL, 'country_policy', { name: 'Draft AD', countryCode: 'IN', policyType: 'duty', code: 'ad-draft', hsCode: '1006', attributes: { dutyType: 'ANTI_DUMPING', ratePercent: 30 } });

  await gckbService.create(GLOBAL, 'trade_agreement', { name: 'India–UAE CEPA', code: 'IND-UAE-CEPA', status: 'PUBLISHED', attributes: { kind: 'FTA', status: 'IN_FORCE', memberCountryCodes: ['IN', 'AE'] } });
}

describe('duty estimateDuty (PostgreSQL)', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedTariffWorld();
  });
  afterAll(async () => {
    await disconnect();
  });

  it('applies the FTA preferential tariff when origin qualifies', async () => {
    const est = await estimateDuty({ destinationCountryCode: 'IN', originCountryCode: 'AE', hsCode: '10063010', customsValue: 1000, currency: 'INR' });
    const bcd = est.lines.find((l) => l.key === 'bcd')!;
    expect(bcd.amount).toBe(0);
    expect(bcd.preferential).toBe(true);
    expect(est.ftaApplied?.saving).toBe(100);
    expect(est.totals.taxes).toBe(180); // 18% of 1000
    expect(est.totals.landedCost).toBe(1180);
  });

  it('falls back to the MFN tariff with no qualifying origin', async () => {
    const est = await estimateDuty({ destinationCountryCode: 'IN', originCountryCode: 'US', hsCode: '10063010', customsValue: 1000, currency: 'INR' });
    expect(est.lines.find((l) => l.key === 'bcd')!.amount).toBe(100);
    expect(est.ftaApplied).toBeNull();
    expect(est.totals.taxes).toBe(198); // 18% of 1100
    expect(est.totals.landedCost).toBe(1298);
  });

  it('ignores DRAFT policies (the draft anti-dumping duty is not applied)', async () => {
    const est = await estimateDuty({ destinationCountryCode: 'IN', hsCode: '10063010', customsValue: 1000, currency: 'INR' });
    expect(est.lines.some((l) => l.label === 'Draft AD')).toBe(false);
    expect(est.totals.duties).toBe(100); // MFN only
  });

  it('returns a graceful estimate noting an unknown destination', async () => {
    const est = await estimateDuty({ destinationCountryCode: 'ZZ', hsCode: '1006', customsValue: 500, currency: 'USD' });
    expect(est.lines).toHaveLength(0);
    expect(est.totals.landedCost).toBe(500);
    expect(est.notes.some((n) => n.includes('not published'))).toBe(true);
  });
});
