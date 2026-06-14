'use strict';
/**
 * Integration tests — Force-MFA Enrollment security control
 *
 * Scenario:
 *  - User with mfa_required=true, mfa_enabled=false
 *  - login → { mfa_enrollment_required, challengeToken } — no session issued
 *  - enrollMfaStart → secret + qrCodeUrl
 *  - enrollMfaComplete wrong code → throws INVALID_MFA_CODE
 *  - enrollMfaComplete correct speakeasy code → full tokens + mfa_enabled=true
 *  - Normal user (mfa_required=false) → gets tokens directly (regression guard)
 *  - Refresh for unenrolled mfa_required user → throws MFA_ENROLLMENT_REQUIRED
 *
 * LIVE Postgres + Redis required (reads .env from service root).
 * Creates its own throwaway data; cleans up in afterAll.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import speakeasy from 'speakeasy';
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });

import db from '../../models/index.js';
import redis from '../../config/redis.js';
import { orgRepo, userRepo, sessionRepo, rtRepo } from '../../repositories/index.js';
import authService from '../../service/authService.js';
import mfaService from '../../service/mfaService.js';
import password from '../../utils/password.js';

// ── Unique suffix ─────────────────────────────────────────────────────────────
const SUFFIX = `${process.pid}_${Date.now()}`;
const EMAIL = (n) => `test_mfa_${n}_${SUFFIX}@baalvion-test.invalid`;
const SLUG  = (n) => `test-mfa-${n}-${SUFFIX}`.slice(0, 60);

const created = { userIds: [], orgIds: [] };

// ── Shared test state ─────────────────────────────────────────────────────────
let forceMfaUser;           // mfa_required=true, mfa_enabled=false
let forceMfaOrg;
let challengeToken;         // returned from first login
let pendingSecret;          // stored by enrollMfaStart for use in enrollMfaComplete

let normalUser;             // mfa_required=false
let normalOrg;

let orphanUser;             // mfa_required=true/enabled=false, for refresh regression
let orphanOrg;
let orphanSession;
let orphanRefreshToken;     // raw refresh JWT

const TEST_IP = '10.0.0.2';
const TEST_UA = 'vitest/mfaEnforcement';
const PLAIN_PW = 'MfaTestPass!1';

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeAll(async () => {
    await redis.connect();

    const pwHash = await password.hash(PLAIN_PW);

    // 1. Force-MFA user
    const fUser = await db.User.create({
        email:         EMAIL('force'),
        password_hash: pwHash,
        full_name:     'Force MFA Tester',
        status:        'active',
        mfa_required:  true,
        mfa_enabled:   false,
    });
    forceMfaUser = fUser;
    created.userIds.push(fUser.id);

    forceMfaOrg = await orgRepo.createWithProfile({
        name:   `Force MFA Org ${SUFFIX}`,
        slug:   SLUG('force'),
        type:   'buyer',
        status: 'active',
    });
    created.orgIds.push(forceMfaOrg.id);
    await orgRepo.addMember({ orgId: forceMfaOrg.id, userId: fUser.id, role: 'member' });

    // 2. Normal user (no MFA requirement)
    const nUser = await db.User.create({
        email:         EMAIL('normal'),
        password_hash: pwHash,
        full_name:     'Normal User',
        status:        'active',
        mfa_required:  false,
        mfa_enabled:   false,
    });
    normalUser = nUser;
    created.userIds.push(nUser.id);

    normalOrg = await orgRepo.createWithProfile({
        name:   `Normal User Org ${SUFFIX}`,
        slug:   SLUG('normal'),
        type:   'buyer',
        status: 'active',
    });
    created.orgIds.push(normalOrg.id);
    await orgRepo.addMember({ orgId: normalOrg.id, userId: nUser.id, role: 'member' });

    // 3. Orphan force-MFA user — has a session + refresh token created manually
    //    so we can test refresh denial without completing enrollment.
    const oUser = await db.User.create({
        email:         EMAIL('orphan'),
        password_hash: pwHash,
        full_name:     'Orphan MFA',
        status:        'active',
        mfa_required:  true,
        mfa_enabled:   false,
    });
    orphanUser = oUser;
    created.userIds.push(oUser.id);

    orphanOrg = await orgRepo.createWithProfile({
        name:   `Orphan MFA Org ${SUFFIX}`,
        slug:   SLUG('orphan'),
        type:   'buyer',
        status: 'active',
    });
    created.orgIds.push(orphanOrg.id);
    await orgRepo.addMember({ orgId: orphanOrg.id, userId: oUser.id, role: 'member' });

    // Manually create a session + refresh token pair (simulate a legacy live session
    // for a user who had mfa_required flipped on AFTER they already held tokens).
    const { v4: uuidv4 } = await import('uuid');
    const jwt = await import('../../utils/jwtRsa.js');

    orphanSession = await sessionRepo.create({
        userId:    oUser.id,
        orgId:     orphanOrg.id,
        ipAddress: TEST_IP,
        userAgent: TEST_UA,
    });

    const familyId = uuidv4();
    orphanRefreshToken = jwt.default.signRefreshToken({
        sub:      oUser.id,
        sid:      orphanSession.id,
        familyId,
    });
    const tokenHash = jwt.default.hashToken(orphanRefreshToken);
    await rtRepo.create({
        userId:    oUser.id,
        sessionId: orphanSession.id,
        familyId,
        tokenHash,
    });
}, 30_000);

afterAll(async () => {
    try {
        // Burn any MFA challenge keys that a test may have left in Redis
        // (mfaService uses in-memory fallback too — nothing extra to clean there)

        for (const uid of created.userIds) {
            await db.RefreshToken.destroy({ where: { user_id: uid } }).catch(() => {});
        }
        for (const uid of created.userIds) {
            await db.Session.destroy({ where: { user_id: uid } }).catch(() => {});
        }
        for (const orgId of created.orgIds) {
            await db.TeamMember.destroy({ where: { org_id: orgId } }).catch(() => {});
        }
        for (const orgId of created.orgIds) {
            await db.AuditLog.destroy({ where: { org_id: orgId } }).catch(() => {});
        }
        for (const uid of created.userIds) {
            await db.User.destroy({ where: { id: uid } }).catch(() => {});
        }
        for (const orgId of created.orgIds) {
            await db.Organization.destroy({ where: { id: orgId } }).catch(() => {});
        }
    } catch (err) {
        console.warn('[afterAll cleanup]', err.message);
    }
}, 30_000);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Force-MFA Enrollment — security control', () => {
    // ── Test A: login returns enrollment challenge, no tokens ─────────────────
    it('A: login returns mfa_enrollment_required + challengeToken, no accessToken', async () => {
        const res = await authService.login({
            email:     forceMfaUser.email,
            password:  PLAIN_PW,
            ipAddress: TEST_IP,
            userAgent: TEST_UA,
        });

        expect(res.mfa_enrollment_required, 'mfa_enrollment_required should be true').toBe(true);
        expect(res.challengeToken, 'challengeToken should be present').toBeTruthy();
        expect(res.accessToken,  'accessToken must NOT be present before enrollment').toBeUndefined();
        expect(res.refreshToken, 'refreshToken must NOT be present before enrollment').toBeUndefined();

        challengeToken = res.challengeToken;
    }, 15_000);

    // ── Test B: enrollMfaStart returns secret + qrCodeUrl ─────────────────────
    it('B: enrollMfaStart returns qrCodeUrl + secret; user gets mfa_pending_secret', async () => {
        const setup = await authService.enrollMfaStart(challengeToken);

        expect(setup.qrCodeUrl,     'qrCodeUrl should be a data URI').toMatch(/^data:image\/png/);
        expect(setup.secret,        'secret should be present').toBeTruthy();
        expect(setup.recoveryCodes, 'recoveryCodes should be an array').toBeInstanceOf(Array);
        expect(setup.recoveryCodes.length, '8 recovery codes expected').toBe(8);

        pendingSecret = setup.secret;

        // User now has mfa_pending_secret set in DB
        const fresh = await userRepo.findById(forceMfaUser.id);
        expect(fresh.mfa_pending_secret, 'pending secret must be stored in DB').toBeTruthy();
    }, 15_000);

    // ── Test C: wrong code throws INVALID_MFA_CODE ────────────────────────────
    it('C: enrollMfaComplete with wrong code throws INVALID_MFA_CODE', async () => {
        // Compute the real TOTP so we can pick a definitively-wrong code that is
        // at least 1 step away from the real one (avoids the 1-in-1M false pass).
        const realCode = speakeasy.totp({ secret: pendingSecret, encoding: 'base32' });

        // Flip the last digit — guaranteed wrong
        const lastDigit = parseInt(realCode[realCode.length - 1], 10);
        const wrongDigit = (lastDigit + 1) % 10;
        const wrongCode  = realCode.slice(0, -1) + String(wrongDigit);

        await expect(
            authService.enrollMfaComplete({
                challengeToken,
                code:      wrongCode,
                ipAddress: TEST_IP,
                userAgent: TEST_UA,
            }),
        ).rejects.toMatchObject({ code: 'INVALID_MFA_CODE' });
    }, 15_000);

    // ── Test D: correct code → tokens + mfa_enabled=true ─────────────────────
    it('D: enrollMfaComplete with correct code returns full token pair; mfa_enabled flipped', async () => {
        const correctCode = speakeasy.totp({ secret: pendingSecret, encoding: 'base32' });

        const res = await authService.enrollMfaComplete({
            challengeToken,
            code:      correctCode,
            ipAddress: TEST_IP,
            userAgent: TEST_UA,
        });

        expect(res.accessToken,  'accessToken should be present after enrollment').toBeTruthy();
        expect(res.refreshToken, 'refreshToken should be present after enrollment').toBeTruthy();
        expect(res.user,         'user object should be returned').toBeTruthy();

        // mfa_enabled must be true now
        const fresh = await userRepo.findById(forceMfaUser.id);
        expect(fresh.mfa_enabled,  'mfa_enabled should be true after successful enrollment').toBe(true);
        expect(fresh.mfa_required, 'mfa_required should remain true').toBe(true);
        // Pending secret cleared
        expect(fresh.mfa_pending_secret, 'mfa_pending_secret should be null after activation').toBeNull();
    }, 15_000);

    // ── Test E (regression): normal user gets full tokens without enrollment ───
    it('E: normal user (mfa_required=false) receives tokens directly from login', async () => {
        const res = await authService.login({
            email:     normalUser.email,
            password:  PLAIN_PW,
            ipAddress: TEST_IP,
            userAgent: TEST_UA,
        });

        expect(res.accessToken,  'normal user should get accessToken').toBeTruthy();
        expect(res.refreshToken, 'normal user should get refreshToken').toBeTruthy();
        expect(res.mfa_enrollment_required, 'normal user should NOT get enrollment gate').toBeFalsy();
        expect(res.mfa_required,            'normal user should NOT see mfa_required flag').toBeFalsy();
    }, 15_000);

    // ── Test F: refresh denied for unenrolled force-MFA user ──────────────────
    it('F: authService.refresh throws MFA_ENROLLMENT_REQUIRED for unenrolled force-MFA user', async () => {
        // orphanUser has mfa_required=true, mfa_enabled=false and an active session+RT
        await expect(
            authService.refresh(orphanRefreshToken, TEST_IP),
        ).rejects.toMatchObject({ code: 'MFA_ENROLLMENT_REQUIRED' });
    }, 15_000);

    // ── Regression: expired/invalid challenge token is rejected cleanly ────────
    it('REGRESSION: enrollMfaStart with non-existent challengeToken throws MFA_CHALLENGE_EXPIRED', async () => {
        await expect(
            authService.enrollMfaStart('totally-fake-challenge-token'),
        ).rejects.toMatchObject({ code: 'MFA_CHALLENGE_EXPIRED' });
    }, 10_000);

    // ── Regression: enrollMfaComplete after challenge consumed throws error ────
    it('REGRESSION: enrollMfaComplete after challenge consumed throws MFA_CHALLENGE_EXPIRED', async () => {
        // challengeToken was consumed by Test D — a second call must fail
        await expect(
            authService.enrollMfaComplete({
                challengeToken,
                code:      '000000',
                ipAddress: TEST_IP,
                userAgent: TEST_UA,
            }),
        ).rejects.toMatchObject({ code: 'MFA_CHALLENGE_EXPIRED' });
    }, 10_000);
});
