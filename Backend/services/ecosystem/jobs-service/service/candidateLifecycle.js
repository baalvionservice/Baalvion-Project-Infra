'use strict';
/**
 * Things that must happen to a person when their application moves, wherever the move
 * came from — a recruiter dragging a card in the ATS, or the candidate accepting an
 * offer from their own dashboard. Both paths call in here so a hire always issues an
 * Employee ID and always sends the same mail.
 */
const db = require('../models');
const { ensureEmployeeCode } = require('../utils/referenceCodes');

let _queues;
function queues() {
    if (_queues === undefined) { try { _queues = require('../queues'); } catch { _queues = null; } }
    return _queues;
}

/** Fire-and-forget mail: a queue outage must never fail the request that triggered it. */
function sendMail(type, to, data) {
    if (!to) return;
    const q = queues();
    if (!q) return;
    Promise.resolve(q.enqueueEmail(type, { to, data })).catch((err) =>
        console.error(`[lifecycle] failed to enqueue ${type}:`, err.message));
}

/** The employer's display name — emails must never leak a raw org UUID. */
async function companyNameFor(orgId) {
    if (!orgId) return 'Baalvion';
    try {
        const org = await db.Organization.findByPk(orgId, { attributes: ['name'] });
        return (org && org.name) || 'Baalvion';
    } catch { return 'Baalvion'; }
}

/**
 * Issues the Employee ID the first time an application reaches `hired`. A candidate
 * hired twice keeps their original number — ensureEmployeeCode no-ops once set.
 */
async function issueEmployeeCodeOnHire(application) {
    if (!application || application.status !== 'hired') return null;
    const candidate = application.candidate || await db.Candidate.findByPk(application.candidate_id);
    if (!candidate) return null;
    const hadCode = !!candidate.employee_code;
    await ensureEmployeeCode(db.sequelize, candidate);
    if (!hadCode && candidate.employee_code) {
        const job = application.job || await db.JobListing.findByPk(application.job_id, { attributes: ['title', 'org_id'] });
        sendMail('employee.id_issued', candidate.email, {
            candidateName: candidate.full_name || candidate.email,
            jobTitle: job ? job.title : 'your role',
            companyName: await companyNameFor(application.org_id),
            employeeCode: candidate.employee_code,
            referenceCode: candidate.reference_code,
        });
    }
    return candidate;
}

module.exports = { issueEmployeeCodeOnHire, sendMail, companyNameFor };
