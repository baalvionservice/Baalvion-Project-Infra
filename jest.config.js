'use strict';
module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/tests/setup.js'],
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    testTimeout: 30000,
    // Open handles (ioredis/bullmq) are expected; tests run serially against
    // the shared dev DB/Redis.
    maxWorkers: 1,
};
