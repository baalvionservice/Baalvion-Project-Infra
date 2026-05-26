'use strict';
const { Worker } = require('bullmq');
const https = require('https');
const http  = require('http');
const redisConnection = require('../config/redis');
const db = require('../models');

// Known skill keywords for extraction (extend as needed)
const SKILL_KEYWORDS = [
    // Languages
    'javascript','typescript','python','java','c++','c#','go','rust','ruby','php','swift','kotlin',
    // Frontend
    'react','vue','angular','nextjs','svelte','html','css','tailwind','sass',
    // Backend
    'node','express','django','fastapi','spring','nestjs','laravel','rails',
    // DB
    'postgresql','mysql','mongodb','redis','elasticsearch','sqlite','dynamodb',
    // DevOps
    'docker','kubernetes','aws','gcp','azure','terraform','jenkins','github actions','ci/cd',
    // Tools
    'git','graphql','rest','grpc','kafka','rabbitmq','nginx',
    // Soft
    'leadership','communication','agile','scrum',
];

function extractSkillsFromText(text) {
    const lower = text.toLowerCase();
    return SKILL_KEYWORDS.filter(skill => lower.includes(skill));
}

async function fetchTextFromUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, { timeout: 10000 }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8', 0, 50000)));
            res.on('error', reject);
        }).on('error', reject).on('timeout', () => reject(new Error('Timeout fetching resume')));
    });
}

function extractTextSnippets(rawText) {
    // Basic cleaning: strip HTML tags, normalize whitespace
    return rawText
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const resumeWorker = new Worker(
    'jobs-resume-parsing',
    async (job) => {
        const { applicationId, resumeUrl } = job.data;

        if (!resumeUrl) {
            console.warn(`[ResumeWorker] No resume URL for application ${applicationId}`);
            return { applicationId, skipped: true };
        }

        let skills = [];
        let parseMethod = 'keyword';

        try {
            const rawText = await fetchTextFromUrl(resumeUrl);
            const cleanText = extractTextSnippets(rawText);
            skills = extractSkillsFromText(cleanText);
            console.log(`[ResumeWorker] app=${applicationId} extracted ${skills.length} skills from resume`);
        } catch (err) {
            // If we can't fetch the resume (private URL, auth required), skip gracefully
            console.warn(`[ResumeWorker] Could not fetch resume for app ${applicationId}: ${err.message}`);
            return { applicationId, skipped: true, reason: err.message };
        }

        // Update the application with extracted metadata
        await db.Application.update(
            {
                resume_skills: skills,
                resume_parsed_at: new Date(),
            },
            { where: { id: applicationId } }
        );

        return { applicationId, skills, parseMethod, count: skills.length };
    },
    {
        connection: redisConnection,
        concurrency: 3,
        limiter: { max: 20, duration: 60_000 },
    }
);

resumeWorker.on('failed', (job, err) => {
    console.error(`[ResumeWorker] Job ${job?.id} failed:`, err.message);
});

resumeWorker.on('completed', (job, result) => {
    if (!result?.skipped) {
        console.log(`[ResumeWorker] Parsed resume for app=${result?.applicationId}, skills: ${result?.count}`);
    }
});

module.exports = resumeWorker;
