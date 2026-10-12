'use strict';
/**
 * Automatic evidence for a company verification.
 *
 * The aim is that nobody types what a system can fetch, and nobody waits for a
 * person to confirm what a public register already shows. When a company is
 * submitted we look it up in the public registers and screen it against the
 * sanctions lists, and attach what we found to the record so a reviewer (or the
 * customer's own screen) sees it immediately.
 *
 * Three rules this module keeps:
 *   1. EVIDENCE, NOT AN APPROVAL. Nothing here changes a record's status. A match
 *      supports a case; it never closes one.
 *   2. A MISS PROVES NOTHING. GLEIF only knows entities that hold an LEI and
 *      Germany's VIES withholds names. "Not found" is recorded as no evidence,
 *      never as "does not exist" and never as a reason to reject.
 *   3. AN OUTAGE IS NOT A VERDICT. A register that cannot answer is recorded as
 *      unavailable. It never counts for or against the applicant.
 *
 * Only the sanctions result can raise an `attention` signal on its own authority;
 * the rest raise it only on a clear contradiction (a registered number that belongs
 * to a differently named company, an inactive entity, an invalid VAT number).
 */

const gleif = require('./registries/gleif');
const vies = require('./registries/vies');

// ── Name comparison ──────────────────────────────────────────────────────────

const LEGAL_FORMS = new Set(['ltd', 'limited', 'llc', 'inc', 'incorporated', 'corp', 'corporation', 'co', 'company', 'plc', 'gmbh', 'ag', 'sa', 'sarl', 'srl', 'spa', 'bv', 'nv', 'as', 'ab', 'oy', 'pte', 'pvt', 'private', 'llp', 'lp', 'fze', 'fzc', 'fzco', 'the', 'and', 'of', 'kg', 'aps', 'a', 's']);

// Letters that Unicode normalisation does NOT split into base + accent, so they would
// otherwise never match their plain spelling ("Møller" vs "Moller", "Mærsk" vs "Maersk").
const LETTER_FOLD = { 'ø': 'o', 'æ': 'ae', 'œ': 'oe', 'ß': 'ss', 'ł': 'l', 'đ': 'd', 'ð': 'd', 'þ': 'th', 'ı': 'i' };
const foldLetters = (s) => s.replace(/[øæœßłđðþı]/g, (c) => LETTER_FOLD[c]);

function nameTokens(name) {
    const all = foldLetters(String(name || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase())
        .replace(/&/g, ' and ')
        .split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const core = all.filter((t) => !LEGAL_FORMS.has(t));
    return core.length ? core : all;
}

/** 'exact' same words; 'close' one name's words all appear in the other's; otherwise 'different'. */
function compareNames(a, b) {
    const x = nameTokens(a);
    const y = nameTokens(b);
    if (!x.length || !y.length) return 'different';
    const sx = new Set(x);
    const sy = new Set(y);
    const inter = [...sx].filter((t) => sy.has(t)).length;
    if (inter === sx.size && inter === sy.size) return 'exact';
    if (inter === Math.min(sx.size, sy.size) && Math.min(sx.size, sy.size) >= 1) return 'close';
    return 'different';
}

const digits = (s) => String(s || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

// ── Checks ───────────────────────────────────────────────────────────────────

async function registryCheck({ legalName, registrationNumber, country }, deps) {
    let found = null;
    let by = null;
    let error = null;

    if (registrationNumber) {
        const r = await deps.gleif.searchByRegistration(registrationNumber, { country });
        if (!r.ok) error = r.error;
        else if (r.entities.length) { found = r.entities; by = 'registration_number'; }
    }
    if (!found && legalName) {
        const r = await deps.gleif.searchByName(legalName, { country });
        if (!r.ok) error = error || r.error;
        else if (r.entities.length) { found = r.entities; by = 'name'; }
    }

    if (!found) {
        return error
            ? { source: 'GLEIF', status: 'unavailable', error }
            : { source: 'GLEIF', status: 'not_found' };
    }

    // Prefer the candidate that matches the number, then the one whose name matches best.
    const rank = { exact: 2, close: 1, different: 0 };
    const scored = found.map((e) => ({
        e,
        number: !!registrationNumber && digits(e.registered_as) === digits(registrationNumber),
        name: compareNames(legalName, e.legal_name),
    })).sort((p, q) => (Number(q.number) - Number(p.number)) || (rank[q.name] - rank[p.name]));
    const best = scored[0];

    // A name-only hit that does not resemble the submitted name is somebody else.
    if (by === 'name' && best.name === 'different') return { source: 'GLEIF', status: 'not_found' };

    const e = best.e;
    return {
        source: 'GLEIF',
        status: 'found',
        matched_by: by,
        registration_number_match: best.number,
        name_match: best.name,
        entity: {
            lei: e.lei,
            legal_name: e.legal_name,
            registered_as: e.registered_as,
            country: e.country,
            entity_status: e.entity_status,
            registration_status: e.registration_status,
            legal_address: e.legal_address,
        },
        active: e.entity_status === 'ACTIVE',
    };
}

async function vatCheck({ vatNumber, registrationNumber }, deps) {
    const candidate = vatNumber || (vies.splitVat(registrationNumber) ? registrationNumber : null);
    if (!candidate) return { source: 'VIES', status: 'not_applicable' };
    const r = await deps.vies.validate(candidate);
    if (r.applicable === false) return { source: 'VIES', status: 'not_applicable' };
    if (!r.ok) return { source: 'VIES', status: 'unavailable', error: r.error };
    return { source: 'VIES', status: r.valid ? 'valid' : 'invalid', vat_number: r.vat_number, registered_name: r.name, registered_address: r.address };
}

async function sanctionsCheck({ legalName, country }, deps) {
    if (!legalName) return { source: 'sanctions', status: 'not_checked' };
    try {
        const report = await deps.screen({ parties: [{ name: legalName, role: 'applicant', country: country || null }] }, { runHooks: false });
        return {
            source: 'sanctions',
            status: 'checked',
            decision: report.decision,                    // clear | review | block
            violation_count: report.violation_count,
            matches: (report.violations || []).slice(0, 5).map((v) => ({
                code: v.code,
                matched: v.details && v.details.matched,
                list: v.details && v.details.list_source,
                quality: v.details && v.details.match_quality,
            })),
        };
    } catch (err) {
        return { source: 'sanctions', status: 'unavailable', error: err.message };
    }
}

// ── Summary ──────────────────────────────────────────────────────────────────

function summarise({ registry, vat, sanctions }) {
    const signals = [];
    const add = (code, level, text) => signals.push({ code, level, text });

    if (registry.status === 'found') {
        if (!registry.active) add('REGISTRY_INACTIVE', 'attention', `The register lists this company as ${registry.entity.entity_status || 'not active'}`);
        else if (registry.matched_by === 'registration_number' && registry.name_match === 'different') add('REGISTRY_NAME_MISMATCH', 'attention', `Registration number belongs to "${registry.entity.legal_name}", not the submitted name`);
        else if (registry.registration_number_match || registry.name_match === 'exact') add('REGISTRY_CONFIRMED', 'positive', `Found in the public register (LEI ${registry.entity.lei}) as "${registry.entity.legal_name}"`);
        else add('REGISTRY_PROBABLE', 'info', `Possible match in the public register: "${registry.entity.legal_name}"`);
    } else if (registry.status === 'unavailable') add('REGISTRY_UNAVAILABLE', 'info', 'The public register could not be reached');
    else add('REGISTRY_NO_EVIDENCE', 'info', 'Not found in the public LEI register (many valid companies are not listed there)');

    if (vat.status === 'valid') add('VAT_VALID', 'positive', `VAT number ${vat.vat_number} is registered`);
    else if (vat.status === 'invalid') add('VAT_INVALID', 'attention', 'The VAT number is not registered with VIES');
    else if (vat.status === 'unavailable') add('VAT_UNAVAILABLE', 'info', 'VIES could not be reached');

    if (sanctions.status === 'checked') {
        if (sanctions.decision === 'block') add('SANCTIONS_BLOCK', 'attention', 'Matches a sanctions list');
        else if (sanctions.decision === 'review') add('SANCTIONS_REVIEW', 'attention', 'Possible sanctions match — needs a person to look');
        else add('SANCTIONS_CLEAR', 'positive', 'No match on the sanctions lists screened');
    } else add('SANCTIONS_NOT_CHECKED', 'attention', 'Sanctions screening could not be completed');

    const outcome = signals.some((s) => s.level === 'attention')
        ? 'attention'
        : (signals.some((s) => s.level === 'positive' && s.code !== 'SANCTIONS_CLEAR') ? 'supported' : 'no_evidence');
    return { outcome, signals };
}

/**
 * Whether the instant tier would apply. Enforcement (what the tier may do) is a
 * policy decision kept outside this module; this only reports eligibility on the
 * evidence. Disabled until INSTANT_TIER_MAX_VALUE_USD is set above zero.
 */
function instantTier(summary, sanctions, env = process.env) {
    const cap = Number(env.INSTANT_TIER_MAX_VALUE_USD) || 0;
    if (cap <= 0) return { eligible: false, max_value_usd: 0, reasons: ['instant tier is not enabled'] };
    const reasons = [];
    if (summary.outcome !== 'supported') reasons.push(summary.outcome === 'attention' ? 'a check needs attention' : 'no register confirmed the company');
    if (!(sanctions.status === 'checked' && sanctions.decision === 'clear')) reasons.push('sanctions screening was not clear');
    return { eligible: reasons.length === 0, max_value_usd: cap, reasons };
}

/**
 * @param {{ legalName, registrationNumber, country, vatNumber }} input
 * @param {object} [overrides] injected dependencies (tests)
 */
async function runChecks(input = {}, overrides = {}) {
    const deps = {
        gleif, vies,
        screen: (...a) => require('../compliance/complianceEngine').screen(...a),
        ...overrides,
    };
    const [registry, vat, sanctions] = await Promise.all([
        registryCheck(input, deps),
        vatCheck(input, deps),
        sanctionsCheck(input, deps),
    ]);
    const summary = summarise({ registry, vat, sanctions });
    return {
        checked_at: new Date().toISOString(),
        registry, vat, sanctions,
        summary,
        instant_tier: instantTier(summary, sanctions),
    };
}

/** Run the checks for a stored record and attach the result to its metadata. Never throws. */
async function runAndStore(record, input, overrides) {
    try {
        const evidence = await runChecks(input, overrides);
        await record.update({ metadata: { ...(record.metadata || {}), auto_checks: evidence } });
        return evidence;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[verification] auto-checks failed for company ${record && record.id}: ${err.message}`);
        return null;
    }
}

module.exports = { runChecks, runAndStore, compareNames, nameTokens, summarise, instantTier };
