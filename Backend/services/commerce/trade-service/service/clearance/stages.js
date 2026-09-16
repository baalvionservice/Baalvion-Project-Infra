'use strict';
/**
 * Clearance Stage Catalogue + critical-path model — PURE (Clearance Compression, Phase 0).
 *
 * The premise of the whole compression programme: an import/export cycle is not
 * slow because the work is hard. It is slow because the work is SERIALIZED, the
 * same data is RE-KEYED into ~25 documents, and a rejected filing costs a whole
 * human queue cycle rather than a minute. Roughly six hours of decision-making is
 * spread across ~19 days of elapsed time.
 *
 * So this module models the cycle as a DAG, not a list. Each stage carries:
 *
 *   dependsOn      the stages that must finish before it can start — the ONLY
 *                  thing that legitimately forces serialization. Anything not
 *                  linked here can and should run in parallel.
 *   baseline_hours typical real-world elapsed for that stage today (the number
 *                  we are trying to beat).
 *   target_hours   what the stage costs once the platform owns it.
 *   floor_hours    the part that CANNOT be compressed by software — a sovereign
 *                  SLA, a physical move, a biological test. Stated explicitly so
 *                  nobody promises around it.
 *
 * `criticalPath()` then computes the longest path through the DAG, which is the
 * only number that matters: total elapsed is the critical path, not the sum of
 * the parts. On the baseline durations it lands at ~446h (~18.6 days), matching
 * the observed cycle; on target durations, ~17h.
 *
 * NOTE: ocean/air transit is deliberately NOT modeled. This is the paperwork and
 * approval clock, which is what the platform can actually move. Transit time is
 * physics and belongs to the routing engine.
 *
 * PURE: no DB, no clock, no I/O. ledger.js wraps it with persistence.
 */

const ENGINE_VERSION = '1.0.0';

// Which party actually holds the work. The bottleneck rollup groups by this,
// because "who are we waiting on" is the operationally useful question — the
// fix for a shipper-owned stage (better UX) differs completely from the fix for
// an authority-owned one (accreditation).
const PARTY = Object.freeze({
    PLATFORM: 'platform',
    SHIPPER: 'shipper',
    CONSIGNEE: 'consignee',
    BROKER: 'broker',
    CARRIER: 'carrier',
    BANK: 'bank',
    AUTHORITY: 'authority',
    TERMINAL: 'terminal',
});

// Parallel tracks. Stages in different tracks have no inherent ordering — only
// an explicit dependsOn edge may serialize them.
const TRACK = Object.freeze({
    COMMERCIAL: 'commercial',   // the data: parties, goods, classification, documents
    FINANCE: 'finance',         // the money: FX, trade finance, duty funding
    LOGISTICS: 'logistics',     // the box: booking, carrier docs, pickup
    REGULATORY: 'regulatory',   // the state: certification, filing, assessment, release
});

const STAGE_STATUS = Object.freeze({
    PENDING: 'pending',
    ACTIVE: 'active',
    BLOCKED: 'blocked',
    DONE: 'done',
    SKIPPED: 'skipped',
});
const OPEN_STATUSES = Object.freeze([STAGE_STATUS.ACTIVE, STAGE_STATUS.BLOCKED]);
const ALL_STAGE_STATUSES = Object.freeze(Object.values(STAGE_STATUS));

/**
 * The catalogue. Order here is presentation order only — the DAG edges in
 * dependsOn are the real ordering, and criticalPath() ignores this array's order.
 *
 * `conditional: true` stages are excluded from a path computation unless the
 * caller explicitly includes them (customs_exam only happens if the consignment
 * is actually selected for one — pricing it into every quote is dishonest).
 */
const STAGES = Object.freeze([
    {
        key: 'order_capture',
        label: 'Order capture',
        track: TRACK.COMMERCIAL,
        owner: PARTY.PLATFORM,
        dependsOn: [],
        baseline_hours: 8,
        target_hours: 0.25,
        floor_hours: 0.1,
        note: 'Canonical consignment record created once; everything else derives from it.',
    },
    {
        key: 'party_verification',
        label: 'Party verification (KYC / sanctions)',
        track: TRACK.COMMERCIAL,
        owner: PARTY.PLATFORM,
        dependsOn: ['order_capture'],
        baseline_hours: 96,
        target_hours: 0.5,
        floor_hours: 0.25,
        note: 'Baseline is a cold KYC on an unknown counterparty. Target assumes a already-verified party — the result is cached, not recomputed.',
    },
    {
        key: 'hs_classification',
        label: 'HS classification',
        track: TRACK.COMMERCIAL,
        owner: PARTY.PLATFORM,
        dependsOn: ['order_capture'],
        baseline_hours: 24,
        target_hours: 0.25,
        floor_hours: 0.1,
        note: 'Drives duty, licensing and the required-document set, so it gates most of the regulatory track.',
    },
    {
        key: 'document_preparation',
        label: 'Document preparation',
        track: TRACK.COMMERCIAL,
        owner: PARTY.SHIPPER,
        dependsOn: ['order_capture', 'hs_classification'],
        baseline_hours: 120,
        target_hours: 0.25,
        floor_hours: 0.1,
        note: 'The single largest baseline stage and almost pure waste: the same 40 fields re-keyed into ~25 documents. Target assumes derivation from the canonical record.',
    },
    {
        key: 'document_verification',
        label: 'Document verification',
        track: TRACK.COMMERCIAL,
        owner: PARTY.BROKER,
        dependsOn: ['document_preparation'],
        baseline_hours: 48,
        target_hours: 1,
        floor_hours: 0.5,
    },
    {
        key: 'fx_lock',
        label: 'FX rate lock',
        track: TRACK.FINANCE,
        owner: PARTY.PLATFORM,
        dependsOn: ['order_capture'],
        baseline_hours: 24,
        target_hours: 0.1,
        floor_hours: 0.05,
    },
    {
        key: 'trade_finance',
        label: 'Trade finance (LC / open account)',
        track: TRACK.FINANCE,
        owner: PARTY.BANK,
        dependsOn: ['party_verification', 'fx_lock'],
        baseline_hours: 120,
        target_hours: 4,
        floor_hours: 4,
        note: 'Bank-owned. Target assumes a pre-approved facility; the 4h floor is genuine bank processing we cannot compress.',
    },
    {
        key: 'duty_funding',
        label: 'Duty funding',
        track: TRACK.FINANCE,
        owner: PARTY.PLATFORM,
        dependsOn: ['hs_classification', 'trade_finance'],
        baseline_hours: 48,
        target_hours: 0.25,
        floor_hours: 0.1,
        note: 'Needs the duty amount (HS) and available funds. Target assumes a pre-funded duty account, so this becomes a balance check.',
    },
    {
        key: 'freight_booking',
        label: 'Freight booking',
        track: TRACK.LOGISTICS,
        owner: PARTY.PLATFORM,
        dependsOn: ['order_capture'],
        baseline_hours: 48,
        target_hours: 1,
        floor_hours: 0.5,
    },
    {
        key: 'carrier_documentation',
        label: 'Carrier documentation (SI / BL)',
        track: TRACK.LOGISTICS,
        owner: PARTY.CARRIER,
        dependsOn: ['freight_booking', 'document_verification'],
        baseline_hours: 48,
        target_hours: 2,
        floor_hours: 1,
    },
    {
        key: 'origin_certification',
        label: 'Origin / sanitary certification',
        track: TRACK.REGULATORY,
        owner: PARTY.AUTHORITY,
        dependsOn: ['document_verification', 'hs_classification'],
        baseline_hours: 72,
        target_hours: 8,
        floor_hours: 8,
        note: 'Chamber-of-commerce eCoO is fast; phytosanitary and fumigation are physical/biological and set the real floor.',
    },
    {
        key: 'export_filing',
        label: 'Export declaration filing',
        track: TRACK.REGULATORY,
        owner: PARTY.PLATFORM,
        dependsOn: ['document_verification', 'hs_classification', 'party_verification'],
        baseline_hours: 24,
        target_hours: 0.5,
        floor_hours: 0.1,
    },
    {
        key: 'export_clearance',
        label: 'Export clearance',
        track: TRACK.REGULATORY,
        owner: PARTY.AUTHORITY,
        dependsOn: ['export_filing'],
        baseline_hours: 24,
        target_hours: 2,
        floor_hours: 2,
        note: 'Sovereign decision. The 2h floor is the authority’s, not ours.',
    },
    {
        key: 'cargo_pickup_stuffing',
        label: 'Pickup + container stuffing',
        track: TRACK.LOGISTICS,
        owner: PARTY.CARRIER,
        dependsOn: ['freight_booking', 'export_clearance'],
        baseline_hours: 24,
        target_hours: 8,
        floor_hours: 8,
        note: 'Physical move. Software schedules it; it does not shorten it.',
    },
    {
        key: 'import_prefiling',
        label: 'Import pre-filing',
        track: TRACK.REGULATORY,
        owner: PARTY.PLATFORM,
        dependsOn: ['export_filing', 'hs_classification', 'origin_certification'],
        baseline_hours: 24,
        target_hours: 0.25,
        floor_hours: 0.1,
        note: 'The lever that moves the clock left: filed against scheduled arrival, so clearance is a release event on arrival rather than a process that starts on arrival.',
    },
    {
        key: 'import_assessment',
        label: 'Import assessment',
        track: TRACK.REGULATORY,
        owner: PARTY.AUTHORITY,
        dependsOn: ['import_prefiling', 'duty_funding'],
        baseline_hours: 60,
        target_hours: 2,
        floor_hours: 2,
        note: 'Target assumes a green-channel trader. A non-accredited trader does not get this number — see scenario("cold_start").',
    },
    {
        key: 'customs_exam',
        label: 'Customs examination',
        track: TRACK.REGULATORY,
        owner: PARTY.AUTHORITY,
        dependsOn: ['import_assessment'],
        baseline_hours: 72,
        target_hours: 48,
        floor_hours: 48,
        conditional: true,
        note: 'Only if the consignment is selected. Entirely physical queue time — no software path shortens it, which is why trusted-trader status (avoiding selection) is the only real lever.',
    },
    {
        key: 'duty_payment',
        label: 'Duty + tax payment',
        track: TRACK.FINANCE,
        owner: PARTY.PLATFORM,
        dependsOn: ['import_assessment', 'duty_funding'],
        baseline_hours: 24,
        target_hours: 0.1,
        floor_hours: 0.05,
        note: 'Baseline is "someone logs into a bank at 10am". Target is a ledger debit against the pre-funded account.',
    },
    {
        key: 'release_order',
        label: 'Customs release order',
        track: TRACK.REGULATORY,
        owner: PARTY.AUTHORITY,
        dependsOn: ['duty_payment', 'customs_exam'],
        baseline_hours: 30,
        target_hours: 1,
        floor_hours: 1,
    },
    {
        key: 'terminal_release_gateout',
        label: 'Terminal release + gate-out',
        track: TRACK.LOGISTICS,
        owner: PARTY.TERMINAL,
        dependsOn: ['release_order'],
        baseline_hours: 36,
        target_hours: 4,
        floor_hours: 4,
    },
]);

const BY_KEY = Object.freeze(STAGES.reduce((acc, s) => { acc[s.key] = s; return acc; }, {}));
const STAGE_KEYS = Object.freeze(STAGES.map((s) => s.key));
const CONDITIONAL_KEYS = Object.freeze(STAGES.filter((s) => s.conditional).map((s) => s.key));

const isStage = (key) => Object.prototype.hasOwnProperty.call(BY_KEY, key);
const stageDef = (key) => BY_KEY[key] || null;

const HOUR_MS = 3600 * 1000;
const hoursToMs = (h) => Math.round(Number(h || 0) * HOUR_MS);
const msToHours = (ms) => Math.round((Number(ms || 0) / HOUR_MS) * 100) / 100;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// ── Critical path ────────────────────────────────────────────────────────────

/**
 * Topological order over the active stage set. The catalogue is a hand-written
 * DAG, so a cycle here is a authoring bug, not a runtime condition — we throw
 * rather than silently producing a wrong path.
 */
function topoSort(keys) {
    const active = new Set(keys);
    const indegree = {};
    const dependents = {};
    for (const key of active) {
        indegree[key] = 0;
        dependents[key] = [];
    }
    for (const key of active) {
        for (const dep of stageDef(key).dependsOn) {
            if (!active.has(dep)) continue; // an excluded conditional edge just vanishes
            indegree[key] += 1;
            dependents[dep].push(key);
        }
    }
    // Seed in catalogue order so the output is stable for equal-indegree stages.
    const queue = STAGE_KEYS.filter((k) => active.has(k) && indegree[k] === 0);
    const order = [];
    while (queue.length) {
        const key = queue.shift();
        order.push(key);
        for (const next of dependents[key]) {
            indegree[next] -= 1;
            if (indegree[next] === 0) queue.push(next);
        }
    }
    if (order.length !== active.size) {
        throw new Error('clearance stage catalogue contains a dependency cycle');
    }
    return order;
}

/** The stage set for a scenario: everything non-conditional, plus any opted in. */
function activeKeys({ include = [], exclude = [] } = {}) {
    const inc = new Set(include);
    const exc = new Set(exclude);
    return STAGE_KEYS.filter((k) => {
        if (exc.has(k)) return false;
        if (BY_KEY[k].conditional) return inc.has(k);
        return true;
    });
}

/**
 * Longest path through the DAG under a given per-stage duration function.
 *
 * Total elapsed for a consignment is the critical path, NOT the sum of stage
 * durations — that distinction is the entire argument for parallelizing the
 * workflow, so it is computed rather than asserted.
 *
 * @param {(def:object)=>number} durationOf  hours for a stage (defaults to baseline)
 * @returns {{ total_hours, total_days, path: string[], finish: object, slack: object }}
 */
function criticalPath(durationOf = (d) => d.baseline_hours, opts = {}) {
    const keys = activeKeys(opts);
    const order = topoSort(keys);
    const active = new Set(keys);

    const finish = {};
    const start = {};
    const prev = {};
    for (const key of order) {
        const def = stageDef(key);
        let earliestStart = 0;
        let from = null;
        for (const dep of def.dependsOn) {
            if (!active.has(dep)) continue;
            if (finish[dep] > earliestStart) { earliestStart = finish[dep]; from = dep; }
        }
        start[key] = earliestStart;
        finish[key] = earliestStart + Number(durationOf(def) || 0);
        prev[key] = from;
    }

    // Walk back from the latest-finishing stage to recover the path itself.
    let tail = null;
    for (const key of order) {
        if (tail === null || finish[key] > finish[tail]) tail = key;
    }
    const path = [];
    for (let cur = tail; cur; cur = prev[cur]) path.unshift(cur);

    const total = tail === null ? 0 : finish[tail];
    // Slack = how long a stage could overrun before it lands on the critical path.
    const slack = {};
    for (const key of order) slack[key] = round2(total - finish[key]);

    return {
        total_hours: round2(total),
        total_days: round2(total / 24),
        path,
        finish: Object.fromEntries(Object.entries(finish).map(([k, v]) => [k, round2(v)])),
        start: Object.fromEntries(Object.entries(start).map(([k, v]) => [k, round2(v)])),
        slack,
    };
}

/**
 * The named scenarios we quote against. Every customer-facing number should come
 * from here rather than being written into a deck, so a change to the model
 * changes the promise.
 *
 *   baseline    the industry cycle we are compressing (~19 days)
 *   target      pre-verified trader, green channel, no exam — the 1-day claim
 *   cold_start  first-time shipper: KYC and trade finance run at baseline, so
 *               the honest floor is several days, not one
 *   examined    target trader whose box gets pulled for physical exam
 *   floor       every stage at its irreducible minimum — the theoretical limit
 *               even with perfect software and perfect accreditation
 */
const SCENARIOS = Object.freeze({
    baseline: { durationOf: (d) => d.baseline_hours, opts: {} },
    target: { durationOf: (d) => d.target_hours, opts: {} },
    cold_start: {
        durationOf: (d) => (['party_verification', 'trade_finance', 'import_assessment'].includes(d.key)
            ? d.baseline_hours
            : d.target_hours),
        opts: {},
    },
    examined: { durationOf: (d) => d.target_hours, opts: { include: ['customs_exam'] } },
    floor: { durationOf: (d) => d.floor_hours, opts: {} },
});

function scenario(name) {
    const s = SCENARIOS[name];
    if (!s) throw new Error(`unknown clearance scenario: ${name}`);
    const cp = criticalPath(s.durationOf, s.opts);
    return { scenario: name, ...cp };
}

/** All scenarios at once — the model summary a dashboard renders. */
function scenarioSummary() {
    return Object.keys(SCENARIOS).reduce((acc, name) => {
        const { total_hours, total_days, path } = scenario(name);
        acc[name] = { total_hours, total_days, critical_path: path };
        return acc;
    }, {});
}

// ── Observed timing analysis ─────────────────────────────────────────────────

/**
 * Roll a set of persisted stage-timing rows into the bottleneck view.
 *
 * The reason this exists before any optimization work: you cannot compress what
 * you have not measured, and the stages that actually hold the time are reliably
 * NOT the ones people assume. Everything downstream is prioritized off this.
 *
 * @param {object[]} rows  clearance_stage_timings rows (plain objects)
 * @param {Date} now       injected clock — open stages accrue up to `now`
 */
function analyze(rows = [], now = new Date()) {
    const nowMs = now.getTime();
    const per = [];

    for (const row of rows) {
        const def = stageDef(row.stage);
        const startedAt = row.started_at ? new Date(row.started_at).getTime() : null;
        const completedAt = row.completed_at ? new Date(row.completed_at).getTime() : null;
        const open = OPEN_STATUSES.includes(row.status);

        // An open stage accrues to now; a closed one is frozen at completion.
        const elapsedMs = startedAt === null
            ? 0
            : Math.max(0, (completedAt !== null ? completedAt : (open ? nowMs : startedAt)) - startedAt);

        // Blocked time already banked, plus the currently-open block window.
        const bankedBlocked = Number(row.blocked_ms || 0);
        const openBlock = row.blocked_since ? Math.max(0, nowMs - new Date(row.blocked_since).getTime()) : 0;
        const blockedMs = bankedBlocked + openBlock;

        const baselineHours = def ? def.baseline_hours : null;
        const targetHours = def ? def.target_hours : null;
        const elapsedHours = msToHours(elapsedMs);

        per.push({
            stage: row.stage,
            label: def ? def.label : row.stage,
            track: def ? def.track : null,
            owner: row.waiting_on_party || (def ? def.owner : null),
            status: row.status,
            elapsed_hours: elapsedHours,
            blocked_hours: msToHours(blockedMs),
            working_hours: round2(Math.max(0, elapsedHours - msToHours(blockedMs))),
            baseline_hours: baselineHours,
            target_hours: targetHours,
            // vs_target > 1 means the stage is running slower than the model promises.
            vs_target: targetHours ? round2(elapsedHours / targetHours) : null,
            vs_baseline: baselineHours ? round2(elapsedHours / baselineHours) : null,
            breached: row.target_at ? (completedAt || nowMs) > new Date(row.target_at).getTime() : false,
            touch_count: Number(row.touch_count || 0),
            blocked_by: row.blocked_by || null,
            open,
        });
    }

    const totalElapsed = per.reduce((a, s) => a + s.elapsed_hours, 0);
    const share = (h) => (totalElapsed > 0 ? round2((h / totalElapsed) * 100) : 0);

    // Bottlenecks: where the time actually sits, biggest first.
    const bottlenecks = per
        .slice()
        .sort((a, b) => b.elapsed_hours - a.elapsed_hours)
        .map((s) => ({ ...s, share_pct: share(s.elapsed_hours) }));

    const groupSum = (keyFn) => per.reduce((acc, s) => {
        const k = keyFn(s) || 'unknown';
        acc[k] = round2((acc[k] || 0) + s.elapsed_hours);
        return acc;
    }, {});

    // The 80/20: the smallest set of stages holding 80% of elapsed time. This is
    // the work queue for whoever is doing the compressing.
    const vital = [];
    let cum = 0;
    for (const s of bottlenecks) {
        if (cum >= 80) break;
        vital.push(s.stage);
        cum += s.share_pct;
    }

    return {
        engine_version: ENGINE_VERSION,
        stages: per,
        bottlenecks,
        by_track: groupSum((s) => s.track),
        by_party: groupSum((s) => s.owner),
        vital_few: vital,
        totals: {
            elapsed_hours: round2(totalElapsed),
            elapsed_days: round2(totalElapsed / 24),
            blocked_hours: round2(per.reduce((a, s) => a + s.blocked_hours, 0)),
            working_hours: round2(per.reduce((a, s) => a + s.working_hours, 0)),
            rework_touches: per.reduce((a, s) => a + Math.max(0, s.touch_count - 1), 0),
            breached_stages: per.filter((s) => s.breached).length,
            open_stages: per.filter((s) => s.open).length,
        },
    };
}

module.exports = {
    ENGINE_VERSION,
    PARTY,
    TRACK,
    STAGE_STATUS,
    OPEN_STATUSES,
    ALL_STAGE_STATUSES,
    STAGES,
    STAGE_KEYS,
    CONDITIONAL_KEYS,
    BY_KEY,
    isStage,
    stageDef,
    hoursToMs,
    msToHours,
    topoSort,
    activeKeys,
    criticalPath,
    SCENARIOS,
    scenario,
    scenarioSummary,
    analyze,
};
