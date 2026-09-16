'use strict';
/**
 * Examination selection risk — PURE (Compression, Phase 6).
 *
 * A physical examination costs 2–5 days and no software shortens it. The only
 * lever is not being selected, and selection is driven mostly by the TRADER's
 * record rather than by the individual shipment. This module estimates that
 * probability and — the part that matters — says which single change would
 * reduce it most.
 *
 * HONESTY CONSTRAINTS, because this is the module most easily turned into a
 * false promise:
 *
 *   • Authorities do not publish selection algorithms and do not commit to
 *     rates. Every number here is an ESTIMATE from published programme benefits
 *     and observed history, and every output says so.
 *   • The platform does not choose the channel. It predicts selection and
 *     reduces the drivers it can influence.
 *   • A lapsed or suspended accreditation confers nothing. It is checked, not
 *     assumed.
 *
 * PURE: no DB, no clock beyond the injected `now`.
 */

const programmes = require('./programmes');
const assessment = require('./assessment');

const RISK_VERSION = '1.0.0';

const CHANNEL = Object.freeze({
    GREEN: 'green',     // released without documentary or physical check
    YELLOW: 'yellow',   // documentary check
    RED: 'red',         // physical examination
});

// Baseline selection probability for an unaccredited trader with no history.
// A starting point to be moved by the factors below, not a published figure.
const BASE_SELECTION_RATE = 0.12;

/**
 * Commodity risk by HS chapter. These reflect why a chapter draws attention:
 * revenue exposure, prohibition risk, or health and safety controls.
 */
const CHAPTER_RISK = Object.freeze({
    // Food, live products — sanitary controls
    '02': 1.6, '03': 1.6, '04': 1.5, '07': 1.4, '08': 1.4, '16': 1.5, '20': 1.4,
    // Tobacco and alcohol — high revenue exposure
    '22': 2.2, '24': 2.4,
    // Pharmaceuticals and chemicals — controls and precursors
    '28': 1.8, '29': 1.9, '30': 1.7, '38': 1.6,
    // Textiles — origin fraud and quota
    '61': 1.5, '62': 1.5, '63': 1.4,
    // Precious metals and stones — valuation and money laundering
    '71': 2.3,
    // Electronics — valuation and IP
    '84': 1.2, '85': 1.3,
    // Vehicles and parts — valuation
    '87': 1.4,
    // Arms — controlled
    '93': 3.0,
});

const chapterOf = (hs) => (hs ? String(hs).replace(/\D/g, '').slice(0, 2) : null);

/**
 * Estimate selection probability and the channel it implies.
 *
 * @param {object} trader  { accreditations: [{programme,status,expires_at}],
 *                           first_pass_rate, filings_count, prior_exams,
 *                           prior_findings, months_trading }
 * @param {object} consignment  normalized canonical consignment
 * @param {object} opts { destination, newCounterparty, now }
 */
function estimate(trader = {}, consignment = {}, { now = new Date() } = {}) {
    const destination = consignment.destination_country;
    const factors = [];
    let rate = BASE_SELECTION_RATE;

    // A multiplier of exactly 1 still gets recorded. Such a factor changes no
    // number but carries the explanation for why the risk is what it is — and
    // "you hold no recognised accreditation" is the single most useful line in
    // the output, so dropping it would be the wrong optimisation.
    const applyFactor = (name, multiplier, explanation, controllable = false) => {
        const before = rate;
        rate *= multiplier;
        factors.push({
            factor: name,
            multiplier: Math.round(multiplier * 100) / 100,
            explanation,
            controllable,
            informational: multiplier === 1,
            rate_before: Math.round(before * 10000) / 10000,
            rate_after: Math.round(rate * 10000) / 10000,
        });
    };

    // ── Accreditation: the dominant, and the only legally-recognised, lever ──
    const held = (trader.accreditations || [])
        .map((a) => ({ ...a, ...assessment.validity(a, { now }) }))
        .filter((a) => a.confers_benefit);

    const recognised = held
        .map((a) => ({ ...a, recognition: programmes.recognitionIn(a.programme, destination) }))
        .filter((a) => a.recognition.recognised);

    if (recognised.length) {
        // Best applicable programme wins; benefits do not stack.
        const best = recognised.reduce((a, b) => (
            (programmes.PROGRAMMES[a.programme].exam_rate_multiplier <= programmes.PROGRAMMES[b.programme].exam_rate_multiplier) ? a : b
        ));
        const p = programmes.PROGRAMMES[best.programme];
        applyFactor('trusted_trader', p.exam_rate_multiplier,
            `${p.label} is recognised in ${destination} (${best.recognition.basis.replace('_', ' ')}).`, true);
    } else {
        const lapsed = (trader.accreditations || []).filter((a) => !assessment.validity(a, { now }).confers_benefit);
        applyFactor('no_recognised_accreditation', 1.0,
            lapsed.length
                ? `Accreditation(s) held but not currently valid: ${lapsed.map((a) => a.programme).join(', ')}. A lapsed status confers nothing.`
                : `No accreditation recognised in ${destination || 'this destination'} — this is the single largest controllable factor.`,
            true);
    }

    // ── Filing track record ──────────────────────────────────────────────────
    const filings = Number(trader.filings_count || 0);
    const firstPass = trader.first_pass_rate == null ? null : Number(trader.first_pass_rate);

    if (filings < 5) {
        applyFactor('thin_history', 1.5,
            `Only ${filings} prior filings. Authorities treat an unknown trader as higher risk until a record exists.`, false);
    } else if (firstPass != null) {
        if (firstPass >= 0.98) applyFactor('clean_filing_record', 0.7, `First-pass acceptance of ${(firstPass * 100).toFixed(1)}% over ${filings} filings.`, true);
        else if (firstPass < 0.85) applyFactor('poor_filing_record', 1.8, `First-pass acceptance of only ${(firstPass * 100).toFixed(1)}%. Rejected filings raise the trader's risk score directly.`, true);
    }

    if (Number(trader.prior_findings || 0) > 0) {
        applyFactor('prior_findings', 1 + Math.min(1.5, Number(trader.prior_findings) * 0.4),
            `${trader.prior_findings} prior examination(s) found a discrepancy. This persists on the trader record for years.`, false);
    }

    // ── Commodity ────────────────────────────────────────────────────────────
    const chapters = [...new Set((consignment.lines || []).map((l) => chapterOf(l.hs_code)).filter(Boolean))];
    const worst = chapters.reduce((max, c) => Math.max(max, CHAPTER_RISK[c] || 1), 1);
    if (worst > 1) {
        const chapter = chapters.find((c) => (CHAPTER_RISK[c] || 1) === worst);
        applyFactor('commodity_risk', worst, `HS chapter ${chapter} attracts elevated scrutiny.`, false);
    }

    // ── Consignment-level signals ────────────────────────────────────────────
    if (consignment.totals) {
        const value = Number(consignment.totals.customs_value || 0);
        const avg = Number(trader.average_consignment_value || 0);
        // A consignment far outside a trader's normal pattern is a classic
        // valuation-fraud trigger.
        if (avg > 0 && value > avg * 5) {
            applyFactor('value_anomaly', 1.7,
                `Declared value is ${(value / avg).toFixed(1)}x this trader's average — a valuation-review trigger.`, false);
        }
        const lines = (consignment.lines || []).length;
        if (lines > 0 && value / lines < 100) {
            applyFactor('low_unit_value', 1.3, 'Low declared value per line invites a valuation check.', false);
        }
    }

    if (consignment.parties && consignment.parties.exporter && trader.known_counterparties) {
        const name = consignment.parties.exporter.name;
        if (name && !trader.known_counterparties.includes(name)) {
            applyFactor('new_counterparty', 1.4, `First shipment with ${name}. New trading relationships draw a check.`, true);
        }
    }

    const probability = Math.min(0.95, Math.max(0.005, rate));

    // Channel bands. These describe an ESTIMATE of what the authority will do,
    // not an instruction to it.
    let channel;
    if (probability < 0.05) channel = CHANNEL.GREEN;
    else if (probability < 0.15) channel = CHANNEL.YELLOW;
    else channel = CHANNEL.RED;

    // What would help most: re-run each controllable factor as if it were fixed.
    const controllable = factors.filter((f) => f.controllable && f.multiplier > 1);
    const opportunities = controllable
        .map((f) => ({
            factor: f.factor,
            current_multiplier: f.multiplier,
            probability_if_resolved: Math.round((probability / f.multiplier) * 10000) / 10000,
            reduction_pct: Math.round((1 - 1 / f.multiplier) * 1000) / 10,
        }))
        .sort((a, b) => b.reduction_pct - a.reduction_pct);

    // The accreditation opportunity is not a "factor" when absent, so it is
    // priced separately — it is usually the largest single move available.
    //
    // Only a programme with actual coverage in THIS destination is offered. An
    // Indian AEO does nothing for a shipment into Germany, and recommending it
    // would send a customer to spend months on an accreditation that cannot help
    // them. Where no domestic programme reaches the destination, saying so is the
    // useful answer.
    const candidates = recognised.length ? [] : programmes.recommend(
        consignment.origin_country || destination,
        destination ? { [destination]: 100 } : {},
    ).filter((c) => c.coverage_pct > 0);
    const bestAvailable = candidates[0] || null;

    return {
        risk_version: RISK_VERSION,
        destination,
        estimated_selection_probability: Math.round(probability * 10000) / 10000,
        predicted_channel: channel,
        base_rate: BASE_SELECTION_RATE,
        factors,
        recognised_accreditations: recognised.map((a) => ({ programme: a.programme, basis: a.recognition.basis, state: a.state })),
        opportunities,
        accreditation_opportunity: bestAvailable
            ? {
                programme: bestAvailable.programme,
                label: bestAvailable.label,
                estimated_probability_if_accredited: Math.round((probability * bestAvailable.exam_rate_multiplier) * 10000) / 10000,
                typical_lead_time_days: bestAvailable.typical_lead_time_days,
                basis: bestAvailable.covered_destinations,
            }
            : null,
        // Stated explicitly rather than left as a silent null: no accreditation
        // available where this trader is established is recognised at the
        // destination, so the fast lane has to come from the counterparty's own
        // accreditation instead.
        accreditation_note: recognised.length
            ? null
            : (bestAvailable
                ? null
                : `No trusted-trader programme available in ${programmes.jurisdictionOf(consignment.origin_country || destination) || 'the origin country'} is recognised in ${destination || 'this destination'}. Reducing examination risk on this lane requires the importer of record to be accredited locally.`),
        disclaimer: 'An estimate. Customs authorities do not publish selection algorithms and do not commit to examination rates. This predicts selection and identifies what reduces it; it does not determine the channel.',
    };
}

module.exports = { RISK_VERSION, CHANNEL, BASE_SELECTION_RATE, CHAPTER_RISK, chapterOf, estimate };
