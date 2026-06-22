'use strict';
/**
 * Self-service signup → org + owner + subscription provisioning.
 *
 * A new public registration ALWAYS:
 *   1. creates a brand-new organization (the registrant is its OWNER),
 *   2. creates the owner user inside that org,
 *   3. records the owner membership,
 *   4. provisions a subscription for the chosen plan, and
 *   5. logs the user in (issues tokens; the controller sets the refresh cookie).
 *
 * Plans are all paid (Starter/Growth/Enterprise), so a paid plan is provisioned
 * as a 14-day TRIAL (immediate access) and the response flags `requiresPayment`
 * so the UI can route the user into checkout to convert trial → active. A $0 plan
 * (should one ever exist) is provisioned active immediately.
 *
 * SECURITY: role and orgId are NEVER taken from the request — the registrant is
 * forced to `owner` of the new org. The register schema also strips unknown keys.
 */
const crypto = require('crypto');
const store = require('./platformStore');
const userService = require('./userService');
const authService = require('./authService');
const billingService = require('./billingService');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { generateToken } = require('../utils/crypto');

const DEFAULT_PLAN_SLUG = 'starter';
const TRIAL_DAYS = 14;

// Bound slug input length before regex processing to prevent polynomial ReDoS
// on attacker-controlled fields (orgName/fullName/email). The final output is
// still sliced to 40 chars; this just caps regex work to a constant.
const SLUG_INPUT_MAX = 256;

const slugify = (value) =>
  String(value || '')
    .slice(0, SLUG_INPUT_MAX)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';

// Resolve the requested plan slug to a real plan record, falling back to the
// default/cheapest plan so signup never fails just because of a bad/empty slug.
const resolvePlan = async (planSlug) => {
  const plans = await billingService.getPlans();
  if (!plans.length) return null;
  const wanted = String(planSlug || '').toLowerCase();
  return (
    plans.find((p) => p.slug === wanted) ||
    plans.find((p) => p.slug === DEFAULT_PLAN_SLUG) ||
    plans.slice().sort((a, b) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0]
  );
};

const registerOrg = async (
  { email, password, fullName, orgName, plan: planSlug } = {},
  { ipAddress, userAgent } = {}
) => {
  // 1. Reject duplicate accounts up front (createUser also guards as a backstop).
  const existing = await store.findUserByEmail(email);
  if (existing) {
    throw new AppError('USER_EXISTS', 'An account with this email already exists', 409);
  }

  // 2. Resolve the chosen plan.
  const planRecord = await resolvePlan(planSlug);
  const isPayg = !!(planRecord && planRecord.slug === 'pay-as-you-go');
  // PAYG has no monthly fee but still routes to checkout to buy prepaid credit;
  // tiered plans route to checkout only when they cost money.
  const requiresPayment = isPayg || !!(planRecord && Number(planRecord.monthlyPrice) > 0);
  const billingMode = isPayg ? 'credit' : 'subscription';

  // 3-6. Provision org + owner user + membership + subscription ATOMICALLY. A
  // partial failure must never leave an orphaned org/user behind, so all writes
  // run in one transaction that rolls back together on any error.
  const orgDisplayName =
    (orgName && orgName.trim()) ||
    (fullName ? `${fullName.split(' ')[0]}'s Workspace` : 'My Workspace');
  const now = new Date();
  const periodEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  let org;
  let user;
  let subscription = null;
  await db.sequelize.transaction(async (t) => {
    org = await store.insert('organizations', {
      slug: `${slugify(orgName || fullName || email.split('@')[0])}-${generateToken(4)}`,
      name: orgDisplayName,
      status: 'active',
      planSlug: planRecord ? planRecord.slug : DEFAULT_PLAN_SLUG,
      bandwidthLimitGb: planRecord ? planRecord.bandwidthLimitGb : 0,
    }, { transaction: t });
    if (!org || !org.id) {
      throw new AppError('ORG_CREATE_FAILED', 'Could not create your workspace', 500);
    }

    user = await userService.createUser({
      email,
      password,
      name: fullName,
      orgId: org.id,
      role: 'owner',
      status: 'active',
    }, { transaction: t });

    await store.insert('orgMemberships', {
      orgId: org.id,
      userId: user.id,
      role: 'owner',
      status: 'active',
    }, { transaction: t });

    if (planRecord) {
      subscription = await store.insert('subscriptions', {
        orgId: org.id,
        userId: user.id,
        planId: planRecord.id,
        planSlug: planRecord.slug,
        // PAYG is active immediately ($0/mo, pay via prepaid credit); paid tiers
        // start as a trial until checkout converts them.
        status: (requiresPayment && !isPayg) ? 'trialing' : 'active',
        enforcementMode: 'pay-as-you-go',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
      }, { transaction: t });
    }
  });

  authService.issueEvent('org.created', org.id, {
    orgId: org.id,
    ownerUserId: user.id,
    planSlug: org.planSlug,
  });
  authService.issueEvent('user.registered', org.id, { userId: user.id, email: user.email });

  // 7. Log the new owner in (issues access + rotating refresh token + session).
  const session = await authService.login({ email, password, ipAddress, userAgent });

  return {
    token: session.token,
    refreshToken: session.refreshToken,
    user: session.user,
    org: { id: org.id, name: org.name, slug: org.slug },
    plan: planRecord
      ? { slug: planRecord.slug, name: planRecord.name, monthlyPrice: planRecord.monthlyPrice }
      : null,
    subscription: subscription
      ? { status: subscription.status, planSlug: subscription.planSlug }
      : null,
    requiresPayment,
    billingMode,
  };
};

/**
 * Provision a brand-new account for a social login (Google / GitHub) user. Mirrors
 * registerOrg's org + owner + subscription provisioning, but PASSWORDLESS: the user is
 * created with an unusable `oauth:`-prefixed placeholder hash (so password login can
 * never match) and email_verified_at stamped (the provider already verified it).
 *
 * Unlike registerOrg this does NOT issue tokens — the caller (oauthController) mints the
 * session via ssoService.completeLogin so OAuth/SAML/OIDC all share one session path.
 * Returns { user, org }.
 */
const provisionOAuthAccount = async (
  { email, fullName, avatarUrl, provider, providerUserId } = {},
  /* ctx (ipAddress/userAgent) is accepted for symmetry; session minting happens upstream */
) => {
  const normEmail = String(email || '').toLowerCase().trim();
  if (!normEmail) throw new AppError('OAUTH_NO_EMAIL', 'Email is required to create an account', 400);

  // Duplicate guard (the unique email/identity indexes are the real backstop).
  const existing = await store.findUserByEmail(normEmail);
  if (existing) throw new AppError('USER_EXISTS', 'An account with this email already exists', 409);

  const planRecord = await resolvePlan(null); // default plan, same as email/password signup
  const isPayg = !!(planRecord && planRecord.slug === 'pay-as-you-go');
  const requiresPayment = isPayg || !!(planRecord && Number(planRecord.monthlyPrice) > 0);

  const orgDisplayName = fullName ? `${fullName.split(' ')[0]}'s Workspace` : 'My Workspace';
  const now = new Date();
  const periodEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  let org;
  let user;
  await db.sequelize.transaction(async (t) => {
    org = await store.insert('organizations', {
      slug: `${slugify(fullName || normEmail.split('@')[0])}-${generateToken(4)}`,
      name: orgDisplayName,
      status: 'active',
      planSlug: planRecord ? planRecord.slug : DEFAULT_PLAN_SLUG,
      bandwidthLimitGb: planRecord ? planRecord.bandwidthLimitGb : 0,
    }, { transaction: t });
    if (!org || !org.id) {
      throw new AppError('ORG_CREATE_FAILED', 'Could not create your workspace', 500);
    }

    // Passwordless social account — unusable placeholder hash (mirrors SSO JIT provisioning).
    user = await db.users.create({
      org_id: org.id,
      email: normEmail,
      full_name: fullName || normEmail.split('@')[0],
      role: 'owner',
      status: 'active',
      password_hash: 'oauth:' + crypto.randomBytes(24).toString('hex'),
      oauth_provider: provider,
      oauth_provider_id: providerUserId,
      avatar_url: avatarUrl || null,
      email_verified_at: now,
    }, { transaction: t });

    await store.insert('orgMemberships', {
      orgId: org.id,
      userId: user.id,
      role: 'owner',
      status: 'active',
    }, { transaction: t });

    if (planRecord) {
      await store.insert('subscriptions', {
        orgId: org.id,
        userId: user.id,
        planId: planRecord.id,
        planSlug: planRecord.slug,
        status: (requiresPayment && !isPayg) ? 'trialing' : 'active',
        enforcementMode: 'pay-as-you-go',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
      }, { transaction: t });
    }
  });

  authService.issueEvent('org.created', org.id, { orgId: org.id, ownerUserId: user.id, planSlug: org.planSlug });
  authService.issueEvent('user.registered', org.id, { userId: user.id, email: normEmail });

  return { user, org };
};

module.exports = { registerOrg, provisionOAuthAccount, resolvePlan, slugify };
