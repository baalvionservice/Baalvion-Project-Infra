'use strict';
/**
 * The seven steps of an order journey, worked out from the order's facts and the records the caller
 * is allowed to see. Pure: no database, no clock, no country names. Same input, same answer.
 *
 * A step is one of:
 *   done | in_progress | waiting | blocked | not_started | not_applicable
 * The "current" step is the first one that is not done and not applicable. `nextActor` says who must
 * act on it, and `isMyTurn` whether that is the caller.
 *
 * A party that is allowed to see only part of the records (a forwarder sees no invoice) gets a step
 * computed from what it can see, marked `partial` so a screen can say so rather than imply the
 * whole picture.
 */
const REQUIRED_DOCUMENTS = Object.freeze({
    always: ['commercial_invoice', 'packing_list'],
    // Needed to clear goods into another country; skipped when origin and destination are the same.
    crossBorder: ['certificate_of_origin'],
});

const DOC_READY = new Set(['available', 'verified']);
const DOC_BAD = new Set(['quarantined', 'rejected']);
const BOOKING_DONE = new Set(['booked', 'confirmed', 'in_transit', 'delivered']);
const BOOKING_OPEN = new Set(['draft', 'booking']);
const CUSTOMS_DONE = new Set(['accepted']);
const CUSTOMS_BAD = new Set(['rejected', 'failed']);
const CUSTOMS_OPEN = new Set(['queued', 'submitting', 'submitted']);

/** Who arranges the main transport, by Incoterms 2020 group. Unknown or unset: not decided yet. */
const SELLER_BOOKS = new Set(['CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']);
const BUYER_BOOKS = new Set(['EXW', 'FCA', 'FAS', 'FOB']);
function transportBooker(incoterm) {
    const t = String(incoterm || '').toUpperCase();
    if (SELLER_BOOKS.has(t)) return ['seller'];
    if (BUYER_BOOKS.has(t)) return ['buyer'];
    return ['seller', 'buyer'];
}

const label = (roles) => roles.map((r) => r.replace('_', ' ')).join(' or ');
const ofKind = (records, kind) => records.filter((r) => r.kind === kind);
const crossBorder = (j) => !!(j.origin_country && j.destination_country && j.origin_country !== j.destination_country);

function actor(roles, me) {
    return { roles, text: label(roles), isMyTurn: !!me && roles.includes(me.role) };
}

function stepDocuments(j, records, parties, me) {
    const required = [...REQUIRED_DOCUMENTS.always, ...(crossBorder(j) ? REQUIRED_DOCUMENTS.crossBorder : [])];
    const docs = ofKind(records, 'document');
    const ready = new Set(docs.filter((d) => DOC_READY.has(d.status)).map((d) => d.detail.docType));
    const missing = required.filter((t) => !ready.has(t));
    const rejected = docs.filter((d) => DOC_BAD.has(d.status));
    const canSeeAll = !!me && me.permissions.includes('documents.view') && required.every((t) => me.documentScopes.includes(t));
    let state = 'not_started';
    let summary = 'No documents have been added yet.';
    if (rejected.length) { state = 'blocked'; summary = `${rejected.length} document${rejected.length === 1 ? ' was' : 's were'} rejected and must be replaced.`; }
    else if (!missing.length) { state = 'done'; summary = 'All required documents are ready.'; }
    else if (docs.length) { state = 'in_progress'; summary = `Still needed: ${missing.map((t) => t.replace(/_/g, ' ')).join(', ')}.`; }
    return {
        key: 'documents', title: 'Documents', state, summary, partial: !canSeeAll,
        nextActor: state === 'done' ? null : actor(['seller'], me),
        required, missing,
        records: docs.map((d) => ({ kind: d.kind, id: d.record_id, status: d.status, title: d.title, docType: d.detail.docType })),
    };
}

function stepTransport(j, records, parties, me, docsDone) {
    const bookings = ofKind(records, 'freight_booking');
    const shipments = ofKind(records, 'shipment');
    const hasBooking = bookings.some((b) => BOOKING_DONE.has(b.status)) || shipments.length > 0;
    let state = 'not_started';
    let summary = 'Transport has not been booked yet.';
    if (hasBooking) { state = 'done'; summary = 'Transport is booked.'; }
    else if (bookings.some((b) => b.status === 'failed')) { state = 'blocked'; summary = 'The last booking attempt failed and needs another try.'; }
    else if (bookings.some((b) => BOOKING_OPEN.has(b.status))) { state = 'in_progress'; summary = 'A booking is being arranged.'; }
    else if (!docsDone) { summary = 'Transport can be booked once the documents are ready.'; }
    const roles = transportBooker(j.incoterm);
    return {
        key: 'transport_booking', title: 'Book transport', state, summary, partial: false,
        nextActor: state === 'done' ? null : actor(roles, me),
        records: [...bookings, ...shipments].map((r) => ({ kind: r.kind, id: r.record_id, status: r.status, title: r.title })),
    };
}

function stepCustoms(j, records, parties, me, transportDone) {
    const filings = ofKind(records, 'customs_filing');
    if (j.origin_country && j.destination_country && j.origin_country === j.destination_country) {
        return { key: 'customs', title: 'Customs', state: 'not_applicable', summary: 'This order stays inside one country, so there is no customs clearance.', partial: false, nextActor: null, records: [] };
    }
    const done = (d) => filings.some((f) => f.detail.direction === d && CUSTOMS_DONE.has(f.status));
    const exportDone = done('export');
    const importDone = done('import');
    let state = 'not_started';
    let summary = 'Customs clearance has not started.';
    if (filings.some((f) => CUSTOMS_BAD.has(f.status))) { state = 'blocked'; summary = 'A customs filing was rejected or failed and needs attention.'; }
    else if (exportDone && importDone) { state = 'done'; summary = 'Cleared at both ends.'; }
    else if (filings.some((f) => CUSTOMS_OPEN.has(f.status)) || exportDone || importDone) {
        state = 'in_progress';
        summary = exportDone ? 'Export is cleared; import clearance is next.' : importDone ? 'Import is cleared; export clearance is still open.' : 'A customs filing is with the authorities.';
    } else if (!transportDone) { summary = 'Customs follows the transport booking.'; }
    const hasBroker = parties.some((p) => p.role === 'customs_broker' && p.status === 'active');
    const roles = hasBroker ? ['customs_broker'] : exportDone ? ['buyer'] : ['seller'];
    return {
        key: 'customs', title: 'Customs', state, summary, partial: false,
        nextActor: state === 'done' ? null : actor(roles, me),
        records: filings.map((f) => ({ kind: f.kind, id: f.record_id, status: f.status, title: f.title, direction: f.detail.direction })),
    };
}

function stepTransit(j, records, parties, me, transportDone) {
    const shipments = ofKind(records, 'shipment');
    const arrived = shipments.some((s) => s.detail.actualArrival || s.status === 'delivered');
    const left = shipments.some((s) => s.detail.actualDeparture || ['in_transit', 'port_processing', 'customs_clearance', 'customs_hold', 'released', 'out_for_delivery', 'delayed', 're_routed'].includes(s.status));
    const trouble = shipments.some((s) => ['exception', 'customs_hold'].includes(s.status));
    let state = 'not_started';
    let summary = 'The goods have not left yet.';
    if (arrived) { state = 'done'; summary = 'The goods have arrived.'; }
    else if (trouble) { state = 'blocked'; summary = 'The shipment has an exception or customs hold.'; }
    else if (left) { state = 'in_progress'; summary = 'The goods are on their way.'; }
    else if (transportDone) { state = 'waiting'; summary = 'Waiting for the goods to be collected.'; }
    return {
        key: 'in_transit', title: 'In transit', state, summary, partial: false,
        nextActor: state === 'done' ? null : actor(['freight_forwarder'], me),
        records: shipments.map((s) => ({ kind: s.kind, id: s.record_id, status: s.status, title: s.title, ...s.detail })),
    };
}

function stepDelivery(j, records, parties, me, transitDone) {
    const pod = ofKind(records, 'proof_of_delivery');
    const delivered = pod.length > 0;
    return {
        key: 'delivery_payment', title: 'Delivery and payment',
        state: delivered ? 'in_progress' : 'not_started',
        summary: delivered ? 'Delivery is confirmed. Payment release is not tracked in this view yet.' : transitDone ? 'Waiting for proof of delivery.' : 'Delivery and payment come after the goods arrive.',
        partial: false,
        nextActor: actor(['buyer'], me),
        records: pod.map((p) => ({ kind: p.kind, id: p.record_id, status: p.status, deliveredAt: p.detail.deliveredAt })),
        notes: ['Payment status is not reported on the journey yet; it is added when the order service reports payment events.'],
    };
}

/**
 * @param journey  row from order_journeys (origin_country, destination_country, incoterm)
 * @param records  rows from tradeops.journey_records, already limited to what the caller may see
 * @param parties  [{ role, status }]
 * @param me       { role, permissions, documentScopes }
 */
function buildSteps({ journey, records = [], parties = [], me = null }) {
    const docs = stepDocuments(journey, records, parties, me);
    const transport = stepTransport(journey, records, parties, me, docs.state === 'done');
    const customs = stepCustoms(journey, records, parties, me, transport.state === 'done');
    const transit = stepTransit(journey, records, parties, me, transport.state === 'done');
    const delivery = stepDelivery(journey, records, parties, me, transit.state === 'done');
    const steps = [
        { key: 'request_offer', title: 'Request and offer', state: 'done', summary: 'The buyer and seller agreed a deal.', partial: false, nextActor: null, records: [] },
        { key: 'order_confirmed', title: 'Order confirmed', state: 'done', summary: 'The deal became an order.', partial: false, nextActor: null, records: [] },
        docs, transport, customs, transit, delivery,
    ].map((s, i) => ({ number: i + 1, ...s }));

    const finished = (s) => s.state === 'done' || s.state === 'not_applicable';
    const current = steps.find((s) => !finished(s)) || null;
    const counted = steps.filter((s) => s.state !== 'not_applicable');
    const progress = { done: counted.filter((s) => s.state === 'done').length, total: counted.length };
    return { steps, currentStep: current ? current.key : null, progress, complete: !current };
}

module.exports = { buildSteps, transportBooker, REQUIRED_DOCUMENTS };
