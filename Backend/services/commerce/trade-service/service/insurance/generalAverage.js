'use strict';
/**
 * General Average apportionment (York-Antwerp Rules), migration 066.
 *
 * When a master deliberately sacrifices part of the cargo or incurs extraordinary
 * expense to save the common adventure — jettison, flooding a hold to fight a
 * fire, putting into a port of refuge, salvage — the loss is not borne by whoever
 * happened to own that cargo. It is shared by every interest in the voyage in
 * proportion to the value each had at risk. That is why "my container went over
 * the side" and "I owe money even though my container is fine" are both possible
 * outcomes of the same casualty, and why this runs alongside the cargo policy
 * rather than through it.
 *
 * The adjuster's arithmetic is:
 *   contribution rate = (general average sacrifice + salvage/GA expenses)
 *                       ÷ total contributory value of the whole adventure
 *   each interest pays = its contributory value × that rate
 *
 * Cargo is not released at destination until security is posted (average bond,
 * guarantee, or cash deposit) — modelled on the contribution row's security_type.
 */
const db = require('../../models');

const num = (x) => (x == null ? 0 : Number(x) || 0);
const money = (n) => Math.round(n * 100) / 100;

/**
 * Recompute the declaration's total contributory value and rate from its current
 * contribution rows, then write each row's share. Idempotent.
 */
async function apportion(ga) {
    const rows = await db.GeneralAverageContribution.findAll({ where: { ga_id: ga.id } });
    const totalCV = money(rows.reduce((sum, r) => sum + num(r.contributory_value), 0));
    const allowance = money(num(ga.sacrifice_value) + num(ga.salvage_expenses));

    // No values declared yet — record the total and leave the rate unset rather
    // than dividing by zero and writing a meaningless number.
    if (totalCV <= 0) {
        await ga.update({ total_contributory_value: 0, contribution_rate: null });
        return { totalContributoryValue: 0, allowance, rate: null, contributions: [], settled: false };
    }

    const rate = allowance / totalCV;
    await ga.update({ total_contributory_value: totalCV, contribution_rate: rate });

    const contributions = [];
    for (const r of rows) {
        const amount = money(num(r.contributory_value) * rate);
        if (money(num(r.contribution_amount)) !== amount) await r.update({ contribution_amount: amount });
        contributions.push({ id: r.id, policyId: r.policy_id, shipmentId: r.shipment_id, contributoryValue: num(r.contributory_value), contributionAmount: amount, status: r.status });
    }

    return { totalContributoryValue: totalCV, allowance, rate, contributions, settled: rows.every((r) => ['settled', 'waived'].includes(r.status)) };
}

module.exports = { apportion };
