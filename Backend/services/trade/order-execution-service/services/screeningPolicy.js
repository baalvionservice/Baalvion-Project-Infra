'use strict';
/**
 * Pure sanctions-screening decision policy (R8). No I/O — fully unit-testable.
 *
 * Input: an array of per-party screen outcomes, each either
 *   { party, result: { status, confidence, matches } }   (engine answered)
 * or
 *   { party, error: '<reason>' }                          (engine unavailable)
 *
 * Output: { decision: 'ALLOW'|'BLOCK', blocked: [{ party, reason, status?, matches? }] }
 */

/** Decision for a single engine result. */
function decideForResult(result, { blockOnPotential = true } = {}) {
    if (!result || !result.status) return { block: false };
    if (result.status === 'CONFIRMED_MATCH') return { block: true, reason: 'CONFIRMED_MATCH' };
    if (result.status === 'POTENTIAL_MATCH' && blockOnPotential) return { block: true, reason: 'POTENTIAL_MATCH' };
    return { block: false };
}

/**
 * Aggregate decision across all parties.
 * @param {Array} partyResults
 * @param {{ blockOnPotential?: boolean, failOpen?: boolean }} opts
 */
function decide(partyResults, opts = {}) {
    const blockOnPotential = opts.blockOnPotential !== false;
    const failOpen = !!opts.failOpen;
    const blocked = [];
    for (const pr of partyResults || []) {
        if (pr.error) {
            // Engine unavailable for this party — fail-closed unless explicitly allowed.
            if (!failOpen) blocked.push({ party: pr.party, reason: 'SCREENING_UNAVAILABLE' });
            continue;
        }
        const d = decideForResult(pr.result, { blockOnPotential });
        if (d.block) {
            blocked.push({ party: pr.party, reason: d.reason, status: pr.result.status, matches: pr.result.matches });
        }
    }
    return { decision: blocked.length ? 'BLOCK' : 'ALLOW', blocked };
}

module.exports = { decide, decideForResult };
