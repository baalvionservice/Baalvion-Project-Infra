'use strict';
/**
 * Shipment Workflow — DETERMINISTIC state machine definition (War Room 4, Prompt 2).
 *
 * This module is PURE: no DB, no I/O, no clock, no randomness. Given a current
 * state and an event it returns exactly one outcome, so it is exhaustively
 * unit-testable on its own. The DB-backed engine (workflowEngine.js) wraps it
 * with persistence, idempotency, optimistic locking and webhook fan-out.
 *
 * Lifecycle (linear happy path):
 *   CREATED → DOCUMENT_COLLECTION → DOCUMENT_VERIFICATION → COMPLIANCE_CHECK →
 *   HS_CLASSIFICATION → CUSTOMS_READY → FREIGHT_BOOKED → DISPATCH_READY →
 *   DISPATCHED → IN_TRANSIT → DELIVERED → COMPLETED
 *
 * Terminal states: COMPLETED, FAILED.
 *
 * Logistics Core Foundation (Phase 1) — OPTIONAL granular sub-stages. These
 * widen a few `from` sets but never change an existing event's `to`, so the
 * happy path above still runs unmodified end to end; callers that want finer
 * visibility can additionally route through:
 *   FREIGHT_BOOKED -[assign_carrier]-> CARRIER_ASSIGNED -[ready_dispatch]-> DISPATCH_READY
 *   DISPATCH_READY -[schedule_pickup]-> PICKUP_SCHEDULED -[pick_up]-> PICKED_UP -[stuff_container]-> CONTAINER_STUFFING -[dispatch]-> DISPATCHED
 *   IN_TRANSIT -[transship]-> TRANSSHIPMENT -[resume_transit]-> IN_TRANSIT
 *   IN_TRANSIT/TRANSSHIPMENT -[arrive_port]-> PORT_ARRIVAL -[out_for_delivery]-> OUT_FOR_DELIVERY -[deliver]-> DELIVERED
 * RETURNED/DISPUTED/ARCHIVED are deliberately NOT modeled here — they are
 * post-delivery concerns handled by their own records (Phase 3: incident.js /
 * return.js), not sub-states of this pre-completion machine, since COMPLETED
 * is a hard terminal gate in decide() below (see isTerminal()).
 */

// ── States ───────────────────────────────────────────────────────────────────
const STATES = Object.freeze({
    CREATED: 'CREATED',
    DOCUMENT_COLLECTION: 'DOCUMENT_COLLECTION',
    DOCUMENT_VERIFICATION: 'DOCUMENT_VERIFICATION',
    COMPLIANCE_CHECK: 'COMPLIANCE_CHECK',
    HS_CLASSIFICATION: 'HS_CLASSIFICATION',
    CUSTOMS_READY: 'CUSTOMS_READY',
    FREIGHT_BOOKED: 'FREIGHT_BOOKED',
    DISPATCH_READY: 'DISPATCH_READY',
    DISPATCHED: 'DISPATCHED',
    IN_TRANSIT: 'IN_TRANSIT',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',

    // Logistics Core Foundation (Phase 1) — optional granular sub-stages (see
    // file header comment for exactly where each one plugs into the happy path).
    CARRIER_ASSIGNED: 'CARRIER_ASSIGNED',
    PICKUP_SCHEDULED: 'PICKUP_SCHEDULED',
    PICKED_UP: 'PICKED_UP',
    CONTAINER_STUFFING: 'CONTAINER_STUFFING',
    TRANSSHIPMENT: 'TRANSSHIPMENT',
    PORT_ARRIVAL: 'PORT_ARRIVAL',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
});

const ALL_STATES = Object.freeze(Object.values(STATES));

// Terminal states have no outgoing transitions — dispatch is rejected on them.
const TERMINAL_STATES = Object.freeze([STATES.COMPLETED, STATES.FAILED]);

// Workflow-level status (rolled up from current_state for cheap filtering).
const WORKFLOW_STATUSES = Object.freeze(['active', 'completed', 'failed']);

// Non-terminal states — the valid `from` set for the universal `fail` event.
const NON_TERMINAL = ALL_STATES.filter((s) => !TERMINAL_STATES.includes(s));

/**
 * Transition table — the single source of truth.
 *
 * Each event maps to exactly one target state plus the set of states it may be
 * applied from. Because (from, event) → to is a function (no event appears twice
 * with overlapping `from` sets resolving to different `to`), the machine is
 * deterministic.
 *
 *   forward:  drives the happy path one stage onward
 *   rework:   reject_documents loops verification back to collection
 *   terminal: complete / fail
 */
const TRANSITIONS = Object.freeze({
    // ── Forward path ──
    collect_documents: { from: [STATES.CREATED], to: STATES.DOCUMENT_COLLECTION, kind: 'forward' },
    submit_documents: { from: [STATES.DOCUMENT_COLLECTION], to: STATES.DOCUMENT_VERIFICATION, kind: 'forward' },
    verify_documents: { from: [STATES.DOCUMENT_VERIFICATION], to: STATES.COMPLIANCE_CHECK, kind: 'forward' },
    clear_compliance: { from: [STATES.COMPLIANCE_CHECK], to: STATES.HS_CLASSIFICATION, kind: 'forward' },
    classify_hs: { from: [STATES.HS_CLASSIFICATION], to: STATES.CUSTOMS_READY, kind: 'forward' },
    book_freight: { from: [STATES.CUSTOMS_READY], to: STATES.FREIGHT_BOOKED, kind: 'forward' },
    ready_dispatch: { from: [STATES.FREIGHT_BOOKED, STATES.CARRIER_ASSIGNED], to: STATES.DISPATCH_READY, kind: 'forward' },
    dispatch: {
        // DISPATCH_READY (original happy path) or CONTAINER_STUFFING (end of the
        // full granular pickup->stuffing chain) — deliberately NOT PICKUP_SCHEDULED
        // or PICKED_UP, so entering the granular chain can't skip its own steps.
        from: [STATES.DISPATCH_READY, STATES.CONTAINER_STUFFING],
        to: STATES.DISPATCHED,
        kind: 'forward',
    },
    depart: { from: [STATES.DISPATCHED], to: STATES.IN_TRANSIT, kind: 'forward' },
    deliver: { from: [STATES.IN_TRANSIT, STATES.PORT_ARRIVAL, STATES.OUT_FOR_DELIVERY], to: STATES.DELIVERED, kind: 'forward' },
    complete: { from: [STATES.DELIVERED], to: STATES.COMPLETED, kind: 'terminal' },

    // ── Optional granular sub-stages (Logistics Core Foundation, Phase 1) ──
    // Purely additive forks off the happy path above; none of them are on the
    // FORWARD_EVENT_BY_STATE canonical path (built below from the table you
    // just read), so /advance still walks the original happy path unless a
    // caller explicitly fires one of these events.
    assign_carrier: { from: [STATES.FREIGHT_BOOKED], to: STATES.CARRIER_ASSIGNED, kind: 'forward' },
    schedule_pickup: { from: [STATES.DISPATCH_READY, STATES.CARRIER_ASSIGNED], to: STATES.PICKUP_SCHEDULED, kind: 'forward' },
    pick_up: { from: [STATES.PICKUP_SCHEDULED], to: STATES.PICKED_UP, kind: 'forward' },
    stuff_container: { from: [STATES.PICKED_UP], to: STATES.CONTAINER_STUFFING, kind: 'forward' },
    transship: { from: [STATES.IN_TRANSIT], to: STATES.TRANSSHIPMENT, kind: 'forward' },
    resume_transit: { from: [STATES.TRANSSHIPMENT], to: STATES.IN_TRANSIT, kind: 'forward' },
    arrive_port: { from: [STATES.IN_TRANSIT, STATES.TRANSSHIPMENT], to: STATES.PORT_ARRIVAL, kind: 'forward' },
    out_for_delivery: { from: [STATES.IN_TRANSIT, STATES.PORT_ARRIVAL], to: STATES.OUT_FOR_DELIVERY, kind: 'forward' },

    // ── Rework (deterministic backward edge) ──
    reject_documents: { from: [STATES.DOCUMENT_VERIFICATION], to: STATES.DOCUMENT_COLLECTION, kind: 'rework' },

    // ── Universal failure — allowed from any non-terminal state ──
    fail: { from: NON_TERMINAL, to: STATES.FAILED, kind: 'terminal' },
});

const EVENTS = Object.freeze(Object.keys(TRANSITIONS));

// The single canonical forward event available from each non-terminal state
// (used by the /advance convenience endpoint). `fail`/`reject_documents` are
// deliberately excluded — advancing means moving the happy path forward.
//
// FIRST-WRITE-WINS: TRANSITIONS is declared happy-path-first, granular
// sub-stage events second (see the "Optional granular sub-stages" block
// above). Several of those sub-stage events deliberately re-list an existing
// happy-path state in their `from` (e.g. assign_carrier's `from` includes
// FREIGHT_BOOKED) so that state legally accepts either event — but /advance
// must keep resolving to the ORIGINAL happy-path event for that state, not
// silently switch to the optional fork. Skipping already-claimed states
// preserves that regardless of where new events get inserted into the table.
const FORWARD_EVENT_BY_STATE = Object.freeze(
    EVENTS.filter((e) => TRANSITIONS[e].kind === 'forward' || (TRANSITIONS[e].kind === 'terminal' && e === 'complete'))
        .reduce((acc, e) => {
            for (const from of TRANSITIONS[e].from) {
                if (acc[from] === undefined) acc[from] = e;
            }
            return acc;
        }, {}),
);

const isState = (s) => ALL_STATES.includes(s);
const isTerminal = (s) => TERMINAL_STATES.includes(s);
const isEvent = (e) => EVENTS.includes(e);

/** Events that may legally be applied from `state`, in declaration order. */
function allowedEvents(state) {
    if (!isState(state)) return [];
    return EVENTS.filter((e) => TRANSITIONS[e].from.includes(state));
}

/** The canonical next forward state from `state`, or null if none / terminal. */
function nextForwardState(state) {
    const e = FORWARD_EVENT_BY_STATE[state];
    return e ? TRANSITIONS[e].to : null;
}

/**
 * Pure transition decision. Never throws — returns a tagged result so callers
 * can decide how to surface an invalid transition.
 *
 * @returns {{ ok: true, from, event, to, kind } | { ok: false, code, message, from, event, allowed }}
 */
function decide(fromState, event) {
    if (!isState(fromState)) {
        return { ok: false, code: 'UNKNOWN_STATE', message: `Unknown state: ${fromState}`, from: fromState, event, allowed: [] };
    }
    if (!isEvent(event)) {
        return { ok: false, code: 'UNKNOWN_EVENT', message: `Unknown event: ${event}`, from: fromState, event, allowed: allowedEvents(fromState) };
    }
    if (isTerminal(fromState)) {
        return { ok: false, code: 'TERMINAL_STATE', message: `Workflow is in terminal state ${fromState}; no transitions allowed`, from: fromState, event, allowed: [] };
    }
    const t = TRANSITIONS[event];
    if (!t.from.includes(fromState)) {
        return {
            ok: false,
            code: 'INVALID_TRANSITION',
            message: `Event '${event}' is not valid from state '${fromState}'`,
            from: fromState,
            event,
            allowed: allowedEvents(fromState),
        };
    }
    return { ok: true, from: fromState, event, to: t.to, kind: t.kind };
}

/** Roll a state up to the coarse workflow status. */
function statusForState(state) {
    if (state === STATES.COMPLETED) return 'completed';
    if (state === STATES.FAILED) return 'failed';
    return 'active';
}

module.exports = {
    STATES,
    ALL_STATES,
    TERMINAL_STATES,
    NON_TERMINAL,
    WORKFLOW_STATUSES,
    TRANSITIONS,
    EVENTS,
    FORWARD_EVENT_BY_STATE,
    INITIAL_STATE: STATES.CREATED,
    isState,
    isTerminal,
    isEvent,
    allowedEvents,
    nextForwardState,
    decide,
    statusForState,
};
