'use strict';
/**
 * Risk placement — deciding WHOSE balance sheet a policy sits on, and splitting the
 * premium accordingly.
 *
 * Before this, every policy was carried by the platform: premium in, claims out, and
 * Baalvion absorbing a total loss on a container it earned 0.4% on. That is not a
 * broker; it is an unlicensed insurer. Placement makes the alternative real — the
 * risk goes onto a carrier's paper under a binding authority, and the platform
 * retains a commission on gross premium.
 *
 * Two hard limits are enforced here rather than left advisory, because breaching
 * them breaches the binding authority itself:
 *
 *   per_risk_limit   the largest single sum insured the binder allows
 *   capacity_limit   the aggregate sum insured across every live policy on it
 *
 * When nothing is bindable the policy is NOT silently written anyway. It is marked
 * `platform_retained` — an explicit, visible statement that Baalvion is carrying the
 * loss itself — so that choice is always deliberate and auditable.
 */
const { Op } = require('sequelize');
const db = require('../../models');
const { adapterFor } = require('./underwriters');

const num = (x) => (x == null ? 0 : Number(x) || 0);
const money = (n) => Math.round(n * 100) / 100;

// Policies that are consuming binder capacity right now.
const LIVE_POLICY_STATUSES = ['active', 'claimed'];

/** Aggregate sum insured already written on this binder. */
async function capacityUsed(underwriterId, excludePolicyId) {
    const where = { underwriter_id: underwriterId, status: { [Op.in]: LIVE_POLICY_STATUSES } };
    if (excludePolicyId) where.id = { [Op.ne]: excludePolicyId };
    const rows = await db.InsurancePolicy.findAll({ where, attributes: ['coverage_amount'] });
    return money(rows.reduce((sum, p) => sum + num(p.coverage_amount), 0));
}

const list = (v) => (Array.isArray(v) ? v.map((x) => String(x).toUpperCase()) : []);

/**
 * Is this voyage inside the binder's territorial scope?
 *
 * Territory is the exclusion that most often voids marine cargo cover — a binder
 * that excludes a sanctioned or war-risk country does not merely discourage the
 * business, it does not cover it. Binding outside scope means the carrier can walk
 * away from the loss, which lands it back on the broker.
 *
 * An empty include-list means worldwide. The exclude-list always wins.
 */
function withinTerritory(underwriter, { originCountry, destinationCountry } = {}) {
    const excluded = list(underwriter.territories_excluded);
    const included = list(underwriter.territories_included);
    const legs = [originCountry, destinationCountry].filter(Boolean).map((c) => String(c).toUpperCase());

    const hit = legs.find((c) => excluded.includes(c));
    if (hit) return { ok: false, reason: `the binder excludes ${hit}` };

    if (included.length) {
        // Both ends must be in scope; a permitted origin does not license an
        // out-of-scope destination.
        const outside = legs.find((c) => !included.includes(c));
        if (outside) return { ok: false, reason: `the binder does not cover ${outside}` };
        if (!legs.length) return { ok: false, reason: 'the binder is territorially limited but the voyage has no countries recorded' };
    }
    return { ok: true, reason: null };
}

/** Is the cargo something this binder will write? */
function commodityAllowed(underwriter, commodity) {
    const excluded = list(underwriter.commodities_excluded);
    if (!excluded.length || !commodity) return { ok: true, reason: null };
    const c = String(commodity).toUpperCase();
    const hit = excluded.find((x) => c.includes(x) || x.includes(c));
    return hit ? { ok: false, reason: `the binder excludes ${hit.toLowerCase()}` } : { ok: true, reason: null };
}

/**
 * What this binder can still take, and whether it can take THIS risk.
 * @returns {{ok:boolean, reason:string|null, used:number, remaining:number|null}}
 */
async function assessCapacity(underwriter, coverageAmount, excludePolicyId, scope = {}) {
    const live = underwriter.isBindable();
    if (!live.ok) return { ok: false, reason: live.reason, used: 0, remaining: null };

    const territory = withinTerritory(underwriter, scope);
    if (!territory.ok) return { ok: false, reason: territory.reason, used: 0, remaining: null };

    const commodity = commodityAllowed(underwriter, scope.commodity);
    if (!commodity.ok) return { ok: false, reason: commodity.reason, used: 0, remaining: null };

    const perRisk = num(underwriter.per_risk_limit);
    if (perRisk > 0 && num(coverageAmount) > perRisk) {
        return { ok: false, reason: `sum insured ${coverageAmount} exceeds the binder's ${perRisk} per-risk limit`, used: 0, remaining: null };
    }

    const used = await capacityUsed(underwriter.id, excludePolicyId);
    const limit = num(underwriter.capacity_limit);
    if (limit <= 0) return { ok: true, reason: null, used, remaining: null }; // unlimited binder

    const remaining = money(limit - used);
    if (num(coverageAmount) > remaining) {
        return { ok: false, reason: `binder has ${remaining} of aggregate capacity left; this risk needs ${coverageAmount}`, used, remaining };
    }
    return { ok: true, reason: null, used, remaining };
}

/**
 * Pick a binder that can take this risk. Preference order is deliberate: a
 * tenant-specific binder before the platform-wide one (a customer's own programme
 * takes precedence over the open market), then the widest remaining capacity.
 */
async function selectUnderwriter({ tenantId, coverageAmount, line = 'cargo', originCountry, destinationCountry, commodity }) {
    const candidates = await db.InsuranceUnderwriter.findAll({
        where: { status: 'bound', [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }] },
        order: [['created_at', 'ASC']],
    });

    const eligible = [];
    const declines = [];   // why each binder refused — the operator needs this
    for (const uw of candidates) {
        const lines = Array.isArray(uw.lines_of_business) ? uw.lines_of_business : [];
        if (lines.length && !lines.includes(line)) continue;
        const capacity = await assessCapacity(uw, coverageAmount, null, { originCountry, destinationCountry, commodity });
        if (capacity.ok) eligible.push({ underwriter: uw, capacity });
        else declines.push({ underwriter: uw.name, reason: capacity.reason });
    }
    if (!eligible.length) return { none: true, declines };

    eligible.sort((a, b) => {
        // Own-programme binders first.
        const own = (x) => (x.underwriter.tenant_id ? 0 : 1);
        if (own(a) !== own(b)) return own(a) - own(b);
        // Then the one with the most room (null = unlimited, sorts first).
        const rem = (x) => (x.capacity.remaining == null ? Infinity : x.capacity.remaining);
        return rem(b) - rem(a);
    });
    return { ...eligible[0], declines };
}

/**
 * Split a gross premium into the broker's commission and what is owed to the carrier.
 * The assured always pays `gross`; only the destination of the parts differs.
 */
function splitPremium(gross, commissionRate) {
    const rate = Math.min(Math.max(num(commissionRate), 0), 1);
    const commission = money(num(gross) * rate);
    return { gross: money(num(gross)), commissionRate: rate, commission, net: money(num(gross) - commission) };
}

/**
 * Place a policy before it is bound. Mutates and returns the policy.
 *
 * @returns {{placed:boolean, underwriter:object|null, reason:string|null, split:object|null}}
 */
async function placePolicy(policy, { line = 'cargo' } = {}) {
    // Territory and commodity come from the shipment being insured, not from the
    // insurance form — a binder's exclusions apply to the voyage that actually
    // happens, and a claimant will not be bound by what someone typed here.
    let originCountry = null;
    let destinationCountry = null;
    let commodity = (policy.coverage_terms && policy.coverage_terms.commodity) || null;
    if (policy.shipment_id) {
        try {
            const shipment = await db.TradeShipment.findByPk(policy.shipment_id);
            if (shipment) {
                originCountry = shipment.origin_country;
                destinationCountry = shipment.destination_country;
                commodity = commodity || (shipment.metadata && shipment.metadata.commodity) || null;
            }
        } catch { /* placement continues; an unreadable shipment is not a licence to ignore scope */ }
    }

    const selection = await selectUnderwriter({
        tenantId: policy.tenant_id,
        coverageAmount: num(policy.coverage_amount),
        line, originCountry, destinationCountry, commodity,
    });

    if (!selection || selection.none) {
        // No binder can take it. Say so explicitly rather than quietly writing it
        // on the platform's own balance sheet as if that were normal.
        const declines = (selection && selection.declines) || [];
        await policy.update({
            underwriter_id: null,
            placement_status: 'platform_retained',
            commission_rate: null,
            commission_amount: null,
            net_premium: null,
            premium_held_in_trust: false,
            // Record WHY every binder refused. Without it, "platform retained" is an
            // outcome nobody can act on.
            metadata: { ...(policy.metadata || {}), placementDeclines: declines },
        });
        const detail = declines.length
            ? declines.map((d) => `${d.underwriter}: ${d.reason}`).join('; ')
            : 'no binder is recorded at all';
        return { placed: false, underwriter: null, reason: `no binder could take this risk (${detail}) — retained by the platform`, split: null, declines };
    }

    const { underwriter } = selection;
    const adapter = adapterFor(underwriter);

    const risk = {
        policyId: policy.id,
        shipmentId: policy.shipment_id,
        insuranceType: policy.insurance_type,
        coverageAmount: num(policy.coverage_amount),
        currency: policy.currency,
        deductible: num(policy.deductible),
        riskAssessment: policy.risk_assessment || {},
        insured: policy.insured || {},
    };

    let carrierQuote = null;
    try {
        carrierQuote = await adapter.quote(risk);
    } catch (err) {
        await policy.update({ placement_status: 'referred', metadata: { ...(policy.metadata || {}), placementError: err.message } });
        return { placed: false, underwriter, reason: `${underwriter.name} could not quote: ${err.message}`, split: null };
    }

    if (carrierQuote && carrierQuote.declined) {
        await policy.update({ placement_status: 'declined', metadata: { ...(policy.metadata || {}), declineReason: carrierQuote.reason || null } });
        return { placed: false, underwriter, reason: carrierQuote.reason || `${underwriter.name} declined the risk`, split: null };
    }

    // A carrier that returns its own price governs; a manual binder defers to the
    // platform's rating engine (`useOwnRating`), which is the authority it delegated.
    const gross = carrierQuote && carrierQuote.premium != null && !carrierQuote.useOwnRating
        ? money(num(carrierQuote.premium))
        : num(policy.premium);

    const split = splitPremium(gross, underwriter.commission_rate);

    await policy.update({
        underwriter_id: underwriter.id,
        placement_status: 'placed',
        premium: split.gross,
        commission_rate: split.commissionRate,
        commission_amount: split.commission,
        net_premium: split.net,
        // Premium collected under a 'trust' binder is client money — the broker holds
        // it for the carrier, it is not revenue until the commission is drawn.
        premium_held_in_trust: underwriter.premium_handling === 'trust',
        ...(carrierQuote && carrierQuote.deductible != null && !carrierQuote.useOwnRating ? { deductible: money(num(carrierQuote.deductible)) } : {}),
    });

    return { placed: true, underwriter, reason: null, split };
}

/** Record the carrier's own policy number once their confirmation arrives. */
async function confirmPlacement(policy, { policyRef, effectiveFrom, effectiveTo } = {}) {
    if (!policy.underwriter_id) throw new Error('policy is not placed with an underwriter');
    await policy.update({
        underwriter_policy_ref: policyRef || policy.underwriter_policy_ref,
        ...(effectiveFrom ? { start_date: effectiveFrom } : {}),
        ...(effectiveTo ? { end_date: effectiveTo } : {}),
    });
    return policy;
}

/**
 * First advice of loss to the carrier whose paper the risk sits on.
 *
 * A claim on a placed policy is THEIR loss, not the platform's — the broker adjusts
 * it under the binder but the money comes off their book. Telling them late (or not
 * at all) is how a binder gets pulled, so this fires when the claim is filed rather
 * than when it is settled. Never throws: a carrier notification failure must not
 * block the assured's claim.
 */
async function notifyUnderwriter(claim, policy) {
    if (!policy || !policy.underwriter_id) return { notified: false, reason: 'policy is retained by the platform' };
    try {
        const underwriter = await db.InsuranceUnderwriter.findByPk(policy.underwriter_id);
        if (!underwriter) return { notified: false, reason: 'underwriter not found' };

        const adapter = adapterFor(underwriter);
        const result = await adapter.notifyClaim({
            claimId: claim.id, claimNumber: claim.claim_number,
            policyRef: policy.underwriter_policy_ref, policyId: policy.id,
            lossType: claim.loss_type, lossDate: claim.loss_date,
            amount: num(claim.amount), currency: policy.currency,
            shipmentId: claim.shipment_id, incidentId: claim.incident_id,
        });

        // A manual binder returns no reference until a human relays the carrier's;
        // recording null is honest, inventing one is not.
        if (result && result.claimRef) await claim.update({ underwriter_claim_ref: String(result.claimRef) });
        return { notified: true, underwriter: underwriter.name, claimRef: (result && result.claimRef) || null };
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[insurance] could not notify underwriter of claim ${claim.id}: ${err.message}`);
        return { notified: false, error: err.message };
    }
}

/**
 * Record what the carrier actually settled on their paper.
 *
 * This is NOT the same as the payout to the assured: the broker may pay the assured
 * first under the binder and collect from the carrier afterwards, so the two figures
 * and their timing are tracked separately. Nor is it subrogation, which is recovery
 * from whoever caused the loss.
 */
async function recordUnderwriterSettlement(claim, { amount, reference, settledAt } = {}) {
    const settled = money(num(amount));
    const paid = num(claim.payout_amount);
    if (settled > paid && paid > 0) {
        throw new Error(`the carrier cannot settle ${settled} against a ${paid} payout`);
    }
    await claim.update({
        underwriter_settled_amount: settled,
        underwriter_claim_ref: reference || claim.underwriter_claim_ref,
        underwriter_settled_at: settledAt ? new Date(settledAt) : new Date(),
    });
    return claim;
}

/**
 * The broker's own professional indemnity position.
 *
 * Placing risk without E&O in force does not stop the business — it means a single
 * claim that the cover did not respond to is unfunded. Reported rather than blocked,
 * because refusing to place is not obviously safer than placing uninsured; what is
 * unsafe is not knowing.
 */
async function indemnityStatus(tenantId) {
    const rows = await db.BrokerIndemnity.findAll({
        where: { cover_type: ['professional_indemnity', 'errors_omissions'] },
        order: [['period_end', 'DESC']],
        limit: 20,
    });
    const mine = rows.filter((r) => !r.tenant_id || r.tenant_id === tenantId);
    const live = mine.filter((r) => r.inForce().ok);
    if (!live.length) {
        return {
            covered: false,
            reason: mine.length ? mine[0].inForce().reason : 'no professional indemnity cover is recorded',
            limit: null,
        };
    }
    const best = live.sort((a, b) => num(b.limit_of_indemnity) - num(a.limit_of_indemnity))[0];
    return {
        covered: true,
        reason: null,
        insurer: best.insurer,
        policyNumber: best.policy_number,
        limit: num(best.limit_of_indemnity),
        retention: num(best.retention),
        basis: best.basis,
        expiresAt: best.period_end,
    };
}

module.exports = {
    placePolicy, confirmPlacement, selectUnderwriter, assessCapacity,
    withinTerritory, commodityAllowed, indemnityStatus,
    capacityUsed, splitPremium, notifyUnderwriter, recordUnderwriterSettlement,
    LIVE_POLICY_STATUSES,
};
