'use strict';
/**
 * Email-verification state, as far as this service can honestly know it.
 *
 * WHAT THE PLATFORM PROVIDES (measured end-to-end, 2026-09-07):
 *   auth.users.email_verified_at is the record of truth.
 *   auth-service puts it on every access token as the `email_verified` claim, and returns
 *   it from /auth/me; @baalvion/auth-node surfaces it as req.auth.emailVerified.
 *
 * So the answer now reaches this service through the token it already verifies — no extra
 * call, and no reading of auth's tables, which system contract rule C2 forbids and which
 * would couple this schema to the identity service's internals.
 *
 * UNKNOWN remains a real state, not a placeholder for "probably fine". A token issued
 * before the claim existed carries no opinion, and so does one from any future issuer that
 * omits it. Those are waved through gated actions by default rather than locked out, which
 * is a deliberate rollout choice: see `evaluate` and config.security.requireEmailVerification.
 */
const STATE = Object.freeze({
    VERIFIED: 'VERIFIED',
    UNVERIFIED: 'UNVERIFIED',
    /** The token carries no verification claim. See the note above. */
    UNKNOWN: 'UNKNOWN',
});

/**
 * Actions that SHOULD require a verified address once the platform can report one.
 *
 * Enforced. Each maps to something another person eventually sees or receives, which is
 * the line: an unverified account may work on its own material indefinitely, but may not
 * put anything in front of somebody else.
 */
const VERIFICATION_REQUIRED = Object.freeze([
    'case:publish',      // opening a case beyond DRAFT
    'comment:create',
    'case:support',
    'community:join',
    'post:create',
    'invitation:accept',
    'report:create',
]);

/** Actions an unverified account may always take: its own account, and its own drafts. */
const ALWAYS_ALLOWED = Object.freeze([
    'profile:update_self',
    'case:create',       // a DRAFT is visible to nobody, so it endangers nobody
    'case:view',
    'resource:view',
    'notification:read_self',
]);

/**
 * Read the state from a verified token.
 *
 * Accepts several claim spellings because the platform may add one under any of them; until
 * one appears, every account resolves to UNKNOWN.
 */
function stateFrom(auth) {
    if (!auth || !auth.userId) return STATE.UNKNOWN;
    const claim = auth.emailVerified ?? auth.email_verified ?? auth.evf;
    if (claim === true) return STATE.VERIFIED;
    if (claim === false) return STATE.UNVERIFIED;
    return STATE.UNKNOWN;
}

/**
 * Whether an action may proceed.
 *
 * `enforceOnUnknown` comes from configuration and defaults to false. Turning it on before
 * the platform emits the claim would refuse every action for every account — which is why
 * it is a deliberate switch rather than a default, and why the reason is returned rather
 * than swallowed.
 */
function evaluate(state, action, { enforceOnUnknown = false } = {}) {
    if (ALWAYS_ALLOWED.includes(action)) return { allowed: true, reason: 'ALWAYS_ALLOWED' };
    if (!VERIFICATION_REQUIRED.includes(action)) return { allowed: true, reason: 'NOT_GATED' };

    if (state === STATE.VERIFIED) return { allowed: true, reason: 'VERIFIED' };
    if (state === STATE.UNVERIFIED) return { allowed: false, reason: 'EMAIL_NOT_VERIFIED' };

    return enforceOnUnknown
        ? { allowed: false, reason: 'VERIFICATION_STATE_UNAVAILABLE' }
        : { allowed: true, reason: 'VERIFICATION_STATE_UNAVAILABLE_NOT_ENFORCED' };
}

module.exports = { STATE, VERIFICATION_REQUIRED, ALWAYS_ALLOWED, stateFrom, evaluate };
