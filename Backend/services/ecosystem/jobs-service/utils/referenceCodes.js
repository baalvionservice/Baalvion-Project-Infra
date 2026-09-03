'use strict';
/**
 * Human-quotable reference codes.
 *
 *   Candidate ID  BAAL-C-2026-001042   issued the moment someone registers or applies
 *   Employee ID   BAAL-E-2026-00108    issued when an application reaches `hired`
 *
 * Both draw from Postgres sequences rather than a MAX()+1 read, so two concurrent
 * applications can't be handed the same number. The year is stamped at issue time and
 * kept forever — the code is an identifier, not a date field.
 */
const PREFIX = process.env.REFERENCE_CODE_PREFIX || 'BAAL';

async function nextFromSequence(sequelize, sequence) {
    const [rows] = await sequelize.query(`SELECT nextval('${sequence}') AS n`);
    return Number(rows[0].n);
}

/** BAAL-C-<year>-<6 digits>. */
async function nextCandidateCode(sequelize) {
    const n = await nextFromSequence(sequelize, 'jobs.candidate_reference_seq');
    return `${PREFIX}-C-${new Date().getFullYear()}-${String(n).padStart(6, '0')}`;
}

/** BAAL-E-<year>-<5 digits>. */
async function nextEmployeeCode(sequelize) {
    const n = await nextFromSequence(sequelize, 'jobs.employee_reference_seq');
    return `${PREFIX}-E-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
}

/**
 * Gives a candidate row a reference code if it doesn't have one. Returns the row.
 * Safe to call on every profile read — it no-ops once the code exists.
 */
async function ensureCandidateCode(sequelize, candidate) {
    if (!candidate || candidate.reference_code) return candidate;
    candidate.reference_code = await nextCandidateCode(sequelize);
    await candidate.save();
    return candidate;
}

/** Issues an employee code on first hire; a re-hire keeps the original number. */
async function ensureEmployeeCode(sequelize, candidate) {
    if (!candidate || candidate.employee_code) return candidate;
    candidate.employee_code = await nextEmployeeCode(sequelize);
    candidate.employee_code_issued_at = new Date();
    await candidate.save();
    return candidate;
}

module.exports = { nextCandidateCode, nextEmployeeCode, ensureCandidateCode, ensureEmployeeCode };
