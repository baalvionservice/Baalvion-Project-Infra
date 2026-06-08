'use strict';
// Pure supplier lifecycle state machine (no I/O — unit-testable).
const STAGE_FLOW = Object.freeze({
    prospect: ['onboarding', 'blacklisted'],
    onboarding: ['qualified', 'suspended', 'blacklisted'],
    qualified: ['active', 'suspended', 'blacklisted'],
    active: ['suspended', 'offboarded', 'blacklisted'],
    suspended: ['active', 'offboarded', 'blacklisted'],
    offboarded: [],
    blacklisted: [],
});
const canTransition = (from, to) => (STAGE_FLOW[from] || []).includes(to);
module.exports = { STAGE_FLOW, canTransition };
