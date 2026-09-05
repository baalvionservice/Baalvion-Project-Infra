'use strict';
/**
 * Pre-submit filing gate — PURE (Compression, Phase 2).
 *
 * The rejection loop is the most expensive pattern in the cycle: a bounced
 * filing does not cost five minutes, it costs a full human queue cycle, which is
 * a day. So nothing reaches a gateway until it would pass.
 *
 * This module answers one question — "would this filing be accepted?" — and
 * answers it BEFORE submission, at data-entry time, with the destination's
 * actual requirement set (matrix.js) plus the structural checks that a gateway
 * will apply anyway. Every finding carries a `fix`, because a blocked filing
 * with no stated remedy just moves the queue rather than removing it.
 *
 * The metric this exists to move is FIRST-PASS ACCEPTANCE. It is estimated here
 * and measured for real against gateway outcomes (see corridorEngine), because
 * an estimate nobody reconciles against reality drifts into fiction.
 *
 * PURE: no DB, no clock, no I/O.
 */

const matrix = require('./matrix');

const PRECHECK_VERSION = '1.0.0';

const SEVERITY = matrix.SEVERITY;

/** Read a dotted path off the canonical consignment. */
function pick(obj, path) {
    return String(path).split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

const isBlank = (v) => v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

/** Human label for a dotted path, so findings read as English rather than schema. */
function labelFor(path) {
    return String(path)
        .replace(/^parties\./, '')
        .replace(/^totals\./, '')
        .replace(/^commercial\./, '')
        .replace(/^transport\./, '')
        .split('.')
        .map((p) => p.replace(/_/g, ' '))
        .join(' ');
}

/**
 * Structural checks — the arithmetic and format errors a gateway will bounce
 * regardless of corridor. These are the cheapest possible rejections to prevent
 * because they are fully decidable from the record itself.
 */
function structuralFindings(c) {
    const out = [];
    const push = (code, severity, message, fix, field = null) => out.push({ code, severity, field, message, fix });

    const lines = c.lines || [];
    if (!lines.length) {
        push('NO_LINES', SEVERITY.BLOCKING, 'The consignment has no goods lines.', 'Add at least one line with a description, quantity and unit price.');
    }

    const seen = new Set();
    for (const l of lines) {
        const at = `line ${l.line_no}`;
        if (seen.has(l.line_no)) {
            push('DUPLICATE_LINE_NO', SEVERITY.BLOCKING, `Duplicate line number ${l.line_no}.`, 'Renumber the lines so each is unique.', at);
        }
        seen.add(l.line_no);

        if (l.hs_code && l.hs_code.length < 6) {
            push('HS_TOO_SHORT', SEVERITY.BLOCKING,
                `${at}: HS code "${l.hs_code}" has ${l.hs_code.length} digits.`,
                'Customs needs at least the 6-digit international subheading; most destinations want the 8–10 digit national line.', at);
        }
        if (l.quantity <= 0) {
            push('NON_POSITIVE_QUANTITY', SEVERITY.BLOCKING, `${at}: quantity must be greater than zero.`, 'Enter the actual shipped quantity.', at);
        }
        // Gross below net is physically impossible and is a reliable sign the two
        // weights were entered into swapped fields.
        if (l.gross_weight_kg > 0 && l.net_weight_kg > 0 && l.gross_weight_kg < l.net_weight_kg) {
            push('GROSS_BELOW_NET', SEVERITY.BLOCKING,
                `${at}: gross weight (${l.gross_weight_kg}kg) is below net weight (${l.net_weight_kg}kg).`,
                'Gross includes packaging, so it can never be less than net — the two values are likely swapped.', at);
        }
        if (l.package_count === 0 && l.quantity > 0) {
            push('NO_PACKAGE_COUNT', SEVERITY.WARNING, `${at}: no package count.`, 'Enter how many cartons/pallets this line ships as; the packing list and the carrier both need it.', at);
        }
    }

    // Container numbers are check-digit verifiable, so a typo should never reach
    // a carrier or a gateway.
    for (const cn of (c.transport && c.transport.container_numbers) || []) {
        if (!matrix.isValidContainerNumber(cn)) {
            push('BAD_CONTAINER_NUMBER', SEVERITY.BLOCKING,
                `Container number "${cn}" fails its ISO 6346 check digit.`,
                'Re-read the number off the box: 4 letters, 6 digits, then the check digit in the small box.', 'transport.container_numbers');
        }
    }

    if (Number(c.totals && c.totals.customs_value) <= 0) {
        push('ZERO_CUSTOMS_VALUE', SEVERITY.BLOCKING,
            'Declared customs value is zero.',
            'A zero-value declaration is treated as a valuation fraud signal. Declare the transaction value, or use the correct free-of-charge procedure.', 'totals.customs_value');
    }

    // ETD after ETA is a data-entry inversion that breaks pre-arrival scheduling.
    const etd = c.transport && c.transport.etd ? Date.parse(c.transport.etd) : NaN;
    const eta = c.transport && c.transport.eta ? Date.parse(c.transport.eta) : NaN;
    if (Number.isFinite(etd) && Number.isFinite(eta) && etd > eta) {
        push('ETD_AFTER_ETA', SEVERITY.BLOCKING,
            'Departure date is after arrival date.',
            'Swap the ETD and ETA — pre-arrival filing is scheduled off these dates and will not fire correctly.', 'transport.etd');
    }

    return out;
}

/** Requirement checks — what this specific corridor demands. */
function requirementFindings(c, resolved, { documentsPresent = [], certificatesPresent = [] } = {}) {
    const out = [];
    const push = (code, severity, message, fix, field = null, ruleId = null) => out.push({ code, severity, field, message, fix, rule_id: ruleId });

    const severityOf = (ruleIds) => (ruleIds.some((id) => resolved.blocking_rule_ids.includes(id)) ? SEVERITY.BLOCKING : SEVERITY.WARNING);
    const rulesRequiring = (key, value) => (resolved.rules_applied || [])
        .filter((r) => {
            const rule = matrix.RULES.find((x) => x.id === r.id);
            const req = rule && rule.requires && rule.requires[key];
            return Array.isArray(req) ? req.includes(value) : req === value;
        })
        .map((r) => r.id);

    // Required documents
    const have = new Set(documentsPresent);
    for (const doc of resolved.documents) {
        if (have.has(doc)) continue;
        const rules = rulesRequiring('documents', doc);
        push('MISSING_DOCUMENT', severityOf(rules),
            `Required document not present: ${doc.replace(/_/g, ' ')}.`,
            'Generate it from the consignment — it derives automatically and never needs typing.',
            doc, rules[0] || null);
    }

    // Required fields on the canonical record
    for (const field of resolved.fields) {
        if (!isBlank(pick(c, field))) continue;
        const rules = rulesRequiring('fields', field);
        push('MISSING_FIELD', severityOf(rules),
            `Required field is empty: ${labelFor(field)}.`,
            'Fill it on the consignment once; every document and the declaration pick it up automatically.',
            field, rules[0] || null);
    }

    // Required fields on every line
    for (const field of resolved.line_fields) {
        for (const l of c.lines || []) {
            if (!isBlank(l[field])) continue;
            push('MISSING_LINE_FIELD', SEVERITY.BLOCKING,
                `Line ${l.line_no}: ${labelFor(field)} is required.`,
                'Complete the line — an incomplete line cannot be assessed and will bounce the whole declaration.',
                `line ${l.line_no}.${field}`);
        }
    }

    // Identifier formats — cheap to check, expensive to get wrong
    for (const ident of resolved.identifiers) {
        const party = (c.parties || {})[ident.party];
        const value = party && party.tax_id;
        const validator = matrix.IDENTIFIER_VALIDATORS[ident.type];
        if (!validator) continue;
        if (isBlank(value)) continue; // already reported by the missing-field pass
        if (validator.test(value)) continue;
        push('INVALID_IDENTIFIER', SEVERITY.BLOCKING,
            `${ident.party} ${validator.label} "${value}" is not a valid format.`,
            validator.hint,
            `parties.${ident.party}.tax_id`);
    }

    // Externally-issued certificates the platform cannot generate
    const haveCerts = new Set(certificatesPresent);
    for (const cert of resolved.external_certificates) {
        if (haveCerts.has(cert)) continue;
        const rules = rulesRequiring('external_certificates', cert);
        const rule = matrix.RULES.find((x) => x.id === rules[0]);
        push('MISSING_CERTIFICATE', severityOf(rules),
            `Required certificate not on file: ${cert.replace(/_/g, ' ')}.`,
            rule && rule.adds_floor_hours
                ? `This is issued by a third party and takes roughly ${rule.adds_floor_hours}h — start it now, it is on the critical path.`
                : 'Upload the issued certificate before filing.',
            cert, rules[0] || null);
    }

    return out;
}

/**
 * Estimated probability that this filing is accepted first time.
 *
 * Deliberately conservative and deliberately crude: any blocking finding means
 * the filing must not be submitted at all, so the estimate only has to be
 * meaningful for the clean-ish cases. corridorEngine reconciles it against
 * observed gateway outcomes; the observed rate, not this number, is the KPI.
 */
function firstPassProbability(findings, resolved) {
    if (findings.some((f) => f.severity === SEVERITY.BLOCKING)) return 0;
    const warnings = findings.filter((f) => f.severity === SEVERITY.WARNING).length;
    // Each unresolved warning is a real, if smaller, rejection risk; corridors
    // with many active rules are intrinsically more failure-prone.
    const ruleLoad = Math.min(0.06, (resolved.rules_applied.length || 0) * 0.004);
    return Math.max(0.5, Math.round((0.99 - warnings * 0.05 - ruleLoad) * 100) / 100);
}

/**
 * The gate. `submittable` is the only field a caller needs to respect: false
 * means the filing must not be transmitted.
 */
function precheck(consignment, {
    partyStatus = 'verified',
    extraRules = [],
    documentsPresent = [],
    certificatesPresent = [],
} = {}) {
    const resolved = matrix.resolve(consignment, { partyStatus, extraRules });
    const findings = [
        ...structuralFindings(consignment),
        ...requirementFindings(consignment, resolved, { documentsPresent, certificatesPresent }),
    ];

    const blocking = findings.filter((f) => f.severity === SEVERITY.BLOCKING);
    const warnings = findings.filter((f) => f.severity === SEVERITY.WARNING);

    return {
        precheck_version: PRECHECK_VERSION,
        matrix_version: resolved.matrix_version,
        submittable: blocking.length === 0,
        blocking_count: blocking.length,
        warning_count: warnings.length,
        findings: [...blocking, ...warnings],
        requirements: resolved,
        first_pass_probability: firstPassProbability(findings, resolved),
        // Corridor-imposed irreducible time. If this is non-zero, a one-day
        // promise on this lane is false and the quote should say so.
        corridor_floor_hours: resolved.added_floor_hours,
    };
}

module.exports = {
    PRECHECK_VERSION,
    SEVERITY,
    pick,
    labelFor,
    structuralFindings,
    requirementFindings,
    firstPassProbability,
    precheck,
};
