'use strict';
/**
 * Pre-arrival filing regimes — PURE (Compression, Phase 4).
 *
 * The single largest lever in the programme, worth 3–6 days on its own. Today a
 * clearance process STARTS when the vessel docks. Filed ahead of arrival, the
 * authority has already decided, and "clearance" becomes a release event on
 * arrival instead of a queue that begins there.
 *
 * The subtlety that costs importers real money: not every deadline is measured
 * from arrival. A US ISF is due 24 hours before the cargo is LADEN at the origin
 * port — a deadline that has already passed by the time the box is at sea, and
 * missing it is a liquidated-damages claim rather than a delay. Scheduling
 * everything off ETA silently misses it, so each regime declares which event its
 * clock runs from.
 *
 * Windows, not instants. Each regime has an EARLIEST it will accept a filing and
 * a DEADLINE. Filing before the window opens is rejected; filing after it closes
 * is a penalty. The scheduler aims at the start of the window, because the whole
 * point is to be early.
 *
 * PURE: no DB, no clock beyond the injected `now`.
 */

const REGIME_VERSION = '1.0.0';

const ANCHOR = Object.freeze({
    LADING: 'lading',     // measured back from departure/loading at origin
    ARRIVAL: 'arrival',   // measured back from arrival at destination
});

const EU = Object.freeze([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
    'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

/**
 * Filing regimes by destination jurisdiction.
 *
 * `filings` is ordered: a jurisdiction usually wants a security/manifest filing
 * on one clock and the fiscal declaration on another, and they are genuinely
 * different deadlines. Collapsing them into one is how the security filing gets
 * missed.
 */
const REGIMES = Object.freeze({
    US: {
        jurisdiction: 'United States',
        channel: 'ace',
        filings: [
            {
                key: 'isf_10_2',
                label: 'Importer Security Filing (10+2)',
                anchor: ANCHOR.LADING,
                deadline_hours_before: 24,
                earliest_hours_before: 24 * 30,
                modes: ['sea'],
                mandatory: true,
                penalty: 'Liquidated damages per late or inaccurate filing, plus a high probability of exam selection.',
                note: 'Measured from lading at the ORIGIN port, not from arrival. Once the box is loaded this deadline is already gone.',
            },
            {
                key: 'entry',
                label: 'CBP entry / entry summary',
                anchor: ANCHOR.ARRIVAL,
                deadline_hours_before: 0,
                earliest_hours_before: 24 * 15,
                modes: ['sea', 'air', 'road', 'rail'],
                mandatory: true,
                penalty: 'Cargo cannot be released; storage and demurrage accrue at the terminal.',
            },
        ],
    },

    EU: {
        jurisdiction: 'European Union',
        channel: 'eu_cds',
        filings: [
            {
                key: 'ens',
                label: 'Entry Summary Declaration (ICS2)',
                anchor: ANCHOR.LADING,
                deadline_hours_before: 24,
                earliest_hours_before: 24 * 30,
                modes: ['sea'],
                mandatory: true,
                penalty: 'Carrier may be refused loading; cargo can be held on arrival.',
                note: 'Deep-sea containerised traffic is the 24h-before-loading case. Short-sea and air run on shorter clocks.',
            },
            {
                key: 'import_declaration',
                label: 'Import declaration (CDS)',
                anchor: ANCHOR.ARRIVAL,
                deadline_hours_before: 0,
                earliest_hours_before: 24 * 30,
                modes: ['sea', 'air', 'road', 'rail'],
                mandatory: true,
                penalty: 'Goods sit in temporary storage, accruing cost.',
            },
        ],
    },

    IN: {
        jurisdiction: 'India',
        channel: 'icegate',
        filings: [
            {
                key: 'bill_of_entry',
                label: 'Advance Bill of Entry',
                anchor: ANCHOR.ARRIVAL,
                // The BoE is expected BEFORE arrival; filing late attracts a
                // charge, which is exactly the behaviour pre-arrival filing removes.
                deadline_hours_before: 24,
                earliest_hours_before: 24 * 30,
                modes: ['sea', 'air'],
                mandatory: true,
                penalty: 'Late-filing charge, and the assessment queue restarts on arrival instead of being already done.',
            },
        ],
    },

    AE: {
        jurisdiction: 'United Arab Emirates',
        channel: 'mirsal',
        filings: [
            {
                key: 'import_declaration',
                label: 'Mirsal 2 import declaration',
                anchor: ANCHOR.ARRIVAL,
                deadline_hours_before: 0,
                earliest_hours_before: 24 * 14,
                modes: ['sea', 'air', 'road'],
                mandatory: true,
                penalty: 'No release until lodged; storage accrues.',
            },
        ],
    },

    CN: {
        jurisdiction: 'China',
        channel: 'china_single_window',
        filings: [
            {
                key: 'manifest',
                label: 'Advance manifest',
                anchor: ANCHOR.LADING,
                deadline_hours_before: 24,
                earliest_hours_before: 24 * 30,
                modes: ['sea'],
                mandatory: true,
                penalty: 'Loading refusal at origin.',
            },
            {
                key: 'import_declaration',
                label: 'Customs declaration',
                anchor: ANCHOR.ARRIVAL,
                deadline_hours_before: 0,
                earliest_hours_before: 24 * 14,
                modes: ['sea', 'air'],
                mandatory: true,
                penalty: 'Held pending declaration.',
            },
        ],
    },
});

/** Resolve the regime for a destination country. */
function regimeFor(destinationCountry) {
    const c = String(destinationCountry || '').toUpperCase();
    if (REGIMES[c]) return { code: c, ...REGIMES[c] };
    if (EU.includes(c)) return { code: 'EU', member_state: c, ...REGIMES.EU };
    return null;
}

const HOUR_MS = 3600 * 1000;

const STATUS = Object.freeze({
    NOT_APPLICABLE: 'not_applicable',   // wrong mode for this filing
    UNSCHEDULABLE: 'unschedulable',     // no anchor date known yet
    NOT_YET_OPEN: 'not_yet_open',       // too early — the gateway would reject it
    OPEN: 'open',                       // file now; this is where we want to be
    DUE_SOON: 'due_soon',               // under 25% of the window left
    OVERDUE: 'overdue',                 // past the deadline, still fileable
    MISSED: 'missed',                   // anchor event has passed; penalty applies
    FILED: 'filed',
});

/**
 * Compute the filing window for one filing requirement.
 *
 * Returns `target_at` — the moment we intend to file, which is the START of the
 * window rather than the deadline. Aiming at a deadline preserves exactly the
 * behaviour this phase removes.
 */
function computeWindow(filing, { etd = null, eta = null, now = new Date() } = {}) {
    const anchorDate = filing.anchor === ANCHOR.LADING ? etd : eta;
    const anchorMs = anchorDate ? Date.parse(anchorDate) : NaN;

    if (!Number.isFinite(anchorMs)) {
        return {
            filing_key: filing.key,
            label: filing.label,
            anchor: filing.anchor,
            status: STATUS.UNSCHEDULABLE,
            reason: `No ${filing.anchor === ANCHOR.LADING ? 'departure (ETD)' : 'arrival (ETA)'} date on the consignment yet.`,
            earliest_at: null,
            due_at: null,
            target_at: null,
            hours_to_deadline: null,
        };
    }

    const earliestAt = new Date(anchorMs - filing.earliest_hours_before * HOUR_MS);
    const dueAt = new Date(anchorMs - filing.deadline_hours_before * HOUR_MS);
    const nowMs = new Date(now).getTime();
    const hoursToDeadline = Math.round(((dueAt.getTime() - nowMs) / HOUR_MS) * 100) / 100;

    let status;
    if (nowMs < earliestAt.getTime()) status = STATUS.NOT_YET_OPEN;
    else if (nowMs > anchorMs) status = STATUS.MISSED;
    else if (nowMs > dueAt.getTime()) status = STATUS.OVERDUE;
    else {
        const windowMs = dueAt.getTime() - earliestAt.getTime();
        const remaining = dueAt.getTime() - nowMs;
        status = windowMs > 0 && remaining / windowMs < 0.25 ? STATUS.DUE_SOON : STATUS.OPEN;
    }

    return {
        filing_key: filing.key,
        label: filing.label,
        anchor: filing.anchor,
        anchor_at: new Date(anchorMs).toISOString(),
        earliest_at: earliestAt.toISOString(),
        due_at: dueAt.toISOString(),
        // File at the start of the window, not at the deadline.
        target_at: new Date(Math.max(earliestAt.getTime(), nowMs)).toISOString(),
        hours_to_deadline: hoursToDeadline,
        status,
        mandatory: filing.mandatory,
        penalty: filing.penalty,
        note: filing.note || null,
    };
}

/**
 * The full pre-arrival plan for a consignment.
 *
 * `days_saved_estimate` is the honest headline: the difference between clearing
 * from a standing start on arrival and clearing against a decision already made.
 */
function plan(consignment, { now = new Date() } = {}) {
    const destination = consignment.destination_country;
    const mode = consignment.transport ? consignment.transport.mode : null;
    const etd = consignment.transport ? consignment.transport.etd : null;
    const eta = consignment.transport ? consignment.transport.eta : null;

    const regime = regimeFor(destination);
    if (!regime) {
        return {
            regime_version: REGIME_VERSION,
            destination,
            regime: null,
            filings: [],
            // Unknown is not "nothing required" — it means a broker must confirm.
            reason: `No pre-arrival regime is modelled for ${destination || 'this destination'}. Confirm the local requirement with the destination broker before relying on a fast lane.`,
        };
    }

    const filings = regime.filings.map((f) => {
        if (f.modes && mode && !f.modes.includes(mode)) {
            return {
                filing_key: f.key,
                label: f.label,
                status: STATUS.NOT_APPLICABLE,
                reason: `${f.label} applies to ${f.modes.join('/')} traffic; this consignment moves by ${mode}.`,
            };
        }
        return computeWindow(f, { etd, eta, now });
    });

    const actionable = filings.filter((f) => [STATUS.OPEN, STATUS.DUE_SOON, STATUS.OVERDUE].includes(f.status));
    const missed = filings.filter((f) => f.status === STATUS.MISSED);

    return {
        regime_version: REGIME_VERSION,
        destination,
        regime: { code: regime.code, jurisdiction: regime.jurisdiction, channel: regime.channel, member_state: regime.member_state || null },
        mode,
        filings,
        file_now: actionable.map((f) => f.filing_key),
        missed: missed.map((f) => f.filing_key),
        // Filing on arrival means the authority's assessment queue starts then.
        // Filed into the window, that queue has already run.
        days_saved_estimate: actionable.length || missed.length ? 3 : 0,
    };
}

/** Filings whose window is open right now — the scheduler's work list. */
function dueFilings(consignment, { now = new Date() } = {}) {
    return plan(consignment, { now }).filings
        .filter((f) => [STATUS.OPEN, STATUS.DUE_SOON, STATUS.OVERDUE].includes(f.status));
}

module.exports = {
    REGIME_VERSION,
    ANCHOR,
    STATUS,
    EU,
    REGIMES,
    regimeFor,
    computeWindow,
    plan,
    dueFilings,
};
