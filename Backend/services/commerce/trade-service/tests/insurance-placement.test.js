'use strict';
// Risk placement, binder limits and broker commission (migration 071).
//
// Before this the platform WAS the insurer: every premium landed on its own book and
// it absorbed every total loss, with no carrier, no binding authority and no
// commission. These pin the broker/MGA behaviour, and in particular that a binder's
// limits are ENFORCED — exceeding them breaches the delegated authority itself, so
// "write it anyway" is never the fallback.

jest.mock('../models', () => ({
    InsurancePolicy: { findAll: jest.fn(async () => []) },
    InsuranceUnderwriter: { findAll: jest.fn(async () => []) },
    TradeShipment: { findByPk: jest.fn(async () => null) },
    BrokerIndemnity: { findAll: jest.fn(async () => []) },
}));

const db = require('../models');
const placement = require('../service/insurance/placement');

/** An underwriter double with the model's isBindable() behaviour. */
const uw = (over = {}) => {
    const r = {
        id: 'UW-1', tenant_id: null, name: 'Test Syndicate', adapter: 'manual',
        status: 'bound', currency: 'USD', capacity_limit: 1000000, per_risk_limit: 500000,
        commission_rate: 0.15, lines_of_business: ['cargo'], binder_start: null, binder_end: null,
        territories_included: [], territories_excluded: [], commodities_excluded: [],
        premium_handling: 'trust',
        created_at: new Date(), ...over,
    };
    r.isBindable = (at = new Date()) => {
        if (r.status !== 'bound') return { ok: false, reason: `binder status is '${r.status}'` };
        if (r.binder_start && at < new Date(r.binder_start)) return { ok: false, reason: 'binder has not incepted yet' };
        if (r.binder_end && at > new Date(r.binder_end)) return { ok: false, reason: 'binder has expired' };
        return { ok: true, reason: null };
    };
    return r;
};

const policy = (over = {}) => {
    const p = {
        id: 'INS-1', tenant_id: 'tenant-a', insurance_type: 'cargo',
        coverage_amount: 400000, currency: 'USD', premium: 1600, deductible: 4000,
        metadata: {}, ...over,
    };
    p.update = jest.fn(async (f) => { Object.assign(p, f); return p; });
    return p;
};

beforeEach(() => {
    db.InsurancePolicy.findAll.mockReset().mockResolvedValue([]);
    db.InsuranceUnderwriter.findAll.mockReset().mockResolvedValue([]);
    db.TradeShipment.findByPk.mockReset().mockResolvedValue(null);
    db.BrokerIndemnity.findAll.mockReset().mockResolvedValue([]);
});

describe('premium split', () => {
    test('gross splits into commission and the net owed to the carrier', () => {
        const s = placement.splitPremium(2000, 0.15);
        expect(s).toMatchObject({ gross: 2000, commission: 300, net: 1700, commissionRate: 0.15 });
        expect(s.commission + s.net).toBe(s.gross);
    });

    test('a zero-commission binder remits the whole premium', () => {
        expect(placement.splitPremium(1000, 0)).toMatchObject({ commission: 0, net: 1000 });
    });

    test('a nonsense commission rate is clamped, never applied as given', () => {
        expect(placement.splitPremium(1000, 5).commission).toBe(1000);   // not 5000
        expect(placement.splitPremium(1000, -1).commission).toBe(0);
    });
});

describe('binder limits', () => {
    test('a risk larger than the per-risk limit is refused', async () => {
        const c = await placement.assessCapacity(uw(), 600000);
        expect(c.ok).toBe(false);
        expect(c.reason).toMatch(/per-risk limit/);
    });

    test('aggregate capacity counts what is already written', async () => {
        db.InsurancePolicy.findAll.mockResolvedValue([{ coverage_amount: 800000 }]);
        const c = await placement.assessCapacity(uw(), 300000);
        expect(c.used).toBe(800000);
        expect(c.remaining).toBe(200000);
        expect(c.ok).toBe(false);
        expect(c.reason).toMatch(/aggregate capacity/);
    });

    test('a binder with no capacity_limit is unlimited', async () => {
        db.InsurancePolicy.findAll.mockResolvedValue([{ coverage_amount: 9000000 }]);
        const c = await placement.assessCapacity(uw({ capacity_limit: null }), 400000);
        expect(c.ok).toBe(true);
        expect(c.remaining).toBeNull();
    });

    test('an expired binder cannot take new business', async () => {
        const c = await placement.assessCapacity(uw({ binder_end: new Date(Date.now() - 86400000) }), 1000);
        expect(c.ok).toBe(false);
        expect(c.reason).toMatch(/expired/);
    });

    test('a suspended binder cannot take new business', async () => {
        const c = await placement.assessCapacity(uw({ status: 'suspended' }), 1000);
        expect(c.ok).toBe(false);
        expect(c.reason).toMatch(/suspended/);
    });
});

describe('selection', () => {
    test("a tenant's own binder is preferred over the open-market one", async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([
            uw({ id: 'UW-MARKET', tenant_id: null }),
            uw({ id: 'UW-OWN', tenant_id: 'tenant-a' }),
        ]);
        const sel = await placement.selectUnderwriter({ tenantId: 'tenant-a', coverageAmount: 100000 });
        expect(sel.underwriter.id).toBe('UW-OWN');
    });

    test('a binder that does not write this line is skipped', async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([uw({ lines_of_business: ['credit'] })]);
        const sel = await placement.selectUnderwriter({ tenantId: 'tenant-a', coverageAmount: 1000, line: 'cargo' });
        expect(sel.none).toBe(true);
    });

    test('a refusal carries the reason, so "retained" is actionable', async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([uw({ per_risk_limit: 1000 })]);
        const sel = await placement.selectUnderwriter({ tenantId: 'tenant-a', coverageAmount: 500000 });
        expect(sel.none).toBe(true);
        expect(sel.declines[0].reason).toMatch(/per-risk limit/);
    });
});

describe('placement outcome', () => {
    test('a placed risk records the carrier and splits the premium', async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([uw()]);
        const p = policy();
        const out = await placement.placePolicy(p);
        expect(out.placed).toBe(true);
        expect(p.underwriter_id).toBe('UW-1');
        expect(p.placement_status).toBe('placed');
        expect(p.commission_amount).toBe(240);   // 1600 × 15%
        expect(p.net_premium).toBe(1360);
    });

    test('with no bindable binder the policy is EXPLICITLY platform-retained', async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([]);
        const p = policy();
        const out = await placement.placePolicy(p);
        expect(out.placed).toBe(false);
        // The point: it is not silently written as if a carrier had taken it.
        expect(p.placement_status).toBe('platform_retained');
        expect(p.underwriter_id).toBeNull();
        expect(p.commission_amount).toBeNull();
    });

    test('a risk over the binder limit falls to platform-retained, not onto the binder', async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([uw({ per_risk_limit: 100000 })]);
        const p = policy({ coverage_amount: 400000 });
        const out = await placement.placePolicy(p);
        expect(out.placed).toBe(false);
        expect(p.placement_status).toBe('platform_retained');
    });
});

describe('binder scope — the exclusions that void cover', () => {
    test('an excluded destination is refused', () => {
        const r = placement.withinTerritory(uw({ territories_excluded: ['RU', 'IR'] }), { originCountry: 'IN', destinationCountry: 'RU' });
        expect(r.ok).toBe(false);
        expect(r.reason).toMatch(/excludes RU/);
    });

    test('an excluded ORIGIN is refused too — both legs are in scope or neither is', () => {
        const r = placement.withinTerritory(uw({ territories_excluded: ['KP'] }), { originCountry: 'KP', destinationCountry: 'AE' });
        expect(r.ok).toBe(false);
    });

    test('an include-list requires BOTH ends, not just one', () => {
        const binder = uw({ territories_included: ['IN', 'AE'] });
        expect(placement.withinTerritory(binder, { originCountry: 'IN', destinationCountry: 'AE' }).ok).toBe(true);
        // A permitted origin does not license an out-of-scope destination.
        expect(placement.withinTerritory(binder, { originCountry: 'IN', destinationCountry: 'CN' }).ok).toBe(false);
    });

    test('an empty include-list means worldwide', () => {
        expect(placement.withinTerritory(uw(), { originCountry: 'BR', destinationCountry: 'ZA' }).ok).toBe(true);
    });

    test('the exclude-list beats the include-list', () => {
        const binder = uw({ territories_included: ['IN', 'RU'], territories_excluded: ['RU'] });
        expect(placement.withinTerritory(binder, { originCountry: 'IN', destinationCountry: 'RU' }).ok).toBe(false);
    });

    test('an excluded commodity is refused, matched loosely', () => {
        const binder = uw({ commodities_excluded: ['TOBACCO', 'BULLION'] });
        expect(placement.commodityAllowed(binder, 'Bulk tobacco leaf').ok).toBe(false);
        expect(placement.commodityAllowed(binder, 'Pharmaceutical intermediates').ok).toBe(true);
        // No commodity stated cannot be treated as a breach.
        expect(placement.commodityAllowed(binder, null).ok).toBe(true);
    });

    test('a scoped-out risk is platform-retained AND records why', async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([uw({ territories_excluded: ['RU'] })]);
        db.TradeShipment.findByPk.mockResolvedValue({ origin_country: 'IN', destination_country: 'RU', metadata: {} });
        const p = policy({ shipment_id: 'ship-1' });
        const out = await placement.placePolicy(p);
        expect(out.placed).toBe(false);
        expect(p.placement_status).toBe('platform_retained');
        expect(p.metadata.placementDeclines[0].reason).toMatch(/excludes RU/);
    });
});

describe('client money', () => {
    test("a 'trust' binder marks the premium as client money", async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([uw({ premium_handling: 'trust' })]);
        const p = policy();
        await placement.placePolicy(p);
        expect(p.premium_held_in_trust).toBe(true);
    });

    test("a 'direct' binder does not — the carrier collects it themselves", async () => {
        db.InsuranceUnderwriter.findAll.mockResolvedValue([uw({ premium_handling: 'direct' })]);
        const p = policy();
        await placement.placePolicy(p);
        expect(p.premium_held_in_trust).toBe(false);
    });
});

describe('the broker\'s own E&O', () => {
    const pi = (over = {}) => {
        const r = { id: 'PI-1', cover_type: 'professional_indemnity', insurer: 'Syndicate', policy_number: 'PI-1', limit_of_indemnity: 5000000, retention: 25000, basis: 'claims_made', status: 'active', period_start: null, period_end: null, tenant_id: null, ...over };
        r.inForce = (at = new Date()) => {
            if (r.status !== 'active') return { ok: false, reason: `E&O cover is '${r.status}'` };
            if (r.period_end && at > new Date(r.period_end)) return { ok: false, reason: 'E&O cover expired' };
            return { ok: true, reason: null };
        };
        return r;
    };

    test('no recorded cover reports uncovered, not silently fine', async () => {
        const s2 = await placement.indemnityStatus('tenant-a');
        expect(s2.covered).toBe(false);
        expect(s2.reason).toMatch(/no professional indemnity/i);
    });

    test('an expired policy does not count as cover', async () => {
        db.BrokerIndemnity.findAll.mockResolvedValue([pi({ period_end: new Date(Date.now() - 86400000) })]);
        const s2 = await placement.indemnityStatus('tenant-a');
        expect(s2.covered).toBe(false);
        expect(s2.reason).toMatch(/expired/i);
    });

    test('a live policy reports the limit that would actually answer', async () => {
        db.BrokerIndemnity.findAll.mockResolvedValue([pi(), pi({ id: 'PI-2', limit_of_indemnity: 10000000 })]);
        const s2 = await placement.indemnityStatus('tenant-a');
        expect(s2.covered).toBe(true);
        expect(s2.limit).toBe(10000000);   // the highest live limit, not the first row
    });
});
