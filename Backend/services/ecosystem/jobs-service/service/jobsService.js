const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

let _queues;
function getQueues() {
    if (!_queues) { try { _queues = require('../queues'); } catch { _queues = null; } }
    return _queues;
}
// Fire-and-forget — never throws, never blocks the response
const enqueue = (fn) => { try { fn(); } catch {} };

// ─── Helpers ────────────────────────────────────────────────────────────────

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

const buildPaginatedResult = (rows, count, page, limit) => ({
    items: rows,
    pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
    },
});

// ─── Jobs ────────────────────────────────────────────────────────────────────

const listJobs = async ({ orgId, status, job_type, experience_level, remote_allowed, search, page, limit }) => {
    const where = {};
    if (orgId) where.org_id = orgId;
    if (status) where.status = status;
    if (job_type) where.job_type = job_type;
    if (experience_level) where.experience_level = experience_level;
    if (remote_allowed !== undefined) where.remote_allowed = remote_allowed === 'true' || remote_allowed === true;
    if (search) where.title = { [Op.iLike]: `%${search}%` };

    const { rows, count } = await db.JobListing.findAndCountAll({
        where,
        include: [{ model: db.Skill, as: 'skills', through: { attributes: [] } }],
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getJobById = async (id) => {
    const job = await db.JobListing.findByPk(id, {
        include: [{ model: db.Skill, as: 'skills', through: { attributes: [] } }],
    });
    if (!job) throw new AppError('NOT_FOUND', 'Job listing not found', 404);
    return job;
};

const createJob = async (orgId, userId, data) => {
    const { skill_ids, ...jobData } = data;

    const job = await db.JobListing.create({
        ...jobData,
        org_id: orgId,
        created_by: userId,
    });

    if (skill_ids && skill_ids.length > 0) {
        const skills = await db.Skill.findAll({ where: { id: { [Op.in]: skill_ids } } });
        await job.setSkills(skills);
    }

    return getJobById(job.id);
};

const updateJob = async (id, orgId, data) => {
    const job = await db.JobListing.findOne({ where: { id, org_id: orgId } });
    if (!job) throw new AppError('NOT_FOUND', 'Job listing not found', 404);

    const { skill_ids, ...jobData } = data;
    await job.update(jobData);

    if (skill_ids !== undefined) {
        const skills = await db.Skill.findAll({ where: { id: { [Op.in]: skill_ids } } });
        await job.setSkills(skills);
    }

    return getJobById(job.id);
};

const deleteJob = async (id, orgId) => {
    const job = await db.JobListing.findOne({ where: { id, org_id: orgId } });
    if (!job) throw new AppError('NOT_FOUND', 'Job listing not found', 404);
    await job.destroy();
    return { deleted: true };
};

const publishJob = async (id, orgId) => {
    const job = await db.JobListing.findOne({ where: { id, org_id: orgId } });
    if (!job) throw new AppError('NOT_FOUND', 'Job listing not found', 404);
    if (job.status === 'published') throw new AppError('CONFLICT', 'Job is already published', 409);
    await job.update({ status: 'published', published_at: new Date() });
    const result = await getJobById(job.id);
    enqueue(() => getQueues()?.enqueueIndexing(job.id, 'upsert'));
    return result;
};

const closeJob = async (id, orgId) => {
    const job = await db.JobListing.findOne({ where: { id, org_id: orgId } });
    if (!job) throw new AppError('NOT_FOUND', 'Job listing not found', 404);
    if (job.status === 'closed') throw new AppError('CONFLICT', 'Job is already closed', 409);
    await job.update({ status: 'closed' });
    return getJobById(job.id);
};

const listJobApplications = async (jobId, orgId, { page, limit }) => {
    const job = await db.JobListing.findOne({ where: { id: jobId, org_id: orgId } });
    if (!job) throw new AppError('NOT_FOUND', 'Job listing not found', 404);

    const { rows, count } = await db.Application.findAndCountAll({
        where: { job_id: jobId, org_id: orgId },
        include: [{ model: db.Candidate, as: 'candidate' }],
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

// ─── Applications ────────────────────────────────────────────────────────────

const listApplications = async ({ orgId, status, job_id, candidate_id, page, limit }) => {
    const where = { org_id: orgId };
    if (status) where.status = status;
    if (job_id) where.job_id = job_id;
    if (candidate_id) where.candidate_id = candidate_id;

    const { rows, count } = await db.Application.findAndCountAll({
        where,
        include: [
            { model: db.JobListing, as: 'job', attributes: ['id', 'title', 'location', 'job_type'] },
            { model: db.Candidate, as: 'candidate', attributes: ['id', 'full_name', 'email', 'phone'] },
        ],
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getApplicationById = async (id, orgId) => {
    const app = await db.Application.findOne({
        where: { id, org_id: orgId },
        include: [
            { model: db.JobListing, as: 'job' },
            { model: db.Candidate, as: 'candidate' },
            { model: db.Interview, as: 'interviews' },
        ],
    });
    if (!app) throw new AppError('NOT_FOUND', 'Application not found', 404);
    return app;
};

const createApplication = async (orgId, data) => {
    const { candidate_id, email, full_name, phone, ...appData } = data;

    // Verify job exists
    const job = await db.JobListing.findByPk(appData.job_id);
    if (!job) throw new AppError('NOT_FOUND', 'Job listing not found', 404);
    if (job.status !== 'published') throw new AppError('VALIDATION_ERROR', 'Cannot apply to a non-published job', 422);

    let candidateId = candidate_id;

    if (!candidateId) {
        // Find or create candidate by email
        let [candidate] = await db.Candidate.findOrCreate({
            where: { email },
            defaults: { email, full_name, phone, org_id: orgId },
        });
        candidateId = candidate.id;
    }

    // Check duplicate application
    const existing = await db.Application.findOne({
        where: { job_id: appData.job_id, candidate_id: candidateId },
    });
    if (existing) throw new AppError('CONFLICT', 'Candidate has already applied to this job', 409);

    const application = await db.Application.create({
        ...appData,
        candidate_id: candidateId,
        org_id: orgId,
    });

    // Increment applications count
    await job.increment('applications_count');

    const created = await getApplicationById(application.id, orgId);
    const cand = created.candidate;

    enqueue(() => {
        const q = getQueues();
        if (!q) return;
        // Email to candidate
        if (cand?.email) {
            q.enqueueEmail('application.submitted', {
                to: cand.email,
                data: { candidateName: cand.full_name || cand.email, jobTitle: job.title, companyName: job.org_id },
            });
        }
        // Auto-score and parse resume
        q.enqueueScoring(application.id, job.id, application.candidate_id);
        if (appData.resume_url) q.enqueueResumeParse(application.id, appData.resume_url);
    });

    return created;
};

const updateApplication = async (id, orgId, data) => {
    const app = await db.Application.findOne({ where: { id, org_id: orgId } });
    if (!app) throw new AppError('NOT_FOUND', 'Application not found', 404);

    // Set timestamps based on status transitions
    const updates = { ...data };
    if (data.status === 'offer' && !app.offered_salary && !data.offered_salary) {
        // allow
    }
    if (data.status === 'hired') updates.hired_at = new Date();

    await app.update(updates);
    const updated = await getApplicationById(app.id, orgId);

    if (data.status && data.status !== app.status) {
        enqueue(() => {
            const q = getQueues();
            const cand = updated.candidate;
            if (!q || !cand?.email) return;
            q.enqueueEmail('application.status_changed', {
                to: cand.email,
                data: {
                    candidateName: cand.full_name || cand.email,
                    jobTitle: updated.job?.title || '',
                    status: data.status,
                    notes: data.notes,
                },
            });
        });
    }

    return updated;
};

const moveApplicationStage = async (id, orgId, stage) => {
    const app = await db.Application.findOne({ where: { id, org_id: orgId } });
    if (!app) throw new AppError('NOT_FOUND', 'Application not found', 404);
    const validStages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
    if (!validStages.includes(stage)) throw new AppError('VALIDATION_ERROR', 'Invalid stage', 422);
    await app.update({ status: stage });
    return getApplicationById(app.id, orgId);
};

// ─── Candidates ───────────────────────────────────────────────────────────────

const listCandidates = async ({ orgId, status, source, search, page, limit }) => {
    const where = { org_id: orgId };
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
        where[Op.or] = [
            { full_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
        ];
    }

    const { rows, count } = await db.Candidate.findAndCountAll({
        where,
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getCandidateById = async (id, orgId) => {
    const candidate = await db.Candidate.findOne({
        where: { id, org_id: orgId },
        include: [
            {
                model: db.Application,
                as: 'applications',
                include: [{ model: db.JobListing, as: 'job', attributes: ['id', 'title'] }],
            },
        ],
    });
    if (!candidate) throw new AppError('NOT_FOUND', 'Candidate not found', 404);
    return candidate;
};

const createCandidate = async (orgId, data) => {
    const existing = await db.Candidate.findOne({ where: { email: data.email, org_id: orgId } });
    if (existing) throw new AppError('CONFLICT', 'Candidate with this email already exists in your org', 409);

    return db.Candidate.create({ ...data, org_id: orgId });
};

const updateCandidate = async (id, orgId, data) => {
    const candidate = await db.Candidate.findOne({ where: { id, org_id: orgId } });
    if (!candidate) throw new AppError('NOT_FOUND', 'Candidate not found', 404);
    await candidate.update(data);
    return getCandidateById(candidate.id, orgId);
};

// ─── Interviews ───────────────────────────────────────────────────────────────

const listInterviews = async ({ orgId, status, application_id, interviewer_id, page, limit }) => {
    const where = { org_id: orgId };
    if (status) where.status = status;
    if (application_id) where.application_id = application_id;
    if (interviewer_id) where.interviewer_id = interviewer_id;

    const { rows, count } = await db.Interview.findAndCountAll({
        where,
        include: [
            {
                model: db.Application,
                as: 'application',
                include: [
                    { model: db.Candidate, as: 'candidate', attributes: ['id', 'full_name', 'email'] },
                    { model: db.JobListing, as: 'job', attributes: ['id', 'title'] },
                ],
            },
        ],
        ...paginate(page, limit),
        order: [['scheduled_at', 'ASC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getInterviewById = async (id, orgId) => {
    const interview = await db.Interview.findOne({
        where: { id, org_id: orgId },
        include: [
            {
                model: db.Application,
                as: 'application',
                include: [
                    { model: db.Candidate, as: 'candidate' },
                    { model: db.JobListing, as: 'job' },
                ],
            },
        ],
    });
    if (!interview) throw new AppError('NOT_FOUND', 'Interview not found', 404);
    return interview;
};

const scheduleInterview = async (orgId, data) => {
    // Verify application belongs to org
    const application = await db.Application.findOne({
        where: { id: data.application_id, org_id: orgId },
    });
    if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);

    const interview = await db.Interview.create({ ...data, org_id: orgId });
    const created = await getInterviewById(interview.id, orgId);

    enqueue(() => {
        const q = getQueues();
        const cand = created.application?.candidate;
        const job  = created.application?.job;
        if (!q || !cand?.email) return;
        q.enqueueEmail('interview.scheduled', {
            to: cand.email,
            data: {
                candidateName: cand.full_name || cand.email,
                jobTitle: job?.title || '',
                scheduledAt: interview.scheduled_at,
                meetingUrl: interview.meeting_url,
            },
        });
    });

    return created;
};

const updateInterview = async (id, orgId, data) => {
    const interview = await db.Interview.findOne({ where: { id, org_id: orgId } });
    if (!interview) throw new AppError('NOT_FOUND', 'Interview not found', 404);
    await interview.update(data);
    return getInterviewById(interview.id, orgId);
};

const cancelInterview = async (id, orgId) => {
    const interview = await db.Interview.findOne({ where: { id, org_id: orgId } });
    if (!interview) throw new AppError('NOT_FOUND', 'Interview not found', 404);
    if (interview.status === 'cancelled') throw new AppError('CONFLICT', 'Interview is already cancelled', 409);
    await interview.update({ status: 'cancelled' });
    return getInterviewById(interview.id, orgId);
};

const submitInterviewFeedback = async (id, orgId, data) => {
    const interview = await db.Interview.findOne({ where: { id, org_id: orgId } });
    if (!interview) throw new AppError('NOT_FOUND', 'Interview not found', 404);
    if (interview.status !== 'completed' && interview.status !== 'scheduled') {
        throw new AppError('VALIDATION_ERROR', 'Cannot submit feedback for a cancelled or no-show interview', 422);
    }
    await interview.update({ ...data, status: 'completed' });
    return getInterviewById(interview.id, orgId);
};

// ─── Analytics ───────────────────────────────────────────────────────────────

const getHiringAnalytics = async (orgId) => {
    const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];

    const [stageCounts, activeJobs, totalCandidates] = await Promise.all([
        db.Application.findAll({
            where: { org_id: orgId },
            attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            group: ['status'],
            raw: true,
        }),
        db.JobListing.count({ where: { org_id: orgId, status: 'published' } }),
        db.Candidate.count({ where: { org_id: orgId } }),
    ]);

    const funnelMap = {};
    for (const stage of stages) funnelMap[stage] = 0;
    for (const row of stageCounts) funnelMap[row.status] = Number(row.count);

    const totalApplications = Object.values(funnelMap).reduce((a, b) => a + b, 0);
    const conversionRate = totalApplications > 0
        ? ((funnelMap.hired / totalApplications) * 100).toFixed(2)
        : 0;

    return {
        funnel: funnelMap,
        totalApplications,
        activeJobs,
        totalCandidates,
        conversionRate: Number(conversionRate),
    };
};

// ─── Skills ───────────────────────────────────────────────────────────────────

const listSkills = async ({ category, search } = {}) => {
    const where = {};
    if (category) where.category = category;
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    return db.Skill.findAll({ where, order: [['name', 'ASC']] });
};

module.exports = {
    listJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    publishJob,
    closeJob,
    listJobApplications,
    listApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    moveApplicationStage,
    listCandidates,
    getCandidateById,
    createCandidate,
    updateCandidate,
    listInterviews,
    getInterviewById,
    scheduleInterview,
    updateInterview,
    cancelInterview,
    submitInterviewFeedback,
    getHiringAnalytics,
    listSkills,
};
