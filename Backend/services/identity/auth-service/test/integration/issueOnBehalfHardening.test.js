'use strict';
/**
 * Integration tests — issueOnBehalf hardening (Phase 0 security fix)
 *
 * issueOnBehalf is the S2S dual-issue bridge (an island service authenticated the user locally,
 * auth-service mints the CANONICAL RS256 token). It previously checked only user.status, so it
 * was a back door around two platform-wide controls. Hardened to mirror login/refresh:
 *  A. suspended org                        → throws ORG_SUSPENDED
 *  B. unmet force-MFA (mfa_required, !enabled) → throws MFA_ENROLLMENT_REQUIRED
 *  C. active org + no MFA mandate          → mints a valid access token (regression)
 *
 * LIVE Postgres + Redis required (reads .env from service root). Throwaway data; cleaned in afterAll.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });

import db from '../../models/index.js';
import redis from '../../config/redis.js';
import { orgRepo } from '../../repositories/index.js';
import { issueOnBehalf } from '../../service/issueOnBehalf.js';
import password from '../../utils/password.js';

const SUFFIX = `${process.pid}_${Date.now()}`;
const EMAIL = (n) => `test_iob_${n}_${SUFFIX}@baalvion-test.invalid`;
const SLUG  = (n) => `test-iob-${n}-${SUFFIX}`.slice(0, 60);
const TEST_IP = '10.0.0.4';
const TEST_UA = 'vitest/issueOnBehalf';

const created = { userIds: [], orgIds: [] };

// Create an active user with an active membership in a fresh org; returns { user, org }.
async function seedMember(label, { mfaRequired = false, mfaEnabled = false, orgStatus = 'active' } = {}) {
    const user = await db.User.create({
        email: EMAIL(label), password_hash: await password.hash('IobPass!1'),
        full_name: `IOB ${label}`, status: 'active', mfa_required: mfaRequired, mfa_enabled: mfaEnabled,
    });
    created.userIds.push(user.id);

    const org = await orgRepo.createWithProfile({ name: `IOB ${label} ${SUFFIX}`, slug: SLUG(label), type: 'buyer', status: 'active' });
    created.orgIds.push(org.id);
    await orgRepo.addMember({ orgId: org.id, userId: user.id, role: 'member' });

    if (orgStatus !== 'active') await orgRepo.setStatus(org.id, orgStatus);
    return { user, org };
}

beforeAll(async () => { await redis.connect(); }, 30_000);

afterAll(async () => {
    try {
        for (const uid of created.userIds) await db.RefreshToken.destroy({ where: { user_id: uid } }).catch(() => {});
        for (const uid of created.userIds) await db.Session.destroy({ where: { user_id: uid } }).catch(() => {});
        for (const orgId of created.orgIds) await db.TeamMember.destroy({ where: { org_id: orgId } }).catch(() => {});
        for (const orgId of created.orgIds) await db.AuditLog.destroy({ where: { org_id: orgId } }).catch(() => {});
        for (const uid of created.userIds) await db.User.destroy({ where: { id: uid } }).catch(() => {});
        for (const orgId of created.orgIds) await db.Organization.destroy({ where: { id: orgId } }).catch(() => {});
    } catch (err) {
        console.warn('[afterAll cleanup]', err.message);
    }
}, 30_000);

describe('issueOnBehalf — hardening (security control)', () => {
    it('A: suspended org throws ORG_SUSPENDED', async () => {
        const { user } = await seedMember('suspended', { orgStatus: 'suspended' });
        await expect(
            issueOnBehalf({ email: user.email, service: 'trade', ipAddress: TEST_IP, userAgent: TEST_UA }),
        ).rejects.toMatchObject({ code: 'ORG_SUSPENDED' });
    }, 15_000);

    it('B: unmet force-MFA user throws MFA_ENROLLMENT_REQUIRED', async () => {
        const { user } = await seedMember('forcemfa', { mfaRequired: true, mfaEnabled: false });
        await expect(
            issueOnBehalf({ email: user.email, service: 'trade', ipAddress: TEST_IP, userAgent: TEST_UA }),
        ).rejects.toMatchObject({ code: 'MFA_ENROLLMENT_REQUIRED' });
    }, 15_000);

    it('C (regression): active org + no MFA mandate mints a valid access token', async () => {
        const { user, org } = await seedMember('ok');
        const res = await issueOnBehalf({ email: user.email, service: 'trade', ipAddress: TEST_IP, userAgent: TEST_UA });

        expect(res.accessToken, 'should mint an access token for a clean user').toBeTruthy();
        expect(res.tokenType).toBe('Bearer');
        expect(res.sid, 'a session id should be returned').toBeTruthy();
        expect(String(res.org_id)).toBe(String(org.id));
        expect(Array.isArray(res.roles)).toBe(true);
    }, 15_000);
});
