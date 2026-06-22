/**
 * @file server/gckb/__tests__/fta-compare.integration.test.ts
 * @description Integration tests for the FTA explorer + rules-of-origin detail and
 * the country-comparison projection against real PostgreSQL.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { listAgreements, getAgreementDetail, compareCountries } from '../public-read';

const GLOBAL: KbActorContext = { organizationId: null, actorId: 'kb-admin', actorRole: 'PLATFORM_ADMIN', source: 'test' };

async function seedWorld() {
  await gckbService.create(GLOBAL, 'country', { name: 'India', code: 'IN', status: 'PUBLISHED', attributes: { alpha2: 'IN', alpha3: 'IND', region: 'Asia' } });
  await gckbService.create(GLOBAL, 'country', { name: 'United Arab Emirates', code: 'AE', status: 'PUBLISHED', attributes: { alpha2: 'AE', alpha3: 'ARE', region: 'Asia' } });

  await gckbService.create(GLOBAL, 'trade_agreement', {
    name: 'India–UAE CEPA', code: 'IND-UAE-CEPA', status: 'PUBLISHED',
    attributes: { kind: 'FTA', status: 'IN_FORCE', memberCountryCodes: ['IN', 'AE'], rulesOfOriginSummary: '40% regional value content.' },
  });
  // DRAFT agreement — must not surface.
  await gckbService.create(GLOBAL, 'trade_agreement', { name: 'Draft Pact', code: 'DRAFT-PACT', attributes: { kind: 'FTA', memberCountryCodes: ['IN', 'US'] } });

  await gckbService.create(GLOBAL, 'country_policy', { name: 'CEPA Preferential', countryCode: 'IN', policyType: 'tariff', code: 'cepa-1006', status: 'PUBLISHED', hsCode: '1006', attributes: { ratePercent: 0, preferentialUnder: 'IND-UAE-CEPA' } });
  await gckbService.create(GLOBAL, 'country_policy', { name: 'MFN Duty', countryCode: 'IN', policyType: 'tariff', code: 'mfn-1006', status: 'PUBLISHED', hsCode: '1006', attributes: { ratePercent: 10 } });
  await gckbService.create(GLOBAL, 'country_policy', { name: 'IGST', countryCode: 'IN', policyType: 'tax', code: 'igst', status: 'PUBLISHED', attributes: { taxName: 'IGST', taxType: 'GST', ratePercent: 18 } });
  await gckbService.create(GLOBAL, 'country_policy', { name: 'UAE VAT', countryCode: 'AE', policyType: 'tax', code: 'vat', status: 'PUBLISHED', attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 5 } });
}

describe('gckb FTA + compare (PostgreSQL)', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedWorld();
  });
  afterAll(async () => {
    await disconnect();
  });

  it('lists only published agreements', async () => {
    const agreements = await listAgreements();
    const keys = agreements.map((a) => a.recordKey);
    expect(keys).toContain('IND-UAE-CEPA');
    expect(keys).not.toContain('DRAFT-PACT');
  });

  it('resolves members and preferential tariff lines for an agreement', async () => {
    const detail = await getAgreementDetail('IND-UAE-CEPA');
    expect(detail).not.toBeNull();
    expect(detail!.members.map((m) => m.code).sort()).toEqual(['AE', 'IN']);
    expect(detail!.agreement.rulesOfOriginSummary).toContain('40%');
    // Only the preferential line under this FTA — not the MFN line.
    expect(detail!.preferentialTariffs).toHaveLength(1);
    expect(detail!.preferentialTariffs[0].countryCode).toBe('IN');
    expect(detail!.preferentialTariffs[0].ratePercent).toBe(0);
  });

  it('returns null for an unpublished/unknown agreement', async () => {
    expect(await getAgreementDetail('DRAFT-PACT')).toBeNull();
    expect(await getAgreementDetail('NOPE')).toBeNull();
  });

  it('compares countries side by side, reporting missing ones', async () => {
    const cmp = await compareCountries(['IN', 'AE', 'ZZ']);
    expect(cmp.countries.map((c) => c.country.code).sort()).toEqual(['AE', 'IN']);
    expect(cmp.missing).toEqual(['ZZ']);
    const india = cmp.countries.find((c) => c.country.code === 'IN')!;
    expect(india.groupCounts.tariff).toBe(2);
    expect(india.groupCounts.tax).toBe(1);
    expect(india.agreements).toBe(1);
    expect(india.taxes[0].taxType).toBe('GST');
  });
});
