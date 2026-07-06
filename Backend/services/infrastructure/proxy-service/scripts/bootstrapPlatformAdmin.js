'use strict';
/**
 * Idempotent platform-admin bootstrap for proxy-service (BaalvionStack).
 *
 * proxy.baalvionstack.com authenticates against proxy-service's OWN user store
 * (public.users) — NOT the identity auth-service. The /admin console is gated by
 * requirePlatformAdmin (middleware/permissionMiddleware.js) which admits
 * role ∈ {platform_admin, super_admin}. We provision `platform_admin` because that
 * role expands to ['*'] in service/rbac.js (super_admin expands to [] → no perms).
 *
 * Creates (or repairs) exactly one platform-admin user attached to a dedicated
 * 'baalvion-platform' org, with a bcrypt password hash (login rejects non-$2 hashes).
 *
 *   Email:    superadmin@baalvion.com   (override: SUPERADMIN_EMAIL)
 *   Password: REQUIRED via SUPERADMIN_PASSWORD (no default is shipped — fail closed)
 *
 * Idempotent + production-safe: run it on every deploy. Unlike seeders/devSeed.js
 * (which refuses to run in production) this is the ONE account that must exist in prod.
 *
 * Usage:  node scripts/bootstrapPlatformAdmin.js
 */
const bcrypt = require('bcrypt');
const db = require('../models');

const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);
const ORG_SLUG = 'baalvion-platform';
const ORG_NAME = 'Baalvion Platform';

async function main() {
  if (!PW) {
    console.error('Refusing to bootstrap: set SUPERADMIN_PASSWORD (no default password is shipped).');
    process.exit(1);
  }

  // 1 — dedicated platform org (find-or-create; slug is unique).
  let org = await db.organizations.findOne({ where: { slug: ORG_SLUG } });
  if (!org) {
    org = await db.organizations.create({
      slug: ORG_SLUG,
      name: ORG_NAME,
      status: 'active',
      plan_slug: 'enterprise',
    });
  }

  // 2 — platform-admin user (idempotent on unique email).
  const hash = await bcrypt.hash(PW, ROUNDS);
  const patch = {
    password_hash: hash,
    role: 'platform_admin',
    status: 'active',
    org_id: org.id,
    email_verified_at: new Date(),
  };

  let user = await db.users.findOne({ where: { email: EMAIL } });
  if (user) {
    await user.update(patch);
  } else {
    user = await db.users.create({ email: EMAIL, full_name: 'Platform Super Admin', ...patch });
  }

  console.log(JSON.stringify({
    ok: true,
    userId: String(user.id),
    orgId: org.id,
    email: EMAIL,
    role: 'platform_admin',
    note: 'Login at proxy.baalvionstack.com; token carries roles:["platform_admin"], permissions:["*"].',
  }, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error('bootstrap failed:', e.message); process.exit(1); });
