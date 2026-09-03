const { Op, literal } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { ensureCandidateCode } = require('../utils/referenceCodes');
const { issueEmployeeCodeOnHire, companyNameFor } = require('./candidateLifecycle');

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

const { resolvePlace, expandPlaceTerms, metroFor } = require('../data/locations');

/**
 * A WHERE fragment matching a location term against everything a job records about
 * where it is. Known places expand to their metro and its suburbs; unknown text is
 * matched literally, so posting in a town nobody has mapped still works.
 */
/**
 * @param {string} term  a town, suburb or metro name
 * @param {boolean} exact  true to match ONLY that place, false to widen to its metro
 */
const locationClause = (term, exact = false) => {
    const place = resolvePlace(term);
    const like = (field, value) => ({ [field]: { [Op.iLike]: `%${value}%` } });

    if (!place) {
        // A town the gazetteer doesn't know. Match the free text the recruiter typed —
        // posting somewhere unmapped still has to be findable by name.
        return { [Op.or]: [like('city', term), like('location', term), like('region', term)] };
    }

    // A state contains places rather than being one. Match the job's own region text and
    // every metro inside it, so "jobs in Odisha" reaches the role posted in Barbil.
    if (place.type === 'state') {
        const clauses = [like('region', place.name)];
        for (const slug of place.metroSlugs || []) {
            clauses.push({ metro_slug: slug });
        }
        return { [Op.or]: clauses };
    }

    const metro = metroFor(place);
    const clauses = [{ place_slug: place.slug }];

    // Exact mode is for a location page's own list — "roles in Virar" must mean Virar,
    // not the whole of Mumbai, or the page's heading is a lie and its ItemList markup
    // claims jobs that aren't there.
    if (exact) {
        if (place.type === 'metro') clauses.push({ metro_slug: place.slug });
        return { [Op.or]: clauses };
    }

    // Otherwise a suburb search also surfaces the rest of its metro: someone in
    // Nalasopara can reach the Virar and Andheri roles, which is the commute they'd
    // actually make. Searching the metro itself covers every suburb inside it.
    if (metro) clauses.push({ metro_slug: metro.slug });

    // Older rows predate resolution, so keep matching their text too.
    for (const t of expandPlaceTerms(place)) {
        clauses.push(like('city', t), like('location', t));
    }

    return { [Op.or]: clauses };
};

// Words people add that carry no meaning for matching a title: "frontend developer
// JOBS in virar" is still a search for a frontend developer.
const FILLER = new Set([
    'job', 'jobs', 'vacancy', 'vacancies', 'opening', 'openings', 'role', 'roles',
    'position', 'positions', 'work', 'working', 'hiring', 'career', 'careers',
    'opportunity', 'opportunities', 'near', 'me', 'the', 'a', 'an', 'for', 'and',
    // Prepositions survive when the place after them isn't recognised; without these
    // they become search tokens and every result has to contain the word "in".
    'in', 'at', 'on', 'to', 'of', 'with',
]);

/**
 * Pull the place out of a natural search phrase.
 *
 * Handles "frontend developer in virar" (explicit preposition), "react developer
 * bombay" (place just trailing), and "virar" (place alone). The place is returned
 * separately so it can filter rather than be matched against job titles, where a
 * suburb name would never appear.
 */
const splitRoleAndPlace = (query) => {
    const text = String(query).trim().replace(/\s+/g, ' ');
    if (!text) return { role: '', place: null };

    // "<role> in <place>"
    const prepositional = text.match(/^(.*?)\s+(?:in|at|near|around|jobs in|based in)\s+(.+)$/i);
    if (prepositional && resolvePlace(prepositional[2])) {
        return { role: prepositional[1].trim(), place: prepositional[2].trim() };
    }

    // The whole phrase is a place.
    if (resolvePlace(text)) return { role: '', place: text };

    // A place trailing with no preposition — try the last three words, then two, then one,
    // longest first so "navi mumbai" wins over "mumbai".
    const words = text.split(' ');
    for (let take = Math.min(3, words.length - 1); take >= 1; take--) {
        const tail = words.slice(-take).join(' ');
        if (resolvePlace(tail)) {
            return { role: words.slice(0, -take).join(' ').trim(), place: tail };
        }
    }

    return { role: text, place: null };
};

/**
 * Match one search word against a posting.
 *
 * Short words are matched on a word boundary, not as a substring: "ai" otherwise hits
 * every posting containing "maintain" or "available", and "obs" hits every one
 * containing "jobs". Longer words keep substring matching, so "engineer" still finds
 * "engineering".
 */
const matchToken = (token) => {
    const fields = ['title', 'description', 'requirements'];
    if (token.length <= 3) {
        // POSIX regex with \y word boundaries — ILIKE has no way to express this.
        const pattern = `\\y${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\y`;
        return { [Op.or]: fields.map((f) => ({ [f]: { [Op.iRegexp]: pattern } })) };
    }
    return { [Op.or]: fields.map((f) => ({ [f]: { [Op.iLike]: `%${token}%` } })) };
};

/** Meaningful words from a role phrase, filler removed. */
const roleTokens = (role) =>
    String(role || '')
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/i)
        .filter((w) => w.length > 1 && !FILLER.has(w));

/**
 * Result ordering. `salary` sorts on the top of the band and puts unpaid-band roles
 * last rather than treating a missing figure as zero, which would rank every role
 * without a published salary above the ones that have one.
 */
const sortOrder = (sort) => {
    // Attribute names, not raw SQL. findAndCountAll with an include and a limit wraps
    // the query in a subquery whose output columns are the ATTRIBUTE names, so a literal
    // referring to "created_at" fails to resolve — Sequelize has aliased it to createdAt.
    switch (sort) {
        case 'title':    return [['title', 'ASC']];
        case 'location': return [['city', 'ASC NULLS LAST'], ['title', 'ASC']];
        case 'salary':   return [['salary_max', 'DESC NULLS LAST'], ['createdAt', 'DESC']];
        case 'date':
        default:         return [['published_at', 'DESC NULLS LAST'], ['createdAt', 'DESC']];
    }
};

const listJobs = async ({ orgId, status, job_type, experience_level, remote_allowed, search, page, limit, country_id, department_id, city, region, exactCity, sort }) => {
    const where = {};
    if (orgId) where.org_id = orgId;
    if (status) where.status = status;
    if (job_type) where.job_type = job_type;
    if (experience_level) where.experience_level = experience_level;
    if (country_id) where.country_id = country_id;
    if (department_id) where.department_id = department_id;
    // Town and state are free text, so match them the way a person would type them.
    // A city term is widened through the gazetteer first: "Virar" also matches roles
    // written as "Vasai-Virar" or posted across the Mumbai region, and "Mumbai" matches
    // one posted in Andheri. Unknown places still match on the literal text.
    let searchedPlace = city ? resolvePlace(city) : null;
    if (city) Object.assign(where, locationClause(city, exactCity === 'true' || exactCity === true));
    if (region) where.region = { [Op.iLike]: `%${region}%` };
    if (remote_allowed !== undefined) where.remote_allowed = remote_allowed === 'true' || remote_allowed === true;
    if (search) {
        // People type a role and a place in one box: "frontend developer in virar".
        const { role, place } = splitRoleAndPlace(search);
        const tokens = roleTokens(role);

        // Every meaningful word has to appear somewhere on the posting, in any order —
        // so "frontend developer" also finds "Senior Frontend Engineer" through the
        // description, while "frontend designer" doesn't match a backend role.
        if (tokens.length) {
            const tokenClauses = tokens.map((token) => matchToken(token));
            where[Op.and] = [...(where[Op.and] || []), ...tokenClauses];
        } else if (!place) {
            // Nothing usable at all — fall back to matching the raw phrase anywhere.
            where[Op.or] = [
                { title:    { [Op.iLike]: `%${search}%` } },
                { location: { [Op.iLike]: `%${search}%` } },
                { city:     { [Op.iLike]: `%${search}%` } },
            ];
        }

        // A place in the query is a filter, not another loose match: "developer in virar"
        // must never return a developer role in Chennai.
        if (place) {
            searchedPlace = resolvePlace(place) || searchedPlace;
            where[Op.and] = [...(where[Op.and] || []), locationClause(place)];
        }
    }

    const { rows, count } = await db.JobListing.findAndCountAll({
        where,
        include: [{ model: db.Skill, as: 'skills', through: { attributes: [] } }],
        // distinct: the skills join multiplies rows, so an undistinct count reports
        // (jobs × skills) as the job total and inflates the page count.
        distinct: true,
        ...paginate(page, limit),
        // With a place in the query, roles in that exact town come before the rest of
        // the metro — a Virar search should lead with the Virar job. That precedence
        // holds whatever the chosen sort, because it is about relevance, not order.
        order: [
            ...(searchedPlace ? [[literal(`CASE WHEN "JobListing"."place_slug" = ${db.sequelize.escape(searchedPlace.slug)} THEN 0 ELSE 1 END`), 'ASC']] : []),
            ...sortOrder(sort),
        ],
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

/**
 * "Kochi, Kerala, India" from the parts a recruiter filled in. Only used when they
 * didn't type a location themselves — an explicit one always wins.
 */
const composeLocation = (data, countryName) =>
    [data.city, data.region, countryName].filter(Boolean).join(', ') || null;

const countryNameFor = (countryId) => {
    if (!countryId) return null;
    const country = require('../data/countries').find((c) => c.id === countryId);
    return country ? country.name : null;
};

/**
 * Stamp the gazetteer's answer onto the row. Done on write so filtering is an indexed
 * column lookup rather than a text scan, and so a location page can ask "which roles are
 * in the Mumbai region" without knowing every suburb's name.
 */
const applyResolvedPlace = (jobData) => {
    const place = resolvePlace(jobData.city) || resolvePlace(jobData.region);
    if (!place) {
        // Unknown town: no resolution to record, and the free-text city still works.
        jobData.place_slug = null;
        jobData.metro_slug = null;
        return jobData;
    }
    const metro = metroFor(place);
    jobData.place_slug = place.slug;
    jobData.metro_slug = metro ? metro.slug : place.slug;
    return jobData;
};

const createJob = async (orgId, userId, data) => {
    const { skill_ids, ...jobData } = data;

    applyResolvedPlace(jobData);

    if (!jobData.location) {
        jobData.location = composeLocation(jobData, countryNameFor(jobData.country_id));
    }

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

    // Editing the town has to re-resolve it, or the row keeps pointing at the old metro.
    if (jobData.city !== undefined || jobData.region !== undefined) {
        const reresolved = applyResolvedPlace({
            city: jobData.city ?? job.city,
            region: jobData.region ?? job.region,
        });
        jobData.place_slug = reresolved.place_slug;
        jobData.metro_slug = reresolved.metro_slug;
        if (jobData.city !== undefined) {
            jobData.location = composeLocation(
                { city: jobData.city, region: jobData.region ?? job.region },
                countryNameFor(jobData.country_id ?? job.country_id),
            );
        }
    }

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
        distinct: true,
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
        distinct: true,
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

    // Public applications have no auth context — inherit the job's org so the row is tenant-scoped.
    const effectiveOrgId = orgId || job.org_id;

    let candidateId = candidate_id;

    if (!candidateId) {
        // Find or create candidate by email
        let [candidate] = await db.Candidate.findOrCreate({
            where: { email },
            defaults: { email, full_name, phone, org_id: effectiveOrgId },
        });
        // Applying is often the first time we meet someone — make sure they leave with
        // a Candidate ID, the reference they'll quote in every mail from here on.
        await ensureCandidateCode(db.sequelize, candidate);
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
        org_id: effectiveOrgId,
    });

    // Increment applications count
    await job.increment('applications_count');

    const created = await getApplicationById(application.id, effectiveOrgId);
    const cand = created.candidate;
    const companyName = await companyNameFor(effectiveOrgId);

    enqueue(() => {
        const q = getQueues();
        if (!q) return;
        // Email to candidate
        if (cand?.email) {
            q.enqueueEmail('application.submitted', {
                to: cand.email,
                data: {
                    candidateName: cand.full_name || cand.email,
                    jobTitle: job.title,
                    companyName,
                    referenceCode: cand.reference_code,
                    applicationId: String(application.id),
                },
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

    const previousStatus = app.status;
    await app.update(updates);
    const updated = await getApplicationById(app.id, orgId);

    if (data.status && data.status !== previousStatus) {
        await issueEmployeeCodeOnHire(updated);
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
                    referenceCode: cand.reference_code,
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
    const previousStatus = app.status;
    await app.update({ status: stage, ...(stage === 'hired' ? { hired_at: new Date() } : {}) });
    const updated = await getApplicationById(app.id, orgId);

    // Dragging a card to Hired is a hire — same Employee ID and same mail as the
    // status endpoint, which is where this used to silently differ.
    if (stage !== previousStatus) {
        await issueEmployeeCodeOnHire(updated);
        enqueue(() => {
            const q = getQueues();
            const cand = updated.candidate;
            if (!q || !cand?.email) return;
            q.enqueueEmail('application.status_changed', {
                to: cand.email,
                data: {
                    candidateName: cand.full_name || cand.email,
                    jobTitle: updated.job?.title || '',
                    status: stage,
                    referenceCode: cand.reference_code,
                },
            });
        });
    }

    return updated;
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
        distinct: true,
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

    const [stageCounts, jobStatusCounts, activeJobs, totalCandidates, appRows, hiredApps] = await Promise.all([
        db.Application.findAll({
            where: { org_id: orgId },
            attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            group: ['status'], raw: true,
        }),
        db.JobListing.findAll({
            where: { org_id: orgId },
            attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            group: ['status'], raw: true,
        }),
        db.JobListing.count({ where: { org_id: orgId, status: 'published' } }),
        db.Candidate.count({ where: { org_id: orgId } }),
        db.Application.findAll({ where: { org_id: orgId }, attributes: ['created_at'], raw: true }),
        db.Application.findAll({
            where: { org_id: orgId, status: 'hired' },
            include: [{ model: db.JobListing, as: 'job', attributes: ['department_id', 'title'] }],
        }),
    ]);

    const funnelMap = {};
    for (const stage of stages) funnelMap[stage] = 0;
    for (const row of stageCounts) funnelMap[row.status] = Number(row.count);

    const totalApplications = Object.values(funnelMap).reduce((a, b) => a + b, 0);
    const conversionRate = totalApplications > 0 ? Number(((funnelMap.hired / totalApplications) * 100).toFixed(2)) : 0;

    // statusDistribution — job statuses with chart colors
    const colors = { draft: 'hsl(var(--chart-1))', published: 'hsl(var(--chart-2))', closed: 'hsl(var(--chart-3))', archived: 'hsl(var(--chart-4))' };
    const statusDistribution = jobStatusCounts.map((s) => ({ name: s.status, value: Number(s.count), fill: colors[s.status] || 'hsl(var(--chart-5))' }));

    // applicationsTrend — last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ key: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }), y: d.getFullYear(), m: d.getMonth(), applications: 0 });
    }
    for (const a of appRows) {
        const dt = new Date(a.created_at);
        const bucket = months.find((mm) => mm.y === dt.getFullYear() && mm.m === dt.getMonth());
        if (bucket) bucket.applications += 1;
    }
    const applicationsTrend = months.map(({ key, applications }) => ({ date: key, applications }));

    // departmentHiring — hires grouped by department/title
    const deptMap = {};
    const DEPT_LABEL = { dept_eng_it: 'Engineering / IT', general: 'General' };
    for (const h of hiredApps) {
        const dep = h.job?.department_id || 'general';
        const label = DEPT_LABEL[dep] || dep;
        deptMap[label] = (deptMap[label] || 0) + 1;
    }
    const departmentHiring = Object.entries(deptMap).map(([department, hires]) => ({ department, hires }));

    const kpis = {
        totalActiveJobs: { value: activeJobs, change: 0 },
        totalApplications: { value: totalApplications, change: 0 },
        avgTimeToFill: { value: 0, change: 0 },
        overallConversionRate: { value: conversionRate, change: 0 },
    };

    return {
        funnel: funnelMap,
        totalApplications,
        activeJobs,
        totalCandidates,
        conversionRate,
        kpis,
        statusDistribution,
        applicationsTrend,
        departmentHiring,
        placementSuccessRate: conversionRate,
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
