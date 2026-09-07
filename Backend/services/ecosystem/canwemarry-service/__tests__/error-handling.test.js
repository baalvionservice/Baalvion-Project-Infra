'use strict';
/**
 * What the error handler says, and what it refuses to say.
 *
 * Two properties matter here. A database CONSTRAINT firing is not a fault — it is the
 * constraint doing its job when two requests race — and reporting it as a 500 tells somebody
 * who double-clicked a button that the server broke. And whatever the failure, nothing from
 * the driver may reach the response: constraint names carry table and column names, and this
 * service's tables are the most sensitive thing on the platform.
 */
const { errorHandler, notFoundHandler } = require('../middleware/errorMiddleware');
const { AppError, forbidden } = require('../utils/errors');

/** A minimal res that records what sendError produced. */
function fakeRes() {
    const res = {
        headersSent: false,
        statusCode: null,
        payload: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.payload = body; return this; },
        set() { return this; },
    };
    return res;
}

const fakeReq = () => ({ method: 'POST', originalUrl: '/v1/cases', requestId: 'req-1', headers: {} });

/** Run the handler and return { status, body }. */
function handle(error) {
    const req = fakeReq();
    const res = fakeRes();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(error, req, res, () => {});
    const logged = spy.mock.calls.map((c) => JSON.stringify(c)).join(' ');
    spy.mockRestore();
    return { status: res.statusCode, body: res.payload, logged };
}

const named = (name, message) => Object.assign(new Error(message), { name });

describe('a constraint violation is a race, not a fault', () => {
    test('a unique violation is 409, not 500', () => {
        // Measured before this existed: three concurrent support offers produced one row and
        // two 500s. The row count was right; the status was a lie about what happened.
        const { status, body } = handle(named('SequelizeUniqueConstraintError', 'duplicate key value violates unique constraint "case_supporters_case_id_user_id_key"'));
        expect(status).toBe(409);
        expect(body.error.code).toBe('CONFLICT');
    });

    test('the reply explains it in the caller’s terms', () => {
        const { body } = handle(named('SequelizeUniqueConstraintError', 'duplicate key'));
        expect(body.error.message).toMatch(/already been done/i);
    });

    test('a foreign-key violation is 409 too', () => {
        // The referenced row went away between the read and the write.
        const { status } = handle(named('SequelizeForeignKeyConstraintError', 'violates foreign key constraint'));
        expect(status).toBe(409);
    });

    test('neither reply quotes the constraint, the table or the column', () => {
        const violation = named('SequelizeUniqueConstraintError',
            'duplicate key value violates unique constraint "case_supporters_case_id_user_id_key"');
        const { body } = handle(violation);
        const json = JSON.stringify(body);
        expect(json).not.toMatch(/case_supporters|unique constraint|duplicate key|_key/);
    });
});

describe('an unexpected failure says nothing about itself', () => {
    test('it is a 500 with a fixed message', () => {
        const { status, body } = handle(named('SequelizeDatabaseError', 'column "secret_column" does not exist'));
        expect(status).toBe(500);
        expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    test('the driver message is logged, not returned', () => {
        const { body, logged } = handle(named('SequelizeDatabaseError', 'column "secret_column" does not exist'));
        expect(JSON.stringify(body)).not.toContain('secret_column');
        // Withheld from the caller, kept for whoever has to debug it.
        expect(logged).toContain('secret_column');
    });

    test('no stack trace, SQL or filesystem path reaches the caller', () => {
        const err = named('TypeError', "Cannot read properties of undefined (reading 'id')");
        err.stack = 'TypeError: x\n    at /Users/someone/app/service/caseService.js:12:3';
        const { body } = handle(err);
        const json = JSON.stringify(body);
        expect(json).not.toMatch(/\/Users\/|node_modules|\.js:\d+/);
        expect(json).not.toMatch(/SELECT|INSERT|UPDATE .* SET/i);
    });
});

describe('the caller’s own mistakes are reported as theirs', () => {
    test('unparseable JSON is 400, not 500', () => {
        const syntax = new SyntaxError('Unexpected token n in JSON at position 1');
        syntax.body = '{not json';
        const { status, body } = handle(syntax);
        expect(status).toBe(400);
        expect(body.error.code).toBe('BAD_REQUEST');
    });

    test('the reply does not echo the body it could not parse', () => {
        const syntax = new SyntaxError('Unexpected token');
        syntax.body = '{"password":"hunter2"';
        const { body } = handle(syntax);
        expect(JSON.stringify(body)).not.toContain('hunter2');
    });

    test('an expected AppError passes through with its own status', () => {
        const { status, body } = handle(forbidden('Confirm your email address before doing that.'));
        expect(status).toBe(403);
        expect(body.error.message).toMatch(/confirm your email/i);
    });

    test('an unknown route is a 404', () => {
        let captured = null;
        notFoundHandler(fakeReq(), fakeRes(), (e) => { captured = e; });
        expect(captured).toBeInstanceOf(AppError);
        expect(captured.statusCode).toBe(404);
    });
});

describe('a response already sent is left alone', () => {
    test('the handler delegates rather than writing twice', () => {
        const res = fakeRes();
        res.headersSent = true;
        let passedOn = null;
        errorHandler(new Error('late failure'), fakeReq(), res, (e) => { passedOn = e; });
        expect(passedOn).toBeInstanceOf(Error);
        expect(res.statusCode).toBeNull();
    });
});
