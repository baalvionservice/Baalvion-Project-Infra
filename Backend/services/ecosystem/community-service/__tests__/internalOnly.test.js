'use strict';
const { internalOnly, FORWARDING_HEADERS } = require('../middleware/internalOnly');

const call = (headers) => {
    let status = null; let body = null; let passed = false;
    const res = { status(c) { status = c; return this; }, json(b) { body = b; return this; } };
    internalOnly({ headers }, res, () => { passed = true; });
    return { status, body, passed };
};

describe('internal-only routes', () => {
    it('lets a direct service-to-service call through', () => {
        expect(call({ 'x-internal-secret': 's', host: 'community:3064' }).passed).toBe(true);
    });

    it.each(FORWARDING_HEADERS)('answers 404 when %s shows the request came through a proxy or edge', (h) => {
        const r = call({ [h]: '1.2.3.4' });
        expect(r.passed).toBe(false);
        expect(r.status).toBe(404);
        expect(r.body.error.code).toBe('NOT_FOUND');
    });
});
