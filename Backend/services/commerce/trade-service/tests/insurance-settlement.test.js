'use strict';
// Insurance settlement + evidence gating (migration 066).
//
// These cover the four money-path defects the migration fixed, each of which was a
// wrong number rather than a missing feature: the deductible was calculated and then
// ignored, a policy could pay out past its own sum insured across several claims,
// cover never expired so a loss outside the period was claimable, and a claim could
// reach `approved` with no evidence at all.

const { coverPeriodFor, coversDate } = require('../service/insurance/coverPeriod');
const evidence = require('../service/insurance/evidence');
const { computeLaneRisk } = require('../service/insurance/laneRisk');

// computeSettlement reads sibling claims from the DB; stub that one lookup so the
// arithmetic can be exercised without a database.
jest.mock('../models', () => ({
    InsuranceClaim: { findAll: jest.fn(async () => []) },
    InsuranceClaimDocument: { findAll: jest.fn(async () => []) },
    TradeShipment: { findAll: jest.fn(async () => []) },
    Incident: { count: jest.fn(async () => 0) },
    GeneralAverageContribution: { findAll: jest.fn(async () => []) },
}));

const db = require('../models');
const { computeSettlement, remainingCoverage } = require('../service/insurance/settlement');

const policy = (over = {}) => ({ id: 'INS-T', coverage_amount: 100000, deductible: 2500, currency: 'USD', ...over });
const claim = (over = {}) => ({ id: 'CLM-T', amount: 40000, loss_type: 'damage', ...over });

beforeEach(() => {
    // mockReset, not just a new default: measure() returns early on an empty sample
    // without calling Incident.count, so any unconsumed mockResolvedValueOnce would
    // otherwise leak into the next test and make it pass or fail for a bogus reason.
    [db.InsuranceClaim.findAll, db.InsuranceClaimDocument.findAll, db.TradeShipment.findAll, db.Incident.count]
        .forEach((m) => m.mockReset());
    db.InsuranceClaim.findAll.mockResolvedValue([]);
    db.InsuranceClaimDocument.findAll.mockResolvedValue([]);
    db.TradeShipment.findAll.mockResolvedValue([]);
    db.Incident.count.mockResolvedValue(0);
});

describe('settlement arithmetic', () => {
    test('the deductible comes off the payout', async () => {
        const s = await computeSettlement(claim(), policy());
        expect(s.grossLoss).toBe(40000);
        expect(s.deductible).toBe(2500);
        expect(s.payout).toBe(37500);
    });

    test('a loss inside the deductible pays nothing, and says so', async () => {
        const s = await computeSettlement(claim({ amount: 1500 }), policy());
        expect(s.payout).toBe(0);
        expect(s.notes.join(' ')).toMatch(/within the deductible/i);
    });

    test('general average and salvage contributions are recoverable in full', async () => {
        const s = await computeSettlement(claim({ loss_type: 'general_average' }), policy());
        expect(s.deductibleWaived).toBe(true);
        expect(s.deductible).toBe(0);
        expect(s.payout).toBe(40000);
    });

    test('the indemnity is capped at the cover left after earlier settlements', async () => {
        // 70,000 of the 100,000 sum insured already indemnified.
        db.InsuranceClaim.findAll.mockResolvedValue([{ gross_loss: 70000, payout_amount: 67500, deductible_applied: 2500, amount: 70000 }]);
        const s = await computeSettlement(claim({ amount: 50000 }), policy());
        expect(s.remainingCoverage).toBe(30000);
        expect(s.cappedByCoverage).toBe(true);
        expect(s.indemnity).toBe(30000);
        expect(s.payout).toBe(27500);
    });

    test('cover is consumed by the loss indemnified, not the cheque written', async () => {
        // A total loss nets 97,500 after the deductible; the policy is still spent,
        // because the assured bearing the deductible does not restore the cargo.
        db.InsuranceClaim.findAll.mockResolvedValue([{ gross_loss: 100000, payout_amount: 97500, deductible_applied: 2500, amount: 100000 }]);
        expect(await remainingCoverage(policy())).toBe(0);
    });
});

describe('cover period', () => {
    test('a shipment with sailing dates gives voyage cover ending 60 days after arrival', () => {
        const departure = new Date('2026-03-01T00:00:00Z');
        const arrival = new Date('2026-03-21T00:00:00Z');
        const p = coverPeriodFor({ shipment: { estimated_departure: departure, estimated_arrival: arrival } });
        expect(p.basis).toBe('voyage');
        expect(p.startDate.toISOString()).toBe(departure.toISOString());
        expect(Math.round((p.endDate - arrival) / 86400000)).toBe(60);
    });

    test('no sailing dates falls back to a term policy and says why', () => {
        const p = coverPeriodFor({ shipment: null, termMonths: 3 });
        expect(p.basis).toBe('term');
        expect(p.detail).toMatch(/no sailing dates/i);
    });

    test('a loss outside the cover period is not covered', () => {
        const p = { start_date: '2026-03-01', end_date: '2026-05-20' };
        expect(coversDate(p, '2026-04-01').covered).toBe(true);
        expect(coversDate(p, '2026-02-01').covered).toBe(false);
        expect(coversDate(p, '2026-06-01').reason).toMatch(/after cover terminated/i);
    });
});

describe('evidence gating', () => {
    test('each loss type carries its own documentary set', () => {
        expect(evidence.requiredDocumentsFor('theft')).toContain('police_report');
        expect(evidence.requiredDocumentsFor('total_loss')).toContain('non_delivery_certificate');
        expect(evidence.requiredDocumentsFor('damage')).toContain('survey_report');
        // Notice to the carrier preserves the subrogation right; a claim that skips it
        // destroys the recovery the insurer is entitled to.
        expect(evidence.requiredDocumentsFor('damage')).toContain('carrier_claim_letter');
    });

    test('a role only counts once a document is actually attached', async () => {
        const c = { id: 'CLM-T', loss_type: 'delay', required_documents: ['bill_of_lading', 'commercial_invoice'] };
        db.InsuranceClaimDocument.findAll.mockResolvedValue([
            { doc_role: 'bill_of_lading', status: 'attached', document_id: 'doc-1', title: 'BL' },
            { doc_role: 'commercial_invoice', status: 'attached', document_id: null, title: 'placeholder' },
        ]);
        const state = await evidence.evaluate(c);
        expect(state.satisfied).toEqual(['bill_of_lading']);
        expect(state.missing).toEqual(['commercial_invoice']);
        expect(state.complete).toBe(false);
    });

    test('a rejected document reopens the requirement', async () => {
        const c = { id: 'CLM-T', loss_type: 'delay', required_documents: ['bill_of_lading'] };
        db.InsuranceClaimDocument.findAll.mockResolvedValue([
            { doc_role: 'bill_of_lading', status: 'rejected', document_id: 'doc-1', title: 'BL' },
        ]);
        const state = await evidence.evaluate(c);
        expect(state.complete).toBe(false);
        expect(state.rejected).toEqual(['bill_of_lading']);
    });
});

describe('lane risk credibility', () => {
    // measure() is called for the book first, then the lane; queue the results in
    // that order so a lane can be given a different experience from the book.
    const withSamples = (bookN, bookIncidents, laneN, laneIncidents) => {
        db.TradeShipment.findAll
            .mockResolvedValueOnce(Array.from({ length: bookN }, (_, i) => ({ id: `b${i}` })))
            .mockResolvedValueOnce(Array.from({ length: laneN }, (_, i) => ({ id: `l${i}` })));
        db.Incident.count
            .mockResolvedValueOnce(bookIncidents)
            .mockResolvedValueOnce(laneIncidents);
    };

    test('an empty platform prices at the base rate and says so', async () => {
        const r = await computeLaneRisk({ originPort: 'INNSA', destinationPort: 'AEJEA' });
        expect(r.basis).toBe('base_rate');
        expect(r.multiplier).toBe(1);
        expect(r.blendedFrequency).toBeNull();
    });

    test('a lane with no history is priced on the book rather than left inert', async () => {
        withSamples(500, 10, 0, 0);
        const r = await computeLaneRisk({ originPort: 'INNSA', destinationPort: 'AEJEA' });
        expect(r.basis).toBe('book_average');
        expect(r.credibility).toBe(0);
        expect(r.multiplier).toBeGreaterThan(1);   // 2% book frequency, not a flat 1
        expect(r.factors[0].detail).toMatch(/no shipments on this lane yet/);
    });

    test('a thin lane moves the price a little, not a lot', async () => {
        // Book is clean (0%); the lane has one loss in three voyages (33%). With
        // n=3 the lane earns 3/63 ≈ 4.8% weight, so the blend stays near the book.
        withSamples(1000, 0, 3, 1);
        const r = await computeLaneRisk({ originPort: 'INNSA', destinationPort: 'AEJEA' });
        expect(r.basis).toBe('credibility_weighted');
        expect(r.sampleSize).toBe(3);
        expect(r.credibility).toBeLessThan(0.06);
        expect(r.blendedFrequency).toBeLessThan(0.02);  // far below the raw 0.33
        expect(r.multiplier).toBeLessThan(1.9);
    });

    test('a fat lane nearly determines its own price', async () => {
        withSamples(1000, 0, 600, 12);   // lane 2%, book 0%, n=600 → ~91% weight
        const r = await computeLaneRisk({ originPort: 'INNSA', destinationPort: 'AEJEA' });
        expect(r.credibility).toBeGreaterThan(0.9);
        expect(r.blendedFrequency).toBeGreaterThan(0.017);
        expect(r.scope).toBe('port_pair');
        expect(r.factors[0].detail).toMatch(/12 qualifying losses over 600 shipments/);
    });

    test('credibility rises monotonically with the lane sample', async () => {
        withSamples(1000, 20, 10, 0);
        const thin = await computeLaneRisk({ originPort: 'A', destinationPort: 'B' });
        db.TradeShipment.findAll.mockReset(); db.Incident.count.mockReset();
        withSamples(1000, 20, 400, 0);
        const fat = await computeLaneRisk({ originPort: 'A', destinationPort: 'B' });
        expect(fat.credibility).toBeGreaterThan(thin.credibility);
        // Both lanes are loss-free, so more credibility must mean a cheaper rate.
        expect(fat.multiplier).toBeLessThan(thin.multiplier);
    });

    test('commodity and voyage-length factors are disclosed individually', async () => {
        const r = await computeLaneRisk({ containerType: 'reefer', transitDays: 60 });
        const names = r.factors.map((f) => f.name);
        expect(names).toContain('container_type');
        expect(names).toContain('transit_duration');
        expect(r.multiplier).toBeGreaterThan(1.35);
    });
});
