'use strict';
/**
 * Logistics Core Foundation (Phase 2) — fleet assignment lifecycle transition
 * table. Pure (no DB, no I/O) so it's independently unit-testable, same
 * rationale as service/workflow/stateMachine.js. controller/fleetAssignmentController.js
 * wraps this with persistence + vehicle/driver availability side effects.
 */
const VALID_TRANSITIONS = Object.freeze({
    assigned: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
});

const STATUSES = Object.freeze(Object.keys(VALID_TRANSITIONS));

function canTransition(from, to) {
    return (VALID_TRANSITIONS[from] || []).includes(to);
}

/** @throws {Error} if the transition is not legal from `from` to `to`. */
function assertTransition(from, to) {
    if (!canTransition(from, to)) {
        const err = new Error(`cannot ${to} a fleet assignment in '${from}' state`);
        err.code = 'INVALID_TRANSITION';
        throw err;
    }
}

module.exports = { VALID_TRANSITIONS, STATUSES, canTransition, assertTransition };
