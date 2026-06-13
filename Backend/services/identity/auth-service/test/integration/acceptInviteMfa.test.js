'use strict';
/**
 * Integration tests — acceptInvite MFA gate (Phase 0 security fix)
 *
 * Closes the acceptInvite MFA-bypass: an EXISTING user who already has MFA enabled (or an unmet
 * force-MFA mandate) must NOT receive a full session by accepting an org invite — they must clear
 * the second factor first, exactly like login(). The invite still joins them to the org.
 *
 * Scenarios:
 *  A. existing mfa_enabled user accepts invite → { mfa_required, challengeToken }, NO tokens; member created
 *  B. existing force-MFA user (mfa_required, !mfa_enabled) → { mfa_enrollment_required }, NO tokens; member created
 *  C. brand-new user (no MFA) accepts invite → full token pair (regression: common case unchanged)
 *  D. existing user WITHOUT MFA accepts invite → full token pair (regression)
 *
 * LIVE Postgres + Redis required (reads .env from service root). Throwaway data; cleaned in afterAll.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });

import db from '../../models/index.js';
import redis from '../../config/redis.js';
import { orgRepo, userRepo, inviteRepo } from '../../repositories/index.js';
import authService from '../../service/authService.js';
import password from '../../utils/password.js';
import { generateToken, hashToken } from '../../utils/crypto.js';

const SUFFIX = `${process.pid}_${Date.now()}`;
const EMAIL = (n) => `test_invmfa_${n}_${SUFFIX}@baalvion-test.invalid`;
const SLUG  = (n) => `test-invmfa-${n}-${SUFFIX}`.slice(0, 60);
const PLAIN_PW = 'InviteTestPass!1';
const TEST_IP = '10.0.0.3';
const TEST_UA = 'vitest/acceptInviteMfa';

const created = { userIds: [], orgIds: [], inviteIds: [] };
let inviterId;

// Create a pending invitation and return the RAW token (the caller passes it to acceptInvite).
async function makeInvite(orgId, email, role = 'member') {
    const rawToken = generateToken();
    const inv = await inviteRepo.create({
        orgId,
        email,
        role,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdBy: inviterId,
    });
    created.inviteIds.push(inv.id);
    return rawToken;
}

beforeAll(async () => {
    await redis.connect();
    const pwHash = await password.hash(PLAIN_PW);

    // Inviter — supplies the NOT NULL invitations.created_by.
    const inviter = await db.User.create({
        email: EMAIL('inviter'), password_hash: pwHash, full_name: 'Inviter', status: 'active',
    });
    inviterId = inviter.id;
    created.userIds.push(inviter.id);
}, 30_000);

afterAll(async () => {
    try {
        for (const id of created.inviteIds) await db.Invitation.destroy({ where: { id } }).catch(() => {});
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

describe('acceptInvite — MFA gate (security control)', () => {
    it('A: existing mfa_enabled user gets mfa_required + challengeToken, NO session', async () => {
        const user = await db.User.create({
            email: EMAIL('enabled'), password_hash: await password.hash(PLAIN_PW),
            full_name: 'MFA Enabled', status: 'active', mfa_required: false, mfa_enabled: true,
        });
        created.userIds.push(user.id);

        const org = await orgRepo.createWithProfile({ name: `Inv A ${SUFFIX}`, slug: SLUG('a'), type: 'buyer', status: 'active' });
        created.orgIds.push(org.id);

        const token = await makeInvite(org.id, user.email);
        const res = await authService.acceptInvite({ token, email: user.email, password: PLAIN_PW, ipAddress: TEST_IP, userAgent: TEST_UA });

        expect(res.mfa_required, 'mfa_required should be true').toBe(true);
        expect(res.challengeToken, 'challengeToken should be present').toBeTruthy();
        expect(res.accessToken, 'NO accessToken before MFA clears').toBeUndefined();
        expect(res.refreshToken, 'NO refreshToken before MFA clears').toBeUndefined();

        // The invite still joined them to the org, and the invitation was consumed.
        const member = await orgRepo.getActiveMember(org.id, user.id);
        expect(member, 'membership must be created despite the MFA gate').toBeTruthy();
    }, 15_000);

    it('B: existing force-MFA user gets mfa_enrollment_required, NO session', async () => {
        const user = await db.User.create({
            email: EMAIL('force'), password_hash: await password.hash(PLAIN_PW),
            full_name: 'Force MFA', status: 'active', mfa_required: true, mfa_enabled: false,
        });
        created.userIds.push(user.id);

        const org = await orgRepo.createWithProfile({ name: `Inv B ${SUFFIX}`, slug: SLUG('b'), type: 'buyer', status: 'active' });
        created.orgIds.push(org.id);

        const token = await makeInvite(org.id, user.email);
        const res = await authService.acceptInvite({ token, email: user.email, password: PLAIN_PW, ipAddress: TEST_IP, userAgent: TEST_UA });

        expect(res.mfa_enrollment_required, 'mfa_enrollment_required should be true').toBe(true);
        expect(res.challengeToken).toBeTruthy();
        expect(res.accessToken, 'NO accessToken before enrollment').toBeUndefined();

        const member = await orgRepo.getActiveMember(org.id, user.id);
        expect(member, 'membership must be created despite the enrollment gate').toBeTruthy();
    }, 15_000);

    it('C (regression): brand-new invited user (no MFA) gets a full token pair', async () => {
        const email = EMAIL('new');
        const org = await orgRepo.createWithProfile({ name: `Inv C ${SUFFIX}`, slug: SLUG('c'), type: 'buyer', status: 'active' });
        created.orgIds.push(org.id);

        const token = await makeInvite(org.id, email);
        const res = await authService.acceptInvite({ token, email, password: PLAIN_PW, fullName: 'Brand New', ipAddress: TEST_IP, userAgent: TEST_UA });

        expect(res.accessToken, 'new user should get an accessToken directly').toBeTruthy();
        expect(res.refreshToken).toBeTruthy();
        expect(res.mfa_required).toBeFalsy();
        expect(res.mfa_enrollment_required).toBeFalsy();

        const newUser = await userRepo.findByEmail(email);
        expect(newUser, 'new user row should exist').toBeTruthy();
        if (newUser) created.userIds.push(newUser.id);
    }, 15_000);

    it('D (regression): existing non-MFA user gets a full token pair', async () => {
        const user = await db.User.create({
            email: EMAIL('plain'), password_hash: await password.hash(PLAIN_PW),
            full_name: 'Plain User', status: 'active', mfa_required: false, mfa_enabled: false,
        });
        created.userIds.push(user.id);

        const org = await orgRepo.createWithProfile({ name: `Inv D ${SUFFIX}`, slug: SLUG('d'), type: 'buyer', status: 'active' });
        created.orgIds.push(org.id);

        const token = await makeInvite(org.id, user.email);
        const res = await authService.acceptInvite({ token, email: user.email, password: PLAIN_PW, ipAddress: TEST_IP, userAgent: TEST_UA });

        expect(res.accessToken, 'non-MFA user should get an accessToken').toBeTruthy();
        expect(res.refreshToken).toBeTruthy();
        expect(res.mfa_required).toBeFalsy();
    }, 15_000);
});
