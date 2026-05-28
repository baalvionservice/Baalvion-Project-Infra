'use strict';
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const db = require('../models');
const { indexJob, removeJob, ensureIndex } = require('../service/searchService');

// JSON-LD schema.org/JobPosting builder
function buildJobJsonLd(job) {
    const posting = {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        identifier: { '@type': 'PropertyValue', name: 'Baalvion TalentOS', value: job.id },
        datePosted: job.published_at || job.created_at,
        validThrough: job.closes_at || undefined,
        employmentType: mapEmploymentType(job.job_type),
        hiringOrganization: {
            '@type': 'Organization',
            name: job.org_id,
        },
        jobLocation: job.remote_allowed
            ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'IN' } }
            : { '@type': 'Place', address: job.location || '' },
        baseSalary: job.salary_min && job.salary_max ? {
            '@type': 'MonetaryAmount',
            currency: job.salary_currency || 'INR',
            value: {
                '@type': 'QuantitativeValue',
                minValue: job.salary_min,
                maxValue: job.salary_max,
                unitText: 'YEAR',
            },
        } : undefined,
        skills: job.skills?.map(s => s.name).join(', ') || undefined,
        experienceRequirements: job.experience_level,
    };

    // Remove undefined fields
    Object.keys(posting).forEach(k => posting[k] === undefined && delete posting[k]);
    return posting;
}

function mapEmploymentType(t) {
    const map = {
        full_time: 'FULL_TIME', part_time: 'PART_TIME',
        contract: 'CONTRACTOR', internship: 'INTERN',
        freelance: 'CONTRACTOR',
    };
    return map[t] || 'FULL_TIME';
}

const indexingWorker = new Worker(
    'jobs-seo-indexing',
    async (job) => {
        const { jobId, action } = job.data;

        if (action === 'delete') {
            await removeJob(jobId);
            console.log(`[IndexingWorker] Removed job ${jobId} from search index`);
            return { jobId, action: 'deleted' };
        }

        const jobListing = await db.JobListing.findByPk(jobId, {
            include: [{ model: db.Skill, as: 'skills', through: { attributes: [] } }],
        });

        if (!jobListing) {
            console.warn(`[IndexingWorker] Job ${jobId} not found — skipping index`);
            return { jobId, skipped: true };
        }

        const jsonLd = buildJobJsonLd(jobListing.toJSON());

        // Store JSON-LD on the job record for SSR injection
        await db.JobListing.update(
            { seo_json_ld: jsonLd },
            { where: { id: jobId } }
        );

        // Push to Elasticsearch (non-blocking)
        await indexJob(jobId);

        console.log(`[IndexingWorker] Indexed job ${jobId}: "${jobListing.title}"`);
        return { jobId, action: 'indexed', title: jobListing.title };
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

indexingWorker.on('failed', (job, err) => {
    console.error(`[IndexingWorker] Job ${job?.id} failed:`, err.message);
});

module.exports = indexingWorker;
