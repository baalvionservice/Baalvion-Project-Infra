'use strict';
/**
 * Claim settlement arithmetic.
 *
 * Before migration 066 `approveClaim` set payout_amount = claim.amount and paid it:
 * the policy deductible was calculated at quote time, stored, and then never
 * applied, and nothing stopped a policy paying out more than its own coverage
 * across several claims. Both are fixed here, in one place, so the approve and
 * pay paths cannot drift apart.
 *
 * Order of operations follows a marine adjustment:
 *   1. gross loss (the adjuster's assessed figure, defaulting to the sum claimed)
 *   2. capped at the coverage still left on the policy after earlier settlements
 *   3. less the deductible — once per claim, and NOT on general average or
 *      salvage contributions, which a cargo policy answers for in full
 *      ("irrespective of percentage").
 */
const { Op } = require('sequelize');
const db = require('../../models');

const num = (x) => (x == null ? 0 : Number(x) || 0);
const money = (n) => Math.round(n * 100) / 100;

// Claims that have consumed, or are committed to consume, part of the sum insured.
const CONSUMING_STATUSES = ['approved', 'paid'];

// A general average or salvage contribution is recoverable in full.
const DEDUCTIBLE_EXEMPT_LOSS_TYPES = ['general_average'];

/**
 * Coverage still available on a policy, net of every other claim already approved or paid.
 *
 * What consumes the sum insured is the LOSS INDEMNIFIED, not the cheque written. The
 * deductible is borne by the assured but the cargo is just as gone, so subtracting the
 * net payout would leave a policy showing the deductible as residual cover after a
 * total loss — and never mark it spent.
 */
async function remainingCoverage(policy, excludeClaimId) {
    const where = { policy_id: policy.id, status: { [Op.in]: CONSUMING_STATUSES } };
    if (excludeClaimId) where.id = { [Op.ne]: excludeClaimId };
    const others = await db.InsuranceClaim.findAll({ where, attributes: ['gross_loss', 'payout_amount', 'deductible_applied', 'amount'] });
    const committed = others.reduce((sum, c) => {
        const indemnified = c.gross_loss != null
            ? num(c.gross_loss)
            : num(c.payout_amount) + num(c.deductible_applied);
        return sum + (indemnified > 0 ? indemnified : num(c.amount));
    }, 0);
    return Math.max(0, money(num(policy.coverage_amount) - committed));
}

/**
 * Settle one claim against its policy.
 * @returns {{grossLoss:number, indemnity:number, deductible:number, payout:number,
 *            remainingCoverage:number, cappedByCoverage:boolean, deductibleWaived:boolean, notes:string[]}}
 */
async function computeSettlement(claim, policy, { assessedLoss } = {}) {
    const notes = [];
    const grossLoss = money(assessedLoss != null ? num(assessedLoss) : (claim.gross_loss != null ? num(claim.gross_loss) : num(claim.amount)));

    const available = await remainingCoverage(policy, claim.id);
    let indemnity = grossLoss;
    const cappedByCoverage = grossLoss > available;
    if (cappedByCoverage) {
        indemnity = available;
        notes.push(`Assessed loss ${grossLoss} exceeds the ${available} of cover remaining on this policy; indemnity limited to the balance.`);
    }

    const deductibleWaived = DEDUCTIBLE_EXEMPT_LOSS_TYPES.includes(String(claim.loss_type || ''));
    const deductible = deductibleWaived ? 0 : money(Math.min(num(policy.deductible), indemnity));
    if (deductibleWaived && num(policy.deductible) > 0) {
        notes.push('Deductible waived: general average and salvage contributions are recoverable in full.');
    }

    const payout = money(Math.max(0, indemnity - deductible));
    if (payout === 0 && indemnity > 0) {
        notes.push('Loss falls entirely within the deductible — nothing is payable.');
    }

    return { grossLoss, indemnity, deductible, payout, remainingCoverage: available, cappedByCoverage, deductibleWaived, notes };
}

module.exports = { computeSettlement, remainingCoverage, CONSUMING_STATUSES, DEDUCTIBLE_EXEMPT_LOSS_TYPES };
