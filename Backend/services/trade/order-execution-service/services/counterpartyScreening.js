'use strict';
/**
 * R8 counterparty sanctions guard. Screens the named counterparties of an order
 * against the risk-service engine and returns an ALLOW/BLOCK decision per the
 * configured policy. Used by order placement to refuse trades with sanctioned
 * parties before any money-truth row is written.
 */
const { screen } = require('./sanctionsClient');
const policy = require('./screeningPolicy');
const config = require('../config/appConfig');

/**
 * @param {{ tenantId?: string, parties: Array<{role:string,name?:string,country?:string}> }} input
 * @param {{ screenFn?: Function }} [deps]  injectable for tests
 * @returns {Promise<{ decision:'ALLOW'|'BLOCK', blocked:Array, screened:Array }>}
 */
async function screenCounterparties({ tenantId, parties = [] }, deps = {}) {
    const screenFn = deps.screenFn || screen;
    const named = parties.filter((p) => p && p.name && String(p.name).trim());
    const results = await Promise.all(named.map(async (p) => {
        try {
            const result = await screenFn({ name: p.name, country: p.country, tenantId });
            return { party: p, result };
        } catch (e) {
            return { party: p, error: e.message || 'screen failed' };
        }
    }));
    const decision = policy.decide(results, {
        blockOnPotential: config.sanctions.blockOnPotential,
        failOpen: config.sanctions.failOpen,
    });
    return {
        ...decision,
        screened: results.map((r) => ({
            role: r.party.role,
            name: r.party.name,
            status: r.result ? r.result.status : 'ERROR',
        })),
    };
}

module.exports = { screenCounterparties };
