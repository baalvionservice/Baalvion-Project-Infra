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
const store = require('./platformStore');
const userService = require('./userService');
const authService = require('./authService');
const billingService = require('./billingService');
const { AppError } = require('../utils/errors');
const { generateToken } = require('../utils/crypto');

const DEFAULT_PLAN_SLUG = 'starter';
const TRIAL_DAYS = 14;

const slugify = (value) =>
  String(value || '')
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
  const requiresPayment = !!(planRecord && Number(planRecord.monthlyPrice) > 0);

  // 3. Create the organization (unique slug — random suffix avoids collisions).
  const orgDisplayName =
    (orgName && orgName.trim()) ||
    (fullName ? `${fullName.split(' ')[0]}'s Workspace` : 'My Workspace');
  const org = await store.insert('organizations', {
    slug: `${slugify(orgName || fullName || email.split('@')[0])}-${generateToken(4)}`,
    name: orgDisplayName,
    status: 'active',
    planSlug: planRecord ? planRecord.slug : DEFAULT_PLAN_SLUG,
    bandwidthLimitGb: planRecord ? planRecord.bandwidthLimitGb : 0,
  });
  if (!org || !org.id) {
    throw new AppError('ORG_CREATE_FAILED', 'Could not create your workspace', 500);
  }

  // 4. Create the owner user inside the new org (role/orgId are set by us, not the client).
  const user = await userService.createUser({
    email,
    password,
    name: fullName,
    orgId: org.id,
    role: 'owner',
    status: 'active',
  });

  // 5. Record the owner membership.
  await store.insert('orgMemberships', {
    orgId: org.id,
    userId: user.id,
    role: 'owner',
    status: 'active',
  });

  // 6. Provision the subscription for the chosen plan.
  let subscription = null;
  if (planRecord) {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    subscription = await store.insert('subscriptions', {
      orgId: org.id,
      userId: user.id,
      planId: planRecord.id,
      planSlug: planRecord.slug,
      status: requiresPayment ? 'trialing' : 'active',
      enforcementMode: 'pay-as-you-go',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
    });
  }

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
  };
};

module.exports = { registerOrg, resolvePlan, slugify };
