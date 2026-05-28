'use strict';
const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const db = require('../models');

// Scoring rubric weights (must sum to 100)
const WEIGHTS = {
    skill_match:        40,
    experience_match:   25,
    location_match:     10,
    completeness:       15,
    speed_bonus:        10,
};

async function scoreApplication(applicationId, jobId, candidateId) {
    const [application, job, candidate] = await Promise.all([
        db.Application.findByPk(applicationId),
        db.JobListing.findByPk(jobId, {
            include: [{ model: db.Skill, as: 'skills', through: { attributes: [] } }],
        }),
        db.Candidate.findOne({ where: { user_id: candidateId } }),
    ]);

    if (!application || !job) throw new Error('Application or job not found');

    const scores = {};
    let totalScore = 0;

    // 1. Skill match (40 pts)
    const jobSkills  = (job.skills || []).map(s => s.name.toLowerCase());
    const candSkills = Array.isArray(candidate?.skills) ? candidate.skills.map(s => s.toLowerCase()) : [];
    if (jobSkills.length > 0) {
        const matched = candSkills.filter(s => jobSkills.includes(s)).length;
        scores.skill_match = Math.round((matched / jobSkills.length) * WEIGHTS.skill_match);
    } else {
        scores.skill_match = WEIGHTS.skill_match / 2; // neutral if no required skills
    }
    totalScore += scores.skill_match;

    // 2. Experience match (25 pts)
    const expMap = { entry_level: 1, mid_level: 3, senior_level: 6, lead: 8, executive: 12 };
    const required = expMap[job.experience_level] || 0;
    const candExp  = candidate?.years_of_experience || 0;
    if (required === 0) {
        scores.experience_match = WEIGHTS.experience_match;
    } else if (candExp >= required) {
        scores.experience_match = WEIGHTS.experience_match;
    } else {
        scores.experience_match = Math.round((candExp / required) * WEIGHTS.experience_match);
    }
    totalScore += scores.experience_match;

    // 3. Location match (10 pts)
    if (job.remote_allowed) {
        scores.location_match = WEIGHTS.location_match;
    } else if (job.location && candidate?.location) {
        scores.location_match = job.location.toLowerCase().includes(candidate.location.toLowerCase())
            ? WEIGHTS.location_match
            : 0;
    } else {
        scores.location_match = 0;
    }
    totalScore += scores.location_match;

    // 4. Profile completeness (15 pts)
    let completed = 0;
    const fields = ['headline', 'bio', 'resume_url', 'years_of_experience', 'location'];
    fields.forEach(f => { if (candidate?.[f]) completed++; });
    scores.completeness = Math.round((completed / fields.length) * WEIGHTS.completeness);
    totalScore += scores.completeness;

    // 5. Speed bonus — applied early get max, later get 0 (10 pts over 14 days)
    if (application.created_at) {
        const jobCreated = job.published_at ? new Date(job.published_at) : new Date(job.created_at);
        const appCreated = new Date(application.created_at);
        const daysAfterPost = (appCreated - jobCreated) / (1000 * 60 * 60 * 24);
        scores.speed_bonus = daysAfterPost <= 1  ? WEIGHTS.speed_bonus
            : daysAfterPost <= 7  ? Math.round(WEIGHTS.speed_bonus * 0.5)
            : daysAfterPost <= 14 ? Math.round(WEIGHTS.speed_bonus * 0.25)
            : 0;
    } else {
        scores.speed_bonus = 0;
    }
    totalScore += scores.speed_bonus;

    // Persist score back to application
    await db.Application.update(
        { score: Math.min(totalScore, 100), score_breakdown: scores },
        { where: { id: applicationId } }
    );

    return { applicationId, score: totalScore, breakdown: scores };
}

const scoringWorker = new Worker(
    'jobs-candidate-scoring',
    async (job) => {
        const { applicationId, jobId, candidateId } = job.data;
        const result = await scoreApplication(applicationId, jobId, candidateId);
        console.log(`[ScoringWorker] app=${applicationId} scored ${result.score}/100`);
        return result;
    },
    {
        connection: redisConnection,
        concurrency: 10,
    }
);

scoringWorker.on('failed', (job, err) => {
    console.error(`[ScoringWorker] Job ${job?.id} failed:`, err.message);
});

module.exports = scoringWorker;
