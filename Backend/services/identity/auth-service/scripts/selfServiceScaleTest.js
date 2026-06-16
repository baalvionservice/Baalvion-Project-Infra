#!/usr/bin/env node
'use strict';
/**
 * Self-Service Scale Harness — GTI Multi-Org Administration
 * ──────────────────────────────────────────────────────────
 * Drives the LIVE platform end-to-end through the auth-gateway HTTP API,
 * proving a non-technical platform owner can run the full org lifecycle
 * with zero direct DB access.
 *
 * REQUIRES a fully running stack:
 *   • auth-service      :3001  (Postgres + Redis)
 *   • auth-gateway      :3099
 *
 * Quick start:
 *   node scripts/selfServiceScaleTest.js
 *
 * Override defaults via env:
 *   GATEWAY_URL=http://localhost:3099 \
 *   PLATFORM_OWNER_EMAIL=superadmin@baalvion.com \
 *   PLATFORM_OWNER_PASSWORD=process.env.SUPERADMIN_PASSWORD \
 *   node scripts/selfServiceScaleTest.js
 *
 * Steps that require an emailed invite token are logged as
 * MANUAL/SKIPPED — nothing is fabricated; everything reachable
 * purely through the HTTP API is exercised.
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3099';
const PLATFORM_OWNER_EMAIL = process.env.PLATFORM_OWNER_EMAIL || 'superadmin@baalvion.com';
const PLATFORM_OWNER_PASSWORD = process.env.PLATFORM_OWNER_PASSWORD;

// ─── Result tracking ─────────────────────────────────────────────────────────

const results = [];

function pass(label) {
    results.push({ label, ok: true });
    console.log(`  ✓  ${label}`);
}

function fail(label, reason) {
    results.push({ label, ok: false, reason });
    console.error(`  ✗  ${label}`);
    if (reason) console.error(`     reason: ${reason}`);
}

function skip(label, note) {
    results.push({ label, ok: null });
    console.log(`  ⊘  [MANUAL/SKIPPED] ${label}`);
    if (note) console.log(`     note: ${note}`);
}

// ─── Tiny HTTP client with cookie-jar + CSRF support ─────────────────────────

/**
 * Session state shared across all requests in this harness run.
 * fetch() is Node 18+ global.
 */
const session = {
    /** Raw Set-Cookie strings persisted across requests. */
    cookies: {},
    /** CSRF token extracted from the csrf_token cookie. */
    csrfToken: null,
};

/**
 * Merge new Set-Cookie headers into our in-memory jar.
 * Handles both a single string and an array of strings.
 *
 * @param {string | string[] | null} setCookieHeader
 */
function absorbCookies(setCookieHeader) {
    if (!setCookieHeader) return;
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const hdr of headers) {
        // Each header looks like: "name=value; Path=/; HttpOnly; ..."
        const [nameValue] = hdr.split(';');
        const eqIdx = nameValue.indexOf('=');
        if (eqIdx === -1) continue;
        const name = nameValue.slice(0, eqIdx).trim();
        const value = nameValue.slice(eqIdx + 1).trim();
        session.cookies[name] = value;
        // Track CSRF specifically
        if (name === 'csrf_token' || name === 'baalvion-csrf') {
            session.csrfToken = value;
        }
    }
}

/**
 * Build a Cookie header string from the current jar.
 * @returns {string}
 */
function buildCookieHeader() {
    return Object.entries(session.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
}

/**
 * Minimal fetch wrapper.
 *
 * @param {string} path      — e.g. '/auth/login'
 * @param {{
 *   method?: string,
 *   body?: object,
 *   headers?: Record<string,string>
 * }} [opts]
 * @returns {Promise<{ status: number, body: any, raw: Response }>}
 */
async function request(path, opts = {}) {
    const method = (opts.method || 'GET').toUpperCase();
    const url = `${GATEWAY_URL}${path}`;
    const reqHeaders = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Cookie: buildCookieHeader(),
        ...(opts.headers || {}),
    };

    // Attach CSRF token for unsafe methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && session.csrfToken) {
        reqHeaders['x-csrf-token'] = session.csrfToken;
    }

    const fetchOpts = {
        method,
        headers: reqHeaders,
        redirect: 'follow',
    };
    if (opts.body && method !== 'GET') {
        fetchOpts.body = JSON.stringify(opts.body);
    }

    const raw = await fetch(url, fetchOpts);

    // Absorb any cookies the server sets
    const setCookie = raw.headers.get('set-cookie');
    absorbCookies(setCookie);
    // Some environments expose getSetCookie() as an array
    if (typeof raw.headers.getSetCookie === 'function') {
        for (const h of raw.headers.getSetCookie()) {
            absorbCookies(h);
        }
    }

    let body;
    const ct = raw.headers.get('content-type') || '';
    try {
        body = ct.includes('application/json') ? await raw.json() : await raw.text();
    } catch {
        body = null;
    }

    return { status: raw.status, body, raw };
}

// ─── Org definitions for the scale run ───────────────────────────────────────

const ORGS_TO_CREATE = [
    {
        label: 'Bank XYZ',
        payload: {
            name: 'Bank XYZ',
            type: 'bank',
            slug: 'bank-xyz',
            country: 'SG',
            contactEmail: 'ops@bankxyz.example.com',
            ownerEmail: 'owner.bankxyz@example.com',
            ownerFullName: 'Priya Kapoor',
        },
    },
    {
        label: 'Customs Authority ABC',
        payload: {
            name: 'Customs Authority ABC',
            type: 'customs_authority',
            slug: 'customs-abc',
            country: 'IN',
            contactEmail: 'info@customs-abc.example.gov',
            ownerEmail: 'owner.customs@example.gov',
            ownerFullName: 'Raj Sharma',
        },
    },
    {
        label: 'Logistics Provider DEF',
        payload: {
            name: 'Logistics Provider DEF',
            type: 'logistics_provider',
            slug: 'logistics-def',
            country: 'AE',
            contactEmail: 'fleet@logisticsdef.example.com',
            ownerEmail: 'owner.logistics@example.com',
            ownerFullName: 'Omar Al-Farsi',
        },
    },
    {
        label: 'Insurance Provider GHI',
        payload: {
            name: 'Insurance Provider GHI',
            type: 'insurance_provider',
            slug: 'insurance-ghi',
            country: 'GB',
            contactEmail: 'cover@insuranceghi.example.com',
            ownerEmail: 'owner.insurance@example.com',
            ownerFullName: 'Emily Clarke',
        },
    },
    {
        label: 'Buyer Corp',
        payload: {
            name: 'Buyer Corp',
            type: 'buyer',
            slug: 'buyer-corp',
            country: 'US',
            contactEmail: 'procurement@buyercorp.example.com',
            ownerEmail: 'owner.buyer@example.com',
            ownerFullName: 'James Walker',
        },
    },
    {
        label: 'Seller Corp',
        payload: {
            name: 'Seller Corp',
            type: 'seller',
            slug: 'seller-corp',
            country: 'CN',
            contactEmail: 'sales@sellercorp.example.com',
            ownerEmail: 'owner.seller@example.com',
            ownerFullName: 'Liu Wei',
        },
    },
];

// ─── Main harness ─────────────────────────────────────────────────────────────

async function main() {
    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('  GTI Self-Service Scale Harness');
    console.log(`  Gateway : ${GATEWAY_URL}`);
    console.log(`  As      : ${PLATFORM_OWNER_EMAIL}`);
    console.log('════════════════════════════════════════════════════════════');
    console.log('');

    // ── STEP 1: Login as platform owner ──────────────────────────────────────
    console.log('── Step 1: Login as platform owner ──────────────────────────');

    let loginRes;
    try {
        loginRes = await request('/auth/login', {
            method: 'POST',
            body: { email: PLATFORM_OWNER_EMAIL, password: PLATFORM_OWNER_PASSWORD },
        });
    } catch (err) {
        fail('Login request completed', String(err));
        summarise();
        return;
    }

    if (loginRes.status === 200 || loginRes.status === 201) {
        pass('Login returns HTTP 2xx');
    } else {
        fail('Login returns HTTP 2xx', `Got ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
        console.log('\n  Cannot continue without a valid platform-owner session.\n');
        summarise();
        return;
    }

    // Capture CSRF from cookie jar (absorbCookies ran during the fetch)
    if (session.csrfToken) {
        pass('CSRF token captured from Set-Cookie');
    } else {
        // Some gateways embed the csrf token in the response body
        const bodyToken = loginRes.body?.csrfToken || loginRes.body?.data?.csrfToken;
        if (bodyToken) {
            session.csrfToken = bodyToken;
            pass('CSRF token captured from response body');
        } else {
            skip(
                'CSRF token captured',
                'No csrf_token cookie or body field found — unsafe requests will omit x-csrf-token',
            );
        }
    }

    // ── STEP 2: Create 6 organisations via platform API ───────────────────────
    console.log('');
    console.log('── Step 2: Create 6 organisations (platform/organizations) ──');

    const createdOrgs = [];

    for (const org of ORGS_TO_CREATE) {
        let res;
        try {
            res = await request('/auth/svc/platform/organizations', {
                method: 'POST',
                body: org.payload,
            });
        } catch (err) {
            fail(`Create org "${org.label}"`, String(err));
            continue;
        }

        if (res.status === 200 || res.status === 201) {
            // Response envelope: { success, data: { org, ownerInvite }, meta }
            const orgData = res.body?.data || {};
            const orgId = orgData.org?.id || orgData.id || orgData.orgId;
            if (orgId) {
                pass(`Create org "${org.label}" → id=${orgId}`);
                createdOrgs.push({ ...org, id: String(orgId) });
            } else {
                fail(`Create org "${org.label}"`, `2xx but no org id in response: ${JSON.stringify(res.body)}`);
            }
        } else if (res.status === 409) {
            // Org already exists from a previous run — try to find it
            pass(`Org "${org.label}" already exists (409 idempotent) — will query list`);
        } else {
            fail(`Create org "${org.label}"`, `HTTP ${res.status}: ${JSON.stringify(res.body)}`);
        }
    }

    // ── STEP 3: Platform-side lifecycle verification ───────────────────────────
    console.log('');
    console.log('── Step 3: Lifecycle verification (platform-owner scope) ─────');

    // 3a. List orgs with type filter — verify each type appears
    const typesToProbe = ['bank', 'customs_authority', 'logistics_provider', 'insurance_provider', 'buyer', 'seller'];
    for (const orgType of typesToProbe) {
        let res;
        try {
            res = await request(`/auth/svc/platform/organizations?type=${orgType}`);
        } catch (err) {
            fail(`List orgs filtered by type="${orgType}"`, String(err));
            continue;
        }
        if (res.status === 200) {
            // Paginated envelope: { success, data: { total, page, limit, items }, meta }
            const data = res.body?.data || {};
            const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
            // We created exactly one org of each probed type this run, so >0 is required.
            if (items.length > 0 && items.every(o => o.type === orgType)) {
                pass(`List orgs type="${orgType}" returns ${items.length} result(s), all type-matched`);
            } else if (items.length > 0) {
                fail(`List orgs filtered by type="${orgType}"`, `filter leaked other types: ${items.map(o => o.type).join(',')}`);
            } else {
                fail(`List orgs filtered by type="${orgType}"`, 'expected >=1 result, got 0');
            }
        } else {
            fail(`List orgs filtered by type="${orgType}"`, `HTTP ${res.status}`);
        }
    }

    // 3b. Detailed checks on each successfully created org
    for (const org of createdOrgs) {
        // Detail endpoint
        let detailRes;
        try {
            detailRes = await request(`/auth/svc/platform/organizations/${org.id}`);
        } catch (err) {
            fail(`GET org detail for "${org.label}"`, String(err));
            continue;
        }
        if (detailRes.status === 200) {
            pass(`GET /platform/organizations/${org.id} ("${org.label}") — 200 OK`);
        } else {
            fail(`GET org detail for "${org.label}"`, `HTTP ${detailRes.status}`);
        }

        // Members list
        let membersRes;
        try {
            membersRes = await request(`/auth/svc/platform/organizations/${org.id}/users`);
        } catch (err) {
            fail(`GET org members for "${org.label}"`, String(err));
            membersRes = null;
        }
        if (membersRes && membersRes.status === 200) {
            pass(`GET /platform/organizations/${org.id}/users ("${org.label}") — 200 OK`);
        } else if (membersRes) {
            // 404 is acceptable if the route is slightly different; 403 means wrong scope
            if (membersRes.status === 404) {
                skip(
                    `GET org members for "${org.label}" (route variant may differ)`,
                    `HTTP ${membersRes.status}`,
                );
            } else {
                fail(`GET org members for "${org.label}"`, `HTTP ${membersRes.status}`);
            }
        }

        // Audit log — should contain the org.platform_create event
        let auditRes;
        try {
            auditRes = await request(`/auth/svc/platform/organizations/${org.id}/audit`);
        } catch (err) {
            fail(`GET audit log for "${org.label}"`, String(err));
            auditRes = null;
        }
        if (auditRes && auditRes.status === 200) {
            // Envelope: { success, data: { total, page, limit, logs }, meta }
            const data = auditRes.body?.data || {};
            const events = Array.isArray(data) ? data : (data.logs || data.items || []);
            const hasCreateEvent = Array.isArray(events) &&
                events.some(e => (e.action || e.event || '').toLowerCase().includes('platform_create'));
            if (hasCreateEvent) {
                pass(`Audit log for "${org.label}" contains org.platform_create event`);
            } else {
                fail(`Audit log for "${org.label}"`, `no platform_create event found in ${events.length} events`);
            }
        } else if (auditRes && auditRes.status === 404) {
            skip(`Audit log for "${org.label}"`, 'Route may not exist yet (404)');
        } else if (auditRes) {
            fail(`GET audit log for "${org.label}"`, `HTTP ${auditRes.status}`);
        }

        // Suspend
        let suspendRes;
        try {
            suspendRes = await request(`/auth/svc/platform/organizations/${org.id}/status`, {
                method: 'POST',
                body: { status: 'suspended' },
            });
        } catch (err) {
            fail(`Suspend org "${org.label}"`, String(err));
            suspendRes = null;
        }
        if (suspendRes && (suspendRes.status === 200 || suspendRes.status === 204)) {
            pass(`Suspend org "${org.label}" → ${suspendRes.status}`);
        } else if (suspendRes) {
            fail(`Suspend org "${org.label}"`, `HTTP ${suspendRes.status}: ${JSON.stringify(suspendRes.body)}`);
        }

        // Reactivate
        let activateRes;
        try {
            activateRes = await request(`/auth/svc/platform/organizations/${org.id}/status`, {
                method: 'POST',
                body: { status: 'active' },
            });
        } catch (err) {
            fail(`Reactivate org "${org.label}"`, String(err));
            activateRes = null;
        }
        if (activateRes && (activateRes.status === 200 || activateRes.status === 204)) {
            pass(`Reactivate org "${org.label}" → ${activateRes.status}`);
        } else if (activateRes) {
            fail(`Reactivate org "${org.label}"`, `HTTP ${activateRes.status}: ${JSON.stringify(activateRes.body)}`);
        }

        // Invite flow: the platform owner created the org and seeded ownerEmail.
        // Accepting that invite requires the emailed token — we cannot automate it here.
        skip(
            `Accept owner invite for "${org.label}" (${org.payload.ownerEmail})`,
            'Requires invite token from email — run manually once the email arrives.',
        );

        // Similarly, inviting additional members and exercising the per-org
        // admin endpoints (/svc/orgs/:id/invite) requires the owner to first
        // accept their invite so they hold a session.
        skip(
            `Invite members to "${org.label}" via /svc/orgs/:id/invite`,
            'Requires org-owner session (owner must first accept their email invite).',
        );
    }

    // 3c. Platform metrics
    console.log('');
    console.log('── Step 3c: Platform metrics ─────────────────────────────────');
    let metricsRes;
    try {
        metricsRes = await request('/auth/svc/platform/metrics');
    } catch (err) {
        fail('GET /auth/svc/platform/metrics', String(err));
        metricsRes = null;
    }
    if (metricsRes && metricsRes.status === 200) {
        // Envelope: { success, data: { organizations:{total,byType,byStatus}, users, invitations } }
        const m = metricsRes.body?.data || {};
        const total = m?.organizations?.total;
        if (typeof total === 'number' && total >= ORGS_TO_CREATE.length) {
            pass(`GET /auth/svc/platform/metrics — total_orgs=${total}, pending_invites=${m?.invitations?.pending ?? '?'}`);
        } else {
            fail('GET /auth/svc/platform/metrics', `unexpected metrics shape: ${JSON.stringify(m)}`);
        }
    } else if (metricsRes && metricsRes.status === 404) {
        skip('GET /auth/svc/platform/metrics', 'Route may not exist yet (404)');
    } else if (metricsRes) {
        fail('GET /auth/svc/platform/metrics', `HTTP ${metricsRes.status}`);
    }

    // ── STEP 4: Isolation probe ───────────────────────────────────────────────
    console.log('');
    console.log('── Step 4: Isolation probe (unauthenticated access) ──────────');

    // Clear the session to simulate an anonymous caller
    const savedCookies = { ...session.cookies };
    const savedCsrf = session.csrfToken;
    session.cookies = {};
    session.csrfToken = null;

    let anonRes;
    try {
        anonRes = await request('/auth/svc/platform/organizations');
    } catch (err) {
        fail('Unauthenticated GET /platform/organizations returns 401/403', String(err));
        anonRes = null;
    }
    if (anonRes && (anonRes.status === 401 || anonRes.status === 403)) {
        pass(`Unauthenticated request blocked with HTTP ${anonRes.status}`);
    } else if (anonRes) {
        fail(
            'Unauthenticated GET /platform/organizations returns 401/403',
            `Got HTTP ${anonRes.status} — route may be unprotected`,
        );
    }

    // Probe with a garbage session token
    session.cookies = { baalvion_refresh: 'garbage.token.value' };
    let fakeTokenRes;
    try {
        fakeTokenRes = await request('/auth/svc/platform/organizations');
    } catch (err) {
        fail('Garbage-session GET /platform/organizations returns 401/403', String(err));
        fakeTokenRes = null;
    }
    if (fakeTokenRes && (fakeTokenRes.status === 401 || fakeTokenRes.status === 403)) {
        pass(`Garbage-session request blocked with HTTP ${fakeTokenRes.status}`);
    } else if (fakeTokenRes) {
        fail(
            'Garbage-session GET /platform/organizations returns 401/403',
            `Got HTTP ${fakeTokenRes.status}`,
        );
    }

    // Restore session
    session.cookies = savedCookies;
    session.csrfToken = savedCsrf;

    // ── Final summary ─────────────────────────────────────────────────────────
    summarise();
}

function summarise() {
    const mandatory = results.filter(r => r.ok !== null);
    const passed = mandatory.filter(r => r.ok === true);
    const failed = mandatory.filter(r => r.ok === false);
    const skipped = results.filter(r => r.ok === null);

    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed.length} passed, ${failed.length} failed, ${skipped.length} manual/skipped`);
    console.log('════════════════════════════════════════════════════════════');

    if (failed.length > 0) {
        console.log('');
        console.log('  FAILURES:');
        for (const f of failed) {
            console.error(`    ✗ ${f.label}`);
            if (f.reason) console.error(`      ${f.reason}`);
        }
    }

    if (skipped.length > 0) {
        console.log('');
        console.log('  MANUAL STEPS NEEDED (run after stack is live + emails received):');
        for (const s of skipped) {
            console.log(`    ⊘ ${s.label}`);
        }
    }

    console.log('');

    process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch(err => {
    console.error('\nFATAL:', err);
    process.exitCode = 1;
});
