'use strict';
/**
 * Onfido KYC adapter unit tests — NO live network. A fake `http` (the shared
 * httpClient.request signature) returns REAL Onfido applicant / workflow_run /
 * check JSON shapes. Asserts request construction (Idempotency-Key, auth,
 * endpoints), the full Onfido->KYC_STATUS status map, fail-closed timeout
 * behavior, and webhook signature verification.
 */
const crypto = require('crypto');
const assert = require('assert');

const { KYC_STATUS } = require('./contract');
const { createRealKycProvider } = require('./realAdapter');
const {
    mapWorkflowStatus,
    mapCheckResult,
    REGION_BASE,
} = require('./providers/onfido');
const { IntegrationTimeoutError } = require('../_shared/httpClient');
const { verifyOnfidoWebhook, parseOnfidoEvent } = require('./webhook');

const TOKEN = 'api_test.token_value';
const WORKFLOW_ID = 'wf_123';

/** Build a fake http that records calls and returns scripted responses. */
function fakeHttp(responder) {
    const calls = [];
    const http = async (opts) => {
        calls.push(opts);
        const r = responder(opts, calls.length);
        if (r instanceof Error) throw r;
        return { status: 200, headers: new Map(), json: r, text: JSON.stringify(r) };
    };
    return { http, calls };
}

function subject(idempotencyKey, over = {}) {
    return { idempotencyKey, type: 'BUSINESS', legalName: 'Acme Ltd', country: 'GB', ...over };
}

function workflowAdapter(http, envOver = {}) {
    return createRealKycProvider({
        http,
        env: { ONFIDO_API_TOKEN: TOKEN, ONFIDO_WORKFLOW_ID: WORKFLOW_ID, ...envOver },
    });
}

describe('Onfido KYC adapter — startVerification (workflow path)', () => {
    test('creates applicant then workflow_run, both with Idempotency-Key + auth, returns run id as PENDING', async () => {
        const { http, calls } = fakeHttp((opts, n) => {
            if (n === 1) return { id: 'applicant_abc', first_name: 'Acme', last_name: 'Ltd' };
            return { id: 'run_xyz', status: 'awaiting_input', applicant_id: 'applicant_abc' };
        });
        const a = workflowAdapter(http);
        const res = await a.startVerification(subject('kyc-1'));

        assert.strictEqual(calls.length, 2);
        // call 1: applicant
        assert.strictEqual(calls[0].method, 'POST');
        assert.ok(calls[0].url.endsWith('/applicants'));
        assert.strictEqual(calls[0].headers['Idempotency-Key'], 'kyc-1');
        assert.strictEqual(calls[0].headers.Authorization, `Token token=${TOKEN}`);
        // call 2: workflow_run with workflow_id + applicant_id
        assert.ok(calls[1].url.endsWith('/workflow_runs'));
        assert.strictEqual(calls[1].headers['Idempotency-Key'], 'kyc-1');
        const body = JSON.parse(calls[1].body);
        assert.strictEqual(body.workflow_id, WORKFLOW_ID);
        assert.strictEqual(body.applicant_id, 'applicant_abc');
        // result
        assert.strictEqual(res.id, 'run_xyz');
        assert.strictEqual(res.idempotencyKey, 'kyc-1');
        assert.strictEqual(res.status, KYC_STATUS.PENDING);
        assert.strictEqual(res.providerRef, 'applicant_abc');
    });

    test('uses the configured region base host', async () => {
        const { http, calls } = fakeHttp((opts, n) =>
            n === 1 ? { id: 'app_1' } : { id: 'run_1', status: 'processing' });
        const a = workflowAdapter(http, { ONFIDO_REGION: 'us' });
        await a.startVerification(subject('kyc-region'));
        assert.ok(calls[0].url.startsWith(REGION_BASE.us), calls[0].url);
    });

    test('throws if applicant create returns no id (no fake success)', async () => {
        const { http } = fakeHttp(() => ({ error: { type: 'validation_error' } }));
        const a = workflowAdapter(http);
        await assert.rejects(() => a.startVerification(subject('kyc-bad')), /no id/);
    });

    test('FAIL-CLOSED: a timeout on start propagates IntegrationTimeoutError, never APPROVED', async () => {
        const { http } = fakeHttp(() => new IntegrationTimeoutError('timeout after 8000ms calling api.eu.onfido.com'));
        const a = workflowAdapter(http);
        await assert.rejects(
            () => a.startVerification(subject('kyc-timeout')),
            (err) => err instanceof IntegrationTimeoutError,
        );
    });
});

describe('Onfido KYC adapter — getResult (workflow path)', () => {
    const cases = [
        ['awaiting_input', KYC_STATUS.PENDING],
        ['processing', KYC_STATUS.PENDING],
        ['approved', KYC_STATUS.APPROVED],
        ['declined', KYC_STATUS.REJECTED],
        ['review', KYC_STATUS.REVIEW],
        ['manual', KYC_STATUS.REVIEW],
        ['abandoned', KYC_STATUS.RESUBMIT],
        ['error', KYC_STATUS.REVIEW],
        ['totally_unknown_state', KYC_STATUS.REVIEW], // fail-closed default
    ];

    for (const [onfidoStatus, expected] of cases) {
        test(`maps workflow_run status '${onfidoStatus}' -> ${expected}`, async () => {
            const { http, calls } = fakeHttp(() => ({
                id: 'run_xyz',
                status: onfidoStatus,
                applicant_id: 'app_1',
                ...(onfidoStatus === 'declined'
                    ? { output: { reasons: ['document_unreadable'] } }
                    : {}),
            }));
            const a = workflowAdapter(http);
            const res = await a.getResult('run_xyz', { idempotencyKey: 'kyc-1' });
            assert.ok(calls[0].url.endsWith('/workflow_runs/run_xyz'));
            assert.strictEqual(calls[0].method, 'GET');
            assert.strictEqual(res.status, expected);
            if (onfidoStatus === 'declined') {
                assert.deepStrictEqual(res.reasons, ['document_unreadable']);
            }
        });
    }
});

describe('Onfido KYC adapter — getResult path-id encoding (path-traversal safety)', () => {
    test('an id with path-special chars is percent-encoded in the request URL', async () => {
        const { http, calls } = fakeHttp(() => ({ id: 'run_xyz', status: 'processing', applicant_id: 'app_1' }));
        const a = workflowAdapter(http);
        await a.getResult('../x', { idempotencyKey: 'k' });
        assert.ok(calls[0].url.endsWith('/workflow_runs/..%2Fx'), calls[0].url);
        assert.ok(!calls[0].url.includes('/workflow_runs/../x'), 'raw ../ must not survive');

        const a2 = workflowAdapter(http);
        await a2.getResult('a/b');
        assert.ok(calls[1].url.endsWith('/workflow_runs/a%2Fb'), calls[1].url);
    });
});

describe('Onfido KYC adapter — legacy /checks path (no workflow id)', () => {
    function legacyAdapter(http) {
        return createRealKycProvider({ http, env: { ONFIDO_API_TOKEN: TOKEN } });
    }

    test('startVerification creates applicant then a check, returns check id', async () => {
        const { http, calls } = fakeHttp((opts, n) =>
            n === 1 ? { id: 'app_l1' } : { id: 'check_l1', status: 'in_progress', result: null });
        const a = legacyAdapter(http);
        const res = await a.startVerification(subject('kyc-legacy'));
        assert.ok(calls[1].url.endsWith('/checks'));
        assert.strictEqual(res.id, 'check_l1');
        assert.strictEqual(res.status, KYC_STATUS.PENDING);
    });

    test('check result clear -> APPROVED, consider -> REVIEW, in_progress -> PENDING', async () => {
        for (const [result, status, expected] of [
            ['clear', 'complete', KYC_STATUS.APPROVED],
            ['consider', 'complete', KYC_STATUS.REVIEW],
            [null, 'in_progress', KYC_STATUS.PENDING],
        ]) {
            const { http } = fakeHttp(() => ({ id: 'check_l1', status, result }));
            const a = legacyAdapter(http);
            const res = await a.getResult('check_l1', { legacy: true });
            assert.strictEqual(res.status, expected, `${result}/${status}`);
        }
    });
});

describe('Onfido KYC adapter — not configured (fail-closed)', () => {
    const { IntegrationRequiredError } = require('../IntegrationRequiredError');

    test('IS_PRODUCTION_SAFE is true and name is onfido even when unconfigured', () => {
        const a = createRealKycProvider({ env: {} });
        assert.strictEqual(a.IS_PRODUCTION_SAFE, true);
        assert.strictEqual(a.name, 'onfido');
    });

    test('startVerification throws IntegrationRequiredError without ONFIDO_API_TOKEN', async () => {
        const a = createRealKycProvider({ env: {} });
        await assert.rejects(
            () => a.startVerification(subject('kyc-x')),
            (err) => err instanceof IntegrationRequiredError && err.domain === 'kyc',
        );
    });

    test('getResult throws IntegrationRequiredError without ONFIDO_API_TOKEN', async () => {
        const a = createRealKycProvider({ env: {} });
        await assert.rejects(
            () => a.getResult('run_xyz'),
            (err) => err instanceof IntegrationRequiredError,
        );
    });
});

describe('Onfido status mappers (pure)', () => {
    test('mapWorkflowStatus is fail-closed for unknown', () => {
        assert.strictEqual(mapWorkflowStatus('approved'), KYC_STATUS.APPROVED);
        assert.strictEqual(mapWorkflowStatus('declined'), KYC_STATUS.REJECTED);
        assert.strictEqual(mapWorkflowStatus(undefined), KYC_STATUS.REVIEW);
        assert.strictEqual(mapWorkflowStatus('weird'), KYC_STATUS.REVIEW);
    });
    test('mapCheckResult maps clear/consider and in_progress', () => {
        assert.strictEqual(mapCheckResult('clear', 'complete'), KYC_STATUS.APPROVED);
        assert.strictEqual(mapCheckResult('consider', 'complete'), KYC_STATUS.REVIEW);
        assert.strictEqual(mapCheckResult(null, 'in_progress'), KYC_STATUS.PENDING);
    });
});

describe('Onfido webhook — X-SHA2-Signature verification', () => {
    const WEBHOOK_TOKEN = 'whtok_secret';
    const rawBody = JSON.stringify({
        payload: {
            resource_type: 'workflow_run',
            action: 'workflow_run.completed',
            object: { id: 'run_xyz', status: 'approved', completed_at_iso8601: '2026-06-09T00:00:00Z' },
        },
    });
    const goodSig = crypto.createHmac('sha256', WEBHOOK_TOKEN).update(rawBody).digest('hex');

    test('verifies a valid signature (true)', () => {
        assert.strictEqual(
            verifyOnfidoWebhook({ rawBody, signatureHeader: goodSig, token: WEBHOOK_TOKEN }),
            true,
        );
    });

    test('rejects a tampered signature (false)', () => {
        assert.strictEqual(
            verifyOnfidoWebhook({ rawBody, signatureHeader: goodSig.replace(/.$/, '0'), token: WEBHOOK_TOKEN }),
            false,
        );
    });

    test('rejects a tampered body (false)', () => {
        const tampered = rawBody.replace('approved', 'declined');
        assert.strictEqual(
            verifyOnfidoWebhook({ rawBody: tampered, signatureHeader: goodSig, token: WEBHOOK_TOKEN }),
            false,
        );
    });

    test('rejects when token missing (false, never throws)', () => {
        assert.strictEqual(
            verifyOnfidoWebhook({ rawBody, signatureHeader: goodSig, token: undefined }),
            false,
        );
    });

    test('parseOnfidoEvent maps the event to normalized shape + KYC_STATUS', () => {
        const ev = parseOnfidoEvent(rawBody);
        assert.strictEqual(ev.resourceType, 'workflow_run');
        assert.strictEqual(ev.action, 'workflow_run.completed');
        assert.strictEqual(ev.objectId, 'run_xyz');
        assert.strictEqual(ev.status, KYC_STATUS.APPROVED);
    });

    test('parseOnfidoEvent THROWS on a malformed JSON body (caller -> 400, not a null event)', () => {
        assert.throws(() => parseOnfidoEvent('{not json'), /malformed/i);
    });

    test('parseOnfidoEvent maps a declined workflow_run to REJECTED', () => {
        const body = JSON.stringify({
            payload: { resource_type: 'workflow_run', action: 'workflow_run.completed', object: { id: 'r2', status: 'declined' } },
        });
        assert.strictEqual(parseOnfidoEvent(body).status, KYC_STATUS.REJECTED);
    });
});
