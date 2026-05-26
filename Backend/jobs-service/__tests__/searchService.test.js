'use strict';

// Unit tests for search service (DB fallback path — no ES needed)

jest.mock('../config/elasticsearch', () => ({
    client: null,
    ENABLED: false,
    JOB_INDEX: 'baalvion-jobs',
}));

jest.mock('../models', () => {
    const mockFindAndCountAll = jest.fn();
    return {
        JobListing: {
            findAndCountAll: mockFindAndCountAll,
            findAll: jest.fn().mockResolvedValue([]),
        },
        Skill: {},
        sequelize: { fn: jest.fn(), col: jest.fn() },
    };
});

const db = require('../models');
const { searchJobs } = require('../service/searchService');

describe('searchJobs — DB fallback', () => {
    beforeEach(() => {
        db.JobListing.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    });

    afterEach(() => jest.clearAllMocks());

    test('calls findAndCountAll with status=published', async () => {
        await searchJobs({ page: 1, limit: 10 });
        expect(db.JobListing.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: 'published' }),
            })
        );
    });

    test('returns pagination metadata', async () => {
        db.JobListing.findAndCountAll.mockResolvedValue({ rows: [], count: 42 });
        const result = await searchJobs({ page: 2, limit: 10 });
        expect(result.pagination).toMatchObject({ total: 42, page: 2, limit: 10, totalPages: 5 });
        expect(result.source).toBe('database');
    });

    test('passes full-text q to where clause using Op.or', async () => {
        const { Op } = require('sequelize');
        await searchJobs({ q: 'react developer', page: 1, limit: 10 });
        const callArgs = db.JobListing.findAndCountAll.mock.calls[0][0];
        // When q is provided, where should have Op.or (iLike search)
        expect(callArgs.where[Op.or]).toBeDefined();
    });

    test('passes remote_allowed filter', async () => {
        await searchJobs({ remote_allowed: 'true', page: 1, limit: 10 });
        const callArgs = db.JobListing.findAndCountAll.mock.calls[0][0];
        expect(callArgs.where.remote_allowed).toBe(true);
    });

    test('enforces limit cap at 100', async () => {
        await searchJobs({ page: 1, limit: 9999 });
        const callArgs = db.JobListing.findAndCountAll.mock.calls[0][0];
        expect(callArgs.limit).toBeLessThanOrEqual(100);
    });
});
