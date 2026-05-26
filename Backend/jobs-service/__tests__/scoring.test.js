'use strict';

// Unit tests for the candidate scoring logic
// These tests run without a real DB or Redis connection

jest.mock('../models', () => ({
    JobListing: { findByPk: jest.fn() },
    Application: { findByPk: jest.fn(), update: jest.fn() },
    Candidate: { findOne: jest.fn() },
    Skill: {},
}));

jest.mock('../config/redis', () => {
    const EventEmitter = require('events');
    const mock = new EventEmitter();
    mock.maxRetriesPerRequest = null;
    return mock;
});

jest.mock('bullmq', () => ({
    Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
    })),
}));

// ── Scoring logic extracted for unit testing ─────────────────────────────────

const WEIGHTS = { skill_match: 40, experience_match: 25, location_match: 10, completeness: 15, speed_bonus: 10 };

function scoreSkillMatch(jobSkills, candSkills) {
    const lowerJob  = jobSkills.map(s => s.toLowerCase());
    const lowerCand = candSkills.map(s => s.toLowerCase());
    if (lowerJob.length === 0) return WEIGHTS.skill_match / 2;
    const matched = lowerCand.filter(s => lowerJob.includes(s)).length;
    return Math.round((matched / lowerJob.length) * WEIGHTS.skill_match);
}

function scoreExperience(requiredLevel, yearsOfExperience) {
    const expMap = { entry: 1, entry_level: 1, mid: 3, mid_level: 3, senior: 6, senior_level: 6, lead: 8, executive: 12 };
    const required = expMap[requiredLevel] || 0;
    if (required === 0) return WEIGHTS.experience_match;
    const actual = yearsOfExperience || 0;
    if (actual >= required) return WEIGHTS.experience_match;
    return Math.round((actual / required) * WEIGHTS.experience_match);
}

function scoreLocation(remoteAllowed, jobLocation, candidateLocation) {
    if (remoteAllowed) return WEIGHTS.location_match;
    if (!jobLocation || !candidateLocation) return 0;
    return jobLocation.toLowerCase().includes(candidateLocation.toLowerCase())
        ? WEIGHTS.location_match : 0;
}

function scoreCompleteness(candidate) {
    const fields = ['headline', 'bio', 'resume_url', 'years_of_experience', 'location'];
    const completed = fields.filter(f => candidate[f]).length;
    return Math.round((completed / fields.length) * WEIGHTS.completeness);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Candidate Scoring — Skill Match', () => {
    test('perfect match returns full points', () => {
        const score = scoreSkillMatch(['React', 'Node'], ['react', 'node', 'typescript']);
        expect(score).toBe(WEIGHTS.skill_match); // 40
    });

    test('zero match returns 0 points', () => {
        const score = scoreSkillMatch(['Java', 'Spring'], ['react', 'node']);
        expect(score).toBe(0);
    });

    test('partial match returns proportional points', () => {
        const score = scoreSkillMatch(['React', 'Node', 'TypeScript'], ['react']);
        expect(score).toBe(Math.round((1 / 3) * WEIGHTS.skill_match));
    });

    test('no required skills returns neutral (half points)', () => {
        const score = scoreSkillMatch([], ['react', 'node']);
        expect(score).toBe(WEIGHTS.skill_match / 2); // 20
    });

    test('case insensitive matching', () => {
        const score = scoreSkillMatch(['REACT', 'NODE'], ['React', 'Node']);
        expect(score).toBe(WEIGHTS.skill_match); // 40
    });
});

describe('Candidate Scoring — Experience Match', () => {
    test('meets requirement returns full points', () => {
        expect(scoreExperience('mid', 5)).toBe(WEIGHTS.experience_match); // 25
    });

    test('exceeds requirement returns full points', () => {
        expect(scoreExperience('entry', 10)).toBe(WEIGHTS.experience_match);
    });

    test('zero experience for mid-level returns proportional', () => {
        const score = scoreExperience('mid', 0);
        expect(score).toBe(0);
    });

    test('no requirement returns full points', () => {
        expect(scoreExperience(undefined, 0)).toBe(WEIGHTS.experience_match);
    });

    test('partial experience returns proportional points', () => {
        const score = scoreExperience('senior', 3); // 3 of 6 required
        expect(score).toBe(Math.round((3 / 6) * WEIGHTS.experience_match));
    });
});

describe('Candidate Scoring — Location Match', () => {
    test('remote job always matches', () => {
        expect(scoreLocation(true, 'Bangalore', 'Mumbai')).toBe(WEIGHTS.location_match);
    });

    test('matching city returns full points', () => {
        expect(scoreLocation(false, 'Bangalore, India', 'Bangalore')).toBe(WEIGHTS.location_match);
    });

    test('non-matching city returns 0', () => {
        expect(scoreLocation(false, 'Mumbai', 'Delhi')).toBe(0);
    });

    test('missing candidate location returns 0', () => {
        expect(scoreLocation(false, 'Mumbai', '')).toBe(0);
    });
});

describe('Candidate Scoring — Profile Completeness', () => {
    test('fully complete profile returns full points', () => {
        const score = scoreCompleteness({
            headline: 'Engineer', bio: 'Hi', resume_url: 'http://x', years_of_experience: 5, location: 'Delhi',
        });
        expect(score).toBe(WEIGHTS.completeness); // 15
    });

    test('empty profile returns 0', () => {
        expect(scoreCompleteness({})).toBe(0);
    });

    test('partial profile returns proportional', () => {
        const score = scoreCompleteness({ headline: 'Eng', resume_url: 'http://x' }); // 2/5
        expect(score).toBe(Math.round((2 / 5) * WEIGHTS.completeness));
    });
});
