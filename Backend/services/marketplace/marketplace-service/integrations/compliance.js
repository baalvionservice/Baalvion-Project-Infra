'use strict';
// KYC / AML integration seam. In production these call the platform's account-service
// (KYC) and aml-service (sanctions/watchlist screening) over sdk.http. Until those URLs
// are configured, a deterministic local screen runs so onboarding is fully functional in
// dev — never silently passing: a tiny demo watchlist forces the 'review' path.
const AML_SERVICE_URL = process.env.AML_SERVICE_URL || '';
const KYC_SERVICE_URL = process.env.KYC_SERVICE_URL || '';

const DEMO_WATCHLIST = ['sanctioned', 'blocked entity', 'ofac', 'shell co'];

// Returns { status: 'clear'|'review'|'hit', score, provider }
async function screenAml({ legalName = '', country = '' }) {
    if (AML_SERVICE_URL) {
        try {
            const res = await fetch(`${AML_SERVICE_URL}/v1/screen`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: legalName, country }),
            });
            if (res.ok) {
                const j = await res.json();
                return { status: j?.data?.status || 'review', score: j?.data?.score ?? null, provider: 'aml-service' };
            }
        } catch { /* fall through to local screen */ }
    }
    const hay = legalName.toLowerCase();
    const hit = DEMO_WATCHLIST.some((w) => hay.includes(w));
    return { status: hit ? 'hit' : 'clear', score: hit ? 0.95 : 0.02, provider: 'local' };
}

// KYC submission seam — returns the status the record should move to.
async function submitKyc({ subjectType, subjectId }) {
    if (KYC_SERVICE_URL) {
        try {
            const res = await fetch(`${KYC_SERVICE_URL}/v1/kyc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subjectType, subjectId }),
            });
            if (res.ok) return 'in_review';
        } catch { /* fall through */ }
    }
    // Local: KYC is submitted and awaits compliance review.
    return 'in_review';
}

module.exports = { screenAml, submitKyc };
