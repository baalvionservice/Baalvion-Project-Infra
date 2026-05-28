'use strict';
import { describe, it, expect, vi } from 'vitest';

// Redis unavailable — rateLimiter must be a no-op
vi.mock('../../config/redis.js', () => ({
    default: { getClient: () => null, isAvailable: () => false },
}));

import { createRateLimiter } from '../../middleware/rateLimiter.js';

function makeReq(ip = '127.0.0.1') {
    return { ip, headers: {} };
}

function makeRes() {
    const headers = {};
    return {
        set: (k, v) => { headers[k] = v; },
        headers,
    };
}

describe('createRateLimiter — Redis unavailable (fail-open)', () => {
    it('calls next() without setting headers when Redis is down', async () => {
        const limiter = createRateLimiter({ max: 3, window: 60, prefix: 'test:rl', keyFn: (r) => r.ip });
        const next = vi.fn();
        await limiter(makeReq(), makeRes(), next);
        expect(next).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledWith(); // called with no arguments
    });
});
