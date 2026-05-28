'use strict';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/appConfig.js', () => ({
    default: { env: 'test' },
}));

import { csrfTokenMiddleware, csrfProtect } from '../../middleware/csrf.js';

function makeReq({ method = 'POST', cookies = {}, headers = {} } = {}) {
    return { method, cookies, headers };
}

function makeRes() {
    const cookies = {};
    return {
        cookie: (name, value) => { cookies[name] = value; },
        cookies,
        _cookies: cookies,
    };
}

describe('csrfTokenMiddleware', () => {
    it('sets a CSRF cookie when none exists', () => {
        const req  = makeReq({ cookies: {} });
        const res  = makeRes();
        const next = vi.fn();
        csrfTokenMiddleware(req, res, next);
        expect(next).toHaveBeenCalledOnce();
        expect(req.csrfToken).toBeTruthy();
    });

    it('reuses an existing CSRF cookie', () => {
        const req  = makeReq({ cookies: { 'baalvion-csrf': 'existing-token' } });
        const res  = makeRes();
        const next = vi.fn();
        csrfTokenMiddleware(req, res, next);
        expect(req.csrfToken).toBe('existing-token');
    });
});

describe('csrfProtect', () => {
    it('passes GET requests without header check', () => {
        const req  = makeReq({ method: 'GET' });
        const next = vi.fn();
        csrfProtect(req, {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('passes POST requests that carry a Bearer token', () => {
        const req  = makeReq({ method: 'POST', headers: { authorization: 'Bearer abc.def.ghi' } });
        const next = vi.fn();
        csrfProtect(req, {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('passes POST when cookie and header match', () => {
        const req = makeReq({
            method:  'POST',
            cookies: { 'baalvion-csrf': 'tok123' },
            headers: { 'x-csrf-token': 'tok123' },
        });
        const next = vi.fn();
        csrfProtect(req, {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('rejects POST when tokens do not match', () => {
        const req = makeReq({
            method:  'POST',
            cookies: { 'baalvion-csrf': 'tok123' },
            headers: { 'x-csrf-token': 'wrong' },
        });
        const next = vi.fn();
        csrfProtect(req, {}, next);
        const arg = next.mock.calls[0][0];
        expect(arg).toMatchObject({ code: 'CSRF_FAILED', statusCode: 403 });
    });

    it('rejects POST with missing header', () => {
        const req = makeReq({
            method:  'POST',
            cookies: { 'baalvion-csrf': 'tok123' },
            headers: {},
        });
        const next = vi.fn();
        csrfProtect(req, {}, next);
        const arg = next.mock.calls[0][0];
        expect(arg.code).toBe('CSRF_FAILED');
    });
});
