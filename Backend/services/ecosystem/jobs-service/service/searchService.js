'use strict';
const { client: es, ENABLED, JOB_INDEX } = require('../config/elasticsearch');
const { Op } = require('sequelize');
const db = require('../models');

// ── Index mapping (run once on bootstrap) ────────────────────────────────────

async function ensureIndex() {
    if (!ENABLED || !es) return;
    try {
        const exists = await es.indices.exists({ index: JOB_INDEX });
        if (!exists) {
            await es.indices.create({
                index: JOB_INDEX,
                mappings: {
                    properties: {
                        id:               { type: 'keyword' },
                        org_id:           { type: 'keyword' },
                        title:            { type: 'text', analyzer: 'english', fields: { keyword: { type: 'keyword' } } },
                        description:      { type: 'text', analyzer: 'english' },
                        requirements:     { type: 'text', analyzer: 'english' },
                        location:         { type: 'text', fields: { keyword: { type: 'keyword' } } },
                        job_type:         { type: 'keyword' },
                        experience_level: { type: 'keyword' },
                        remote_allowed:   { type: 'boolean' },
                        status:           { type: 'keyword' },
                        salary_min:       { type: 'long' },
                        salary_max:       { type: 'long' },
                        currency:         { type: 'keyword' },
                        skills:           { type: 'keyword' },
                        published_at:     { type: 'date' },
                        deadline:         { type: 'date' },
                        created_at:       { type: 'date' },
                        seo_json_ld:      { type: 'object', enabled: false },
                    },
                },
            });
            console.log(`[Elasticsearch] Created index: ${JOB_INDEX}`);
        }
    } catch (err) {
        console.error('[Elasticsearch] ensureIndex failed:', err.message);
    }
}

// ── Index a single job ────────────────────────────────────────────────────────

async function indexJob(jobId) {
    if (!ENABLED || !es) return;
    try {
        const job = await db.JobListing.findByPk(jobId, {
            include: [{ model: db.Skill, as: 'skills', through: { attributes: [] } }],
        });
        if (!job) return;

        const doc = {
            id:               String(job.id),
            org_id:           job.org_id,
            title:            job.title,
            description:      job.description,
            requirements:     job.requirements,
            location:         job.location,
            job_type:         job.job_type,
            experience_level: job.experience_level,
            remote_allowed:   job.remote_allowed,
            status:           job.status,
            salary_min:       job.salary_min,
            salary_max:       job.salary_max,
            currency:         job.currency,
            skills:           (job.skills || []).map(s => s.name),
            published_at:     job.published_at,
            deadline:         job.deadline,
            created_at:       job.created_at,
            seo_json_ld:      job.seo_json_ld,
        };

        await es.index({ index: JOB_INDEX, id: String(job.id), document: doc });
    } catch (err) {
        console.error(`[Elasticsearch] indexJob(${jobId}) failed:`, err.message);
    }
}

// ── Remove a job from the index ───────────────────────────────────────────────

async function removeJob(jobId) {
    if (!ENABLED || !es) return;
    try {
        await es.delete({ index: JOB_INDEX, id: String(jobId) });
    } catch (err) {
        if (err.statusCode !== 404) console.error(`[Elasticsearch] removeJob(${jobId}) failed:`, err.message);
    }
}

// ── Full-text search ──────────────────────────────────────────────────────────

async function searchJobs({ q, location, job_type, experience_level, remote_allowed, salary_min, salary_max, skills, page = 1, limit = 20 }) {
    // Fall back to DB search if ES not available
    if (!ENABLED || !es) return dbFallbackSearch({ q, location, job_type, experience_level, remote_allowed, page, limit });

    const from = (Math.max(1, Number(page)) - 1) * Number(limit);
    const must  = [];
    const filter = [{ term: { status: 'published' } }];

    if (q) {
        must.push({
            multi_match: {
                query: q,
                fields: ['title^3', 'description', 'requirements', 'skills^2'],
                type: 'best_fields',
                fuzziness: 'AUTO',
            },
        });
    }

    if (location)         filter.push({ match: { location } });
    if (job_type)         filter.push({ term: { job_type } });
    if (experience_level) filter.push({ term: { experience_level } });
    if (remote_allowed !== undefined) filter.push({ term: { remote_allowed: remote_allowed === 'true' || remote_allowed === true } });
    if (skills) {
        const skillList = Array.isArray(skills) ? skills : [skills];
        filter.push({ terms: { skills: skillList } });
    }
    if (salary_min || salary_max) {
        filter.push({ range: { salary_max: {
            ...(salary_min ? { gte: Number(salary_min) } : {}),
            ...(salary_max ? { lte: Number(salary_max) } : {}),
        }}});
    }

    const body = {
        query: {
            bool: {
                must:   must.length  ? must  : [{ match_all: {} }],
                filter,
            },
        },
        sort: [
            { _score: 'desc' },
            { published_at: { order: 'desc', missing: '_last' } },
        ],
        from,
        size: Number(limit),
        highlight: {
            fields: { title: {}, description: { fragment_size: 200, number_of_fragments: 1 } },
        },
    };

    const result = await es.search({ index: JOB_INDEX, body });
    const hits = result.hits?.hits || [];
    const total = typeof result.hits?.total === 'object' ? result.hits.total.value : (result.hits?.total || 0);

    return {
        items: hits.map(h => ({
            ...h._source,
            _score: h._score,
            _highlights: h.highlight,
        })),
        pagination: {
            total,
            page:       Number(page),
            limit:      Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
        source: 'elasticsearch',
    };
}

// ── DB fallback for when ES is not configured ─────────────────────────────────

async function dbFallbackSearch({ q, location, job_type, experience_level, remote_allowed, page = 1, limit = 20 }) {
    const where = { status: 'published' };
    if (q)                where[Op.or] = [{ title: { [Op.iLike]: `%${q}%` } }, { description: { [Op.iLike]: `%${q}%` } }];
    if (location)         where.location = { [Op.iLike]: `%${location}%` };
    if (job_type)         where.job_type = job_type;
    if (experience_level) where.experience_level = experience_level;
    if (remote_allowed !== undefined) where.remote_allowed = remote_allowed === 'true' || remote_allowed === true;

    const { rows, count } = await db.JobListing.findAndCountAll({
        where,
        include: [{ model: db.Skill, as: 'skills', through: { attributes: [] } }],
        limit:  Math.min(Number(limit), 100),
        offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
        order:  [['created_at', 'DESC']],
    });

    return {
        items: rows,
        pagination: {
            total:      count,
            page:       Number(page),
            limit:      Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
        },
        source: 'database',
    };
}

// ── Bulk reindex (admin utility) ──────────────────────────────────────────────

async function reindexAll() {
    if (!ENABLED || !es) return { indexed: 0, source: 'none' };
    await ensureIndex();

    const jobs = await db.JobListing.findAll({
        where: { status: 'published' },
        include: [{ model: db.Skill, as: 'skills', through: { attributes: [] } }],
    });

    const operations = jobs.flatMap(job => [
        { index: { _index: JOB_INDEX, _id: String(job.id) } },
        {
            id: String(job.id), org_id: job.org_id, title: job.title,
            description: job.description, requirements: job.requirements,
            location: job.location, job_type: job.job_type,
            experience_level: job.experience_level, remote_allowed: job.remote_allowed,
            status: job.status, salary_min: job.salary_min, salary_max: job.salary_max,
            currency: job.currency, skills: (job.skills || []).map(s => s.name),
            published_at: job.published_at, deadline: job.deadline, created_at: job.created_at,
        },
    ]);

    if (operations.length > 0) {
        const { errors } = await es.bulk({ operations });
        if (errors) console.warn('[Elasticsearch] Some bulk index errors');
    }

    console.log(`[Elasticsearch] Reindexed ${jobs.length} jobs`);
    return { indexed: jobs.length, source: 'elasticsearch' };
}

module.exports = { ensureIndex, indexJob, removeJob, searchJobs, reindexAll };
