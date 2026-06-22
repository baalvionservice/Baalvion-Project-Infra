/**
 * @file server/gckb/__tests__/seed-data.integration.test.ts
 * @description Validates the GCKB seed dataset (src/server/gckb/seed-data.json)
 * against real PostgreSQL by importing it through the GCKB service exactly as the
 * production seed would, then exercising the full public-portal pipeline end to
 * end: explorer, country profile, duty calculator (with FTA preference) and the
 * FTA detail view. This guarantees the seed data is registry-valid and that the
 * whole country/regulatory stack renders real results.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resetDatabase, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { listCountries, getCountryProfile, listAgreements, getAgreementDetail } from '../public-read';
import { estimateDuty } from '../duty-calculator';
import seed from '../seed-data.json';

const GLOBAL: KbActorContext = { organizationId: null, actorId: 'seed', actorRole: 'PLATFORM_ADMIN', source: 'test' };

type Row = {
  code?: string;
  name: string;
  countryCode?: string;
  policyType?: string;
  hsCode?: string;
  attributes: Record<string, unknown>;
};

async function seedRows(entityType: string, rows: Row[]) {
  for (const r of rows) {
    await gckbService.create(GLOBAL, entityType, {
      name: r.name,
      code: r.code ?? null,
      countryCode: r.countryCode ?? null,
      policyType: r.policyType ?? null,
      hsCode: r.hsCode ?? null,
      status: 'PUBLISHED',
      attributes: r.attributes,
    });
  }
}

describe('GCKB seed dataset (PostgreSQL)', () => {
  beforeAll(async () => {
    await resetDatabase();
    await seedRows('country', seed.countries as Row[]);
    await seedRows('currency', seed.currencies as Row[]);
    await seedRows('authority', seed.authorities as Row[]);
    await seedRows('point_of_entry', seed.ports as Row[]);
    await seedRows('trade_agreement', seed.agreements as Row[]);
    await seedRows('country_policy', seed.policies as Row[]);
  });
  afterAll(async () => {
    await disconnect();
  });

  it('imports the whole dataset as registry-valid published records', async () => {
    const countries = await listCountries();
    expect(countries).toHaveLength(seed.countries.length);
    expect(countries.map((c) => c.code)).toContain('IN');
    expect(countries.find((c) => c.code === 'IN')!.flagEmoji).toBe('🇮🇳');
  });

  it('builds a complete India country profile, grouped', async () => {
    const profile = await getCountryProfile('IN');
    expect(profile).not.toBeNull();
    const p = profile!;
    const inPolicies = seed.policies.filter((x) => x.countryCode === 'IN').length;
    expect(p.counts.policies).toBe(inPolicies);
    expect(p.policyGroups.tax).toHaveLength(1); // IGST
    // 3 tariffs + 1 duty all bucket into the "tariff" group.
    expect(p.policyGroups.tariff).toHaveLength(4);
    expect(p.policyGroups.license).toHaveLength(1);
    expect(p.policyGroups.certificate).toHaveLength(1);
    expect(p.policyGroups.integration).toHaveLength(1); // ICEGATE
    expect(p.counts.authorities).toBe(2); // CBIC + DGFT
    expect(p.ports.length).toBeGreaterThanOrEqual(3);
    expect(p.agreements.map((a) => a.recordKey)).toContain('IND-UAE-CEPA');
  });

  it('estimates duty with an FTA preference saving (India→Australia ECTA on cars)', async () => {
    const est = await estimateDuty({ destinationCountryCode: 'AU', originCountryCode: 'IN', hsCode: '870323', customsValue: 1000, currency: 'AUD' });
    expect(est.lines.find((l) => l.key === 'bcd')!.amount).toBe(0); // ECTA preferential 0%
    expect(est.ftaApplied?.code).toBe('IND-AUS-ECTA');
    expect(est.ftaApplied?.saving).toBe(50); // vs 5% MFN
    expect(est.totals.taxes).toBe(100); // 10% GST on 1000
    expect(est.totals.landedCost).toBe(1100);
  });

  it('falls back to MFN when origin does not qualify (USA cars, origin India)', async () => {
    const est = await estimateDuty({ destinationCountryCode: 'US', originCountryCode: 'IN', hsCode: '870324', customsValue: 1000, currency: 'USD' });
    expect(est.lines.find((l) => l.key === 'bcd')!.amount).toBe(25); // 2.5% MFN
    expect(est.ftaApplied).toBeNull();
  });

  it('exposes all agreements with resolved members and preferential lines', async () => {
    const agreements = await listAgreements();
    expect(agreements).toHaveLength(seed.agreements.length);
    const cepa = await getAgreementDetail('IND-UAE-CEPA');
    expect(cepa!.members.map((m) => m.code).sort()).toEqual(['AE', 'IN']);
    expect(cepa!.preferentialTariffs.some((t) => t.hsCode === '7108')).toBe(true); // gold concession
  });
});
